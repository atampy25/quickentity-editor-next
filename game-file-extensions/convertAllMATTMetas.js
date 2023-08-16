const fs = require("fs-extra")
const klaw = require("klaw-sync")
const Piscina = require("piscina")

async function a() {
	let allFiles = klaw("./MATT", {
		filter: (file) => file.path.endsWith(".MATT.meta")
	})
	console.log("Crawled files")

	let workerPool = new Piscina({
		filename: "convertMATTMetaTask.js"
	})

	let n = 1

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
