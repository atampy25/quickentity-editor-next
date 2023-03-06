use buildsrc::export_ts;
use serde::{Deserialize, Serialize};

#[export_ts]
pub type EntityId = u64;

#[export_ts]
pub type ResourceHash = u64;

#[export_ts]
pub const PROTOCOL_VERSION: u32 = 1;

// NOTE: The order of these fields and enums is important and must match the order in the SDK mod.

#[derive(Serialize, Deserialize, PartialEq, Debug)]
#[export_ts]
pub struct Vec3 {
	pub x: f32,
	pub y: f32,
	pub z: f32,
}

#[derive(Serialize, Deserialize, PartialEq, Debug)]
#[export_ts]
pub struct Transform {
	pub rotation: Vec3,
	pub position: Vec3,
}

#[derive(Serialize, Deserialize, PartialEq, Debug)]
#[export_ts]
pub enum SdkToQnMessage {
	Hello {
		protocol_version: u32,
	},

	SelectEntity {
		entity_id: EntityId,
		tblu_hash: ResourceHash,
	},

	SetEntityTransform {
		entity_id: EntityId,
		tblu_hash: ResourceHash,
		transform: Transform,
	},
}

#[derive(Serialize, Deserialize, PartialEq, Debug)]
#[export_ts]
pub enum QnToSdkMessage {
	Hello {
		protocol_version: u32,
	},

	SelectEntity {
		entity_id: EntityId,
		tblu_hash: ResourceHash,
	},

	SetEntityTransform {
		entity_id: EntityId,
		tblu_hash: ResourceHash,
		transform: Transform,
	},

	SpawnEntity {
		entity_id: EntityId,
		temp_hash: ResourceHash,
	},

	SetSpawnedEntityTransform {
		entity_id: EntityId,
		transform: Transform,
	},

	DeleteSpawnedEntity {
		entity_id: EntityId,
	},
}
