// T-007 (e) · PRUEBA-007 (textos: una palabra por estado y ninguna repetida, 0 botones genéricos,
// 0 formas de usted, botón de confirmar con verbo) y PRUEBA-003 (estados: valor fuera del catálogo
// = «Estado desconocido» en tono neutro). CA-009, CA-013, CA-017, CA-036, CA-051 (REQ-012, REQ-075).
import { describe, expect, it } from "vitest";
import {
  CLAVES_DE_ESTADO,
  ICONOS_DE_ESTADO,
  TONOS_DE_ESTADO,
  describirEstado,
  leerEstado,
} from "../../../src/components/estado/catalogo";
import { TEXTOS } from "../../../src/components/textos";

/** Todas las cadenas de `TEXTOS`, con su ruta. */
function recorrer(valor: unknown, ruta: string, salida: Array<[string, string]>): void {
  if (typeof valor === "string") salida.push([ruta, valor]);
  else if (typeof valor === "object" && valor !== null) {
    for (const [k, v] of Object.entries(valor)) recorrer(v, `${ruta}.${k}`, salida);
  }
}
const TODOS: Array<[string, string]> = [];
recorrer(TEXTOS, "TEXTOS", TODOS);

const sinTildes = (s: string): string => s.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();

describe("PRUEBA-007 · catálogo de estados: una palabra por estado y ninguna repetida", () => {
  it("las claves del catálogo son las de los textos de estado, ni una más ni una menos", () => {
    expect([...CLAVES_DE_ESTADO].sort()).toEqual(Object.keys(TEXTOS.estados).sort());
    expect(CLAVES_DE_ESTADO).toContain("desconocido");
  });

  it("cada estado tiene una palabra o expresión corta, y no hay dos iguales", () => {
    const vistas = new Map<string, string>();
    for (const clave of CLAVES_DE_ESTADO) {
      const { palabra } = describirEstado(clave);
      expect(palabra.trim(), clave).toBe(palabra);
      expect(palabra.length, clave).toBeGreaterThan(0);
      expect(palabra.split(/\s+/).length, `${clave}: «${palabra}»`).toBeLessThanOrEqual(3);
      const normal = sinTildes(palabra);
      expect(
        vistas.has(normal),
        `«${palabra}» repetida entre ${clave} y ${vistas.get(normal)}`,
      ).toBe(false);
      vistas.set(normal, clave);
    }
  });

  it("las claves son ámbito.estado, o el estado desconocido", () => {
    for (const clave of CLAVES_DE_ESTADO) {
      expect(clave).toMatch(/^(?:[a-z]+\.[a-z_]+|desconocido)$/);
    }
  });

  it("el mismo estado no se nombra con dos palabras: ningún sinónimo en ningún texto", () => {
    const SINONIMOS: Record<string, RegExp> = {
      "agente.en_pausa":
        /(?:^|[^\p{L}])(?:Pausad[oa]s?|Detenid[oa]s?|Suspendid[oa]s?)(?![\p{L}])/iu,
      "agente.sin_senal": /(?:^|[^\p{L}])Desconectad[oa]s?(?![\p{L}])/iu,
      "agente.con_avisos": /(?:^|[^\p{L}])(?:Con alertas|Con advertencias)(?![\p{L}])/iu,
    };
    for (const [clave, patron] of Object.entries(SINONIMOS)) {
      for (const [ruta, texto] of TODOS) {
        expect(patron.test(texto), `${ruta} nombra ${clave} con otra palabra`).toBe(false);
      }
    }
  });

  it("tono e icono salen de listas cerradas, y el estado desconocido es neutro", () => {
    expect([...TONOS_DE_ESTADO]).toEqual(["neutro", "correcto", "aviso", "error", "informativo"]);
    for (const clave of CLAVES_DE_ESTADO) {
      const d = describirEstado(clave);
      expect(TONOS_DE_ESTADO, clave).toContain(d.tono);
      expect(ICONOS_DE_ESTADO, clave).toContain(d.icono);
      expect(d.clave).toBe(clave);
    }
    expect(describirEstado("desconocido")).toMatchObject({
      palabra: "Estado desconocido",
      tono: "neutro",
    });
  });

  it("un estado favorable nunca es neutro ni un estado de error es correcto", () => {
    expect(describirEstado("agente.activo").tono).toBe("correcto");
    expect(describirEstado("agente.sin_senal").tono).toBe("error");
    expect(describirEstado("agente.en_pausa").tono).toBe("aviso");
  });
});

describe("PRUEBA-007 · textos fijos", () => {
  it("hay textos y ninguno vacío, con espacios sobrantes o sin normalizar", () => {
    expect(TODOS.length).toBeGreaterThan(30);
    for (const [ruta, texto] of TODOS) {
      expect(texto.length, ruta).toBeGreaterThan(0);
      expect(texto.trim(), ruta).toBe(texto);
      expect(texto.normalize("NFC"), ruta).toBe(texto);
    }
  });

  it("0 botones o textos genéricos: «Aceptar», «Sí», «Enviar», «OK», «Haz clic aquí»", () => {
    const generico = /(?:^|[^\p{L}])(?:Aceptar|Sí|Enviar|OK|Haz clic aquí)(?![\p{L}])/iu;
    for (const [ruta, texto] of TODOS) {
      expect(generico.test(texto), `${ruta}: «${texto}»`).toBe(false);
    }
  });

  it("0 formas de usted", () => {
    const usted = /(?:^|[^\p{L}])(?:usted|ustedes)(?![\p{L}])/iu;
    // Imperativos de trato formal que no valen en un texto con trato de tú.
    const formales =
      /(?:^|[^\p{L}])(?:haga|pulse|introduzca|revise|compruebe|inténtelo|vuelva|inicie|seleccione|elija|escriba|espere|contacte|acceda|consulte|verifique|reintente)(?![\p{L}])/iu;
    for (const [ruta, texto] of TODOS) {
      expect(usted.test(texto), `${ruta}: «${texto}»`).toBe(false);
      expect(formales.test(texto), `${ruta}: «${texto}»`).toBe(false);
    }
  });

  it("el trato de tú se nota donde hay una invitación a actuar", () => {
    expect(TEXTOS.motivosDeError.sin_conexion).toMatch(/Comprueba/);
    expect(TEXTOS.motivosDeError.sesion_no_valida).toMatch(/Vuelve a iniciar sesión/);
    expect(TEXTOS.sinPermiso.explicacion).toMatch(/tengas permiso/);
    expect(TEXTOS.acciones.noPermitida).toBe("No tienes permiso para hacer esto");
  });

  it("0 textos en otro idioma: ninguna palabra inglesa corriente", () => {
    const ingles =
      /(?:^|[^\p{L}])(?:the|and|loading|please|retry|submit|cancel|error:|undefined|null|yes|no data|try again|click here)(?![\p{L}])/iu;
    for (const [ruta, texto] of TODOS) {
      expect(ingles.test(texto), `${ruta}: «${texto}»`).toBe(false);
    }
  });

  it("el botón de confirmar de cada acción es un verbo de acción, y en curso lo dice con palabra", () => {
    const acciones = Object.keys(TEXTOS.acciones.confirmar);
    expect(acciones.sort()).toEqual(["pausar", "publicar", "reanudar", "revocar", "volverAtras"]);
    for (const accion of acciones) {
      const verbo = (TEXTOS.acciones.confirmar as Record<string, string>)[accion] ?? "";
      expect(verbo.split(" ")[0], accion).toMatch(/^\p{Lu}\p{Ll}+(?:ar|er|ir)$/u);
      const enCurso = (TEXTOS.acciones.enCurso as Record<string, string>)[accion] ?? "";
      expect(enCurso, accion).toMatch(/^\p{Lu}\p{Ll}+(?:ando|iendo)(?: \p{L}+)?…$/u);
    }
    expect(Object.keys(TEXTOS.acciones.enCurso).sort()).toEqual(acciones.sort());
  });

  it("los motivos de error son la lista cerrada y ninguno lleva datos internos", () => {
    expect(Object.keys(TEXTOS.motivosDeError).sort()).toEqual([
      "desconocido",
      "fallo_servidor",
      "respuesta_no_valida",
      "sesion_no_valida",
      "sin_conexion",
      "tarda_demasiado",
    ]);
    const textos = Object.values(TEXTOS.motivosDeError);
    expect(new Set(textos).size).toBe(textos.length);
    for (const t of textos) {
      expect(t).not.toMatch(/\d{3}|stack|exception|digest|\{|\}|undefined|null/i);
    }
    // Datos parciales (REQ-028): los fallos de un bloque dicen «No se ha podido cargar».
    for (const motivo of [
      "fallo_servidor",
      "respuesta_no_valida",
      "tarda_demasiado",
      "desconocido",
    ]) {
      expect((TEXTOS.motivosDeError as Record<string, string>)[motivo]).toMatch(
        /^No se ha podido cargar/,
      );
    }
  });

  it("el texto de sin permiso es genérico: no nombra ni pide ningún recurso", () => {
    const t = Object.values(TEXTOS.sinPermiso).join(" ");
    expect(t).not.toMatch(/\{|\}|%s|\$\{/);
    expect(TEXTOS.sinPermiso.titulo).not.toMatch(/cliente|orden|licencia/i);
  });
});

describe("PRUEBA-003 · leerEstado", () => {
  it("un valor del catálogo da su clave", () => {
    expect(leerEstado("agente", "activo")).toBe("agente.activo");
    expect(leerEstado("agente", "en_pausa")).toBe("agente.en_pausa");
    expect(leerEstado("agente", "con_avisos")).toBe("agente.con_avisos");
    expect(leerEstado("agente", "sin_senal")).toBe("agente.sin_senal");
  });

  it("un valor fuera del catálogo da «desconocido», con «Estado desconocido» en tono neutro (CA-051)", () => {
    const fuera: Array<[unknown, unknown]> = [
      ["agente", "inventado"],
      ["agente", "ACTIVO"],
      ["agente", "activo "],
      ["agente", " activo"],
      ["agente", ""],
      ["agente", "activo\n"],
      ["agente", "__proto__"],
      ["agente", "constructor"],
      ["agente", "toString"],
      ["agente", "desconocido"],
      ["agente", "activo.x"],
      ["agente.activo", ""],
      ["agente", undefined],
      ["agente", null],
      ["agente", 1],
      ["agente", true],
      ["agente", {}],
      ["agente", ["activo"]],
      ["otro", "activo"],
      ["", "activo"],
      ["", ""],
      ["agente.", "activo"],
      ["__proto__", "x"],
      ["constructor", "name"],
      [undefined, "activo"],
      [null, null],
    ];
    for (const [ambito, valor] of fuera) {
      const clave = leerEstado(ambito as string, valor);
      expect(clave, `${String(ambito)} / ${String(valor)}`).toBe("desconocido");
      expect(describirEstado(clave)).toMatchObject({
        palabra: "Estado desconocido",
        tono: "neutro",
      });
    }
  });

  it("el ámbito y el valor no se pueden mezclar para llegar a otra clave", () => {
    // `agente` + `en_pausa` es una clave; `agente.en` + `pausa` o `a` + `gente.en_pausa` no.
    expect(leerEstado("agente.en", "pausa")).toBe("desconocido");
    expect(leerEstado("a", "gente.en_pausa")).toBe("desconocido");
  });

  it("describirEstado cierra en fallo ante una clave que no existe", () => {
    expect(describirEstado("no.existe" as never)).toMatchObject({
      clave: "desconocido",
      palabra: "Estado desconocido",
      tono: "neutro",
    });
    expect(describirEstado("__proto__" as never).clave).toBe("desconocido");
    expect(describirEstado("constructor" as never).clave).toBe("desconocido");
  });
});
