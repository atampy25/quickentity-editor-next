<script lang="ts">
	import MinimalTree from "$lib/components/MinimalTree.svelte"
	import { appSettings, entity, forceSaveSubEntity, intellisense, reverseReferences } from "$lib/stores"
	import { InlineLoading, Search } from "carbon-components-svelte"
	import debounce from "lodash/debounce"
	import { Pane, Splitpanes as SplitPanes } from "svelte-splitpanes"
	import { genRandHex, getReferencedLocalEntity, normaliseToHash, traverseEntityTree } from "$lib/utils"

	import type baklavaCore from "@baklavajs/core"
	import type baklavaRendererVue from "@baklavajs/renderer-vue"
	import ELK from "elkjs"

	import { onDestroy, onMount } from "svelte"
	import type { FullRef } from "$lib/quickentity-types"
	import { merge } from "lodash"
	import { v4 } from "uuid"
	import type { IEditorState } from "@baklavajs/core"
	import { readTextFile, exists as tauriExists } from "@tauri-apps/api/fs"
	import { join } from "@tauri-apps/api/path"
	import json from "$lib/json"

	const exists = async (path: string) => {
		try {
			return await tauriExists(path)
		} catch {
			return false
		}
	}

	let tree: MinimalTree
	let treeSearchInput: string
	let treeSearching: boolean = false

	const treeSearch = () => {
		treeSearching = true
		setTimeout(() => {
			tree.search(treeSearchInput)
			treeSearching = false
		}, 10)
	}

	let selectedEntityID: string | null

	const baklava: {
		createBaklava: (elem: Element) => { switchGraph: (graph: baklavaCore.Graph) => void; editor: baklavaCore.Editor; commandHandler: baklavaRendererVue.ICommandHandler }
		Core: typeof baklavaCore
		RendererVue: typeof baklavaRendererVue
	} = BaklavaJS

	let graphView: ReturnType<typeof baklava["createBaklava"]>
	let currentlyLoadingGraph = false

	let currentlyDisplayedFolder: string | null

	const elk = new ELK()

	onMount(async () => {
		graphView = baklava.createBaklava(document.getElementById("graph")!)

		document.getElementsByClassName(
			"baklava-toolbar"
		)[0].innerHTML += `<button class="baklava-toolbar-entry baklava-toolbar-button shepherd-formatGraphButton" title="Format Graph"><svg class="baklava-icon" fill="none" stroke="currentColor" width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"></path></svg></button>`
		;[...document.getElementsByClassName("baklava-toolbar")[0].children].at(-1).addEventListener("click", recomputeLayout)

		graphView.editor.graphEvents.addConnection.subscribe("addConnection", (connection) => {
			if (!currentlyLoadingGraph) {
				$entity.entities[connection.from.nodeId].events ??= {}
				$entity.entities[connection.from.nodeId].events![connection.from.name] ??= {}
				$entity.entities[connection.from.nodeId].events![connection.from.name]![connection.to.name] ??= []
				$entity.entities[connection.from.nodeId].events![connection.from.name]![connection.to.name]!.push(connection.to.nodeId)
			} else {
				// console.log("Ignored event due to loading graph", "addConnection")
			}
		})

		graphView.editor.graphEvents.removeConnection.subscribe("removeConnection", (connection) => {
			if (!currentlyLoadingGraph) {
				$entity.entities[connection.from.nodeId].events![connection.from.name]![connection.to.name] = $entity.entities[connection.from.nodeId].events![connection.from.name]![
					connection.to.name
				]!.filter((a) => getReferencedLocalEntity(a.value ? a.ref : a) != connection.to.nodeId)
			} else {
				// console.log("Ignored event due to loading graph", "removeConnection")
			}
		})

		graphView.editor.graphEvents.addNode.subscribe("addNode", async (node) => {
			if (!currentlyLoadingGraph) {
				$entity.entities["feed" + genRandHex(12)] = {
					parent: currentlyDisplayedFolder,
					name: node.title.replace(/<br>.*/gi, ""),
					factory: node.type,
					blueprint: (await exists(await join($appSettings.gameFileExtensionsDataPath, "TEMP", node.type + ".TEMP.entity.json")))
						? json.parse(await readTextFile(await join($appSettings.gameFileExtensionsDataPath, "TEMP", node.type + ".TEMP.entity.json"))).tbluHash
						: json.parse(await readTextFile(await join($appSettings.gameFileExtensionsDataPath, "CPPT", node.type + ".CPPT.meta.JSON"))).hash_reference_data[
								json.parse(await readTextFile(await join($appSettings.gameFileExtensionsDataPath, "CPPT", node.type + ".CPPT.json"))).blueprintIndexInResourceHeader
						  ].hash
				}

				await displayGraphForFolder(currentlyDisplayedFolder!)
			} else {
				// console.log("Ignored event due to loading graph", "addNode")
			}
		})

		graphView.editor.graphEvents.removeNode.subscribe("removeNode", (node) => {
			if (!currentlyLoadingGraph) {
				delete $entity.entities[node.id]
			} else {
				// console.log("Ignored event due to loading graph", "removeNode")
			}
		})
	})

	const unsubscribe = forceSaveSubEntity.subscribe((value) => {
		if (value.value && graphView && Object.keys($entity.entities).every((a) => graphView.editor.graph.nodes.some((b) => b.id == a))) {
			for (const node of graphView.editor.graph.nodes) {
				$entity.entities[node.id].name = node.title.replace(/<br>.*/gi, "")
			}
		}
	})

	onDestroy(unsubscribe)

	export async function displayGraphForFolder(folderEntityID: string) {
		currentlyLoadingGraph = true
		currentlyDisplayedFolder = folderEntityID

		// recursive
		const entitiesInFolderSet = new Set(traverseEntityTree($entity, folderEntityID, $reverseReferences))
		const entitiesInFolder = [...entitiesInFolderSet]

		const graph: IEditorState = {
			graph: {
				id: v4(),
				nodes: [],
				connections: [],
				inputs: [],
				outputs: []
			},
			graphTemplates: []
		}

		for (const nodeType of graphView.editor.nodeTypes.keys()) {
			graphView.editor.unregisterNodeType(nodeType)
		}

		const readableNodeTypeNames: Record<string, string> = {}

		for (const childEntityID of Object.keys($entity.entities)) {
			const childEntity = $entity.entities[childEntityID]
			readableNodeTypeNames[normaliseToHash(childEntity.factory)] ??= childEntity.factory
			if (childEntity.factory.includes(":")) {
				readableNodeTypeNames[normaliseToHash(childEntity.factory)] ??= childEntity.factory
			}
		}

		for (const childEntityID of entitiesInFolder) {
			const childEntity = $entity.entities[childEntityID]

			let placeNode = false

			if (!graphView.editor.nodeTypes.get(normaliseToHash(childEntity.factory))) {
				let pins = { input: [], output: [] }

				for (const childEntityID of entitiesInFolder) {
					if (normaliseToHash($entity.entities[childEntityID].factory) == normaliseToHash(childEntity.factory)) {
						await $intellisense.getPins($entity, childEntityID, true, pins)
					}
				}

				pins.input = [...new Set(pins.input)]
				pins.output = [...new Set(pins.output)]

				if (pins.input.length || pins.output.length) {
					placeNode = true

					const typeSanitiser = new DOMParser().parseFromString(`<div></div>`, "text/html")
					typeSanitiser.querySelector("div")!.innerText = normaliseToHash(childEntity.factory)

					const titleSanitiser = new DOMParser().parseFromString(`<div></div>`, "text/html")
					titleSanitiser.querySelector("div")!.innerText = readableNodeTypeNames[normaliseToHash(childEntity.factory)]

					graphView.editor.registerNodeType(
						baklava.Core.defineNode({
							type: typeSanitiser.querySelector("div")!.innerHTML,
							title: titleSanitiser.querySelector("div")!.innerHTML,
							inputs: Object.fromEntries(
								pins.input.map((a) => {
									const sanitiser = new DOMParser().parseFromString(`<div></div>`, "text/html")
									sanitiser.querySelector("div")!.innerText = a

									return ["in_" + btoa(a), () => new baklava.Core.NodeInterface(sanitiser.querySelector("div")!.innerHTML, 0)]
								})
							),
							outputs: Object.fromEntries(
								pins.output.map((a) => {
									const sanitiser = new DOMParser().parseFromString(`<div></div>`, "text/html")
									sanitiser.querySelector("div")!.innerText = a

									return ["out_" + btoa(a), () => new baklava.Core.NodeInterface(sanitiser.querySelector("div")!.innerHTML, 0)]
								})
							)
						})
					)
				}
			} else {
				let pins = { input: [], output: [] }

				for (const childEntityID of entitiesInFolder) {
					if (normaliseToHash($entity.entities[childEntityID].factory) == normaliseToHash(childEntity.factory)) {
						await $intellisense.getPins($entity, childEntityID, true, pins)
					}
				}

				pins.input = [...new Set(pins.input)]
				pins.output = [...new Set(pins.output)]

				if (pins.input.length || pins.output.length) {
					placeNode = true
				}
			}

			if (placeNode) {
				const foundNodeType = graphView.editor.nodeTypes.get(normaliseToHash(childEntity.factory))!.type

				const elem = new DOMParser().parseFromString(`<div><span class="mt-1 text-gray-200 text-xs"></span></div>`, "text/html")
				elem.querySelector("span")!.innerText = readableNodeTypeNames[normaliseToHash(childEntity.factory)]

				const elem2 = new DOMParser().parseFromString(`<div></div>`, "text/html")
				elem2.querySelector("div")!.innerText = childEntity.name

				graph.graph.nodes.push(
					merge(new foundNodeType(), {
						id: childEntityID,
						title: elem2.querySelector("div")!.innerHTML + `<br>` + elem.querySelector("div")!.innerHTML,
						width: 250,
						twoColumn: false,
						position: { x: 0, y: 0 }
					})
				)
			}
		}

		for (const childEntityID of entitiesInFolder) {
			const childEntity = $entity.entities[childEntityID]
			if (childEntity.events) {
				for (const [event, data] of Object.entries(childEntity.events)) {
					for (const [trigger, refs] of Object.entries(data)) {
						for (const ref of refs) {
							if (ref) {
								const localRef = getReferencedLocalEntity(typeof ref != "string" && Object.hasOwn(ref, "value") ? ref.ref : (ref as FullRef))
								if (localRef) {
									if (
										graph.graph.nodes.some((a) => a.id == childEntityID) &&
										graph.graph.nodes.some((a) => a.id == localRef) &&
										graph.graph.nodes.find((a) => a.id == childEntityID)!.outputs["out_" + btoa(event)] &&
										graph.graph.nodes.find((a) => a.id == localRef)!.inputs["in_" + btoa(trigger)]
									) {
										graph.graph.connections.push({
											id: v4(),
											from: graph.graph.nodes.find((a) => a.id == childEntityID)!.outputs["out_" + btoa(event)].id,
											to: graph.graph.nodes.find((a) => a.id == localRef)!.inputs["in_" + btoa(trigger)].id
										})
									}
								}
							}
						}
					}
				}
			}
		}

		graphView.editor.load(graph)

		await recomputeLayout()
		setTimeout(async () => await recomputeLayout(), 500)
	}

	export async function recomputeLayout() {
		currentlyLoadingGraph = true

		const elkGraph = {
			id: "root",
			layoutOptions: { "elk.algorithm": "layered" },
			children: graphView.editor.graph.nodes.map((a) => {
				return {
					id: a.id,
					width: (document.querySelector(".baklava-node#" + a.id) || { clientWidth: 250 }).clientWidth + 30,
					height: (document.querySelector(".baklava-node#" + a.id) || { clientHeight: 150 }).clientHeight + 30,
					x: a.position.x,
					y: a.position.y
				}
			}),
			edges: graphView.editor.graph.connections.map((a) => {
				return {
					id: a.id,
					sources: [a.from.nodeId],
					targets: [a.to.nodeId]
				}
			})
		}

		await elk.layout(elkGraph)

		for (const child of elkGraph.children) {
			graphView.editor.graph.findNodeById(child.id)!.position.x = child.x
			graphView.editor.graph.findNodeById(child.id)!.position.y = child.y
		}

		graphView.editor.load(graphView.editor.save())
		graphView.editor.graph.panning = { x: 275, y: 80 }

		currentlyLoadingGraph = false
	}
</script>

<SplitPanes theme="">
	<Pane>
		<div class="flex flex-col h-full shepherd-graphTree p-2 px-3">
			<div class="flex flex-row gap-4 items-center">
				<h1>Tree</h1>
				<div class="flex-grow flex flex-row gap-4 items-center">
					<Search
						size="lg"
						placeholder="Filter tree entities (press Enter to search)"
						on:keyup={(evt) => {
							if (evt.code == "Enter") {
								treeSearch()
							}
						}}
						bind:value={treeSearchInput}
					/>
					{#if treeSearching}
						<div>
							<InlineLoading />
						</div>
					{/if}
				</div>
			</div>
			<div class="flex-grow overflow-auto">
				<MinimalTree
					entity={$entity}
					reverseReferences={$reverseReferences}
					bind:this={tree}
					on:selectionUpdate={async ({ detail }) => {
						if (!detail[1].node.id.startsWith("comment-")) {
							selectedEntityID = detail[1].node.id
							await displayGraphForFolder(detail[1].node.id)
						}
					}}
					on:nodeRenamed={async ({ detail }) => {
						if (!detail[1].node.id.startsWith("comment")) {
							$entity.entities[detail[1].node.id].name = detail[1].text.replace(/ \(ref .*\)/gi, "")
							if (currentlyDisplayedFolder) {
								await displayGraphForFolder(currentlyDisplayedFolder)
							}
						} else {
							$entity.comments[detail[1].node.id.replace("comment-", "")].name = detail[1].text.replace(/ \(comment\)/gi, "")
						}
					}}
				/>
			</div>
		</div>
	</Pane>
	<Pane>
		<div class="flex flex-col h-full shepherd-graph p-2 px-3">
			<h1>Graph</h1>
			<div class="mt-1 flex-grow overflow-auto">
				<div id="graph" class="h-full w-full" />
			</div>
		</div>
	</Pane>
</SplitPanes>

<style global>
	button.baklava-toolbar-button[title="Copy"] {
		display: none;
	}
	button.baklava-toolbar-button[title="Paste"] {
		display: none;
	}
	button.baklava-toolbar-button[title="Create Subgraph"] {
		display: none;
	}
	.__title-label {
		overflow-wrap: anywhere;
	}
	.baklava-context-menu > .item:first-child {
		display: none;
	}
</style>
