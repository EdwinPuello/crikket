import { Button } from "@crikket/ui/components/ui/button"
import { Camera, Mic, MicOff, Video } from "lucide-react"
import { ShortcutKbd } from "@/components/shortcut-kbd"
import type { PopupCaptureType } from "@/hooks/use-popup-capture"
import { formatDuration } from "@/lib/utils"

interface PopupCaptureActionsProps {
  isBusy: boolean
  isRecordingInProgress: boolean
  recordingCountdown: number | null
  recordingDurationMs: number
  pendingCaptureType: PopupCaptureType | null
  startRecordingShortcut: string | null
  startScreenshotShortcut: string | null
  stopRecordingShortcut: string | null
  microphoneEnabled: boolean
  onMicrophoneToggle: () => void
  onRequestCapture: (captureType: PopupCaptureType) => void
  onStopFromPopup: () => Promise<void>
  onStartCapture: (captureType: PopupCaptureType) => Promise<void>
  onClearPendingCapture: () => void
}

export function PopupCaptureActions({
  isBusy,
  isRecordingInProgress,
  recordingCountdown,
  recordingDurationMs,
  pendingCaptureType,
  startRecordingShortcut,
  startScreenshotShortcut,
  stopRecordingShortcut,
  microphoneEnabled,
  onMicrophoneToggle,
  onRequestCapture,
  onStopFromPopup,
  onStartCapture,
  onClearPendingCapture,
}: PopupCaptureActionsProps) {
  if (recordingCountdown) {
    return (
      <div className="rounded-md border bg-primary/5 p-3 text-center">
        <p className="font-medium text-sm">La grabación comienza en</p>
        <p className="font-bold text-2xl">{recordingCountdown}...</p>
      </div>
    )
  }

  return (
    <>
      {isRecordingInProgress ? (
        <div className="space-y-2">
          <div className="rounded-md border bg-destructive/5 p-3 text-center">
            <p className="font-medium text-destructive text-sm">
              Grabando ahora
            </p>
            <p className="font-mono font-semibold text-destructive text-xl">
              {formatDuration(recordingDurationMs)}
            </p>
          </div>
          <Button
            className="w-full justify-start gap-3"
            disabled={isBusy}
            onClick={() => onStopFromPopup()}
            size="lg"
            variant="destructive"
          >
            <Video className="h-5 w-5" />
            <span>Detener grabación</span>
            <ShortcutKbd
              className="bg-destructive-foreground/15 text-destructive-foreground"
              shortcut={stopRecordingShortcut}
            />
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          <Button
            className="w-full justify-start gap-3"
            disabled={isBusy}
            onClick={() => onRequestCapture("video")}
            size="lg"
            variant="default"
          >
            <Video className="h-5 w-5" />
            <span>Grabar pantalla</span>
            <ShortcutKbd
              className="bg-primary-foreground/15 text-primary-foreground"
              shortcut={startRecordingShortcut}
            />
          </Button>

          <Button
            className="w-full justify-start gap-3"
            disabled={isBusy}
            onClick={() => onRequestCapture("screenshot")}
            size="lg"
            variant="outline"
          >
            <Camera className="h-5 w-5" />
            <span>Tomar captura</span>
            <ShortcutKbd
              className="bg-muted text-foreground"
              shortcut={startScreenshotShortcut}
            />
          </Button>

          <button
            className="flex w-full cursor-pointer items-center gap-2 rounded-md border bg-muted/40 px-3 py-2 text-left text-sm transition-colors hover:bg-muted/70 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={isBusy}
            onClick={onMicrophoneToggle}
            type="button"
          >
            {microphoneEnabled ? (
              <Mic className="h-4 w-4 shrink-0 text-primary" />
            ) : (
              <MicOff className="h-4 w-4 shrink-0 text-muted-foreground" />
            )}
            <span
              className={
                microphoneEnabled ? "text-foreground" : "text-muted-foreground"
              }
            >
              {microphoneEnabled
                ? "Micrófono activado"
                : "Micrófono desactivado"}
            </span>
            <span className="ml-auto">
              <span
                className={`inline-block h-4 w-8 rounded-full transition-colors ${microphoneEnabled ? "bg-primary" : "bg-muted-foreground/30"}`}
              />
            </span>
          </button>
        </div>
      )}

      {pendingCaptureType ? (
        <div className="space-y-2 rounded-md border border-primary/20 bg-primary/5 p-3">
          <p className="text-sm">
            ¿Permitir a Crikket capturar tu pestaña actual para{" "}
            {pendingCaptureType === "video"
              ? "grabación"
              : "captura de pantalla"}
            ?
          </p>
          <div className="flex gap-2">
            <Button
              className="flex-1"
              disabled={isBusy}
              onClick={() => onStartCapture(pendingCaptureType)}
              size="sm"
            >
              Continuar
            </Button>
            <Button
              className="flex-1"
              disabled={isBusy}
              onClick={onClearPendingCapture}
              size="sm"
              variant="outline"
            >
              Cancelar
            </Button>
          </div>
        </div>
      ) : null}
    </>
  )
}
