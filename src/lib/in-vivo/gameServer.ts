import type { Entity, Property, SubEntity } from "$lib/quickentity-types"

import Decimal from "decimal.js"
import WebSocket, { type Message } from "tauri-plugin-websocket-api"
import { addNotification } from "$lib/stores"
import { invoke } from "@tauri-apps/api"
import json from "$lib/json"
import { normaliseToHash } from "$lib/utils"
import { v4 } from "uuid"

class GameServer {
	active = false
	socket: WebSocket | null

	listeners: Record<string, (arg: Message) => unknown> = {}

	entityTreeLoaded = false

	constructor() {
		this.socket = null
	}

	async connect() {
		if (this.socket) {
			await this.socket.disconnect()
		} else {
			this.socket = await WebSocket.connect("ws://localhost:46735")

			this.socket.addListener((x) => {
				void (async () => {
					if (x.type === "Close") {
						console.log(`WebSocket disconnected with code ${x.data?.code}, reason ${x.data?.reason}`)

						await this.socket?.disconnect()
						this.socket = null
					} else if (x.type === "Text") {
						const data = JSON.parse(x.data) as EditorEvent
						console.log("Received message", data)

						if (data.type === "error") {
							addNotification.set({
								kind: "error",
								title: "Error in game connection",
								subtitle: data.message
							})
						} else if (data.type === "entityTreeRebuilt") {
							this.entityTreeLoaded = true
						} else if (data.type === "sceneClearing" || data.type === "sceneLoading") {
							this.entityTreeLoaded = false
						}
					}
				})()
			})

			this.socket.addListener((x) => {
				for (const listener of Object.values(this.listeners)) {
					listener(x)
				}
			})

			await this.sendRequest({ type: "hello", identifier: "QuickEntity Editor" })
			await this.waitForEvent((evt) => evt.type === "welcome")

			this.active = true
		}
	}

	async disconnect() {
		if (this.socket) {
			this.active = false

			try {
				await this.socket.disconnect()
			} catch {}

			this.socket = null
		}
	}

	async sendRequest(msg: EditorRequest) {
		if (!this.entityTreeLoaded) {
			console.log("Entity tree not yet built, sending request to editor")

			await this.socket?.send(json.stringify({ type: "rebuildEntityTree" }))
			await this.waitForEvent((evt) => evt.type === "entityTreeRebuilt")
		}

		console.log("Sending message to editor", msg)
		await this.socket?.send(json.stringify(msg))
	}

	waitForEvent(check: (evt: EditorEvent) => boolean): Promise<EditorEvent> {
		return new Promise((resolve) => {
			void this.addListener(`waitForEvent-${v4()}`, (evt) => {
				if (check(evt)) {
					resolve(evt)
				}
			})
		})
	}

	async addListener(id: string, cb: (evt: EditorEvent) => unknown) {
		if (!this.listeners[id]) {
			this.listeners[id] = (x) => {
				if (x.type === "Text") {
					cb(json.parse(x.data) as EditorEvent)
				}
			}
		}
	}

	async removeListener(id: string) {
		if (this.listeners[id]) {
			delete this.listeners[id]
		}
	}

	async selectEntity(subEntityID: string, entity: Entity) {
		await this.sendRequest({
			type: "selectEntity",
			entity: {
				id: subEntityID,
				tblu: entity.tbluHash as ResourceId
			}
		})
	}

	async getPlayerTransform(): Promise<{
		rotation: { x: Decimal; y: Decimal; z: Decimal }
		position: { x: Decimal; y: Decimal; z: Decimal }
		scale?: { x: Decimal; y: Decimal; z: Decimal }
	}> {
		await this.sendRequest({ type: "getHitmanEntity" })
		const hitmanEntity = (await this.waitForEvent((evt) => evt.type === "hitmanEntity")) as EditorEvents.HitmanEntityResponse

		if (hitmanEntity.entity.transform) {
			const newTransform: any = {
				rotation: {
					x: hitmanEntity.entity.transform.rotation.roll,
					y: hitmanEntity.entity.transform.rotation.pitch,
					z: hitmanEntity.entity.transform.rotation.yaw
				},
				position: hitmanEntity.entity.transform.position,
				scale: hitmanEntity.entity.transform.scale
			}

			if (+newTransform.scale.x == Math.round(+newTransform.scale.x * 100) / 100) {
				if (+newTransform.scale.y == Math.round(+newTransform.scale.y * 100) / 100) {
					if (+newTransform.scale.z == Math.round(+newTransform.scale.z * 100) / 100) {
						delete newTransform.scale
					}
				}
			}

			return newTransform
		}

		return null!
	}

	async updateProperty(id: string, tblu: string, property: string, value: Property) {
		const convertedPropertyValue = await invoke("convert_property_value_to_rt", { value: json.stringify(value) })

		await this.sendRequest({
			type: "setEntityProperty",
			entity: {
				id,
				tblu: tblu as ResourceId
			},
			// @ts-expect-error TS does not like type coercion
			property: !isNaN(property) && !isNaN(parseFloat(property)) ? Number(property) : property,
			value: convertedPropertyValue
		})
	}

	async setTransform(
		id: string,
		tblu: string,
		value: {
			rotation: { x: number; y: number; z: number }
			position: { x: number; y: number; z: number }
			scale?: { x: number; y: number; z: number }
		},
		relative: boolean
	) {
		await this.sendRequest({
			type: "setEntityTransform",
			entity: {
				id,
				tblu: tblu as ResourceId
			},
			transform: {
				position: value.position,
				scale: value.scale || { x: 1, y: 1, z: 1 },
				rotation: {
					roll: value.rotation.x,
					pitch: value.rotation.y,
					yaw: value.rotation.z
				}
			},
			relative
		})
	}
}

export const gameServer = new GameServer()
