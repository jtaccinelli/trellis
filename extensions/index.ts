/**
 * Trellis — pi extension entry point.
 *
 * Replace this with behavior ported from the prior project.
 * See https://pi.dev for the extension API reference.
 */

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

export default function trellis(pi: ExtensionAPI) {
  // Lifecycle
  pi.on("session_start", async (_event, ctx) => {
    ctx.ui.notify("Trellis loaded", "info");
  });
}
