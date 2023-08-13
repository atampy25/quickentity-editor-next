<script lang="ts">
	import jQuery from "jquery"
	import "jstree"
	import "./treeview.css"

	import { sanitise } from "$lib/utils"

	import { createEventDispatcher, onDestroy, onMount } from "svelte"
	import { v4 } from "uuid"
	import { readDir } from "@tauri-apps/api/fs"
	import { basename } from "@tauri-apps/api/path"
	import { watch } from "tauri-plugin-fs-watch"

	export let directory: string

	export let currentlySelected: string | null = null

	export const elemID = "tree-" + v4().replaceAll("-", "")

	export let tree: JSTree = null!

	let unlisten = () => {}

	const dispatch = createEventDispatcher()

	onMount(async () => {
		jQuery("#" + elemID).jstree({
			core: {
				multiple: false,
				data: [],
				themes: {
					name: "default",
					dots: true,
					icons: true
				},
				check_callback: true,
				force_text: true
			},
			sort: function (a: any, b: any) {
				if (
					(!(this.get_node(a).original ? this.get_node(a).original : this.get_node(a)).folder && !(this.get_node(b).original ? this.get_node(b).original : this.get_node(b)).folder) ||
					((this.get_node(a).original ? this.get_node(a).original : this.get_node(a)).folder && (this.get_node(b).original ? this.get_node(b).original : this.get_node(b)).folder)
				) {
					return this.get_text(a).localeCompare(this.get_text(b), undefined, { numeric: true, sensitivity: "base" }) > 0 ? 1 : -1
				} else {
					return (this.get_node(a).original ? this.get_node(a).original : this.get_node(a)).folder ? -1 : 1
				}
			},
			plugins: ["sort"]
		})

		tree = jQuery("#" + elemID).jstree()

		jQuery("#" + elemID).on("changed.jstree", (...data) => {
			if (data[1].action == "select_node" && data[1].node.id != currentlySelected) {
				const prev = currentlySelected!
				currentlySelected = data[1].node.id

				if (!(currentlySelected!.endsWith("entity.json") || currentlySelected!.endsWith("entity.patch.json"))) {
					select(prev)
				} else {
					dispatch("selectionChange", data)
				}
			}
		})

		unlisten = await watch(directory, (evt) => {
			if (!evt.path.endsWith("project.json")) {
				void refreshTree()
			}
		})
	})

	onDestroy(unlisten)

	let isRefreshing = false

	export async function refreshTree() {
		if (!isRefreshing) {
			const entries = await readDir(directory, { recursive: true })
			let files: [string, string, boolean][] = []

			const recurse = (entry: typeof entries[number], parent: string) => {
				if (entry.name) {
					files.push([entry.path, parent, !!entry.children])
				}

				if (entry.children?.length) {
					for (const child of entry.children) {
						recurse(child, entry.path)
					}
				}
			}

			for (const entry of entries) {
				recurse(entry, "#")
			}

			tree.settings!.core.data = []

			for (const [path, parent, isDir] of files) {
				tree.settings!.core.data.push({
					id: path,
					parent: parent,
					icon: isDir ? "far fa-folder" : path.endsWith("entity.json") || path.endsWith("entity.patch.json") ? "far fa-pen-to-square" : "far fa-file",
					text: `${sanitise(await basename(path))}`,
					folder: isDir
				})
			}

			setTimeout(() => {
				try {
					tree.get_node(currentlySelected, true)[0].scrollIntoView()
				} catch {}
			}, 100)

			tree.refresh()
		}
	}

	export function select(id: string) {
		if (id) {
			tree.deselect_node(currentlySelected)
			tree.select_node(id)
		} else {
			deselect()
		}
	}

	export function deselect() {
		tree.deselect_all()
		currentlySelected = null
	}

	$: directory, refreshTree()
</script>

<div id={elemID} />
