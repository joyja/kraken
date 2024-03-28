import * as Sentry from "@sentry/node";
import { nodeProfilingIntegration } from "@sentry/profiling-node";

Sentry.init({
  dsn: "https://017f8bd81ba4db77d67b4cf36972cc13@o4506922173530112.ingest.us.sentry.io/4506922177986560",
  // Set tracesSampleRate to 1.0 to capture 100%
  // of transactions for performance monitoring.
  // We recommend adjusting this value in production
  tracesSampleRate: 1.0,
	profilesSampleRate: 1.0,
	integrations: [
    // Add profiling integration to list of integrations
    nodeProfilingIntegration(),
  ],
});

export const sentry = Sentry