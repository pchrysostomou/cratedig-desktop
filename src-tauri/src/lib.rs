use std::path::PathBuf;
use std::process::{Child, Command, Stdio};
use std::sync::Mutex;

use tauri::Manager;

/// Holds the spawned Python sidecar so it can be terminated on exit (Phase 6c).
pub struct BackendProcess(pub Mutex<Option<Child>>);

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }
      if let Err(err) = spawn_backend(app) {
        // Don't crash the window; the /health splash stays until the backend answers.
        log::error!("failed to start backend sidecar: {err}");
      }
      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}

/// Resolve the bundled onedir sidecar exe across dev / bundled resource layouts.
fn resolve_sidecar(app: &tauri::App) -> Result<PathBuf, Box<dyn std::error::Error>> {
  let resource_dir = app.path().resource_dir()?;
  let exe = if cfg!(windows) {
    "cratedig-sidecar.exe"
  } else {
    "cratedig-sidecar"
  };
  let candidates = [
    resource_dir.join("cratedig-sidecar").join(exe),
    resource_dir.join("binaries").join("cratedig-sidecar").join(exe),
    resource_dir.join("resources").join("cratedig-sidecar").join(exe),
  ];
  for candidate in candidates.iter() {
    if candidate.exists() {
      return Ok(candidate.clone());
    }
  }
  Err(format!("sidecar exe not found; looked in {candidates:?}").into())
}

/// Start the bundled FastAPI sidecar (the backend) as a child process.
fn spawn_backend(app: &tauri::App) -> Result<(), Box<dyn std::error::Error>> {
  let exe = resolve_sidecar(app)?;
  log::info!("starting backend sidecar: {}", exe.display());

  let mut command = Command::new(&exe);
  command.env("PYTHONUTF8", "1").env("PYTHONIOENCODING", "utf-8");

  if cfg!(debug_assertions) {
    command.stdout(Stdio::inherit()).stderr(Stdio::inherit());
  } else {
    command.stdout(Stdio::null()).stderr(Stdio::null());
  }

  // Don't pop a console window for the console-subsystem sidecar exe (Windows).
  #[cfg(windows)]
  {
    use std::os::windows::process::CommandExt;
    const CREATE_NO_WINDOW: u32 = 0x0800_0000;
    command.creation_flags(CREATE_NO_WINDOW);
  }

  let child = command.spawn()?;
  app.manage(BackendProcess(Mutex::new(Some(child))));
  Ok(())
}
