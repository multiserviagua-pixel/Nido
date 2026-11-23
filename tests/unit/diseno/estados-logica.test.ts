// T-016 (c) · lógica de `EstadoVacio`, `EstadoError`, `EstadoSinPermiso` y `Esqueleto` (diseño 020,
// «Estados de cada vista»; REQ-022, REQ-023, REQ-026, REQ-027, REQ-057, REQ-069, REQ-077). Sin
// navegador ni jsdom: lo que se lee de lo que llega (motivo, forma, acción, ruta del Resumen) cierra
// en fallo y nunca deja pasar un texto libre. Escrita antes que el código (en rojo, sin módulo).
import { describe, expect, it } from "vitest";
import {
  FORMAS_DE_ESQUELETO,
  MOTIVOS_DE_ERROR,
  encabezadoDeError,
  leerAccionDeEstado,
  leerFormaDeEsqueleto,
  leerMotivoDeError,
  leerRutaDelResumen,
  leerTextoFijoOr,
} from "../../../src/components/estados/logica";
import { TEXTOS } from "../../../src/components/textos";

describe("motivo de error: lista cerrada", () => {
  it("son los seis del diseño, y salen de los textos fijos", () => {
    expect([...MOTIVOS_DE_ERROR].sort()).toEqual(Object.keys(TEXTOS.motivosDeError).sort());
    expect([...MOTIVOS_DE_ERROR].sort()).toEqual([
      "desconocido",
      "fallo_servidor",
      "respuesta_no_valida",
      "sesion_no_valida",
      "sin_conexion",
      "tarda_demasiado",
    ]);
  });

  it.each([...Object.keys(TEXTOS.motivosDeError)])("%s se lee tal cual", (motivo) => {
    expect(leerMotivoDeError(motivo)).toBe(motivo);
  });

  it.each([
    ["una cadena libre", "relation clientes does not exist"],
    ["otra mayúscula", "SIN_CONEXION"],
    ["con espacios", " sin_conexion "],
    ["__proto__", "__proto__"],
    ["constructor", "constructor"],
    ["toString", "toString"],
    ["vacía", ""],
    ["un número", 500],
    ["null", null],
    ["undefined", undefined],
    ["un objeto", { motivo: "sin_conexion" }],
    ["una lista", ["sin_conexion"]],
  ])("%s cae en «desconocido»", (_nombre, valor) => {
    expect(leerMotivoDeError(valor)).toBe("desconocido");
  });
});

describe("encabezado del error: «No se ha podido cargar» una sola vez (REQ-028)", () => {
  it("lo añade solo si el texto del motivo no lo dice ya", () => {
    for (const motivo of MOTIVOS_DE_ERROR) {
      const propio = TEXTOS.motivosDeError[motivo];
      const encabezado = encabezadoDeError(motivo);
      const veces =
        propio.split(TEXTOS.bloque.noSePudoCargar).length - 1 + (encabezado === null ? 0 : 1);
      expect(veces, motivo).toBe(1);
    }
  });

  it("el encabezado, si existe, es el texto fijo del bloque", () => {
    expect(encabezadoDeError("sin_conexion")).toBe(TEXTOS.bloque.noSePudoCargar);
    expect(encabezadoDeError("sesion_no_valida")).toBe(TEXTOS.bloque.noSePudoCargar);
    expect(encabezadoDeError("tarda_demasiado")).toBeNull();
    expect(encabezadoDeError("fallo_servidor")).toBeNull();
  });
});

describe("forma del esqueleto: tarjeta, tabla, gráfico o lista", () => {
  it("la lista es cerrada", () => {
    expect([...FORMAS_DE_ESQUELETO]).toEqual(["tarjeta", "tabla", "grafico", "lista"]);
  });

  it.each([...FORMAS_DE_ESQUELETO])("%s se lee tal cual", (forma) => {
    expect(leerFormaDeEsqueleto(forma)).toBe(forma);
  });

  it.each([
    ["cualquier cadena", "mapa"],
    ["__proto__", "__proto__"],
    ["constructor", "constructor"],
    ["un número", 1],
    ["null", null],
    ["undefined", undefined],
  ])("%s cae en «tarjeta»", (_nombre, valor) => {
    expect(leerFormaDeEsqueleto(valor)).toBe("tarjeta");
  });
});

describe("texto fijo con respaldo", () => {
  it("un texto de TEXTOS se acepta; cualquier otra cadena, no", () => {
    expect(leerTextoFijoOr(TEXTOS.tabla.vacio.titulo, TEXTOS.estadoVacio.generico.titulo)).toBe(
      TEXTOS.tabla.vacio.titulo,
    );
    for (const raro of ["Texto del servidor", "", "<b>x</b>", 5, null, undefined, {}]) {
      expect(leerTextoFijoOr(raro, TEXTOS.estadoVacio.generico.titulo)).toBe(
        TEXTOS.estadoVacio.generico.titulo,
      );
    }
  });
});

describe("acción del estado vacío", () => {
  const alPulsar = (): void => undefined;

  it("con texto fijo y función, se lee", () => {
    const a = leerAccionDeEstado({
      texto: TEXTOS.estadoVacio.ejemplo.conAccion.accion,
      alPulsar,
    });
    expect(a).not.toBeNull();
    expect(a?.texto).toBe(TEXTOS.estadoVacio.ejemplo.conAccion.accion);
    expect(a?.alPulsar).toBe(alPulsar);
  });

  it("solo toma esas dos claves: lo demás no pasa", () => {
    const a = leerAccionDeEstado({
      texto: TEXTOS.estadoVacio.ejemplo.conAccion.accion,
      alPulsar,
      href: "https://ejemplo.invalid",
      extra: "TESTIGO",
    });
    expect(Object.keys(a ?? {}).sort()).toEqual(["alPulsar", "texto"]);
  });

  it.each([
    ["sin acción", undefined],
    ["null", null],
    ["texto libre", { texto: "Pulsa aquí", alPulsar }],
    ["sin función", { texto: TEXTOS.estadoVacio.ejemplo.conAccion.accion }],
    ["función que no lo es", { texto: TEXTOS.estadoVacio.ejemplo.conAccion.accion, alPulsar: 3 }],
    ["una cadena", TEXTOS.estadoVacio.ejemplo.conAccion.accion],
    ["una lista", [TEXTOS.estadoVacio.ejemplo.conAccion.accion, alPulsar]],
  ])("%s: no hay botón", (_nombre, valor) => {
    expect(leerAccionDeEstado(valor)).toBeNull();
  });
});

describe("ruta del Resumen del estado sin permiso", () => {
  it("solo rutas internas; si no, el Resumen de superadmin", () => {
    expect(leerRutaDelResumen("/panel")).toBe("/panel");
    expect(leerRutaDelResumen("/admin")).toBe("/admin");
    for (const mala of [
      "//otro.invalid",
      "https://otro.invalid",
      "javascript:alert(1)",
      "/\\otro.invalid",
      "resumen",
      "",
      "/a\tb",
      5,
      null,
      undefined,
    ]) {
      expect(leerRutaDelResumen(mala), String(mala)).toBe("/admin");
    }
  });
});
