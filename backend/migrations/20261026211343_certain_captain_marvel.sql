ALTER TABLE "foo" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "foo" ADD COLUMN "category" text DEFAULT 'general' NOT NULL;--> statement-breakpoint
ALTER TABLE "foo" ADD COLUMN "priority" text DEFAULT 'medium' NOT NULL;--> statement-breakpoint
ALTER TABLE "foo" ADD COLUMN "is_active" boolean DEFAULT true NOT NULL;