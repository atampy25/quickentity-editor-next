import { writable, derived, readable, type Writable, type Readable } from "svelte/store"
import type { Entity } from "$lib/quickentity-types"
import { getReferencedEntities } from "$lib/utils"
import Decimal from "decimal.js"
import { forage } from "@tauri-apps/tauri-forage"
import json from "$lib/json"
import { Intellisense } from "$lib/intellisense"
import { v4 } from "uuid"

interface AppSettings {
	runtimePath: string
	retailPath: string

	h1: boolean

	autoSaveOnSwitchFile: boolean
	extractModdedFiles: boolean

	gameFileExtensions: boolean
	gameFileExtensionsDataPath: string

	inVivoExtensions: boolean
	autoHighlightEntities: boolean
	preferredHighlightColour: string

	enableLogRocket: boolean
	logRocketID: string
	logRocketName: string

	technicalMode: boolean
}

await forage.setItem({
	key: "appSettings",
	value: json.stringify(
		Object.assign(
			{
				gameFileExtensions: false,
				gameFileExtensionsDataPath: null,
				inVivoExtensions: false,
				runtimePath: "",
				retailPath: "",
				enableLogRocket: false,
				logRocketID: v4(),
				logRocketName: "",
				technicalMode: false,
				autoHighlightEntities: true,
				autoSaveOnSwitchFile: true,
				preferredHighlightColour: "#0000ff",
				extractModdedFiles: false,
				h1: false
			},
			json.parse((await forage.getItem({ key: "appSettings" })()) || "{}")
		)
	)
})()

export const appSettings: Writable<AppSettings> = writable(json.parse(await forage.getItem({ key: "appSettings" })()))

appSettings.subscribe((value: AppSettings) => {
	void (async () => {
		await forage.setItem({ key: "appSettings", value: json.stringify(value) })()
	})()
})

export const sessionMetadata: Writable<{
	originalEntityPath?: string
	saveAsPatch?: boolean
	saveAsEntityPath?: string
	saveAsPatchPath?: string
	loadedFromGameFiles?: boolean
	workspacePath?: string
}> = writable({})

export const workspaceData: Writable<{
	path?: string
}> = writable({})

export const entity: Writable<Entity> = writable({
	tempHash: "",
	tbluHash: "",
	rootEntity: "fffffffffffffffe",
	entities: {
		fffffffffffffffe: {
			parent: null,
			name: "Scene",
			factory: "[modules:/zspatialentity.class].pc_entitytype",
			blueprint: "[modules:/zspatialentity.class].pc_entityblueprint"
		}
	},
	propertyOverrides: [],
	overrideDeletes: [],
	pinConnectionOverrides: [],
	pinConnectionOverrideDeletes: [],
	externalScenes: [],
	subType: "scene",
	quickEntityVersion: new Decimal(3.0),
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

export const inVivoMetadata: Writable<{
	entities: Record<
		string,
		{
			hasSetProperties: boolean

			dirtyProperties: string[]
			dirtyUnchangeables: boolean
			dirtyPins: boolean
			dirtyExtensions: boolean
		}
	>
}> = writable({ entities: {} })

export const forceSaveSubEntity = writable({ value: false })
