const { verifyJWT } = require("@middlewares/jwt")
const { default: axios } = require("axios")
const express = require('express')
const router = express()
router.use(express.json())
const WppClient = require('whatsapp_engine_js')
const { MessageMedia } = require('whatsapp_engine_js/src/structures')

router.post('/send-message', verifyJWT, (req, res) => {
	let { messages, webhook, session } = req.body
	if (!messages) {
		res.status(500).json({ error: "Messages parameter is required" })
	}
	const wpp = new WppClient({ puppeteer: { headless: true }, session })

	if (!session) {
		wpp.on('qr', qr => {
			console.log("qr", qr)
			if (webhook) {
				axios.post(webhook, { event: "qr", data: qr })
			}
		})

		wpp.on('authenticated', (session) => {
			session = JSON.stringify(session)
			console.log("authenticated", session)
			if (webhook) {
				axios.post(webhook, { event: "authenticated", data: session })
			}
		})
	}
	wpp.on('ready', async () => {
		console.log("ready")
		sendMessages(messages, wpp, webhook)
	})

	wpp.initialize()
	res.sendStatus(202)
})

const sendFile = async (message, account, wpp, type) => {
	const mimes = {
		image: "image/png",
		audio: "audio/mpeg",
	}
	let file = await axios.get(message.url, { responseType: 'arraybuffer' })
	let raw = Buffer.from(file.data).toString('base64')
	const media = new MessageMedia(mimes[type], raw)
	if (type == "image") {
		await wpp.sendMessage(account.id, media, { caption: message.message })
	} else {
		if (message.message) {
			await wpp.sendMessage(account.id, message.message)
		}
		await wpp.sendMessage(account.id, media)
	}
}

const messageTypes = {
	text: async (account, message, wpp) => await wpp.sendMessage(account.id, message.message),
	image: async (account, message, wpp) => await sendFile(message, account, wpp, "image"),
	audio: async (account, message, wpp) => await sendFile(message, account, wpp, "audio"),
}

const sendMessages = async (messages, wpp, webhook) => {
	let data = {
		sent: [],
		failed: [],
	}
	for (let i in messages) {
		let message = messages[i]
		let account = await wpp.getAccountId(message.number)
		if (account.isValid && message.message) {
			await messageTypes[message.type.trim().toLowerCase()](account, message, wpp)
			data.sent.push(message)
		} else {
			data.failed.push(message)
		}
	}
	if (webhook) {
		axios.post(webhook, { event: "sent_message", data })
	}
}

module.exports = router