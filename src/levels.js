// Stuff related to levels and uploading them.

const {app} = require("./app.js");
const {data} = require("./db.js");
const {castString} = require("./util.js");
const {getSession} = require("./auth.js");

function filterLevel(level) {
	return {
		...level,
		by: {
			id: level.by,
			scratchUsername: data.accounts[level.by] ?
				data.accounts[level.by].scratchUsername
				: undefined
		}
	};
}

app.get("/levels", (req, res) => {
	res.json(Object.values(data.levels).map(l => filterLevel(l)));
});

app.post("/levels", (req, res) => {
	if (typeof req.body !== "object") {
		res.status(400).send(
			"Invalid request. For API users: make sure to send Content-Type: application/json as a header because that's required for some reason."
		);
		return;
	}
	
	const session = getSession(req.body.sessionId);
	
	if (!session) {
		res.status(403).send("You must be logged in to upload levels!");
		return;
	}
	
	if (session.account.banned) {
		res.status(403).send("You have been banned :(");
		return;
	}
	
	let uploaded = addLevelInfo(req.body);
	
	if (uploaded.error) {
		res.status(uploaded.code).send(uploaded.text);
		return;
	}
	
	uploaded.id = Object.keys(data.levels).length.toString();
	uploaded.date = Date.now();
	uploaded.by = session.userId;
	
	data.levels[uploaded.id] = uploaded;
	
	res.status(201).json(uploaded);
});
app.get("/levels/:level", (req, res) => {
	const id = req.params.level;
	
	if (id === undefined || !data.levels[id]) {
		res.status(404).send("The level doesn't exist.");
		return;
	}
	return data.levels[id];
});
app.delete("/levels/:level", (req, res) => {
	const q = req.query;
	const session = getSession(q.sessionId);
	
	if (!session) {
		res.status(403).send("You must be logged in to delete levels!");
		return;
	}
	
	const id = req.params.level;
	const level = data.levels[id];
	
	if (id === undefined || !level) {
		res.status(404).send("The level doesn't exist.");
		return;
	}
	if (level.by !== session.userId && !session.account.admin) {
		res.status(403).send("You didn't create this level!");
		return;
	}
	
	delete data.levels[id];
	
	res.status(200).send("Deletion successful.");
});

function addLevelInfo(r) {
	const error = (code, text) => {
		return {code, text, error: true};
	}
	
	if (typeof r !== "object") {
		return error(400, "Invalid request. For API users: make sure to send Content-Type: application/json as a header because that's required for some reason.");
	}
	
	let l = {};
	
	const valid = {
		lengths: [
			"Very Short",
			"Short",
			"Medium",
			"Long",
			"Very Long",
			"Epic",
			"N/A / Other",
		],
		difficulties: [
			"Auto",
			"Very Easy",
			"Easy",
			"Normal",
			"Hard",
			"Extreme",
			"N/A / Other",
		],
		compat: [
			"vanilla",
			"multiplayer",
			"other",
		]
	}
	
	try {
		l.name = castString(r.name).trim();
		if (!l.name) {
			return error(400, "Level cannot be unnamed.")
		}
		if (l.name.length > 50) {
			return error(413, "Level name cannot be longer than 50 characters.")
		}
		
		l.desc = castString(r.desc).trim();
		if (l.desc.length > 500) {
			return error(413, "Level descriptions cannot be longer than 500 characters.")
		}
		
		l.difficulty = castString(r.difficulty).trim();
		if (!valid.difficulties.includes(l.difficulty)) {
			return error(400, "Invalid level difficulty. Valid difficulties:\n" + valid.difficulties.join(", "))
		}
		
		l.length = castString(r.length).trim();
		if (!valid.lengths.includes(l.length)) {
			return error(400, "Invalid level length. Valid lengths:\n" + valid.lengths.join(", "))
		}
		
		l.compat = castString(r.compat).trim();
		if (!valid.compat.includes(l.compat)) {
			return error(400, "Invalid level compatibility. Valid compatibilities:\n" + valid.compat.join(", "))
		}
		
		l.code = castString(r.code).trim();
		if (!l.code) {
			return error(400, "Level must have a code.")
		}
		if (l.code.length > 10000) {
			return error(413, "Level code cannot be longer than 10000 characters.")
		}
		
		return l;
	} catch(e) {
		return error(400, e);
	}
}