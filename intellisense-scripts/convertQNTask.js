const { execSync } = require("child_process")
const fs = require("fs-extra")
const QuickEntity = require("./quickentity")
const LosslessJSON = require("lossless-json")
const path = require("path")

const readLossless = (path) => LosslessJSON.parse(String(fs.readFileSync(path)))
const writeLossless = (path, content) => fs.writeFileSync(path, LosslessJSON.stringify(content))

module.exports = async ({ file, n, allFilesLength }) => {
	if (!fs.existsSync(path.join("./TBLU", readLossless(file.replace(".TEMP.json", ".TEMP.meta.json")).hash_reference_data[readLossless(file).blueprintIndexInResourceHeader].hash) + ".TBLU.json")) {
		console.log("No blueprint for " + file)
		return
	}

	try {
		execSync(
			`quickentity-rs.exe entity convert --input-factory ${file} --input-factory-meta ${file.replace(".TEMP.json", ".TEMP.meta.json")} --input-blueprint ${
				path.join("./TBLU", readLossless(file.replace(".TEMP.json", ".TEMP.meta.json")).hash_reference_data[readLossless(file).blueprintIndexInResourceHeader].hash) + ".TBLU.json"
			} --input-blueprint-meta ${
				path.join("./TBLU", readLossless(file.replace(".TEMP.json", ".TEMP.meta.json")).hash_reference_data[readLossless(file).blueprintIndexInResourceHeader].hash) + ".TBLU.meta.json"
			} --output ${file.replace(".TEMP.json", ".TEMP.entity.json")}`
		)
	} catch {
		console.log("Failed to convert " + file)
		return
	}

	if (n % 10 == 0) {
		console.log("Processed " + n + " of " + allFilesLength)
	}
}
