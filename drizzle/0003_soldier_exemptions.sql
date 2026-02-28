CREATE TABLE "soldier_exemptions" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
	"soldier_id" integer NOT NULL REFERENCES "soldiers"("id") ON DELETE CASCADE,
	"exemption_code" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "soldier_exemptions_soldier_code" ON "soldier_exemptions" ("soldier_id", "exemption_code");
