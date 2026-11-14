/**
 * Parser fijo de frases de cobro (SPRINT / DIVISION).
 * Sin LLM: solo patrones explícitos.
 */

export type ParseCobroOk = {
  ok: true;
  monto: number;
  /** Solo si la frase trae «al 55…»; el canal push es stretch. */
  telefono?: string;
};

export type ParseCobroFail = {
  ok: false;
  mensaje: string;
};

export type ParseCobroResult = ParseCobroOk | ParseCobroFail;

const MSG_NO = "No entendí el monto";

/** Quita acentos y deja letras, dígitos, punto y espacios. */
function normalizar(raw: string): string {
  return raw
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^a-z0-9.\s]/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Extrae teléfono «al 55 1234 5678» al final (10 dígitos). */
function sacarTelefono(texto: string): { resto: string; telefono?: string } {
  const m = texto.match(/\bal\s+([\d\s]{10,})\s*$/);
  if (!m) return { resto: texto };
  const digits = m[1]!.replace(/\D/g, "");
  if (digits.length !== 10) return { resto: texto };
  return {
    resto: texto.slice(0, m.index).trim(),
    telefono: digits,
  };
}

function quitarVerboCobro(texto: string): string {
  return texto
    .replace(/^(?:cobrale|cobra|cobrar|cobrenle|cobren)\s+/, "")
    .replace(/^le\s+/, "")
    .trim();
}

function pesosValido(n: number): boolean {
  return Number.isFinite(n) && n > 0 && n <= 1_000_000;
}

/**
 * Interpreta una transcripción STT → monto en pesos.
 * Ejemplos: «cóbrale 35 pesos», «35 con 50», «un peso», «un centavo».
 */
export function parseFraseCobro(raw: string): ParseCobroResult {
  let texto = normalizar(raw);
  if (!texto) return { ok: false, mensaje: MSG_NO };

  const { resto, telefono } = sacarTelefono(texto);
  texto = quitarVerboCobro(resto);
  if (!texto) return { ok: false, mensaje: MSG_NO };

  // «un centavo» / «1 centavo»
  if (/^(?:un|1)\s+centavos?$/.test(texto) || texto === "centavo") {
    return wrap(0.01, telefono);
  }

  // «un peso» / «1 peso»
  if (/^(?:un|1)\s+pesos?$/.test(texto)) {
    return wrap(1, telefono);
  }

  // «35.50» / «35,50»
  let m = texto.match(/^(\d+)[.,](\d{1,2})\s*(?:pesos?|mxn)?$/);
  if (m) {
    const enteros = Number(m[1]);
    const frac = m[2]!.padEnd(2, "0").slice(0, 2);
    return wrap(enteros + Number(frac) / 100, telefono);
  }

  // «35 con 50» / «35 con 5» (5 → 50 céntimos si 1 dígito)
  m = texto.match(/^(\d+)\s*(?:pesos?|mxn)?\s+con\s+(\d{1,2})$/);
  if (m) {
    const enteros = Number(m[1]);
    const centsRaw = m[2]!;
    const cents = centsRaw.length === 1 ? Number(centsRaw) * 10 : Number(centsRaw);
    return wrap(enteros + cents / 100, telefono);
  }

  // «35 pesos» / «35»
  m = texto.match(/^(\d+)\s*(?:pesos?|mxn)?$/);
  if (m) {
    return wrap(Number(m[1]), telefono);
  }

  return { ok: false, mensaje: MSG_NO };
}

function wrap(monto: number, telefono?: string): ParseCobroResult {
  if (!pesosValido(monto)) return { ok: false, mensaje: MSG_NO };
  // 2 decimales de moneda
  const redondeado = Math.round(monto * 100) / 100;
  return telefono
    ? { ok: true, monto: redondeado, telefono }
    : { ok: true, monto: redondeado };
}

/** Centavos enteros → dígitos del teclado («35.00» → «3500»). */
export function pesosADigitos(pesos: number): string {
  const cents = Math.round(pesos * 100);
  if (!Number.isFinite(cents) || cents <= 0) return "";
  return String(cents);
}
