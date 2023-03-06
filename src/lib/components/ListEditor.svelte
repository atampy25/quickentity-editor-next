<script lang="ts">
	import { Button } from "carbon-components-svelte"

	import CloseOutline from "carbon-icons-svelte/lib/CloseOutline.svelte"
	import Edit from "carbon-icons-svelte/lib/Edit.svelte"
	import AddAlt from "carbon-icons-svelte/lib/AddAlt.svelte"

	import { appSettings } from "$lib/stores"

	import { createEventDispatcher } from "svelte"

	import TextInputModal from "$lib/components/TextInputModal.svelte"

	const dispatch = createEventDispatcher()

	export let data: string[]

	let newValueInputModal: TextInputModal
	let newValueInputModalOpen = false
	let valueToEdit = ""

	const padding = $appSettings.compactMode ? "py-0.5 px-2" : "py-2 px-4"
</script>

<br />
<table class="table-auto border-collapse bg-[#393939]">
	<tbody>
		{#each data as value, index (value)}
			<tr class:border-b={index != data.length - 1} class="border-solid border-b-white">
				<td class="{padding} text-[#f4f4f4]">
					<div class="flex flex-row gap-4 items-center">
						<code class="flex-grow break-all">{value}</code>
						<Button
							kind="ghost"
							size="small"
							icon={Edit}
							iconDescription="Edit value"
							on:click={() => {
								valueToEdit = value
								newValueInputModalOpen = true
							}}
						/>
						<Button
							kind="ghost"
							size="small"
							icon={CloseOutline}
							iconDescription="Remove value"
							on:click={() => {
								dispatch("undefine", {
									value
								})
							}}
						/>
					</div>
				</td>
			</tr>
		{/each}
		{#if data.length == 0}
			<tr class="border-solid border-b-white">
				<td class="{padding} text-[#f4f4f4]">
					<div class="flex flex-row gap-4 items-center">
						<code class="flex-grow">No entries</code>
					</div>
				</td>
			</tr>
		{/if}
	</tbody>
</table>
<br />
<div class="text-white">
	<Button
		kind="primary"
		icon={AddAlt}
		on:click={() => {
			valueToEdit = ""
			newValueInputModalOpen = true
		}}
	>
		Add an entry
	</Button>
</div>

<TextInputModal
	bind:this={newValueInputModal}
	bind:showingModal={newValueInputModalOpen}
	modalText={valueToEdit ? `Edit ${valueToEdit}` : "Add an entry"}
	modalPlaceholder={valueToEdit}
	modalInitialText={valueToEdit}
	on:close={() => {
		if (newValueInputModal.value && newValueInputModal.value.length) {
			dispatch("define", {
				original: valueToEdit,
				new: newValueInputModal.value
			})
		}
	}}
/>
