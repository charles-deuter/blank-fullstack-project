CREATE TABLE "wallets" (
	"id" serial PRIMARY KEY NOT NULL,
	"display_name" text NOT NULL,
	"balance_cents" bigint NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "transactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"sender_wallet_id" integer NOT NULL,
	"recipient_wallet_id" integer NOT NULL,
	"amount_cents" bigint NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "transaction_errors" (
	"id" serial PRIMARY KEY NOT NULL,
	"sender_wallet_id" bigint,
	"recipient_wallet_id" bigint,
	"amount_cents" bigint,
	"reason" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_sender_wallet_id_wallets_id_fk" FOREIGN KEY ("sender_wallet_id") REFERENCES "public"."wallets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_recipient_wallet_id_wallets_id_fk" FOREIGN KEY ("recipient_wallet_id") REFERENCES "public"."wallets"("id") ON DELETE no action ON UPDATE no action;