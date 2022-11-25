<script lang="ts">
	import { appSettings } from "$lib/stores"
	import { InlineLoading } from "carbon-components-svelte"
	import { onMount } from "svelte"

	let qotdUrl: string | null = null
	let qotdLastAnswers: string | null = null

	onMount(async () => {
		try {
			const x = await (await fetch("https://hitman-resources.netlify.app/quickentity-editor/qotd.json?t=" + Date.now())).json()
			qotdUrl = x.url
			qotdLastAnswers = x.last
		} catch {}
	})
</script>

<div class="flex w-full h-full items-center justify-center">
	<div class="max-w-[30%]">
		<h1>Welcome to QuickEntity Editor</h1>
		<div class="flex items-center gap-4">
			<div class="flex items-center gap-2">
				<p class="flex-grow">Game file extensions</p>
				<div>
					{#if $appSettings.gameFileExtensions}
						<InlineLoading status="finished" />
					{:else}
						<InlineLoading status="error" />
					{/if}
				</div>
			</div>
			<div class="flex items-center gap-2">
				<p class="flex-grow">In-vivo extensions</p>
				<div>
					{#if $appSettings.inVivoExtensions}
						<InlineLoading status="finished" />
					{:else}
						<InlineLoading status="error" />
					{/if}
				</div>
			</div>
			<div class="flex items-center gap-2">
				<p class="flex-grow">Error reporting</p>
				<div>
					{#if $appSettings.enableLogRocket}
						<InlineLoading status="finished" />
					{:else}
						<InlineLoading status="error" />
					{/if}
				</div>
			</div>
		</div>
		<br />
		<p>
			Use the options above to load an existing file or
			<a href="/tree">start with a blank entity.</a>
			If you need help, there's a Help button at the top for all pages except this one.
		</p>
		{#if qotdUrl}
			<br />
			<p>Also, why not answer a quick question?</p>
			<iframe data-tally-src={qotdUrl} width="100%" frameborder="0" marginheight="0" marginwidth="0" title="Question of the Day" />
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
			{#if qotdLastAnswers}
				<br />
				Last question's results: {qotdLastAnswers}
			{/if}
		{/if}
	</div>
</div>
