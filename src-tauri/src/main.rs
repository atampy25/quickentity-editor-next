#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

mod udp;
mod websockets;

use udp::TauriUDPSocket;
use websockets::TauriWebsocket;

fn main() {
    tauri::Builder::default()
        .plugin(TauriWebsocket::default())
        .plugin(TauriUDPSocket::default())
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
