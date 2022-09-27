import * as fs from "@tauri-apps/api/fs"
import * as path from "@tauri-apps/api/path"

import { Decimal } from "decimal.js"
import UDPServer from "./api/udp"
import WebSocket from "./api/websockets"
import knownPins from "./knownPins.json"

// let lastGamePing = 0

// function onMessageRecieved(msg) {
// 	if (msg.startsWith("GetHeroPosition")) {
// 		const [msgType, x, y, z] = msg.split("_")
// 		console.log("sent " + msgType)
// 	} else if (msg.startsWith("Ping")) {
// 		lastGamePing = Date.now()
// 	}
// }

// switch (message.type) {
// 	case "register":
// 		console.log(message.requestedPins)
// 		requestedPins = message.requestedPins.reduce((prev, val) => {
// 			prev[val] = ws
// 			return prev
// 		}, {})
// 		break
// 	case "highlight":
// 		console.log(message.entityId)
// 		if (currentGameConnectionInfo) gameServer.send(`H|${new Decimal("0x" + message.entityId).toFixed()}`, currentGameConnectionInfo.port, currentGameConnectionInfo.address)
// 		break
// 	case "cover_plane":
// 		console.log(message.entityId)
// 		if (currentGameConnectionInfo)
// 			gameServer.send(
// 				`C|${new Decimal("0x" + message.entityId).toFixed()}|${message.positions.join("|")}|${message.rotations.join("|")}|${message.size.join("|")}`,
// 				currentGameConnectionInfo.port,
// 				currentGameConnectionInfo.address
// 			)
// 		break
// 	case "get_hero_position":
// 		if (currentGameConnectionInfo) gameServer.send("GetHeroPosition", currentGameConnectionInfo.port, currentGameConnectionInfo.address)
// 		break
// 	case "set_hero_position":
// 		if (currentGameConnectionInfo)
// 			gameServer.send(
// 				`SetHeroPosition|${new Decimal("0x" + message.entityId).toFixed()}|${message.positions.join("|")}|${message.rotations.join("|")}`,
// 				currentGameConnectionInfo.port,
// 				currentGameConnectionInfo.address
// 			)
// 		break
// 	case "update_property":
// 		console.log(message.entityId)
// 		if (currentGameConnectionInfo)
// 			gameServer.send(
// 				`UpdateProperty|${new Decimal("0x" + message.entityId).toFixed()}|${message.property}|${message.propertyType}|${message.value}`,
// 				currentGameConnectionInfo.port,
// 				currentGameConnectionInfo.address
// 			)
// 		break
// 	case "signal_pin":
// 		if (currentGameConnectionInfo)
// 			gameServer.send(
// 				`SignalPin|${new Decimal("0x" + message.entityId).toFixed()}|${message.pinType}|${message.pinName}`,
// 				currentGameConnectionInfo.port,
// 				currentGameConnectionInfo.address
// 			)
// }

export class GameServer {
	// @ts-expect-error Client should be connected before use
	client: UDPServer

	async start() {
		this.client = await UDPServer.bind("127.0.0.1:37275")

		this.client.addListener(({ datagram, address }) => console.log("Received datagram", JSON.stringify(datagram), "from", address))
	}
}
