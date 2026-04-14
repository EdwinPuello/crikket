import { useEffect } from "react"

/**
 * When the recorder enters the "ready" state (mic enabled, waiting for
 * a user gesture), check if the microphone permission is already granted.
 * If so, call `onStart` immediately so the recording auto-starts.
 */
export function useMicAutoStart(state: string, onStart: () => void): void {
  useEffect(() => {
    if (state !== "ready") return

    navigator.permissions
      .query({ name: "microphone" as PermissionName })
      .then((result) => {
        if (result.state === "granted") {
          onStart()
        }
      })
      .catch(() => {
        // permissions API unavailable — stay on "ready", show the button
      })
  }, [state, onStart])
}
