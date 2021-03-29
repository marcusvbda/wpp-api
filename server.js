require("./bootstrap")
const express = require('express')
const app = express()
app.use(express.json())

app.get('/', (req, res) => {
	res.send("api working...")
})

app.post('/webhook-simulate', (req, res) => {
	let { event, data } = req.body
	console.log("webhook-simulate", event, data)
	return res.sendStatus(202)
})

app.use('/auth', require("@routes/auth"))
app.use('/wpp', require("@routes/wpp"))

const server_port = process.env.PORT || 3000
app.listen(server_port, () => {
	console.log(`Server running in http://localhost:${server_port}`)
})