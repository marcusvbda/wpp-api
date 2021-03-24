const verifyJWT = require("../verifyToken")

export default (req, res) => {
	if (req.method != 'POST') return res.status(405).send("Method Not Allowed")
	verifyJWT(req, res)
	return res.status(200).json(req.user)
}

