<svelte:options accessors />

<script lang="ts">
	import * as monaco from "monaco-editor"
	import { createEventDispatcher, onDestroy, onMount } from "svelte"
	import editorWorker from "monaco-editor/esm/vs/editor/editor.worker?worker"
	import jsonWorker from "monaco-editor/esm/vs/language/json/json.worker?worker"
	import cssWorker from "monaco-editor/esm/vs/language/css/css.worker?worker"
	import htmlWorker from "monaco-editor/esm/vs/language/html/html.worker?worker"
	import tsWorker from "monaco-editor/esm/vs/language/typescript/ts.worker?worker"
	import type { Entity, FullRef, Property, SubEntity } from "$lib/quickentity-types"
	import json from "$lib/json"
	import { addNotification, appSettings, intellisense } from "$lib/stores"
	import merge from "lodash/merge"
	import { appDir, basename, dirname, join } from "@tauri-apps/api/path"
	import { readDir, readTextFile, exists as tauriExists } from "@tauri-apps/api/fs"
	import { getReferencedExternalEntities, getSchema, normaliseToHash } from "$lib/utils"
	import { gameServer } from "$lib/in-vivo/gameServer"
	import { Modal } from "carbon-components-svelte"
	import GraphRenderer from "./GraphRenderer.svelte"
	import debounce from "lodash/debounce"

	let el: HTMLDivElement = null!
	export let Monaco: typeof monaco

	export let editor: monaco.editor.IStandaloneCodeEditor = null!

	export let entity: Entity
	export let jsonToDisplay: SubEntity
	export let subEntityID: string
	export let inVivoExtensions: boolean

	const safeToSync = new Set([
		"SMatrix43",
		"float32",
		"bool",
		"SColorRGB",
		"ZString",
		"SVector3",
		"int32",
		"uint8",
		"SVector2",
		"uint32",
		"ZGuid",
		"ZCurve",
		"SColorRGBA",
		"ZGameTime",
		"TArray<ZGameTime>",
		"TArray<bool>",
		"TArray<SGaitTransitionEntry>",
		"TArray<SMapMarkerData>",
		"uint64",
		"TArray<int32>",
		"TArray<SConversationPart>",
		"SBodyPartDamageMultipliers",
		"TArray<SVector2>",
		"TArray<ZSharedSensorDef.SVisibilitySetting>",
		"TArray<ZString>",
		"TArray<STargetableBoneConfiguration>",
		"TArray<ZSecuritySystemCameraConfiguration.SHitmanVisibleEscalationRule>",
		"TArray<ZSecuritySystemCameraConfiguration.SDeadBodyVisibleEscalationRule>",
		"S25DProjectionSettings",
		"SVector4",
		"TArray<SClothVertex>",
		"TArray<SFontLibraryDefinition>",
		"TArray<SCamBone>",
		"TArray<SVector3>",
		"TArray<ZHUDOccluderTriggerEntity.SBoneTestSetup>",
		"uint16",
		"SWorldSpaceSettings",
		"SCCEffectSet",
		"TArray<AI.SFirePattern01>",
		"TArray<AI.SFirePattern02>",
		"SSCCuriousConfiguration",
		"TArray<SColorRGB>"
	])

	const dispatch = createEventDispatcher()

	const exists = async (path: string) => {
		try {
			return await tauriExists(path)
		} catch {
			return false
		}
	}

	let showCurvePreview = false
	let curveToPreview = null

	let destroyFunc = () => {}

	onDestroy(destroyFunc)

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
			theme: "theme",
			minimap: {
				enabled: !$appSettings.compactMode
			}
		})

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
		const showPreviewCurveCondition = customContextKey("showPreviewCurveCondition", false)
		const showFollowReferenceCondition = customContextKey("showFollowReferenceCondition", false)

		editor.onDidChangeCursorPosition((e) => {
			try {
				json.parse(editor.getValue())
			} catch {
				return
			}

			let word: string | undefined | false
			try {
				word = editor.getModel()!.getWordAtPosition(e.position)?.word
			} catch {
				word = false
			}

			if (!word || !inVivoExtensions || !gameServer.active) {
				showUpdatePropertyCondition.set(false)
			} else {
				showUpdatePropertyCondition.set(!!(json.parse(editor.getValue()).properties && json.parse(editor.getValue()).properties[word]))
			}

			if (!word) {
				showPreviewCurveCondition.set(false)
			} else {
				showPreviewCurveCondition.set(
					json.parse(editor.getValue()).properties && json.parse(editor.getValue()).properties[word] && json.parse(editor.getValue()).properties[word].type === "ZCurve"
				)
			}

			if (!word) {
				showFollowReferenceCondition.set(false)
			} else {
				showFollowReferenceCondition.set(Object.keys(entity.entities).includes(word))
			}
		})

		editor.addAction({
			id: "update-property",
			label: "Update property in-game",
			contextMenuGroupId: "navigation",
			contextMenuOrder: 0,
			keybindings: [],
			precondition: "showUpdatePropertyCondition",
			run: async (ed) => {
				const propertyName = editor.getModel()!.getWordAtPosition(ed.getPosition()!)!.word

				await gameServer.updateProperty(subEntityID, entity.tbluHash, propertyName, json.parse(editor.getValue()).properties[propertyName])

				$addNotification = {
					kind: "success",
					title: "Property updated",
					subtitle: `The value of the ${propertyName} property should now be reflected in-game.`
				}
			}
		})

		editor.addAction({
			id: "preview-curve",
			label: "Preview curve",
			contextMenuGroupId: "navigation",
			contextMenuOrder: 0,
			keybindings: [],
			precondition: "showPreviewCurveCondition",
			run: async (ed) => {
				const propertyName = editor.getModel()!.getWordAtPosition(ed.getPosition()!)!.word

				curveToPreview = json.parse(editor.getValue()).properties[propertyName].value.data

				showCurvePreview = true
			}
		})

		editor.addAction({
			id: "follow-reference",
			label: "Follow reference",
			contextMenuGroupId: "navigation",
			contextMenuOrder: 0,
			keybindings: [monaco.KeyCode.F12],
			precondition: "showFollowReferenceCondition",
			run: async (ed) => {
				dispatch("followRef", editor.getModel()!.getWordAtPosition(ed.getPosition()!)!.word)
			}
		})

		let decorations: monaco.editor.IEditorDecorationsCollection = editor.createDecorationsCollection([])

		const idsToRefsExternal = getReferencedExternalEntities(jsonToDisplay, entity.entities)
			.filter((a) => a.entity && typeof a.entity !== "string")
			.map((a) => a.entity as FullRef)
			.map((a) => [a.ref, a]) as unknown as [string, FullRef][]

		const idsToNamesInternal = Object.entries(entity.entities).map((a) => [a[0], a[1].name])

		const repoIDstoNames = $appSettings.gameFileExtensions ? await $intellisense.getRepoIDsToNames() : []

		destroyFunc = Monaco.languages.registerHoverProvider("json", {
			async provideHover(model, position) {
				for (const [id, name] of idsToNamesInternal) {
					if (model.getValue().split("\n")[position.lineNumber - 1].includes(id)) {
						return {
							contents: [
								{
									value: "```json\n" + json.stringify(entity.entities[id], "\t") + "\n```"
								}
							]
						}
					}
				}

				if ($appSettings.gameFileExtensions) {
					for (const [id, name] of repoIDstoNames) {
						if (model.getValue().split("\n")[position.lineNumber - 1].includes(id)) {
							return {
								contents: [
									{
										value:
											"```json\n" +
											JSON.stringify(
												(await $intellisense.getRepository()).find((a) => a["ID_"] === id),
												undefined,
												"\t"
											) +
											"\n```"
									}
								]
							}
						}
					}

					for (const [id, ref] of idsToRefsExternal) {
						if (model.getValue().split("\n")[position.lineNumber - 1].includes(id)) {
							const e = await $intellisense.getEntityByFactory(ref.externalScene!)

							if (e) {
								return {
									contents: [
										{
											value: "```json\n" + json.stringify(e.entities[ref.ref], "\t") + "\n```"
										}
									]
								}
							}
						}
					}
				}

				return {
					contents: []
				}
			}
		}).dispose

		const refreshDecorations = async () => {
			const decorationsArray: monaco.editor.IModelDeltaDecoration[] = []

			for (const [no, line] of editor.getValue().split("\n").entries()) {
				if ($appSettings.gameFileExtensions) {
					for (const [id, ref] of idsToRefsExternal) {
						if (line.includes(id)) {
							const e = await $intellisense.getEntityByFactory(ref.externalScene!)

							if (e) {
								decorationsArray.push({
									options: {
										isWholeLine: true,
										after: {
											content: " " + e.entities[ref.ref].name,
											cursorStops: monaco.editor.InjectedTextCursorStops.Left,
											inlineClassName: "monacoDecorationEntityRef"
										}
									},
									range: new monaco.Range(no + 1, 0, no + 1, line.length + 1)
								})
							}
						}
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

				for (const [id, name] of repoIDstoNames) {
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

		const syncToEditor = debounce(async () => {
			if (gameServer.active) {
				for (const [property, value] of Object.entries((json.parse(editor.getValue()) as SubEntity).properties || {})) {
					if (property === "m_mTransform" && value.type === "SMatrix43") {
						await gameServer.setTransform(subEntityID, entity.tbluHash, value.value, !!(json.parse(editor.getValue()) as SubEntity).properties?.m_eidParent)
					} else if (safeToSync.has(value.type)) {
						await gameServer.updateProperty(subEntityID, entity.tbluHash, property, value)
					}
				}
			}
		}, 800)

		await refreshDecorations()

		editor.onDidChangeModelContent(async (e) => {
			dispatch("contentChanged")

			try {
				json.parse(editor.getValue())
			} catch {
				return
			}

			await refreshDecorations()
			await syncToEditor()
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
					let allFoundProperties: string[] = []

					for (let factory of (await exists(await join($appSettings.gameFileExtensionsDataPath, "ASET", normaliseToHash(jsonToDisplay.factory) + ".ASET.meta.JSON")))
						? json
								.parse(await readTextFile(await join($appSettings.gameFileExtensionsDataPath, "ASET", normaliseToHash(jsonToDisplay.factory) + ".ASET.meta.JSON")))
								.hash_reference_data.slice(0, -1)
								.map((a) => a.hash)
						: [normaliseToHash(jsonToDisplay.factory)]) {
						if ($intellisense.knownCPPTProperties[factory]) {
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
						} else {
							const e = await $intellisense.getEntityByFactory(factory)

							if (e) {
								await $intellisense.findProperties(e, allFoundProperties)
								jsonToDisplay.propertyAliases && allFoundProperties.push(...Object.keys(jsonToDisplay.propertyAliases))
							}
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
							let val = await $intellisense.findDefaultPropertyValue(entity, subEntityID, foundProp, subEntityID)

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

<Modal passiveModal bind:open={showCurvePreview} modalHeading="Curve preview">
	{#if curveToPreview}
		<GraphRenderer {curveToPreview} />
	{/if}
</Modal>

<style global>
	.monacoDecorationEntityRef {
		color: #858585 !important;
	}
</style>
