import {type InferSelectModel} from 'drizzle-orm';
import {decimal, pgTable, serial, text, timestamp,} from 'drizzle-orm/pg-core';

export const trades = pgTable('trades', {
    id: serial('id').primaryKey(),
    c: text('c'),
    p: decimal('p').notNull(),
    s: text('s').notNull(),
    t: timestamp('t').notNull(),
    v: decimal('v').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export type TradeDatabase = InferSelectModel<typeof trades>;