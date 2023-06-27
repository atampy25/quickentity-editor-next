#![cfg_attr(
	all(not(debug_assertions), target_os = "windows"),
	windows_subsystem = "windows"
)]

mod communications;
mod messages;

use communications::{udp_bind, udp_kill, udp_send, ConnectionManager};
use specta::{
	export::ts_with_cfg,
	ts::{BigIntExportBehavior, ExportConfiguration},
};
use tauri::{generate_handler, Manager};

fn main() {
	#[cfg(debug_assertions)]
	ts_with_cfg(
		"../src/lib/rs-types.ts",
		&ExportConfiguration::default().bigint(BigIntExportBehavior::String),
	)
	.unwrap();

	tauri::Builder::default()
		.plugin(tauri_plugin_fs_watch::init())
		.invoke_handler(generate_handler![udp_bind, udp_send, udp_kill])
		.setup(|app_handle| {
			app_handle.manage(ConnectionManager::default());
			Ok(())
		})
		.run(tauri::generate_context!())
		.expect("error while running tauri application");
}
