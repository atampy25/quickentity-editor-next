const fs = require("fs-extra")
const klaw = require("klaw-sync")
const Piscina = require('piscina')

async function a() {
    allFiles = klaw("./UICT", {
        filter: file => file.path.endsWith(".UICT.meta")
    })
    console.log("Crawled files")

    let workerPool = new Piscina({
        filename: "convertUICTMetaTask.js"
    });

    n = 1

    await Promise.all(allFiles.map(file => {
        n++
        return workerPool.run({
            file,
            n,
            allFilesLength: allFiles.length
        })
    }))

    console.log("Done!")
}

a()