CREATE TABLE "password_resets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"otp" varchar(255) NOT NULL,
	"expires_at" timestamp NOT NULL,
	"used" boolean DEFAULT false NOT NULL,
	"reset_token" varchar(500),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "idx_password_resets_email" ON "password_resets" USING btree ("email");--> statement-breakpoint
CREATE INDEX "idx_password_resets_expires_at" ON "password_resets" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "idx_password_resets_reset_token" ON "password_resets" USING btree ("reset_token");