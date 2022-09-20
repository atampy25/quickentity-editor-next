<script lang="ts">
	import type monaco from "monaco-editor"
	import { createEventDispatcher, onMount } from "svelte"
	import editorWorker from "monaco-editor/esm/vs/editor/editor.worker?worker"
	import jsonWorker from "monaco-editor/esm/vs/language/json/json.worker?worker"
	import cssWorker from "monaco-editor/esm/vs/language/css/css.worker?worker"
	import htmlWorker from "monaco-editor/esm/vs/language/html/html.worker?worker"
	import tsWorker from "monaco-editor/esm/vs/language/typescript/ts.worker?worker"
	import type { Entity, SubEntity } from "$lib/quickentity-types"
	import json from "$lib/json"
	import schema from "$lib/schema.json"
	import { appSettings, intellisense } from "$lib/stores"
	import merge from "lodash/merge"
	import { basename, dirname, join } from "@tauri-apps/api/path"
	import { readDir, readTextFile, exists as tauriExists } from "@tauri-apps/api/fs"
	import { normaliseToHash } from "$lib/utils"

	let el: HTMLDivElement = null!
	let Monaco: typeof monaco

	export let editor: monaco.editor.IStandaloneCodeEditor = null!

	export let entity: Entity
	export let jsonToDisplay: SubEntity
	export let subEntityID: string

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

		let props: Record<string, any> = {}

		if ($appSettings.gameFileExtensions) {
			let allFoundProperties = []

			for (let template of (await exists(await join($appSettings.gameFileExtensionsDataPath, "ASET", normaliseToHash(jsonToDisplay.template) + ".ASET.meta.JSON")))
				? json
						.parse(await readTextFile(await join($appSettings.gameFileExtensionsDataPath, "ASET", normaliseToHash(jsonToDisplay.template) + ".ASET.meta.JSON")))
						.hash_reference_data.slice(0, -1)
						.map((a) => a.hash)
				: [normaliseToHash(jsonToDisplay.template)]) {
				if (await exists(await join($appSettings.gameFileExtensionsDataPath, "TEMP", template + ".TEMP.entity.json"))) {
					await $intellisense.findProperties(await join($appSettings.gameFileExtensionsDataPath, "TEMP", template + ".TEMP.entity.json"), allFoundProperties)
					jsonToDisplay.propertyAliases && allFoundProperties.push(...Object.keys(jsonToDisplay.propertyAliases))
				} else if ($intellisense.knownCPPTProperties[template]) {
					allFoundProperties.push(...Object.keys($intellisense.knownCPPTProperties[template]))
				} else if ($intellisense.allUICTs.has(template)) {
					allFoundProperties.push(...Object.keys($intellisense.knownCPPTProperties["002C4526CC9753E6"])) // All UI controls have the properties of ZUIControlEntity
					allFoundProperties.push(
						...Object.keys(
							json.parse(
								await readTextFile(
									await join(
										"./intellisense-data/UICB",
										json
											.parse(await readTextFile(await join($appSettings.gameFileExtensionsDataPath, "UICT", template + ".UICT.meta.JSON")))
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

			if ($intellisense.knownCPPTProperties[normaliseToHash(jsonToDisplay.template)]) {
				for (let foundProp of allFoundProperties) {
					props[foundProp] = {
						type: "object",
						properties: {
							type: {
								type: "string",
								description: "The type of the property.",
								const: $intellisense.knownCPPTProperties[normaliseToHash(jsonToDisplay.template)][foundProp][0]
							},
							value: {
								description: "The value of the property.",
								default: $intellisense.knownCPPTProperties[normaliseToHash(jsonToDisplay.template)][foundProp][1]
							}
						},
						default: {
							type: $intellisense.knownCPPTProperties[normaliseToHash(jsonToDisplay.template)][foundProp][0],
							value: $intellisense.knownCPPTProperties[normaliseToHash(jsonToDisplay.template)][foundProp][1]
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
									description: "The type of the property.",
									const: val.type
								},
								value: {
									description: "The value of the property.",
									default: val.value
								}
							},
							default: val
						}
					}
				}
			}
		}

		Monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
			validate: true,
			schemas: [
				{
					uri: "qne://subentity-schema.json", // id of the first schema
					fileMatch: ["qne://subentity.json"], // associate with our model
					schema: merge({}, schema, {
						$ref: "#/definitions/SubEntity",
						definitions: {
							SubEntity: {
								properties: {
									properties: {
										properties: JSON.parse(json.stringify(props))
									}
								}
							}
						}
					})
				}
			]
		})

		editor.onDidChangeModelContent((e) => {
			dispatch("contentChanged")
		})

		return () => {
			editor.dispose()
		}
	})

	$: {
		if (editor && jsonToDisplay) {
			editor.setValue(json.stringify(jsonToDisplay, "\t"))
			editor.layout()
		}
	}
</script>

<div bind:this={el} class="h-full" />
