// The main express app.

const express = require("express");
const cors = require("cors");

const app = express();
const port = 8075;

app.use(cors({
	origin: true,
	credentials: true
}));
app.use(express.urlencoded({ extended: true }));
app.use(express.text());
app.use(express.json());

const {data} = require("./db.js");

function listen() {
	app.listen(port, () => {
		console.log("Server up!");
		console.log("Current database:\n", data, "\n\n");
		console.log("==========LOGS==========");
	});
}

module.exports = {app, listen};