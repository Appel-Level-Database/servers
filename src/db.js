// Stuff related to the database.

const fs = require("fs");

createDir("db/");

createFile("db/database.json", "{}");
createFile("db/database-backup.json", "{}");

function createFile(file, data) {
	// existsSync is not deprecated sooo
	if (!fs.existsSync(file)){
		fs.writeFileSync(file, data);
	}
}
function createDir(dir) {
	if (!fs.existsSync(dir)){
		fs.mkdirSync(dir);
	}
}

// Read database
let data;
let lastData;
try {
	// Yeah IK I should use a non-sync fs function but...
	data = fs.readFileSync("db/database.json", "utf8");
	data = JSON.parse(data);
} catch (err) {
	throw err;
}

data.levels = data.levels ?? {};
data.accounts = data.accounts ?? {};
commitToDb();

function commitToDb() {
	let dataString = JSON.stringify(data);
	if (dataString === lastData) return;
	lastData = dataString;
	
	fs.writeFile("db/database.json", dataString, ()=>{});
	fs.writeFile("db/database-backup.json", dataString, ()=>{});
}

setInterval(commitToDb, 15 * 1000);

module.exports = {data, commitToDb};