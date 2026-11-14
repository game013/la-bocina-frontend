/** Captura de micrófono → POST /api/voz/transcribir (ElevenLabs Scribe). */

function pickMimeType(): string | undefined {
  const candidates = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4",
    "audio/ogg;codecs=opus",
  ];
  for (const t of candidates) {
    if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(t)) {
      return t;
    }
  }
  return undefined;
}

/** Graba un clip corto del micrófono (gesto de usuario ya ocurrió). */
export async function grabarClip(ms = 2800): Promise<Blob> {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const mime = pickMimeType();
  const recorder = mime
    ? new MediaRecorder(stream, { mimeType: mime })
    : new MediaRecorder(stream);
  const chunks: BlobPart[] = [];

  return new Promise((resolve, reject) => {
    recorder.ondataavailable = (ev) => {
      if (ev.data.size > 0) chunks.push(ev.data);
    };
    recorder.onerror = () => {
      stream.getTracks().forEach((t) => t.stop());
      reject(new Error("No se pudo grabar audio"));
    };
    recorder.onstop = () => {
      stream.getTracks().forEach((t) => t.stop());
      const type = recorder.mimeType || mime || "audio/webm";
      resolve(new Blob(chunks, { type }));
    };
    recorder.start();
    window.setTimeout(() => {
      if (recorder.state !== "inactive") recorder.stop();
    }, ms);
  });
}

export async function transcribirAudio(blob: Blob): Promise<string> {
  const form = new FormData();
  const ext = blob.type.includes("mp4")
    ? "mp4"
    : blob.type.includes("ogg")
      ? "ogg"
      : blob.type.includes("wav")
        ? "wav"
        : "webm";
  form.append("audio", blob, `clip.${ext}`);

  const res = await fetch("/api/voz/transcribir", {
    method: "POST",
    body: form,
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`STT ${res.status}: ${detail.slice(0, 180)}`);
  }
  const data = (await res.json()) as { texto?: string };
  const texto = (data.texto ?? "").trim();
  if (!texto) throw new Error("STT: texto vacío");
  return texto;
}
