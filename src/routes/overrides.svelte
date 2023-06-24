<script lang="ts">
	import OverrideMonacoEditor from "$lib/components/OverrideMonacoEditor.svelte"
	import json from "$lib/json"
	import type { Entity, PropertyOverride } from "$lib/quickentity-types"
	import { appSettings, entity, parsedEntities, workspaceData } from "$lib/stores"
	import { normaliseToHash } from "$lib/utils"
	import { readTextFile, exists as tauriExists } from "@tauri-apps/api/fs"
	import { join } from "@tauri-apps/api/path"
	import { Button, Modal, TextInput, Tile, Checkbox } from "carbon-components-svelte"
	import { onMount } from "svelte"
	import debounce from "lodash/debounce"
	import isEqual from "lodash/isEqual"

	import Close from "carbon-icons-svelte/lib/Close.svelte"
	import CloseOutline from "carbon-icons-svelte/lib/CloseOutline.svelte"
	import Add from "carbon-icons-svelte/lib/Add.svelte"
	import md5 from "md5"

	let overriddenEntityNames: Record<string, string> = {}

	let entityReferenceModalOpen = false
	let entityReferenceModalType: "property" | "delete" = null!
	let entityReferenceModalOverride: PropertyOverride = null!

	let entityReferenceModalRef: string
	let entityReferenceModalUseExpEnt = false
	let entityReferenceModalExpEnt: string
	let entityReferenceModalUseExtScene = false
	let entityReferenceModalExtScene: string

	let friendlyHashes: Record<string, string> = {}

	const exists = async (path: string) => {
		try {
			return (await tauriExists(path)) as unknown as boolean
		} catch {
			return false
		}
	}

	$: (async () => {
		if ($appSettings.gameFileExtensions) {
			for (let override of $entity.propertyOverrides) {
				for (let ref of override.entities) {
					if (typeof ref == "object" && ref?.externalScene) {
						if (!$parsedEntities[normaliseToHash(ref.externalScene)]) {
							$parsedEntities[normaliseToHash(ref.externalScene)] = json.parse(
								await readTextFile(await join($appSettings.gameFileExtensionsDataPath, "TEMP", normaliseToHash(ref.externalScene) + ".TEMP.entity.json"))
							)
						}

						overriddenEntityNames[normaliseToHash(ref.externalScene) + ref.ref] = $parsedEntities[normaliseToHash(ref.externalScene)].entities[ref.ref].name

						overriddenEntityNames = overriddenEntityNames
					}
				}
			}

			for (let ref of $entity.overrideDeletes) {
				if (typeof ref == "object" && ref?.externalScene) {
					if (!$parsedEntities[normaliseToHash(ref.externalScene)]) {
						$parsedEntities[normaliseToHash(ref.externalScene)] = json.parse(
							await readTextFile(await join($appSettings.gameFileExtensionsDataPath, "TEMP", normaliseToHash(ref.externalScene) + ".TEMP.entity.json"))
						)
					}

					overriddenEntityNames[normaliseToHash(ref.externalScene) + ref.ref] = $parsedEntities[normaliseToHash(ref.externalScene)].entities[ref.ref].name

					overriddenEntityNames = overriddenEntityNames
				}
			}
		}

		if ($workspaceData.path) {
			if (await exists(await join($workspaceData.path, "project.json"))) {
				const proj = JSON.parse(await readTextFile(await join($workspaceData.path, "project.json")))

				if (proj.customPaths) {
					friendlyHashes = Object.fromEntries(proj.customPaths.map((a: string) => [("00" + md5(a).slice(2, 16)).toUpperCase(), a]))
				}
			}
		}
	})()

	const updatePropertyData = debounce((override, detail) => {
		try {
			if (!isEqual(override.properties, json.parse(detail))) {
				override.properties = json.parse(detail)
			}
		} catch {}
	}, 500)
</script>

<div class="flex flex-col h-full p-2 px-3">
	<h1>Overrides</h1>
	<div class="flex-grow overflow-y-auto overflow-x-hidden">
		<div class="shepherd-propertyOverrides">
			<h2>Property overrides</h2>
			{#each $entity.propertyOverrides as override}
				<br />
				<Tile>
					<h4>Entities</h4>
					<div class="mt-1 flex flex-wrap gap-2 items-center">
						{#each override.entities as ref}
							<div class="inline-flex gap-3 items-center pl-3 bg-neutral-800">
								{#if $appSettings.gameFileExtensions && ref && typeof ref == "object"}
									{#if overriddenEntityNames[normaliseToHash(ref?.externalScene) + ref?.ref]}
										<div>
											<span style="font-size: 0.7rem">
												{ref.ref} in {friendlyHashes[ref.externalScene || ""] || ref.externalScene}
											</span>
											<br />
											<span style="font-size: 1rem">
												{overriddenEntityNames[normaliseToHash(ref?.externalScene) + ref.ref]}
											</span>
										</div>
									{:else}
										{ref.ref} in {friendlyHashes[ref.externalScene || ""] || ref.externalScene}
									{/if}
								{:else if ref && typeof ref == "object"}
									{ref.ref} in {friendlyHashes[ref.externalScene || ""] || ref.externalScene}
								{:else}
									{ref}
								{/if}
								<Button
									kind="ghost"
									icon={CloseOutline}
									iconDescription="Remove"
									on:click={() => {
										override.entities = override.entities.filter((a) => !isEqual(a, ref))
									}}
								/>
							</div>
						{/each}
						<Button
							icon={Add}
							on:click={() => {
								entityReferenceModalType = "property"
								entityReferenceModalOverride = override
								entityReferenceModalOpen = true
							}}
						>
							Add an entity
						</Button>
					</div>
					<br />
					<h4>Properties</h4>
					<OverrideMonacoEditor jsonToDisplay={override.properties} on:contentChanged={({ detail }) => updatePropertyData(override, detail)} />
					<br />
					<Button
						kind="danger"
						icon={Close}
						on:click={() => {
							$entity.propertyOverrides = $entity.propertyOverrides.filter((a) => !isEqual(a, override))
						}}
					>
						Remove override
					</Button>
				</Tile>
			{/each}
			<br />
			<Button
				icon={Add}
				on:click={() => {
					$entity.propertyOverrides = [
						...$entity.propertyOverrides,
						{
							entities: [],
							properties: {}
						}
					]
				}}
			>
				Add a property override
			</Button>
		</div>
		<div class="shepherd-overrideDeletes">
			<h2 class="mt-2">Override deletes</h2>
			<div class="flex flex-wrap gap-2">
				{#each $entity.overrideDeletes as ref}
					<Tile>
						<div class="flex items-center gap-4">
							{#if $appSettings.gameFileExtensions && ref && typeof ref == "object"}
								{#if overriddenEntityNames[normaliseToHash(ref?.externalScene) + ref?.ref]}
									<div>
										<span style="font-size: 0.7rem">
											{ref.ref} in {friendlyHashes[ref.externalScene || ""] || ref.externalScene}
										</span>
										<br />
										<span style="font-size: 1rem">
											{overriddenEntityNames[normaliseToHash(ref?.externalScene) + ref.ref]}
										</span>
									</div>
								{:else}
									{ref.ref} in {friendlyHashes[ref.externalScene || ""] || ref.externalScene}
								{/if}
							{:else if ref && typeof ref == "object"}
								{ref.ref} in {friendlyHashes[ref.externalScene || ""] || ref.externalScene}
							{:else}
								{ref}
							{/if}

							<Button
								kind="ghost"
								size="small"
								icon={CloseOutline}
								iconDescription="Remove"
								on:click={() => {
									$entity.overrideDeletes = $entity.overrideDeletes.filter((a) => !isEqual(a, ref))
								}}
							/>
						</div>
					</Tile>
				{/each}
			</div>
			<br />
			<Button
				icon={Add}
				on:click={() => {
					entityReferenceModalType = "delete"
					entityReferenceModalOpen = true
				}}
			>
				Add an override delete
			</Button>
		</div>
	</div>
</div>

<Modal
	bind:open={entityReferenceModalOpen}
	modalHeading="Entity reference"
	primaryButtonText="Add"
	secondaryButtonText="Cancel"
	on:click:button--secondary={() => (entityReferenceModalOpen = false)}
	on:submit={async () => {
		entityReferenceModalOpen = false

		if (entityReferenceModalType == "property") {
			entityReferenceModalOverride.entities.push(
				entityReferenceModalUseExpEnt || entityReferenceModalUseExtScene
					? {
							ref: entityReferenceModalRef,
							exposedEntity: entityReferenceModalUseExpEnt ? entityReferenceModalExpEnt : undefined,
							externalScene: entityReferenceModalUseExtScene ? entityReferenceModalExtScene : null
					  }
					: entityReferenceModalRef
			)

			$entity.propertyOverrides = $entity.propertyOverrides
		} else {
			$entity.overrideDeletes = [
				...$entity.overrideDeletes,
				entityReferenceModalUseExpEnt || entityReferenceModalUseExtScene
					? {
							ref: entityReferenceModalRef,
							exposedEntity: entityReferenceModalUseExpEnt ? entityReferenceModalExpEnt : undefined,
							externalScene: entityReferenceModalUseExtScene ? entityReferenceModalExtScene : null
					  }
					: entityReferenceModalRef
			]
		}
	}}
>
	<p>What entity would you like to reference?</p>
	<br />
	<TextInput bind:value={entityReferenceModalRef} labelText="Entity ID" placeholder="0123456789abcdef" />
	<br />

	<Checkbox bind:checked={entityReferenceModalUseExpEnt} labelText="Exposed entity" />
	<br />
	{#if entityReferenceModalUseExpEnt}
		<TextInput bind:value={entityReferenceModalExpEnt} labelText="Exposed entity" placeholder="SomeEntity" />
		<br />
	{/if}

	<Checkbox bind:checked={entityReferenceModalUseExtScene} labelText="External scene" />
	{#if entityReferenceModalUseExtScene}
		<br />
		<TextInput bind:value={entityReferenceModalExtScene} labelText="External scene" placeholder="[assembly:/cool_scene.entitytemplate].pc_entitytemplate" />
	{/if}
</Modal>
