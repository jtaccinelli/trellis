/**
 * One-to-one note entity.
 *
 * Notes are lightweight notifications or steering notes. They are not a
 * chat system; coordinators use them to learn when their backlog items
 * complete.
 */
export interface Note {
  id: string;
  request_id: string;
  from_agent_id: string;
  to_agent_id: string;
  payload: string;
  in_reply_to?: string;
  created_at: number;
}
