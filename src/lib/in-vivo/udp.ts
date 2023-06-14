import type { ReceivedMessage, SentMessage } from "$lib/rs-types"
import { invoke, transformCallback } from "@tauri-apps/api/tauri"

export default class UDPSocket {
	id: number
	private listeners: Array<(data: { message: ReceivedMessage; address: string }) => any>
	private onceListeners: Array<{ id: string; condition: (data: { message: ReceivedMessage; address: string }) => boolean; callback: (data: { message: ReceivedMessage; address: string }) => any }>

	constructor(
		id: number,
		listeners: Array<(data: { message: ReceivedMessage; address: string }) => any>,
		onceListeners: Array<{ id: string; condition: (data: { message: ReceivedMessage; address: string }) => boolean; callback: (data: { message: ReceivedMessage; address: string }) => any }>
	) {
		this.id = id
		this.listeners = listeners
		this.onceListeners = onceListeners
	}

	static async bind(address: string, killCallback: () => any): Promise<UDPSocket> {
		const listeners: Array<(data: { message: ReceivedMessage; address: string }) => any> = []
		const onceListeners: Array<{
			id: string
			condition: (data: { message: ReceivedMessage; address: string }) => boolean
			callback: (data: { message: ReceivedMessage; address: string }) => any
		}> = []
		const handler = (data: { message: ReceivedMessage; address: string }) => {
			listeners.forEach((l) => l(data))
			onceListeners.forEach(({ id, condition, callback }) => {
				if (condition(data)) {
					callback(data)
					onceListeners.splice(
						onceListeners.findIndex((l) => l.id != id),
						1
					)
				}
			})
		}

		return invoke<number>("udp_bind", {
			address,
			callbackFunction: transformCallback(handler),
			killCallbackFunction: transformCallback(killCallback)
		}).then((id) => new UDPSocket(id, listeners, onceListeners))
	}

	addListener(cb: (data: { message: ReceivedMessage; address: string }) => any) {
		this.listeners.push(cb)
	}

	once(id: string, condition: (data: { message: ReceivedMessage; address: string }) => boolean, callback: (data: { message: ReceivedMessage; address: string }) => any) {
		this.onceListeners.push({ id, condition, callback })
	}

	send(address: string, message: string): Promise<void> {
		console.log("Sending message", message, "to", address)

		return invoke("udp_send", {
			id: this.id,
			address,
			message
		})
	}

	kill(): Promise<void> {
		return invoke("udp_kill", {
			id: this.id
		})
	}
}
