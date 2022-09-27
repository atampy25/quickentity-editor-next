use serde_json::{Value as JsonValue, json};
use tauri::{
	api::ipc::{format_callback, CallbackFn},
	plugin::Plugin,
	AppHandle, Invoke, Manager, Runtime, State, Window,
};
use tokio::{net::UdpSocket, sync::Mutex};

use std::{collections::HashMap, net::SocketAddr, sync::Arc};

type Id = u32;

#[derive(Default)]
struct ConnectionManager(Mutex<HashMap<Id, Arc<UdpSocket>>>);

#[tauri::command]
fn bind<R: Runtime>(window: Window<R>, address: String, callback_function: CallbackFn) -> Id {
	let id = rand::random();

	tauri::async_runtime::spawn(async move {
		let rx = Arc::new(
			UdpSocket::bind(address.parse::<SocketAddr>().unwrap())
				.await
				.expect("Failed to bind to our UDP socket"),
		);

		let tx = rx.clone();

		let manager = window.state::<ConnectionManager>();

		manager.0.lock().await.insert(id, tx);

		tokio::spawn(async move {
			loop {
				let mut buf = [0; 1024];
				let (_, addr) = rx.recv_from(&mut buf).await.unwrap();
				let js = format_callback(
					callback_function,
					&json!({
						"datagram": std::str::from_utf8(&buf).expect("Received a datagram which was not a valid string").trim_matches(char::from(0)),
						"address": addr
					})
				)
				.expect("unable to serialize udp message");
				let _ = window.clone().eval(js.as_str());
			}
		});
	});

	id
}

#[tauri::command]
async fn send(manager: State<'_, ConnectionManager>, id: Id, address: String, message: String) -> Result<(), ()> {
	if let Some(tx) = manager.0.lock().await.get_mut(&id) {
		tx.send_to(message.as_bytes(), address.parse::<SocketAddr>().unwrap())
			.await
			.expect("Couldn't send message to UDP socket");
	}

	Ok(())
}

pub struct TauriUDPSocket<R: Runtime> {
	invoke_handler: Box<dyn Fn(Invoke<R>) + Send + Sync>,
}

impl<R: Runtime> Default for TauriUDPSocket<R> {
	fn default() -> Self {
		Self {
			invoke_handler: Box::new(tauri::generate_handler![bind, send]),
		}
	}
}

impl<R: Runtime> Plugin<R> for TauriUDPSocket<R> {
	fn name(&self) -> &'static str {
		"udp"
	}

	fn initialize(&mut self, app: &AppHandle<R>, _config: JsonValue) -> tauri::plugin::Result<()> {
		app.manage(ConnectionManager::default());
		Ok(())
	}

	fn extend_api(&mut self, invoke: Invoke<R>) {
		(self.invoke_handler)(invoke)
	}
}
