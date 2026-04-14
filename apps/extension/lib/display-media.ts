interface TabCaptureConstraints extends MediaTrackConstraints {
  mandatory?: {
    chromeMediaSource: "tab"
    chromeMediaSourceId: string
  }
}

export interface TabCaptureStreamResult {
  stream: MediaStream
  cleanup: () => void
}

export const requestTabCaptureStream = async (
  tabId: number
): Promise<MediaStream> => {
  const streamId = await chrome.tabCapture.getMediaStreamId({
    targetTabId: tabId,
  })

  const stream = await navigator.mediaDevices.getUserMedia({
    audio: false,
    video: {
      mandatory: {
        chromeMediaSource: "tab",
        chromeMediaSourceId: streamId,
      },
    } as TabCaptureConstraints,
  })

  return stream
}

export const requestTabCaptureStreamWithMic = async (
  tabId: number,
  microphoneEnabled: boolean
): Promise<TabCaptureStreamResult> => {
  const tabStream = await requestTabCaptureStream(tabId)

  if (!microphoneEnabled) {
    return { stream: tabStream, cleanup: () => undefined }
  }

  let micStream: MediaStream | null = null
  let audioCtx: AudioContext | null = null

  try {
    micStream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: false,
    })

    audioCtx = new AudioContext()
    const destination = audioCtx.createMediaStreamDestination()
    const micSource = audioCtx.createMediaStreamSource(micStream)
    micSource.connect(destination)

    const videoTrack = tabStream.getVideoTracks()[0]
    const mixedStream = new MediaStream([
      videoTrack,
      ...destination.stream.getAudioTracks(),
    ])

    const cleanup = () => {
      for (const track of micStream?.getTracks() ?? []) {
        track.stop()
      }
      audioCtx?.close().catch(() => undefined)
    }

    return { stream: mixedStream, cleanup }
  } catch {
    // Graceful fallback: mic unavailable, record screen only
    for (const track of micStream?.getTracks() ?? []) {
      track.stop()
    }
    audioCtx?.close().catch(() => undefined)
    return { stream: tabStream, cleanup: () => undefined }
  }
}
