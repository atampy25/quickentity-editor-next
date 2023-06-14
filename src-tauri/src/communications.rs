use bincode::Options;
use serde_json::{from_str, json};
use std::{collections::HashMap, net::SocketAddr, sync::Arc};
use tauri::{
	api::ipc::{format_callback, CallbackFn},
	Manager, Runtime, State, Window,
};
use tokio::{net::UdpSocket, sync::Mutex, task::JoinHandle};

use crate::messages::{ReceivedMessage, SentMessage};

fn get_bincode() -> impl Options {
	bincode::DefaultOptions::new()
		.with_native_endian()
		.with_fixint_encoding()
		.with_limit(65535)
		.reject_trailing_bytes()
}

#[derive(Default)]
pub struct ConnectionManager(Mutex<HashMap<u32, (Arc<UdpSocket>, JoinHandle<()>)>>);

#[tauri::command]
pub async fn udp_bind<R: Runtime>(
	window: Window<R>,
	address: String,
	callback_function: CallbackFn,
	kill_callback_function: CallbackFn,
) -> Result<u32, String> {
	let id: u32 = rand::random();

	let rx = Arc::new(
		UdpSocket::bind(address.parse::<SocketAddr>().unwrap())
			.await
			.map_err(|err| format!("Error in binding to own UDP socket: {err}"))?,
	);

	let tx = rx.clone();

	let manager = window.state::<ConnectionManager>();

	let window_ = window.clone();

	let handle = tokio::spawn(async move {
		loop {
			let mut buf = [0; 65535];
			if let Ok((bytes, addr)) = rx.recv_from(&mut buf).await {
				let js = format_callback(
					callback_function,
					&json!({
						"message": get_bincode()
										.deserialize::<ReceivedMessage>(&buf[..bytes])
										.expect("Unable to deserialise UDP message"),
						"address": addr
					}),
				)
				.expect("Unable to format callback");
				let _ = window_.eval(js.as_str());
			} else {
				let js = format_callback(kill_callback_function, &json!({}))
					.expect("Unable to call kill callback");
				let _ = window_.eval(js.as_str());
				return;
			}
		}
	});

	manager.0.lock().await.insert(id, (tx, handle));

	Ok(id)
}

#[tauri::command]
pub async fn udp_send(
	manager: State<'_, ConnectionManager>,
	id: u32,
	address: String,
	message: String,
) -> Result<(), ()> {
	if let Some((tx, _)) = manager.0.lock().await.get_mut(&id) {
		tx.send_to(
			&get_bincode()
				.serialize(
					&from_str::<SentMessage>(&message)
						.expect("Couldn't deserialise message to send"),
				)
				.expect("Couldn't serialise message to send"),
			address.parse::<SocketAddr>().unwrap(),
		)
		.await
		.expect("Couldn't send message to UDP socket");
	}

	Ok(())
}

#[tauri::command]
pub async fn udp_kill(manager: State<'_, ConnectionManager>, id: u32) -> Result<(), ()> {
	{
		let mut man = manager.0.lock().await;
		if let Some((_, handle)) = man.get_mut(&id) {
			handle.abort();
		}
	}

	manager.0.lock().await.remove(&id);

	Ok(())
}
