import { lazy, type ComponentType } from "react";

// Lazy-loaded so pages without a live demo don't download the chat widget.
const Customizer = lazy(() => import("./Customizer").then((m) => ({ default: m.Customizer })));
const Playground = lazy(() => import("./Playground").then((m) => ({ default: m.Playground })));

export { Playground };

/**
 * Live widgets that can be dropped into any Markdown page with a fenced block:
 *
 *   ```component:Customizer
 *   ```
 */
export const liveComponents: Record<string, ComponentType> = { Customizer, Playground };
