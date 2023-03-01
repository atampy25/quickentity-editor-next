// Automatically generated from Rust source.

import type Decimal from "decimal.js"

export type ArrayPatchOperation = { RemoveItemByValue: any } | { AddItemAfter: [any, any] } | { AddItemBefore: [any, any] } | { AddItem: any }

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

export type PatchOperation =
	| { SetRootEntity: string }
	| { SetSubType: SubType }
	| { AddEntity: [string, SubEntity] }
	| { RemoveEntityByID: string }
	| { SubEntityOperation: [string, SubEntityOperation] }
	| { AddPropertyOverride: PropertyOverride }
	| { RemovePropertyOverride: PropertyOverride }
	| { AddOverrideDelete: Ref }
	| { RemoveOverrideDelete: Ref }
	| { AddPinConnectionOverride: PinConnectionOverride }
	| { RemovePinConnectionOverride: PinConnectionOverride }
	| { AddPinConnectionOverrideDelete: PinConnectionOverrideDelete }
	| { RemovePinConnectionOverrideDelete: PinConnectionOverrideDelete }
	| { AddExternalScene: string }
	| { RemoveExternalScene: string }
	| { AddExtraFactoryDependency: Dependency }
	| { RemoveExtraFactoryDependency: Dependency }
	| { AddExtraBlueprintDependency: Dependency }
	| { RemoveExtraBlueprintDependency: Dependency }
	| { AddComment: CommentEntity }
	| { RemoveComment: CommentEntity }

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
	factory: string
	factoryFlag?: string
	blueprint: string
	editorOnly?: boolean
	properties?: Record<string, Property>
	platformSpecificProperties?: Record<string, Record<string, Property>>
	events?: Record<string, Record<string, Array<RefMaybeConstantValue>>>
	inputCopying?: Record<string, Record<string, Array<RefMaybeConstantValue>>>
	outputCopying?: Record<string, Record<string, Array<RefMaybeConstantValue>>>
	propertyAliases?: Record<string, Array<PropertyAlias>>
	exposedEntities?: Record<string, ExposedEntity>
	exposedInterfaces?: Record<string, string>
	subsets?: Record<string, Array<string>>
}

export type SubEntityOperation =
	| { SetParent: Ref }
	| { SetName: string }
	| { SetFactory: string }
	| { SetFactoryFlag: string | null }
	| { SetBlueprint: string }
	| { SetEditorOnly: boolean | null }
	| { AddProperty: [string, Property] }
	| { SetPropertyType: [string, string] }
	| { SetPropertyValue: { property_name: string; value: any } }
	| { PatchPropertyValue: [string, Array<ArrayPatchOperation>] }
	| { SetPropertyPostInit: [string, boolean] }
	| { RemovePropertyByName: string }
	| { AddPlatformSpecificProperty: [string, string, Property] }
	| { SetPlatformSpecificPropertyType: [string, string, string] }
	| { SetPlatformSpecificPropertyValue: { platform: string; property_name: string; value: any } }
	| { PatchPlatformSpecificPropertyValue: [string, string, Array<ArrayPatchOperation>] }
	| { SetPlatformSpecificPropertyPostInit: [string, string, boolean] }
	| { RemovePlatformSpecificPropertyByName: [string, string] }
	| { RemovePlatformSpecificPropertiesForPlatform: string }
	| { AddEventConnection: [string, string, RefMaybeConstantValue] }
	| { RemoveEventConnection: [string, string, RefMaybeConstantValue] }
	| { RemoveAllEventConnectionsForTrigger: [string, string] }
	| { RemoveAllEventConnectionsForEvent: string }
	| { AddInputCopyConnection: [string, string, RefMaybeConstantValue] }
	| { RemoveInputCopyConnection: [string, string, RefMaybeConstantValue] }
	| { RemoveAllInputCopyConnectionsForTrigger: [string, string] }
	| { RemoveAllInputCopyConnectionsForInput: string }
	| { AddOutputCopyConnection: [string, string, RefMaybeConstantValue] }
	| { RemoveOutputCopyConnection: [string, string, RefMaybeConstantValue] }
	| { RemoveAllOutputCopyConnectionsForPropagate: [string, string] }
	| { RemoveAllOutputCopyConnectionsForOutput: string }
	| { AddPropertyAliasConnection: [string, PropertyAlias] }
	| { RemovePropertyAlias: string }
	| { RemoveConnectionForPropertyAlias: [string, PropertyAlias] }
	| { SetExposedEntity: [string, ExposedEntity] }
	| { RemoveExposedEntity: string }
	| { SetExposedInterface: [string, string] }
	| { RemoveExposedInterface: string }
	| { AddSubset: [string, string] }
	| { RemoveSubset: [string, string] }
	| { RemoveAllSubsetsFor: string }

export type SubType = "brick" | "scene" | "template"
