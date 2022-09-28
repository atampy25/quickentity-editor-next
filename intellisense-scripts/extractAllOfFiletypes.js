const fs = require("fs-extra")
const klaw = require("klaw-sync")
const path = require("path")
const { execSync } = require("child_process")

const RUNTIME_PATH = "<edit me, use double backslashes \\>"

async function a() {
	for (let filetype of ["TEMP", "TBLU", "ASET", "CPPT", "UICT", "UICB"]) {
		console.log(`Extracting ${filetype}...`)

		for (let rpkg of klaw(RUNTIME_PATH)
			.map((a) => a.path)
			.filter((a) => a.endsWith(".rpkg"))) {
			console.log(`Extracting from ${rpkg}...`)

			execSync(`rpkg-cli -extract_from_rpkg "${rpkg}" -filter ${filetype} -output_path extraction`)
		}

		console.log(`Superseding...`)
		let allFiles = klaw("extraction")
			.map((a) => a.path)
			.filter((a) => a.endsWith(`.${filetype}`) || a.endsWith(`.${filetype}.meta`))
			.map((a) => {
				return {
					rpkg: /(chunk[0-9]*(?:patch[0-9]*)?)\\/gi.exec(a)[1],
					path: a
				}
			})
			.sort((a, b) =>
				b.rpkg.localeCompare(a.rpkg, undefined, {
					numeric: true,
					sensitivity: "base"
				})
			)

		let allFilesSuperseded = []
		let allFilesSupersededBasenames = new Set()
		allFiles.forEach((a) => {
			if (!allFilesSupersededBasenames.has(path.basename(a.path))) {
				allFilesSuperseded.push(a.path)
				allFilesSupersededBasenames.add(path.basename(a.path))
			}
		})

		fs.ensureDirSync(`./${filetype}`)

		console.log(`Copying...`)

		allFilesSuperseded.forEach((a) => fs.copySync(a, path.join(filetype, path.basename(a))))

		fs.removeSync("./extraction")
	}

	console.log("Done!")
}

a()
