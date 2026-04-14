import { useEffect, useRef } from "react"
import { MICROPHONE_ENABLED_STORAGE_KEY } from "@/lib/capture-context"

export type CaptureType = "video" | "screenshot"

interface UseRecorderInitProps {
  onCaptureTypeChange: (type: CaptureType) => void
  onScreenshotLoaded: (blob: Blob) => void
  onStartRecording: () => void
  onReadyToRecord: (microphoneEnabled: boolean) => void
  onError: (error: string) => void
}

export function useRecorderInit({
  onCaptureTypeChange,
  onScreenshotLoaded,
  onStartRecording,
  onReadyToRecord,
  onError,
}: UseRecorderInitProps) {
  const autoStartChecked = useRef(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const type = (params.get("captureType") as CaptureType) || "video"
    onCaptureTypeChange(type)

    if (type === "screenshot") {
      chrome.storage.local.get(["pendingScreenshot"], (result) => {
        if (result.pendingScreenshot) {
          fetch(result.pendingScreenshot as string)
            .then((res) => res.blob())
            .then((blob) => {
              onScreenshotLoaded(blob)
              chrome.storage.local.remove(["pendingScreenshot"])
            })
            .catch((err) => {
              console.error("Failed to load screenshot:", err)
              onError("Failed to load screenshot")
            })
        }
      })
    } else if (type === "video") {
      if (autoStartChecked.current) return
      autoStartChecked.current = true

      chrome.storage.local.get(
        ["startRecordingImmediately", MICROPHONE_ENABLED_STORAGE_KEY],
        (result: Record<string, unknown>) => {
          if (!result.startRecordingImmediately) return

          chrome.storage.local.remove(["startRecordingImmediately"])

          const micEnabled =
            typeof result[MICROPHONE_ENABLED_STORAGE_KEY] === "boolean"
              ? (result[MICROPHONE_ENABLED_STORAGE_KEY] as boolean)
              : false

          chrome.storage.local.remove([MICROPHONE_ENABLED_STORAGE_KEY])

          if (micEnabled) {
            onReadyToRecord(true)
          } else {
            onStartRecording()
          }
        }
      )
    }
  }, [onCaptureTypeChange, onScreenshotLoaded, onStartRecording, onReadyToRecord, onError])
}
