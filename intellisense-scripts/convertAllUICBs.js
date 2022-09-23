const fs = require("fs-extra")
const klaw = require("klaw-sync")
const path = require("path")
const {
    execSync
} = require("child_process")

async function a() {
    let a = 0
    for (let UICBfile of klaw("./UICB").map(a => a.path).filter(a => a.endsWith(".UICB"))) {
        execSync(`python UICBdecode.py ${UICBfile}`)
        try {
            fs.writeJSONSync(UICBfile.replace(".UICB", ".UICB.json"), {
                properties: Object.fromEntries(fs.readJSONSync(UICBfile.replace(".UICB", ".UICB.json")).filter(a => !a.unknownValue).filter(a => a.value1 == "0").map(a => [a.string, a.value2])),
                pins: Object.fromEntries(fs.readJSONSync(UICBfile.replace(".UICB", ".UICB.json")).filter(a => !a.unknownValue).filter(a => a.value1 == "1").map(a => [a.string, a.value2]))
            })
        } catch {
            fs.writeJSONSync(UICBfile.replace(".UICB", ".UICB.json"), {
                properties: {},
                pins: {}
            })
        }

        a++

        (a % 50 == 0) && (console.log("Converted " + a))
    }

    console.log("Done!")
}

a()