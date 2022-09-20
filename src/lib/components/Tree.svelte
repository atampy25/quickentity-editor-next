<script lang="ts">
	import jQuery from "jquery"
	import "jstree"
	import "./treeview.css"

	import type { Entity } from "$lib/quickentity-types"
	import { getReferencedLocalEntity } from "$lib/utils"

	import { createEventDispatcher, onMount } from "svelte"
	import { v4 } from "uuid"
	import * as clipboard from "@tauri-apps/api/clipboard"

	export let entity: Entity
	export let reverseReferences: Record<
		string,
		{
			type: string
			entity: string
			context?: string[]
		}[]
	>

	export let currentlySelected: string = null!
	export let previouslySelected: string = null!
	export let editorIsValid: boolean

	export const elemID = "tree-" + v4().replaceAll("-", "")

	export let tree: JSTree = null!

	const dispatch = createEventDispatcher()

	const icons = Object.entries({
		"[assembly:/templates/gameplay/ai2/actors.template?/npcactor.entitytemplate].pc_entitytype": "far fa-user",
		"[assembly:/_pro/characters/templates/hero/agent47/agent47.template?/agent47_default.entitytemplate].pc_entitytype": "far fa-user-circle",
		"[assembly:/_pro/design/levelflow.template?/herospawn.entitytemplate].pc_entitytype": "far fa-user-circle",
		"[modules:/zglobaloutfitkit.class].pc_entitytype": "fas fa-tshirt",
		"[modules:/zroomentity.class].pc_entitytype": "fas fa-map-marker-alt",
		"[modules:/zboxvolumeentity.class].pc_entitytype": "far fa-square",
		"[modules:/zsoundbankentity.class].pc_entitytype": "fas fa-music",
		"[modules:/zcameraentity.class].pc_entitytype": "fas fa-camera",
		"[modules:/zsequenceentity.class].pc_entitytype": "fas fa-film",
		"[modules:/zhitmandamageovertime.class].pc_entitytype": "fas fa-skull-crossbones",
		"0059FBD4AEBCDED0": "far fa-comment", // Hashes

		"levelflow.template?/exit": "fas fa-sign-out-alt",
		zitem: "fas fa-wrench", // Specific

		blockup: "fas fa-cube",
		setpiece_container_body: "fas fa-box-open",
		setpiece_trap: "fas fa-skull-crossbones",
		animset: "fas fa-running",
		emitter: "fas fa-wifi",
		sender: "fas fa-wifi",
		event: "fas fa-location-arrow",
		death: "fas fa-skull",
		zone: "far fa-square", // Types

		"foliage/": "fas fa-seedling",
		"vehicles/": "fas fa-car-side",
		"environment/": "far fa-map",
		"logic/": "fas fa-cogs",
		"design/": "fas fa-swatchbook",
		"modules:/": "fas fa-project-diagram" // Paths
	})

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
				check_callback: true
			},
			search: {
				fuzzy: true,
				show_only_matches: true,
				close_opened_onclear: false,
				search_callback: (search: string, node: { id: string }) => {
					if (search.startsWith(":")) {
						return eval(search.slice(1))(entity.entities[node.id])
					} else {
						return JSON.stringify(entity.entities[node.id]).toLowerCase().includes(search)
					}
				}
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
			contextmenu: {
				select_node: false,
				items: (b: any, c: any) => {
					return {
						create: {
							separator_before: false,
							separator_after: true,
							_disabled: false,
							label: "Create",
							icon: "fas fa-plus",
							action: function (b: { reference: string | HTMLElement | JQuery<HTMLElement> }) {
								var c = jQuery.jstree!.reference(b.reference),
									d = c.get_node(b.reference)
								c.create_node(d, {}, "last", function (a: any) {
									try {
										c.edit(a)
									} catch (b) {
										setTimeout(function () {
											c.edit(a)
										}, 0)
									}
								})
							}
						},
						createComment: {
							separator_before: false,
							separator_after: true,
							_disabled: false,
							label: "Add Comment",
							icon: "far fa-sticky-note",
							action: function (b: { reference: string | HTMLElement | JQuery<HTMLElement> }) {
								entity.comments = [
									...entity.comments,
									{
										parent: jQuery.jstree!.reference(b.reference).get_node(b.reference).id,
										name: "New Comment",
										text: ""
									}
								]
							}
						},
						rename: {
							separator_before: false,
							separator_after: false,
							_disabled: false,
							label: "Rename",
							icon: "far fa-pen-to-square",
							action: function (b: { reference: string | HTMLElement | JQuery<HTMLElement> }) {
								var c = jQuery.jstree!.reference(b.reference),
									d = c.get_node(b.reference)
								c.edit(d)
							}
						},
						remove: {
							separator_before: false,
							separator_after: false,
							_disabled: false,
							label: "Delete",
							icon: "far fa-trash-can",
							action: function (b: { reference: string | HTMLElement | JQuery<HTMLElement> }) {
								var c = jQuery.jstree!.reference(b.reference),
									d = c.get_node(b.reference)
								c.is_selected(d) ? c.delete_node(c.get_selected()) : c.delete_node(d)
							}
						},
						ccp: {
							separator_before: true,
							separator_after: false,
							label: "Clipboard",
							icon: "far fa-clipboard",
							action: false,
							submenu: {
								copy: {
									separator_before: false,
									separator_after: false,
									label: "Copy Entity",
									icon: "far fa-copy",
									action: () => {} // TODO: copy and paste
								},
								paste: {
									separator_before: false,
									_disabled: false,
									separator_after: false,
									label: "Paste Entity",
									icon: "far fa-paste",
									action: () => {} // TODO: copy and paste
								}
							}
						},
						copyID: {
							separator_before: false,
							separator_after: false,
							_disabled: false,
							label: "Copy ID",
							icon: "far fa-copy",
							action: function (b: { reference: string | HTMLElement | JQuery<HTMLElement> }) {
								let d = tree.get_node(b.reference)

								clipboard.writeText(d.id)
							}
						}
					}
				}
			},
			plugins: ["contextmenu", "dnd", "search", "sort"]
		})

		tree = jQuery("#" + elemID).jstree()

		jQuery("#" + elemID).on("changed.jstree", (...data) => {
			if (data[1].action == "select_node" && data[1].node.id != currentlySelected) {
				if (editorIsValid) {
					previouslySelected = currentlySelected
					currentlySelected = data[1].node.id

					dispatch("selectionUpdate", data)
				} else {
					tree.deselect_node(data[1].node.id)
					tree.select_node(currentlySelected)
				}
			}
		})
		jQuery("#" + elemID).on("move_node.jstree", (...data) => dispatch("dragAndDrop", data))
		jQuery("#" + elemID).on("create_node.jstree", (...data) => dispatch("nodeCreated", data))
		jQuery("#" + elemID).on("rename_node.jstree", (...data) => dispatch("nodeRenamed", data))
		jQuery("#" + elemID).on("delete_node.jstree", (...data) => dispatch("nodeDeleted", data))
	})

	$: if (tree) {
		tree.settings!.core.data = []

		for (let [entityID, entityData] of Object.entries(entity.entities)) {
			tree.settings!.core.data.push({
				id: String(entityID),
				parent: getReferencedLocalEntity(entityData.parent) || "#",
				icon:
					entityData.template == "[modules:/zentity.class].pc_entitytype" && reverseReferences[entityID].some((a) => a.type == "parent")
						? "far fa-folder"
						: icons.find((a) => entityData.template.includes(a[0]))
						? icons.find((a) => entityData.template.includes(a[0]))![1]
						: "far fa-file",
				text: `${entityData.name} (ref ${entityID})`,
				folder: entityData.template == "[modules:/zentity.class].pc_entitytype" && reverseReferences[entityID].some((a) => a.type == "parent") // for sorting and stuff
			})
		}

		let index = 0
		for (let entry of entity.comments) {
			tree.settings!.core.data.push({
				id: "comment-" + index,
				parent: getReferencedLocalEntity(entry.parent) || "#",
				icon: "far fa-sticky-note",
				text: entry.name + " (comment)",
				folder: false // for sorting and stuff
			})

			index++
		}

		tree.refresh()
	}

	export function search(query: string) {
		tree.search(query.toLowerCase())
	}

	export function navigateTo(ent: string) {
		tree.deselect_node(currentlySelected)
		tree.select_node(ent)
	}

	export function deselect() {
		tree.deselect_all()
		currentlySelected = null!
	}
</script>

<div id={elemID} />
