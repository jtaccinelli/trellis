/**
 * Domain entity.
 *
 * Domains are flat, semantic categories. Parent/child absorption relationships
 * are inferred by agents during scoping, not stored in the database. If no
 * existing domain claims a requirement, the coordinator flags a gap so a new
 * domain can be defined.
 *
 * Fields:
 *   id          — stable domain identifier used by tools, agents, and work items.
 *   name        — human-readable domain name (e.g. "frontend", "api", "payments").
 *   description — short summary of what this domain covers.
 *   remit       — detailed statement of responsibility for domain agents assessing scope.
 *   exclusions  — concerns this domain explicitly refuses to own.
 */
export interface Domain {
  id: string;
  name: string;
  description: string;
  remit: string;
  exclusions: string[];
}
