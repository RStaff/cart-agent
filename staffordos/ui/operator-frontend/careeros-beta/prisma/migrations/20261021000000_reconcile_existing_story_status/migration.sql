-- Explicit legacy-schema reconciliation only; never invoked by normal startup.
ALTER TABLE "CareerOnboardingState"
ADD COLUMN "storyStatus" TEXT NOT NULL DEFAULT 'CURRENT_FACTS_REVIEWED';
