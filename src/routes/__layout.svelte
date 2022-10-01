<script lang="ts">
	import "../app.css"
	import "carbon-components-svelte/css/g90.css"
	import "$lib/fontawesome/css/all.css"

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

	import { page } from "$app/stores"
	import { fade, fly } from "svelte/transition"
	import { flip } from "svelte/animate"
	import { open, save } from "@tauri-apps/api/dialog"
	import { BaseDirectory, createDir, readTextFile, writeTextFile } from "@tauri-apps/api/fs"
	import { appDir, join, sep } from "@tauri-apps/api/path"
	import { Command } from "@tauri-apps/api/shell"
	import { getVersion } from "@tauri-apps/api/app"
	import jiff from "jiff"
	import md5 from "md5"

	import Data2 from "carbon-icons-svelte/lib/Data_2.svelte"
	import Edit from "carbon-icons-svelte/lib/Edit.svelte"
	import TreeView from "carbon-icons-svelte/lib/TreeView.svelte"
	import Settings from "carbon-icons-svelte/lib/Settings.svelte"
	import Chart_3D from "carbon-icons-svelte/lib/Chart_3D.svelte"
	import { shortcut } from "$lib/shortcut"
	import { gameServer } from "$lib/in-vivo/gameServer"
	import cloneDeep from "lodash/cloneDeep"

	import * as Sentry from "@sentry/browser"
	import { BrowserTracing } from "@sentry/tracing"

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
				integrations: [new BrowserTracing()],
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
				{#if $appSettings.gameFileExtensions}
					<li
						role="none"
						use:shortcut={{ control: true, alt: true, key: "o" }}
						on:click={() => {
							askGameFileModalOpen = true
						}}
					>
						<HeaderNavItem href="#" text="Load entity from game" />
					</li>
				{/if}
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

						let patched = jiff.patch(json.parse(await readTextFile(x)), json.parse(await readTextFile(y)))

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
			askGameFileModalOpen = false

			let x = askGameFileModalResult
			if (x.includes(":")) {
				x = ("00" + md5(x).slice(2, 16)).toUpperCase()
			}

			$entityMetadata.originalEntityPath = await join($appSettings.gameFileExtensionsDataPath, "TEMP", x + ".TEMP.entity.json")
			$entityMetadata.saveAsPatch = false
			$entityMetadata.saveAsEntityPath = $entityMetadata.originalEntityPath
			$entityMetadata.loadedFromGameFiles = true

			$entity = await getEntityFromText(await readTextFile(await join($appSettings.gameFileExtensionsDataPath, "TEMP", x + ".TEMP.entity.json")))
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
