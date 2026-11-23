// T-016 (b) · lógica de `AvisosTemporales` (diseño 020, «Diálogo, cajón y avisos» y «Avisos:
// componente propio (enmienda 1)»; REQ-021, REQ-042, REQ-072; CA-015). Sin navegador ni jsdom: el
// plazo de 8 s con sus dos pausas (puntero y foco), la pila de avisos y su orden, y el TIPO de
// aviso, que no admite avisos de error ni texto libre (lo comprueba el compilador con
// `@ts-expect-error`: si el tipo se ensanchara, `npm run tipos` fallaría por la directiva sobrante).
// El foco, el teclado, los solapes y los 8 s con reloj real están en
// `tests/e2e/muestra/avisos.spec.ts`.
import { describe, expect, it } from "vitest";
import { ID_CONTENIDO } from "../../../src/components/armazon/Armazon";
import {
  CLAVES_DE_AVISO,
  DURACION_DE_AVISO_MS,
  ID_DE_RESPALDO_DEL_FOCO,
  PILA_VACIA,
  TOPE_DE_AVISOS,
  conFoco,
  conPuntero,
  decidirAlVencer,
  estaPausado,
  iniciarPlazo,
  leerClaveDeAviso,
  milisegundosHastaVencer,
  reducirPila,
  textoDeAviso,
  type AvisoTemporal,
  type ClaveDeAviso,
} from "../../../src/components/avisos/logica";
import type { PropiedadesDeAvisos } from "../../../src/components/avisos/AvisosTemporales";
import type { useAvisos } from "../../../src/components/avisos/useAvisos";
import { TEXTOS } from "../../../src/components/textos";

const ninguno = { focoDentro: false, punteroEncima: false } as const;

describe("plazo de un aviso: 8 s", () => {
  it("dura 8 s, por encima del mínimo de 5 s de REQ-021", () => {
    expect(DURACION_DE_AVISO_MS).toBe(8000);
  });

  it("sin pausas vence a los 8 s exactos, ni antes ni después", () => {
    const p = iniciarPlazo(1_000);
    expect(milisegundosHastaVencer(p, 1_000)).toBe(8000);
    expect(milisegundosHastaVencer(p, 8_999)).toBe(1);
    expect(milisegundosHastaVencer(p, 9_000)).toBe(0);
    expect(milisegundosHastaVencer(p, 20_000)).toBe(0);
    expect(decidirAlVencer(p, 8_999, ninguno)).toBe("esperar");
    expect(decidirAlVencer(p, 9_000, ninguno)).toBe("retirar");
    expect(decidirAlVencer(p, 9_001, ninguno)).toBe("retirar");
  });

  it("con el puntero encima está pausado y no se retira nunca; al salir empieza entero", () => {
    let p = iniciarPlazo(0);
    p = conPuntero(p, true, 3_000);
    expect(estaPausado(p)).toBe(true);
    expect(decidirAlVencer(p, 20_000, { focoDentro: false, punteroEncima: true })).toBe("pausar");
    p = conPuntero(p, false, 20_000);
    expect(estaPausado(p)).toBe(false);
    expect(milisegundosHastaVencer(p, 20_000)).toBe(8000);
    expect(decidirAlVencer(p, 27_999, ninguno)).toBe("esperar");
    expect(decidirAlVencer(p, 28_000, ninguno)).toBe("retirar");
  });

  it("con el foco dentro está pausado; al sacarlo empieza entero", () => {
    let p = iniciarPlazo(0);
    p = conFoco(p, true, 7_700);
    expect(estaPausado(p)).toBe(true);
    p = conFoco(p, false, 30_000);
    expect(estaPausado(p)).toBe(false);
    expect(milisegundosHastaVencer(p, 30_000)).toBe(8000);
  });

  it("puntero y foco a la vez: solo se reanuda cuando salen los dos", () => {
    let p = iniciarPlazo(0);
    p = conPuntero(p, true, 1_000);
    p = conFoco(p, true, 2_000);
    p = conPuntero(p, false, 3_000);
    expect(estaPausado(p), "el foco sigue dentro").toBe(true);
    p = conFoco(p, false, 5_000);
    expect(estaPausado(p)).toBe(false);
    expect(milisegundosHastaVencer(p, 5_000)).toBe(8000);
    // Al revés.
    let q = iniciarPlazo(0);
    q = conFoco(q, true, 1_000);
    q = conPuntero(q, true, 2_000);
    q = conFoco(q, false, 3_000);
    expect(estaPausado(q), "el puntero sigue encima").toBe(true);
    q = conPuntero(q, false, 9_000);
    expect(milisegundosHastaVencer(q, 9_000)).toBe(8000);
  });

  it("entrar o salir dos veces seguidas no cambia el plazo", () => {
    const p = conFoco(iniciarPlazo(0), true, 1_000);
    expect(conFoco(p, true, 4_000)).toEqual(p);
    const libre = iniciarPlazo(0);
    expect(conFoco(libre, false, 5_000)).toEqual(libre);
    expect(conPuntero(libre, false, 5_000)).toEqual(libre);
  });

  it("el foco que llegó antes de que el componente lo supiera se detecta al vencer (sin carrera)", () => {
    // La pausa por el foco no depende de que el manejador se haya enganchado a tiempo: al vencer,
    // si el foco o el puntero están dentro, no se retira y se pausa.
    const p = iniciarPlazo(0);
    expect(decidirAlVencer(p, 8_000, { focoDentro: true, punteroEncima: false })).toBe("pausar");
    expect(decidirAlVencer(p, 8_000, { focoDentro: false, punteroEncima: true })).toBe("pausar");
    expect(decidirAlVencer(p, 8_000, { focoDentro: true, punteroEncima: true })).toBe("pausar");
    expect(decidirAlVencer(p, 7_999, { focoDentro: true, punteroEncima: false })).toBe("esperar");
  });

  it("un plazo no pierde nada por un reloj que retrocede: no da tiempos negativos ni mayores de 8 s", () => {
    const p = iniciarPlazo(10_000);
    expect(milisegundosHastaVencer(p, 5_000)).toBe(8000);
    expect(milisegundosHastaVencer(p, Number.NaN)).toBe(0);
  });
});

describe("claves de aviso: lista cerrada de textos fijos", () => {
  it("las claves son las de TEXTOS.avisos.mensajes, ni una más ni una menos", () => {
    expect([...CLAVES_DE_AVISO].sort()).toEqual(Object.keys(TEXTOS.avisos.mensajes).sort());
    expect(CLAVES_DE_AVISO.length).toBeGreaterThanOrEqual(6);
  });

  it("cada clave da su texto fijo", () => {
    for (const c of CLAVES_DE_AVISO) expect(textoDeAviso(c)).toBe(TEXTOS.avisos.mensajes[c]);
  });

  it("lo que no es una clave no se lee (cierra en fallo)", () => {
    const [primera] = CLAVES_DE_AVISO;
    expect(leerClaveDeAviso(primera)).toBe(primera);
    for (const v of [
      "",
      "Cambios guardados",
      "texto libre",
      "__proto__",
      "constructor",
      "toString",
      "hasOwnProperty",
      " " + String(primera),
      String(primera) + " ",
      null,
      undefined,
      0,
      1,
      true,
      {},
      [],
      { clave: primera },
      ["cambiosGuardados"],
    ]) {
      expect(leerClaveDeAviso(v), JSON.stringify(v)).toBeNull();
    }
  });

  it("los textos de los avisos son informativos: ninguno es de error", () => {
    for (const t of Object.values(TEXTOS.avisos.mensajes)) {
      expect(/error|fallo|no se ha podido|problema/i.test(t), t).toBe(false);
    }
  });
});

describe("pila de avisos: orden, ids y cierre", () => {
  const a = CLAVES_DE_AVISO[0] as ClaveDeAviso;
  const b = CLAVES_DE_AVISO[1] as ClaveDeAviso;
  const c = CLAVES_DE_AVISO[2] as ClaveDeAviso;

  it("empieza vacía", () => {
    expect(PILA_VACIA.avisos).toEqual([]);
  });

  it("añadir pone el aviso al final (el más antiguo, primero) con un id nuevo cada vez", () => {
    let p = reducirPila(PILA_VACIA, { tipo: "anadir", clave: a });
    p = reducirPila(p, { tipo: "anadir", clave: b });
    p = reducirPila(p, { tipo: "anadir", clave: c });
    expect(p.avisos.map((x) => x.clave)).toEqual([a, b, c]);
    const ids = p.avisos.map((x) => x.id);
    expect(new Set(ids).size).toBe(3);
    expect(ids).toEqual([...ids].sort((x, y) => x - y));
  });

  it("la misma clave dos veces son dos avisos distintos", () => {
    let p = reducirPila(PILA_VACIA, { tipo: "anadir", clave: a });
    p = reducirPila(p, { tipo: "anadir", clave: a });
    expect(p.avisos).toHaveLength(2);
    expect(p.avisos[0]?.id).not.toBe(p.avisos[1]?.id);
  });

  it("cerrar quita solo ese aviso y respeta el orden de los demás", () => {
    let p = reducirPila(PILA_VACIA, { tipo: "anadir", clave: a });
    p = reducirPila(p, { tipo: "anadir", clave: b });
    p = reducirPila(p, { tipo: "anadir", clave: c });
    const medio = p.avisos[1]?.id ?? -1;
    const q = reducirPila(p, { tipo: "cerrar", id: medio });
    expect(q.avisos.map((x) => x.clave)).toEqual([a, c]);
  });

  it("cerrar dos veces o cerrar un id que no existe no hace nada", () => {
    const p = reducirPila(PILA_VACIA, { tipo: "anadir", clave: a });
    const id = p.avisos[0]?.id ?? -1;
    const q = reducirPila(p, { tipo: "cerrar", id });
    expect(reducirPila(q, { tipo: "cerrar", id })).toEqual(q);
    expect(reducirPila(p, { tipo: "cerrar", id: 9999 })).toBe(p);
    expect(reducirPila(p, { tipo: "cerrar", id: Number.NaN })).toBe(p);
  });

  it("un id cerrado no se reutiliza", () => {
    let p = reducirPila(PILA_VACIA, { tipo: "anadir", clave: a });
    const primero = p.avisos[0]?.id ?? -1;
    p = reducirPila(p, { tipo: "cerrar", id: primero });
    p = reducirPila(p, { tipo: "anadir", clave: a });
    expect(p.avisos[0]?.id).not.toBe(primero);
  });

  it("no crece sin límite: pasado el tope se retira el más antiguo", () => {
    let p = PILA_VACIA;
    for (let i = 0; i < TOPE_DE_AVISOS + 5; i += 1) {
      p = reducirPila(p, { tipo: "anadir", clave: i % 2 === 0 ? a : b });
    }
    expect(p.avisos).toHaveLength(TOPE_DE_AVISOS);
    const ids = p.avisos.map((x) => x.id);
    expect(ids).toEqual([...ids].sort((x, y) => x - y));
    expect(ids[ids.length - 1]).toBe(TOPE_DE_AVISOS + 4);
  });

  it("una clave que no es de la lista no entra en la pila (defensa en ejecución)", () => {
    const mala = { tipo: "anadir", clave: "texto libre" } as unknown as Parameters<
      typeof reducirPila
    >[1];
    expect(reducirPila(PILA_VACIA, mala)).toBe(PILA_VACIA);
  });
});

describe("el tipo de aviso no admite avisos de error ni texto libre (REQ-021, REQ-072; art. 1)", () => {
  it("una cadena libre no es una clave de aviso", () => {
    // @ts-expect-error: «texto libre» no es una clave de `TEXTOS.avisos.mensajes`.
    const libre: ClaveDeAviso = "texto libre";
    expect(leerClaveDeAviso(libre)).toBeNull();
  });

  it("un texto de otro grupo de TEXTOS tampoco es una clave", () => {
    // @ts-expect-error: la clave es el nombre del mensaje, no el texto ni otro grupo.
    const otra: ClaveDeAviso = "sin_conexion";
    expect(leerClaveDeAviso(otra)).toBeNull();
  });

  it("el aviso no tiene gravedad, tono ni texto: solo `id` y `clave`", () => {
    const valido: AvisoTemporal = { id: 1, clave: CLAVES_DE_AVISO[0] as ClaveDeAviso };
    expect(Object.keys(valido).sort()).toEqual(["clave", "id"]);
    const conGravedad: AvisoTemporal = {
      id: 1,
      clave: CLAVES_DE_AVISO[0] as ClaveDeAviso,
      // @ts-expect-error: no existe la propiedad `gravedad`: no hay avisos de error.
      gravedad: "error",
    };
    const conTexto: AvisoTemporal = {
      id: 1,
      clave: CLAVES_DE_AVISO[0] as ClaveDeAviso,
      // @ts-expect-error: no existe la propiedad `texto`: el texto sale de TEXTOS.
      texto: "libre",
    };
    expect(conGravedad.id + conTexto.id).toBe(2);
  });

  it("la acción de añadir no admite un texto ni un tono", () => {
    type Anadir = Extract<Parameters<typeof reducirPila>[1], { tipo: "anadir" }>;
    // @ts-expect-error: la acción de añadir lleva una clave, no un texto.
    const conTexto: Anadir = { tipo: "anadir", texto: "libre" };
    const conTono: Anadir = {
      tipo: "anadir",
      clave: CLAVES_DE_AVISO[0] as ClaveDeAviso,
      // @ts-expect-error: no existe `tono`.
      tono: "error",
    };
    expect(conTexto.tipo + conTono.tipo).toBe("anadiranadir");
  });

  it("`avisar` del hook solo recibe una clave de la lista", () => {
    type Avisar = ReturnType<typeof useAvisos>["avisar"];
    const sombra: Avisar = () => undefined;
    // @ts-expect-error: una cadena libre no se puede avisar.
    sombra("Algo ha fallado");
    // @ts-expect-error: un objeto con tono de error tampoco.
    sombra({ clave: CLAVES_DE_AVISO[0], tono: "error" });
    sombra(CLAVES_DE_AVISO[0] as ClaveDeAviso);
    expect(typeof sombra).toBe("function");
  });

  it("el componente solo recibe avisos con id y clave, y un cierre", () => {
    // @ts-expect-error: falta `alCerrar`.
    const sinCierre: PropiedadesDeAvisos = { avisos: [] };
    const conTexto: PropiedadesDeAvisos = {
      // @ts-expect-error: un aviso con texto propio no existe.
      avisos: [{ id: 1, texto: "libre" }],
      alCerrar: () => undefined,
    };
    expect(sinCierre.avisos.length + conTexto.avisos.length).toBe(1);
  });
});

describe("destino de respaldo del foco", () => {
  it("es el mismo contenido principal al que lleva el enlace de salto del armazón", () => {
    expect(ID_DE_RESPALDO_DEL_FOCO).toBe(ID_CONTENIDO);
  });
});
