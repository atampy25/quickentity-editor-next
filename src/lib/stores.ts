import { writable, derived, type Writable, type Readable } from "svelte/store"
import type { Entity, FullRef, RefMaybeConstantValue } from "$lib/quickentity-types"
import { getReferencedLocalEntity } from "$lib/utils"
import Decimal from "decimal.js"

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
		const localRef = getReferencedLocalEntity(entityData.parent)
		if (localRef) {
			refs[entityID].push({
				type: "parent",
				entity: localRef
			})
		}

		for (const [type, x] of [
			["property", entityData.properties],
			["platformSpecificProperty", entityData.platformSpecificProperties]
		]) {
			if (x) {
				for (const [property, data] of Object.entries(x)) {
					for (const value of data.type == "SEntityTemplateReference" ? [data.value] : data.value) {
						const localRef = getReferencedLocalEntity(value)
						if (localRef) {
							refs[entityID].push({
								type: type as string,
								entity: localRef,
								context: [property]
							})
						}
					}
				}
			}
		}

		for (const [type, data] of [
			["event", entityData.events],
			["inputCopy", entityData.inputCopying],
			["outputCopy", entityData.outputCopying]
		] as [string, Record<string, Record<string, RefMaybeConstantValue[]>>][])
			if (data) {
				for (const [event, x] of Object.entries(data)) {
					for (const [trigger, ents] of Object.entries(x)) {
						for (const ent of ents) {
							const localRef = getReferencedLocalEntity(ent && typeof ent != "string" && Object.prototype.hasOwnProperty.call(ent, "value") ? ent.ref : (ent as FullRef))
							if (localRef) {
								refs[entityID].push({
									type,
									entity: localRef,
									context: [event, trigger]
								})
							}
						}
					}
				}
			}

		if (entityData.propertyAliases) {
			for (const [property, alias] of Object.entries(entityData.propertyAliases)) {
				const localRef = getReferencedLocalEntity(alias.originalEntity)
				if (localRef) {
					refs[entityID].push({
						type: "propertyAlias",
						entity: localRef,
						context: [property, alias.originalProperty]
					})
				}
			}
		}

		if (entityData.exposedEntities) {
			for (const [exposedEnt, data] of Object.entries(entityData.exposedEntities)) {
				for (const target of data.targets) {
					const localRef = getReferencedLocalEntity(target)
					if (localRef) {
						refs[entityID].push({
							type: "exposedEntity",
							entity: localRef,
							context: [exposedEnt]
						})
					}
				}
			}
		}

		if (entityData.exposedInterfaces) {
			for (const [exposedInterface, implementor] of Object.entries(entityData.exposedInterfaces)) {
				const localRef = getReferencedLocalEntity(implementor)
				if (localRef) {
					refs[entityID].push({
						type: "exposedInterface",
						entity: localRef,
						context: [exposedInterface]
					})
				}
			}
		}
	}

	set(refs)
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
		const localRef = getReferencedLocalEntity(entityData.parent)
		if (localRef) {
			refs[localRef].push({
				type: "parent",
				entity: entityID
			})
		}

		if (entityData.properties) {
			for (const [property, data] of Object.entries(entityData.properties)) {
				for (const value of data.type == "SEntityTemplateReference" ? [data.value] : data.value) {
					const localRef = getReferencedLocalEntity(value)
					if (localRef) {
						refs[localRef].push({
							type: "property",
							entity: entityID,
							context: [property]
						})
					}
				}
			}
		}

		if (entityData.platformSpecificProperties) {
			for (const [platform, props] of Object.entries(entityData.platformSpecificProperties)) {
				for (const [property, data] of Object.entries(props)) {
					for (const value of data.type == "SEntityTemplateReference" ? [data.value] : data.value) {
						const localRef = getReferencedLocalEntity(value)
						if (localRef) {
							refs[localRef].push({
								type: "platformSpecificProperty",
								entity: entityID,
								context: [platform, property]
							})
						}
					}
				}
			}
		}

		for (const [type, data] of [
			["event", entityData.events],
			["inputCopy", entityData.inputCopying],
			["outputCopy", entityData.outputCopying]
		] as [string, Record<string, Record<string, RefMaybeConstantValue[]>>][])
			if (data) {
				for (const [event, x] of Object.entries(data)) {
					for (const [trigger, ents] of Object.entries(x)) {
						for (const ent of ents) {
							const localRef = getReferencedLocalEntity(ent && typeof ent != "string" && Object.prototype.hasOwnProperty.call(ent, "value") ? ent.ref : (ent as FullRef))
							if (localRef) {
								refs[localRef].push({
									type,
									entity: entityID,
									context: [event, trigger]
								})
							}
						}
					}
				}
			}

		if (entityData.propertyAliases) {
			for (const [property, alias] of Object.entries(entityData.propertyAliases)) {
				const localRef = getReferencedLocalEntity(alias.originalEntity)
				if (localRef) {
					refs[localRef].push({
						type: "propertyAlias",
						entity: entityID,
						context: [property, alias.originalProperty]
					})
				}
			}
		}

		if (entityData.exposedEntities) {
			for (const [exposedEnt, data] of Object.entries(entityData.exposedEntities)) {
				for (const target of data.targets) {
					const localRef = getReferencedLocalEntity(target)
					if (localRef) {
						refs[localRef].push({
							type: "exposedEntity",
							entity: entityID,
							context: [exposedEnt]
						})
					}
				}
			}
		}

		if (entityData.exposedInterfaces) {
			for (const [exposedInterface, implementor] of Object.entries(entityData.exposedInterfaces)) {
				const localRef = getReferencedLocalEntity(implementor)
				if (localRef) {
					refs[localRef].push({
						type: "exposedInterface",
						entity: entityID,
						context: [exposedInterface]
					})
				}
			}
		}
	}

	set(refs)
})
