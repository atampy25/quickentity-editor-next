import * as fs from "@tauri-apps/api/fs"
import * as path from "@tauri-apps/api/path"

import type { Property, Ref, SubEntity } from "$lib/quickentity-types"
import { getReferencedLocalEntity, normaliseToHash } from "$lib/utils"

import { Decimal } from "decimal.js"
import UDPSocket from "./api/udp"
import WebSocket from "./api/websockets"
import deepClone from "lodash/cloneDeep"
import enums from "$lib/enums.json"
import knownPins from "./knownPins.json"

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
		console.log("Binding UDP socket on localhost:37275")

		this.client = await UDPSocket.bind("127.0.0.1:37275")
		this.connected = true

		this.client.addListener(({ datagram, address }) => {
			if (datagram != "PingGame") {
				console.log("Received datagram", JSON.stringify(datagram), "from", address)
			}
			this.lastAddress = address
		})
	}

	async kill() {
		console.log("Killing UDP socket")

		await this.client.kill()
		this.connected = false
	}

	async getPlayerPosition(): Promise<{ x: number; y: number; z: number }> {
		await this.client.send(this.lastAddress, "GetHeroPosition")
		return await new Promise((resolve) =>
			this.client.once(
				`getHeroPosition${Date.now()}`,
				({ datagram }) => datagram.startsWith("GetHeroPosition"),
				({ datagram }) => resolve({ x: +datagram.split("_")[1], y: +datagram.split("_")[2], z: +datagram.split("_")[3] })
			)
		)
	}

	/** Barely works; only here for reference. */
	async setPlayerPosition(transform: { position: { x: number; y: number; z: number }; rotation: { x: number; y: number; z: number } }) {
		await this.client.send(this.lastAddress, `SetHeroPosition|blablaunused|${Object.values(transform.position).join("|")}|${Object.values(transform.rotation).join("|")}`)
	}

	async updateProperty(id: string, propertyName: string, property: Property) {
		let propertyType = property.type
		let propertyValue = deepClone(property.value)

		if (enums[property.type]) {
			propertyType = "enum"
			propertyValue = enums[property.type].indexOf(property.value)
		}

		let positions, rotations, vector
		switch (propertyType) {
			case "SMatrix43":
				positions = [+propertyValue.position.x, +propertyValue.position.y, +propertyValue.position.z]
				rotations = [+propertyValue.rotation.x, +propertyValue.rotation.y, +propertyValue.rotation.z]
				propertyValue = `${positions.join("|")}|${rotations.join("|")}`
				break
			case "SVector3":
				vector = [+propertyValue.x, +propertyValue.y, +propertyValue.z]

				propertyValue = vector.join("|")
				break
			case "ZGuid":
				propertyValue = propertyValue.toUpperCase()
				break
			case "SEntityTemplateReference":
				propertyValue = new Decimal("0x" + getReferencedLocalEntity(propertyValue)).toFixed()
				break
			case "TArray<SEntityTemplateReference>":
				propertyValue = `${propertyValue.length}|${propertyValue.map((ref: Ref) => new Decimal("0x" + getReferencedLocalEntity(ref)).toFixed()).join("|")}`
				break
			default:
				propertyValue = propertyValue instanceof Decimal ? +propertyValue : propertyValue
		}

		await this.client.send(this.lastAddress, `UpdateProperty|${new Decimal(`0x${id}`).toFixed()}|${propertyName}|${propertyType}|${propertyValue}`)
	}

	async highlightEntity(id: string, ent: SubEntity) {
		if (normaliseToHash(ent.template) === "007E948041B18F72" || ent.properties?.m_vGlobalSize) {
			await this.client.send(
				this.lastAddress,
				`C|${new Decimal(`0x${id}`).toFixed()}|${Object.values(ent.properties?.m_mTransform.value.position).join("|")}|${Object.values(ent.properties?.m_mTransform.value.rotation).join(
					"|"
				)}|${(normaliseToHash(ent.template) === "007E948041B18F72"
					? [+ent.properties?.m_fCoverLength.value, +ent.properties?.m_fCoverDepth.value, ent.properties?.m_eCoverSize.value === "eLowCover" ? 1 : 2]
					: Object.values(ent.properties?.m_vGlobalSize.value)
				).join("|")}`
			)
		} else {
			await this.client.send(this.lastAddress, `H|${new Decimal(`0x${id}`).toFixed()}`)
		}
	}
}

export const gameServer = new GameServer()
