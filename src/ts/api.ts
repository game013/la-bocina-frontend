import type {
  CobroCreado,
  CobroDetalle,
  CrearCobroBody,
  EventoServidor,
} from "./types";

/**
 * Base del API de cobros (Rafael).
 * En `npm run dev` usamos same-origin → Vite proxifica (Rafael aún sin CORS).
 * En build, `VITE_API_BASE` apunta al tunnel/host.
 */
export function apiBase(): string {
  const raw = String(import.meta.env.VITE_API_BASE ?? "").replace(/\/$/, "");
  if (import.meta.env.DEV) return "";
  return raw;
}

function url(path: string): string {
  const base = apiBase();
  return `${base}${path}`;
}

async function readError(res: Response): Promise<string> {
  try {
    const body = (await res.json()) as { detail?: unknown; mensaje?: string };
    if (typeof body.mensaje === "string") return body.mensaje;
    if (typeof body.detail === "string") return body.detail;
    if (Array.isArray(body.detail)) {
      return body.detail
        .map((d) => (typeof d === "object" && d && "msg" in d ? String((d as { msg: string }).msg) : JSON.stringify(d)))
        .join("; ");
    }
    return JSON.stringify(body);
  } catch {
    return res.statusText || `HTTP ${res.status}`;
  }
}

export async function crearCobro(body: CrearCobroBody): Promise<CobroCreado> {
  const res = await fetch(url("/api/cobros"), {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(await readError(res));
  }
  const data = (await res.json()) as CobroCreado;
  if (!data.expiraEn) {
    data.expiraEn = new Date(Date.now() + 360_000).toISOString();
  }
  return data;
}

export async function getCobro(id: string): Promise<CobroDetalle> {
  const res = await fetch(url(`/api/cobros/${encodeURIComponent(id)}`), {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) {
    throw new Error(await readError(res));
  }
  return (await res.json()) as CobroDetalle;
}

export type StopWatch = () => void;

/**
 * Escucha `GET /api/eventos` (SSE). Reconecta con backoff suave.
 * El navegador entrega `event.type` = nombre SSE (`pagado`, `creado`, …).
 */
export function watchEventos(
  onEvent: (ev: EventoServidor) => void,
  onStatus?: (ok: boolean, detail?: string) => void,
): StopWatch {
  let stopped = false;
  let es: EventSource | null = null;
  let retryMs = 1000;
  let timer: number | null = null;

  const known = new Set([
    "creado",
    "pagado",
    "expirado",
    "tardio",
    "error",
    "entregado",
  ]);

  function handleMessage(tipo: string, raw: string): void {
    let data: unknown = {};
    if (raw) {
      try {
        data = JSON.parse(raw);
      } catch {
        data = { raw };
      }
    }
    if (!known.has(tipo)) {
      // Algunos servers mandan todo en `message` con {tipo|event|type}
      if (tipo === "message" && data && typeof data === "object") {
        const obj = data as Record<string, unknown>;
        const t = String(obj.tipo ?? obj.event ?? obj.type ?? "");
        if (known.has(t)) {
          handleMessage(t, JSON.stringify(obj.data ?? obj));
        }
      }
      return;
    }
    onEvent({ tipo, data } as EventoServidor);
  }

  function connect(): void {
    if (stopped) return;
    es = new EventSource(url("/api/eventos"));

    es.onopen = () => {
      retryMs = 1000;
      onStatus?.(true);
    };

    es.onerror = () => {
      onStatus?.(false, "SSE interrumpido");
      es?.close();
      es = null;
      if (stopped) return;
      timer = window.setTimeout(() => {
        retryMs = Math.min(retryMs * 1.5, 8000);
        connect();
      }, retryMs);
    };

    for (const name of known) {
      es.addEventListener(name, (e) => {
        handleMessage(name, (e as MessageEvent).data ?? "");
      });
    }
    es.onmessage = (e) => handleMessage("message", e.data ?? "");
  }

  connect();

  return () => {
    stopped = true;
    if (timer != null) window.clearTimeout(timer);
    es?.close();
    es = null;
  };
}

/** Poll `GET /api/cobros/:id` cada `intervalMs` mientras haya cobro pendiente. */
export function pollCobro(
  id: string,
  onDetalle: (d: CobroDetalle) => void,
  onFail?: (err: Error) => void,
  intervalMs = 2000,
): StopWatch {
  let stopped = false;
  let timer: number | null = null;

  async function tick(): Promise<void> {
    if (stopped) return;
    try {
      const d = await getCobro(id);
      onDetalle(d);
      if (d.estado !== "pendiente") {
        stop();
        return;
      }
    } catch (err) {
      onFail?.(err instanceof Error ? err : new Error(String(err)));
    }
    if (!stopped) {
      timer = window.setTimeout(() => {
        void tick();
      }, intervalMs);
    }
  }

  function stop(): void {
    stopped = true;
    if (timer != null) window.clearTimeout(timer);
    timer = null;
  }

  void tick();
  return stop;
}
