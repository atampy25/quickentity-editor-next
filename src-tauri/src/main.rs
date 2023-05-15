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
	match app_handle.path_resolver().app_dir() {
		Some(dir) => match fs::remove_dir_all(dir) {
			Ok(_) => Ok(()),
			Err(err) => match err.kind() {
				std::io::ErrorKind::NotFound => Ok(()),
				_ => Err(err.to_string()),
			},
		},
		None => Err("Couldn't get cache directory.".into()),
	}
}

fn main() {
	tauri::Builder::default()
		.invoke_handler(tauri::generate_handler![clear_cache])
		.plugin(TauriUDPSocket::default())
		.run(tauri::generate_context!())
		.expect("error while running tauri application");
}
