const fs = require("fs-extra")
const path = require("path")
const klaw = require("klaw-sync")
const Piscina = require("piscina")

async function a() {
	let props = {}

	let allFiles = klaw("./CPPT", {
		filter: (file) => file.path.endsWith(".CPPT.json")
	}).map((a) => a.path)

	for (let file of allFiles) {
		try {
			props[path.basename(file, ".CPPT.json")] = Object.fromEntries(
				fs
					.readJSONSync(file)
					.propertyValues.filter((a) => a.value)
					.map((a) => [a.nPropertyID, [a.value.$type, a.value.$val]])
			)
		} catch {}
	}

	for (let cppt of Object.keys(props)) {
		for (let prop of Object.entries(props[cppt])) {
			prop[1][0] = { "TArray<ZEntityReference>": "TArray<SEntityTemplateReference>", ZEntityReference: "SEntityTemplateReference" }[prop[1][0]] || prop[1][0]

			if (prop[1][0] == "ZRuntimeResourceID") {
				if (prop[1][1].m_IDLow < 4000) {
					prop[1][1] =
						fs.readJSONSync("./CPPT/" + cppt + ".CPPT.meta.JSON").hash_reference_data[prop[1][1].m_IDLow].flag == "1F"
							? fs.readJSONSync("./CPPT/" + process.argv[1] + ".CPPT.meta.JSON").hash_reference_data[prop[1][1].m_IDLow].hash
							: {
									resource: fs.readJSONSync("./CPPT/" + cppt + ".CPPT.meta.JSON").hash_reference_data[prop[1][1].m_IDLow].hash,
									flag: fs.readJSONSync("./CPPT/" + cppt + ".CPPT.meta.JSON").hash_reference_data[prop[1][1].m_IDLow].flag
							  }
				} else {
					prop[1][1] = null
				}
			}

			if (prop[1][0] == "SEntityTemplateReference") {
				if (
					JSON.stringify(prop[1][1]) ==
					JSON.stringify({
						m_EntityID: {
							m_sStr: ""
						},
						m_sExposedEntity: ""
					})
				) {
					prop[1][1] = null
				}
			}

			if (prop[1][0] == "TArray<SEntityTemplateReference>") {
				if (
					JSON.stringify(prop[1][1][0]) ==
					JSON.stringify({
						m_EntityID: {
							m_sStr: ""
						},
						m_sExposedEntity: ""
					})
				) {
					prop[1][1][0] = null
				}
			}

			if (prop[1][0] == "ZGuid") {
				if (
					JSON.stringify(prop[1][1]) ==
					JSON.stringify({
						_a: 0,
						_b: 0,
						_c: 0,
						_d: 0,
						_e: 0,
						_f: 0,
						_g: 0,
						_h: 0,
						_i: 0,
						_j: 0,
						_k: 0
					})
				) {
					prop[1][1] = "00000000-0000-0000-0000-000000000000"
				}
			}

			if (prop[1][0] == "SMatrix43") {
				if (
					JSON.stringify(prop[1][1]) ==
					JSON.stringify({
						XAxis: {
							x: 1,
							y: 0,
							z: 0
						},
						YAxis: {
							x: 0,
							y: 1,
							z: 0
						},
						ZAxis: {
							x: 0,
							y: 0,
							z: 1
						},
						Trans: {
							x: 0,
							y: 0,
							z: 0
						}
					})
				) {
					prop[1][1] = {
						rotation: {
							x: 0,
							y: 0,
							z: 0
						},
						position: {
							x: 0,
							y: 0,
							z: 0
						}
					}
				}
			}

			if (prop[1][0] == "SColorRGB") {
				prop[1][1] =
					"#" +
					Math.round(Number(prop[1][1].r) * 255)
						.toString(16)
						.padStart(2, "0") +
					Math.round(Number(prop[1][1].g) * 255)
						.toString(16)
						.padStart(2, "0") +
					Math.round(Number(prop[1][1].b) * 255)
						.toString(16)
						.padStart(2, "0")
			}

			if (prop[1][0] == "SColorRGBA") {
				prop[1][1] =
					"#" +
					Math.round(Number(prop[1][1].r) * 255)
						.toString(16)
						.padStart(2, "0") +
					Math.round(Number(prop[1][1].g) * 255)
						.toString(16)
						.padStart(2, "0") +
					Math.round(Number(prop[1][1].b) * 255)
						.toString(16)
						.padStart(2, "0") +
					Math.round(Number(prop[1][1].a) * 255)
						.toString(16)
						.padStart(2, "0")
			}
		}
	}

	fs.writeJSONSync("./props.json", props)
}

a()
