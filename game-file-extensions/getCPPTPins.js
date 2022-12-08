const fs = require("fs-extra")
const klaw = require("klaw-sync")
const path = require("path")
const LosslessJSON = require("lossless-json")

const readLossless = (path) => LosslessJSON.parse(String(fs.readFileSync(path)))

let allFiles

if (fs.existsSync("./allTemps.json")) {
	console.log("Loading files...")
	allFiles = fs.readJsonSync("./allTemps.json")
	console.log("Loaded files")
} else {
	console.log("Crawling files...")
	allFiles = klaw("./TEMP", {
		filter: (file) => file.path.endsWith(".TEMP.json")
	})
	fs.writeJsonSync("./allTemps.json", allFiles)
	console.log("Crawled files")
}

const allCPPTs = new Set(
	klaw("./CPPT", {
		filter: (file) => file.path.endsWith(".CPPT")
	}).map((a) => path.basename(a.path, ".CPPT"))
)

let data = {}
let i = 0
let x = 0

let hashes = Object.fromEntries(
	fs
		.readFileSync("./hash_list2.txt", "utf8")
		.split("\n")
		.map((a) => [a.trim().split(",").slice(1).join(","), a.trim().split(".")[0]])
)

const cpptEntityRootsSet = new Set()
const cpptEntityRootsData = {}

for (let filePath of allFiles) {
	filePath = filePath.path.replace(".TEMP.json", ".TEMP.entity.json")

	if (fs.existsSync(filePath)) {
		/** @type import("../src/lib/quickentity-types").Entity */
		const entity = readLossless(filePath)
		if (allCPPTs.has(entity.entities[entity.rootEntity].factory)) {
			const discount = new Set()

			for (const subEntity of Object.values(entity.entities)) {
				// the root entity is a class entity, therefore anything that isn't forwarded must be emitted by that class;
				// therefore any uses of events in other entities that aren't forwards from here must be emitted by that class

				if (subEntity.outputCopying) {
					for (const data of Object.values(subEntity.outputCopying)) {
						for (const [evtToSend, ents] of Object.entries(data)) {
							for (const ent of ents) {
								if (ent === entity.rootEntity) {
									discount.add(evtToSend)
								}
							}
						}
					}
				}
			}

			cpptEntityRootsSet.add(entity.tempHash)
			cpptEntityRootsData[entity.tempHash] = {
				cppt: entity.entities[entity.rootEntity].factory,
				discount
			}
		}
	}

	i++

	if (i % 1000 == 0) {
		console.log(`Stage 1: Done ${i} of ${allFiles.length}`)
	}
}

for (let filePath of allFiles) {
	filePath = filePath.path.replace(".TEMP.json", ".TEMP.entity.json")

	if (fs.existsSync(filePath)) {
		/** @type import("../src/lib/quickentity-types").Entity */
		const entity = readLossless(filePath)
		for (const [subEntityID, subEntity] of Object.entries(entity.entities)) {
			const isCPPTRooted = cpptEntityRootsSet.has(subEntity.factory)
			if (isCPPTRooted || allCPPTs.has(subEntity.factory)) {
				if (subEntity.events) {
					data[isCPPTRooted ? cpptEntityRootsData[subEntity.factory].cppt : subEntity.factory] ??= { output: new Set() }

					const outputsToAdd = Object.keys(subEntity.events)
						.filter(
							// check that this event is not a forwarding (as if it isn't a forwarding it must be sent by the entity itself)
							(evt) =>
								!Object.values(entity.entities).some(
									(a) =>
										a.outputCopying &&
										Object.entries(a.outputCopying).some(([evtToCopy, data]) =>
											Object.entries(data).some(([evtToSend, ents]) => evtToSend === evt && ents.some((ent) => ent === subEntityID))
										)
								)
						)
						.filter(isCPPTRooted ? (evt) => !cpptEntityRootsData[subEntity.factory].discount.has(evt) : (evt) => true)

					if (outputsToAdd.length) {
						data[isCPPTRooted ? cpptEntityRootsData[subEntity.factory].cppt : subEntity.factory].output.add(...outputsToAdd)
					}
				}

				if (subEntity.outputCopying) {
					data[isCPPTRooted ? cpptEntityRootsData[subEntity.factory].cppt : subEntity.factory] ??= { output: new Set() }

					const outputsToAdd = Object.keys(subEntity.outputCopying)
						.filter(
							// check that this event is not a forwarding (as if it isn't a forwarding it must be sent by the entity itself)
							(evt) =>
								!Object.values(entity.entities).some(
									(a) =>
										a.outputCopying &&
										Object.entries(a.outputCopying).some(([evtToCopy, data]) =>
											Object.entries(data).some(([evtToSend, ents]) => evtToSend === evt && ents.some((ent) => ent === subEntityID))
										)
								)
						)
						.filter(isCPPTRooted ? (evt) => !cpptEntityRootsData[subEntity.factory].discount.has(evt) : (evt) => true)

					if (outputsToAdd.length) {
						data[isCPPTRooted ? cpptEntityRootsData[subEntity.factory].cppt : subEntity.factory].output.add(...outputsToAdd)
					}
				}
			}
		}
	}

	x++

	if (x % 1000 == 0) {
		console.log(`Stage 2: Done ${x} of ${allFiles.length}`)

		fs.writeJSONSync("./pins.json", Object.fromEntries(Object.entries(data).map((a) => [a[0], { output: [...a[1].output] }])))
	}
}

for (const c of fs.readJSONSync("./classes").classes) {
	let bla = hashes["[modules:/" + c.name.toLowerCase() + ".class].pc_entitytype"]
	if (bla) {
		data[bla] ??= { input: new Set(), output: new Set() }
		data[bla].input = new Set(c.inputPins.map((a) => a.name))
	}
}

fs.writeJSONSync("./pins.json", Object.fromEntries(Object.entries(data).map((a) => [a[0], { input: [...a[1].input], output: [...a[1].output] }])))
