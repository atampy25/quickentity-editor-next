const { execSync } = require("child_process")
const fs = require("fs-extra")
const klaw = require("klaw-sync")
const Piscina = require("piscina")

async function a() {
	let allFiles = klaw("./CPPT", {
		filter: (file) => file.path.endsWith(".CPPT") && !fs.existsSync(file.path + ".json")
	})

	let n = 1

	for (let file of allFiles) {
		try {
			execSync('ResourceTool HM3 convert CPPT "' + file.path + '" "' + file.path + '.json" --simple')
		} catch (e) {
			console.log("Failed to convert " + file.path)
		}

		if (n % 100 == 0) {
			console.log("Processed " + n + " of " + allFiles.length)
		}
		n++
	}

	console.log("Done!")
}

a()
