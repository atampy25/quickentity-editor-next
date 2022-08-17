<script lang="ts">
	import "../app.css"
	import "carbon-components-svelte/css/g90.css"
	import { onMount } from "svelte"

	let ready: boolean = false
	onMount(() => (ready = true))
	import { Header, HeaderNav, HeaderNavItem, HeaderNavMenu, SideNav, SideNavItems, SideNavMenu, SideNavMenuItem, SideNavLink, SideNavDivider, SkipToContent, Content } from "carbon-components-svelte"
	import { page } from "$app/stores"

	import Data2 from "carbon-icons-svelte/lib/Data_2.svelte"
	import Edit from "carbon-icons-svelte/lib/Edit.svelte"
	import TreeView from "carbon-icons-svelte/lib/TreeView.svelte"

	let isSideNavOpen = false
</script>

{#if ready}
	<Header company="QuickEntity" platformName="Editor" bind:isSideNavOpen>
		<svelte:fragment slot="skip-to-content">
			<SkipToContent />
		</svelte:fragment>
		<HeaderNav>
			<HeaderNavItem on:click={() => {}} href="#" text="Load Entity" />
			<HeaderNavItem on:click={() => {}} href="#" text="Load Patch" />
			<HeaderNavItem on:click={() => {}} href="#" text="Save Entity" />
			<HeaderNavItem on:click={() => {}} href="#" text="Save Patch" />
		</HeaderNav>

		<SideNav bind:isOpen={isSideNavOpen} rail>
			<SideNavItems>
				<SideNavLink icon={Data2} text="Metadata" href="/metadata" isSelected={$page.url.pathname == "/metadata"} />
				<SideNavDivider />
				<SideNavLink icon={Edit} text="Overrides" href="/overrides" isSelected={$page.url.pathname == "/overrides"} />
				<SideNavDivider />
				<SideNavLink icon={TreeView} text="Tree View" href="/" isSelected={$page.url.pathname == "/"} />
			</SideNavItems>
		</SideNav>
	</Header>
	<Content>
		<slot />
	</Content>
{/if}

<style global>
	.bx--content {
		background-color: initial;
	}
</style>
