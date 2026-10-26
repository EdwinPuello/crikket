import { reportNonFatalError } from "@crikket/shared/lib/errors"
import { InteractiveImageViewer } from "@crikket/ui/components/interactive-image-viewer"
import { Button } from "@crikket/ui/components/ui/button"
import { FileText } from "lucide-react"
import {
  forwardRef,
  type SyntheticEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react"
import type { SharedBugReport } from "./types"

interface BugReportCanvasProps {
  data: SharedBugReport
  onTimeUpdate?: (currentTimeMs: number) => void
  compact?: boolean
}

function getMetadataDurationMs(metadata: unknown): number | null {
  if (!metadata || typeof metadata !== "object") {
    return null
  }

  const durationMs = (metadata as { durationMs?: unknown }).durationMs
  if (typeof durationMs !== "number" || !Number.isFinite(durationMs)) {
    return null
  }

  return Math.max(0, Math.floor(durationMs))
}

const PLAYBACK_SPEEDS = [1, 1.25, 1.5, 2] as const

function applyPlaybackSpeed(player: HTMLVideoElement, speed: number) {
  // defaultPlaybackRate keeps the speed when the media reloads
  player.defaultPlaybackRate = speed
  player.playbackRate = speed
}

export const BugReportCanvas = forwardRef<
  HTMLVideoElement,
  BugReportCanvasProps
>(({ data, onTimeUpdate, compact = false }, ref) => {
  const showVideo =
    data.attachmentType === "video" && Boolean(data.attachmentUrl)
  const showImage =
    data.attachmentType === "screenshot" && Boolean(data.attachmentUrl)
  const metadataDurationMs = getMetadataDurationMs(data.metadata)
  const isPrimingDurationRef = useRef(false)
  const playerRef = useRef<HTMLVideoElement | null>(null)
  const [playbackSpeed, setPlaybackSpeed] = useState(1)

  const setPlayerRef = useCallback(
    (player: HTMLVideoElement | null) => {
      playerRef.current = player
      if (typeof ref === "function") {
        ref(player)
      } else if (ref) {
        ref.current = player
      }
    },
    [ref]
  )

  useEffect(() => {
    if (playerRef.current) {
      applyPlaybackSpeed(playerRef.current, playbackSpeed)
    }
  }, [playbackSpeed])

  const handleLoadedMetadata = useCallback(
    (event: SyntheticEvent<HTMLVideoElement>) => {
      const player = event.currentTarget
      applyPlaybackSpeed(player, playbackSpeed)
      if (isPrimingDurationRef.current) {
        return
      }

      if (!(typeof metadataDurationMs === "number" && metadataDurationMs > 0)) {
        return
      }

      if (Number.isFinite(player.duration) && player.duration > 0) {
        return
      }

      const durationSeconds = metadataDurationMs / 1000
      const safeSeekTargetSeconds = Math.max(0, durationSeconds - 0.001)
      if (safeSeekTargetSeconds <= 0) {
        return
      }

      isPrimingDurationRef.current = true
      const originalTime = player.currentTime
      const wasPaused = player.paused

      const restorePosition = () => {
        const maxDurationSeconds =
          Number.isFinite(player.duration) && player.duration > 0
            ? player.duration
            : durationSeconds
        player.currentTime = Math.min(originalTime, maxDurationSeconds)
        isPrimingDurationRef.current = false

        if (wasPaused) {
          return
        }

        player.play().catch((error: unknown) => {
          reportNonFatalError(
            "Failed to restore playback state after metadata-duration sync",
            error
          )
        })
      }

      player.addEventListener(
        "seeked",
        () => {
          restorePosition()
        },
        { once: true }
      )

      try {
        player.currentTime = safeSeekTargetSeconds
      } catch {
        isPrimingDurationRef.current = false
      }
    },
    [metadataDurationMs, playbackSpeed]
  )

  return (
    <div
      className={
        compact
          ? "relative flex items-center justify-center overflow-hidden bg-muted/20 p-0"
          : "relative flex flex-1 items-center justify-center overflow-hidden bg-muted/20 p-4 md:p-8"
      }
    >
      <div
        className={
          compact
            ? "relative flex w-full items-center justify-center"
            : "relative flex h-full w-full max-w-7xl items-center justify-center"
        }
      >
        {showVideo ? (
          <div
            className={
              compact
                ? "flex w-full flex-col"
                : "flex h-full w-full flex-col items-center justify-center gap-2"
            }
          >
            {/* biome-ignore lint/a11y/useMediaCaption: uploaded bug recordings do not have caption tracks yet */}
            <video
              className={
                compact
                  ? "h-auto w-full bg-black object-contain outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  : "min-h-0 max-w-full rounded-lg bg-black object-contain shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              }
              controls
              onLoadedMetadata={handleLoadedMetadata}
              onRateChange={(event) => {
                // Keep the selector in sync when the speed is changed from the native controls
                setPlaybackSpeed(event.currentTarget.playbackRate)
              }}
              onTimeUpdate={(event) => {
                if (isPrimingDurationRef.current) {
                  return
                }
                onTimeUpdate?.(event.currentTarget.currentTime * 1000)
              }}
              preload="metadata"
              ref={setPlayerRef}
              src={data.attachmentUrl ?? undefined}
            />
            <fieldset
              aria-label="Playback speed"
              className={
                compact
                  ? "flex shrink-0 items-center justify-end gap-1 px-2 py-1.5"
                  : "flex shrink-0 items-center gap-1"
              }
            >
              {PLAYBACK_SPEEDS.map((speed) => (
                <Button
                  aria-pressed={playbackSpeed === speed}
                  key={speed}
                  onClick={() => setPlaybackSpeed(speed)}
                  size="xs"
                  type="button"
                  variant={playbackSpeed === speed ? "secondary" : "ghost"}
                >
                  {speed}x
                </Button>
              ))}
            </fieldset>
          </div>
        ) : showImage ? (
          <InteractiveImageViewer
            alt={data.title ?? "Bug report attachment"}
            compact={compact}
            src={data.attachmentUrl ?? ""}
          />
        ) : (
          <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed bg-background/50 p-8 text-muted-foreground">
            <FileText className="h-8 w-8 opacity-50" />
            <p className="text-sm">No visual attachment available</p>
          </div>
        )}
      </div>
    </div>
  )
})

BugReportCanvas.displayName = "BugReportCanvas"
