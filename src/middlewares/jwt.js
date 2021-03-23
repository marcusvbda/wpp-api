
const jwt = require("jsonwebtoken")

verifyJWT = (req, res, next) => {
	const token = req.headers["authorization"]
	if (!token) res.sendStatus(403)
	const splited = token.split(' ')
	if (splited[0].trim().toLowerCase() != "bearer") res.sendStatus(403)
	if (!splited[1]) res.sendStatus(403)
	try {
		jwt.verify(splited[1], process.env.SECRET_KEY, (er, decoded) => {
			if (er) res.sendStatus(403)
			if (decoded.secret != process.env.SECRET_KEY) res.sendStatus(403)
			req.user = decoded
			next()
		})
	} catch (er) {
		console.log(er)
		res.sendStatus(403)
	}
}

createToken = (user) => {
	return jwt.sign(user, process.env.SECRET_KEY)
}

module.exports = {
	verifyJWT,
	createToken
}