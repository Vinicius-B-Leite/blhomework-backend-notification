import express from "express"
import cors from "cors"
import { Expo, ExpoPushMessage } from "expo-server-sdk"

const app = express()

app.use(cors())
app.use(express.json())

let expo = new Expo()
app.post("/notification", (req, res) => {
	try {
		const body = req.body
		const { notifications_tokens, message } = body

		if (!notifications_tokens || !message) {
			return res.status(400).json({
				success: false,
				message: "Missing required fields [notifications_tokens or message]",
			})
		}

		let messages: ExpoPushMessage[] = []
		for (let pushToken of notifications_tokens) {
			if (!Expo.isExpoPushToken(pushToken)) {
				console.error(`Push token ${pushToken} is not a valid Expo push token`)
				continue
			}
			messages.push({
				to: pushToken,
				sound: "default",
				body: message,
			})
		}

		let chunks = expo.chunkPushNotifications(messages)
		let tickets = []
		;(async () => {
			for (let chunk of chunks) {
				try {
					let ticketChunk = await expo.sendPushNotificationsAsync(chunk)
					tickets.push(...ticketChunk)
				} catch (error) {}
			}
		})()

		return res.status(200).json({
			success: true,
			message: notifications_tokens,
		})
	} catch (error) {
		return res.status(500).json({
			success: false,
			message: "Internal server error",
		})
	}
})

app.listen(3000, () => {
	console.log("Server is running on port 3000")
})
