// Miscellaneous utility functions.

const {data} = require("./db.js");

function castString(v) {
	let done = v ? v : "";
	return done.toString();
}

module.exports = {castString};