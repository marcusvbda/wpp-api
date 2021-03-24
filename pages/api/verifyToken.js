
const jwt = require("jsonwebtoken")

module.exports = (req, res) => {
	const token = req.headers["authorization"]
	if (!token) throw res.status(401).send("Unauthorized")
	const splited = token.split(' ')
	if (splited[0].trim().toLowerCase() != "bearer") throw res.status(401).send("Unauthorized")
	if (!splited[1]) throw res.status(401).send("Unauthorized")
	try {
		return jwt.verify(splited[1], process.env.SECRET_KEY, (er, decoded) => {
			if (er) throw res.status(401).send("Unauthorized")
			if (decoded.secret != process.env.SECRET_KEY) throw res.status(401).send("Unauthorized")
			req.user = decoded
		})
	} catch (er) {
		return { status: 401, text: "Unauthorized" }
	}
}