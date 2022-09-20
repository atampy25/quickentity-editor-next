<script lang="ts">
	import { CircleGeometry, MeshStandardMaterial, BoxGeometry, DoubleSide } from "three"
	import { DEG2RAD } from "three/src/math/MathUtils"
	import { AmbientLight, Canvas, DirectionalLight, Group, Mesh, OrbitControls, PerspectiveCamera } from "@threlte/core"

	import Entity3DMesh from "$lib/components/Entity3DMesh.svelte"
	import { appSettings, entity } from "$lib/stores"
	import { onMount } from "svelte"
	import json from "$lib/json"
	import { readTextFile } from "@tauri-apps/api/fs"
	import { join } from "@tauri-apps/api/path"
	import type { Entity } from "$lib/quickentity-types"
</script>

<div class="flex flex-col h-full">
	<h1>3D Preview</h1>
	<div class="flex-grow overflow-y-auto overflow-x-hidden">
		<Canvas>
			<PerspectiveCamera position={{ x: 10, y: 10, z: 10 }} fov={24}>
				<OrbitControls maxPolarAngle={DEG2RAD * 80} autoRotate={true} enableZoom={true} target={{ y: 0.5 }} />
			</PerspectiveCamera>

			<DirectionalLight shadow position={{ x: 5, y: 10, z: 10 }} />
			<DirectionalLight position={{ x: -5, y: 10, z: -10 }} intensity={0.2} />
			<AmbientLight intensity={1} />

			{#await join($appSettings.gameFileExtensionsDataPath, "TEMP", "0061F5664CA5E39D.TEMP.entity.json") then joined}
				{#await readTextFile(joined) then content}
					<Entity3DMesh entity={$entity} scale={{ x: 0.1, y: 0.1, z: 0.1 }} />
				{/await}
			{/await}

			<!-- Floor -->
			<Mesh receiveShadow rotation={{ x: -90 * (Math.PI / 180) }} geometry={new CircleGeometry(3, 72)} material={new MeshStandardMaterial({ side: DoubleSide, color: "white" })} />
		</Canvas>
	</div>
</div>
