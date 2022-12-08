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

	knownCPPTProperties!: Record<string, Record<string, any>>
	knownCPPTPins!: Record<string, { input: string[]; output: string[] }>
	UICBPropTypes!: Record<number, string>
	allUICTs!: Set<string>

	parsedEntities: Record<string, any> = {}

	constructor(appSettings: { gameFileExtensions: boolean; gameFileExtensionsDataPath: string }) {
		this.appSettings = appSettings
	}

	async readJSONFile(path: string) {
		if (!this.parsedEntities[path]) {
			this.parsedEntities[path] = await readJSON(path)
		}

		return this.parsedEntities[path]
	}

	async ready() {
		this.knownCPPTProperties = await this.readJSONFile(await join(this.appSettings.gameFileExtensionsDataPath, "props.json"))
		this.knownCPPTPins = await this.readJSONFile(await join(this.appSettings.gameFileExtensionsDataPath, "pins.json"))
		this.UICBPropTypes = await this.readJSONFile(await join(this.appSettings.gameFileExtensionsDataPath, "foundUICBPropTypes.json"))
		this.allUICTs = new Set(
			(await readDir(await join(this.appSettings.gameFileExtensionsDataPath, "UICT")))
				.map((a) => a.name?.split(".")[0])
				.filter((a) => a)
				.map((a) => a!)
		)
	}

	async findProperties(pathToEntity: string, foundProperties: string[]) {
		const entity: Entity = await this.readJSONFile(pathToEntity)
		const targetedEntity = entity.entities[entity.rootEntity]

		if (targetedEntity.propertyAliases) {
			for (const alias of Object.keys(targetedEntity.propertyAliases)) {
				foundProperties.push(alias)
			}
		}

		if (targetedEntity.properties) {
			foundProperties.push(...Object.keys(targetedEntity.properties))
		}

		for (const factory of (await exists(await join(this.appSettings.gameFileExtensionsDataPath, "ASET", normaliseToHash(targetedEntity.factory) + ".ASET.meta.JSON")))
			? (await this.readJSONFile(await join(this.appSettings.gameFileExtensionsDataPath, "ASET", normaliseToHash(targetedEntity.factory) + ".ASET.meta.JSON"))).hash_reference_data
				.slice(0, -1)
				.map((a) => a.hash)
			: [normaliseToHash(targetedEntity.factory)]) {
			if (await exists(await join(this.appSettings.gameFileExtensionsDataPath, "TEMP", factory + ".TEMP.entity.json"))) {
				await this.findProperties(await join(this.appSettings.gameFileExtensionsDataPath, "TEMP", factory + ".TEMP.entity.json"), foundProperties)
			} else if (this.knownCPPTProperties[factory]) {
				foundProperties.push(...Object.keys(this.knownCPPTProperties[factory]))
			} else if (this.allUICTs.has(factory)) {
				foundProperties.push(...Object.keys(this.knownCPPTProperties["002C4526CC9753E6"])) // All UI controls have the properties of ZUIControlEntity
				foundProperties.push(
					...Object.keys(
						(
							await this.readJSONFile(
								await join(
									this.appSettings.gameFileExtensionsDataPath,
									"UICB",
									(
										await this.readJSONFile(await join(this.appSettings.gameFileExtensionsDataPath, "UICT", factory + ".UICT.meta.JSON"))
									).hash_reference_data.filter((a) => a.hash != "002C4526CC9753E6")[0].hash + ".UICB.json"
								)
							)
						).properties
					)
				) // Get the specific properties from the UICB
			}
		}
	}

	async findDefaultPropertyValue(pathToEntity: string, targetEntity: string | undefined, propertyToFind: string, useLoadedEntity?: Entity, excludeEntity?: string): Promise<any> {
		const loadedEntity: Entity = useLoadedEntity || (await this.readJSONFile(pathToEntity))
		const targetedEntity = loadedEntity.entities[targetEntity || loadedEntity.rootEntity]

		if (targetedEntity.propertyAliases) {
			for (const [aliasedName, aliases] of Object.entries(targetedEntity.propertyAliases)) {
				for (const aliasData of aliases) {
					if (aliasedName == propertyToFind) {
						return await this.findDefaultPropertyValue(
							pathToEntity,
							aliasData.originalEntity as string, // We can assume that the property alias is a local reference
							aliasData.originalProperty,
							useLoadedEntity,
							excludeEntity
						)
					}
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

		for (const factory of (await exists(await join(this.appSettings.gameFileExtensionsDataPath, "ASET", normaliseToHash(targetedEntity.factory) + ".ASET.meta.JSON")))
			? (await this.readJSONFile(await join(this.appSettings.gameFileExtensionsDataPath, "ASET", normaliseToHash(targetedEntity.factory) + ".ASET.meta.JSON"))).hash_reference_data
				.slice(0, -1)
				.map((a) => a.hash)
			: [normaliseToHash(targetedEntity.factory)]) {
			if (await exists(await join(this.appSettings.gameFileExtensionsDataPath, "TEMP", factory + ".TEMP.entity.json"))) {
				const result = await this.findDefaultPropertyValue(await join(this.appSettings.gameFileExtensionsDataPath, "TEMP", factory + ".TEMP.entity.json"), undefined, propertyToFind)
				if (result) return result
			} else if (this.knownCPPTProperties[factory] && this.knownCPPTProperties[factory][propertyToFind]) {
				return {
					type: this.knownCPPTProperties[factory][propertyToFind][0],
					value: this.knownCPPTProperties[factory][propertyToFind][1]
				}
			} else if (this.allUICTs.has(factory)) {
				if (
					(
						await this.readJSONFile(
							await join(
								this.appSettings.gameFileExtensionsDataPath,
								"UICB",
								(
									await this.readJSONFile(await join(this.appSettings.gameFileExtensionsDataPath, "UICT", factory + ".UICT.meta.JSON"))
								).hash_reference_data.find((a) => a.hash != "002C4526CC9753E6").hash + ".UICB.json"
							)
						)
					).properties[propertyToFind]
				) {
					return {
						type: this.UICBPropTypes[
							(
								await this.readJSONFile(
									await join(
										this.appSettings.gameFileExtensionsDataPath,
										"UICB",
										(
											await this.readJSONFile(await join(this.appSettings.gameFileExtensionsDataPath, "UICT", factory + ".UICT.meta.JSON"))
										).hash_reference_data.find((a) => a.hash != "002C4526CC9753E6").hash + ".UICB.json"
									)
								)
							).properties[propertyToFind]
						],
						value: { ZString: "", bool: false, float32: 0 }[
							this.UICBPropTypes[
								(
									await this.readJSONFile(
										await join(
											this.appSettings.gameFileExtensionsDataPath,
											"UICB",
											(
												await this.readJSONFile(await join(this.appSettings.gameFileExtensionsDataPath, "UICT", factory + ".UICT.meta.JSON"))
											).hash_reference_data.find((a) => a.hash != "002C4526CC9753E6").hash + ".UICB.json"
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

	async getPins(entity: Entity, subEntity: string, ignoreTargeted: boolean, soFar: { input: string[]; output: string[] }) {
		const targetedEntity = entity.entities[subEntity]

		if (!ignoreTargeted) {
			if (targetedEntity.events) {
				soFar.output.push(...Object.keys(targetedEntity.events))
			}
			if (targetedEntity.inputCopying) {
				soFar.input.push(...Object.keys(targetedEntity.inputCopying))
			}
			if (targetedEntity.outputCopying) {
				soFar.output.push(...Object.keys(targetedEntity.outputCopying))
			}
		}

		for (const ent of Object.values(entity.entities)) {
			if (ent.events) {
				for (const [event, data] of Object.entries(ent.events)) {
					for (const [trigger, refs] of Object.entries(data)) {
						for (const ref of refs) {
							if (ref == subEntity) {
								soFar.input.push(trigger)
							}
						}
					}
				}
			}

			if (ent.inputCopying) {
				for (const [input, data] of Object.entries(ent.inputCopying)) {
					for (const [trigger, refs] of Object.entries(data)) {
						for (const ref of refs) {
							if (ref == subEntity) {
								soFar.input.push(trigger)
							}
						}
					}
				}
			}

			if (ent.outputCopying) {
				for (const [output, data] of Object.entries(ent.outputCopying)) {
					for (const [propagated, refs] of Object.entries(data)) {
						for (const ref of refs) {
							if (ref == subEntity) {
								soFar.output.push(propagated)
							}
						}
					}
				}
			}
		}

		for (const factory of (await exists(await join(this.appSettings.gameFileExtensionsDataPath, "ASET", normaliseToHash(targetedEntity.factory) + ".ASET.meta.JSON")))
			? (await this.readJSONFile(await join(this.appSettings.gameFileExtensionsDataPath, "ASET", normaliseToHash(targetedEntity.factory) + ".ASET.meta.JSON"))).hash_reference_data
				.slice(0, -1)
				.map((a) => a.hash)
			: [normaliseToHash(targetedEntity.factory)]) {
			if (await exists(await join(this.appSettings.gameFileExtensionsDataPath, "TEMP", factory + ".TEMP.entity.json"))) {
				const s = await this.readJSONFile(await join(this.appSettings.gameFileExtensionsDataPath, "TEMP", factory + ".TEMP.entity.json"))
				await this.getPins(s, s.rootEntity, false, soFar)
			} else if (this.knownCPPTPins[factory]) {
				soFar.input.push(...this.knownCPPTPins[factory].input)
				soFar.output.push(...this.knownCPPTPins[factory].output)
			} else if (this.allUICTs.has(factory)) {
				// Get the specific pins from the UICB (though we don't know if they're inputs or outputs)
				soFar.input.push(
					...Object.keys(
						(
							await this.readJSONFile(
								await join(
									this.appSettings.gameFileExtensionsDataPath,
									"UICB",
									(
										await this.readJSONFile(await join(this.appSettings.gameFileExtensionsDataPath, "UICT", factory + ".UICT.meta.JSON"))
									).hash_reference_data.filter((a) => a.hash != "002C4526CC9753E6")[0].hash + ".UICB.json"
								)
							)
						).pins
					)
				)

				soFar.output.push(
					...Object.keys(
						(
							await this.readJSONFile(
								await join(
									this.appSettings.gameFileExtensionsDataPath,
									"UICB",
									(
										await this.readJSONFile(await join(this.appSettings.gameFileExtensionsDataPath, "UICT", factory + ".UICT.meta.JSON"))
									).hash_reference_data.filter((a) => a.hash != "002C4526CC9753E6")[0].hash + ".UICB.json"
								)
							)
						).pins
					)
				)
			}
		}
	}
}
