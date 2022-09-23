const fs = require("fs-extra")
const klaw = require("klaw-sync")
const Piscina = require('piscina')

async function a() {
    if (fs.existsSync("./allTblus.json")) {
        console.log("Loading files...")
        allFiles = fs.readJsonSync("./allTblus.json")
    } else {
        console.log("Crawling files...")
        allFiles = klaw("./TBLU", {
            filter: file => file.path.endsWith(".TBLU.json")
        })
        fs.writeJsonSync("./allTblus.json", allFiles)
        console.log("Crawled files")
    }

    let workerPool = new Piscina({
        filename: "convertTBLUMetaTask.js"
    });

    n = 1

    await Promise.all(allFiles.map(file => {
        n ++
        return workerPool.run({
            file,
            n,
            allFilesLength: allFiles.length
        })
    }))

    console.log("Done!")
}

a()