const jwt = require("jsonwebtoken")

export default (req, res) => {
	if (req.method != 'POST') return res.status(405).send("Method Not Allowed")
	let { secret } = req.body
	let secret_key = process.env.SECRET_KEY
	if (secret != secret_key) return res.status(401).send("Unauthorized")
	let token = jwt.sign({ secret }, secret_key)
	return res.status(200).json({ token: token })
}
