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

let allUICBs = new Set(klaw("./UICB").filter(a => a.path.endsWith(".UICB.json")).map(a => path.basename(a.path, ".UICB.json")))

let foundPropTypes = []

let n = 1
for (var file of allFiles.map(a => a.path)) {
    try {
        if (fs.existsSync(file.replace(".TEMP.json", ".TEMP.entity.json")))
        for (let entity of Object.values(readLossless(file.replace(".TEMP.json", ".TEMP.entity.json")).entities)) {
            if (allUICBs.has(entity.blueprint)) {
                Object.entries(readLossless(`./UICB/${entity.blueprint}.UICB.json`).properties).forEach(prop => {
                    if (entity.properties[prop[0]]) {
                        foundPropTypes.push([prop[1], entity.properties[prop[0]].type])
                    }
                })
            }

            // if (entity.properties.disableProfileIndicator) console.log(file)
        }
    } catch {
        console.log("Failed on", file.replace(".TEMP.json", ".TEMP.entity.json"))
    }

    if (n % 1000 == 0) {
        console.log("Processed " + n + " of " + allFiles.length)
    }

    n++
}

let propTypes = {}

for (let type of foundPropTypes) {
    propTypes[type[0]] = type[1]
}

fs.writeJSONSync("./foundUICBPropTypes.json", propTypes)