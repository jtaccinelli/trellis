/**
 * Agent entity.
 *
 * Tracks every Trellis agent spawned anywhere in the agent tree. The root
 * extension, coordinators, and agents all write to the same storage-backed
 * registry so that any parent can inspect its descendants.
 */
export interface Agent {
  id: string;
  parent_id?: string;
  request_id: string;
  role: string;
  name: string;
  status: "running" | "completed" | "failed" | "stopped";
  pid?: number;
  task_preview?: string;
  started_at: number;
  exited_at?: number;
  exit_code?: number;
  result_text?: string;
  coordinator_id?: string;
  domain_id?: string;
  queue_item_id?: string;
}
