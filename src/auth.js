// Stuff related to authentication and accounts.

const {app} = require("./app.js");
const {data} = require("./db.js");
const fetch = require("node-fetch");
const crypto = require("crypto");

let sessions = [];

app.get("/auth", async (req, res) => {
	const q = req.query;
	
	const vReq = await fetch(
		`https://auth.itinerary.eu.org/api/auth/verifyToken?privateCode=${q.privateCode}`
	);
	const json = await vReq.json();
	
	if (json.valid) {
		const sessionId = crypto.randomBytes(32).toString("hex");
		delete sessions.find(v => v.username === json.username);
		
		const account = await createAccount(json.username);
		sessions.push({
			sessionId,
			account,
			username: json.username,
			userId: account.id,
		});
		
		res.status(200).json(getSession(sessionId));
	} else {
		res.status(403).json({error: "Authentication failed"});
	}
});

app.get("/session", async (req, res) => {
	const q = req.query;
	const session = getSession(q.sessionId);
	
	if (!session) {
		res.status(403).json({error: "This session does not exist"});
		return;
	}
	res.status(200).json(session);
})
app.get("/logout", async (req, res) => {
	const q = req.query;
	const deleted = logOut(q.sessionId);
	
	if (!deleted) {
		res.status(403).send("This session does not exist");
		return;
	}
	res.status(200).send("Logged out successfully");
})

function getSession(sessionId) {
	return sessions.find(v => v.sessionId === sessionId) || null;
}
function logOut(sessionId) {
	const idx = sessions.findIndex(v => v.sessionId === sessionId);
	if (idx === -1) return false;
	
	sessions.splice(idx, 1);
	return true;
}

async function createAccount(username) {
	// First, check if there's an existing account with this username
	const existingAccount = Object.values(data.accounts)
		.find(v => v.scratchUsername === username);
	if (existingAccount) return existingAccount;
	
	// Contact the Scratch API
	// (SDB because I don't really want to stress api.scratch)
	let apiRequest, apiJson;
	try {
		apiRequest = await fetch("https://scratchdb.lefty.one/v3/user/info/" + username);
		apiJson = await apiRequest.json();
	} catch (e) {
		return null;
	}
	if (!apiRequest.ok) return null;
	
	// Only the ID matters to us currently
	const accountId = apiJson.id.toString();
	
	// There's a possibility the user has changed usernames
	// Search for that too
	const existingId = Object.keys(data.accounts)
		.find(v => v === accountId);
	if (existingId) {
		// If the account exists, update the username and return it!
		data.accounts[existingId].scratchUsername = username;
		return data.accounts[existingId];
	}
	
	// Otherwise, we actually don't have the account created
	// Create it!
	const newAccount = {
		scratchUsername: username,
		id: accountId,
		created: Date.now(),
		banned: false,
		// Automaticaly promote the first user to admin
		// Hopefully nothing goes wrong with this
		admin: Object.keys(data.accounts).length === 0,
	};
	data.accounts[accountId] = newAccount;
	return newAccount;
}

module.exports = {getSession, logOut};