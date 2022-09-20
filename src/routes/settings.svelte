<script lang="ts">
	import { appSettings } from "$lib/stores"
	import { documentDir } from "@tauri-apps/api/path"
	import { Checkbox, TextInput, Tooltip, TooltipIcon } from "carbon-components-svelte"

	import Information from "carbon-icons-svelte/lib/Information.svelte"
	import { slide } from "svelte/transition"

	let documentsPath: string
	;(async () => {
		documentsPath = await documentDir()
	})()
</script>

<h1>Settings</h1>
<div class="flex items-center gap-2">
	<div class="flex-shrink"><Checkbox bind:checked={$appSettings.gameFileExtensions} labelText="Enable game-file extensions" /></div>
	<TooltipIcon icon={Information}>
		<span slot="tooltipText" style="font-size: 0.875rem; margin-top: 0.5rem; margin-bottom: 0.5rem">
			QuickEntity Editor has a set of extensions that make it far easier to work with game entities, including the ability to quickly load any game entity, the ability to preview overrides and
			deep intellisense. These require extracting up to 8 gigabytes of game files, however.
		</span>
	</TooltipIcon>
</div>
<br />
{#if $appSettings.gameFileExtensions}
	<TextInput labelText="Path to game file data" placeholder={documentsPath + "blabla"} bind:value={$appSettings.gameFileExtensionsDataPath} />
	<br />
{/if}
<TextInput labelText="Runtime path" placeholder={documentsPath + "blabla"} bind:value={$appSettings.runtimePath} />
