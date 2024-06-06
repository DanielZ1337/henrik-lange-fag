import { Trade, TradeResponse } from '@common/types.ts'
import { Hono } from 'hono'
import { serveStatic } from 'hono/bun'
import { z } from 'zod'
import { cors } from 'hono/cors'
import { zValidator } from '@hono/zod-validator'
import { db } from '@db/drizzle.ts'
import { trades } from '@db/schema.ts'
import { and, desc, gte, lte } from 'drizzle-orm'

const wss = new WebSocket(`wss://ws.finnhub.io?token=${process.env.STOCK_API_KEY}`)

const dateFilterSchema = z.object({
	from: z.number(),
	to: z.number(),
})

const app = new Hono()
	.use(cors())
	.get(
		'*',
		serveStatic({
			root: '../client/dist',
		})
	)
	.post('/api/trades', zValidator('json', dateFilterSchema), async (c) => {
		const body = await c.req.json().catch(() => null)

		if (!body) {
			return c.json({ error: 'No body sent' }, 400)
		}

		const dateFilter = dateFilterSchema.safeParse(body)

		if (!dateFilter.success) {
			return c.json({ error: dateFilter.error }, 400)
		}

		const retrievedTrades = await db
			.select()
			.from(trades)
			.where(and(gte(trades.t, new Date(dateFilter.data.from)), lte(trades.t, new Date(dateFilter.data.to))))
			.orderBy(desc(trades.t))
			.limit(1000)
			.execute()

		return c.json(retrievedTrades)
	})

export const PREVIOUS_TRADES_LIMIT = 150000

const server = Bun.serve({
	fetch(req, server) {
		const success = server.upgrade(req)
		if (success) {
			// Bun automatically returns a 101 Switching Protocols
			// if the upgrade succeeds
			return undefined
		}
	},
	websocket: {
		// this is called when a message is received
		async open(ws) {
			ws.subscribe('trades')
			const previousTrades = await db
				.select()
				.from(trades)
				.orderBy(desc(trades.t))
				.limit(PREVIOUS_TRADES_LIMIT)
				.execute()

			let previousTradesFormatted = previousTrades.map((trade) => {
				return {
					...trade,
					t: trade.t.getTime(),
					p: trade.p,
					v: trade.v,
				}
			})

			// get the previous trades in interval of 1 hour and send it to the client
			ws.send(JSON.stringify(previousTradesFormatted))
		},
		message(ws, message) {
			ws.ping()
		},
		close(ws) {
			ws.unsubscribe('trades')
		},
	},
	port: 3001,
	hostname: 'localhost',
})

wss.onopen = () => {
	console.log('WebSocket Client Connected')

	wss.send(
		JSON.stringify({
			type: 'subscribe',
			symbol: 'BINANCE:BTCUSDT',
		})
	)

	wss.onmessage = (message) => {
		const response = JSON.parse(message.data) as TradeResponse

		if (response.type !== 'trade') return

		server.publish('trades', JSON.stringify(response.data))

		response.data.forEach((trade: Trade) => {
			db.insert(trades)
				.values({
					// @ts-expect-error
					p: trade.p,
					s: trade.s,
					t: new Date(trade.t),
					v: trade.v,
				})
				.execute()
		})
	}
}

console.log(`Listening on ${server.hostname}:${server.port}`)

export default app
