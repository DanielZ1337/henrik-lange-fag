CREATE TABLE IF NOT EXISTS "trades" (
	"id" serial PRIMARY KEY NOT NULL,
	"c" text,
	"p" numeric NOT NULL,
	"s" text NOT NULL,
	"t" timestamp NOT NULL,
	"v" numeric NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
