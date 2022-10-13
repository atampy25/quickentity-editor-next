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
		TextInput
	} from "carbon-components-svelte"

	import { addNotification, appSettings, entity, entityMetadata } from "$lib/stores"
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

	import Data2 from "carbon-icons-svelte/lib/Data_2.svelte"
	import Edit from "carbon-icons-svelte/lib/Edit.svelte"
	import TreeView from "carbon-icons-svelte/lib/TreeView.svelte"
	import Settings from "carbon-icons-svelte/lib/Settings.svelte"
	import Chart_3D from "carbon-icons-svelte/lib/Chart_3D.svelte"

	import * as Sentry from "@sentry/browser"
	import { BrowserTracing } from "@sentry/tracing"
	import SentryRRWeb from "@sentry/rrweb"
	import { camelCase } from "jquery"
	import { endsWith } from "lodash"

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

	function getEntityAsText() {
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

		return json.stringify(ent)
	}

	async function getEntityFromText(x: string) {
		const ent = json.parse(x)
		if (ent.entities["abcdefcadc2e258e"]) {
			delete ent.entities["abcdefcadc2e258e"]
			delete ent.entities["abcdefcadc77e4f2"]
		}

		return ent
	}

	onMount(async () => {
		if ($appSettings.enableLogRocket) {
			Sentry.init({
				dsn: "https://7be7af4147884b6093b380e65750e9f6@o1144555.ingest.sentry.io/4503907590537216",
				integrations: [new BrowserTracing(), new SentryRRWeb()],
				tracesSampleRate: 1.0,
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
</script>

{#if ready}
	<Header company="QuickEntity" platformName="Editor" bind:isSideNavOpen>
		<svelte:fragment slot="skip-to-content">
			<SkipToContent />
		</svelte:fragment>
		<HeaderNav>
			<HeaderNavMenu text="Load">
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
							$entityMetadata.originalEntityPath = x
							$entityMetadata.saveAsPatch = false
							$entityMetadata.saveAsEntityPath = $entityMetadata.originalEntityPath
							$entityMetadata.loadedFromGameFiles = false
							$entity = await getEntityFromText(await readTextFile(x))
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

						let patched = json.parse(await readTextFile(x))

						rfc6902.applyPatch(patched, json.parse(await readTextFile(y)))

						$entityMetadata.originalEntityPath = x
						$entityMetadata.saveAsPatch = true
						$entityMetadata.saveAsPatchPath = y
						$entityMetadata.loadedFromGameFiles = false
						$entity = await getEntityFromText(json.stringify(patched))
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

						await writeTextFile(x, getEntityAsText())

						$entityMetadata.saveAsPatch = false
						$entityMetadata.saveAsEntityPath = x
						$entityMetadata.loadedFromGameFiles = false

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
							await writeTextFile("entity.json", getEntityAsText(), { dir: BaseDirectory.App })

							await Command.sidecar("sidecar/quickentity-rs", [
								"patch",
								"generate",
								"--input1",
								String($entityMetadata.originalEntityPath),
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
							await writeTextFile(x, json.stringify(rfc6902.createPatch(json.parse(await readTextFile($entityMetadata.originalEntityPath)), json.parse(getEntityAsText()))))
						}

						$entityMetadata.saveAsPatch = true
						$entityMetadata.saveAsPatchPath = x
						$entityMetadata.loadedFromGameFiles = false

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
			{#if $entityMetadata.originalEntityPath && !$entityMetadata.loadedFromGameFiles}
				{#if $entityMetadata.saveAsPatch}
					<li
						role="none"
						use:shortcut={{ control: true, key: "s" }}
						on:click={async () => {
							await writeTextFile("entity.json", getEntityAsText(), { dir: BaseDirectory.App })

							await Command.sidecar("sidecar/quickentity-rs", [
								"patch",
								"generate",
								"--input1",
								String($entityMetadata.originalEntityPath),
								"--input2",
								await join(await appDir(), "entity.json"),
								"--output",
								$entityMetadata.saveAsPatchPath
							]).execute()

							$entityMetadata.loadedFromGameFiles = false

							$addNotification = {
								kind: "success",
								title: "Saved patch successfully",
								subtitle:
									"Saved the changes from the original entity to " +
									($entityMetadata.saveAsPatchPath.split(sep).length > 3 ? "..." + $entityMetadata.saveAsPatchPath.split(sep).slice(-3).join(sep) : $entityMetadata.saveAsPatchPath)
							}
						}}
					>
						<a role="menuitem" tabindex="0" href="#" class="bx--header__menu-item"><span class="bx--text-truncate--end">Save patch</span></a>
					</li>
				{:else}
					<li
						role="none"
						use:shortcut={{ control: true, key: "s" }}
						on:click={async () => {
							await writeTextFile($entityMetadata.saveAsEntityPath, getEntityAsText())

							$entityMetadata.loadedFromGameFiles = false

							$addNotification = {
								kind: "success",
								title: "Saved entity successfully",
								subtitle:
									"Saved the entity to " +
									($entityMetadata.saveAsEntityPath.split(sep).length > 3
										? "..." + $entityMetadata.saveAsEntityPath.split(sep).slice(-3).join(sep)
										: $entityMetadata.saveAsEntityPath)
							}
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
				<SideNavLink icon={TreeView} text="Tree View" href="/" isSelected={$page.url.pathname == "/"} />
				<SideNavDivider />
				{#if $appSettings.gameFileExtensions}
					<SideNavLink icon={Chart_3D} text="3D Preview" href="/3d" isSelected={$page.url.pathname == "/3d"} />
					<SideNavDivider />
				{/if}
				<SideNavLink icon={Settings} text="Settings" href="/settings" isSelected={$page.url.pathname == "/settings"} />
			</SideNavItems>
		</SideNav>
	</Header>
	<Content>
		<div class="px-16 h-[90vh]">
			<slot />
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

			if (await exists(await join(await appDir(), "inspection"))) {
				await removeDir(await join(await appDir(), "inspection"), { recursive: true })
			}

			askGameFileModalOpen = false

			$addNotification = {
				kind: "info",
				title: "Extracting TEMP files",
				subtitle: "Extracting binary TEMP files"
			}

			let latestChunkTemp = /is in: (.*?.rpkg)/gi.exec((await Command.sidecar("sidecar/rpkg-cli", ["-latest_hash", $appSettings.runtimePath, "-filter", x]).execute()).stdout)[1]

			await Command.sidecar("sidecar/rpkg-cli", [
				"-extract_from_rpkg",
				await join($appSettings.runtimePath, latestChunkTemp),
				"-filter",
				x,
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

			$entityMetadata.originalEntityPath = await join(await appDir(), "inspection", "entity.json")
			$entityMetadata.saveAsPatch = false
			$entityMetadata.saveAsEntityPath = $entityMetadata.originalEntityPath
			$entityMetadata.loadedFromGameFiles = true

			$entity = await getEntityFromText(await readTextFile(await join(await appDir(), "inspection", "entity.json")))
		}}
	>
		<p>What game file would you like to load? Give either the hash or the path.</p>
		<br />
		<TextInput bind:value={askGameFileModalResult} labelText="Hash or path of game file" placeholder="00123456789ABCDE" />
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
</style>
