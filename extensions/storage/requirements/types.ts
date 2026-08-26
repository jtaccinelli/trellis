/**
 * Contract that a requirement places on another domain.
 *
 * Domain agents describe contracts for other domains; the coordinator records
 * them but does not synthesize them.
 */
export interface Contract {
  target_domain_id: string;
  description: string;
}

/**
 * Scope requirement entity.
 *
 * Requirements are transient slices of the user's request. They are created by
 * coordinators, assessed by domain agents, and resolved when the queue is stable.
 */
export interface Requirement {
  id: string;
  request_id: string;
  description: string;
  domain_id: string;
  parent_requirement_id?: string;
  status: "provisional" | "assigned" | "decomposed" | "final" | "absorbed" | "escalated";
  owned_scope?: string;
  contracts: Contract[];
  child_requirement_ids: string[];
  reassignment_count: number;
  escalation_reason?: string;
  resolution_payload?: string;
  created_at: number;
  resolved_at?: number;
}
