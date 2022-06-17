// Stuff related to the database.

const useReplitDb = !!process.env.REPLIT_DB_URL;

const fs = require("fs");
const Database = require("@replit/database");
const db = new Database();

if (!useReplitDb) {
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
}

// Read database
let data;
let lastData;
try {
  if (useReplitDb) {
    data = {};
    db.get("database").then(dbValue => {
      if (dbValue) {
        const newData = JSON.parse(dbValue);
        for (const key in newData) {
          data[key] = newData[key];
        }
      } else {
        db.set("database", "{}");
      };
      data.levels =
        data.levels === undefined ? {} : data.levels;
      data.accounts =
        data.accounts === undefined ? {} : data.accounts;
    });
  } else {
  	// Yeah IK I should use a non-sync fs function but...
  	data = fs.readFileSync("db/database.json", "utf8");
	  data = JSON.parse(data);
    data.levels =
      data.levels === undefined ? data.levels : {};
    data.accounts =
      data.accounts === undefined ? data.accounts : {};
  }
} catch (err) {
	throw err;
}

function commitToDb() {
	let dataString = JSON.stringify(data);
	if (dataString === lastData) return;
	lastData = dataString;
	
  if (useReplitDb) {
    db.set("database", dataString);
  } else {
    fs.writeFile("db/database.json", dataString, ()=>{});
	  fs.writeFile("db/database-backup.json", dataString, ()=>{});
  }
}

setInterval(commitToDb, 15 * 1000);

module.exports = {data, commitToDb};