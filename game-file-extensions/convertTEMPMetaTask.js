const { execSync } = require("child_process")
const fs = require("fs-extra")

module.exports = async ({ file, n, allFilesLength }) => {
	if (fs.existsSync(file.path.replace(".TEMP.json", ".TEMP.meta") + ".JSON")) return

	execSync('rpkg-cli -hash_meta_to_json "' + file.path.replace(".TEMP.json", ".TEMP.meta") + '"')

	console.log("Processed " + n + " of " + allFilesLength)
}
