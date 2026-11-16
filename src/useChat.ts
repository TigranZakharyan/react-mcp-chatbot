import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { ChatEngine } from "./core/engine";
import type { ChatConfig } from "./core/types";

/**
 * Headless hook – build your own UI on top of the same engine.
 *
 * const { messages, send, clear, loading } = useChat({ provider, model, apiKey, api });
 */
export function useChat(config: ChatConfig) {
  const [engine] = useState(() => new ChatEngine(config));

  // Keep the engine in sync with props without recreating it (history survives re-renders).
  useEffect(() => {
    engine.configure(config);
  });

  const state = useSyncExternalStore(engine.subscribe, engine.getState, engine.getState);

  const send = useCallback((text: string) => engine.send(text), [engine]);
  const clear = useCallback(() => engine.clear(), [engine]);
  const stop = useCallback(() => engine.abort(), [engine]);

  return useMemo(
    () => ({ ...state, send, clear, stop, engine }),
    [state, send, clear, stop, engine]
  );
}
