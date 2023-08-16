const fs = require("fs-extra")

module.exports = async ({ file, n, allFilesLength }) => {
	try {
		const mate = fs.readFileSync(file)

		let beginning = mate.length - 1
		while (mate[beginning] == 0 || (mate[beginning] > 31 && mate[beginning] < 127)) {
			beginning--
		}

		fs.writeFileSync(file + ".json", JSON.stringify(Object.fromEntries(mate.subarray(beginning).subarray(mate.subarray(beginning).toString().indexOf("\x00")).toString().split("\x00").filter(a=>a).flatMap((_, i, a) => i % 2 ? [] : [a.slice(i, i + 2)]))))
	} catch {
		console.log("Failed to convert " + file)
		return
	}

	if (n % 100 == 0) {
		console.log("Processed " + n + " of " + allFilesLength)
	}
}
