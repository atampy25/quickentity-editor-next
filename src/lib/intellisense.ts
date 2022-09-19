import { basename, join } from "@tauri-apps/api/path"
import { readDir, readTextFile, exists as tauriExists } from "@tauri-apps/api/fs"

import type { Entity } from "$lib/quickentity-types"
import cloneDeep from "lodash/cloneDeep"
import json from "$lib/json"
import { normaliseToHash } from "$lib/utils"

const readJSON = async (path: string) => json.parse(await readTextFile(path))
const exists = async (path: string) => {
	try {
		return await tauriExists(path)
	} catch {
		return false
	}
}

export class Intellisense {
	appSettings: {
		gameFileExtensions: boolean
		gameFileExtensionsDataPath: string
	}

	knownCPPTProperties: Record<string, Record<string, any>>
	UICBPropTypes: Record<number, string>
	allUICTs: Set<string>

	constructor(appSettings: { gameFileExtensions: boolean; gameFileExtensionsDataPath: string }) {
		this.appSettings = appSettings
	}

	async ready() {
		this.knownCPPTProperties = await readJSON(await join(this.appSettings.gameFileExtensionsDataPath, "props.json"))
		this.UICBPropTypes = await readJSON(await join(this.appSettings.gameFileExtensionsDataPath, "foundUICBPropTypes.json"))
		this.allUICTs = new Set(
			(await readDir(await join(this.appSettings.gameFileExtensionsDataPath, "UICT")))
				.map((a) => a.name?.split(".")[0])
				.filter((a) => a)
				.map((a) => a!)
		)
	}

	async findProperties(pathToEntity: string, foundProperties: string[]) {
		const entity: Entity = await readJSON(pathToEntity)
		const targetedEntity = entity.entities[entity.rootEntity]

		if (targetedEntity.propertyAliases) {
			for (const alias of Object.keys(targetedEntity.propertyAliases)) {
				foundProperties.push(alias)
			}
		}

		if (targetedEntity.properties) {
			foundProperties.push(...Object.keys(targetedEntity.properties))
		}

		for (const template of (await exists(await join(this.appSettings.gameFileExtensionsDataPath, "ASET", targetedEntity.template + ".ASET.meta.JSON")))
			? (await readJSON(await join(this.appSettings.gameFileExtensionsDataPath, "ASET", targetedEntity.template + ".ASET.meta.JSON"))).hash_reference_data.slice(0, -1).map((a) => a.hash)
			: [targetedEntity.template]) {
			if (await exists(await join(this.appSettings.gameFileExtensionsDataPath, "TEMP", template + ".TEMP.entity.json"))) {
				await this.findProperties(await join(this.appSettings.gameFileExtensionsDataPath, "TEMP", template + ".TEMP.entity.json"), foundProperties)
			} else if (this.knownCPPTProperties[template]) {
				foundProperties.push(...Object.keys(this.knownCPPTProperties[template]))
			} else if (this.allUICTs.has(template)) {
				foundProperties.push(...Object.keys(this.knownCPPTProperties["002C4526CC9753E6"])) // All UI controls have the properties of ZUIControlEntity
				foundProperties.push(
					...Object.keys(
						(
							await readJSON(
								await join(
									this.appSettings.gameFileExtensionsDataPath,
									"UICB",
									(
										await readJSON(await join(this.appSettings.gameFileExtensionsDataPath, "UICT", template + ".UICT.meta.JSON"))
									).hash_reference_data.filter((a) => a.hash != "002C4526CC9753E6")[0].hash + ".UICB.json"
								)
							)
						).properties
					)
				) // Get the specific properties from the UICB
			}
		}
	}

	async findDefaultPropertyValue(pathToEntity: string, targetEntity: string | undefined, propertyToFind: string, useLoadedEntity?: Entity, excludeEntity?: string): any {
		const loadedEntity: Entity = useLoadedEntity || (await readJSON(pathToEntity))
		const targetedEntity = loadedEntity.entities[targetEntity || loadedEntity.rootEntity]

		if (targetedEntity.propertyAliases) {
			for (const [aliasedName, aliasData] of Object.entries(targetedEntity.propertyAliases)) {
				if (aliasedName == propertyToFind) {
					return await this.findDefaultPropertyValue(
						pathToEntity,
						aliasData.originalEntity as string /* We can assume that the property alias is a local reference */,
						aliasData.originalProperty,
						useLoadedEntity,
						excludeEntity
					)
				}
			}
		}

		if (targetedEntity.properties && targetedEntity.properties[propertyToFind] && targetEntity != excludeEntity) {
			const prop = cloneDeep(targetedEntity.properties[propertyToFind])
			if (prop.type == "SEntityTemplateReference") {
				if (typeof prop.value == "string") {
					return {
						type: "SEntityTemplateReference",
						value: {
							ref: prop.value,
							externalScene: basename(pathToEntity, ".TEMP.entity.json")
						},
						postInit: prop.postInit
					}
				} else if (prop.value && !prop.value.externalScene) {
					return {
						type: "SEntityTemplateReference",
						value: {
							ref: prop.value.ref,
							externalScene: basename(pathToEntity, ".TEMP.entity.json"),
							exposedEntity: prop.value.exposedEntity
						},
						postInit: prop.postInit
					}
				}
			}

			if (prop.type == "TArray<SEntityTemplateReference>") {
				for (const val in prop.value) {
					if (typeof prop.value[val] == "string") {
						prop.value[val] = {
							ref: prop.value[val],
							externalScene: basename(pathToEntity, ".TEMP.entity.json")
						}
					} else if (prop.value[val] && !prop.value[val].externalScene) {
						prop.value[val] = {
							ref: prop.value[val].ref,
							externalScene: basename(pathToEntity, ".TEMP.entity.json"),
							exposedEntity: prop.value[val].exposedEntity
						}
					}
				}
			}

			return prop
		}

		for (const template of (await exists(await join(this.appSettings.gameFileExtensionsDataPath, "ASET", normaliseToHash(targetedEntity.template) + ".ASET.meta.JSON")))
			? (await readJSON(await join(this.appSettings.gameFileExtensionsDataPath, "ASET", normaliseToHash(targetedEntity.template) + ".ASET.meta.JSON"))).hash_reference_data
					.slice(0, -1)
					.map((a) => a.hash)
			: [normaliseToHash(targetedEntity.template)]) {
			if (await exists(await join(this.appSettings.gameFileExtensionsDataPath, "TEMP", template + ".TEMP.entity.json"))) {
				const result = await this.findDefaultPropertyValue(await join(this.appSettings.gameFileExtensionsDataPath, "TEMP", template + ".TEMP.entity.json"), undefined, propertyToFind)
				if (result) return result
			} else if (this.knownCPPTProperties[template] && this.knownCPPTProperties[template][propertyToFind]) {
				return {
					type: this.knownCPPTProperties[template][propertyToFind][0],
					value: this.knownCPPTProperties[template][propertyToFind][1]
				}
			} else if (this.allUICTs.has(template)) {
				if (
					(
						await readJSON(
							await join(
								this.appSettings.gameFileExtensionsDataPath,
								"UICB",
								(
									await readJSON(await join(this.appSettings.gameFileExtensionsDataPath, "UICT", template + ".UICT.meta.JSON"))
								).hash_reference_data.filter((a) => a.hash != "002C4526CC9753E6")[0].hash + ".UICB.json"
							)
						)
					).properties[propertyToFind]
				) {
					return {
						type: this.UICBPropTypes[
							(
								await readJSON(
									await join(
										this.appSettings.gameFileExtensionsDataPath,
										"UICB",
										(await readJSON(await join(this.appSettings.gameFileExtensionsDataPath, "UICT", template + ".UICT.meta.JSON")).hash_reference_data.filter(
											(a) => a.hash != "002C4526CC9753E6"
										)[0].hash) + ".UICB.json"
									)
								)
							).properties[propertyToFind]
						],
						value: { ZString: "", bool: false, float32: 0 }[
							this.UICBPropTypes[
								(
									await readJSON(
										await join(
											this.appSettings.gameFileExtensionsDataPath,
											"UICB",
											(await readJSON(await join(this.appSettings.gameFileExtensionsDataPath, "UICT", template + ".UICT.meta.JSON")).hash_reference_data.filter(
												(a) => a.hash != "002C4526CC9753E6"
											)[0].hash) + ".UICB.json"
										)
									)
								).properties[propertyToFind]
							]
						]
					} // Specific UI control properties can be found in the UICB; we can't parse the actual defaults (if there are any) right now so we use sensible ones
				} else if (this.knownCPPTProperties["002C4526CC9753E6"][propertyToFind]) {
					return {
						type: this.knownCPPTProperties["002C4526CC9753E6"][propertyToFind][0],
						value: this.knownCPPTProperties["002C4526CC9753E6"][propertyToFind][1]
					} // All UI controls have the properties of ZUIControlEntity
				}
			}
		}
	}
}
