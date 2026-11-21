// T-107 (menores de T-103) (001): el LEEME avisa de dos riesgos de las contraseñas de los roles. No es una
// prueba de comportamiento: es la constancia de que el aviso sigue ahí (artículo 4).
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..", "..", "..");
const leeme = readFileSync(join(RAIZ, "supabase", "conector-prueba", "LEEME.md"), "utf8");

describe("T-107: avisos del LEEME sobre las contraseñas de los roles", () => {
  it("avisa del historial de la terminal: la contraseña no se escribe en la línea de órdenes", () => {
    expect(leeme).toMatch(/historial de la terminal/i);
    expect(leeme).toMatch(/CONTRASENA_CONECTOR=/);
    expect(leeme).toMatch(/no la escribas en la línea de órdenes/i);
  });

  it("dice que la salida de pg_stat_statements no se copia a las evidencias", () => {
    expect(leeme).toMatch(/pg_stat_statements/);
    expect(leeme).toMatch(/no (?:la )?copi\w+ (?:a|en) (?:las )?evidencias/i);
  });

  it("explica la adopción de un rol existente (sin elevarlo) y el cierre terminal", () => {
    expect(leeme).toMatch(/no recupera el inicio de sesión/i);
    expect(leeme).toMatch(/`cerrar_prueba`[^\n]*terminal/i);
  });

  it("lista las funciones de autorización y operación", () => {
    for (const f of [
      "leer_cliente",
      "guardar_cliente_cimd",
      "registrar_cliente_dcr",
      "abrir_solicitud",
      "activar",
      "canjear_codigo",
      "renovar",
      "operar_contar_fallo",
      "operar_generar_codigo",
      "operar_revocar_conexion",
      "operar_resumen",
      "operar_exportar_sucesos",
      "cerrar_prueba",
    ]) {
      expect(leeme, f).toContain(`\`${f}`);
    }
  });
});

describe("T-107: resultados por función en el LEEME (menores 1, 3 y 10 del revisor)", () => {
  const tabla = leeme.slice(Math.max(0, leeme.indexOf("## Resultados por función")));

  it("tiene la tabla «Resultados por función» con los resultados añadidos al diseño", () => {
    expect(leeme).toMatch(/^## Resultados por función$/m);
    for (const f of [
      "leer_cliente",
      "guardar_cliente_cimd",
      "registrar_cliente_dcr",
      "abrir_solicitud",
      "activar",
      "canjear_codigo",
      "renovar",
      "registrar_suceso",
      "mcp_obtener_instrucciones",
      "operar_generar_codigo",
      "cerrar_prueba",
    ]) {
      expect(tabla, f).toContain(`| \`${f}`);
    }
    for (const r of ["cerrada", "conocido", "no_valido", "licencia_no_activa", "ya_cerrada"]) {
      expect(tabla, r).toContain(`\`${r}\``);
    }
  });

  it("dice que T-108 y T-110 traducen `cerrada` a un estado fijo y que un resultado desconocido nunca es éxito", () => {
    expect(tabla).toMatch(/T-108\/T-110 deben traducir `cerrada` a un estado fijo/);
    expect(tabla).toMatch(/un resultado desconocido nunca es éxito/);
  });

  it("anota que registrar_suceso sigue escribiendo tras el cierre (observabilidad, sin concesión de acceso)", () => {
    expect(tabla).toMatch(/`registrar_suceso` sigue escribiendo tras el cierre/);
    expect(tabla).toMatch(/sin concesión de acceso/);
  });
});
