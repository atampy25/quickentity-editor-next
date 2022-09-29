const fs = require("fs-extra")
const klaw = require("klaw-sync")
const Piscina = require("piscina")

async function a() {
	if (fs.existsSync("./allTemps.json")) {
		console.log("Loading files...")
		allFiles = fs
			.readJsonSync("./allTemps.json")
			.map((a) => a.path)
			.filter((file) => !fs.existsSync(file.replace(".TEMP.json", ".TEMP") + ".entity.json"))
		console.log("Loaded files!")
	} else {
		console.log("Crawling files...")
		allFiles = klaw("./TEMP", {
			filter: (file) => file.path.endsWith(".TEMP.json")
		})
		fs.writeJsonSync("./allTemps.json", allFiles)

		allFiles = allFiles.map((a) => a.path).filter((file) => !fs.existsSync(file.replace(".TEMP.json", ".TEMP") + ".entity.json"))

		console.log("Crawled files!")
	}

	let workerPool = new Piscina({
		filename: "convertQNTask.js"
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
