import { writable, derived, readable, type Writable, type Readable } from "svelte/store"
import type { Entity, FullRef, RefMaybeConstantValue } from "$lib/quickentity-types"
import { getReferencedEntities, getReferencedLocalEntity } from "$lib/utils"
import Decimal from "decimal.js"
import { forage } from "@tauri-apps/tauri-forage"
import json from "$lib/json"
import { Intellisense } from "$lib/intellisense"
import RPKGInstance from "$lib/rpkg"
import { v4 } from "uuid"

if (!(await forage.getItem({ key: "appSettings" })())) {
	await forage.setItem({
		key: "appSettings",
		value: json.stringify({
			gameFileExtensions: false,
			gameFileExtensionsDataPath: null,
			inVivoExtensions: false,
			runtimePath: "",
			retailPath: "",
			enableLogRocket: false,
			logRocketID: v4(),
			logRocketName: ""
		})
	})()
}

// backwards compatibility
if (!json.parse(await forage.getItem({ key: "appSettings" })()).logRocketID) {
	await forage.setItem({
		key: "appSettings",
		value: Object.assign({}, json.parse(await forage.getItem({ key: "appSettings" })()), {
			logRocketID: v4(),
			logRocketName: ""
		})
	})()
}

export const appSettings: Writable<{
	gameFileExtensions: boolean
	gameFileExtensionsDataPath: string
	runtimePath: string
	retailPath: string
	inVivoExtensions: boolean
	enableLogRocket: boolean
	logRocketID: string
	logRocketName: string
}> = writable(json.parse(await forage.getItem({ key: "appSettings" })()))

appSettings.subscribe(
	(value: {
		gameFileExtensions: boolean
		gameFileExtensionsDataPath: string
		runtimePath: string
		retailPath: string
		inVivoExtensions: boolean
		enableLogRocket: boolean
		logRocketID: string
		logRocketName: string
	}) => {
		void (async () => {
			await forage.setItem({ key: "appSettings", value: json.stringify(value) })()
		})()
	}
)

export const entityMetadata: Writable<{
	originalEntityPath?: string
	saveAsPatch?: boolean
	saveAsEntityPath?: string
	saveAsPatchPath?: string
	loadedFromGameFiles?: boolean
}> = writable({})

export const entity: Writable<Entity> = writable({
	tempHash: "",
	tbluHash: "",
	rootEntity: "fffffffffffffffe",
	entities: {
		fffffffffffffffe: {
			parent: null,
			name: "Scene",
			template: "[modules:/zspatialentity.class].pc_entitytype",
			blueprint: "[modules:/zspatialentity.class].pc_entityblueprint"
		}
	},
	propertyOverrides: [],
	overrideDeletes: [],
	pinConnectionOverrides: [],
	pinConnectionOverrideDeletes: [],
	externalScenes: [],
	subType: "scene",
	quickEntityVersion: new Decimal(2.2),
	extraFactoryDependencies: [],
	extraBlueprintDependencies: [],
	comments: []
})

export const references: Readable<
	Record<
		string,
		{
			type: string
			entity: string
			context?: string[]
		}[]
	>
> = derived(entity, (entity, set) => {
	set(Object.fromEntries(Object.entries(entity.entities).map(([entityID, entityData]) => [entityID, getReferencedEntities(entityData)])))
})

export const reverseReferences: Readable<
	Record<
		string,
		{
			type: string
			entity: string
			context?: string[]
		}[]
	>
> = derived(entity, (entity, set) => {
	const refs: Record<
		string,
		{
			type: string
			entity: string
			context?: string[]
		}[]
	> = {}

	for (const [entityID] of Object.entries(entity.entities)) {
		refs[entityID] = []
	}

	for (const [entityID, entityData] of Object.entries(entity.entities)) {
		for (const ref of getReferencedEntities(entityData)) {
			refs[ref.entity].push({
				type: ref.type,
				entity: entityID,
				context: ref.context
			})
		}
	}

	set(refs)
})

// Complete misuse of a store but it works
export const addNotification: Writable<{ kind: "error" | "info" | "info-square" | "success" | "warning" | "warning-alt"; title: string; subtitle: string } | null> = writable(null)

// For caching deep intellisense data
export const parsedEntities: Writable<Record<string, Entity>> = writable({})

export let intellisense: Readable<Intellisense>

appSettings.subscribe((value: { gameFileExtensions: boolean; gameFileExtensionsDataPath: string; inVivoExtensions: boolean }) => {
	if (value.gameFileExtensions) {
		intellisense = readable(new Intellisense(value))

		intellisense.subscribe((value) => void value.ready())
	}
})

export const inProgressMeshLoads: Writable<Record<string, boolean>> = writable({})
