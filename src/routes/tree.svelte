<script lang="ts">
	import type monaco from "monaco-editor"
	import type { CommentEntity, SubEntity } from "$lib/quickentity-types"

	import MonacoEditor from "$lib/components/MonacoEditor.svelte"
	import Tree from "$lib/components/Tree.svelte"
	import ExpandableSection from "$lib/components/ExpandableSection.svelte"
	import ColorPicker from "$lib/components/ColorPicker.svelte"
	import Entity3DMesh from "$lib/components/Entity3DMesh.svelte"

	import { addNotification, appSettings, entity, sessionMetadata, references, reverseReferences, inVivoMetadata, forceSaveSubEntity } from "$lib/stores"
	import { changeReferenceToLocalEntity, checkValidityOfEntity, deleteReferencesToEntity, genRandHex, normaliseToHash, traverseEntityTree } from "$lib/utils"
	import json from "$lib/json"

	import enums from "$lib/enums.json"

	import { Pane, Splitpanes as SplitPanes } from "svelte-splitpanes"
	import { Button, ClickableTile, Modal, Search, Select, TextArea, TextInput } from "carbon-components-svelte"
	import debounce from "lodash/debounce"
	import isEqual from "lodash/isEqual"
	import { AmbientLight, Canvas, DirectionalLight, Mesh, OrbitControls, PerspectiveCamera } from "@threlte/core"
	import { appDir, join } from "@tauri-apps/api/path"
	import { readTextFile, exists as tauriExists } from "@tauri-apps/api/fs"
	import { DEG2RAD } from "three/src/math/MathUtils"
	import { CircleGeometry, DoubleSide, MeshStandardMaterial } from "three"
	import { writeText } from "@tauri-apps/api/clipboard"
	import deepMerge from "lodash/merge"
	import { gameServer } from "$lib/in-vivo/gameServer"

	const readJSON = async (path: string) => json.parse(await readTextFile(path))
	const exists = async (path: string) => {
		try {
			return await tauriExists(path)
		} catch {
			return false
		}
	}

	let editor: monaco.editor.IStandaloneCodeEditor

	let selectionType: "comment" | "entity" | null = null

	let selectedEntityID: string
	let selectedEntity: SubEntity

	let selectedComment: number

	let tree: Tree

	let editorIsValid: boolean = true

	window.onresize = () => editor?.layout()

	let treeSearchInput: string

	const treeSearch = debounce(() => {
		tree.search(treeSearchInput)
	}, 2500)

	let entityPath: string | undefined

	sessionMetadata.subscribe(async (value) => {
		if (value.originalEntityPath != entityPath || value.originalEntityPath == (await join(await appDir(), "inspection", "entity.json"))) {
			selectionType = null
			selectedEntityID = undefined!
			selectedEntity = undefined!
			entityPath = value.originalEntityPath
		}
	})

	let evaluationPaneInput = ""

	function checkEditorValidity(entityID, data) {
		try {
			json.parse(data)
		} catch {
			editorIsValid = false
			return
		}

		try {
			if (checkValidityOfEntity($entity, json.parse(data))) {
				editorIsValid = true

				if (!isEqual($entity.entities[entityID], json.parse(data))) {
					const parsed = json.parse(data)

					$inVivoMetadata.entities[entityID] ??= {
						dirtyPins: false,
						dirtyUnchangeables: false,
						dirtyExtensions: false,
						dirtyProperties: [],
						hasSetProperties: false
					}

					$inVivoMetadata.entities[entityID].dirtyPins = !(
						isEqual($entity.entities[entityID].events, parsed.events) &&
						isEqual($entity.entities[entityID].inputCopying, parsed.inputCopying) &&
						isEqual($entity.entities[entityID].outputCopying, parsed.outputCopying)
					)

					$inVivoMetadata.entities[entityID].dirtyUnchangeables =
						$entity.entities[entityID].template != parsed.template ||
						$entity.entities[entityID].templateFlag != parsed.templateFlag ||
						$entity.entities[entityID].blueprint != parsed.blueprint ||
						$entity.entities[entityID].editorOnly != parsed.editorOnly

					$inVivoMetadata.entities[entityID].dirtyExtensions = !(
						isEqual($entity.entities[entityID].propertyAliases, parsed.propertyAliases) &&
						isEqual($entity.entities[entityID].exposedEntities, parsed.exposedEntities) &&
						isEqual($entity.entities[entityID].exposedInterfaces, parsed.exposedInterfaces) &&
						isEqual($entity.entities[entityID].subsets, parsed.subsets)
					)

					if (parsed.properties) {
						if ($entity.entities[entityID].properties) {
							$inVivoMetadata.entities[entityID].dirtyProperties = [
								...Object.entries(parsed.properties)
									.filter(([prop, val]) => !isEqual($entity.entities[entityID].properties![prop], val))
									.map((a) => a[0]),
								...Object.keys(parsed.properties).filter((a) => !$entity.entities[entityID].properties![a]),
								...Object.keys($entity.entities[entityID].properties!).filter((a) => !parsed.properties[a])
							]
						} else {
							$inVivoMetadata.entities[entityID].dirtyProperties = Object.keys(parsed.properties)
						}
					} else {
						if ($entity.entities[entityID].properties) {
							$inVivoMetadata.entities[entityID].dirtyProperties = Object.keys($entity.entities[entityID].properties!)
						}
					}

					if (parsed.platformSpecificProperties) {
						$inVivoMetadata.entities[entityID].dirtyProperties.push(
							...Object.entries(parsed.platformSpecificProperties)
								.filter(([prop, val]) => !isEqual($entity.entities[entityID].platformSpecificProperties![prop], val))
								.map((a) => a[0]),
							...Object.keys(parsed.platformSpecificProperties).filter((a) => !$entity.entities[entityID].platformSpecificProperties![a]),
							...Object.keys($entity.entities[entityID].platformSpecificProperties!).filter((a) => !parsed.platformSpecificProperties[a])
						)
					}
				}
			} else {
				editorIsValid = false
				return
			}
		} catch (e) {
			editorIsValid = false
			return
		}
	}

	forceSaveSubEntity.subscribe(async (value) => {
		if (value.value) {
			if (editorIsValid && selectionType == "entity") {
				$entity.entities[selectedEntityID] = json.parse(editor.getValue())
				selectedEntity = $entity.entities[selectedEntityID]
			}
		}
	})

	let helpMenuOpen = false
	let helpMenuTemplate = ""
	let helpMenuProps = {}
	let helpMenuInputs: string[] = []
	let helpMenuOutputs: string[] = []

	let editorComponent: MonacoEditor
</script>

<SplitPanes on:resize={() => editor?.layout()} theme="">
	<Pane>
		<SplitPanes on:resize={() => editor?.layout()} theme="" horizontal={true}>
			<Pane>
				<div class="flex flex-col h-full shepherd-tree p-2 px-3">
					<div class="flex flex-row gap-4 items-center">
						<h1>Tree</h1>
						<Search size="lg" placeholder="Filter tree entities" on:input={treeSearch} bind:value={treeSearchInput} />
					</div>
					<div class="flex-grow overflow-auto">
						<Tree
							on:selectionUpdate={({ detail }) => {
								if (selectionType == "entity") {
									if (editorIsValid) {
										$entity.entities[selectedEntityID] = json.parse(editor.getValue())
									} else {
										tree.navigateTo(selectedEntityID)
										return
									}
								}

								selectionType = detail[1].node.id.startsWith("comment") ? "comment" : "entity"

								if (selectionType == "entity") {
									selectedEntityID = detail[1].node.id
									selectedEntity = $entity.entities[detail[1].node.id]
								} else {
									selectedComment = Number(detail[1].node.id.replace("comment-", ""))
								}
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
										$entity.comments[detail[1].node.id.replace("comment-", "")].parent = detail[1].parent
									}
								}
							}}
							on:nodeCreated={({ detail }) => {
								let entityID = "feed" + genRandHex(12)

								$entity.entities[entityID] = {
									parent: detail[1].parent,
									name: "New Entity",
									template: "[modules:/zentity.class].pc_entitytype",
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
									$entity.comments[detail[1].node.id.replace("comment-", "")].name = detail[1].text.replace(/ \(comment\)/gi, "")
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
									$entity.comments = $entity.comments.filter((a, b) => b == +detail[1].node.id.replace("comment-", ""))
								}
							}}
							on:entityUpdated={({ detail }) => {
								selectedEntity = $entity.entities[detail]
							}}
							on:forceUpdateEntity={() => {
								$entity.bla = Math.random()
								delete $entity.bla
							}}
							entity={$entity}
							reverseReferences={$reverseReferences}
							inVivoExtensions={$appSettings.inVivoExtensions}
							autoHighlightEntities={$appSettings.autoHighlightEntities}
							{editorIsValid}
							bind:helpMenuOpen
							bind:helpMenuTemplate
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
											: Object.entries($entity.entities).map((a) => deepMerge(json.parse(json.stringify(a[1])), { id: a[0] }))) {
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
				<div class="flex flex-col h-full shepherd-information p-2 px-3">
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
								{#if $appSettings.gameFileExtensions}
									{#await join($appSettings.gameFileExtensionsDataPath, "TEMP", normaliseToHash(selectedEntity.template) + ".TEMP.entity.json") then joined}
										{#await exists(joined) then condition}
											{#if condition}
												<ExpandableSection initiallyOpen={false}>
													<h2 slot="heading">3D preview</h2>
													<div slot="content">
														<div class="h-96">
															<Canvas>
																<PerspectiveCamera position={{ x: 10, y: 10, z: 10 }} fov={24}>
																	<OrbitControls maxPolarAngle={DEG2RAD * 80} autoRotate={true} enableZoom={true} target={{ y: 0.5 }} />
																</PerspectiveCamera>

																<DirectionalLight shadow position={{ x: 5, y: 10, z: 10 }} />
																<DirectionalLight position={{ x: -5, y: 10, z: -10 }} intensity={0.2} />
																<AmbientLight intensity={1} />

																{#await readJSON(joined) then content}
																	<Entity3DMesh
																		entity={content}
																		rotation={{
																			x: selectedEntity.properties?.m_mTransform?.value?.rotation?.x * DEG2RAD || 0,
																			y: selectedEntity.properties?.m_mTransform?.value?.rotation?.z * DEG2RAD || 0,
																			z: selectedEntity.properties?.m_mTransform?.value?.rotation?.y * DEG2RAD || 0
																		}}
																		scale={{
																			x: 1,
																			y: 1,
																			z: 1
																		}}
																	/>
																{/await}

																<!-- Floor -->
																<Mesh
																	receiveShadow
																	rotation={{ x: -90 * (Math.PI / 180) }}
																	geometry={new CircleGeometry(3, 72)}
																	material={new MeshStandardMaterial({ side: DoubleSide, color: "white" })}
																/>
															</Canvas>
														</div>
													</div>
												</ExpandableSection>
											{/if}
										{/await}
									{/await}
								{/if}
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
		<div class="flex flex-col h-full shepherd-editor p-2 px-3">
			{#if selectionType == "entity"}
				<h1>
					{selectedEntity.name}
				</h1>
				<div class="flex mb-2 gap-2">
					<code>{selectedEntityID}</code>
					{#if editorIsValid}
						<span class="text-green-200">Valid entity</span>
					{:else}
						<span class="text-red-200">Invalid entity</span>
					{/if}
					{#if $appSettings.inVivoExtensions && gameServer.connected && gameServer.lastAddress}
						{#if $inVivoMetadata.entities[selectedEntityID]?.dirtyUnchangeables}
							<span class="text-red-200">Template/blueprint/editorOnly changes require re-deploy</span>
						{:else if $inVivoMetadata.entities[selectedEntityID]?.dirtyExtensions}
							<span class="text-red-200">Other-entity-affecting changes require re-deploy</span>
						{:else if $inVivoMetadata.entities[selectedEntityID]?.dirtyProperties?.length}
							<span class="text-yellow-200">Some property changes not reflected in-game ({$inVivoMetadata.entities[selectedEntityID]?.dirtyProperties?.join(", ")})</span>
						{:else if $inVivoMetadata.entities[selectedEntityID]?.hasSetProperties && $inVivoMetadata.entities[selectedEntityID]?.dirtyPins}
							<span class="text-yellow-200">Property changes reflected in-game; pin changes require re-deploy</span>
						{:else if $inVivoMetadata.entities[selectedEntityID]?.hasSetProperties}
							<span class="text-blue-200">Property changes reflected in-game</span>
						{:else}
							<span class="text-green-200">Entity unchanged from game start</span>
						{/if}
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

<Modal bind:open={helpMenuOpen} modalHeading="Help for {helpMenuTemplate}" passiveModal>
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
