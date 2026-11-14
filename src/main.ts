import "./css/caja.css";
import { crearCobro, pollCobro, watchEventos, type StopWatch } from "./ts/api";
import { fixtureCrearCobro, fixturePagado, useFixtures } from "./ts/fixtures";
import {
  applyDetalle,
  getState,
  parseMonto,
  resetIdle,
  setCreando,
  setError,
  setExpirado,
  setPagado,
  setPendiente,
  setSinConexion,
  setTardio,
  subscribe,
} from "./ts/state";
import type { EventoServidor } from "./ts/types";
import { bindRender, mountUI } from "./ts/ui";

const app = document.querySelector<HTMLDivElement>("#app");
if (!app) {
  throw new Error("#app no encontrado");
}

const ui = mountUI(app);
bindRender(ui, subscribe);

let stopPoll: StopWatch | null = null;
let stopSse: StopWatch | null = null;

function clearWatchers(): void {
  stopPoll?.();
  stopPoll = null;
}

function wireCobroWatch(id: string): void {
  clearWatchers();
  stopPoll = pollCobro(id, (detalle) => applyDetalle(detalle));
}

function onServidorEvent(ev: EventoServidor): void {
  const actual = getState().cobro?.id;

  switch (ev.tipo) {
    case "creado": {
      if (getState().vista === "idle" || getState().vista === "creando") {
        const cobro = {
          ...ev.data,
          expiraEn:
            ev.data.expiraEn ?? new Date(Date.now() + 360_000).toISOString(),
        };
        setPendiente(cobro);
        wireCobroWatch(cobro.id);
      }
      break;
    }
    case "pagado": {
      if (actual && actual !== ev.data.id) return;
      setPagado(ev.data);
      clearWatchers();
      break;
    }
    case "expirado": {
      if (actual && actual !== ev.data.id) return;
      setExpirado(ev.data.id);
      clearWatchers();
      break;
    }
    case "tardio": {
      if (actual && actual !== ev.data.id) return;
      setTardio(ev.data);
      clearWatchers();
      break;
    }
    case "error": {
      if (actual && actual !== ev.data.id) return;
      setError(ev.data.mensaje, ev.data.id);
      clearWatchers();
      break;
    }
    case "entregado": {
      if (actual && actual !== ev.data.id) return;
      applyDetalle({
        id: ev.data.id,
        estado: "entregado",
        monto: getState().cobro?.monto ?? 0,
        canal: getState().cobro?.canal ?? "qr",
        entregadoEn: ev.data.entregadoEn,
        qrImage: getState().cobro?.qrImage,
      });
      clearWatchers();
      break;
    }
  }
}

if (!useFixtures()) {
  // SSE + poll: lo que llegue primero gana. Un blip de SSE no pinta verde ni “sin conexión”
  // (el poll sigue; sin_conexion solo si falla crear cobro / red).
  stopSse = watchEventos(onServidorEvent);
}

ui.onCobrar(() => {
  void (async () => {
    const monto = parseMonto(getState().digitos);
    if (monto <= 0) return;

    if (useFixtures()) {
      setCreando();
      window.setTimeout(() => {
        const cobro = fixtureCrearCobro(monto);
        setPendiente(cobro);
      }, 200);
      return;
    }

    setCreando();
    try {
      const cobro = await crearCobro({
        monto,
        concepto: "Venta",
        canal: "qr",
      });
      setPendiente(cobro);
      wireCobroWatch(cobro.id);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (/failed to fetch|network|load failed/i.test(msg)) {
        setSinConexion(`Sin conexión con el servidor`);
      } else {
        setError(msg);
      }
    }
  })();
});

ui.onNuevo(() => {
  clearWatchers();
  resetIdle();
});

ui.onFixturePagado(() => {
  const s = getState();
  if (!s.cobro || s.vista !== "pendiente") return;
  setPagado(fixturePagado(s.cobro.id, s.cobro.monto));
});

window.addEventListener("beforeunload", () => {
  clearWatchers();
  stopSse?.();
});
