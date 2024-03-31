import { describe, test, expect, afterAll, beforeAll } from 'bun:test'
import app, { PREVIOUS_TRADES_LIMIT } from '../src/index.ts'

describe('API Tests for POST /api/trades (CORRECT)', () => {
    let trades: any;
    const dates = {
        from: Date.now() - 1000 * 60 * 60 * 24, // 24 hours ago
        to: Date.now() // current time
    };

    beforeAll(async () => {
        const res = await app.request('/api/trades', {
            method: 'POST',
            body: JSON.stringify(dates),
            headers: {
                'Content-Type': 'application/json'
            }
        });
        expect(res.status).toBe(200);
        trades = await res.json();
    });

    test('response should be an array', () => {
        expect(trades).toBeInstanceOf(Array);
    });

    test('each trade should have required properties', () => {
        trades.forEach((trade: any) => {
            expect(trade).toHaveProperty('timestamp');
            expect(trade).toHaveProperty('price');
            expect(trade).toHaveProperty('volume');
            expect(trade).toHaveProperty('symbol');
        });
    });

    test('trades array should not exceed 1000 items', () => {
        expect(trades.length).toBeLessThanOrEqual(1000);
    });

    test('trades should be in descending order by timestamp', () => {
        trades.forEach((trade: any, index: number) => {
            if (index > 0) {
                expect(new Date(trade.timestamp).getTime()).toBeLessThanOrEqual(new Date(trades[index - 1].timestamp).getTime());
            }
        });
    });

    test('trades timestamps should be within the requested date range', () => {
        trades.forEach((trade: any) => {
            expect(new Date(trade.timestamp).getTime()).toBeGreaterThanOrEqual(new Date(dates.from).getTime());
            expect(new Date(trade.timestamp).getTime()).toBeLessThanOrEqual(new Date(dates.to).getTime());
        });
    });

    afterAll(() => {
        trades = null;
    });
});


describe('API Tests for POST /api/trades (INCORRECT)', () => {
    test('should return 400 if no body is sent', async () => {
        const res = await app.request('/api/trades', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        expect(res.status).toBe(400);
    });

    test('should return 400 if invalid date range types are sent (String)', async () => {
        const res = await app.request('/api/trades', {
            method: 'POST',
            body: JSON.stringify({
                from: 'invalid date',
                to: 'invalid date'
            }),
            headers: {
                'Content-Type': 'application/json'
            }
        });
        expect(res.status).toBe(400);
    });

    test('should return 400 if invalid date range types are sent (Array)', async () => {
        const res = await app.request('/api/trades', {
            method: 'POST',
            body: JSON.stringify({
                from: [],
                to: []
            }),
            headers: {
                'Content-Type': 'application/json'
            }
        });
        expect(res.status).toBe(400);
    });

    test('should return 400 if invalid date range types are sent (Object)', async () => {
        const res = await app.request('/api/trades', {
            method: 'POST',
            body: JSON.stringify({
                from: {},
                to: {}
            }),
            headers: {
                'Content-Type': 'application/json'
            }
        });
        expect(res.status).toBe(400);
    });

    test('should return 400 if invalid date range types are sent (Boolean)', async () => {
        const res = await app.request('/api/trades', {
            method: 'POST',
            body: JSON.stringify({
                from: true,
                to: false
            }),
            headers: {
                'Content-Type': 'application/json'
            }
        });
        expect(res.status).toBe(400);
    });

    test('should return 400 if invalid date range types are sent (Null)', async () => {
        const res = await app.request('/api/trades', {
            method: 'POST',
            body: JSON.stringify({
                from: null,
                to: null
            }),
            headers: {
                'Content-Type': 'application/json'
            }
        });
        expect(res.status).toBe(400);
    });

    test('should return 400 if invalid date range types are sent (Undefined)', async () => {
        const res = await app.request('/api/trades', {
            method: 'POST',
            body: JSON.stringify({
                from: undefined,
                to: undefined
            }),
            headers: {
                'Content-Type': 'application/json'
            }
        });
        expect(res.status).toBe(400);
    });

    test('should return 400 if invalid date range types are sent (Symbol)', async () => {
        const res = await app.request('/api/trades', {
            method: 'POST',
            body: JSON.stringify({
                from: Symbol(),
                to: Symbol()
            }),
            headers: {
                'Content-Type': 'application/json'
            }
        });
        expect(res.status).toBe(400);
    });
})

const webSocketUrl = 'ws://localhost:3001';

describe('WebSocket Tests for Trades On First Load', () => {
    let ws: WebSocket;
    let receivedMessages: any;

    beforeAll((done) => {
        ws = new WebSocket(webSocketUrl);
        ws.addEventListener('message', (message) => {
            receivedMessages = JSON.parse(message.data);
            done(); // This signals the completion of the async setup.
        });
    });

    afterAll(() => {
        if (ws) {
            ws.close();
        }
    });

    test('should receive previous trades when a client connects', () => {
        expect(receivedMessages).toBeDefined();
        expect(receivedMessages).toBeInstanceOf(Array);
        // Assuming PREVIOUS_TRADES_LIMIT is defined elsewhere and accessible here.
        expect(receivedMessages).toHaveLength(PREVIOUS_TRADES_LIMIT);
    });

    test('should have correct properties in previous trades', () => {
        receivedMessages.forEach((trade: any) => {
            expect(trade).toHaveProperty('t');
            expect(trade).toHaveProperty('p');
            expect(trade).toHaveProperty('v');
            expect(trade).toHaveProperty('symbol');
            expect(trade).toHaveProperty('timestamp');
            expect(trade).toHaveProperty('price');
            expect(trade).toHaveProperty('volume');
            expect(trade).toHaveProperty('id');
            expect(trade).toHaveProperty('conditions');
            expect(trade).toHaveProperty('createdAt');
            expect(trade).toHaveProperty('updatedAt');
        });
    });
});

// TODO: Add more tests for the WebSocket server. (like when client getting new trades continuously, etc.)