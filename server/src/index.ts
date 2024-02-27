import {desc} from 'drizzle-orm';
import {Trade, TradeResponse} from '../../common/types.ts';
import {db} from './db/client.ts';
import {trades} from './db/schema.ts';
import {Hono} from 'hono';
import {serveStatic} from 'hono/bun'

const wss = new WebSocket(`wss://ws.finnhub.io?token=${process.env.STOCK_API_KEY}`)

const app = new Hono()

app.get('*', serveStatic({
    root: '../client/dist',
}))

const PREVIOUS_TRADES_LIMIT = 150000

const server = Bun.serve({
    fetch(req, server) {
        const success = server.upgrade(req);
        if (success) {
            // Bun automatically returns a 101 Switching Protocols
            // if the upgrade succeeds
            return undefined;
        }
    },
    websocket: {
        // this is called when a message is received
        async open(ws) {
            ws.subscribe("trades");
            const previousTrades = await db.select()
                .from(trades)
                .orderBy(desc(trades.timestamp))
                .limit(PREVIOUS_TRADES_LIMIT)
                .execute();

            let previousTradesFormatted = previousTrades.map((trade) => {
                return {
                    ...trade,
                    t: trade.timestamp.getTime(),
                    p: trade.price,
                    v: trade.volume
                }
            })

            server.publish("trades", JSON.stringify(previousTradesFormatted, null, 2));
        },
        message(ws, message) {
            ws.ping()
        },
        close(ws) {
            ws.unsubscribe("trades");
        },
    },
    port: 3001,
    hostname: "localhost",
});

wss.onopen = () => {
    console.log('WebSocket Client Connected');

    wss.send(JSON.stringify({
        type: 'subscribe',
        symbol: 'BINANCE:BTCUSDT'
    }))

    wss.onmessage = (message: MessageEvent) => {
        const response = JSON.parse(message.data) as TradeResponse
        if (response.type === 'trade') {
            server.publish("trades", JSON.stringify(response.data, null, 2));
            response.data.forEach((trade: Trade) => {
                void db.insert(trades).values({
                    // @ts-expect-error
                    price: trade.p,
                    symbol: trade.s,
                    timestamp: new Date(trade.t),
                    volume: trade.v,
                }).execute()
            })
        }
    };
};

console.log(`Listening on ${server.hostname}:${server.port}`)

export default app