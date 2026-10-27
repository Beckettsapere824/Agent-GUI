use serde::Serialize;
use std::fs;
use std::io::Write;
use std::path::{Path, PathBuf};
use std::process::Command;
use std::time::Instant;

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
        if let Some(dir) = cwd {
            c.current_dir(dir);
        }
        c.output()
    };
    #[cfg(not(target_os = "windows"))]
    let output = {
        let mut c = Command::new("sh");
        c.args(["-c", &cmd]);
        if let Some(dir) = cwd {
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
            save_project_blob,
            load_project_blob,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
