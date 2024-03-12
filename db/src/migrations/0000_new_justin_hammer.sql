CREATE TABLE IF NOT EXISTS "trades"
(
    "id"         serial PRIMARY KEY      NOT NULL,
    "c"          text,
    "p"          numeric                 NOT NULL,
    "s"          varchar(10)             NOT NULL,
    "t"          timestamp               NOT NULL,
    "v"          integer                 NOT NULL,
    "created_at" timestamp DEFAULT now() NOT NULL,
    "updated_at" timestamp DEFAULT now() NOT NULL
);
