import { invoke, transformCallback } from "@tauri-apps/api/tauri"
import type { EntityId } from "$lib/types/EntityId"
import type { QnToSdkMessage } from "$lib/types/QnToSdkMessage"
import type { ResourceHash } from "$lib/types/ResourceHash"
import { isSdkToQnMessage_Hello, isSdkToQnMessage_SelectEntity, isSdkToQnMessage_SetEntityTransform, type SdkToQnMessage } from "$lib/types/SdkToQnMessage"
import type { Transform } from "$lib/types/Transform"
import handleHello from "./handlers/hello"
import handleSelectEntity from "./handlers/select-entity"
import handleSetEntityTransform from "./handlers/set-entity-transform"

export class SdkEditor {
	private static messageListeners = new Set<(msg: SdkToQnMessage) => void>()

	/**
	 * Initialize the SDK editor plugin.
	 */
	public static init() {
		invoke("plugin:sdk_editor|set_message_callback", {
			callbackFunction: transformCallback(SdkEditor.handleEditorMessage),
		})

		invoke("plugin:sdk_editor|init")
	}

	/**
	 * Register a callback to receive messages from the SDK editor.
	 * @param callback 
	 */
	public static addMessageListener(callback: (msg: SdkToQnMessage) => void) {
		SdkEditor.messageListeners.add(callback)
	}

	/** 
	 * Deregister the provided callback from receiving messages from the SDK editor.
	 */
	public static removeMessageListener(callback: (msg: SdkToQnMessage) => void) {
		SdkEditor.messageListeners.delete(callback)
	}

	/**
	 * Try to select an entity in-game, using the SDK editor.
	 * @param entityId The id of the entity to select.
	 * @param tbluHash The resource hash of the entity blueprint factory of this entity.
	 */
	public static selectEntity(entityId: EntityId, tbluHash: ResourceHash) {
		SdkEditor.sendMessage({
			SelectEntity: {
				entity_id: entityId,
				tblu_hash: tbluHash,
			},
		})
	}

	/**
	 * Try to set the transform of an entity in-game, using the SDK editor.
	 * @param entityId The id of the entity to select.
	 * @param tbluHash The resource hash of the entity blueprint factory of this entity.
	 * @param transform The new transform of the entity.
	 */
	public static setEntityTransform(entityId: EntityId, tbluHash: ResourceHash, transform: Transform) {
		SdkEditor.sendMessage({
			SetEntityTransform: {
				entity_id: entityId,
				tblu_hash: tbluHash,
				transform,
			},
		})
	}

	/**
	 * Try to spawn an entity in-game using the SDK editor.
	 * @param entityId The id of the new entity.
	 * @param tempHash The resource hash of the entity factory to spawn the entity.
	 */
	public static spawnEntity(entityId: EntityId, tempHash: ResourceHash) {
		SdkEditor.sendMessage({
			SpawnEntity: {
				entity_id: entityId,
				temp_hash: tempHash,
			},
		})
	}

	/**
	 * Try to set the transform of one of the previously spawned entities.
	 * @param entityId The id of the spawned entity.
	 * @param transform The new transform of the entity.
	 */
	public static setSpawnedEntityTransform(entityId: EntityId, transform: Transform) {
		SdkEditor.sendMessage({
			SetSpawnedEntityTransform: {
				entity_id: entityId,
				transform,
			},
		})
	}

	/**
	 * Try to delete one of the previously spawned entities.
	 * @param entityId The id of the spawned entity.
	 */
	public static deleteSpawnedEntity(entityId: EntityId) {
		SdkEditor.sendMessage({
			DeleteSpawnedEntity: {
				entity_id: entityId,
			},
		})
	}

	private static handleEditorMessage(msg: SdkToQnMessage) {
		// Call internal message handlers.
		if (isSdkToQnMessage_SelectEntity(msg)) {
			handleSelectEntity(msg)
		} else if (isSdkToQnMessage_SetEntityTransform(msg)) {
			handleSetEntityTransform(msg)
		} else if (isSdkToQnMessage_Hello(msg)) {
			handleHello(msg)
		}

		// Call any additional message listeners.
		SdkEditor.messageListeners.forEach((listener) => listener(msg))
	}

	private static sendMessage(msg: QnToSdkMessage) {
		invoke("plugin:sdk_editor|send_message", {
			msg,
		})
	}
}

window.sdkEditor = SdkEditor;