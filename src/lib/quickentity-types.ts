// Automatically generated from Rust source.

import type Decimal from "decimal.js"

export interface CommentEntity {
	parent: Ref
	name: string
	text: string
}

export type Dependency = DependencyWithFlag | string

export interface DependencyWithFlag {
	resource: string
	flag: string
}

export interface Entity {
	tempHash: string
	tbluHash: string
	rootEntity: string
	entities: Record<string, SubEntity>
	propertyOverrides: Array<PropertyOverride>
	overrideDeletes: Array<Ref>
	pinConnectionOverrides: Array<PinConnectionOverride>
	pinConnectionOverrideDeletes: Array<PinConnectionOverrideDelete>
	externalScenes: Array<string>
	subType: SubType
	quickEntityVersion: Decimal
	extraFactoryDependencies: Array<Dependency>
	extraBlueprintDependencies: Array<Dependency>
	comments: Array<CommentEntity>
}

export interface ExposedEntity {
	isArray: boolean
	refersTo: Array<Ref>
}

export interface FullRef {
	ref: string
	externalScene: string | null
	exposedEntity?: string
}

export interface OverriddenProperty {
	type: string
	value: any
}

export interface PinConnectionOverride {
	fromEntity: Ref
	fromPin: string
	toEntity: Ref
	toPin: string
	value?: any
}

export interface PinConnectionOverrideDelete {
	fromEntity: Ref
	fromPin: string
	toEntity: Ref
	toPin: string
	value?: SimpleProperty
}

export interface Property {
	type: string
	value: any
	postInit?: boolean
}

export interface PropertyAlias {
	originalProperty: string
	originalEntity: Ref
}

export interface PropertyOverride {
	entities: Array<Ref>
	properties: Record<string, OverriddenProperty>
}

export type Ref = FullRef | string | null

export type RefMaybeConstantValue = RefWithConstantValue | Ref

export interface RefWithConstantValue {
	ref: Ref
	value: SimpleProperty
}

export interface SimpleProperty {
	type: string
	value: any
}

export interface SubEntity {
	parent: Ref
	name: string
	template: string
	templateFlag?: string
	blueprint: string
	editorOnly?: boolean
	properties?: Record<string, Property>
	platformSpecificProperties?: Record<string, Record<string, Property>>
	events?: Record<string, Record<string, Array<RefMaybeConstantValue>>>
	inputCopying?: Record<string, Record<string, Array<RefMaybeConstantValue>>>
	outputCopying?: Record<string, Record<string, Array<RefMaybeConstantValue>>>
	propertyAliases?: Record<string, PropertyAlias>
	exposedEntities?: Record<string, ExposedEntity>
	exposedInterfaces?: Record<string, string>
	subsets?: Record<string, Array<string>>
}

export type SubType = "brick" | "scene" | "template"
