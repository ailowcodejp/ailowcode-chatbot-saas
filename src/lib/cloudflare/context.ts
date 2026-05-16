import "server-only";

import { getCloudflareContext } from "@opennextjs/cloudflare";

export function getCloudflareEnv(): CloudflareEnv {
	return getCloudflareContext().env;
}

export function getCloudflareExecutionContext(): ExecutionContext {
	return getCloudflareContext().ctx;
}
