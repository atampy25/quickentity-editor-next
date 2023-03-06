use bincode::Options;
use serde_json::json;
use std::{
	io,
	net::SocketAddr,
	sync::{
		atomic::{AtomicBool, Ordering},
		Arc,
	},
};
use tauri::{
	api::ipc::{format_callback, CallbackFn},
	plugin::{Builder, TauriPlugin},
	Manager, Runtime, State, Window,
};
use tokio::net::UdpSocket;
use tokio::sync::Mutex;

use crate::sdk_editor_plugin::domain::*;

mod domain;

struct SdkEditor {
	initialized: AtomicBool,
	js_msg_callback: Mutex<Option<CallbackFn>>,
	client_addr: Mutex<Option<SocketAddr>>,
	server_sock: Mutex<Option<Arc<UdpSocket>>>,
}

impl Default for SdkEditor {
	fn default() -> Self {
		Self {
			initialized: AtomicBool::new(false),
			js_msg_callback: Mutex::new(None),
			client_addr: Mutex::new(None),
			server_sock: Mutex::new(None),
		}
	}
}

fn bincode_options() -> impl Options {
	return bincode::DefaultOptions::new()
		.with_native_endian()
		.with_fixint_encoding()
		.with_limit(65535)
		.reject_trailing_bytes();
}

async fn read_and_process_packet<R: Runtime>(
	socket: &UdpSocket,
	window: Window<R>,
) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
	// UDP packets can be up to 65535 bytes long.
	let mut buf = vec![0; 65535];

	// Read incoming UDP packet and try to deserialize into a SdkToQnMessage.
	let (read_bytes, source_addr) = socket.recv_from(&mut buf).await?;
	let msg = bincode_options().deserialize::<SdkToQnMessage>(&buf[..read_bytes])?;

	println!(
		"Received SDK Editor message from {}: {:?}",
		source_addr, msg
	);

	let state = window.state::<SdkEditor>();

	// On hello messages check for protocol version and return an error if it doesn't match.
	// If it does, store the client address so we can send requests to it.
	if let SdkToQnMessage::Hello { protocol_version } = msg {
		if protocol_version != PROTOCOL_VERSION {
			return Err(Box::new(io::Error::new(
				io::ErrorKind::Other,
				format!(
					"SDK Editor protocol version mismatch. Expected {}, got {}.",
					PROTOCOL_VERSION, protocol_version
				),
			)));
		}

		// Update the client address.
		state.client_addr.lock().await.replace(source_addr);
		println!("Received SDK Editor hello from {}.", source_addr);

		// Send hello back to the SDK Editor mod so it knows we're alive.
		let hello_msg = QnToSdkMessage::Hello {
			protocol_version: PROTOCOL_VERSION,
		};

		let hello_buf = bincode_options().serialize(&hello_msg)?;
		socket.send_to(&hello_buf, source_addr).await?;
	}

	// Convert to json and send to JS.
	let js_callback = state.js_msg_callback.lock().await;

	if let Some(js_callback) = *js_callback {
		let formatted_js_callback = format_callback(js_callback, &json!(msg))?;
		window.eval(formatted_js_callback.as_str())?;
	}

	Ok(())
}

// All async tauri command functions need to return Result<_, _> because of a bug in Tauri.
// See: https://github.com/tauri-apps/tauri/issues/2533

#[tauri::command]
async fn init<R: Runtime>(state: State<'_, SdkEditor>, window: Window<R>) -> Result<(), String> {
	// If initialized is set to false, set it true. This method returns the
	// previous value of initialized, so if it was already true, we don't
	// need to initialize again.
	let was_initialized =
		match state
			.initialized
			.compare_exchange(false, true, Ordering::SeqCst, Ordering::SeqCst)
		{
			Err(initialized) => initialized,
			Ok(initialized) => initialized,
		};

	if was_initialized {
		return Err("SDK Editor plugin has already been initialized.".to_string());
	}

	// Start listening for UDP packets.
	let addr = "127.0.0.1:49494";
	let socket = UdpSocket::bind(addr)
		.await
		.map_err(|e| format!("Failed to bind SDK Editor plugin UDP socket: {}", e))?;

	// Store the socket in the state so we can use it to later send messages back to the SDK Editor.
	let socket = Arc::new(socket);
	state.server_sock.lock().await.replace(socket.clone());

	println!("Listening for SDK Editor messages on {}...", addr);

	tokio::spawn(async move {
		// Loop forever, processing incoming packets.
		loop {
			if let Err(e) = read_and_process_packet(socket.as_ref(), window.clone()).await {
				println!("Could not process incoming packet: {}", e);

				// Reset the client address to None on error.
				window
					.clone()
					.state::<SdkEditor>()
					.client_addr
					.lock()
					.await
					.take();
			}
		}
	});

	Ok(())
}

#[tauri::command]
async fn set_message_callback(
	state: State<'_, SdkEditor>,
	callback_function: CallbackFn,
) -> Result<(), ()> {
	state
		.js_msg_callback
		.lock()
		.await
		.replace(callback_function);
	Ok(())
}

#[tauri::command]
async fn send_message(state: State<'_, SdkEditor>, msg: QnToSdkMessage) -> Result<(), String> {
	// Check if the server socket and the editor address are set.
	// The latter will only be set after a hello message is received from the SDK Editor mod.
	let server_sock = state
		.server_sock
		.lock()
		.await
		.as_ref()
		.ok_or_else(|| {
			"SDK Editor plugin has not been initialized. Call init() first.".to_string()
		})?
		.clone();

	let editor_addr = state
		.client_addr
		.lock()
		.await
		.ok_or_else(|| "SDK Editor mod has not connected to QNE yet.".to_string())?;

	println!("Sending SDK Editor message to {}: {:?}", editor_addr, msg);

	// Serialize the message and send it to the editor.
	let serialized = bincode_options().serialize(&msg).unwrap();

	server_sock
		.send_to(&serialized, editor_addr)
		.await
		.map_err(|e| format!("Failed to send message to SDK Editor: {}", e))?;

	Ok(())
}

pub fn init_plugin<R: Runtime>() -> TauriPlugin<R> {
	Builder::new("sdk_editor")
		.invoke_handler(tauri::generate_handler![
			init,
			set_message_callback,
			send_message
		])
		.setup(|app_handle| {
			app_handle.manage(SdkEditor::default());
			Ok(())
		})
		.build()
}
