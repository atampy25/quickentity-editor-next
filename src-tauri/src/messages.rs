use serde::{Deserialize, Serialize};
use serde_with::{serde_as, DisplayFromStr};
use specta::Type;

#[derive(Serialize, Deserialize, Type)]
pub struct Vec3 {
	pub x: f32,
	pub y: f32,
	pub z: f32,
}

#[derive(Serialize, Deserialize, Type)]
pub struct Transform {
	pub rotation: Vec3,
	pub position: Vec3,
}

#[serde_as]
#[derive(Serialize, Deserialize, Type)]
pub enum ReceivedMessage {
	Hello {
		protocol_version: u32,
	},

	SelectEntity {
		#[serde_as(as = "DisplayFromStr")]
		entity_id: u64,
		#[serde_as(as = "DisplayFromStr")]
		tblu_hash: u64,
	},

	SetEntityTransform {
		#[serde_as(as = "DisplayFromStr")]
		entity_id: u64,
		#[serde_as(as = "DisplayFromStr")]
		tblu_hash: u64,
		transform: Transform,
	},
}

#[serde_as]
#[derive(Serialize, Deserialize, Type)]
pub enum SentMessage {
	Hello {
		protocol_version: u32,
	},

	SelectEntity {
		#[serde_as(as = "DisplayFromStr")]
		entity_id: u64,
		#[serde_as(as = "DisplayFromStr")]
		tblu_hash: u64,
	},

	SetEntityTransform {
		#[serde_as(as = "DisplayFromStr")]
		entity_id: u64,
		#[serde_as(as = "DisplayFromStr")]
		tblu_hash: u64,
		transform: Transform,
	},

	SpawnEntity {
		#[serde_as(as = "DisplayFromStr")]
		entity_id: u64,
		#[serde_as(as = "DisplayFromStr")]
		temp_hash: u64,
	},

	SetSpawnedEntityTransform {
		#[serde_as(as = "DisplayFromStr")]
		entity_id: u64,
		transform: Transform,
	},

	DeleteSpawnedEntity {
		#[serde_as(as = "DisplayFromStr")]
		entity_id: u64,
	},
}
