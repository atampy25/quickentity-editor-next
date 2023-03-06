<script lang="ts">
	import ColorPicker from "$lib/components/ColorPicker.svelte"
	import { gameServer } from "$lib/in-vivo/gameServer"
	import { appSettings } from "$lib/stores"
	import { BaseDirectory, copyFile, removeFile } from "@tauri-apps/api/fs"
	import { documentDir, join } from "@tauri-apps/api/path"
	import { Checkbox, TextInput, Tooltip, TooltipIcon } from "carbon-components-svelte"

	import Information from "carbon-icons-svelte/lib/Information.svelte"
	import { slide } from "svelte/transition"

	let documentsPath: string
	;(async () => {
		documentsPath = await documentDir()
	})()
</script>

<div class="p-2 px-3 h-full overflow-y-auto overflow-x-hidden">
	<h1>Information</h1>
	<p>QuickEntity Editor is licensed under the GNU General Public License version 3.0 (GPLv3).</p>
	<p>The in-vivo extensions SDK mod is a result of work from primarly piepieonline, slightly modified and re-compiled for the newest SDK version.</p>
	<p>The ZHMModSDK it uses was created by NoFaTe (OrfeasZ), to whom we owe, in part, the current state of Hitman modding to.</p>
	<p>QNE also includes RPKGv2, which is licensed under MIT and developed by a number of contributors, including primarily 2kpr.</p>
	<br />
	<h1 class="mb-2">Settings</h1>
	<TextInput labelText="Retail path (required)" placeholder={documentsPath + "blabla"} bind:value={$appSettings.retailPath} />
	<br />
	<TextInput labelText="Runtime path (required)" placeholder={documentsPath + "blabla"} bind:value={$appSettings.runtimePath} />
	<br />
	<Checkbox bind:checked={$appSettings.h1} labelText="Above paths are from HITMAN™ (2016) install" />
	<br />
	<div class="flex items-center gap-2">
		<div class="flex-shrink">
			<Checkbox bind:checked={$appSettings.technicalMode} labelText="Enable technical mode" />
		</div>
		<TooltipIcon icon={Information}>
			<span slot="tooltipText" style="font-size: 0.875rem; margin-top: 0.5rem; margin-bottom: 0.5rem">
				If you know how to program in JavaScript, you can enable technical mode to add a function evaluation tool to the Tree view.
			</span>
		</TooltipIcon>
	</div>
	<br />
	<Checkbox bind:checked={$appSettings.autoSaveOnSwitchFile} labelText="Automatically save when switching workspace files" />
	<br />
	<Checkbox bind:checked={$appSettings.extractModdedFiles} labelText="Load modded versions when loading from game files" />
	<br />
	<div class="flex items-center gap-2">
		<div class="flex-shrink">
			<Checkbox bind:checked={$appSettings.gameFileExtensions} labelText="Enable game-file extensions" disabled={$appSettings.retailPath == "" || $appSettings.runtimePath == ""} />
		</div>
		<TooltipIcon icon={Information}>
			<span slot="tooltipText" style="font-size: 0.875rem; margin-top: 0.5rem; margin-bottom: 0.5rem">
				QuickEntity Editor has a set of extensions that make it far easier to work with game entities, including the ability to visualise and edit pin connections, auto-complete for available
				properties and their default values, a help menu for entities and the ability to preview overrides. These require extracting up to 8 gigabytes of game files, however.
			</span>
		</TooltipIcon>
	</div>
	<br />
	{#if $appSettings.gameFileExtensions}
		<TextInput labelText="Path to game file data (required)" placeholder={documentsPath + "blabla"} bind:value={$appSettings.gameFileExtensionsDataPath} />
		<br />
	{/if}
	<div class="flex items-center gap-2">
		<div class="flex-shrink">
			<Checkbox
				bind:checked={$appSettings.inVivoExtensions}
				on:change={async () => {
					if ($appSettings.inVivoExtensions) {
						try {
							await copyFile("GameConnection.dll", await join($appSettings.retailPath, "mods", "GameConnection.dll"))
						} catch {}

						try {
							await copyFile("GameConnection.pdb", await join($appSettings.retailPath, "mods", "GameConnection.pdb"))
						} catch {}
					} else {
						try {
							await removeFile(await join($appSettings.retailPath, "mods", "GameConnection.dll"))
						} catch {}

						try {
							await removeFile(await join($appSettings.retailPath, "mods", "GameConnection.pdb"))
						} catch {}
					}
				}}
				labelText="Enable in-vivo extensions"
				disabled={$appSettings.retailPath == "" || $appSettings.runtimePath == ""}
			/>
		</div>
		<TooltipIcon icon={Information}>
			<span slot="tooltipText" style="font-size: 0.875rem; margin-top: 0.5rem; margin-bottom: 0.5rem">
				If you're using a version of the game with a working ZHMModSDK installed, you can enable a set of extensions that allow you to work with entities while the game is running, including
				highlighting them in-game and setting properties without requiring a game restart.
			</span>
		</TooltipIcon>
	</div>
	<br />
	{#if $appSettings.inVivoExtensions}
		<Checkbox bind:checked={$appSettings.autoHighlightEntities} labelText="Automatically highlight selected entities" />
		<br />
		<div class="flex flex-wrap gap-2 items-center">
			Preferred highlight colour
			<ColorPicker
				type="rgb"
				bind:value={$appSettings.preferredHighlightColour}
				on:change={async ({ detail }) => {
					if (gameServer.connected && gameServer.lastMessage != 0 && Math.max(0, Date.now() - gameServer.lastMessage) > 0) {
						await gameServer.setHighlightColour(detail)
					}
				}}
			/>
		</div>
		<br />
	{/if}
	<div class="flex items-center gap-2">
		<div class="flex-shrink">
			<Checkbox bind:checked={$appSettings.enableLogRocket} labelText="Enable issue reporting (requires a restart to take effect)" />
		</div>
		<TooltipIcon icon={Information}>
			<span slot="tooltipText" style="font-size: 0.875rem; margin-top: 0.5rem; margin-bottom: 0.5rem">
				Will automatically report errors to the internet for review. Also performs a watered-down (with inputs censored and open/save windows not included) screen recording of the session, and
				allows you to submit your own reports with a button.
			</span>
		</TooltipIcon>
	</div>
	<br />
	{#if $appSettings.enableLogRocket}
		<TextInput labelText="Identifier for reporting" placeholder={"EpicGamer123 (leave blank to be anonymous)"} bind:value={$appSettings.logRocketName} />
		<br />
	{/if}
	<div class="flex items-center gap-2">
		<div class="flex-shrink">
			<Checkbox bind:checked={$appSettings.sdkEditorEnabled} labelText="Enable SDK Editor integration" />
		</div>
		<TooltipIcon icon={Information}>
			<span slot="tooltipText" style="font-size: 0.875rem; margin-top: 0.5rem; margin-bottom: 0.5rem">TODO</span>
		</TooltipIcon>
	</div>
	<br />
</div>
