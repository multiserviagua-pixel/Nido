// Normalización de SQL compartida por las comprobaciones estáticas de supabase/ (L 10 a L 14).

interface Limpieza {
  texto: string;
  /** Falso si queda un literal o un comentario sin cerrar. */
  cerrado: boolean;
}

function limpiar(sql: string): Limpieza {
  let salida = "";
  let cerrado = true;
  let i = 0;
  while (i < sql.length) {
    const c = sql[i];
    const d = sql[i + 1];
    if (c === "-" && d === "-") {
      while (i < sql.length && sql[i] !== "\n") i++;
    } else if (c === "/" && d === "*") {
      // Los comentarios de bloque de PostgreSQL se anidan.
      let nivel = 1;
      i += 2;
      while (i < sql.length && nivel > 0) {
        if (sql[i] === "/" && sql[i + 1] === "*") {
          nivel++;
          i += 2;
        } else if (sql[i] === "*" && sql[i + 1] === "/") {
          nivel--;
          i += 2;
        } else i++;
      }
      if (nivel > 0) cerrado = false;
      salida += " ";
    } else if (c === "'") {
      // E'…' admite \' como escape.
      const conEscapes = /^[eE]$/.test(sql[i - 1] ?? "") && !/\w/.test(sql[i - 2] ?? "");
      let j = i + 1;
      let fin = false;
      while (j < sql.length) {
        if (conEscapes && sql[j] === "\\") j += 2;
        else if (sql[j] === "'" && sql[j + 1] === "'") j += 2;
        else if (sql[j] === "'") {
          fin = true;
          break;
        } else j++;
      }
      if (!fin) cerrado = false;
      salida += sql.slice(i, j + 1);
      i = j + 1;
    } else if (c === "$" && !/[\w$]/.test(sql[i - 1] ?? "")) {
      const m = /^\$([A-Za-z_][A-Za-z0-9_]*)?\$/.exec(sql.slice(i, i + 80));
      const fin = m === null ? -1 : sql.indexOf(m[0], i + m[0].length);
      if (m === null || fin === -1) {
        salida += c;
        i++;
      } else {
        // El cuerpo es código (do, funciones) o texto. Si se lee como código sin
        // dejar nada abierto, se conserva limpio; si no, es texto opaco y se vacía.
        const cuerpo = limpiar(sql.slice(i + m[0].length, fin));
        salida += m[0] + (cuerpo.cerrado ? cuerpo.texto : " ") + m[0];
        i = fin + m[0].length;
      }
    } else {
      salida += c;
      i++;
    }
  }
  return { texto: salida, cerrado };
}

/**
 * Quita comentarios de línea y de bloque (anidados), respetando los literales
 * entre comillas simples (con E'…') y entre comillas de dólar con o sin
 * etiqueta: un «--» dentro de `$e$ … $e$` no es un comentario.
 */
export function sinComentarios(sql: string): string {
  return limpiar(sql).texto;
}

/** Texto normalizado: sin comentarios, espacios colapsados y en minúsculas. */
export function normalizar(sql: string): string {
  return sinComentarios(sql).replace(/\s+/g, " ").trim().toLowerCase();
}

/**
 * Vuelta 6: el SQL de migraciones y reversiones es estático y no necesita
 * `E'…'` (escapes con barra), `U&'…'` ni `U&"…"` (escapes Unicode, que ocultan
 * nombres a las comprobaciones textuales). Devuelve un aviso por cada aparición
 * (un literal `'e'` suelto no cuenta: va tras otra comilla).
 */
export function escapesProhibidos(sql: string): string[] {
  const texto = sinComentarios(sql);
  return [...texto.matchAll(/(?<![A-Za-z0-9_$'])(?:e\s*'|u&\s*['"])/gi)].map((m) =>
    texto.slice(m.index, m.index + 40),
  );
}
