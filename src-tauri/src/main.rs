#![cfg_attr(
	all(not(debug_assertions), target_os = "windows"),
	windows_subsystem = "windows"
)]

mod sdk_editor_plugin;
mod udp;

use udp::TauriUDPSocket;

fn main() {
	tauri::Builder::default()
		.plugin(TauriUDPSocket::default())
		.plugin(sdk_editor_plugin::init_plugin())
		.run(tauri::generate_context!())
		.expect("error while running tauri application");
}
