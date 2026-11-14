/**
 * Parser fijo de frases de cobro (SPRINT / DIVISION).
 * Sin LLM: dígitos y números en español (lo que suele devolver el STT).
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

const UNIDADES: Record<string, number> = {
  cero: 0,
  un: 1,
  uno: 1,
  una: 1,
  dos: 2,
  tres: 3,
  cuatro: 4,
  cinco: 5,
  seis: 6,
  siete: 7,
  ocho: 8,
  nueve: 9,
  diez: 10,
  once: 11,
  doce: 12,
  trece: 13,
  catorce: 14,
  quince: 15,
  dieciseis: 16,
  diecisiete: 17,
  dieciocho: 18,
  diecinueve: 19,
  veinte: 20,
  veintiun: 21,
  veintiuno: 21,
  veintidos: 22,
  veintitres: 23,
  veinticuatro: 24,
  veinticinco: 25,
  veintiseis: 26,
  veintisiete: 27,
  veintiocho: 28,
  veintinueve: 29,
};

const DECENAS: Record<string, number> = {
  treinta: 30,
  cuarenta: 40,
  cincuenta: 50,
  sesenta: 60,
  setenta: 70,
  ochenta: 80,
  noventa: 90,
};

const CENTENAS: Record<string, number> = {
  cien: 100,
  ciento: 100,
  doscientos: 200,
  trescientos: 300,
  cuatrocientos: 400,
  quinientos: 500,
  seiscientos: 600,
  setecientos: 700,
  ochocientos: 800,
  novecientos: 900,
};

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

function msgFallo(oido: string): string {
  const corto = oido.length > 60 ? `${oido.slice(0, 57)}…` : oido;
  return corto ? `${MSG_NO}. Oí: «${corto}»` : MSG_NO;
}

/**
 * Consume tokens de número en español desde el inicio.
 * Devuelve valor + cuántos tokens usó, o null.
 */
function consumirNumeroPalabras(tokens: string[]): { valor: number; n: number } | null {
  if (tokens.length === 0) return null;

  let i = 0;
  let total = 0;

  // miles: «mil» | «dos mil» | …
  if (tokens[i] === "mil") {
    total += 1000;
    i += 1;
  } else if (
    i + 1 < tokens.length &&
    tokens[i + 1] === "mil" &&
    (UNIDADES[tokens[i]!] != null || DECENAS[tokens[i]!] != null)
  ) {
    const miles = UNIDADES[tokens[i]!] ?? DECENAS[tokens[i]!];
    if (miles == null || miles < 1) return null;
    total += miles * 1000;
    i += 2;
  }

  if (i < tokens.length && CENTENAS[tokens[i]!] != null) {
    total += CENTENAS[tokens[i]!]!;
    i += 1;
    if (tokens[i - 1] === "cien" && i < tokens.length && tokens[i] !== "con") {
      // «cien» solo si no sigue más número (salvo «con» de centavos)
    }
  }

  if (i < tokens.length && DECENAS[tokens[i]!] != null) {
    total += DECENAS[tokens[i]!]!;
    i += 1;
    if (i < tokens.length && tokens[i] === "y") {
      i += 1;
      if (i < tokens.length && UNIDADES[tokens[i]!] != null && UNIDADES[tokens[i]!]! < 10) {
        total += UNIDADES[tokens[i]!]!;
        i += 1;
      } else {
        return null;
      }
    }
  } else if (i < tokens.length && UNIDADES[tokens[i]!] != null) {
    total += UNIDADES[tokens[i]!]!;
    i += 1;
  }

  if (i === 0) return null;
  return { valor: total, n: i };
}

function parseCentavosToken(tok: string): number | null {
  if (/^\d{1,2}$/.test(tok)) {
    return tok.length === 1 ? Number(tok) * 10 : Number(tok);
  }
  if (UNIDADES[tok] != null) {
    const u = UNIDADES[tok]!;
    if (u < 10) return u * 10;
    if (u < 100) return u;
  }
  if (DECENAS[tok] != null) return DECENAS[tok]!;
  return null;
}

/**
 * Interpreta una transcripción STT → monto en pesos.
 * Acepta dígitos («35 pesos») y palabras («treinta y cinco pesos»).
 * Tolera cola («… por un cafe»).
 */
export function parseFraseCobro(raw: string): ParseCobroResult {
  const oido = raw.trim();
  let texto = normalizar(raw);
  if (!texto) return { ok: false, mensaje: msgFallo(oido) };

  const { resto, telefono } = sacarTelefono(texto);
  texto = quitarVerboCobro(resto);
  if (!texto) return { ok: false, mensaje: msgFallo(oido) };

  // «un centavo» / «1 centavo»
  if (/^(?:un|uno|1)\s+centavos?\b/.test(texto) || /^centavo\b/.test(texto)) {
    return wrap(0.01, telefono, oido);
  }

  // «un peso» / «1 peso»
  if (/^(?:un|uno|1)\s+pesos?\b/.test(texto)) {
    return wrap(1, telefono, oido);
  }

  // «35.50» / «35,50»
  let m = texto.match(/^(\d+)[.,](\d{1,2})\s*(?:pesos?|mxn)?\b/);
  if (m) {
    const enteros = Number(m[1]);
    const frac = m[2]!.padEnd(2, "0").slice(0, 2);
    return wrap(enteros + Number(frac) / 100, telefono, oido);
  }

  // «35 con 50» / «35 pesos con 5»
  m = texto.match(/^(\d+)\s*(?:pesos?|mxn)?\s+con\s+(\d{1,2})\b/);
  if (m) {
    const enteros = Number(m[1]);
    const centsRaw = m[2]!;
    const cents = centsRaw.length === 1 ? Number(centsRaw) * 10 : Number(centsRaw);
    return wrap(enteros + cents / 100, telefono, oido);
  }

  // «35 pesos» / «35»
  m = texto.match(/^(\d+)\s*(?:pesos?|mxn)?\b/);
  if (m) {
    return wrap(Number(m[1]), telefono, oido);
  }

  // Palabras: «treinta y cinco pesos» · «treinta y cinco con cincuenta»
  const tokens = texto.split(" ");
  const entero = consumirNumeroPalabras(tokens);
  if (entero) {
    let j = entero.n;
    let cents = 0;
    if (tokens[j] === "pesos" || tokens[j] === "peso" || tokens[j] === "mxn") {
      j += 1;
    }
    if (tokens[j] === "con" && tokens[j + 1]) {
      const c = parseCentavosToken(tokens[j + 1]!);
      if (c != null) {
        cents = c;
        j += 2;
        if (tokens[j] === "centavos" || tokens[j] === "centavo") j += 1;
      }
    }
    // Debe haber consumido al menos el número; cola («por un cafe») ok.
    if (entero.valor > 0 || cents > 0) {
      return wrap(entero.valor + cents / 100, telefono, oido);
    }
  }

  return { ok: false, mensaje: msgFallo(oido) };
}

function wrap(monto: number, telefono: string | undefined, oido: string): ParseCobroResult {
  if (!pesosValido(monto)) return { ok: false, mensaje: msgFallo(oido) };
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
