use serde::Serialize;
use std::collections::HashMap;
use std::fs;
use std::io::{BufRead, BufReader, Write};
use std::path::{Path, PathBuf};
use std::process::{Child, Command, Stdio};
use std::sync::mpsc;
use std::sync::{Mutex, OnceLock};
use std::time::Instant;
use notify::{EventKind, RecommendedWatcher, RecursiveMode, Watcher};
use tauri::{AppHandle, Emitter};

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct HostInfo {
    kind: String,
    os: String,
    arch: String,
    cwd: String,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct DirEntry {
    name: String,
    path: String,
    kind: String,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct RunCommandResult {
    code: i32,
    stdout: String,
    stderr: String,
    duration_ms: u128,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct FileMeta {
    path: String,
    len: u64,
    modified_ms: Option<u64>,
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct StdioLineEvent {
    session_id: String,
    stream: String,
    line: String,
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct StdioEndEvent {
    session_id: String,
    code: i32,
    duration_ms: u128,
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct FsNativeEvent {
    watch_id: String,
    path: String,
    kind: String,
}

fn child_map() -> &'static Mutex<HashMap<String, Child>> {
    static MAP: OnceLock<Mutex<HashMap<String, Child>>> = OnceLock::new();
    MAP.get_or_init(|| Mutex::new(HashMap::new()))
}

fn watcher_map() -> &'static Mutex<HashMap<String, RecommendedWatcher>> {
    static MAP: OnceLock<Mutex<HashMap<String, RecommendedWatcher>>> = OnceLock::new();
    MAP.get_or_init(|| Mutex::new(HashMap::new()))
}

fn resolve_path(path: &str) -> PathBuf {
    let p = Path::new(path);
    if p.is_absolute() {
        p.to_path_buf()
    } else {
        std::env::current_dir()
            .unwrap_or_else(|_| PathBuf::from("."))
            .join(p)
    }
}

#[tauri::command]
fn host_info() -> HostInfo {
    HostInfo {
        kind: "tauri".into(),
        os: std::env::consts::OS.into(),
        arch: std::env::consts::ARCH.into(),
        cwd: std::env::current_dir()
            .map(|p| p.display().to_string())
            .unwrap_or_else(|_| ".".into()),
    }
}

#[tauri::command]
fn list_dir(path: String) -> Result<Vec<DirEntry>, String> {
    let dir = resolve_path(&path);
    let rd = fs::read_dir(&dir).map_err(|e| format!("list_dir {}: {}", dir.display(), e))?;
    let mut out = Vec::new();
    for entry in rd.flatten() {
        let meta = entry.metadata().ok();
        let is_dir = meta.as_ref().map(|m| m.is_dir()).unwrap_or(false);
        let name = entry.file_name().to_string_lossy().to_string();
        let full = entry.path();
        let path_str = if is_dir {
            format!("{}/{}", full.display().to_string().trim_end_matches('/'), "")
                .trim_end_matches('/')
                .to_string()
                + "/"
        } else {
            full.display().to_string()
        };
        let display_path = if path.ends_with('/') || path == "." || path.is_empty() {
            if path.is_empty() || path == "." {
                name.clone() + if is_dir { "/" } else { "" }
            } else {
                format!("{}{}{}", path.trim_end_matches('/'), "/", name) + if is_dir { "/" } else { "" }
            }
        } else {
            path_str
        };
        out.push(DirEntry {
            name,
            path: display_path,
            kind: if is_dir { "dir".into() } else { "file".into() },
        });
    }
    out.sort_by(|a, b| match (a.kind.as_str(), b.kind.as_str()) {
        ("dir", "file") => std::cmp::Ordering::Less,
        ("file", "dir") => std::cmp::Ordering::Greater,
        _ => a.name.cmp(&b.name),
    });
    Ok(out)
}

#[tauri::command]
fn read_text_file(path: String) -> Result<String, String> {
    let p = resolve_path(&path);
    fs::read_to_string(&p).map_err(|e| format!("read {}: {}", p.display(), e))
}

#[tauri::command]
fn file_meta(path: String) -> Result<FileMeta, String> {
    let p = resolve_path(&path);
    let meta = fs::metadata(&p).map_err(|e| format!("meta {}: {}", p.display(), e))?;
    let modified_ms = meta.modified().ok().and_then(|t| {
        t.duration_since(std::time::UNIX_EPOCH)
            .ok()
            .map(|d| d.as_millis() as u64)
    });
    Ok(FileMeta {
        path: p.display().to_string(),
        len: meta.len(),
        modified_ms,
    })
}

#[tauri::command]
fn write_text_file(path: String, content: String) -> Result<(), String> {
    let p = resolve_path(&path);
    if let Some(parent) = p.parent() {
        fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }
    let mut f = fs::File::create(&p).map_err(|e| format!("write {}: {}", p.display(), e))?;
    f.write_all(content.as_bytes())
        .map_err(|e| format!("write {}: {}", p.display(), e))
}

#[tauri::command]
fn run_command(cmd: String, cwd: Option<String>) -> Result<RunCommandResult, String> {
    let start = Instant::now();
    #[cfg(target_os = "windows")]
    let output = {
        let mut c = Command::new("cmd");
        c.args(["/C", &cmd]);
        if let Some(dir) = &cwd {
            c.current_dir(dir);
        }
        c.output()
    };
    #[cfg(not(target_os = "windows"))]
    let output = {
        let mut c = Command::new("sh");
        c.args(["-c", &cmd]);
        if let Some(dir) = &cwd {
            c.current_dir(dir);
        }
        c.output()
    };

    let output = output.map_err(|e| e.to_string())?;
    Ok(RunCommandResult {
        code: output.status.code().unwrap_or(-1),
        stdout: String::from_utf8_lossy(&output.stdout).to_string(),
        stderr: String::from_utf8_lossy(&output.stderr).to_string(),
        duration_ms: start.elapsed().as_millis(),
    })
}

#[tauri::command]
fn stream_command(
    app: AppHandle,
    session_id: String,
    cmd: String,
    cwd: Option<String>,
) -> Result<(), String> {
    let session_id_thread = session_id.clone();
    std::thread::spawn(move || {
        let start = Instant::now();

        let spawn_result = {
            #[cfg(target_os = "windows")]
            {
                let mut c = Command::new("cmd");
                c.args(["/C", &cmd])
                    .stdout(Stdio::piped())
                    .stderr(Stdio::piped());
                if let Some(dir) = &cwd {
                    c.current_dir(dir);
                }
                c.spawn()
            }
            #[cfg(not(target_os = "windows"))]
            {
                let mut c = Command::new("sh");
                c.args(["-c", &cmd])
                    .stdout(Stdio::piped())
                    .stderr(Stdio::piped());
                if let Some(dir) = &cwd {
                    c.current_dir(dir);
                }
                c.spawn()
            }
        };

        let mut child = match spawn_result {
            Ok(ch) => ch,
            Err(e) => {
                let _ = app.emit(
                    "agent-os://stdio-line",
                    StdioLineEvent {
                        session_id: session_id_thread.clone(),
                        stream: "stderr".into(),
                        line: e.to_string(),
                    },
                );
                let _ = app.emit(
                    "agent-os://stdio-end",
                    StdioEndEvent {
                        session_id: session_id_thread,
                        code: -1,
                        duration_ms: start.elapsed().as_millis(),
                    },
                );
                return;
            }
        };

        if let Some(out) = child.stdout.take() {
            let app2 = app.clone();
            let sid = session_id_thread.clone();
            std::thread::spawn(move || {
                let reader = BufReader::new(out);
                for line in reader.lines().flatten() {
                    let _ = app2.emit(
                        "agent-os://stdio-line",
                        StdioLineEvent {
                            session_id: sid.clone(),
                            stream: "stdout".into(),
                            line,
                        },
                    );
                }
            });
        }
        if let Some(err) = child.stderr.take() {
            let app2 = app.clone();
            let sid = session_id_thread.clone();
            std::thread::spawn(move || {
                let reader = BufReader::new(err);
                for line in reader.lines().flatten() {
                    let _ = app2.emit(
                        "agent-os://stdio-line",
                        StdioLineEvent {
                            session_id: sid.clone(),
                            stream: "stderr".into(),
                            line,
                        },
                    );
                }
            });
        }

        {
            let mut map = child_map().lock().unwrap();
            map.insert(session_id_thread.clone(), child);
        }

        loop {
            std::thread::sleep(std::time::Duration::from_millis(50));
            let mut map = child_map().lock().unwrap();
            let done = match map.get_mut(&session_id_thread) {
                Some(ch) => match ch.try_wait() {
                    Ok(Some(status)) => Some(status.code().unwrap_or(-1)),
                    Ok(None) => None,
                    Err(_) => Some(-1),
                },
                None => Some(-1),
            };
            if let Some(code) = done {
                map.remove(&session_id_thread);
                drop(map);
                let _ = app.emit(
                    "agent-os://stdio-end",
                    StdioEndEvent {
                        session_id: session_id_thread,
                        code,
                        duration_ms: start.elapsed().as_millis(),
                    },
                );
                break;
            }
        }
    });
    Ok(())
}

#[tauri::command]
fn kill_stream_command(session_id: String) -> Result<(), String> {
    let mut map = child_map().lock().map_err(|e| e.to_string())?;
    if let Some(mut child) = map.remove(&session_id) {
        let _ = child.kill();
        let _ = child.wait();
    }
    Ok(())
}

/// OS-level path watch via `notify`. Emits `agent-os://fs-event`.
#[tauri::command]
fn watch_path_native(app: AppHandle, path: String, watch_id: String) -> Result<(), String> {
    let path_buf = resolve_path(&path);
    let wid = watch_id.clone();
    let (tx, rx) = mpsc::channel();

    let mut watcher = RecommendedWatcher::new(
        move |res: Result<notify::Event, notify::Error>| {
            let _ = tx.send(res);
        },
        notify::Config::default(),
    )
    .map_err(|e| e.to_string())?;

    let mode = if path_buf.is_dir() {
        RecursiveMode::Recursive
    } else {
        RecursiveMode::NonRecursive
    };
    watcher
        .watch(&path_buf, mode)
        .map_err(|e| format!("watch {}: {}", path_buf.display(), e))?;

    {
        let mut map = watcher_map().lock().map_err(|e| e.to_string())?;
        map.insert(watch_id.clone(), watcher);
    }

    std::thread::spawn(move || {
        while let Ok(res) = rx.recv() {
            match res {
                Ok(event) => {
                    let kind = match event.kind {
                        EventKind::Create(_) => "create",
                        EventKind::Modify(_) => "modify",
                        EventKind::Remove(_) => "remove",
                        _ => "unknown",
                    };
                    for p in event.paths {
                        let _ = app.emit(
                            "agent-os://fs-event",
                            FsNativeEvent {
                                watch_id: wid.clone(),
                                path: p.display().to_string(),
                                kind: kind.into(),
                            },
                        );
                    }
                }
                Err(e) => {
                    let _ = app.emit(
                        "agent-os://fs-event",
                        FsNativeEvent {
                            watch_id: wid.clone(),
                            path: String::new(),
                            kind: format!("error:{}", e),
                        },
                    );
                }
            }
        }
    });
    Ok(())
}

#[tauri::command]
fn unwatch_path_native(watch_id: String) -> Result<(), String> {
    let mut map = watcher_map().lock().map_err(|e| e.to_string())?;
    map.remove(&watch_id);
    Ok(())
}

fn project_blob_path(key: &str) -> Result<PathBuf, String> {
    let base = dirs_next_data().ok_or_else(|| "no data dir".to_string())?;
    Ok(base.join("agent-os").join(format!("{}.json", key)))
}

fn dirs_next_data() -> Option<PathBuf> {
    std::env::var_os("HOME")
        .or_else(|| std::env::var_os("USERPROFILE"))
        .map(PathBuf::from)
        .map(|h| h.join(".agent-os"))
}

#[tauri::command]
fn save_project_blob(key: String, json: String) -> Result<(), String> {
    let path = project_blob_path(&key)?;
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }
    fs::write(&path, json).map_err(|e| e.to_string())
}

#[tauri::command]
fn load_project_blob(key: String) -> Result<Option<String>, String> {
    let path = project_blob_path(&key)?;
    if !path.exists() {
        return Ok(None);
    }
    fs::read_to_string(&path)
        .map(Some)
        .map_err(|e| e.to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            host_info,
            list_dir,
            read_text_file,
            file_meta,
            write_text_file,
            run_command,
            stream_command,
            kill_stream_command,
            watch_path_native,
            unwatch_path_native,
            save_project_blob,
            load_project_blob,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
