import { BaseDirectory, copyFile, readDir, readTextFile, exists as tauriExists, writeTextFile } from "@tauri-apps/api/fs"
import type { Entity, PatchOperation } from "$lib/quickentity-types"
import { appDir, join } from "@tauri-apps/api/path"

import { Command } from "@tauri-apps/api/shell"
import cloneDeep from "lodash/cloneDeep"
import json from "$lib/json"
import { normaliseToHash } from "$lib/utils"
import { workspaceData } from "./stores"

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

	parsedFiles: Record<string, any> = {}
	resolvedEntities: Record<string, Entity> = {}

	workspaceData: Parameters<typeof workspaceData["set"]>[0] = { ephemeralFiles: [] }

	constructor(appSettings: { gameFileExtensions: boolean; gameFileExtensionsDataPath: string }) {
		this.appSettings = appSettings

		workspaceData.subscribe((val) => (this.workspaceData = val))
	}

	async readJSONFile(path: string) {
		if (!this.parsedFiles[path]) {
			this.parsedFiles[path] = await readJSON(path)
		}

		return this.parsedFiles[path]
	}

	async getWorkspaceFiles() {
		const entries = await readDir(this.workspaceData.path!, { recursive: true })
		let files: string[] = []

		const recurse = (entry: typeof entries[number]) => {
			if (entry.name && !entry.children?.length) {
				files.push(entry.path)
			} else if (entry.children?.length) {
				for (const child of entry.children) {
					recurse(child)
				}
			}
		}

		for (const entry of entries) {
			recurse(entry)
		}

		files = files.filter((a) => a.endsWith("entity.json") || a.endsWith("entity.patch.json"))

		return files
	}

	async getEntityByFactory(factory: string): Promise<Entity | null> {
		if (!this.resolvedEntities[factory]) {
			factory = normaliseToHash(factory)

			let base: Entity | undefined = undefined
			let patches: { tempHash: string; tbluHash: string; patch: PatchOperation[] }[] = []

			if (this.workspaceData.path) {
				const files = await this.getWorkspaceFiles()

				const affectingFiles: (Entity | typeof patches[number])[] = []

				for (const file of files) {
					const val: typeof affectingFiles[number] = await this.readJSONFile(file)

					if (val.tempHash === factory) {
						affectingFiles.push(val)
					}
				}

				const ent = affectingFiles.find((a) => Object.hasOwn(a, "quickEntityVersion"))
				if (ent) {
					base = ent as Entity
				}

				patches = affectingFiles.filter((a) => Object.hasOwn(a, "patch")) as typeof patches[number][]
			}

			const gfePath = await join(this.appSettings.gameFileExtensionsDataPath, "TEMP", `${factory}.TEMP.entity.json`)

			if (await exists(gfePath)) {
				base = await this.readJSONFile(gfePath)
			}

			if (!base) {
				return null
			} else {
				if (patches.length) {
					await writeTextFile("patched.json", json.stringify(base), {
						dir: BaseDirectory.App
					})

					for (const patch of patches) {
						await copyFile("patched.json", "base.json", { dir: BaseDirectory.App })
						await writeTextFile("patch.json", json.stringify(patch), {
							dir: BaseDirectory.App
						})

						await Command.sidecar("sidecar/quickentity-rs", [
							"patch",
							"apply",
							"--input",
							await join(await appDir(), "base.json"),
							"--patch",
							await join(await appDir(), "patch.json"),
							"--output",
							await join(await appDir(), "patched.json")
						]).execute()
					}

					return await this.readJSONFile(await join(await appDir(), "patched.json"))
				} else {
					return base
				}
			}
		} else {
			return this.resolvedEntities[factory]
		}
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

	async findProperties(entity: Entity, foundProperties: string[]) {
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
			if (this.knownCPPTProperties[factory]) {
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
			} else {
				const e = await this.getEntityByFactory(factory)

				if (e) {
					await this.findProperties(e, foundProperties)
				}
			}
		}
	}

	async findDefaultPropertyValue(entity: Entity, targetSubEntity: string | undefined, propertyToFind: string, excludeSubEntity?: string): Promise<any> {
		const targetedEntity = entity.entities[targetSubEntity || entity.rootEntity]

		if (targetedEntity.propertyAliases) {
			for (const [aliasedName, aliases] of Object.entries(targetedEntity.propertyAliases)) {
				for (const aliasData of aliases) {
					if (aliasedName == propertyToFind) {
						return await this.findDefaultPropertyValue(
							entity,
							aliasData.originalEntity as string, // We can assume that the property alias is a local reference
							aliasData.originalProperty,
							excludeSubEntity
						)
					}
				}
			}
		}

		if (targetedEntity.properties && targetedEntity.properties[propertyToFind] && targetSubEntity != excludeSubEntity) {
			const prop = cloneDeep(targetedEntity.properties[propertyToFind])
			if (prop.type == "SEntityTemplateReference") {
				if (typeof prop.value == "string") {
					return {
						type: "SEntityTemplateReference",
						value: {
							ref: prop.value,
							externalScene: entity.tempHash
						},
						postInit: prop.postInit
					}
				} else if (prop.value && !prop.value.externalScene) {
					return {
						type: "SEntityTemplateReference",
						value: {
							ref: prop.value.ref,
							externalScene: entity.tempHash,
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
							externalScene: entity.tempHash
						}
					} else if (prop.value[val] && !prop.value[val].externalScene) {
						prop.value[val] = {
							ref: prop.value[val].ref,
							externalScene: entity.tempHash,
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
			if (this.knownCPPTProperties[factory] && this.knownCPPTProperties[factory][propertyToFind]) {
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
			} else {
				const e = await this.getEntityByFactory(factory)

				if (e) {
					const result = await this.findDefaultPropertyValue(e, undefined, propertyToFind)
					if (result) return result
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
			if (this.knownCPPTPins[factory]) {
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
			} else {
				const e = await this.getEntityByFactory(factory)
				if (e) {
					await this.getPins(e, e.rootEntity, false, soFar)
				}
			}
		}
	}
}
