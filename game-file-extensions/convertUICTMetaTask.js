const { execSync } = require("child_process")
const fs = require("fs-extra")

module.exports = async ({ file, n, allFilesLength }) => {
	execSync('rpkg-cli -hash_meta_to_json "' + file.path + '"')

	console.log("Processed " + n + " of " + allFilesLength)
}
