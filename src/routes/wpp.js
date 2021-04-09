const { verifyJWT } = require("@middlewares/jwt")
const { default: axios } = require("axios")
const express = require('express')
const router = express()
router.use(express.json())
const WppClient = require('whatsapp_engine_js')
const { MessageMedia } = require('whatsapp_engine_js/src/structures')

const sessionStart = (wpp, session, webhook) => {
	if (!session) {
		wpp.on('qr', qr => {
			console.log("qr")
			if (webhook) {
				axios.post(webhook, { event: "qr", data: qr })
				// .then(resp => console.log(resp.data)).catch(er => console.log(er))
			}
		})

		wpp.on('qr_scanned', () => {
			console.log("qr_scanned")
			if (webhook) {
				axios.post(webhook, { event: "qr_scanned", data: {} })
				// .then(resp => console.log(resp.data)).catch(er => console.log(er))
			}
		})
	}

	wpp.on('authenticated', (session) => {
		console.log("authenticated")
		session = JSON.stringify(session)
		if (webhook) {
			axios.post(webhook, { event: "authenticated", data: session })
			// .then(resp => console.log(resp.data)).catch(er => console.log(er))
		}
	})

	wpp.on("auth_failure", () => {
		console.log("auth_failure")
		if (webhook) {
			axios.post(webhook, { event: "auth_failure", data: session })
			// .then(resp => console.log(resp.data)).catch(er => console.log(er))
		}
	})
}

router.post('/check-session', verifyJWT, (req, res) => {
	let { webhook, session } = req.body
	const wpp = new WppClient({ puppeteer: { headless: true }, session })

	sessionStart(wpp, session, webhook)

	wpp.initialize()
	res.sendStatus(202)
})


router.post('/send-message', verifyJWT, (req, res) => {
	let { messages, webhook, session } = req.body
	if (!messages) {
		res.status(500).json({ error: "Messages parameter is required" })
	}
	const wpp = new WppClient({ puppeteer: { headless: true }, session })
	sessionStart(wpp, session, webhook)

	wpp.on('ready', async () => sendMessages(messages, wpp, webhook))

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