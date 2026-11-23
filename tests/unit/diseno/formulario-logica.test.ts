// T-016 (a) · lógica pura de `Formulario` (diseño 020, «Componentes base», fila `Formulario y
// campos`; REQ-019, REQ-020, REQ-057, REQ-080; CA-014; PRUEBA-015, PRUEBA-017). Sin navegador.
import { describe, expect, it } from "vitest";
import { leerResultadoAccion } from "../../../src/components/acciones/resultado";
import {
  AUTOCOMPLETADOS,
  LONGITUD_POR_DEFECTO,
  LONGITUD_TOPE,
  TIPOS_DE_CAMPO,
  descripcionDe,
  esTextoFijo,
  leerCampos,
  leerValor,
  presentarResultadoDeFormulario,
  repartirErrores,
  resumenDeErrores,
  validarCampos,
  valoresIniciales,
} from "../../../src/components/formulario/logica";
import { TEXTOS } from "../../../src/components/textos";

const E = TEXTOS.formulario.ejemplo;
const campo = (extra: Record<string, unknown> = {}): Record<string, unknown> => ({
  clave: "nombre",
  tipo: "texto",
  etiqueta: E.nombre,
  longitudMaxima: 120,
  ...extra,
});
const opciones = [
  { valor: "basico", etiqueta: E.planBasico },
  { valor: "profesional", etiqueta: E.planProfesional },
];

describe("lista cerrada de tipos y de autocompletado", () => {
  it("son los seis tipos del diseño", () => {
    expect([...TIPOS_DE_CAMPO]).toEqual([
      "texto",
      "texto_largo",
      "seleccion",
      "casilla",
      "grupo",
      "busqueda",
    ]);
  });
  it("el autocompletado es una lista cerrada que empieza por off", () => {
    expect(AUTOCOMPLETADOS[0]).toBe("off");
  });
});

describe("esTextoFijo", () => {
  it("reconoce un texto de TEXTOS y no uno recibido", () => {
    expect(esTextoFijo(E.nombre)).toBe(true);
    expect(esTextoFijo("Texto del servidor")).toBe(false);
    expect(esTextoFijo(undefined)).toBe(false);
    expect(esTextoFijo(42)).toBe(false);
  });
});

describe("leerCampos · cierra en fallo", () => {
  it("lee un campo válido", () => {
    const [c] = leerCampos([campo()]);
    expect(c).toMatchObject({ clave: "nombre", tipo: "texto", longitudMaxima: 120 });
    expect("autocompletar" in c! && c.autocompletar).toBe("off");
    expect(c!.obligatorio).toBe(false);
  });
  it("obligatorio solo con true exacto", () => {
    expect(leerCampos([campo({ obligatorio: "true" })])[0]!.obligatorio).toBe(false);
    expect(leerCampos([campo({ obligatorio: 1 })])[0]!.obligatorio).toBe(false);
    expect(leerCampos([campo({ obligatorio: true })])[0]!.obligatorio).toBe(true);
  });
  it("descarta tipos desconocidos, claves inválidas o repetidas y lo que no es un objeto", () => {
    const fuera = [
      campo({ tipo: "fecha" }),
      campo({ clave: "Nombre" }),
      campo({ clave: "__proto__" }),
      campo({ clave: "1a" }),
      campo({ clave: "a".repeat(40) }),
      null,
      "texto",
      [],
    ];
    expect(leerCampos(fuera)).toEqual([]);
    const repetidas = leerCampos([campo(), campo({ etiqueta: E.descripcion })]);
    expect(repetidas).toHaveLength(1);
    expect(leerCampos("no")).toEqual([]);
  });
  it("la etiqueta que no es un texto fijo cae a «Campo»; una ayuda que no lo es se descarta", () => {
    const [c] = leerCampos([campo({ etiqueta: "<b>del servidor</b>", ayuda: "otro" })]);
    expect(c!.etiqueta).toBe(TEXTOS.formulario.campoSinNombre);
    expect(c!.ayuda).toBeUndefined();
  });
  it("la longitud máxima se acota; sin una válida, la de por defecto", () => {
    const l = (v: unknown): number => {
      const c = leerCampos([campo({ longitudMaxima: v })])[0]!;
      return c.tipo === "texto" ? c.longitudMaxima : -1;
    };
    expect(l(50)).toBe(50);
    expect(l(0)).toBe(LONGITUD_POR_DEFECTO);
    expect(l(-3)).toBe(LONGITUD_POR_DEFECTO);
    expect(l(2.5)).toBe(LONGITUD_POR_DEFECTO);
    expect(l("120")).toBe(LONGITUD_POR_DEFECTO);
    expect(l(Number.NaN)).toBe(LONGITUD_POR_DEFECTO);
    expect(l(1e9)).toBe(LONGITUD_TOPE);
  });
  it("el autocompletado fuera de la lista vale off", () => {
    const auto = (v: unknown): unknown => {
      const c = leerCampos([campo({ autocompletar: v })])[0]!;
      return "autocompletar" in c ? c.autocompletar : undefined;
    };
    expect(auto("cc-number")).toBe("off");
    expect(auto("email")).toBe("email");
  });
  it("selección y grupo: opciones con valor válido y sin repetir; sin opciones no se pinta", () => {
    const sel = leerCampos([
      campo({
        clave: "plan",
        tipo: "seleccion",
        opciones: [...opciones, { valor: "basico", etiqueta: E.planEquipo }, { valor: "" }, 7],
      }),
    ])[0]!;
    expect(sel.tipo === "seleccion" && sel.opciones.map((o) => o.valor)).toEqual([
      "basico",
      "profesional",
    ]);
    expect(leerCampos([campo({ tipo: "grupo", opciones: [] })])).toEqual([]);
    expect(leerCampos([campo({ tipo: "seleccion" })])).toEqual([]);
  });
  it("una etiqueta de opción que no es un texto fijo cae a «Opción»", () => {
    const g = leerCampos([
      campo({ tipo: "grupo", opciones: [{ valor: "a", etiqueta: "dato del servidor" }] }),
    ])[0]!;
    expect(g.tipo === "grupo" && g.opciones[0]!.etiqueta).toBe(TEXTOS.formulario.opcionSinNombre);
  });
  it("lo recibido de más no pasa al campo leído", () => {
    const c = leerCampos([campo({ secreto: "x", __proto__: { y: 1 } })])[0]!;
    expect(Object.keys(c)).not.toContain("secreto");
  });
});

describe("valores", () => {
  const campos = leerCampos([
    campo(),
    campo({ clave: "plan", tipo: "seleccion", opciones }),
    campo({ clave: "avisos", tipo: "casilla" }),
    campo({ clave: "frecuencia", tipo: "grupo", opciones }),
  ]);
  it("los valores iniciales están vacíos (texto) o sin marcar (casilla)", () => {
    expect(valoresIniciales(campos)).toEqual({
      nombre: "",
      plan: "",
      avisos: false,
      frecuencia: "",
    });
  });
  it("leerValor: un valor de otro tipo o fuera de las opciones queda vacío", () => {
    expect(leerValor(campos[0]!, "Ana")).toBe("Ana");
    expect(leerValor(campos[0]!, 5)).toBe("");
    expect(leerValor(campos[1]!, "profesional")).toBe("profesional");
    expect(leerValor(campos[1]!, "inventada")).toBe("");
    expect(leerValor(campos[2]!, true)).toBe(true);
    expect(leerValor(campos[2]!, "true")).toBe(false);
  });
  it("una clave como constructor es una clave propia, sin tocar el prototipo", () => {
    const v = valoresIniciales(leerCampos([campo({ clave: "constructor" })]));
    expect(Object.hasOwn(v, "constructor")).toBe(true);
    expect(Object.getPrototypeOf(v)).toBe(Object.prototype);
  });
});

describe("validarCampos (REQ-020)", () => {
  const campos = leerCampos([
    campo({ obligatorio: true, longitudMaxima: 10 }),
    campo({ clave: "descripcion", tipo: "texto_largo", longitudMaxima: 20 }),
    campo({ clave: "plan", tipo: "seleccion", obligatorio: true, opciones }),
    campo({ clave: "avisos", tipo: "casilla", obligatorio: true }),
    campo({ clave: "frecuencia", tipo: "grupo", obligatorio: true, opciones }),
    campo({ clave: "busqueda", tipo: "busqueda", longitudMaxima: 5 }),
  ]);
  it("enviado vacío: un error por cada obligatorio, en el orden de los campos", () => {
    expect(validarCampos(campos, valoresIniciales(campos))).toEqual([
      { campo: "nombre", codigo: "obligatorio" },
      { campo: "plan", codigo: "obligatorio" },
      { campo: "avisos", codigo: "sin_marcar" },
      { campo: "frecuencia", codigo: "obligatorio" },
    ]);
  });
  it("solo espacios en un obligatorio es vacío", () => {
    const v = { ...valoresIniciales(campos), nombre: "   \n " };
    expect(validarCampos(campos, v)[0]).toEqual({ campo: "nombre", codigo: "obligatorio" });
  });
  it("demasiado largo y opción fuera de la lista", () => {
    const v = {
      nombre: "x".repeat(11),
      descripcion: "y".repeat(21),
      plan: "inventada",
      avisos: true,
      frecuencia: "basico",
      busqueda: "z".repeat(6),
    };
    expect(validarCampos(campos, v)).toEqual([
      { campo: "nombre", codigo: "demasiado_largo" },
      { campo: "descripcion", codigo: "demasiado_largo" },
      { campo: "plan", codigo: "opcion_no_valida" },
      { campo: "busqueda", codigo: "demasiado_largo" },
    ]);
  });
  it("todo correcto: sin errores; un opcional vacío no falla", () => {
    const v = {
      nombre: "Ana",
      descripcion: "",
      plan: "basico",
      avisos: true,
      frecuencia: "profesional",
      busqueda: "",
    };
    expect(validarCampos(campos, v)).toEqual([]);
  });
  it("faltan valores en el objeto: se trata como vacío, sin lanzar", () => {
    expect(validarCampos(campos, {}).length).toBe(4);
  });
  it("cada código tiene su texto en TEXTOS", () => {
    for (const e of validarCampos(campos, valoresIniciales(campos))) {
      expect(Object.hasOwn(TEXTOS.formulario.errores, e.codigo)).toBe(true);
    }
  });
});

describe("repartirErrores · lo que devuelve el servidor (V-6, PRUEBA-015)", () => {
  const campos = leerCampos([campo(), campo({ clave: "plan", tipo: "seleccion", opciones })]);
  const listas = {
    motivos: ["estado_distinto"],
    campos: ["nombre", "plan"],
    codigos: ["nombre_en_uso"],
  };
  const rechazo = (errores: unknown[]) =>
    leerResultadoAccion(
      { estado: 422, cuerpo: { resultado: "rechazada", motivo: "estado_distinto", errores } },
      listas,
    );
  it("un par conocido va a su campo con el código de la lista", () => {
    const l = rechazo([{ campo: "nombre", codigo: "nombre_en_uso" }]);
    expect(l.resultado === "rechazada" && repartirErrores(l.errores, campos)).toEqual({
      porCampo: { nombre: ["nombre_en_uso"] },
      generales: 0,
    });
  });
  it("un campo o un código desconocidos son un error general, nunca un texto recibido", () => {
    const l = rechazo([
      { campo: "inventado", codigo: "nombre_en_uso" },
      { campo: "nombre", codigo: "<script>" },
      { campo: "nombre", codigo: "nombre_en_uso" },
    ]);
    const r = l.resultado === "rechazada" ? repartirErrores(l.errores, campos) : null;
    expect(r).toEqual({ porCampo: { nombre: ["nombre_en_uso"] }, generales: 1 });
    expect(JSON.stringify(r)).not.toContain("script");
  });
  it("un campo declarado en la lectura pero que no está en el formulario también es general", () => {
    const l = rechazo([{ campo: "plan", codigo: "nombre_en_uso" }]);
    const solo = leerCampos([campo()]);
    expect(l.resultado === "rechazada" && repartirErrores(l.errores, solo).generales).toBe(1);
  });
  it("un código que no tiene texto en TEXTOS es general", () => {
    const r = repartirErrores([{ campo: "nombre", codigo: "otro_codigo" }], campos);
    expect(r).toEqual({ porCampo: {}, generales: 1 });
  });
  it("campo __proto__ no contamina", () => {
    const r = repartirErrores([{ campo: "__proto__", codigo: "obligatorio" }], campos);
    expect(r.generales).toBe(1);
    expect(Object.getPrototypeOf(r.porCampo)).toBe(null);
  });
});

describe("resumenDeErrores y descripcionDe", () => {
  it("uno y varios, con número en formato español", () => {
    expect(resumenDeErrores(0)).toBe("");
    expect(resumenDeErrores(1)).toBe(TEXTOS.formulario.resumenUno);
    expect(resumenDeErrores(2)).toBe(
      `${TEXTOS.formulario.resumenAntes} 2 ${TEXTOS.formulario.resumenDespues}`,
    );
    expect(resumenDeErrores(1234)).toContain("1.234");
  });
  it("aria-describedby: ayuda, límite y error, en ese orden, solo los que hay", () => {
    expect(descripcionDe("c", { ayuda: true, limite: true, errores: true })).toBe(
      "c-ayuda c-limite c-error",
    );
    expect(descripcionDe("c", { ayuda: false, limite: false, errores: true })).toBe("c-error");
    expect(descripcionDe("c", { ayuda: false, limite: false, errores: false })).toBeUndefined();
  });
});

describe("presentarResultadoDeFormulario (REQ-020, REQ-073, REQ-078)", () => {
  const listas = { motivos: ["estado_distinto"], campos: ["nombre"], codigos: ["nombre_en_uso"] };
  it("sin resultado, nada", () => {
    expect(presentarResultadoDeFormulario(null, 0)).toEqual({
      mensaje: null,
      ofrecerComprobar: false,
    });
  });
  it("hecha: éxito con su texto", () => {
    expect(presentarResultadoDeFormulario({ resultado: "hecha" }, 0).mensaje).toBe(
      TEXTOS.acciones.resultado.hecha,
    );
  });
  it("rechazada: no se cambió nada, motivo de la lista y, si hay, el error general", () => {
    const l = leerResultadoAccion(
      {
        estado: 409,
        cuerpo: { resultado: "rechazada", motivo: "estado_distinto", errores: [] },
      },
      listas,
    );
    const v = presentarResultadoDeFormulario(l, 0);
    expect(v.mensaje).toBe(
      `${TEXTOS.acciones.resultado.rechazada} ${TEXTOS.acciones.motivosDeRechazo.estado_distinto}`,
    );
    expect(presentarResultadoDeFormulario(l, 1).mensaje).toContain(TEXTOS.formulario.errorGeneral);
  });
  it("no permitida: sin afirmar ningún cambio", () => {
    const l = leerResultadoAccion({ estado: 401 }, listas);
    expect(presentarResultadoDeFormulario(l, 0).mensaje).toBe(TEXTOS.acciones.noPermitida);
  });
  it("incierta: no se sabe si se aplicó y se ofrece comprobar", () => {
    const l = leerResultadoAccion({ estado: 500 }, listas);
    expect(presentarResultadoDeFormulario(l, 0)).toEqual({
      mensaje: TEXTOS.acciones.resultado.incierta,
      ofrecerComprobar: true,
    });
  });
});
