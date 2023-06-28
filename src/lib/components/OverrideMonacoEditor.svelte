<script lang="ts">
	import * as monaco from "monaco-editor"
	import { createEventDispatcher, onMount } from "svelte"
	import editorWorker from "monaco-editor/esm/vs/editor/editor.worker?worker"
	import jsonWorker from "monaco-editor/esm/vs/language/json/json.worker?worker"
	import cssWorker from "monaco-editor/esm/vs/language/css/css.worker?worker"
	import htmlWorker from "monaco-editor/esm/vs/language/html/html.worker?worker"
	import tsWorker from "monaco-editor/esm/vs/language/typescript/ts.worker?worker"
	import type { Property } from "$lib/quickentity-types"
	import { appSettings, intellisense } from "$lib/stores"
	import json from "$lib/json"
	import { v4 } from "uuid"
	import { appDir, join } from "@tauri-apps/api/path"
	import { exists as tauriExists } from "@tauri-apps/api/fs"
	import { getSchema } from "$lib/utils"
	import merge from "lodash/merge"

	const exists = async (path: string) => {
		try {
			return await tauriExists(path)
		} catch {
			return false
		}
	}

	let el: HTMLDivElement = null!
	let Monaco: typeof monaco

	export let editor: monaco.editor.IStandaloneCodeEditor = null!

	export let jsonToDisplay: Record<string, Property>

	const id = v4()

	const dispatch = createEventDispatcher()

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
			model = Monaco.editor.createModel("The JSON for the selected entity will appear here. You're using QuickEntity Editor 3.0.", "json", Monaco.Uri.parse("qne://property" + id + ".json"))
		} catch {
			model = Monaco.editor.getModel(Monaco.Uri.parse("qne://property" + id + ".json"))
		}

		editor = Monaco.editor.create(el, {
			model,
			roundedSelection: false,
			theme: "theme"
		})

		Monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
			validate: true,
			schemas: [
				{
					uri: "qne://property-schema.json", // id of the first schema
					fileMatch: ["qne://property" + id + ".json"], // associate with our model
					schema: merge({}, getSchema(), {
						$ref: "#/definitions/SubEntity/properties/properties"
					})
				}
			]
		})

		let decorations: monaco.editor.IEditorDecorationsCollection = editor.createDecorationsCollection([])

		const repoIDstoNames = $appSettings.gameFileExtensions ? await $intellisense.getRepoIDsToNames() : []

		editor.onDidChangeModelContent(async (e) => {
			dispatch("contentChanged", editor.getValue())

			if ($appSettings.gameFileExtensions) {
				const decorationsArray: monaco.editor.IModelDeltaDecoration[] = []

				for (const [no, line] of editor.getValue().split("\n").entries()) {
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
		})

		return () => {
			editor.dispose()
		}
	})

	$: if (editor && jsonToDisplay) {
		editor.setValue(json.stringify(jsonToDisplay, "\t"))
		el.style.height = Monaco.editor.getModel(Monaco.Uri.parse("qne://property" + id + ".json"))!.getLineCount() * 19 + "px"
		editor.layout()
	}
</script>

<div bind:this={el} class="mt-1 h-full" />

<style global>
	.monacoDecorationEntityRef {
		color: #858585 !important;
	}
</style>
