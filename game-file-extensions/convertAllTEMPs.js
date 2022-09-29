const fs = require("fs-extra")
const klaw = require("klaw-sync")
const Piscina = require("piscina")

async function a() {
	allFiles = klaw("./TEMP", {
		filter: (file) => file.path.endsWith(".TEMP") && !fs.existsSync(file.path + ".json")
	})

	let workerPool = new Piscina({
		filename: "convertTEMPTask.js"
	})

	n = 1

	await Promise.all(
		allFiles.map((file) => {
			n++
			return workerPool.run({
				file,
				n,
				allFilesLength: allFiles.length
			})
		})
	)

	console.log("Done!")
}

a()
