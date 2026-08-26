/**
 * Queue item entity.
 *
 * Queue items live on a domain's shared FIFO queue. Coordinators enqueue them;
 * the domain manager consumes them serially and spawns a fresh domain agent for
 * each.
 */
export interface QueueItem {
  id: string;
  domain_id: string;
  requirement_id: string;
  enqueued_by_coordinator_id: string;
  status: "queued" | "running" | "done" | "failed";
  domain_agent_id?: string;
  result_payload?: string;
  priority: number;
  created_at: number;
}
