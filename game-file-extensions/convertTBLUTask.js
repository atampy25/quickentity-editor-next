const { execSync } = require("child_process")
const fs = require("fs-extra")

module.exports = async ({ file, n, allFilesLength }) => {
	try {
		execSync('ResourceTool HM3 convert TBLU "' + file.path + '" "' + file.path + '.json" --simple')
	} catch {
		console.log("Error converting TBLU " + file.path)
		fs.removeSync(file.path + '.json')
	}

	if (n % 1000 == 0) {
		console.log("Processed " + n + " of " + allFilesLength)
	}
}
