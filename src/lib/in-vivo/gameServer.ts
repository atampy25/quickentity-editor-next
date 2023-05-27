import type { Entity, Property, SubEntity } from "$lib/quickentity-types"

import Decimal from "decimal.js"
import UDPSocket from "$lib/in-vivo/udp"
import { addNotification } from "$lib/stores"
import { normaliseToHash } from "$lib/utils"

class GameServer {
	// @ts-expect-error Client should be connected before use
	client: UDPSocket
	connected: boolean
	lastMessage: number
	lastAddress: string

	constructor() {
		this.connected = false
		this.lastMessage = 0
		this.lastAddress = null!
	}

	async start() {
		console.log("Binding UDP socket on localhost:49494")

		this.client = await UDPSocket.bind("127.0.0.1:49494", () => {
			void this.killAndRestart()
		})
		this.connected = true

		this.client.addListener(({ message, address }) => {
			console.log("Received message", JSON.stringify(message), "from", address)
			this.lastAddress = address

			if (Object.keys(message)[0] === "Hello") {
				if (Object.values(message)[0].protocol_version === 1) {
					void this.client.send(this.lastAddress, JSON.stringify({
						"Hello": {
							protocol_version: 1
						}
					}))
				} else {
					addNotification.set({
						kind: "error",
						title: "Version mismatch",
						subtitle: "Your SDK version is incompatible with QNE - update both and try again."
					})
				}
			}
		})
	}

	async kill() {
		console.log("Killing UDP socket")

		await this.client.kill()
		this.connected = false
	}

	async killAndRestart() {
		console.log("Killing and restarting UDP socket")
		await this.kill()

		this.lastMessage = 0
		this.lastAddress = null!

		await this.start()
	}

	async getPlayerPosition(): Promise<{ x: number; y: number; z: number }> {
		// await this.client.send(this.lastAddress, "GetPlayerPosition")
		// return await new Promise((resolve) =>
		// 	this.client.once(
		// 		`getPlayerPosition${Date.now()}`,
		// 		({ message }) => datagram.startsWith("PlayerPosition"),
		// 		({ message }) => resolve({ x: +datagram.split("_")[1], y: +datagram.split("_")[2], z: +datagram.split("_")[3] })
		// 	)
		// )
	}

	async getPlayerRotation(): Promise<{ x: number; y: number; z: number }> {
		// await this.client.send(this.lastAddress, "GetPlayerRotation")
		// return await new Promise((resolve) =>
		// 	this.client.once(
		// 		`getPlayerRotation${Date.now()}`,
		// 		({ message }) => datagram.startsWith("PlayerRotation"),
		// 		({ message }) => {
		// 			const matrix = new Matrix4()
		// 			matrix.elements[0] = +datagram.split("_")[1]
		// 			matrix.elements[4] = +datagram.split("_")[2]
		// 			matrix.elements[8] = +datagram.split("_")[3]
		// 			matrix.elements[1] = +datagram.split("_")[4]
		// 			matrix.elements[5] = +datagram.split("_")[5]
		// 			matrix.elements[9] = +datagram.split("_")[6]
		// 			matrix.elements[2] = +datagram.split("_")[7]
		// 			matrix.elements[6] = +datagram.split("_")[8]
		// 			matrix.elements[10] = +datagram.split("_")[9]
		// 			const euler = new Euler(0, 0, 0, "XYZ").setFromRotationMatrix(matrix)
		// 			resolve({ x: euler.x * RAD2DEG, y: euler.y * RAD2DEG, z: euler.z * RAD2DEG })
		// 		}
		// 	)
		// )
	}

	async updateProperty(id: string, propertyName: string, property: Property) {
		// let propertyType = property.type
		// let propertyValue = deepClone(property.value)
		// if (enums[property.type]) {
		// 	propertyType = "enum"
		// 	propertyValue = enums[property.type].indexOf(property.value)
		// }
		// let positions, rotations, vector
		// switch (propertyType) {
		// 	case "SMatrix43":
		// 		positions = [+propertyValue.position.x, +propertyValue.position.y, +propertyValue.position.z]
		// 		rotations = [+propertyValue.rotation.x, +propertyValue.rotation.y, +propertyValue.rotation.z]
		// 		propertyValue = `${positions.join("|")}|${rotations.join("|")}`
		// 		break
		// 	case "SVector3":
		// 		vector = [+propertyValue.x, +propertyValue.y, +propertyValue.z]
		// 		propertyValue = vector.join("|")
		// 		break
		// 	case "ZGuid":
		// 		propertyValue = propertyValue.toUpperCase()
		// 		break
		// 	case "SEntityTemplateReference":
		// 		propertyValue = new Decimal("0x" + getReferencedLocalEntity(propertyValue)).toFixed()
		// 		break
		// 	case "TArray<SEntityTemplateReference>":
		// 		propertyValue = `${propertyValue.length}|${propertyValue.map((ref: Ref) => new Decimal("0x" + getReferencedLocalEntity(ref)).toFixed()).join("|")}`
		// 		break
		// 	default:
		// 		propertyValue = propertyValue instanceof Decimal ? +propertyValue : propertyValue
		// }
		// await this.client.send(this.lastAddress, `UpdateProperty|${new Decimal(`0x${id}`).toFixed()}|${propertyName}|${propertyType}|${propertyValue}`)
	}

	async selectEntity(id: string, entity: Entity) {
		await this.client.send(this.lastAddress, JSON.stringify({
			"SelectEntity": {
				entity_id: new Decimal(`0x${id}`).toString(),
				tblu_hash: new Decimal(`0x${normaliseToHash(entity.tbluHash)}`).toString()
			}
		}))
	}
}

export const gameServer = new GameServer()
