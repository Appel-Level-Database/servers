// Miscellaneous utility functions.

const {data} = require("./db.js");

function castString(v) {
	let done = v ?? "";
	return done.toString();
}
function fixLevelIds() {
	for (const id in data.levels) {
		data.levels[id].id = id;
	}
}

module.exports = {castString, fixLevelIds};