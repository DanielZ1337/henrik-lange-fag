import { InferSelectModel } from 'drizzle-orm';
import { decimal, pgTable, serial, text, timestamp, } from 'drizzle-orm/pg-core';

export const trades = pgTable('trades', {
    id: serial('id').primaryKey(),
    conditions: text('c'),
    price: decimal('p').notNull(),
    symbol: text('s').notNull(),
    timestamp: timestamp('t').notNull(),
    volume: decimal('v').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export type TradeDatabase = InferSelectModel<typeof trades>;