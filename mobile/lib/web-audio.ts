/**
 * Web Audio Recording using MediaRecorder API.
 * Fallback for expo-av Audio.Recording which doesn't work on web.
 */

interface WebRecording {
  mediaRecorder: MediaRecorder;
  chunks: Blob[];
  stream: MediaStream;
}

let activeRecording: WebRecording | null = null;

export async function startWebRecording(): Promise<void> {
  if (activeRecording) return;

  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const mediaRecorder = new MediaRecorder(stream, {
    mimeType: MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
      ? "audio/webm;codecs=opus"
      : "audio/webm",
  });

  const chunks: Blob[] = [];
  mediaRecorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data);
  };

  mediaRecorder.start();
  activeRecording = { mediaRecorder, chunks, stream };
}

export async function stopWebRecording(): Promise<{
  base64: string;
  mimeType: string;
} | null> {
  if (!activeRecording) return null;

  const { mediaRecorder, chunks, stream } = activeRecording;

  return new Promise((resolve) => {
    mediaRecorder.onstop = () => {
      stream.getTracks().forEach((t) => t.stop());
      const blob = new Blob(chunks, { type: mediaRecorder.mimeType });

      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        // Strip "data:audio/webm;base64," prefix
        const base64 = dataUrl.split(",")[1] || "";
        activeRecording = null;
        resolve({ base64, mimeType: mediaRecorder.mimeType });
      };
      reader.readAsDataURL(blob);
    };

    mediaRecorder.stop();
  });
}

export function isWebRecording(): boolean {
  return activeRecording !== null && activeRecording.mediaRecorder.state === "recording";
}

export async function requestWebMicPermission(): Promise<boolean> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach((t) => t.stop());
    return true;
  } catch {
    return false;
  }
}
