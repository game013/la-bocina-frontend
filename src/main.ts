import "./css/caja.css";
import { fixtureCrearCobro, fixturePagado, useFixtures } from "./ts/fixtures";
import {
  getState,
  parseMonto,
  resetIdle,
  setCreando,
  setError,
  setPagado,
  setPendiente,
  subscribe,
} from "./ts/state";
import { bindRender, mountUI } from "./ts/ui";

const app = document.querySelector<HTMLDivElement>("#app");
if (!app) {
  throw new Error("#app no encontrado");
}

const ui = mountUI(app);
bindRender(ui, subscribe);

ui.onCobrar(() => {
  const monto = parseMonto(getState().digitos);
  if (monto <= 0) return;

  if (!useFixtures()) {
    setError("API aún no cableada. Abre con ?fixture=1 para demo local.");
    return;
  }

  setCreando();
  window.setTimeout(() => {
    const cobro = fixtureCrearCobro(monto);
    setPendiente(cobro);
  }, 200);
});

ui.onNuevo(() => {
  resetIdle();
});

ui.onFixturePagado(() => {
  const s = getState();
  if (!s.cobro || s.vista !== "pendiente") return;
  setPagado(fixturePagado(s.cobro.id, s.cobro.monto));
});
