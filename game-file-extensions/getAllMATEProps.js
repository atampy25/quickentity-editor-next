const klaw = require("klaw-sync")
const Piscina = require("piscina")

async function a() {
	console.log("Crawling files...")
	let allFiles = klaw("./MATE")
		.map((a) => a.path)
		.filter((a) => a.endsWith(".MATE"))
	console.log("Crawled files!")

	let workerPool = new Piscina({
		filename: "getMATEPropsTask.js"
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
