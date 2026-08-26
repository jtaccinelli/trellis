/**
 * Scoping request entity.
 *
 * A request represents one user ask moving through the recursive scoping
 * loop. The coordinator_id is the agent (root or child) currently driving it.
 */
/**
 * Alias avoids shadowing the global `Request` fetch class and keeps imports
 * explicit in extension code.
 */
export interface ScopeRequest {
  request_id: string;
  description: string;
  status: "scoping" | "awaiting_approval" | "approved" | "rejected" | "abandoned";
  coordinator_id: string;
}
