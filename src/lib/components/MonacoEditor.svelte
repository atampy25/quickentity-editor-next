<script lang="ts">
	import type monaco from "monaco-editor"
	import { onMount } from "svelte"
	import editorWorker from "monaco-editor/esm/vs/editor/editor.worker?worker"
	import jsonWorker from "monaco-editor/esm/vs/language/json/json.worker?worker"
	import cssWorker from "monaco-editor/esm/vs/language/css/css.worker?worker"
	import htmlWorker from "monaco-editor/esm/vs/language/html/html.worker?worker"
	import tsWorker from "monaco-editor/esm/vs/language/typescript/ts.worker?worker"
	import type { SubEntity } from "$lib/quickentity-types"
	import json from "$lib/json"

	let el: HTMLDivElement = null!
	let Monaco: typeof monaco

	export let editor: monaco.editor.IStandaloneCodeEditor = null!

	export let jsonToDisplay: SubEntity

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

		editor = Monaco.editor.create(el, {
			value: "The JSON for the selected entity will appear here. You're using QuickEntity Editor 3.0.",
			language: "json",
			roundedSelection: false,
			theme: "theme",
			fontFamily: "Fira Code",
			fontLigatures: true
		})

		return () => {
			editor.dispose()
		}
	})

	$: editor && jsonToDisplay && editor.setValue(json.stringify(jsonToDisplay, "\t"))
</script>

<div bind:this={el} class="h-full" />
