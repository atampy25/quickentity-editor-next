<script lang="ts">
	import "../app.css"
	import "carbon-components-svelte/css/g90.css"
	import "$lib/fontawesome/css/all.css"
	import "shepherd.js/dist/css/shepherd.css"

	import { onMount } from "svelte"

	let ready: boolean = false
	onMount(() => (ready = true))
	import {
		Header,
		HeaderNav,
		HeaderNavItem,
		HeaderNavMenu,
		SideNav,
		SideNavItems,
		SideNavMenu,
		SideNavMenuItem,
		SideNavLink,
		SideNavDivider,
		SkipToContent,
		Content,
		Grid,
		ToastNotification,
		Modal,
		TextInput,
		Select,
		TreeView
	} from "carbon-components-svelte"

	import { addNotification, appSettings, entity, sessionMetadata, workspaceData } from "$lib/stores"
	import json from "$lib/json"
	import { shortcut } from "$lib/shortcut"
	import { gameServer } from "$lib/in-vivo/gameServer"

	import { page } from "$app/stores"
	import { fade, fly } from "svelte/transition"
	import { flip } from "svelte/animate"
	import { open, save } from "@tauri-apps/api/dialog"
	import { BaseDirectory, createDir, exists as tauriExists, readDir, readTextFile, removeDir, writeTextFile } from "@tauri-apps/api/fs"
	import { appDir, join, runtimeDir, sep } from "@tauri-apps/api/path"
	import { Command } from "@tauri-apps/api/shell"
	import { getVersion } from "@tauri-apps/api/app"
	import * as rfc6902 from "rfc6902"
	import md5 from "md5"
	import Shepherd from "shepherd.js"
	import cloneDeep from "lodash/cloneDeep"
	import { Pane, Splitpanes as SplitPanes } from "svelte-splitpanes"

	import Data2 from "carbon-icons-svelte/lib/Data_2.svelte"
	import Edit from "carbon-icons-svelte/lib/Edit.svelte"
	import TreeViewIcon from "carbon-icons-svelte/lib/TreeView.svelte"
	import Settings from "carbon-icons-svelte/lib/Settings.svelte"
	import Chart_3D from "carbon-icons-svelte/lib/Chart_3D.svelte"
	import WarningAlt from "carbon-icons-svelte/lib/WarningAlt.svelte"

	import * as Sentry from "@sentry/browser"
	import { BrowserTracing } from "@sentry/tracing"
	import SentryRRWeb from "@sentry/rrweb"
	import { changeEntityHashesFromFriendly, changeEntityHashesToFriendly } from "$lib/utils"

	let displayNotifications: { kind: "error" | "info" | "info-square" | "success" | "warning" | "warning-alt"; title: string; subtitle: string }[] = []

	addNotification.subscribe((value) => {
		if (value) {
			if (!displayNotifications.some((a) => a.title == value!.title)) {
				displayNotifications = [...displayNotifications, value]
				timeoutRemoveNotification(value.title)
			}

			value = null
		}
	})

	let isSideNavOpen = false

	function timeoutRemoveNotification(title: string) {
		setTimeout(() => {
			displayNotifications = displayNotifications.filter((a) => a.title != title)
		}, 6000)
	}

	let askGameFileModalOpen = false
	let askGameFileModalResult: string

	onMount(async () => {
		await createDir("gltf", { dir: BaseDirectory.App, recursive: true })
	})

	let currentDate = 0
	setInterval(() => {
		currentDate = Date.now()

		if (gameServer.connected && gameServer.lastAddress) {
			void gameServer.client.send(gameServer.lastAddress, "Ping")
		}
	}, 100)

	const exists = async (path: string) => {
		try {
			return (await tauriExists(path)) as unknown as boolean
		} catch {
			return false
		}
	}

	async function getEntityAsText() {
		const ent = cloneDeep($entity)

		if ($appSettings.inVivoExtensions && gameServer.connected) {
			ent.entities["abcdefcadc2e258e"] = {
				parent: null,
				name: "QNE In-Vivo Helper Entity",
				template: "[modules:/zmultiparentspatialentity.class].pc_entitytype",
				blueprint: "[modules:/zmultiparentspatialentity.class].pc_entityblueprint",
				properties: {
					m_aParents: {
						type: "TArray<SEntityTemplateReference>",
						value: Object.keys(ent.entities).filter((a) => a != "abcdefcadc2e258e" && a != "abcdefcadc77e4f2")
					}
				}
			}

			ent.entities["abcdefcadc77e4f2"] = {
				parent: "abcdefcadc2e258e",
				name: "QNE In-Vivo Helper Entity GameEventListener",
				template: "[modules:/zgameeventlistenerentity.class].pc_entitytype",
				blueprint: "[modules:/zgameeventlistenerentity.class].pc_entityblueprint",
				properties: {
					m_eEvent: {
						type: "EGameEventType",
						value: "GET_IntroCutEnd"
					}
				},
				events: {
					EventOccurred: {
						GetIndex: ["abcdefcadc2e258e"]
					}
				}
			}
		}

		if ($workspaceData.path) {
			if (await exists(await join($workspaceData.path, "project.json"))) {
				changeEntityHashesToFriendly(
					ent,
					Object.fromEntries(JSON.parse(await readTextFile(await join($workspaceData.path, "project.json"))).customPaths.map((a: string) => [("00" + md5(a).slice(2, 16)).toUpperCase(), a]))
				)
			}
		}

		return json.stringify(ent)
	}

	async function getEntityFromText(x: string) {
		const ent = json.parse(x)

		if (ent.entities["abcdefcadc2e258e"]) {
			delete ent.entities["abcdefcadc2e258e"]
			delete ent.entities["abcdefcadc77e4f2"]
		}

		if ($workspaceData.path) {
			if (await exists(await join($workspaceData.path, "project.json"))) {
				changeEntityHashesFromFriendly(
					ent,
					Object.fromEntries(JSON.parse(await readTextFile(await join($workspaceData.path, "project.json"))).customPaths.map((a: string) => [("00" + md5(a).slice(2, 16)).toUpperCase(), a]))
				)
			}
		}

		return ent
	}

	onMount(async () => {
		if ($appSettings.enableLogRocket) {
			Sentry.init({
				dsn: "https://7be7af4147884b6093b380e65750e9f6@o1144555.ingest.sentry.io/4503907590537216",
				integrations: [new BrowserTracing(), new SentryRRWeb()],
				tracesSampleRate: 0,
				release: await getVersion()
			})

			if ($appSettings.logRocketName != "") {
				Sentry.setUser({
					id: $appSettings.logRocketID,
					username: $appSettings.logRocketName,
					gameFileExtensions: $appSettings.gameFileExtensions,
					inVivoExtensions: $appSettings.inVivoExtensions
				})
			} else {
				Sentry.setUser({ id: $appSettings.logRocketID, gameFileExtensions: $appSettings.gameFileExtensions, inVivoExtensions: $appSettings.inVivoExtensions })
			}
		}
	})

	function breadcrumb(category: string, message: string, data: Record<string, string> = {}) {
		if ($appSettings.enableLogRocket) {
			Sentry.addBreadcrumb({
				message,
				category,
				data,
				level: "info"
			})
		}
	}

	async function extractForInspection(tempHash: string) {
		if (await exists(await join(await appDir(), "inspection"))) {
			await removeDir(await join(await appDir(), "inspection"), { recursive: true })
		}

		$addNotification = {
			kind: "info",
			title: "Extracting TEMP files",
			subtitle: "Extracting binary TEMP files"
		}

		let latestChunkTemp = /is in: (.*?.rpkg)/gi.exec((await Command.sidecar("sidecar/rpkg-cli", ["-latest_hash", $appSettings.runtimePath, "-filter", tempHash]).execute()).stdout)[1]

		await Command.sidecar("sidecar/rpkg-cli", [
			"-extract_from_rpkg",
			await join($appSettings.runtimePath, latestChunkTemp),
			"-filter",
			tempHash,
			"-output_path",
			await join(await appDir(), "inspection")
		]).execute()

		let tempPath, tempMetaPath, tbluPath, tbluMetaPath

		$addNotification = {
			kind: "info",
			title: "Converting TEMP files",
			subtitle: "Converting TEMP files to JSON"
		}

		for (let entry of (await readDir(await join(await appDir(), "inspection", latestChunkTemp.replace(".rpkg", "")), { recursive: true })).flatMap((a) => a.children || a)) {
			if (entry.path.endsWith(".TEMP")) {
				await Command.sidecar("ResourceTool", ["HM3", "convert", "TEMP", entry.path, entry.path + ".json", "--simple"]).execute()
				tempPath = entry.path + ".json"
			} else if (entry.path.endsWith(".TEMP.meta")) {
				await Command.sidecar("sidecar/rpkg-cli", ["-hash_meta_to_json", entry.path]).execute()
				tempMetaPath = entry.path + ".JSON"
			}
		}

		let tbluHash = json.parse(await readTextFile(tempMetaPath)).hash_reference_data[json.parse(await readTextFile(tempPath)).blueprintIndexInResourceHeader].hash
		if (tbluHash.includes(":")) {
			tbluHash = ("00" + md5(tbluHash).slice(2, 16)).toUpperCase()
		}

		let latestChunkTblu = /is in: (.*?.rpkg)/gi.exec((await Command.sidecar("sidecar/rpkg-cli", ["-latest_hash", $appSettings.runtimePath, "-filter", tbluHash]).execute()).stdout)[1]

		$addNotification = {
			kind: "info",
			title: "Extracting TBLU files",
			subtitle: "Extracting binary TBLU files"
		}

		await Command.sidecar("sidecar/rpkg-cli", [
			"-extract_from_rpkg",
			await join($appSettings.runtimePath, latestChunkTblu),
			"-filter",
			tbluHash,
			"-output_path",
			await join(await appDir(), "inspection")
		]).execute()

		$addNotification = {
			kind: "info",
			title: "Converting TBLU files",
			subtitle: "Converting TBLU files to JSON"
		}

		for (let entry of (await readDir(await join(await appDir(), "inspection", latestChunkTblu.replace(".rpkg", "")), { recursive: true })).flatMap((a) => a.children || a)) {
			if (entry.path.endsWith(".TBLU")) {
				await Command.sidecar("ResourceTool", ["HM3", "convert", "TBLU", entry.path, entry.path + ".json", "--simple"]).execute()
				tbluPath = entry.path + ".json"
			} else if (entry.path.endsWith(".TBLU.meta")) {
				await Command.sidecar("sidecar/rpkg-cli", ["-hash_meta_to_json", entry.path]).execute()
				tbluMetaPath = entry.path + ".JSON"
			}
		}

		$addNotification = {
			kind: "info",
			title: "Converting to QuickEntity",
			subtitle: "Converting source JSON files to QuickEntity JSON"
		}

		await Command.sidecar("sidecar/quickentity-rs", [
			"entity",
			"convert",
			"--input-factory",
			tempPath,
			"--input-factory-meta",
			tempMetaPath,
			"--input-blueprint",
			tbluPath,
			"--input-blueprint-meta",
			tbluMetaPath,
			"--output",
			await join(await appDir(), "inspection", "entity.json")
		]).execute()
	}

	function getReadDirAsTree(data) {
		return data
			.filter((a) => (a.children && getReadDirAsTree(a.children).length) || a.path.endsWith("entity.json") || a.path.endsWith("entity.patch.json"))
			.map((a) => {
				return {
					id: a.path,
					text: a.name,
					children: a.children ? getReadDirAsTree(a.children) : undefined
				}
			})
	}

	let reportIssueModalOpen = false
	let reportIssueModalSeverity = ""
	let reportIssueModalIssue = ""

	let selectedWorkspaceTreeItem = ""
	let previousSelectedWorkspaceTreeItem = ""
</script>

{#if ready}
	<Header company="QuickEntity" platformName="Editor" bind:isSideNavOpen>
		<svelte:fragment slot="skip-to-content">
			<SkipToContent />
		</svelte:fragment>
		<HeaderNav>
			<HeaderNavMenu text="Load">
				<HeaderNavItem
					href="#"
					text="Load workspace folder"
					on:click={async () => {
						let x = await open({
							directory: true,
							title: "Select the workspace folder"
						})

						if (x && !Array.isArray(x)) {
							$workspaceData.path = x
						}
					}}
				/>
				<li
					role="none"
					use:shortcut={{ control: true, key: "o" }}
					on:click={async () => {
						let x = await open({
							multiple: false,
							title: "Select the entity JSON",
							filters: [
								{
									name: "QuickEntity JSON",
									extensions: ["json"]
								}
							]
						})

						if (x && !Array.isArray(x)) {
							$sessionMetadata.originalEntityPath = x
							$sessionMetadata.saveAsPatch = false
							$sessionMetadata.saveAsEntityPath = $sessionMetadata.originalEntityPath
							$sessionMetadata.loadedFromGameFiles = false
							$entity = await getEntityFromText(await readTextFile(x))

							breadcrumb("entity", `Loaded ${$entity.tempHash} from file`)
						}
					}}
				>
					<HeaderNavItem href="#" text="Load entity from file" />
				</li>
				<li
					role="none"
					use:shortcut={{ control: true, alt: true, key: "o" }}
					on:click={() => {
						askGameFileModalOpen = true
					}}
				>
					<HeaderNavItem href="#" text="Load entity from game" />
				</li>
				<li
					role="none"
					use:shortcut={{ control: true, shift: true, key: "O" }}
					on:click={async () => {
						let y = await open({
							multiple: false,
							title: "Select the patch JSON",
							filters: [
								{
									name: "Patch JSON",
									extensions: ["json"]
								}
							]
						})

						if (!y || Array.isArray(y)) return

						let patch = json.parse(await readTextFile(y))
						let patched = {}

						if ($appSettings.gameFileExtensions && (await exists(await join($appSettings.gameFileExtensionsDataPath, "TEMP", patch.tempHash + ".TEMP.entity.json")))) {
							await extractForInspection(patch.tempHash)

							$sessionMetadata.originalEntityPath = await join(await appDir(), "inspection", "entity.json")

							patched = json.parse(await readTextFile(await join(await appDir(), "inspection", "entity.json")))
						} else {
							let x = await open({
								multiple: false,
								title: "Select the original entity JSON",
								filters: [
									{
										name: "QuickEntity JSON",
										extensions: ["json"]
									}
								]
							})

							if (!x || Array.isArray(x)) return

							$sessionMetadata.originalEntityPath = x

							patched = json.parse(await readTextFile(x))
						}

						rfc6902.applyPatch(patched, patch.patch)
						$sessionMetadata.saveAsPatch = true
						$sessionMetadata.saveAsPatchPath = y
						$sessionMetadata.loadedFromGameFiles = false
						$entity = await getEntityFromText(json.stringify(patched))

						breadcrumb("entity", `Loaded ${$entity.tempHash} from patch`)
					}}
				>
					<HeaderNavItem href="#" text="Load entity from patch" />
				</li>
			</HeaderNavMenu>
			<HeaderNavMenu text="Save as">
				<li
					role="none"
					use:shortcut={{ control: true, shift: true, key: "S" }}
					on:click={async () => {
						let x = await save({
							title: "Save the entity JSON",
							filters: [
								{
									name: "QuickEntity JSON",
									extensions: ["json"]
								}
							]
						})

						if (!x) return

						await writeTextFile(x, await getEntityAsText())

						$sessionMetadata.saveAsPatch = false
						$sessionMetadata.saveAsEntityPath = x
						$sessionMetadata.loadedFromGameFiles = false

						breadcrumb("entity", "Saved to file")

						$addNotification = {
							kind: "success",
							title: "Saved entity successfully",
							subtitle: "Saved the entity to the selected path"
						}
					}}
				>
					<HeaderNavItem href="#" text="Save as entity file" />
				</li>
				<li
					role="none"
					use:shortcut={{ control: true, shift: true, alt: true, key: "S" }}
					on:click={async () => {
						let x = await save({
							title: "Save the patch JSON",
							filters: [
								{
									name: "Patch JSON",
									extensions: ["json"]
								}
							]
						})

						if (!x) return

						if (Object.keys($entity.entities).length > 50000) {
							await writeTextFile("entity.json", await getEntityAsText(), { dir: BaseDirectory.App })

							await Command.sidecar("sidecar/quickentity-rs", [
								"patch",
								"generate",
								"--input1",
								String($sessionMetadata.originalEntityPath),
								"--input2",
								await join(await appDir(), "entity.json"),
								"--output",
								x
							]).execute()

							$addNotification = {
								kind: "warning",
								title: "Calculated patch using alternate algorithm",
								subtitle: "The patch was calculated using a faster but lower quality algorithm; you may want to check the output JSON."
							}
						} else {
							// much smarter but much slower diff algorithm
							await writeTextFile(x, json.stringify(rfc6902.createPatch(json.parse(await readTextFile($sessionMetadata.originalEntityPath)), json.parse(await getEntityAsText()))))
						}

						$sessionMetadata.saveAsPatch = true
						$sessionMetadata.saveAsPatchPath = x
						$sessionMetadata.loadedFromGameFiles = false

						breadcrumb("entity", "Saved to patch")

						$addNotification = {
							kind: "success",
							title: "Saved patch successfully",
							subtitle: "Saved the changes from the original entity to the selected path"
						}
					}}
				>
					<HeaderNavItem href="#" text="Save as patch file" />
				</li>
			</HeaderNavMenu>
			{#if $sessionMetadata.originalEntityPath && !$sessionMetadata.loadedFromGameFiles}
				{#if $sessionMetadata.saveAsPatch}
					<li
						role="none"
						use:shortcut={{ control: true, key: "s" }}
						on:click={async () => {
							if (Object.keys($entity.entities).length > 50000) {
								await writeTextFile("entity.json", await getEntityAsText(), { dir: BaseDirectory.App })

								await Command.sidecar("sidecar/quickentity-rs", [
									"patch",
									"generate",
									"--input1",
									String($sessionMetadata.originalEntityPath),
									"--input2",
									await join(await appDir(), "entity.json"),
									"--output",
									$sessionMetadata.saveAsPatchPath
								]).execute()

								$addNotification = {
									kind: "warning",
									title: "Calculated patch using alternate algorithm",
									subtitle: "The patch was calculated using a faster but lower quality algorithm; you may want to check the output JSON."
								}
							} else {
								// much smarter but much slower diff algorithm
								await writeTextFile(
									$sessionMetadata.saveAsPatchPath,
									json.stringify(rfc6902.createPatch(json.parse(await readTextFile($sessionMetadata.originalEntityPath)), json.parse(await getEntityAsText())))
								)
							}

							$sessionMetadata.loadedFromGameFiles = false

							$addNotification = {
								kind: "success",
								title: "Saved patch successfully",
								subtitle:
									"Saved the changes from the original entity to " +
									($sessionMetadata.saveAsPatchPath.split(sep).length > 3
										? "..." + $sessionMetadata.saveAsPatchPath.split(sep).slice(-3).join(sep)
										: $sessionMetadata.saveAsPatchPath)
							}

							breadcrumb("entity", "Saved to patch (original path)")
						}}
					>
						<a role="menuitem" tabindex="0" href="#" class="bx--header__menu-item"><span class="bx--text-truncate--end">Save patch</span></a>
					</li>
				{:else}
					<li
						role="none"
						use:shortcut={{ control: true, key: "s" }}
						on:click={async () => {
							await writeTextFile($sessionMetadata.saveAsEntityPath, await getEntityAsText())

							$sessionMetadata.loadedFromGameFiles = false

							$addNotification = {
								kind: "success",
								title: "Saved entity successfully",
								subtitle:
									"Saved the entity to " +
									($sessionMetadata.saveAsEntityPath.split(sep).length > 3
										? "..." + $sessionMetadata.saveAsEntityPath.split(sep).slice(-3).join(sep)
										: $sessionMetadata.saveAsEntityPath)
							}

							breadcrumb("entity", "Saved to file (original path)")
						}}
					>
						<a role="menuitem" tabindex="0" href="#" class="bx--header__menu-item"><span class="bx--text-truncate--end">Save entity</span></a>
					</li>
				{/if}
				{#if $appSettings.inVivoExtensions}
					<HeaderNavItem
						href="#"
						text="{!gameServer.connected ? 'Enable' : 'Disable'} game connection"
						class="shepherd-gameConnection"
						on:click={async () => {
							if (!gameServer.connected) {
								await gameServer.start()

								gameServer.client.addListener(({ datagram }) => {
									gameServer.lastMessage = Date.now()
								})
							} else {
								await gameServer.kill()
							}

							gameServer.connected = gameServer.connected

							breadcrumb("gameserver", `Toggled to ${gameServer.connected}`)
						}}
					/>
					{#if gameServer.connected}
						<li role="none">
							<a href="#" disabled class="bx--header__menu-item">
								<span class="bx--text-truncate--end" style:color={currentDate - gameServer.lastMessage < 5000 ? "#bbf7d0" : "#fecaca"}>
									Last message from game: {currentDate - gameServer.lastMessage != currentDate ? Math.max(0, currentDate - gameServer.lastMessage) : "never"}
								</span>
							</a>
						</li>
					{/if}
				{/if}
			{/if}
			{#if $page.url.pathname == "/metadata" || $page.url.pathname == "/overrides" || $page.url.pathname == "/" || $page.url.pathname == "/3d"}
				<HeaderNavItem
					href="#"
					on:click={() => {
						if ($page.url.pathname == "/metadata") {
							const tour = new Shepherd.Tour({
								useModalOverlay: true,
								defaultStepOptions: {
									classes: "shadow-md bg-purple-dark",
									scrollTo: true
								}
							})

							tour.addStep({
								id: "page",
								text: "You're looking at the Metadata view, where you can customise general properties of the opened entity.",
								buttons: [
									{
										text: "Next",
										action: tour.next
									}
								]
							})

							tour.addStep({
								id: "factoryHash",
								text: "This is the alphanumeric 16 character game hash of the factory (TEMP) of the opened entity.",
								attachTo: {
									element: ".shepherd-factoryHash",
									on: "bottom"
								},
								buttons: [
									{
										text: "Next",
										action: tour.next
									}
								]
							})

							tour.addStep({
								id: "blueprintHash",
								text: "This is the alphanumeric 16 character game hash of the blueprint (TBLU) of the opened entity.",
								attachTo: {
									element: ".shepherd-blueprintHash",
									on: "bottom"
								},
								buttons: [
									{
										text: "Next",
										action: tour.next
									}
								]
							})

							tour.addStep({
								id: "rootEntity",
								text: "This is the entity ID of the root entity. For templates, the root entity should be the one that implements the required interfaces, exposes the required entities and aliases the required properties; properties of the template in another brick are propagated to the root entity. For scenes and bricks, the root entity should be a spatial entity which the other entities are parented to.",
								attachTo: {
									element: ".shepherd-rootEntity",
									on: "bottom"
								},
								buttons: [
									{
										text: "Next",
										action: tour.next
									}
								]
							})

							tour.addStep({
								id: "entityType",
								text: "This is the entity's type. Scenes are entities that are loaded by contract JSONs; they're the highest up in the hierarchy. Bricks are entities that are loaded by scenes. Templates are entities designed for a specific purpose that are then used by other entities.",
								attachTo: {
									element: ".shepherd-entityType",
									on: "bottom"
								},
								buttons: [
									{
										text: "Next",
										action: tour.next
									}
								]
							})

							tour.addStep({
								id: "externalScenes",
								text: "These are the external scenes that this entity references. Anything used in an externalScene property of a reference should be here, as well as any other bricks or entities you might want to load alongside this entity.",
								attachTo: {
									element: ".shepherd-externalScenes",
									on: "bottom"
								},
								buttons: [
									{
										text: "Next",
										action: tour.next
									}
								]
							})

							tour.addStep({
								id: "extraDependencies",
								text: "If you want to add any extra dependencies to the factory or blueprint, you can do so here.",
								attachTo: {
									element: ".shepherd-extraDependencies",
									on: "bottom"
								},
								buttons: [
									{
										text: "Next",
										action: tour.next
									}
								]
							})

							tour.start()
						}

						if ($page.url.pathname == "/overrides") {
							const tour = new Shepherd.Tour({
								useModalOverlay: true,
								defaultStepOptions: {
									classes: "shadow-md bg-purple-dark",
									scrollTo: true
								}
							})

							tour.addStep({
								id: "page",
								text: "You're looking at the Overrides view, where you can customise how this entity overrides other entities when it's loaded. This is usually used by bricks or scenes.",
								buttons: [
									{
										text: "Next",
										action: tour.next
									}
								]
							})

							tour.addStep({
								id: "propertyOverrides",
								text: "These are entity properties that will be overriden when this entity is loaded.",
								attachTo: {
									element: ".shepherd-propertyOverrides",
									on: "auto"
								},
								buttons: [
									{
										text: "Next",
										action: tour.next
									}
								]
							})

							tour.addStep({
								id: "overrideDeletes",
								text: "These are entities that will be removed when this entity is loaded.",
								attachTo: {
									element: ".shepherd-overrideDeletes",
									on: "auto"
								},
								buttons: [
									{
										text: "Next",
										action: tour.next
									}
								]
							})

							tour.start()
						}

						if ($page.url.pathname == "/") {
							const tour = new Shepherd.Tour({
								useModalOverlay: true,
								defaultStepOptions: {
									classes: "shadow-md bg-purple-dark",
									scrollTo: true
								}
							})

							tour.addStep({
								id: "page",
								text: "You're looking at the Tree view, where you'll spend most of your time in QuickEntity Editor. There are three components to this view: the tree, the information pane and the editor.",
								buttons: [
									{
										text: "Next",
										action: tour.next
									}
								]
							})

							tour.addStep({
								id: "tree",
								text: "This is the tree itself. It displays the sub-entities of the game entity you're looking at. You can also right click on sub-entities to create new ones, delete them, rename them, add comments or access other advanced options. The tree is sorted alphabetically, and you can drag sub-entities to re-parent them.",
								attachTo: {
									element: ".shepherd-tree",
									on: "right"
								},
								buttons: [
									{
										text: "Next",
										action: tour.next
									}
								]
							})

							tour.addStep({
								id: "information",
								text: "When you select an entity in the tree, you'll see relevant information show up here, like entities that reference the entity you clicked, or a 3D preview of the entity.",
								attachTo: {
									element: ".shepherd-information",
									on: "right"
								},
								buttons: [
									{
										text: "Next",
										action: tour.next
									}
								]
							})

							tour.addStep({
								id: "editor",
								text: "You'll also see an editor show up here, allowing you to change the properties of an entity or edit the text of a comment. Some properties, like colours, have visual editors as well, which will show up below the main JSON editor.",
								attachTo: {
									element: ".shepherd-editor",
									on: "left"
								},
								buttons: [
									{
										text: "Next",
										action: tour.next
									}
								]
							})

							if ($appSettings.inVivoExtensions) {
								tour.addStep({
									id: "gameConnection",
									text: "Since you've enabled in-vivo extensions, you can connect to a running instance of the game using this (you should turn this on before launching the game). If you save an entity while the game connection is enabled, a helper sub-entity will be added to allow you to perform in-game actions on everything in the entity - if something isn't working right, save while the game connection is enabled and re-deploy.",
									attachTo: {
										element: ".shepherd-gameConnection",
										on: "left"
									},
									buttons: [
										{
											text: "Next",
											action: tour.next
										}
									]
								})
							}

							tour.start()
						}

						if ($page.url.pathname == "/3d") {
							const tour = new Shepherd.Tour({
								useModalOverlay: true,
								defaultStepOptions: {
									classes: "shadow-md bg-purple-dark",
									scrollTo: true
								}
							})

							tour.addStep({
								id: "page",
								text: "You're looking at the 3D Preview. It's currently very experimental and probably won't work.",
								buttons: [
									{
										text: "Next",
										action: tour.next
									}
								]
							})

							tour.start()
						}

						breadcrumb("ui", "Tour activated")
					}}
					text="Help"
				/>
			{/if}
		</HeaderNav>

		<SideNav bind:isOpen={isSideNavOpen} rail>
			<SideNavItems>
				<SideNavLink icon={Data2} text="Metadata" href="/metadata" isSelected={$page.url.pathname == "/metadata"} />
				<SideNavDivider />
				<SideNavLink icon={Edit} text="Overrides" href="/overrides" isSelected={$page.url.pathname == "/overrides"} />
				<SideNavDivider />
				<SideNavLink icon={TreeViewIcon} text="Tree View" href="/" isSelected={$page.url.pathname == "/"} />
				<SideNavDivider />
				{#if $appSettings.gameFileExtensions}
					<SideNavLink icon={Chart_3D} text="3D Preview" href="/3d" isSelected={$page.url.pathname == "/3d"} />
					<SideNavDivider />
				{/if}
				<SideNavLink icon={Settings} text="Settings" href="/settings" isSelected={$page.url.pathname == "/settings"} />
				{#if $appSettings.enableLogRocket}
					<SideNavDivider />
					<SideNavLink icon={WarningAlt} href="#" text="Report Issue" on:click={() => (reportIssueModalOpen = true)} />
				{/if}
			</SideNavItems>
		</SideNav>
	</Header>
	<Content>
		<div class="px-16 h-[90vh]">
			<SplitPanes theme="">
				{#if $workspaceData.path}
					<Pane size={15}>
						<div class="pt-2 -mb-3.5 px-3">
							<h1>Workspace</h1>
						</div>
						{#await readDir($workspaceData.path, { recursive: true }) then d}
							<TreeView
								children={getReadDirAsTree(d)}
								bind:activeId={selectedWorkspaceTreeItem}
								selectedIds={[selectedWorkspaceTreeItem]}
								on:select={async ({ detail }) => {
									// just for typescript, it's never actually a number
									if (typeof detail.id == "number") return

									if (!detail.leaf) {
										selectedWorkspaceTreeItem = previousSelectedWorkspaceTreeItem
									} else {
										previousSelectedWorkspaceTreeItem = selectedWorkspaceTreeItem
										selectedWorkspaceTreeItem = detail.id

										// save old file
										if ($appSettings.autoSaveOnSwitchFile) {
											if ($sessionMetadata.originalEntityPath && !$sessionMetadata.loadedFromGameFiles) {
												if ($sessionMetadata.saveAsPatch) {
													if (Object.keys($entity.entities).length > 50000) {
														await writeTextFile("entity.json", await getEntityAsText(), { dir: BaseDirectory.App })

														await Command.sidecar("sidecar/quickentity-rs", [
															"patch",
															"generate",
															"--input1",
															String($sessionMetadata.originalEntityPath),
															"--input2",
															await join(await appDir(), "entity.json"),
															"--output",
															$sessionMetadata.saveAsPatchPath
														]).execute()

														$addNotification = {
															kind: "warning",
															title: "Calculated patch using alternate algorithm",
															subtitle: "The patch was calculated using a faster but lower quality algorithm; you may want to check the output JSON."
														}
													} else {
														// much smarter but much slower diff algorithm
														await writeTextFile(
															$sessionMetadata.saveAsPatchPath,
															json.stringify(
																rfc6902.createPatch(json.parse(await readTextFile($sessionMetadata.originalEntityPath)), json.parse(await getEntityAsText()))
															)
														)
													}

													$sessionMetadata.loadedFromGameFiles = false

													breadcrumb("entity", "Saved to patch (original path) when switching workspace file")
												} else {
													await writeTextFile($sessionMetadata.saveAsEntityPath, await getEntityAsText())

													$sessionMetadata.loadedFromGameFiles = false

													breadcrumb("entity", "Saved to file (original path) when switching workspace file")
												}
											}
										}

										// load new file
										if (detail.id.endsWith("entity.json")) {
											$sessionMetadata.originalEntityPath = detail.id
											$sessionMetadata.saveAsPatch = false
											$sessionMetadata.saveAsEntityPath = $sessionMetadata.originalEntityPath
											$sessionMetadata.loadedFromGameFiles = false
											$entity = await getEntityFromText(await readTextFile(detail.id))

											breadcrumb("entity", `Loaded ${$entity.tempHash} from workspace file`)
										} else if (detail.id.endsWith("entity.patch.json")) {
											let patch = json.parse(await readTextFile(detail.id))
											let patched = {}

											if ($appSettings.gameFileExtensions && (await exists(await join($appSettings.gameFileExtensionsDataPath, "TEMP", patch.tempHash + ".TEMP.entity.json")))) {
												await extractForInspection(patch.tempHash)

												$sessionMetadata.originalEntityPath = await join(await appDir(), "inspection", "entity.json")

												patched = json.parse(await readTextFile(await join(await appDir(), "inspection", "entity.json")))
											} else {
												let x = await open({
													multiple: false,
													title: "Select the original entity JSON",
													filters: [
														{
															name: "QuickEntity JSON",
															extensions: ["json"]
														}
													]
												})

												if (!x || Array.isArray(x)) return

												$sessionMetadata.originalEntityPath = x

												patched = json.parse(await readTextFile(x))
											}

											rfc6902.applyPatch(patched, patch.patch)
											$sessionMetadata.saveAsPatch = true
											$sessionMetadata.saveAsPatchPath = detail.id
											$sessionMetadata.loadedFromGameFiles = false
											$entity = await getEntityFromText(json.stringify(patched))

											breadcrumb("entity", `Loaded ${$entity.tempHash} from workspace patch`)
										}
									}
								}}
							/>
						{/await}
					</Pane>
				{/if}
				<Pane>
					<slot />
				</Pane>
			</SplitPanes>
		</div>
	</Content>
	<div class="absolute h-screen top-0 right-2">
		<div class="h-screen flex flex-col-reverse content-end pb-4">
			{#each displayNotifications as { kind, title, subtitle } (title)}
				<div in:fly={{ x: 100 }} out:fade animate:flip>
					<ToastNotification hideCloseButton {kind} {title} {subtitle} />
				</div>
			{/each}
		</div>
	</div>
	<Modal
		bind:open={askGameFileModalOpen}
		modalHeading="Load game file"
		primaryButtonText="Load"
		secondaryButtonText="Cancel"
		on:click:button--secondary={() => (askGameFileModalOpen = false)}
		on:submit={async () => {
			let x = askGameFileModalResult
			if (x.includes(":")) {
				x = ("00" + md5(x).slice(2, 16)).toUpperCase()
			}

			askGameFileModalOpen = false

			await extractForInspection(x)

			$sessionMetadata.originalEntityPath = await join(await appDir(), "inspection", "entity.json")
			$sessionMetadata.saveAsPatch = false
			$sessionMetadata.saveAsEntityPath = $sessionMetadata.originalEntityPath
			$sessionMetadata.loadedFromGameFiles = true

			$entity = await getEntityFromText(await readTextFile(await join(await appDir(), "inspection", "entity.json")))

			breadcrumb("entity", `Loaded ${$entity.tempHash} from game files`)
		}}
	>
		<p>What game file would you like to load? Give either the hash or the path.</p>
		<br />
		<TextInput bind:value={askGameFileModalResult} labelText="Hash or path of game file" placeholder="00123456789ABCDE" />
	</Modal>
	<Modal
		bind:open={reportIssueModalOpen}
		modalHeading="Report issue"
		primaryButtonText="Send report"
		secondaryButtonText="Cancel"
		on:click:button--secondary={() => (reportIssueModalOpen = false)}
		on:submit={async () => {
			reportIssueModalOpen = false

			Sentry.captureMessage(reportIssueModalIssue, reportIssueModalSeverity)

			$addNotification = {
				kind: "success",
				title: "Sent report",
				subtitle: "A report has been sent, along with a log of some of the recent things you did."
			}
		}}
	>
		<p>What kind of issue are you reporting?</p>
		<br />
		<Select
			labelText="Type"
			on:change={({ detail }) => {
				reportIssueModalSeverity = detail
			}}
		>
			<option selected={reportIssueModalSeverity == "info"} value="info">Suggestion</option>
			<option selected={reportIssueModalSeverity == "warning"} value="warning">Minor Issue</option>
			<option selected={reportIssueModalSeverity == "error"} value="error">Major Issue</option>
		</Select>
		<br />
		<TextInput bind:value={reportIssueModalIssue} labelText="Description (be concise)" placeholder="XYZ doesn't work; ABC happens when I do DEF" />
	</Modal>
{/if}

<style global>
	.bx--content {
		background-color: initial;
	}

	.bx--toast-notification:first-child {
		@apply mt-0;
	}

	code {
		font-family: "Fira Code", "IBM Plex Mono", "Menlo", "DejaVu Sans Mono", "Bitstream Vera Sans Mono", Courier, monospace;
	}

	a.bx--header__menu-item:hover[disabled] {
		background-color: inherit;
		color: inherit;
	}

	.splitpanes__pane {
		@apply bg-[#202020] overflow-auto;
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

	.bx--toast-notification__caption {
		display: none;
	}

	.vakata-context {
		margin-top: -22px;
	}

	.bx--inline-loading__animation {
		margin-right: 0px;
	}

	.bx--tree .bx--tree-node {
		background-color: inherit;
	}
</style>
