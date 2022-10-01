<script lang="ts">
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

<div class="flex flex-col h-full">
	<div>
		<h1 class="mb-2">Settings</h1>
		<TextInput labelText="Retail path (required)" placeholder={documentsPath + "blabla"} bind:value={$appSettings.retailPath} />
		<br />
		<TextInput labelText="Runtime path (required)" placeholder={documentsPath + "blabla"} bind:value={$appSettings.runtimePath} />
		<br />
		<div class="flex items-center gap-2">
			<div class="flex-shrink"><Checkbox bind:checked={$appSettings.gameFileExtensions} labelText="Enable game-file extensions" /></div>
			<TooltipIcon icon={Information}>
				<span slot="tooltipText" style="font-size: 0.875rem; margin-top: 0.5rem; margin-bottom: 0.5rem">
					QuickEntity Editor has a set of extensions that make it far easier to work with game entities, including the ability to quickly load any game entity, the ability to preview
					overrides, 3D previews for sub-entities and deep intellisense. These require extracting up to 8 gigabytes of game files, however.
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
							await copyFile("LogPins.dll", await join($appSettings.retailPath, "mods", "LogPins.dll"))
							await copyFile("LogPins.pdb", await join($appSettings.retailPath, "mods", "LogPins.pdb"))
						} else {
							await removeFile(await join($appSettings.retailPath, "mods", "LogPins.dll"))
							await removeFile(await join($appSettings.retailPath, "mods", "LogPins.pdb"))
						}
					}}
					labelText="Enable in-vivo extensions"
				/>
			</div>
			<TooltipIcon icon={Information}>
				<span slot="tooltipText" style="font-size: 0.875rem; margin-top: 0.5rem; margin-bottom: 0.5rem">
					If you're using a version of the game with a working ZHMModSDK installed, you can enable a set of extensions that allow you to work with entities while the game is running,
					including highlighting them in-game and setting properties without requiring a game restart.
				</span>
			</TooltipIcon>
		</div>
		<br />
		<div class="flex items-center gap-2">
			<div class="flex-shrink">
				<Checkbox bind:checked={$appSettings.enableLogRocket} labelText="Enable error and performance reporting (requires a restart to take effect)" />
			</div>
			<TooltipIcon icon={Information}>
				<span slot="tooltipText" style="font-size: 0.875rem; margin-top: 0.5rem; margin-bottom: 0.5rem">
					Will effectively screen-record your QNE window (doesn't include file explorer windows and such). Don't enter passwords in QNE I guess?
				</span>
			</TooltipIcon>
		</div>
		<br />
		{#if $appSettings.enableLogRocket}
			<TextInput labelText="Identifier for reporting" placeholder={"EpicGamer123 (leave blank to be anonymous)"} bind:value={$appSettings.logRocketName} />
			<br />
		{/if}
		<h1>Information</h1>
		<p>
			QuickEntity Editor is licensed under the GNU General Public License version 3.0 (GPLv3). The in-vivo extensions are a result of work from primarly piepieonline, re-compiled for the newest
			SDK version by invalid. The ZHMModSDK it uses was created by NoFaTe (OrfeasZ), to whom we owe, in part, the current state of Hitman modding to. QNE also includes RPKGv3, which is licensed
			under MIT and developed by a number of contributors, including primarily 2kpr.
		</p>
		<br />
		<h1>Feedback survey</h1>
		<br />
	</div>
	<div class="overflow-y-auto flex-grow">
		<iframe data-tally-src="https://tally.so/embed/3xXq0r?hideTitle=1" width="100%" height="100%" frameborder="0" marginheight="0" marginwidth="0" title="QuickEntity Editor feedback" />
		<script>
			var d = document,
				w = "https://tally.so/widgets/embed.js",
				v = function () {
					"undefined" != typeof Tally
						? Tally.loadEmbeds()
						: d.querySelectorAll("iframe[data-tally-src]:not([src])").forEach(function (e) {
								e.src = e.dataset.tallySrc
						  })
				}
			if (d.querySelector('script[src="' + w + '"]')) v()
			else {
				var s = d.createElement("script")
				;(s.src = w), (s.onload = v), (s.onerror = v), d.body.appendChild(s)
			}
		</script>
	</div>
</div>
