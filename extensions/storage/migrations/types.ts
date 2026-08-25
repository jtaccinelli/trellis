/**
 * Migration record.
 *
 * Tracks which schema version has been applied to the database.
 */
export interface Migration {
  version: number;
  appliedAt: number;
}
