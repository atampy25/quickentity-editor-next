const fs = require("fs-extra")
const klaw = require("klaw-sync")
const Piscina = require("piscina")

async function a() {
	console.log("Crawling files...")
	allFiles = klaw("./CPPT", {
		filter: (file) => file.path.endsWith(".CPPT.json")
	})

	let workerPool = new Piscina({
		filename: "convertCPPTMetaTask.js"
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
