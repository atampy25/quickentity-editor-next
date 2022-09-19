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
	import { readTextFile, writeTextFile } from "@tauri-apps/api/fs"
	import { join } from "@tauri-apps/api/path"
	import { Command } from "@tauri-apps/api/shell"
	import jiff from "jiff"
	import md5 from "md5"

	import Data2 from "carbon-icons-svelte/lib/Data_2.svelte"
	import Edit from "carbon-icons-svelte/lib/Edit.svelte"
	import TreeView from "carbon-icons-svelte/lib/TreeView.svelte"
	import Settings from "carbon-icons-svelte/lib/Settings.svelte"

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
</script>

{#if ready}
	<Header company="QuickEntity" platformName="Editor" bind:isSideNavOpen>
		<svelte:fragment slot="skip-to-content">
			<SkipToContent />
		</svelte:fragment>
		<HeaderNav>
			<HeaderNavMenu text="Load">
				<HeaderNavItem
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
							$entity = json.parse(await readTextFile(x))
						}
					}}
					href="#"
					text="Load entity from file"
				/>
				{#if $appSettings.gameFileExtensions}
					<HeaderNavItem
						on:click={() => {
							askGameFileModalOpen = true
						}}
						href="#"
						text="Load entity from game"
					/>
				{/if}
				<HeaderNavItem
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
						await writeTextFile("./patched.json", json.stringify(patched))

						$entityMetadata.originalEntityPath = "./patched.json"
						$entity = patched
					}}
					href="#"
					text="Load entity from patch"
				/>
			</HeaderNavMenu>
			<HeaderNavMenu text="Save">
				<HeaderNavItem
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

						await writeTextFile(x, json.stringify($entity))
					}}
					href="#"
					text="Save as entity file"
				/>
				<HeaderNavItem
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

						await writeTextFile("./entity.json", json.stringify($entity))

						await new Command("sidecar/quickentity-rs", ["--input1", String($entityMetadata.originalEntityPath), "--input2", "./entity.json", "--output", x]).spawn()
					}}
					href="#"
					text="Save as patch file"
				/>
			</HeaderNavMenu>
		</HeaderNav>

		<SideNav bind:isOpen={isSideNavOpen} rail>
			<SideNavItems>
				<SideNavLink icon={Data2} text="Metadata" href="/metadata" isSelected={$page.url.pathname == "/metadata"} />
				<SideNavDivider />
				<SideNavLink icon={Edit} text="Overrides" href="/overrides" isSelected={$page.url.pathname == "/overrides"} />
				<SideNavDivider />
				<SideNavLink icon={TreeView} text="Tree View" href="/" isSelected={$page.url.pathname == "/"} />
				<SideNavDivider />
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

			if (askGameFileModalResult.includes(":")) {
				askGameFileModalResult = ("00" + md5(askGameFileModalResult).slice(2, 16)).toUpperCase()
			}

			$entityMetadata.originalEntityPath = await join($appSettings.gameFileExtensionsDataPath, "TEMP", askGameFileModalResult + ".TEMP.entity.json")
			$entity = json.parse(await readTextFile(await join($appSettings.gameFileExtensionsDataPath, "TEMP", askGameFileModalResult + ".TEMP.entity.json")))
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
</style>
