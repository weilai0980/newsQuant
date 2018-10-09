const csvParse = require("csv-parse/lib/sync");
const fs = require("fs");

module.exports = ((first, last) => {
	first = parseInt(first) || 0
	last = parseInt(last) || 50
	const glossaryFile = fs.readFileSync("../crypto_glossary.txt", "utf-8");
	const keywordsCsv = csvParse(glossaryFile, { columns: true }).slice(first, last);
	const keywords = {};
	for(let line of keywordsCsv) {
		keywords[line.id] = {
			versions: [ line.id, line.name, line.symbol ].map((s) => s.toLowerCase()),
		};
	}
	return keywords;
});