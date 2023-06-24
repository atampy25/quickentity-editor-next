use serde::{Deserialize, Serialize};
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

#[derive(Serialize, Deserialize, Type)]
pub enum ReceivedMessage {
	Hello {
		protocol_version: u32,
	},

	SelectEntity {
		#[serde(serialize_with = "serialize_u64_string")]
		entity_id: u64,
		#[serde(serialize_with = "serialize_u64_string")]
		tblu_hash: u64,
	},

	SetEntityTransform {
		#[serde(serialize_with = "serialize_u64_string")]
		entity_id: u64,
		#[serde(serialize_with = "serialize_u64_string")]
		tblu_hash: u64,
		transform: Transform,
	},
}

#[derive(Serialize, Deserialize, Type)]
pub enum SentMessage {
	Hello {
		protocol_version: u32,
	},

	SelectEntity {
		#[serde(deserialize_with = "deserialize_u64_string")]
		entity_id: u64,
		#[serde(deserialize_with = "deserialize_u64_string")]
		tblu_hash: u64,
	},

	SetEntityTransform {
		#[serde(deserialize_with = "deserialize_u64_string")]
		entity_id: u64,
		#[serde(deserialize_with = "deserialize_u64_string")]
		tblu_hash: u64,
		transform: Transform,
	},

	SpawnEntity {
		#[serde(deserialize_with = "deserialize_u64_string")]
		entity_id: u64,
		#[serde(deserialize_with = "deserialize_u64_string")]
		temp_hash: u64,
	},

	SetSpawnedEntityTransform {
		#[serde(deserialize_with = "deserialize_u64_string")]
		entity_id: u64,
		transform: Transform,
	},

	DeleteSpawnedEntity {
		#[serde(deserialize_with = "deserialize_u64_string")]
		entity_id: u64,
	},
}

/**
 * We deserialize u64s from strings for messages sent from JS to Rust,
 * because JS can't handle u64s.
 */
fn deserialize_u64_string<'de, D>(deserializer: D) -> Result<u64, D::Error>
where
	D: serde::Deserializer<'de>,
{
	let s: String = Deserialize::deserialize(deserializer)?;
	u64::from_str_radix(&s, 10).map_err(serde::de::Error::custom)
}

/**
 * We serialize u64s to strings for messages sent from Rust to JS,
 * for the same reason.
 */
fn serialize_u64_string<S>(x: &u64, serializer: S) -> Result<S::Ok, S::Error>
where
	S: serde::Serializer,
{
	serializer.serialize_str(&x.to_string())
}
