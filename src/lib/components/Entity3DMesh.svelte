<script lang="ts">
	import { MeshStandardMaterial, BoxGeometry, Euler } from "three"
	import { Group, Mesh, Object3DInstance } from "@threlte/core"
	import { GLTF, useGltf, type ThrelteGltf } from "@threlte/extras"
	import { appSettings, inProgressMeshLoads, intellisense, parsedEntities } from "$lib/stores"
	import { readTextFile, exists as tauriExists } from "@tauri-apps/api/fs"
	import json from "$lib/json"
	import { join } from "@tauri-apps/api/path"
	import type { Entity } from "$lib/quickentity-types"
	import { Command } from "@tauri-apps/api/shell"
	import { onMount } from "svelte"
	import { getReferencedLocalEntity, normaliseToHash } from "$lib/utils"
	import { convertFileSrc } from "@tauri-apps/api/tauri"
	import { DEG2RAD, RAD2DEG } from "three/src/math/MathUtils"
	import RPKGInstance from "$lib/rpkg"

	export let entity: Entity

	export let position = {}
	export let rotation = {}
	export let scale = {}

	const rpkg = new RPKGInstance()

	const readJSON = async (path: string) => json.parse(await readTextFile(path))
	const exists = async (path: string) => {
		try {
			return await tauriExists(path)
		} catch {
			return false
		}
	}

	let templates: Record<string, string[]> = {}
	let finalTransforms: Record<
		string,
		{
			position: { x: number; y: number; z: number }
			rotation: { x: number; y: number; z: number }
		}
	> = {}
	let loadedGeometry: Record<string, ThrelteGltf<any, any> | undefined> = {}

	let ready = false

	function getAllTransforms(
		entityID: string,
		soFar: {
			position: { x: number; y: number; z: number }
			rotation: { x: number; y: number; z: number }
		}[] = []
	) {
		if (entity.entities[entityID].properties?.m_mTransform) {
			soFar.push(entity.entities[entityID].properties!.m_mTransform.value)
		}

		if (entity.entities[entityID].properties?.m_eidParent && getReferencedLocalEntity(entity.entities[entityID].properties!.m_eidParent.value)) {
			getAllTransforms(getReferencedLocalEntity(entity.entities[entityID].properties!.m_eidParent.value) as string, soFar)
		}

		return soFar
	}

	function getFinalTransform(
		transforms: {
			position: { x: number; y: number; z: number }
			rotation: { x: number; y: number; z: number }
		}[]
	) {
		return transforms.reverse().reduce(
			(trans, transToAdd) => {
				return {
					position: {
						x: +trans.position.x + +transToAdd.position.x,
						y: +trans.position.y + +transToAdd.position.y,
						z: +trans.position.z + +transToAdd.position.z
					},
					rotation: {
						x: (+trans.rotation.x + +transToAdd.rotation.x) % 360,
						y: (+trans.rotation.y + +transToAdd.rotation.y) % 360,
						z: (+trans.rotation.z + +transToAdd.rotation.z) % 360
					}
				}
			},
			{
				position: { x: 0, y: 0, z: 0 },
				rotation: { x: 0, y: 0, z: 0 }
			}
		)
	}

	function isGeom(template: string) {
		return normaliseToHash(template) == "0071AB29D6B30F6B" || normaliseToHash(template) == "00EC8416C5D64860"
	}

	onMount(async () => {
		await rpkg.waitForInitialised()

		for (const [entityID, entityData] of Object.entries(entity.entities)) {
			templates[entityID] = (await exists(await join($appSettings.gameFileExtensionsDataPath, "ASET", normaliseToHash(entityData.template) + ".ASET.meta.JSON")))
				? (await readJSON(await join($appSettings.gameFileExtensionsDataPath, "ASET", normaliseToHash(entityData.template) + ".ASET.meta.JSON"))).hash_reference_data
						.slice(0, -1)
						.map((a) => a.hash)
				: [normaliseToHash(entityData.template)]

			for (const template of templates[entityID]) {
				if (isGeom(template)) {
					if (
						!(await exists(
							`gltf/${
								typeof entityData.properties!.m_ResourceID.value == "string" ? entityData.properties!.m_ResourceID.value : entityData.properties!.m_ResourceID.value.resource
							}.PRIM.glb`
						))
					) {
						if (
							!$inProgressMeshLoads[
								typeof entityData.properties!.m_ResourceID.value == "string" ? entityData.properties!.m_ResourceID.value : entityData.properties!.m_ResourceID.value.resource
							]
						) {
							$inProgressMeshLoads[
								typeof entityData.properties!.m_ResourceID.value == "string" ? entityData.properties!.m_ResourceID.value : entityData.properties!.m_ResourceID.value.resource
							] = true

							await rpkg.callFunction(
								`-extract_prim_textured_from "${$appSettings.runtimePath}" -filter "${
									typeof entityData.properties!.m_ResourceID.value == "string" ? entityData.properties!.m_ResourceID.value : entityData.properties!.m_ResourceID.value.resource
								}" -output_path gltf`
							)

							$inProgressMeshLoads[
								typeof entityData.properties!.m_ResourceID.value == "string" ? entityData.properties!.m_ResourceID.value : entityData.properties!.m_ResourceID.value.resource
							] = false
						} else {
							while (
								$inProgressMeshLoads[
									typeof entityData.properties!.m_ResourceID.value == "string" ? entityData.properties!.m_ResourceID.value : entityData.properties!.m_ResourceID.value.resource
								]
							) {
								await new Promise((resolve) => setTimeout(resolve, 1000))
							}
						}

						useGltf(
							convertFileSrc(
								`gltf/${
									typeof entityData.properties!.m_ResourceID.value == "string" ? entityData.properties!.m_ResourceID.value : entityData.properties!.m_ResourceID.value.resource
								}.PRIM.glb`
							)
						).gltf.subscribe(
							(value) =>
								(loadedGeometry[
									typeof entityData.properties!.m_ResourceID.value == "string" ? entityData.properties!.m_ResourceID.value : entityData.properties!.m_ResourceID.value.resource
								] = value)
						)
					}
				} else if (await exists(await join($appSettings.gameFileExtensionsDataPath, "TEMP", normaliseToHash(template) + ".TEMP.entity.json"))) {
					$parsedEntities[normaliseToHash(template)] = await readJSON(await join($appSettings.gameFileExtensionsDataPath, "TEMP", normaliseToHash(template) + ".TEMP.entity.json"))
				}
			}

			finalTransforms[entityID] = getFinalTransform(getAllTransforms(entityID))
		}

		ready = true

		if (
			Object.entries(templates)
				.filter((a) => a[1].some((b) => isGeom(b)))
				.map((a) =>
					a[1]
						.filter((b) => isGeom(b))
						.map((b) =>
							typeof entity.entities[a[0]].properties!.m_ResourceID.value == "string"
								? entity.entities[a[0]].properties!.m_ResourceID.value
								: entity.entities[a[0]].properties!.m_ResourceID.value.resource
						)
				).length ||
			Object.entries(templates)
				.filter((a) => a[1].some((b) => isGeom(b)))
				.map((a) => [finalTransforms[a[0]], getAllTransforms(a[0])]).length
		) {
			console.log(
				"Readied 3d mesh layer with geometry",
				Object.entries(templates)
					.filter((a) => a[1].some((b) => isGeom(b)))
					.map((a) =>
						a[1]
							.filter((b) => isGeom(b))
							.map((b) =>
								typeof entity.entities[a[0]].properties!.m_ResourceID.value == "string"
									? entity.entities[a[0]].properties!.m_ResourceID.value
									: entity.entities[a[0]].properties!.m_ResourceID.value.resource
							)
					),
				Object.entries(templates)
					.filter((a) => a[1].some((b) => isGeom(b)))
					.map((a) => [finalTransforms[a[0]], getAllTransforms(a[0])])
			)
		}

		await rpkg.exit()
	})
</script>

<!-- Cube -->
<Group {position} {rotation} {scale}>
	{#if ready}
		{#each Object.entries(templates) as [subEntityID, temps]}
			{#each temps as template}
				{#if isGeom(template) && loadedGeometry[typeof entity.entities[subEntityID].properties?.m_ResourceID.value == "string" ? entity.entities[subEntityID].properties?.m_ResourceID.value : entity.entities[subEntityID].properties?.m_ResourceID.value.resource]?.nodes}
					<Group rotation={new Euler(-90 * DEG2RAD, 0, 0, "XYZ")}>
						<Group
							castShadow
							position={{ x: finalTransforms[subEntityID].position.x, y: finalTransforms[subEntityID].position.z, z: finalTransforms[subEntityID].position.y }}
							rotation={new Euler(
								finalTransforms[subEntityID].rotation.x * DEG2RAD,
								finalTransforms[subEntityID].rotation.z * DEG2RAD,
								finalTransforms[subEntityID].rotation.y * DEG2RAD,
								"XYZ"
							)}
						>
							{#each Object.values(loadedGeometry[typeof entity.entities[subEntityID].properties?.m_ResourceID.value == "string" ? entity.entities[subEntityID].properties?.m_ResourceID.value : entity.entities[subEntityID].properties?.m_ResourceID.value.resource].nodes) as node}
								<Object3DInstance object={node} />
							{/each}
						</Group>
					</Group>
				{:else if $parsedEntities[normaliseToHash(template)]}
					<svelte:self
						entity={$parsedEntities[normaliseToHash(template)]}
						position={{ x: finalTransforms[subEntityID].position.x, y: finalTransforms[subEntityID].position.z, z: finalTransforms[subEntityID].position.y }}
						rotation={new Euler(
							finalTransforms[subEntityID].rotation.x * DEG2RAD,
							finalTransforms[subEntityID].rotation.z * DEG2RAD,
							finalTransforms[subEntityID].rotation.y * DEG2RAD,
							"XYZ"
						)}
					/>
				{/if}
			{/each}
		{/each}
	{:else}
		<Mesh castShadow geometry={new BoxGeometry(1, 1, 1)} material={new MeshStandardMaterial({ color: "#333333" })} />
	{/if}
</Group>
