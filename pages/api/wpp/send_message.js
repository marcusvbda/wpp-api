const verifyJWT = require("../verifyToken")
const axios = require("axios")
const WppClient = require('whatsapp_engine_js')
const { MessageMedia } = require('whatsapp_engine_js/src/structures')

export default (req, res) => {
	if (req.method != 'POST') return res.status(405).send("Method Not Allowed")
	verifyJWT(req, res)
	let { messages, webhook, session } = req.body

	try {
		const wpp = new WppClient({ puppeteer: { headless: proccess.env.HEADLESS || false }, session })

		if (!session) {
			wpp.on('qr', qr => {
				axios.post(webhook, { event: "qr", data: qr })
			})

			wpp.on('authenticated', (session) => {
				axios.post(webhook, { event: "authenticated", data: JSON.stringify(session) })
			})
		}
		wpp.on('ready', async () => {
			sendMessages(messages, wpp, webhook)
		})

		wpp.initialize()
		return res.status(202).send("Accepted")
	} catch (er) {
		return res.status(500).send(err)
	}
}


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
		if (account.isValid) {
			await messageTypes[message.type.trim().toLowerCase()](account, message, wpp)
			data.sent.push(message)
		} else {
			data.failed.push(message)
		}
	}
	axios.post(webhook, { event: "sent_message", data })
}
