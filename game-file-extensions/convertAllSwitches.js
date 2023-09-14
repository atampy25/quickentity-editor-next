const fs = require("fs-extra")
const klaw = require("klaw-sync")
const { execSync } = require("child_process")

async function a() {
	let allFiles = klaw("./WSWT", {
		filter: (file) => file.path.endsWith(".WSWT") && !fs.existsSync(file.path + ".json")
	})

	let n = 1

	for (const file of allFiles) {
		execSync('rpkg-cli -hash_meta_to_json "' + file.path + '.meta"')

		if (n % 10 == 0) {
			console.log("Processed " + n + " of " + allFiles.length)
		}
	}

	allFiles = klaw("./WSWB", {
		filter: (file) => file.path.endsWith(".WSWB") && !fs.existsSync(file.path + ".json")
	})

	n = 1

	for (const file of allFiles) {
		execSync('ResourceTool HM3 convert DSWB "' + file.path + '" "' + file.path + '.json" --simple')

		if (n % 10 == 0) {
			console.log("Processed " + n + " of " + allFiles.length)
		}
	}

	allFiles = klaw("./DSWB", {
		filter: (file) => file.path.endsWith(".DSWB") && !fs.existsSync(file.path + ".json")
	})

	n = 1

	for (const file of allFiles) {
		execSync('ResourceTool HM3 convert DSWB "' + file.path + '" "' + file.path + '.json" --simple')

		if (n % 10 == 0) {
			console.log("Processed " + n + " of " + allFiles.length)
		}
	}

	console.log("Done!")
}

a()
