// T-010 (j) · lógica del diálogo de confirmación (diseño 020, «Diálogo, cajón y avisos», fila
// `DialogoConfirmacion`; REQ-017, REQ-018, REQ-073, REQ-074, REQ-078; CA-013). Sin navegador: las
// decisiones del componente (qué acción, qué objetivo, qué se ve tras cada resultado, cuándo se
// puede cerrar) son funciones puras. La parte de foco, teclado y anchos está en
// `tests/e2e/muestra/dialogo-confirmacion.spec.ts`.
import { describe, expect, it } from "vitest";
import { leerResultadoAccion } from "../../../src/components/acciones/resultado";
import {
  ACCIONES_DE_DIALOGO,
  DATOS_DISTINTIVOS,
  leerAccionDeDialogo,
  leerDatoDistintivo,
  leerObjetivo,
  presentarResultado,
  puedeCerrarse,
  variantePorAccion,
} from "../../../src/components/dialogo/logica";
import { TEXTOS } from "../../../src/components/textos";

const RLO = String.fromCharCode(0x202e);
const ZWSP = String.fromCharCode(0x200b);
const BEL = String.fromCharCode(7);

describe("leerAccionDeDialogo · lista cerrada", () => {
  it("reconoce las acciones declaradas y nada más", () => {
    expect([...ACCIONES_DE_DIALOGO]).toEqual([
      "pausar_agente",
      "reanudar_agente",
      "revocar_licencia",
      "publicar_version",
      "volver_atras_version",
    ]);
    for (const a of ACCIONES_DE_DIALOGO) expect(leerAccionDeDialogo(a)).toBe(a);
    for (const v of [
      "",
      "Pausar_agente",
      "pausar",
      "__proto__",
      "constructor",
      "toString",
      null,
      undefined,
      0,
      {},
      ["pausar_agente"],
    ]) {
      expect(leerAccionDeDialogo(v), String(v)).toBeNull();
    }
  });

  it("cada acción tiene su título, su «cuándo», un verbo con objeto en el botón y su texto en curso", () => {
    for (const a of ACCIONES_DE_DIALOGO) {
      const t = TEXTOS.dialogo.acciones[a];
      expect(t.titulo.length, a).toBeGreaterThan(8);
      expect(t.cuando.length, a).toBeGreaterThan(8);
      // verbo de acción y su objeto: «Pausar agente», nunca «Aceptar» ni «Sí»
      expect(t.confirmar.split(" ").length, a).toBeGreaterThanOrEqual(2);
      expect(t.confirmar.split(" ")[0], a).toMatch(/^\p{Lu}\p{Ll}+(?:ar|er|ir)$/u);
      expect(t.confirmar, a).not.toMatch(/^(?:Aceptar|Sí|Enviar|OK|Haz clic aquí)$/i);
      expect(t.enCurso, a).toMatch(/…$/u);
    }
  });

  it("las acciones que cambian algo de forma difícil de deshacer usan la variante peligro; las demás, la primaria", () => {
    expect(variantePorAccion("pausar_agente")).toBe("peligro");
    expect(variantePorAccion("revocar_licencia")).toBe("peligro");
    expect(variantePorAccion("volver_atras_version")).toBe("peligro");
    expect(variantePorAccion("reanudar_agente")).toBe("primario");
    expect(variantePorAccion("publicar_version")).toBe("primario");
  });
});

describe("leerDatoDistintivo · lista cerrada", () => {
  it("solo las claves declaradas", () => {
    for (const d of DATOS_DISTINTIVOS) expect(leerDatoDistintivo(d)).toBe(d);
    for (const v of ["", "correo", "__proto__", null, undefined, 3]) {
      expect(leerDatoDistintivo(v), String(v)).toBeNull();
    }
    for (const d of DATOS_DISTINTIVOS) {
      expect(TEXTOS.dialogo.datosDistintivos[d].length).toBeGreaterThan(2);
    }
  });
});

describe("leerObjetivo · {nombre, distintivo} como datos (REQ-056, REQ-065)", () => {
  it("devuelve nombre y distintivo sin caracteres de control ni de dirección, sin recortar", () => {
    const largo = "x".repeat(120);
    expect(leerObjetivo({ nombre: largo, distintivo: largo })).toEqual({
      nombre: largo,
      distintivo: largo,
    });
    expect(leerObjetivo({ nombre: `Ana${RLO} Pérez${BEL}${ZWSP}`, distintivo: "A-1" })).toEqual({
      nombre: "Ana Pérez",
      distintivo: "A-1",
    });
  });

  it("lo que no es un objetivo cierra en un texto fijo, nunca vacío", () => {
    for (const v of [
      null,
      undefined,
      "texto",
      7,
      [],
      { nombre: 3, distintivo: {} },
      {},
      { nombre: "  " },
    ]) {
      const o = leerObjetivo(v);
      expect(o.nombre, String(v)).toBe(TEXTOS.dialogo.sinNombre);
      expect(o.distintivo, String(v)).toBe(TEXTOS.dialogo.sinNombre);
    }
  });

  it("solo lee claves propias y descarta lo de más", () => {
    const heredado = Object.create({ nombre: "TESTIGO-HEREDADO", distintivo: "TESTIGO-HEREDADO" });
    expect(JSON.stringify(leerObjetivo(heredado))).not.toContain("TESTIGO");
    const conExtras = leerObjetivo({
      nombre: "A",
      distintivo: "B",
      id: "TESTIGO-ID",
      prompt: "TESTIGO-P",
    });
    expect(Object.keys(conExtras).sort()).toEqual(["distintivo", "nombre"]);
    expect(JSON.stringify(conExtras)).not.toContain("TESTIGO");
  });

  it("no lanza con captadores ni proxies hostiles", () => {
    const malo = {
      get nombre(): string {
        throw new Error("no");
      },
    };
    expect(() => leerObjetivo(malo)).not.toThrow();
    expect(leerObjetivo(malo).nombre).toBe(TEXTOS.dialogo.sinNombre);
    const lanza = (): never => {
      throw new Error("no");
    };
    const proxy = new Proxy({}, { get: lanza, has: lanza, getOwnPropertyDescriptor: lanza });
    expect(() => leerObjetivo(proxy)).not.toThrow();
  });
});

describe("presentarResultado · qué se ve tras cada resultado (CA-013, REQ-073, REQ-078)", () => {
  it("en reposo: sin mensaje, con «Cancelar» y con confirmar", () => {
    expect(presentarResultado(null)).toEqual({
      mensaje: null,
      cierra: false,
      mostrarConfirmar: true,
      cierre: "cancelar",
      ofrecerComprobar: false,
    });
  });

  it("hecha: cierra el diálogo y lo dice; es el único camino a un mensaje de éxito", () => {
    const v = presentarResultado(leerResultadoAccion({ cuerpo: { resultado: "hecha" } }));
    expect(v.cierra).toBe(true);
    expect(v.mensaje).toBe(TEXTOS.acciones.resultado.hecha);
    for (const bruto of [
      undefined,
      { estado: 500 },
      { cuerpo: "<html>" },
      { estado: 200, cuerpo: { resultado: "exito" } },
      { estado: 200, cuerpo: { resultado: "hecha", extra: 1 } },
    ]) {
      const otra = presentarResultado(leerResultadoAccion(bruto));
      expect(otra.cierra, JSON.stringify(bruto)).toBe(false);
      expect(otra.mensaje, JSON.stringify(bruto)).not.toBe(TEXTOS.acciones.resultado.hecha);
    }
  });

  it("rechazada: no se aplicó nada, el diálogo sigue y se puede volver a confirmar; el motivo es el de la lista", () => {
    const lectura = leerResultadoAccion(
      { estado: 409, cuerpo: { resultado: "rechazada", motivo: "estado_distinto" } },
      { motivos: ["estado_distinto"], campos: [], codigos: [] },
    );
    const v = presentarResultado(lectura);
    expect(v.cierra).toBe(false);
    expect(v.mostrarConfirmar).toBe(true);
    expect(v.cierre).toBe("cancelar");
    expect(v.mensaje).toBe(
      `${TEXTOS.acciones.resultado.rechazada} ${TEXTOS.acciones.motivosDeRechazo.estado_distinto}`,
    );
  });

  it("rechazada con un motivo que no tiene texto: solo el texto general, nunca el recibido", () => {
    const v = presentarResultado({
      resultado: "rechazada",
      motivo: "TESTIGO-MOTIVO",
      errores: [],
    });
    expect(v.mensaje).toBe(TEXTOS.acciones.resultado.rechazada);
    for (const raro of ["__proto__", "constructor", "toString"]) {
      expect(
        presentarResultado({ resultado: "rechazada", motivo: raro, errores: [] }).mensaje,
      ).toBe(TEXTOS.acciones.resultado.rechazada);
    }
  });

  it("no_permitida: sin permiso, sin afirmar ningún cambio, sin volver a confirmar y con «Cerrar»", () => {
    expect(presentarResultado({ resultado: "no_permitida" })).toEqual({
      mensaje: TEXTOS.acciones.noPermitida,
      cierra: false,
      mostrarConfirmar: false,
      cierre: "cerrar",
      ofrecerComprobar: false,
    });
  });

  it("incierta: el mensaje permanece, no hay reintento y se ofrece comprobar el estado", () => {
    expect(presentarResultado({ resultado: "incierta" })).toEqual({
      mensaje: TEXTOS.acciones.resultado.incierta,
      cierra: false,
      mostrarConfirmar: false,
      cierre: "cerrar",
      ofrecerComprobar: true,
    });
  });

  it("un resultado que no es de la lista cierra en incierta", () => {
    const raro = { resultado: "TESTIGO" } as unknown as Parameters<typeof presentarResultado>[0];
    const v = presentarResultado(raro);
    expect(v.mensaje).toBe(TEXTOS.acciones.resultado.incierta);
    expect(v.cierra).toBe(false);
    expect(v.mostrarConfirmar).toBe(false);
  });
});

describe("puedeCerrarse · con la acción en curso no se cierra", () => {
  it("solo se cierra sin una acción en curso", () => {
    expect(puedeCerrarse(false)).toBe(true);
    expect(puedeCerrarse(true)).toBe(false);
  });
});
