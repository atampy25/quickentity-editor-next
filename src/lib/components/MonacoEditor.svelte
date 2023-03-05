<svelte:options accessors />

<script lang="ts">
	import * as monaco from "monaco-editor"
	import { createEventDispatcher, onMount } from "svelte"
	import editorWorker from "monaco-editor/esm/vs/editor/editor.worker?worker"
	import jsonWorker from "monaco-editor/esm/vs/language/json/json.worker?worker"
	import cssWorker from "monaco-editor/esm/vs/language/css/css.worker?worker"
	import htmlWorker from "monaco-editor/esm/vs/language/html/html.worker?worker"
	import tsWorker from "monaco-editor/esm/vs/language/typescript/ts.worker?worker"
	import type { Entity, FullRef, SubEntity } from "$lib/quickentity-types"
	import json from "$lib/json"
	import { addNotification, appSettings, intellisense, inVivoMetadata } from "$lib/stores"
	import merge from "lodash/merge"
	import { basename, dirname, join } from "@tauri-apps/api/path"
	import { readDir, readTextFile, exists as tauriExists } from "@tauri-apps/api/fs"
	import { getReferencedExternalEntities, getSchema, normaliseToHash } from "$lib/utils"
	import { gameServer } from "$lib/in-vivo/gameServer"

	let el: HTMLDivElement = null!
	export let Monaco: typeof monaco

	export let editor: monaco.editor.IStandaloneCodeEditor = null!

	export let entity: Entity
	export let jsonToDisplay: SubEntity
	export let subEntityID: string
	export let inVivoExtensions: boolean

	const dispatch = createEventDispatcher()

	const exists = async (path: string) => {
		try {
			return await tauriExists(path)
		} catch {
			return false
		}
	}

	onMount(async () => {
		// @ts-ignore
		self.MonacoEnvironment = {
			getWorker: function (_moduleId: any, label: string) {
				if (label === "json") {
					return new jsonWorker()
				}
				if (label === "css" || label === "scss" || label === "less") {
					return new cssWorker()
				}
				if (label === "html" || label === "handlebars" || label === "razor") {
					return new htmlWorker()
				}
				if (label === "typescript" || label === "javascript") {
					return new tsWorker()
				}
				return new editorWorker()
			}
		}

		Monaco = await import("monaco-editor")

		Monaco.editor.defineTheme("theme", {
			base: "vs-dark",
			inherit: true,
			rules: [{ token: "keyword.json", foreground: "b5cea8" }],
			colors: {}
		})

		let model
		try {
			model = Monaco.editor.createModel("The JSON for the selected entity will appear here. You're using QuickEntity Editor 3.0.", "json", Monaco.Uri.parse("qne://subentity.json"))
		} catch {
			model = Monaco.editor.getModel(Monaco.Uri.parse("qne://subentity.json"))
		}

		editor = Monaco.editor.create(el, {
			model,
			roundedSelection: false,
			theme: "theme"
		})

		if (inVivoExtensions) {
			const customContextKey = (id: string, defaultValue: any) => {
				const condition = editor.createContextKey(id, defaultValue)
				let cachedValue = defaultValue
				return {
					set: (value: any) => {
						cachedValue = value
						condition.set(value)
					},
					get: () => cachedValue
				}
			}

			const showUpdatePropertyCondition = customContextKey("showUpdatePropertyCondition", false)

			const contextmenu = editor.getContribution("editor.contrib.contextmenu")!
			const realOnContextMenuMethod = contextmenu._onContextMenu
			contextmenu._onContextMenu = function () {
				const event = arguments[0]

				let word: string | undefined | false
				try {
					word = editor.getModel()!.getWordAtPosition(event.target.position)?.word
				} catch {
					word = false
				}

				if (!word || !gameServer.connected || !gameServer.lastAddress) {
					showUpdatePropertyCondition.set(false)
				} else {
					showUpdatePropertyCondition.set(!!json.parse(editor.getValue()).properties[word])
				}

				realOnContextMenuMethod.apply(contextmenu, arguments)
			}

			editor.addAction({
				id: "update-property",
				label: "Update property in-game",
				contextMenuGroupId: "navigation",
				contextMenuOrder: 0,
				keybindings: [],
				precondition: "showUpdatePropertyCondition",
				run: async (ed) => {
					const propertyName = editor.getModel()!.getWordAtPosition(ed.getPosition()!)!.word

					await gameServer.updateProperty(subEntityID, propertyName, json.parse(editor.getValue()).properties[propertyName])

					$inVivoMetadata.entities[subEntityID] ??= {
						dirtyPins: false,
						dirtyUnchangeables: false,
						dirtyExtensions: false,
						dirtyProperties: [],
						hasSetProperties: false
					}

					$inVivoMetadata.entities[subEntityID].dirtyProperties = $inVivoMetadata.entities[subEntityID].dirtyProperties.filter((a) => a != propertyName)

					$addNotification = {
						kind: "success",
						title: "Property updated",
						subtitle: `The value of the ${propertyName} property should now be reflected in-game.`
					}
				}
			})

			const realDoShowContextMenuMethod = contextmenu._doShowContextMenu
			contextmenu._doShowContextMenu = function () {
				let index = 0
				if (showUpdatePropertyCondition.get()) index++

				if (index > 0)
					arguments[0].splice(
						index,
						0,
						arguments[0].find((item: { id: string }) => item.id === "vs.actions.separator")
					)

				realDoShowContextMenuMethod.apply(contextmenu, arguments)

				showUpdatePropertyCondition.set(false)
			}
		}

		let decorations: monaco.editor.IEditorDecorationsCollection = editor.createDecorationsCollection([])

		const idsToRefsExternal = getReferencedExternalEntities(jsonToDisplay, entity.entities)
			.filter((a) => a.entity && typeof a.entity !== "string")
			.map((a) => a.entity as FullRef)
			.map((a) => [a.ref, a]) as unknown as [string, FullRef][]

		const idsToNamesInternal = Object.entries(entity.entities).map((a) => [a[0], a[1].name])

		editor.onDidChangeModelContent(async (e) => {
			dispatch("contentChanged")

			if ($appSettings.gameFileExtensions) {
				const decorationsArray: monaco.editor.IModelDeltaDecoration[] = []

				for (const [no, line] of editor.getValue().split("\n").entries()) {
					for (const [id, ref] of idsToRefsExternal) {
						if (line.includes(id)) {
							decorationsArray.push({
								options: {
									isWholeLine: true,
									after: {
										content:
											" " +
											(
												(await $intellisense.readJSONFile(
													await join($intellisense.appSettings.gameFileExtensionsDataPath, "TEMP", normaliseToHash(ref.externalScene!) + ".TEMP.entity.json")
												)) as Entity
											).entities[ref.ref].name,
										cursorStops: monaco.editor.InjectedTextCursorStops.Left,
										inlineClassName: "monacoDecorationEntityRef"
									}
								},
								range: new monaco.Range(no + 1, 0, no + 1, line.length + 1)
							})
						}
					}

					for (const [id, name] of idsToNamesInternal) {
						if (line.includes(id)) {
							decorationsArray.push({
								options: {
									isWholeLine: true,
									after: {
										content: " " + name,
										cursorStops: monaco.editor.InjectedTextCursorStops.Left,
										inlineClassName: "monacoDecorationEntityRef"
									}
								},
								range: new monaco.Range(no + 1, 0, no + 1, line.length + 1)
							})
						}
					}
				}

				decorations.set(decorationsArray)
			}
		})

		return () => {
			editor.dispose()
		}
	})

	$: {
		if (editor && jsonToDisplay) {
			editor.setValue(json.stringify(jsonToDisplay, "\t"))
			editor.layout()
			;(async () => {
				let props: Record<string, any> = {}
				let inputs: Record<string, any> = {}
				let outputs: Record<string, any> = {}

				if ($appSettings.gameFileExtensions) {
					let allFoundProperties = []

					for (let factory of (await exists(await join($appSettings.gameFileExtensionsDataPath, "ASET", normaliseToHash(jsonToDisplay.factory) + ".ASET.meta.JSON")))
						? json
								.parse(await readTextFile(await join($appSettings.gameFileExtensionsDataPath, "ASET", normaliseToHash(jsonToDisplay.factory) + ".ASET.meta.JSON")))
								.hash_reference_data.slice(0, -1)
								.map((a) => a.hash)
						: [normaliseToHash(jsonToDisplay.factory)]) {
						if (await exists(await join($appSettings.gameFileExtensionsDataPath, "TEMP", factory + ".TEMP.entity.json"))) {
							await $intellisense.findProperties(await join($appSettings.gameFileExtensionsDataPath, "TEMP", factory + ".TEMP.entity.json"), allFoundProperties)
							jsonToDisplay.propertyAliases && allFoundProperties.push(...Object.keys(jsonToDisplay.propertyAliases))
						} else if ($intellisense.knownCPPTProperties[factory]) {
							allFoundProperties.push(...Object.keys($intellisense.knownCPPTProperties[factory]))
						} else if ($intellisense.allUICTs.has(factory)) {
							allFoundProperties.push(...Object.keys($intellisense.knownCPPTProperties["002C4526CC9753E6"])) // All UI controls have the properties of ZUIControlEntity
							allFoundProperties.push(
								...Object.keys(
									json.parse(
										await readTextFile(
											await join(
												"./intellisense-data/UICB",
												json
													.parse(await readTextFile(await join($appSettings.gameFileExtensionsDataPath, "UICT", factory + ".UICT.meta.JSON")))
													.hash_reference_data.filter((a) => a.hash != "002C4526CC9753E6")[0].hash + ".UICB.json"
											)
										)
									).properties
								)
							) // Get the specific properties from the UICB
						}
					}

					allFoundProperties = [...new Set(allFoundProperties)]

					props = {}

					const perfPropertySchemas = Object.fromEntries(
						getSchema().definitions.SubEntity.properties.properties.additionalProperties.anyOf.map((a) => [a?.properties?.type?.const, a?.properties?.value])
					)

					if ($intellisense.knownCPPTProperties[normaliseToHash(jsonToDisplay.factory)]) {
						for (let foundProp of allFoundProperties) {
							props[foundProp] = {
								type: "object",
								properties: {
									type: {
										type: "string",
										const: $intellisense.knownCPPTProperties[normaliseToHash(jsonToDisplay.factory)][foundProp][0]
									},
									value: merge(perfPropertySchemas[$intellisense.knownCPPTProperties[normaliseToHash(jsonToDisplay.factory)][foundProp][0]], {
										default: $intellisense.knownCPPTProperties[normaliseToHash(jsonToDisplay.factory)][foundProp][1]
									}),
									postInit: {
										type: "boolean"
									}
								},
								default: {
									type: $intellisense.knownCPPTProperties[normaliseToHash(jsonToDisplay.factory)][foundProp][0],
									value: $intellisense.knownCPPTProperties[normaliseToHash(jsonToDisplay.factory)][foundProp][1]
								}
							}
						}
					} else {
						for (let foundProp of allFoundProperties) {
							let val = await $intellisense.findDefaultPropertyValue(entity.tempHash + ".TEMP.entity.json", subEntityID, foundProp, entity, subEntityID)

							if (val) {
								props[foundProp] = {
									type: "object",
									properties: {
										type: {
											type: "string",
											const: val.type
										},
										value: merge(perfPropertySchemas[val.type], {
											default: val.value
										}),
										postInit: {
											type: "boolean"
										}
									},
									default: val
								}
							}
						}
					}

					let pins = { input: [], output: [] }
					await $intellisense.getPins(entity, subEntityID, true, pins)
					pins = { input: [...new Set(pins.input)], output: [...new Set(pins.output)] }

					inputs = Object.fromEntries(
						pins.input.map((a) => [
							a,
							{
								type: "object",
								additionalProperties: {
									type: "array",
									items: {
										$ref: "#/definitions/RefMaybeConstantValue"
									}
								}
							}
						])
					)

					outputs = Object.fromEntries(
						pins.output.map((a) => [
							a,
							{
								type: "object",
								additionalProperties: {
									type: "array",
									items: {
										$ref: "#/definitions/RefMaybeConstantValue"
									}
								}
							}
						])
					)
				}

				Monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
					validate: true,
					schemas: [
						{
							uri: "qne://subentity-schema.json",
							fileMatch: ["qne://subentity.json"],
							schema: merge({}, getSchema(), {
								$ref: "#/definitions/SubEntity",
								definitions: {
									SubEntity: {
										properties: {
											properties: {
												properties: JSON.parse(json.stringify(props))
											},
											events: {
												properties: JSON.parse(json.stringify(outputs))
											},
											inputCopying: {
												properties: JSON.parse(json.stringify(inputs))
											},
											outputCopying: {
												properties: JSON.parse(json.stringify(outputs))
											}
										}
									}
								}
							})
						}
					]
				})
			})()
		}
	}

	export async function coloriseJSON(jsonData: any) {
		return await Monaco.editor.colorize(json.stringify(jsonData, "\t"), "json", {})
	}
</script>

<div bind:this={el} class="h-full" />

<style global>
	.monacoDecorationEntityRef {
		color: #858585 !important;
	}
</style>
