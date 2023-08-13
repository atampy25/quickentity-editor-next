<script lang="ts">
	import type monaco from "monaco-editor"
	import type { CommentEntity, SubEntity } from "$lib/quickentity-types"

	import MonacoEditor from "$lib/components/MonacoEditor.svelte"
	import Tree from "$lib/components/Tree.svelte"
	import ExpandableSection from "$lib/components/ExpandableSection.svelte"
	import ColorPicker from "$lib/components/ColorPicker.svelte"

	import { addNotification, appSettings, entity, sessionMetadata, references, reverseReferences, saveWorkAndCallback, workspaceData } from "$lib/stores"
	import { changeReferenceToLocalEntity, checkValidityOfEntity, deleteReferencesToEntity, genRandHex, normaliseToHash, traverseEntityTree } from "$lib/utils"
	import json from "$lib/json"

	import enums from "$lib/enums.json"

	import { Pane, Splitpanes as SplitPanes } from "svelte-splitpanes"
	import { Button, ClickableTile, InlineLoading, Modal, Search, Select, TextArea, TextInput } from "carbon-components-svelte"
	import isEqual from "lodash/isEqual"
	import { join } from "@tauri-apps/api/path"
	import { readTextFile, exists as tauriExists, writeTextFile } from "@tauri-apps/api/fs"
	import { writeText } from "@tauri-apps/api/clipboard"
	import mergeWith from "lodash/mergeWith"
	import { gameServer } from "$lib/in-vivo/gameServer"
	import { onDestroy, onMount } from "svelte"

	const readJSON = async (path: string) => json.parse(await readTextFile(path))
	const exists = async (path: string) => {
		try {
			return await tauriExists(path)
		} catch {
			return false
		}
	}

	const deepMerge = (a: any, b: any) =>
		mergeWith(a, b, (orig: any, src: any) => {
			if (Array.isArray(orig)) {
				return src
			}
		})

	let editor: monaco.editor.IStandaloneCodeEditor

	let selectionType: "comment" | "entity" | null = null

	let selectedEntityID: string
	let selectedEntity: SubEntity

	let selectedComment: number

	let tree: Tree

	let editorIsValid: boolean = true
	let editorInvalidMessage: string

	window.onresize = () => editor?.layout()

	let treeSearchInput: string
	let treeSearching: boolean = false

	const treeSearch = () => {
		treeSearching = true
		setTimeout(() => {
			tree.search(treeSearchInput)
			treeSearching = false
		}, 10)
	}

	let evaluationPaneInput = ""

	function checkEditorValidity(entityID: string, data: string) {
		try {
			json.parse(data)
		} catch {
			editorIsValid = false
			editorInvalidMessage = "Invalid JSON"
			return
		}

		const invalid = checkValidityOfEntity($entity, json.parse(data))
		if (!invalid) {
			editorIsValid = true
		} else {
			editorIsValid = false
			editorInvalidMessage = invalid
			return
		}
	}

	async function attemptToSelect(entityID: string) {
		if (selectionType == "entity") {
			if (editorIsValid) {
				$entity.entities[selectedEntityID] = json.parse(editor.getValue())
			} else {
				tree.navigateTo(selectedEntityID)
				return
			}
		}

		selectionType = entityID.startsWith("comment") ? "comment" : "entity"

		if (selectionType == "entity") {
			selectedEntityID = entityID
			selectedEntity = $entity.entities[entityID]

			if ($workspaceData.path) {
				if (await exists(await join($workspaceData.path, "project.json"))) {
					await writeTextFile(
						await join($workspaceData.path, "project.json"),
						JSON.stringify(
							deepMerge(JSON.parse(await readTextFile(await join($workspaceData.path, "project.json"))), {
								treeViewState: {
									[$entity.tempHash]: {
										selectedEntity: selectedEntityID
									}
								}
							})
						)
					)
				}
			}
		} else {
			selectedComment = Number(entityID.replace("comment-", ""))
		}
	}

	const unsubscribe = saveWorkAndCallback.subscribe(async (value) => {
		if (value) {
			if (editorIsValid && selectionType == "entity") {
				$entity.entities[selectedEntityID] = json.parse(editor.getValue())
				console.log("Updated", selectedEntityID, "with", json.parse(editor.getValue()))
				selectedEntity = $entity.entities[selectedEntityID]
			}

			void value()
		}
	})

	onDestroy(unsubscribe)

	let helpMenuOpen = false
	let helpMenuFactory = ""
	let helpMenuProps = {}
	let helpMenuInputs: string[] = []
	let helpMenuOutputs: string[] = []

	let editorComponent: MonacoEditor

	const padding = $appSettings.compactMode ? "p-1" : "p-2 px-3"

	let oldTempHash = ""

	$: $entity.tempHash,
		(() => {
			if (oldTempHash != $entity.tempHash) {
				selectedEntityID = undefined!
				selectedEntity = undefined!
				selectionType = null

				if (tree) {
					tree.onRefresh(async () => {
						if ($workspaceData.path) {
							if (await exists(await join($workspaceData.path, "project.json"))) {
								const proj = JSON.parse(await readTextFile(await join($workspaceData.path, "project.json")))

								if (proj.treeViewState && proj.treeViewState[$entity.tempHash]) {
									if (proj.treeViewState[$entity.tempHash].expandedNodes) {
										tree.setOpenedNodes(proj.treeViewState[$entity.tempHash].expandedNodes)
									}

									if (proj.treeViewState[$entity.tempHash].selectedEntity && $entity.entities[proj.treeViewState[$entity.tempHash].selectedEntity]) {
										tree.navigateTo(proj.treeViewState[$entity.tempHash].selectedEntity)
										selectedEntityID = proj.treeViewState[$entity.tempHash].selectedEntity
										selectedEntity = $entity.entities[proj.treeViewState[$entity.tempHash].selectedEntity]
										selectionType = "entity"
									}
								}
							}
						}
					})
				}

				oldTempHash = $entity.tempHash
			}
		})()

	onMount(() => {
		gameServer.addListener("treeSelectEntity", async (evt) => {
			if (evt.type === "entitySelected") {
				if ($entity.entities[evt.entity.id]) {
					await attemptToSelect(evt.entity.id)
					tree.navigateTo(evt.entity.id)
					tree.scrollToOpenNode()
				}
			}
		})
	})

	onDestroy(() => gameServer.removeListener("treeSelectEntity"))
</script>

<SplitPanes on:resize={() => editor?.layout()} theme="">
	<Pane>
		<SplitPanes on:resize={() => editor?.layout()} theme="" horizontal={true}>
			<Pane>
				<div class="flex flex-col h-full shepherd-tree {padding}">
					<div class="flex flex-row gap-4 items-center">
						<h1>Tree</h1>
						<div class="flex-grow flex flex-row gap-2 items-center">
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
						<Tree
							on:selectionUpdate={async ({ detail }) => {
								await attemptToSelect(detail[1].node.id)
							}}
							on:dragAndDrop={({ detail }) => {
								if (detail[1].old_parent != detail[1].parent) {
									if (!detail[1].node.id.startsWith("comment")) {
										$entity.entities[detail[1].node.id].parent = changeReferenceToLocalEntity(
											$entity.entities[detail[1].node.id].parent,
											detail[1].parent != "#" ? detail[1].parent : null
										)

										if (selectedEntityID == detail[1].node.id) {
											selectedEntity = $entity.entities[detail[1].node.id]
										}
									} else {
										$entity.comments[+detail[1].node.id.replace("comment-", "")].parent = detail[1].parent != "#" ? detail[1].parent : null
									}
								}
							}}
							on:nodeCreated={({ detail }) => {
								let entityID = "feed" + genRandHex(12)

								$entity.entities[entityID] = {
									parent: detail[1].parent,
									name: "New Entity",
									factory: "[modules:/zentity.class].pc_entitytype",
									blueprint: "[modules:/zentity.class].pc_entityblueprint"
								}
							}}
							on:nodeRenamed={({ detail }) => {
								if (!detail[1].node.id.startsWith("comment")) {
									$entity.entities[detail[1].node.id].name = detail[1].text.replace(/ \(ref .*\)/gi, "")

									if (detail[1].node.id == selectedEntityID) {
										selectedEntity = $entity.entities[detail[1].node.id]
									}
								} else {
									$entity.comments[+detail[1].node.id.replace("comment-", "")].name = detail[1].text.replace(/ \(comment\)/gi, "")
								}
							}}
							on:nodeDeleted={({ detail }) => {
								if (!detail[1].node.id.startsWith("comment")) {
									let deletedEntities = 1
									let deletedRefs = 0
									for (let ent of new Set(traverseEntityTree($entity, detail[1].node.id, $reverseReferences))) {
										deletedRefs += deleteReferencesToEntity($entity, $reverseReferences, ent)
										delete $entity.entities[ent]

										deletedEntities++
									}

									deletedRefs += deleteReferencesToEntity($entity, $reverseReferences, detail[1].node.id)
									delete $entity.entities[detail[1].node.id]

									$entity = $entity

									$addNotification = {
										kind: "success",
										title: "Entity deleted",
										subtitle: `Deleted ${deletedEntities} entit${deletedEntities == 1 ? "y" : "ies"}${
											deletedRefs > 0 ? ` and ${deletedRefs} reference${deletedRefs == 1 ? "" : "s"}` : ""
										}`
									}

									selectionType = null
									tree.deselect()
								} else {
									selectionType = null
									$entity.comments = $entity.comments.filter((a, b) => b != +detail[1].node.id.replace("comment-", ""))
								}
							}}
							on:entityUpdated={({ detail }) => {
								selectedEntity = $entity.entities[detail]
							}}
							on:forceUpdateEntity={() => {
								$entity.bla = Math.random()
								delete $entity.bla
							}}
							on:openedNodesChanged={async ({ detail }) => {
								if ($workspaceData.path) {
									if (await exists(await join($workspaceData.path, "project.json"))) {
										await writeTextFile(
											await join($workspaceData.path, "project.json"),
											JSON.stringify(
												deepMerge(JSON.parse(await readTextFile(await join($workspaceData.path, "project.json"))), {
													treeViewState: {
														[$entity.tempHash]: {
															expandedNodes: detail
														}
													}
												})
											)
										)
									}
								}
							}}
							entity={$entity}
							reverseReferences={$reverseReferences}
							inVivoExtensions={$appSettings.inVivoExtensions}
							{editorIsValid}
							bind:helpMenuOpen
							bind:helpMenuFactory
							bind:helpMenuProps
							bind:helpMenuInputs
							bind:helpMenuOutputs
							bind:this={tree}
						/>
					</div>
					{#if $appSettings.technicalMode}
						<div class="flex gap-2 justify-center items-center">
							<TextInput
								bind:value={evaluationPaneInput}
								style="font-family: 'Fira Code', 'IBM Plex Mono', 'Menlo', 'DejaVu Sans Mono', 'Bitstream Vera Sans Mono', Courier, monospace;"
								placeholder="subEntity => subEntity.name (return values are copied; subEntity.id has entity ID)"
							/>
							<Button
								size="field"
								on:click={async () => {
									try {
										let rets = []

										for (let ent of treeSearchInput != ""
											? tree
													.getMatching(treeSearchInput)
													.map((a) => {
														return { ...$entity.entities[a.id], id: a.id }
													})
													.filter((a) => a)
											: Object.entries($entity.entities).map((a) => ({ ...a[1], id: a[0] }))) {
											let ret = eval(evaluationPaneInput)(ent)
											if (typeof ret != "undefined") {
												rets.push(ret)
											}
										}

										if (rets.length) {
											await writeText(json.stringify(rets))
										}
									} catch (e) {
										$addNotification = {
											kind: "error",
											title: "Error in evaluation",
											subtitle: e
										}
									}
								}}
							>
								Evaluate
							</Button>
						</div>
					{/if}
				</div>
			</Pane>
			<Pane>
				<div class="flex flex-col h-full shepherd-information {padding}">
					<h1>Information</h1>
					<div class="flex-grow overflow-y-auto overflow-x-hidden pr-2">
						{#if selectionType}
							{#if selectionType == "entity"}
								<ExpandableSection initiallyOpen={true}>
									<h2 slot="heading">References</h2>
									<div slot="content">
										{#if $references[selectedEntityID]?.length}
											<div class="flex flex-wrap gap-2">
												{#each $references[selectedEntityID] as ref}
													<ClickableTile
														on:click={() => {
															tree.navigateTo(ref.entity)
														}}
													>
														<h4 class="-mt-1">
															{ref.type.replace(/([A-Z])/g, " $1")[0].toUpperCase() + ref.type.replace(/([A-Z])/g, " $1").slice(1)}
															<span style="font-size: 1rem;">{ref.context?.join("/") || ""}</span>
														</h4>
														{$entity.entities[ref.entity].name} (
														<code>{ref.entity}</code>
														)
													</ClickableTile>
												{/each}
											</div>
										{:else}
											There aren't any references to display
										{/if}
									</div>
								</ExpandableSection>
								<ExpandableSection initiallyOpen={true}>
									<h2 slot="heading">Reverse references</h2>
									<div slot="content">
										{#if $reverseReferences[selectedEntityID]?.length}
											<div class="flex flex-wrap gap-2">
												{#each $reverseReferences[selectedEntityID] as ref}
													<ClickableTile
														on:click={() => {
															tree.navigateTo(ref.entity)
														}}
													>
														<h4 class="-mt-1">
															{ref.type.replace(/([A-Z])/g, " $1")[0].toUpperCase() + ref.type.replace(/([A-Z])/g, " $1").slice(1)}
															<span style="font-size: 1rem;">{ref.context?.join("/") || ""}</span>
														</h4>
														{$entity.entities[ref.entity].name} (
														<code>{ref.entity}</code>
														)
													</ClickableTile>
												{/each}
											</div>
										{:else}
											There aren't any reverse references to display
										{/if}
									</div>
								</ExpandableSection>
							{:else}
								<p>
									{@html `You've selected a <i>comment entity</i>, a kind of entity that is ignored when the entity is converted for use with the game. Put any developer comments in here.`}
								</p>
							{/if}
						{:else}
							<p>Select something and related information will show up here</p>
						{/if}
					</div>
				</div>
			</Pane>
		</SplitPanes>
	</Pane>
	<Pane>
		<div class="flex flex-col h-full shepherd-editor {padding}">
			{#if selectionType == "entity"}
				<h1>
					{selectedEntity.name}
				</h1>
				<div class="flex mb-2 gap-2">
					<code>{selectedEntityID}</code>
					{#if editorIsValid}
						<span class="text-green-200">Valid entity</span>
					{:else}
						<span class="text-red-200">{editorInvalidMessage}</span>
					{/if}
				</div>
			{:else}
				<h1>Editor</h1>
			{/if}
			<div class="flex-grow overflow-hidden">
				{#if selectionType}
					{#if selectionType == "entity"}
						<MonacoEditor
							bind:editor
							bind:this={editorComponent}
							entity={$entity}
							subEntityID={selectedEntityID}
							jsonToDisplay={selectedEntity}
							inVivoExtensions={$appSettings.inVivoExtensions}
							on:contentChanged={() => {
								if (selectionType) {
									checkEditorValidity(selectedEntityID, editor.getValue())
								}
							}}
							on:followRef={async ({ detail }) => {
								await attemptToSelect(detail)
								tree.navigateTo(detail)
							}}
						/>
					{:else}
						<TextInput labelText="Name" bind:value={$entity.comments[selectedComment].name} />
						<br />
						<TextArea labelText="Text" bind:value={$entity.comments[selectedComment].text} />
					{/if}
				{:else}
					Select something and an editor for it will show up here
				{/if}
			</div>
			{#if selectionType == "entity" && selectedEntity.properties && Object.entries(selectedEntity.properties).some((a) => a[1].type == "SColorRGB" || a[1].type == "SColorRGBA" || enums[a[1].type])}
				<div class="mt-2 flex-shrink-0">
					<h1>Visual editors</h1>
					<div class="overflow-y-auto" style="max-height: 30rem">
						<div class="flex flex-wrap gap-4 items-center">
							{#each Object.entries(selectedEntity.properties).filter((a) => a[1].type == "SColorRGB" || a[1].type == "SColorRGBA") as [propertyName, property]}
								<div class="flex flex-wrap gap-2 items-center">
									{propertyName}
									<ColorPicker type={property.type == "SColorRGB" ? "rgb" : "rgba"} bind:value={selectedEntity.properties[propertyName].value} />
								</div>
							{/each}
						</div>
						<br />
						<div class="flex flex-wrap gap-4 items-center">
							{#each Object.entries(selectedEntity.properties).filter((a) => enums[a[1].type]) as [propertyName, property]}
								<Select
									labelText={propertyName}
									on:change={({ detail }) => {
										selectedEntity.properties[propertyName].value = detail
									}}
								>
									{#each enums[property.type] as opt}
										<option selected={selectedEntity.properties[propertyName].value == opt} value={opt}>{opt}</option>
									{/each}
								</Select>
							{/each}
						</div>
						{#if Object.entries(selectedEntity.properties).some((a) => enums[a[1].type])}
							<br />
						{/if}
					</div>
				</div>
			{/if}
		</div>
	</Pane>
</SplitPanes>

<Modal bind:open={helpMenuOpen} modalHeading="Help for {helpMenuFactory}" passiveModal>
	<div class="grid grid-cols-2 gap-4">
		<div>
			<h2>Default properties</h2>
			{#if editorComponent && editorComponent.Monaco}
				{#await editorComponent.coloriseJSON(helpMenuProps) then colorisedHTML}
					<pre class="mt-1 rounded-sm bg-[#1e1e1e] p-2"><code>{@html colorisedHTML}</code></pre>
				{/await}
			{/if}
		</div>
		<div>
			<h2>Pins</h2>

			{#if helpMenuInputs.length}
				<h3>Inputs</h3>
				<div class="mt-1 flex flex-row gap-2 flex-wrap">
					{#each helpMenuInputs as pin}
						<div class="inline-flex items-center p-2 rounded-sm bg-neutral-800">{pin}</div>
					{/each}
				</div>
			{/if}

			{#if helpMenuOutputs.length}
				<h3 class:mt-2={helpMenuInputs.length}>Outputs</h3>
				<div class="mt-1 flex flex-row gap-2 flex-wrap">
					{#each helpMenuOutputs as pin}
						<div class="inline-flex items-center p-2 rounded-sm bg-neutral-800">{pin}</div>
					{/each}
				</div>
			{/if}
		</div>
	</div>
</Modal>

<style global>
</style>
