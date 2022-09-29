const fs = require("fs-extra")
const klaw = require("klaw-sync")
const Piscina = require("piscina")

async function a() {
	if (fs.existsSync("./allAsets.json")) {
		console.log("Loading files...")
		allFiles = fs.readJsonSync("./allAsets.json")
	} else {
		console.log("Crawling files...")
		allFiles = klaw("./ASET", {
			filter: (file) => file.path.endsWith(".ASET.meta")
		})
		fs.writeJsonSync("./allAsets.json", allFiles)
		console.log("Crawled files")
	}

	let workerPool = new Piscina({
		filename: "convertASETMetaTask.js"
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
