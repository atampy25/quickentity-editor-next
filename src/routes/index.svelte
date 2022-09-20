<script lang="ts">
	import type monaco from "monaco-editor"
	import type { CommentEntity, SubEntity } from "$lib/quickentity-types"

	import MonacoEditor from "$lib/components/MonacoEditor.svelte"
	import Tree from "$lib/components/Tree.svelte"

	import { addNotification, appSettings, entity, references, reverseReferences } from "$lib/stores"
	import { changeReferenceToLocalEntity, checkValidityOfEntity, deleteReferencesToEntity, genRandHex, normaliseToHash, traverseEntityTree } from "$lib/utils"
	import json from "$lib/json"

	import { Pane, Splitpanes as SplitPanes } from "svelte-splitpanes"
	import { ClickableTile, TextArea, TextInput } from "carbon-components-svelte"
	import debounce from "lodash/debounce"
	import isEqual from "lodash/isEqual"
	import { AmbientLight, Canvas, DirectionalLight, Mesh, OrbitControls, PerspectiveCamera } from "@threlte/core"
	import Entity3DMesh from "$lib/components/Entity3DMesh.svelte"
	import { join } from "@tauri-apps/api/path"
	import { readTextFile, exists as tauriExists } from "@tauri-apps/api/fs"
	import { DEG2RAD } from "three/src/math/MathUtils"
	import { CircleGeometry, DoubleSide, MeshStandardMaterial } from "three"

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

	const updateEntityData = debounce((entityID, data) => {
		try {
			json.parse(data)
		} catch {
			editorIsValid = false
			$addNotification = {
				kind: "error",
				title: "Invalid JSON",
				subtitle: "You've entered invalid JSON."
			}

			return
		}

		try {
			if (checkValidityOfEntity($entity, json.parse(data))) {
				editorIsValid = true

				if (!isEqual($entity.entities[entityID], json.parse(data))) {
					$entity.entities[entityID] = json.parse(data)
				}
			} else {
				editorIsValid = false
				$addNotification = {
					kind: "error",
					title: "Invalid entity",
					subtitle: "The entity either references something that doesn't exist or isn't valid according to the schema."
				}
			}
		} catch {
			editorIsValid = false
			$addNotification = {
				kind: "error",
				title: "Invalid entity",
				subtitle: "The entity either references something that doesn't exist or isn't valid according to the schema."
			}
		}
	}, 5000)
</script>

<SplitPanes on:resize={() => editor.layout()} theme="">
	<Pane>
		<SplitPanes on:resize={() => editor.layout()} theme="" horizontal={true}>
			<Pane>
				<div class="flex flex-col h-full">
					<h1>Tree</h1>
					<div class="flex-grow overflow-auto">
						<Tree
							on:selectionUpdate={({ detail }) => {
								if (selectionType == "entity") {
									try {
										if (checkValidityOfEntity($entity, json.parse(editor.getValue()))) {
											if (!isEqual($entity.entities[selectedEntityID], json.parse(editor.getValue()))) {
												$entity.entities[selectedEntityID] = json.parse(editor.getValue())
											}
										} else {
											tree.navigateTo(selectedEntityID)
											$addNotification = {
												kind: "error",
												title: "Invalid entity",
												subtitle: "The entity either references something that doesn't exist or isn't valid according to the schema."
											}
										}
									} catch {
										tree.navigateTo(selectedEntityID)
										$addNotification = {
											kind: "error",
											title: "Invalid JSON",
											subtitle: "You've entered invalid JSON."
										}
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
										selectedEntity = $entity.entities[detail[1].node.id]
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
								} else {
									$entity.comments[detail[1].node.id.replace("comment-", "")].name = detail[1].text.replace(/ \(comment\)/gi, "")
								}
							}}
							on:nodeDeleted={({ detail }) => {
								if (!detail[1].node.id.startsWith("comment")) {
									let deletedEntities = 1
									let deletedRefs = 0
									for (let ent of traverseEntityTree($entity, detail[1].node.id)) {
										deletedRefs += deleteReferencesToEntity($entity, $reverseReferences, ent)
										delete $entity.entities[ent]

										deletedEntities++
									}

									deletedRefs += deleteReferencesToEntity($entity, $reverseReferences, detail[1].node.id)
									delete $entity.entities[detail[1].node.id]

									$entity = $entity

									$addNotification = {
										kind: "info",
										title: "Entity deleted",
										subtitle: `Deleted ${deletedEntities} entit${deletedEntities == 1 ? "y" : "ies"} and ${deletedRefs} reference${deletedRefs == 1 ? "" : "s"}`
									}

									selectionType = null
									tree.deselect()
								} else {
									selectionType = null
									$entity.comments = $entity.comments.filter((a, b) => b == detail[1].node.id)
								}
							}}
							entity={$entity}
							reverseReferences={$reverseReferences}
							{editorIsValid}
							bind:this={tree}
						/>
					</div>
				</div>
			</Pane>
			<Pane>
				<div class="flex flex-col h-full">
					<h1>Information</h1>
					<div class="flex-grow overflow-auto">
						{#if selectionType}
							{#if selectionType == "entity"}
								<h2>References</h2>
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
								<h2 class="mt-2">Reverse references</h2>
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
								{#if $appSettings.gameFileExtensions}
									{#await join($appSettings.gameFileExtensionsDataPath, "TEMP", normaliseToHash(selectedEntity.template) + ".TEMP.entity.json") then joined}
										{#await exists(joined) then condition}
											{#if condition}
												<h2 class="mt-2">3D preview</h2>
												<div class="h-full">
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
																	x: selectedEntity.properties?.m_mTransform.value.rotation.x * DEG2RAD || 0,
																	y: selectedEntity.properties?.m_mTransform.value.rotation.z * DEG2RAD || 0,
																	z: selectedEntity.properties?.m_mTransform.value.rotation.y * DEG2RAD || 0
																}}
																scale={{
																	x: selectedEntity.properties?.m_PrimitiveScale.value.x || 1,
																	y: selectedEntity.properties?.m_PrimitiveScale.value.z || 1,
																	z: selectedEntity.properties?.m_PrimitiveScale.value.y || 1
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
		<div class="flex flex-col h-full">
			<h1>Editor</h1>
			<div class="flex-grow">
				{#if selectionType}
					{#if selectionType == "entity"}
						<MonacoEditor
							bind:editor
							entity={$entity}
							subEntityID={selectedEntityID}
							jsonToDisplay={selectedEntity}
							on:contentChanged={() => updateEntityData(selectedEntityID, editor.getValue())}
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
		</div>
	</Pane>
</SplitPanes>

<style global>
	.splitpanes__pane {
		@apply bg-[#202020] p-2 px-3 overflow-auto;
	}

	.splitpanes__splitter {
		background-color: #262626;
		position: relative;
	}

	.splitpanes--vertical > .splitpanes__splitter {
		cursor: col-resize;
		width: 5px;
	}

	.splitpanes--horizontal > .splitpanes__splitter {
		cursor: row-resize;
		height: 5px;
	}

	.splitpanes--vertical > .splitpanes__splitter:before {
		left: -2.5px;
		right: -2.5px;
		height: 100%;
	}

	.splitpanes--horizontal > .splitpanes__splitter:before {
		top: -2.5px;
		bottom: -2.5px;
		width: 100%;
	}

	code {
		font-family: "Fira Code", "IBM Plex Mono", "Menlo", "DejaVu Sans Mono", "Bitstream Vera Sans Mono", Courier, monospace;
	}

	.bx--toast-notification__caption {
		display: none;
	}
</style>
