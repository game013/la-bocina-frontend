import {
  appendDigito,
  formatMonto,
  getState,
  parseMonto,
  type CajaState,
} from "./state";

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "C", "0", "⌫"] as const;

export interface CajaUI {
  render: (s: CajaState) => void;
  onCobrar: (handler: () => void) => void;
  onNuevo: (handler: () => void) => void;
  onFixturePagado: (handler: () => void) => void;
  onProbarTts: (handler: () => void) => void;
  onProbarStt: (handler: () => void) => void;
  setVozMsg: (texto: string) => void;
}

function qrSrc(base64?: string): string | null {
  if (!base64) return null;
  if (base64.startsWith("data:")) return base64;
  return `data:image/png;base64,${base64}`;
}

function segundosRestantes(expiraEn?: string): number | null {
  if (!expiraEn) return null;
  const t = Date.parse(expiraEn);
  if (!Number.isFinite(t)) return null;
  return Math.max(0, Math.ceil((t - Date.now()) / 1000));
}

function etiquetaVista(vista: CajaState["vista"]): string {
  switch (vista) {
    case "idle":
      return "Listo";
    case "creando":
      return "Creando…";
    case "pendiente":
      return "Esperando pago";
    case "pagado":
      return "PAGADO";
    case "entregado":
      return "Entregado";
    case "expirado":
      return "Vencido";
    case "tardio":
      return "Tardío";
    case "error":
      return "Error";
    case "sin_conexion":
      return "Sin conexión";
    default:
      return "";
  }
}

function formatHora(iso: string): string {
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return iso;
  return d.toLocaleTimeString("es-MX", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function escapeHtml(s: string): string {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function mountUI(root: HTMLElement): CajaUI {
  root.innerHTML = `
    <header class="caja-brand">
      <p class="caja-eyebrow">CoDi · cajero</p>
      <h1 class="caja-title">La Bocina</h1>
    </header>

    <section class="caja-stage" aria-live="polite">
      <p class="caja-status" data-el="status"></p>
      <p class="caja-monto" data-el="monto">$0.00</p>
      <p class="caja-msg" data-el="msg" hidden></p>
      <div class="caja-qr-wrap" data-el="qr-wrap" hidden>
        <img class="caja-qr" data-el="qr" alt="Código QR CoDi" />
        <p class="caja-timer" data-el="timer"></p>
      </div>
      <dl class="caja-meta" data-el="meta" hidden></dl>
    </section>

    <section class="caja-pad" aria-label="Teclado numérico">
      <div class="caja-keys" data-el="keys"></div>
      <div class="caja-actions">
        <button type="button" class="caja-btn caja-btn-primary" data-el="cobrar">Cobrar</button>
        <button type="button" class="caja-btn caja-btn-ghost" data-el="nuevo" hidden>Nuevo cobro</button>
        <button type="button" class="caja-btn caja-btn-fixture" data-el="fx-pagado" hidden>Simular pagado</button>
      </div>
      <div class="caja-voz-lab" data-el="voz-lab" hidden>
        <p class="caja-voz-hint">Prueba voz (sin cobro)</p>
        <div class="caja-voz-actions">
          <button type="button" class="caja-btn caja-btn-voz" data-el="probar-tts">Probar TTS</button>
          <button type="button" class="caja-btn caja-btn-voz" data-el="probar-stt">Mic · STT (~3s)</button>
        </div>
        <p class="caja-voz-msg" data-el="voz-msg" hidden></p>
      </div>
    </section>
  `;

  const keysEl = root.querySelector<HTMLElement>("[data-el=keys]")!;
  for (const k of KEYS) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "caja-key";
    b.dataset.key = k;
    b.textContent = k;
    b.addEventListener("click", () => appendDigito(k));
    keysEl.appendChild(b);
  }

  const cobrarBtn = root.querySelector<HTMLButtonElement>("[data-el=cobrar]")!;
  const nuevoBtn = root.querySelector<HTMLButtonElement>("[data-el=nuevo]")!;
  const fxBtn = root.querySelector<HTMLButtonElement>("[data-el=fx-pagado]")!;
  const vozLab = root.querySelector<HTMLElement>("[data-el=voz-lab]")!;
  const ttsBtn = root.querySelector<HTMLButtonElement>("[data-el=probar-tts]")!;
  const sttBtn = root.querySelector<HTMLButtonElement>("[data-el=probar-stt]")!;
  const vozMsg = root.querySelector<HTMLElement>("[data-el=voz-msg]")!;

  let cobrarHandler: (() => void) | null = null;
  let nuevoHandler: (() => void) | null = null;
  let fxHandler: (() => void) | null = null;
  let ttsHandler: (() => void) | null = null;
  let sttHandler: (() => void) | null = null;

  cobrarBtn.addEventListener("click", () => cobrarHandler?.());
  nuevoBtn.addEventListener("click", () => nuevoHandler?.());
  fxBtn.addEventListener("click", () => fxHandler?.());
  ttsBtn.addEventListener("click", () => ttsHandler?.());
  sttBtn.addEventListener("click", () => sttHandler?.());

  const qs = new URLSearchParams(window.location.search);
  const showFixtureControls = qs.get("fixture") === "1";
  const showVozLab = qs.get("voz") === "1" || showFixtureControls;
  vozLab.hidden = !showVozLab;

  function render(s: CajaState): void {
    root.dataset.vista = s.vista;

    const status = root.querySelector<HTMLElement>("[data-el=status]")!;
    const montoEl = root.querySelector<HTMLElement>("[data-el=monto]")!;
    const msg = root.querySelector<HTMLElement>("[data-el=msg]")!;
    const qrWrap = root.querySelector<HTMLElement>("[data-el=qr-wrap]")!;
    const qr = root.querySelector<HTMLImageElement>("[data-el=qr]")!;
    const timer = root.querySelector<HTMLElement>("[data-el=timer]")!;
    const meta = root.querySelector<HTMLElement>("[data-el=meta]")!;

    status.textContent = etiquetaVista(s.vista);

    const montoVista =
      s.vista === "pagado" || s.vista === "tardio" || s.vista === "entregado"
        ? (s.cobro?.montoPagado ?? s.cobro?.monto ?? parseMonto(s.digitos))
        : (s.cobro?.monto ?? parseMonto(s.digitos));

    montoEl.textContent = formatMonto(montoVista);

    if (s.mensaje) {
      msg.hidden = false;
      msg.textContent = s.mensaje;
    } else {
      msg.hidden = true;
      msg.textContent = "";
    }

    const src = qrSrc(s.cobro?.qrImage);
    const showQr = Boolean(src) && s.vista === "pendiente";
    qrWrap.hidden = !showQr;
    if (src && showQr) {
      qr.src = src;
    } else {
      qr.removeAttribute("src");
    }

    const secs = segundosRestantes(s.cobro?.expiraEn);
    if (s.vista === "pendiente" && secs != null) {
      timer.textContent = `${secs}s`;
      timer.hidden = false;
    } else {
      timer.hidden = true;
      timer.textContent = "";
    }

    if (s.vista === "pagado" || s.vista === "tardio" || s.vista === "entregado") {
      meta.hidden = false;
      const hora = s.cobro?.pagadoEn ?? s.cobro?.entregadoEn ?? "";
      const term = s.cobro?.rastreoTerminacion ?? "";
      meta.innerHTML = `
        ${hora ? `<div><dt>Hora</dt><dd>${escapeHtml(formatHora(hora))}</dd></div>` : ""}
        ${term ? `<div><dt>Rastreo</dt><dd>…${escapeHtml(term)}</dd></div>` : ""}
      `;
    } else {
      meta.hidden = true;
      meta.innerHTML = "";
    }

    const canType =
      s.vista === "idle" ||
      s.vista === "error" ||
      s.vista === "expirado" ||
      s.vista === "sin_conexion";
    keysEl.querySelectorAll<HTMLButtonElement>(".caja-key").forEach((b) => {
      b.disabled = !canType;
    });

    const montoOk = parseMonto(s.digitos) > 0;
    cobrarBtn.hidden = !(
      s.vista === "idle" ||
      s.vista === "error" ||
      s.vista === "expirado" ||
      s.vista === "sin_conexion"
    );
    cobrarBtn.disabled = !montoOk || s.vista === "creando";
    nuevoBtn.hidden = !(
      s.vista === "pagado" ||
      s.vista === "entregado" ||
      s.vista === "tardio" ||
      s.vista === "sin_conexion" ||
      s.vista === "error"
    );
    fxBtn.hidden = !(showFixtureControls && s.vista === "pendiente");
    ttsBtn.disabled = s.vista === "creando";
    sttBtn.disabled = s.vista === "creando";
  }

  function setVozMsg(texto: string): void {
    if (!texto) {
      vozMsg.hidden = true;
      vozMsg.textContent = "";
      return;
    }
    vozMsg.hidden = false;
    vozMsg.textContent = texto;
  }

  render(getState());

  return {
    render,
    onCobrar(handler) {
      cobrarHandler = handler;
    },
    onNuevo(handler) {
      nuevoHandler = handler;
    },
    onFixturePagado(handler) {
      fxHandler = handler;
    },
    onProbarTts(handler) {
      ttsHandler = handler;
    },
    onProbarStt(handler) {
      sttHandler = handler;
    },
    setVozMsg,
  };
}

export function bindRender(
  ui: CajaUI,
  subscribe: (fn: (s: CajaState) => void) => () => void,
): void {
  subscribe(ui.render);
  window.setInterval(() => {
    const s = getState();
    if (s.vista === "pendiente") ui.render(s);
  }, 1000);
}
