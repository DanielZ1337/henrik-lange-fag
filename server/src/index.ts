import { desc } from 'drizzle-orm';
import { Trade, TradeResponse } from '../../common/types.ts';
import { db } from './db/client.ts';
import { trades } from './db/schema.ts';

const wss = new WebSocket(`wss://ws.finnhub.io?token=${process.env.STOCK_API_KEY}`)

const server = Bun.serve({
  fetch(req, server) {
    const success = server.upgrade(req);
    if (success) {
      // Bun automatically returns a 101 Switching Protocols
      // if the upgrade succeeds
      return undefined;
    }

    // handle HTTP request normally
    return new Response("Hello world!");
  },
  websocket: {
    // this is called when a message is received
    async open(ws) {
      ws.subscribe("trades");
      const previousTrades = await db.select().from(trades).orderBy(desc(trades.timestamp)).limit(1000).execute()

      // change the previous trade swith the same format as the new trades
      previousTrades.forEach((trade) => {
        // @ts-expect-error
        trade.t = trade.timestamp.getTime()
        // @ts-expect-error
        trade.p = trade.price
        // @ts-expect-error
        trade.v = trade.volume
      })

      server.publish("trades", JSON.stringify(previousTrades, null, 2));
    },
    message(ws, message) {
      ws.ping()
    },
    close(ws) {
      ws.unsubscribe("trades");
    },
  },
  port: 3000,
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
        db.insert(trades).values({
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