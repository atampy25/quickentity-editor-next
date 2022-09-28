const fs = require("fs-extra")
const klaw = require("klaw-sync")
const Piscina = require("piscina")

async function a() {
	allFiles = klaw("./TBLU", {
		filter: (file) => file.path.endsWith(".TBLU") && !fs.existsSync(file.path + ".json")
	})

	let workerPool = new Piscina({
		filename: "convertTBLUTask.js"
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
