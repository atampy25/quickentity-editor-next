import type { Entity, FullRef, Ref, RefMaybeConstantValue, SubEntity } from "$lib/quickentity-types"

import Ajv from "ajv"
import md5 from "md5"
import schema from "$lib/schema.json"

export const genRandHex = (size: number) => [...Array(size)].map(() => Math.floor(Math.random() * 16).toString(16)).join("")

/** Get the local entity ID referenced by a Ref. If the reference is external, returns false. If the reference is null, returns null. */
export function getReferencedLocalEntity(ref: Ref) {
	if (ref !== null && typeof ref != "string" && ref.externalScene) {
		return false // External reference
	} else {
		return ref !== null && typeof ref != "string" ? ref.ref : ref // Local reference
	}
}

/** Returns a modified Ref that points to a given local entity, keeping any exposed entity reference the same */
export function changeReferenceToLocalEntity(ref: Ref, ent: string) {
	if (typeof ref == "string" || ref == null) {
		return ent
	} else {
		return {
			ref: ent,
			externalScene: null,
			exposedEntity: ref.exposedEntity
		}
	}
}

/** Traverses the entity tree to find all entities logically parented under a given entity, returning their entity IDs. */
export function traverseEntityTree(entity: Entity, startingPoint: string): string[] {
	const copiedEntity = []

	try {
		copiedEntity.push(
			...Object.entries(entity.entities)
				.filter((a) => getReferencedLocalEntity(a[1].parent) == startingPoint)
				.map((a) => a[0])
		)

		for (const newEntity of copiedEntity) {
			copiedEntity.push(...traverseEntityTree(entity, newEntity))
		}
	} catch {}

	return copiedEntity.filter((thing, index, self) => index === self.findIndex((t) => t == thing))
}

/** Deletes all references to a given entity ID, mutating the passed entity. */
export function deleteReferencesToEntity(
	entity: Entity,
	reverseReferences: Record<
		string,
		{
			type: string
			entity: string
			context?: string[]
		}[]
	>,
	target: string
) {
	let deleted = 0

	for (const ref of reverseReferences[target]) {
		switch (ref.type) {
			case "property":
				if (Array.isArray(entity.entities[ref.entity].properties![ref.context![0]])) {
					entity.entities[ref.entity].properties![ref.context![0]].value = entity.entities[ref.entity].properties![ref.context![0]].value.filter(
						(a: Ref) => getReferencedLocalEntity(a) != target
					)
				} else {
					delete entity.entities[ref.entity].properties![ref.context![0]]
				}
				deleted++
				break

			case "platformSpecificProperty":
				if (Array.isArray(entity.entities[ref.entity].platformSpecificProperties![ref.context![0]][ref.context![1]])) {
					entity.entities[ref.entity].platformSpecificProperties![ref.context![0]][ref.context![1]].value = entity.entities[ref.entity].platformSpecificProperties![ref.context![0]][
						ref.context![1]
					].value.filter((a: Ref) => getReferencedLocalEntity(a) != target)
				} else {
					delete entity.entities[ref.entity].platformSpecificProperties![ref.context![0]][ref.context![1]]
				}
				deleted++
				break

			case "event":
				entity.entities[ref.entity].events![ref.context![0]][ref.context![1]] = entity.entities[ref.entity].events![ref.context![0]][ref.context![1]].filter(
					(a) => getReferencedLocalEntity(a && typeof a != "string" && Object.prototype.hasOwnProperty.call(a, "value") ? a.ref : (a as FullRef)) != target
				)
				deleted++
				break

			case "inputCopy":
				entity.entities[ref.entity].inputCopying![ref.context![0]][ref.context![1]] = entity.entities[ref.entity].inputCopying![ref.context![0]][ref.context![1]].filter(
					(a) => getReferencedLocalEntity(a && typeof a != "string" && Object.prototype.hasOwnProperty.call(a, "value") ? a.ref : (a as FullRef)) != target
				)
				deleted++
				break

			case "outputCopy":
				entity.entities[ref.entity].outputCopying![ref.context![0]][ref.context![1]] = entity.entities[ref.entity].outputCopying![ref.context![0]][ref.context![1]].filter(
					(a) => getReferencedLocalEntity(a && typeof a != "string" && Object.prototype.hasOwnProperty.call(a, "value") ? a.ref : (a as FullRef)) != target
				)
				deleted++
				break

			case "propertyAlias":
				delete entity.entities[ref.entity].propertyAliases![ref.context![0]]
				deleted++
				break

			case "exposedEntity":
				entity.entities[ref.entity].exposedEntities![ref.context![0]].refersTo = entity.entities[ref.entity].exposedEntities![ref.context![0]].refersTo.filter(
					(a) => getReferencedLocalEntity(a) != target
				)
				deleted++
				break

			case "exposedInterface":
				delete entity.entities[ref.entity].exposedInterfaces![ref.context![0]]
				deleted++
				break
		}
	}

	return deleted
}

/** Gets the referenced entities of an entity. */
export function getReferencedEntities(entityData: SubEntity): {
	type: string
	entity: string
	context?: string[]
}[] {
	const refs = []

	const localRef = getReferencedLocalEntity(entityData.parent)
	if (localRef) {
		refs.push({
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
				if (data.type == "SEntityTemplateReference" || data.type == "TArray<SEntityTemplateReference>") {
					for (const value of data.type == "SEntityTemplateReference" ? [data.value] : data.value) {
						const localRef = getReferencedLocalEntity(value)
						if (localRef) {
							refs.push({
								type: type as string,
								entity: localRef,
								context: [property]
							})
						}
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
							refs.push({
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
				refs.push({
					type: "propertyAlias",
					entity: localRef,
					context: [property, alias.originalProperty]
				})
			}
		}
	}

	if (entityData.exposedEntities) {
		for (const [exposedEnt, data] of Object.entries(entityData.exposedEntities)) {
			for (const target of data.refersTo) {
				const localRef = getReferencedLocalEntity(target)
				if (localRef) {
					refs.push({
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
				refs.push({
					type: "exposedInterface",
					entity: localRef,
					context: [exposedInterface]
				})
			}
		}
	}

	return refs
}

/** Check the validity of an entity's references as well as matching it against the schema. */
export function checkValidityOfEntity(entity: Entity, target: SubEntity): boolean {
	// Check that all referenced entities exist
	for (const ref of getReferencedEntities(target)) {
		if (ref != null && !entity.entities[ref.entity]) {
			return false
		}
	}

	// Check that schema is met
	if (
		!new Ajv().validate(
			Object.assign({}, schema, {
				$ref: "#/definitions/SubEntity"
			}),
			target
		)
	) {
		return false
	}

	return true
}

export function normaliseToHash(path: string): string {
	if (path.includes(":")) {
		return ("00" + md5(path).slice(2, 16)).toUpperCase()
	}

	return path
}
