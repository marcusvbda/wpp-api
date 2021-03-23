const { verifyJWT } = require("@middlewares/jwt")
const express = require('express')
const router = express()
router.use(express.json())

router.post('/', (req, res) => {
	if (req.body.secret != process.env.SECRET_KEY) res.sendStatus(403)
	let token = createToken({ secret: req.body.secret })
	res.status(202).json({ token })
})

router.post('/check', verifyJWT, (req, res) => {
	if (!req.user) return res.sendStatus(403)
	res.status(202).json(req.user)
})

module.exports = router