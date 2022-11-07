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
        filter: file => file.path.endsWith(".TEMP.json")
    })
    fs.writeJsonSync("./allTemps.json", allFiles)
    console.log("Crawled files")
}

const allCPPTs = new Set(klaw("./CPPT", {
    filter: file => file.path.endsWith(".CPPT")
}).map(a=>path.basename(a.path, ".CPPT")))

let data = {}
let x = 0

let hashes = Object.fromEntries(fs.readFileSync("./hash_list2.txt", "utf8").split("\n").map(a=>[a.trim().split(",").slice(1).join(","), a.trim().split(".")[0]]))

for (let filePath of allFiles) {
    filePath = filePath.path.replace(".TEMP.json", ".TEMP.entity.json")

    if (fs.existsSync(filePath)) {
        const entity = readLossless(filePath)
        for (const subEntity of Object.values(entity.entities)) {
            if (allCPPTs.has(subEntity.template)) {
                if (subEntity.events) {
                    data[subEntity.template] ??= { output: new Set() }
                    data[subEntity.template].output.add(...Object.keys(subEntity.events))
                }

                if (subEntity.outputCopying) {
                    data[subEntity.template] ??= { output: new Set() }
                    data[subEntity.template].output.add(...Object.keys(subEntity.outputCopying))
                }
            }
        }
    }

    x++

    if (x % 1000 == 0) {
        console.log(`Done ${x} of ${allFiles.length}`)

        fs.writeJSONSync("./pins.json", Object.fromEntries(Object.entries(data).map(a=>[a[0], { output: [...a[1].output] }])))
    }
}

for (const c of fs.readJSONSync("./classes.json").classes) {
    let bla = hashes["[modules:/" + c.name.toLowerCase() + ".class].pc_entitytype"]
    if (bla) {
        data[bla] ??= { input: new Set(), output: new Set() }
        data[bla].input = new Set(c.inputPins.map(a=>a.name))
    }
}

fs.writeJSONSync("./pins.json", Object.fromEntries(Object.entries(data).map(a=>[a[0], { input: [...a[1].input], output: [...a[1].output] }])))