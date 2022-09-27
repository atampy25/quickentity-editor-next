import { invoke, transformCallback } from "@tauri-apps/api/tauri"

export default class UDPServer {
	id: number
	private listeners: Array<(data: { datagram: string; address: string }) => void>

	constructor(id: number, listeners: Array<(data: { datagram: string; address: string }) => void>) {
		this.id = id
		this.listeners = listeners
	}

	static async bind(address: string): Promise<UDPServer> {
		const listeners: Array<(data: { datagram: string; address: string }) => void> = []
		const handler = (data: { datagram: string; address: string }) => {
			listeners.forEach((l) => l(data))
		}

		return invoke<number>("plugin:udp|bind", {
			address,
			callbackFunction: transformCallback(handler)
		}).then((id) => new UDPServer(id, listeners))
	}

	addListener(cb: (data: { datagram: string; address: string }) => void) {
		this.listeners.push(cb)
	}

	send(address: string, message: string): Promise<void> {
		return invoke("plugin:udp|send", {
			id: this.id,
			message
		})
	}
}
