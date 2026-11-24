// T-016 (e) · lógica pura de la conexión (diseño 020, `AvisoConexion` y «Cambio de periodo»,
// punto 7; REQ-060, REQ-023, REQ-075; CA-045). Sin navegador: los estados del aviso, la lectura de
// `navigator.onLine` (la única fuente del estado de conexión), el momento de carga de lo que se ve
// y su texto en la hora de Madrid. Escrita antes que el módulo (en rojo, sin módulo).
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  ESTADOS_DE_CONEXION,
  crearRegistroDeCarga,
  PLAZO_DE_RECUPERADA_MS,
  estaSinConexion,
  leerEstadoDeConexion,
  momentoDeCarga,
  siguienteEstadoDeConexion,
  textoDeHoraDeCarga,
} from "../../../src/components/estados/conexion";
import { TEXTOS } from "../../../src/components/textos";

afterEach(() => vi.unstubAllGlobals());

describe("estados del aviso de conexión", () => {
  it("lista cerrada y plazo de la confirmación", () => {
    expect([...ESTADOS_DE_CONEXION]).toEqual(["conectado", "sin_conexion", "recuperada"]);
    expect(PLAZO_DE_RECUPERADA_MS).toBe(8000);
  });

  it("perder la conexión pasa a «sin_conexion» desde cualquier estado", () => {
    for (const e of ESTADOS_DE_CONEXION) {
      expect(siguienteEstadoDeConexion(e, "offline")).toBe("sin_conexion");
    }
  });

  it("volver la conexión: solo tras una pérdida se confirma; si nunca se perdió, no se dice nada", () => {
    expect(siguienteEstadoDeConexion("sin_conexion", "online")).toBe("recuperada");
    expect(siguienteEstadoDeConexion("conectado", "online")).toBe("conectado");
    expect(siguienteEstadoDeConexion("recuperada", "online")).toBe("recuperada");
  });

  it("pasado el plazo, la confirmación se retira; la pérdida no caduca", () => {
    expect(siguienteEstadoDeConexion("recuperada", "plazo")).toBe("conectado");
    expect(siguienteEstadoDeConexion("sin_conexion", "plazo")).toBe("sin_conexion");
    expect(siguienteEstadoDeConexion("conectado", "plazo")).toBe("conectado");
  });

  it("un evento o un estado desconocidos cierran en fallo: sin conexión (art. 3)", () => {
    expect(siguienteEstadoDeConexion("conectado", "otro" as never)).toBe("sin_conexion");
    expect(siguienteEstadoDeConexion("raro" as never, "online")).toBe("sin_conexion");
    for (const raro of [undefined, null, 3, {}, "CONECTADO", "__proto__", "constructor"]) {
      expect(leerEstadoDeConexion(raro)).toBe("sin_conexion");
    }
    expect(leerEstadoDeConexion("recuperada")).toBe("recuperada");
  });
});

describe("estaSinConexion: única fuente de la conexión", () => {
  it("verdadero solo si el navegador dice que no hay red", () => {
    vi.stubGlobal("navigator", { onLine: false });
    expect(estaSinConexion()).toBe(true);
    vi.stubGlobal("navigator", { onLine: true });
    expect(estaSinConexion()).toBe(false);
  });

  it("sin navegador o con un valor que no es booleano, se da por conectado (no hay nada que marcar)", () => {
    vi.stubGlobal("navigator", undefined);
    expect(estaSinConexion()).toBe(false);
    vi.stubGlobal("navigator", { onLine: "no" });
    expect(estaSinConexion()).toBe(false);
  });
});

describe("momento de carga de lo que se ve (REQ-060)", () => {
  it("se fija al llegar los datos y no se mueve mientras sigan a la vista", () => {
    expect(momentoDeCarga(null, "datos", 1000)).toBe(1000);
    expect(momentoDeCarga(1000, "datos", 5000)).toBe(1000);
  });

  it("fuera de «datos» no hay momento: lo que no se ve no se marca", () => {
    for (const e of ["carga", "vacio", "error", "sin_permiso"] as const) {
      expect(momentoDeCarga(1000, e, 5000)).toBeNull();
    }
    expect(momentoDeCarga(1000, "raro" as never, 5000)).toBeNull();
  });

  it("un reloj que no es un número sano no inventa una hora", () => {
    expect(momentoDeCarga(null, "datos", Number.NaN)).toBeNull();
    expect(momentoDeCarga(null, "datos", Infinity)).toBeNull();
  });
});

describe("textoDeHoraDeCarga: hora de Madrid con formato español", () => {
  it("«Datos cargados el 12 nov 2026, 08:04» a partir de un instante UTC", () => {
    expect(textoDeHoraDeCarga(Date.parse("2026-11-12T07:04:00Z"))).toBe(
      "Datos cargados el 12 nov 2026, 08:04",
    );
    expect(TEXTOS.bloque.datosCargadosEl).toBe("Datos cargados el");
  });

  it("en verano, dos horas más; no depende de la zona del dispositivo", () => {
    expect(textoDeHoraDeCarga(Date.parse("2026-07-01T22:30:00Z"))).toBe(
      "Datos cargados el 2 jul 2026, 00:30",
    );
  });

  it("un instante imposible da «Sin datos», nunca una hora inventada", () => {
    expect(textoDeHoraDeCarga(Number.NaN)).toBe(
      `${TEXTOS.bloque.datosCargadosEl} ${TEXTOS.formato.sinDatos}`,
    );
  });
});

describe("textos de la conexión", () => {
  it("son los del diseño, fijos y en español de España", () => {
    expect(TEXTOS.conexion.sinConexion).toBe("Sin conexión");
    expect(TEXTOS.conexion.recuperada).toBe("Conexión recuperada");
    expect(TEXTOS.conexion.explicacion).toMatch(/\.$/);
  });
});

describe("registro del momento de carga (uno por bloque)", () => {
  it("avisa solo cuando cambia el momento y se borra al dejar de ver datos", () => {
    const r = crearRegistroDeCarga();
    let avisos = 0;
    const baja = r.suscribir(() => avisos++);
    expect(r.leer()).toBeNull();
    r.fijar("carga", 10);
    expect(avisos).toBe(0);
    r.fijar("datos", 20);
    r.fijar("datos", 30);
    expect(r.leer()).toBe(20);
    expect(avisos).toBe(1);
    r.fijar("error", 40);
    expect(r.leer()).toBeNull();
    expect(avisos).toBe(2);
    r.fijar("datos", 50);
    expect(r.leer()).toBe(50);
    baja();
    r.fijar("vacio", 60);
    expect(avisos).toBe(3);
  });
});
