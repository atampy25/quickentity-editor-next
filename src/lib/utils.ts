import type { Entity, FullRef, Ref } from "$lib/quickentity-types"

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
				break

			case "platformSpecificProperty":
				if (Array.isArray(entity.entities[ref.entity].platformSpecificProperties![ref.context![0]][ref.context![1]])) {
					entity.entities[ref.entity].platformSpecificProperties![ref.context![0]][ref.context![1]].value = entity.entities[ref.entity].platformSpecificProperties![ref.context![0]][
						ref.context![1]
					].value.filter((a: Ref) => getReferencedLocalEntity(a) != target)
				} else {
					delete entity.entities[ref.entity].platformSpecificProperties![ref.context![0]][ref.context![1]]
				}
				break

			case "event":
				entity.entities[ref.entity].events![ref.context![0]][ref.context![1]] = entity.entities[ref.entity].events![ref.context![0]][ref.context![1]].filter(
					(a) => getReferencedLocalEntity(a && typeof a != "string" && Object.prototype.hasOwnProperty.call(a, "value") ? a.ref : (a as FullRef)) != target
				)
				break

			case "inputCopy":
				entity.entities[ref.entity].inputCopying![ref.context![0]][ref.context![1]] = entity.entities[ref.entity].inputCopying![ref.context![0]][ref.context![1]].filter(
					(a) => getReferencedLocalEntity(a && typeof a != "string" && Object.prototype.hasOwnProperty.call(a, "value") ? a.ref : (a as FullRef)) != target
				)
				break

			case "outputCopy":
				entity.entities[ref.entity].outputCopying![ref.context![0]][ref.context![1]] = entity.entities[ref.entity].outputCopying![ref.context![0]][ref.context![1]].filter(
					(a) => getReferencedLocalEntity(a && typeof a != "string" && Object.prototype.hasOwnProperty.call(a, "value") ? a.ref : (a as FullRef)) != target
				)
				break

			case "propertyAlias":
				delete entity.entities[ref.entity].propertyAliases![ref.context![0]]
				break

			case "exposedEntity":
				entity.entities[ref.entity].exposedEntities![ref.context![0]].targets = entity.entities[ref.entity].exposedEntities![ref.context![0]].targets.filter(
					(a) => getReferencedLocalEntity(a) != target
				)
				break

			case "exposedInterface":
				delete entity.entities[ref.entity].exposedInterfaces![ref.context![0]]
				break
		}
	}
}
