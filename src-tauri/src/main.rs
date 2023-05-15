#![cfg_attr(
	all(not(debug_assertions), target_os = "windows"),
	windows_subsystem = "windows"
)]

mod udp;

use std::fs;

use tauri::AppHandle;
use udp::TauriUDPSocket;

#[tauri::command]
fn clear_cache(app_handle: AppHandle) -> Result<(), String> {
	match fs::remove_dir_all(
		app_handle
			.path_resolver()
			.app_dir()
			.expect("failed to get app cache path")
	) {
		Ok(_) => Ok(()),
		Err(err) => match err.kind() {
			std::io::ErrorKind::NotFound => Ok(()),
			_ => Err(err.to_string())
		}
	}
}

fn main() {
	tauri::Builder::default()
		.invoke_handler(tauri::generate_handler![clear_cache])
		.plugin(TauriUDPSocket::default())
		.run(tauri::generate_context!())
		.expect("error while running tauri application");
}
