interface MicReadyStepProps {
  onStart: () => void
}

export function MicReadyStep({ onStart }: MicReadyStepProps) {
  return (
    <div className="flex flex-col items-center space-y-4 py-8">
      <p className="text-center text-muted-foreground text-sm">
        Haz clic en el botón de abajo para conceder acceso al micrófono e
        iniciar la grabación.
      </p>
      <button
        className="flex items-center gap-2 rounded-md bg-primary px-6 py-3 font-semibold text-primary-foreground text-sm transition-opacity hover:opacity-90"
        onClick={onStart}
        type="button"
      >
        🎙️ Iniciar grabación con micrófono
      </button>
    </div>
  )
}
