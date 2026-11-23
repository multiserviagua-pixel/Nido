// PRUEBA-015 (formulario: etiquetas, obligatorio con palabra, errores, foco al primero, lo escrito se
// conserva, error de campo del servidor, cuatro resultados de la acción, doble envío y plazo de
// 30 s), PRUEBA-019 (navegador en inglés), PRUEBA-017 (texto hostil escrito en los campos),
// PRUEBA-018 (lo escrito solo en el cuerpo), PRUEBA-013 (anchos, 120 caracteres, espaciado, zum),
// PRUEBA-021 (solo con teclado), PRUEBA-014 (colores forzados), PRUEBA-020 (tema) y PRUEBA-025
// (axe). CA-006, CA-013, CA-014, CA-017, CA-027, CA-041, CA-045; REQ-019, REQ-020, REQ-057, REQ-073,
// REQ-074, REQ-080.
// Recorre la entrada `formulario` del inventario. El servidor es simulado en la propia página: la
// respuesta se elige con el selector «Respuesta simulada del servidor».
import { expect, test, type Locator, type Page } from "@playwright/test";
import { ESTADOS, abrirEstado, type EstadoDePrueba } from "./apoyo/estados";
import { ALTO_POR_DEFECTO, TEMAS, comprobarAccesibilidad } from "./configuracion-interfaz";
import {
  inyectarEspaciadoDeTexto,
  medirDesborde,
  medirRecortes,
  medirSolapes,
} from "./apoyo/medidas";
import { TEXTOS } from "../../../src/components/textos";

const FORMULARIOS = ESTADOS.filter((e) => e.entrada === "formulario");
const estado = (clave: string): EstadoDePrueba => {
  const e = FORMULARIOS.find((x) => x.estado === clave);
  if (e === undefined) throw new Error(`falta el estado ${clave} del inventario`);
  return e;
};

const F = TEXTOS.formulario;
const E = F.ejemplo;
const campo = (page: Page, clave: string): Locator => page.locator(`[id$="-${clave}"]`);
const errorDe = (page: Page, clave: string): Locator =>
  page.locator(`[data-error-de-campo="${clave}"]`);
const contador = (page: Page, nombre: "envios" | "hechas" | "relecturas" | "cuerpo"): Locator =>
  page.locator(`[data-contador="${nombre}"]`);
const guardar = (page: Page): Locator => page.getByRole("button", { name: E.guardar });
const enCurso = (page: Page): Locator => page.getByRole("button", { name: E.guardando });
const resultado = (page: Page): Locator => page.locator("form [data-resultado]");
const resumen = (page: Page): Locator => page.locator("[data-resumen-errores]");
const cortes = (page: Page): Locator => page.locator('[data-anunciador="cortes"]');
const radio = (page: Page, nombre: string): Locator => page.getByRole("radio", { name: nombre });
const TEXTO_RESUMEN_4 = `${F.resumenAntes} 4 ${F.resumenDespues}`;

async function abrir(page: Page, e: EstadoDePrueba): Promise<void> {
  await abrirEstado(page, e);
  // Next hidrata los controles después de pintarlos: se espera a que respondan.
  await page.waitForLoadState("networkidle");
  await expect(page.getByRole("form", { name: E.nombreDelFormulario })).toBeVisible();
}

async function conRespuesta(page: Page, respuesta: string): Promise<void> {
  await page.locator("#respuesta-simulada").selectOption(respuesta);
}

/** Rellena lo obligatorio de la ficha con datos ficticios. */
async function rellenar(page: Page, nombre = "Cliente ficticio"): Promise<void> {
  await campo(page, "nombre").fill(nombre);
  await campo(page, "plan").selectOption("profesional");
  await radio(page, E.periodicidadDiaria).check();
  await campo(page, "condiciones").check();
}

/** Los bloques de texto del formulario no se pisan entre sí (los contadores de la propia página de
 * la muestra no son del formulario). */
async function solapesDelFormulario(page: Page): Promise<string[]> {
  return page.locator("form").evaluate((f) => {
    const cajas = [...f.querySelectorAll("label, legend, p, button, select, textarea, input")].map(
      (e) => ({ t: (e.textContent ?? e.id).slice(0, 24), r: e.getBoundingClientRect() }),
    );
    const fallos: string[] = [];
    for (let i = 0; i < cajas.length; i += 1) {
      for (let j = i + 1; j < cajas.length; j += 1) {
        const a = cajas[i]!.r;
        const b = cajas[j]!.r;
        const dx = Math.min(a.right, b.right) - Math.max(a.left, b.left);
        const dy = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
        if (dx > 1 && dy > 1) fallos.push(`${cajas[i]!.t} / ${cajas[j]!.t}`);
      }
    }
    return fallos;
  });
}

const tieneInvisibles = (texto: string): boolean =>
  [...texto].some((c) => {
    const n = c.codePointAt(0) ?? 0;
    return (
      (n < 32 && n !== 10 && n !== 13 && n !== 9) ||
      (n >= 0x202a && n <= 0x202e) ||
      (n >= 0x2066 && n <= 0x2069) ||
      n === 0x200b
    );
  });

test("hay entradas que recorrer: el formulario tiene sus siete estados en el inventario", () => {
  expect(FORMULARIOS.map((d) => d.estado).sort()).toEqual(
    [
      "conexion-perdida",
      "enviado-vacio",
      "enviando",
      "error-servidor",
      "hecho",
      "inicial",
      "tipos-de-campo",
    ].sort(),
  );
});

test.describe("PRUEBA-015 · etiquetas y obligatorios (CA-014, REQ-019)", () => {
  test("todo control tiene su etiqueta visible y permanente; los obligatorios lo dicen con la palabra", async ({
    page,
  }) => {
    await abrir(page, estado("tipos-de-campo"));
    const controles = await page
      .locator("form input, form select, form textarea")
      .evaluateAll((xs) =>
        xs.map((x) => {
          const el = x as HTMLInputElement;
          const grupo = el.type === "radio" ? el.closest("fieldset") : null;
          const rotulo = grupo ? grupo.querySelector("legend") : (el.labels?.[0] ?? null);
          const r = rotulo?.getBoundingClientRect();
          return {
            id: el.id,
            tipo: el.type,
            rotulo: (rotulo?.textContent ?? "").replace(/\s+/g, " ").trim(),
            visible: r !== undefined && r.width > 0 && r.height > 0,
            requeridoNativo: el.required,
            requeridoAria: (grupo ?? el).getAttribute("aria-required") === "true",
          };
        }),
      );
    // 12 campos: 2 de texto, 2 de texto largo, 2 de selección, 2 grupos de 2 radios, 2 casillas y
    // 2 búsquedas: 14 controles.
    expect(controles.length).toBe(14);
    for (const c of controles) {
      expect(c.rotulo, c.id).not.toBe("");
      expect(c.visible, `${c.id}: etiqueta visible`).toBe(true);
      expect(c.requeridoNativo, `${c.id}: sin required nativo`).toBe(false);
      if (c.requeridoAria) expect(c.rotulo, c.id).toContain(F.obligatorio);
      else expect(c.rotulo, c.id).not.toContain(F.obligatorio);
    }
    // Obligatorios: texto, texto largo, selección, grupo (2 radios), casilla y búsqueda.
    expect(controles.filter((c) => c.requeridoAria).length).toBe(7);
    await expect(page.locator("form")).toHaveJSProperty("noValidate", true);
  });

  test("la ayuda y el límite forman parte de la descripción accesible del campo", async ({
    page,
  }) => {
    await abrir(page, estado("inicial"));
    await expect(campo(page, "nombre")).toHaveAccessibleName(`${E.nombre} ${F.obligatorio}`);
    await expect(campo(page, "nombre")).toHaveAccessibleDescription(
      `${E.nombreAyuda} Hasta 120 caracteres.`,
    );
    await expect(
      page.getByRole("radiogroup", { name: `${E.periodicidad} ${F.obligatorio}` }),
    ).toBeVisible();
    await expect(campo(page, "busqueda")).toHaveAttribute("role", "searchbox");
  });
});

test.describe("PRUEBA-015 · errores, foco y lo escrito (CA-014, REQ-020)", () => {
  test("enviado vacío: un error junto a cada obligatorio, enlazado, anunciado, con el foco en el primero", async ({
    page,
  }) => {
    await abrir(page, estado("inicial"));
    await guardar(page).click();
    // La región cortés guarda el texto menos de un segundo: se mira lo primero.
    await expect(cortes(page)).toHaveText(TEXTO_RESUMEN_4);
    for (const clave of ["nombre", "plan", "periodicidad", "condiciones"]) {
      await expect(errorDe(page, clave), clave).toBeVisible();
    }
    await expect(page.locator("[data-error-de-campo]")).toHaveCount(4);
    await expect(errorDe(page, "nombre")).toHaveText(F.errores.obligatorio);
    await expect(errorDe(page, "condiciones")).toHaveText(F.errores.sin_marcar);
    // El primero tiene el foco y su nombre accesible incluye el error.
    await expect(campo(page, "nombre")).toBeFocused();
    await expect(campo(page, "nombre")).toHaveAttribute("aria-invalid", "true");
    await expect(campo(page, "nombre")).toHaveAccessibleDescription(
      new RegExp(F.errores.obligatorio.replace(".", "\\.")),
    );
    await expect(campo(page, "plan")).toHaveAttribute("aria-invalid", "true");
    await expect(campo(page, "condiciones")).toHaveAttribute("aria-invalid", "true");
    await expect(
      page.getByRole("radiogroup", { name: new RegExp(E.periodicidad) }),
    ).toHaveAttribute("aria-invalid", "true");
    // El opcional vacío no falla.
    await expect(campo(page, "codigo")).not.toHaveAttribute("aria-invalid", "true");
    // Resumen visible y anunciado, sin enviar nada.
    await expect(resumen(page)).toHaveText(TEXTO_RESUMEN_4);
    await expect(contador(page, "envios")).toHaveText("0");
  });

  test("lo escrito se conserva y el foco va al primer error que queda", async ({ page }) => {
    await abrir(page, estado("inicial"));
    await campo(page, "nombre").fill("Cliente ficticio");
    await campo(page, "descripcion").fill("Un texto\nen dos líneas");
    await campo(page, "avisos").check();
    await guardar(page).click();
    await expect(campo(page, "plan")).toBeFocused();
    await expect(campo(page, "nombre")).toHaveValue("Cliente ficticio");
    await expect(campo(page, "descripcion")).toHaveValue("Un texto\nen dos líneas");
    await expect(campo(page, "avisos")).toBeChecked();
    await expect(page.locator("[data-error-de-campo]")).toHaveCount(3);
    await expect(resumen(page)).toHaveText(`${F.resumenAntes} 3 ${F.resumenDespues}`);
  });

  test("al corregir un campo se quita su error y, al quedar uno, el resumen lo dice en singular", async ({
    page,
  }) => {
    await abrir(page, estado("inicial"));
    await guardar(page).click();
    await rellenar(page);
    await expect(page.locator("[data-error-de-campo]")).toHaveCount(0);
    await campo(page, "condiciones").uncheck();
    await expect(resumen(page)).toHaveText(F.resumenUno);
    await expect(errorDe(page, "condiciones")).toBeVisible();
  });

  test("la página de «enviado vacío» llega con los errores ya pintados y sin mover el foco", async ({
    page,
  }) => {
    await abrir(page, estado("enviado-vacio"));
    await expect(page.locator("[data-error-de-campo]")).toHaveCount(4);
    await expect(resumen(page)).toHaveText(TEXTO_RESUMEN_4);
    expect(await page.evaluate(() => document.activeElement?.tagName)).toBe("BODY");
  });

  test("con el límite de caracteres: no se escribe de más y el límite se dice", async ({
    page,
  }) => {
    await abrir(page, estado("inicial"));
    await campo(page, "nombre").pressSequentially("x".repeat(130));
    expect((await campo(page, "nombre").inputValue()).length).toBe(120);
    await expect(page.locator(`[id$="-nombre-limite"]`)).toHaveText("Hasta 120 caracteres.");
  });
});

test.describe("PRUEBA-015 · resultados de la acción en el formulario (CA-017, CA-045, REQ-073, REQ-074, REQ-078)", () => {
  test("hecha: se envía una vez, se dice con su texto, se relee y lo escrito se conserva", async ({
    page,
  }) => {
    await abrir(page, estado("hecho"));
    await rellenar(page);
    await campo(page, "descripcion").fill("Notas del cliente");
    await guardar(page).click();
    await expect(cortes(page)).toHaveText(TEXTOS.acciones.resultado.hecha);
    await expect(resultado(page)).toHaveText(TEXTOS.acciones.resultado.hecha);
    await expect(resultado(page)).toHaveAttribute("data-resultado", "hecha");
    await expect(contador(page, "envios")).toHaveText("1");
    await expect(contador(page, "hechas")).toHaveText("1");
    await expect(contador(page, "relecturas")).toHaveText("1");
    await expect(campo(page, "nombre")).toHaveValue("Cliente ficticio");
    await expect(campo(page, "descripcion")).toHaveValue("Notas del cliente");
    await expect(page.locator("[data-error-de-campo]")).toHaveCount(0);
    await expect(guardar(page)).toBeFocused();
    // Un éxito ya dicho no se queda junto a un texto nuevo.
    await campo(page, "nombre").fill("Otro cliente");
    await expect(resultado(page)).toHaveCount(0);
  });

  test("el cuerpo del envío lleva lo escrito, y la dirección no cambia ni se guarda nada", async ({
    page,
  }) => {
    const peticiones: string[] = [];
    await abrir(page, estado("hecho"));
    const direccion = page.url();
    page.on("request", (r) => peticiones.push(r.url()));
    await rellenar(page, "TESTIGO-ESCRITO-1234");
    await guardar(page).click();
    await expect(contador(page, "envios")).toHaveText("1");
    await expect(contador(page, "cuerpo")).toContainText("TESTIGO-ESCRITO-1234");
    expect(page.url()).toBe(direccion);
    expect(peticiones.filter((u) => u.includes("TESTIGO"))).toEqual([]);
    const almacen = await page.evaluate(() => ({
      local: JSON.stringify({ ...localStorage }),
      sesion: JSON.stringify({ ...sessionStorage }),
      cookies: document.cookie,
      historial: history.length,
    }));
    expect(almacen.local + almacen.sesion + almacen.cookies).not.toContain("TESTIGO");
    expect(almacen.local).toBe("{}");
    expect(almacen.sesion).toBe("{}");
  });

  test("error del servidor en un campo: junto a su campo, con texto fijo, foco en él y lo escrito se conserva", async ({
    page,
  }) => {
    await abrir(page, estado("error-servidor"));
    await rellenar(page);
    await campo(page, "descripcion").fill("Notas");
    await guardar(page).click();
    await expect(errorDe(page, "nombre")).toHaveText(F.errores.nombre_en_uso);
    await expect(campo(page, "nombre")).toHaveAttribute("aria-invalid", "true");
    await expect(campo(page, "nombre")).toBeFocused();
    await expect(campo(page, "nombre")).toHaveAccessibleDescription(
      new RegExp(F.errores.nombre_en_uso),
    );
    await expect(resultado(page)).toHaveText(
      `${TEXTOS.acciones.resultado.rechazada} ${TEXTOS.acciones.motivosDeRechazo.estado_distinto}`,
    );
    await expect(resultado(page)).toHaveAttribute("data-resultado", "rechazada");
    await expect(campo(page, "descripcion")).toHaveValue("Notas");
    await expect(resumen(page)).toHaveText(F.resumenUno);
    await expect(contador(page, "hechas")).toHaveText("0");
    // Al tocar el campo, su error del servidor deja de valer; se puede volver a enviar.
    await campo(page, "nombre").fill("Otro nombre");
    await expect(errorDe(page, "nombre")).toHaveCount(0);
    await guardar(page).click();
    await expect(contador(page, "envios")).toHaveText("2");
    await expect(errorDe(page, "nombre")).toBeVisible();
  });

  for (const caso of ["campo_desconocido", "codigo_desconocido"]) {
    test(`${caso}: se pinta el error general con texto fijo y nunca lo recibido`, async ({
      page,
    }) => {
      await abrir(page, estado("hecho"));
      await conRespuesta(page, caso);
      await rellenar(page);
      await guardar(page).click();
      await expect(resultado(page)).toContainText(F.errorGeneral);
      await expect(resultado(page)).toHaveAttribute("data-resultado", "rechazada");
      await expect(page.locator("[data-error-de-campo]")).toHaveCount(0);
      const html = await page.content();
      const cuerpo = await page.locator("body").innerText();
      for (const t of [html, cuerpo]) {
        expect(t).not.toContain("TESTIGO_CAMPO_DEL_SERVIDOR");
        expect(t).not.toContain("TESTIGO_CODIGO_DEL_SERVIDOR");
      }
      await expect(campo(page, "nombre")).toHaveValue("Cliente ficticio");
    });
  }

  test("motivo de la lista: el mensaje lo dice con su texto fijo", async ({ page }) => {
    await abrir(page, estado("hecho"));
    await conRespuesta(page, "motivo_conocido");
    await rellenar(page);
    await guardar(page).click();
    await expect(resultado(page)).toHaveText(
      `${TEXTOS.acciones.resultado.rechazada} ${TEXTOS.acciones.motivosDeRechazo.estado_distinto}`,
    );
  });

  test("sin permiso (401): no se afirma ningún cambio y la vista relee", async ({ page }) => {
    await abrir(page, estado("hecho"));
    await conRespuesta(page, "no_permitida");
    await rellenar(page);
    await guardar(page).click();
    await expect(resultado(page)).toHaveText(TEXTOS.acciones.noPermitida);
    await expect(contador(page, "relecturas")).toHaveText("1");
    await expect(contador(page, "hechas")).toHaveText("0");
    await expect(page.locator("form")).not.toContainText(TEXTOS.acciones.resultado.hecha);
    await expect(campo(page, "nombre")).toHaveValue("Cliente ficticio");
  });

  for (const respuesta of ["servidor", "ilegible", "desconocida"]) {
    test(`respuesta «${respuesta}»: 0 mensajes de éxito; el mensaje permanece, sin reintento, con «Comprobar estado»`, async ({
      page,
    }) => {
      await abrir(page, estado("hecho"));
      await conRespuesta(page, respuesta);
      await rellenar(page);
      await guardar(page).click();
      await expect(resultado(page)).toHaveText(TEXTOS.acciones.resultado.incierta);
      await expect(resultado(page)).toHaveAttribute("data-resultado", "incierta");
      await expect(page.locator("form")).not.toContainText(TEXTOS.acciones.resultado.hecha);
      await page.waitForTimeout(600);
      await expect(contador(page, "envios")).toHaveText("1");
      await expect(contador(page, "relecturas")).toHaveText("0");
      await expect(campo(page, "nombre")).toHaveValue("Cliente ficticio");
      await page.getByRole("button", { name: TEXTOS.acciones.resultado.comprobarEstado }).click();
      await expect(contador(page, "relecturas")).toHaveText("1");
      // Escribir no hace desaparecer el aviso de que no se sabe si se aplicó.
      await campo(page, "descripcion").fill("más");
      await expect(resultado(page)).toHaveText(TEXTOS.acciones.resultado.incierta);
    });
  }

  test("conexión perdida al enviar: no se afirma nada, lo escrito se conserva y no se reintenta solo", async ({
    page,
  }) => {
    await abrir(page, estado("conexion-perdida"));
    await rellenar(page);
    await campo(page, "descripcion").fill("Lo escrito antes de perder la conexión");
    await guardar(page).click();
    await expect(resultado(page)).toHaveText(TEXTOS.acciones.resultado.incierta);
    // La región cortés dice el mensaje una vez (después se vacía).
    await expect(cortes(page)).toHaveText(TEXTOS.acciones.resultado.incierta);
    await expect(page.locator("form")).not.toContainText(TEXTOS.acciones.resultado.hecha);
    await expect(campo(page, "nombre")).toHaveValue("Cliente ficticio");
    await expect(campo(page, "descripcion")).toHaveValue("Lo escrito antes de perder la conexión");
    await page.waitForTimeout(800);
    await expect(contador(page, "envios")).toHaveText("1");
  });

  test("dos pulsaciones seguidas, Intro repetido y Espacio dan un solo envío; el botón lo dice", async ({
    page,
  }) => {
    await abrir(page, estado("enviando"));
    await rellenar(page);
    await guardar(page).dblclick();
    await expect(contador(page, "envios")).toHaveText("1");
    await expect(enCurso(page)).toHaveAttribute("aria-disabled", "true");
    await enCurso(page).focus();
    await page.keyboard.press("Enter");
    await page.keyboard.press("Enter");
    await page.keyboard.press("Space");
    await campo(page, "nombre").focus();
    await page.keyboard.press("Enter");
    await page.keyboard.press("Enter");
    await expect(contador(page, "envios")).toHaveText("1");
    await expect(page.locator("form")).not.toContainText(TEXTOS.acciones.resultado.hecha);
  });

  test("Intro en un campo de texto envía el formulario", async ({ page }) => {
    await abrir(page, estado("hecho"));
    await rellenar(page);
    await campo(page, "nombre").focus();
    await page.keyboard.press("Enter");
    await expect(contador(page, "envios")).toHaveText("1");
    await expect(resultado(page)).toHaveText(TEXTOS.acciones.resultado.hecha);
  });

  test("sin respuesta: a los 30 s pasa a incierta, libera el botón y conserva lo escrito", async ({
    page,
  }) => {
    await page.clock.install();
    await abrir(page, estado("enviando"));
    await rellenar(page);
    await campo(page, "descripcion").fill("Esperando");
    await guardar(page).click();
    await expect(enCurso(page)).toBeVisible();
    await page.clock.fastForward(29_000);
    await expect(resultado(page)).toHaveCount(0);
    await page.clock.fastForward(1_500);
    await expect(resultado(page)).toHaveText(TEXTOS.acciones.resultado.incierta);
    await expect(page.locator("form")).not.toContainText(TEXTOS.acciones.resultado.hecha);
    await expect(guardar(page)).not.toHaveAttribute("aria-disabled", "true");
    await expect(contador(page, "envios")).toHaveText("1");
    await expect(campo(page, "descripcion")).toHaveValue("Esperando");
  });
});

test.describe("PRUEBA-019 · navegador en inglés (CA-014, REQ-080)", () => {
  test.use({ locale: "en-US" });

  test("0 mensajes de validación del navegador y todos los textos en español", async ({ page }) => {
    await abrir(page, estado("inicial"));
    await expect(page.locator("html")).toHaveAttribute("lang", "es");
    await guardar(page).click();
    await expect(page.locator("[data-error-de-campo]")).toHaveCount(4);
    const nativos = await page
      .locator("form input, form select, form textarea")
      .evaluateAll((xs) =>
        xs.map((x) => (x as HTMLInputElement).validationMessage).filter((m) => m !== ""),
      );
    expect(nativos).toEqual([]);
    const textos = await page.locator("[data-error-de-campo]").allInnerTexts();
    expect(textos.sort()).toEqual(
      [
        F.errores.obligatorio,
        F.errores.obligatorio,
        F.errores.obligatorio,
        F.errores.sin_marcar,
      ].sort(),
    );
    const visible = await page.locator("form").innerText();
    expect(visible).not.toMatch(
      /\b(?:Please|required|fill out|this field|Submit|Select an item|Choose)\b/i,
    );
    await expect(page.locator("form select option").first()).toHaveText(F.elegirOpcion);
  });
});

test.describe("PRUEBA-017 · texto hostil escrito en los campos (CA-041, REQ-056)", () => {
  const RLO = String.fromCharCode(0x202e);
  const ZWSP = String.fromCharCode(0x200b);
  const NUL = String.fromCharCode(0);
  const HOSTILES = [
    "<script>window.__hostil = 1</script>",
    '"><img src=x onerror="window.__hostil = 2">',
    `${"java"}${"script:"}window.__hostil = 3`,
    "[pulsa aquí](https://malo.example/phishing)",
    `Ana${RLO} Pérez${ZWSP} (RLO e invisibles)`,
    `${NUL}control`,
    "{{constructor.constructor('1')()}}",
    "<a href=https://malo.example>enlace</a>",
    "&lt;b&gt;entidades&lt;/b&gt; &amp; &#x3c;",
    "a".repeat(120),
  ];

  test("cada cadena se conserva tal cual en el campo, viaja como texto en el cuerpo y no crea nada", async ({
    page,
  }) => {
    const avisos: string[] = [];
    page.on("dialog", (d) => {
      avisos.push(d.message());
      void d.dismiss();
    });
    await abrir(page, estado("hecho"));
    await rellenar(page);
    const peticiones: string[] = [];
    page.on("request", (r) => peticiones.push(r.url()));
    for (const [i, h] of HOSTILES.entries()) {
      await campo(page, "nombre").fill(h);
      await campo(page, "descripcion").fill(h);
      await campo(page, "busqueda").fill(h);
      await guardar(page).click();
      await expect(contador(page, "envios"), `cadena ${i}`).toHaveText(String(i + 1));
      await expect(resultado(page), `cadena ${i}`).toHaveText(TEXTOS.acciones.resultado.hecha);
      // Lo escrito no cambia (salvo lo que el límite de 120 ya cortó).
      expect(await campo(page, "nombre").inputValue(), `cadena ${i}: valor`).toBe(h.slice(0, 120));
      expect(
        await page
          .locator("main script, main img, main iframe, main a, main style, main b")
          .count(),
        `cadena ${i}: elementos nuevos`,
      ).toBe(0);
      expect(
        await page.evaluate(() => (window as unknown as { __hostil?: number }).__hostil),
      ).toBeUndefined();
      // El mensaje y los textos del formulario siguen siendo fijos y sin invisibles.
      expect(tieneInvisibles(await resultado(page).innerText()), `cadena ${i}: invisibles`).toBe(
        false,
      );
    }
    expect(avisos).toEqual([]);
    // Nada de lo escrito sale en la dirección de una petición ni en la de la página.
    expect(
      peticiones.filter((u) => /hostil|script|malo|constructor/i.test(decodeURIComponent(u))),
    ).toEqual([]);
    expect(page.url()).not.toMatch(/hostil|script|malo|constructor|%3C/i);
  });
});

test.describe("PRUEBA-013 · formulario: anchos, 120 caracteres, espaciado y zum (CA-006, REQ-044, REQ-065)", () => {
  test.use({ hasTouch: true });

  for (const e of FORMULARIOS) {
    for (const ancho of [320, 375, 768, 1280]) {
      test(`${e.etiqueta} · ${ancho} px: sin desplazamiento horizontal ni recortes`, async ({
        page,
      }) => {
        await page.setViewportSize({ width: ancho, height: ALTO_POR_DEFECTO });
        await abrir(page, e);
        expect(await medirDesborde(page)).toEqual({ sobra: 0, fuera: [] });
        expect(await medirRecortes(page), "recortes").toEqual([]);
        expect(await medirSolapes(page), "solapes").toEqual([]);
      });
    }
  }

  test("con 120 caracteres escritos en el nombre, a 320 px: sin desplazamiento y el valor entero", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 320, height: ALTO_POR_DEFECTO });
    await abrir(page, estado("inicial"));
    await campo(page, "nombre").fill("n".repeat(120));
    await campo(page, "descripcion").fill("d".repeat(500));
    await guardar(page).click();
    expect((await campo(page, "nombre").inputValue()).length).toBe(120);
    expect(await medirDesborde(page)).toEqual({ sobra: 0, fuera: [] });
    expect(await medirRecortes(page)).toEqual([]);
  });

  test("errores a 320 px: el mensaje se parte en líneas, sin solapes ni recortes, con el espaciado de la norma", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 320, height: ALTO_POR_DEFECTO });
    await abrir(page, estado("enviado-vacio"));
    await inyectarEspaciadoDeTexto(page);
    expect(await medirDesborde(page)).toEqual({ sobra: 0, fuera: [] });
    expect(await medirRecortes(page)).toEqual([]);
    expect(await solapesDelFormulario(page)).toEqual([]);
  });

  test("zum al 200 % y al 400 % (ventanas de 640 por 400 y de 320 por 200)", async ({ page }) => {
    for (const [ancho, alto] of [
      [640, 400],
      [320, 200],
    ] as const) {
      await page.setViewportSize({ width: ancho, height: alto });
      await abrir(page, estado("enviado-vacio"));
      expect(await medirDesborde(page), `${ancho} px`).toEqual({ sobra: 0, fuera: [] });
      expect(await medirRecortes(page), `${ancho} px: recortes`).toEqual([]);
    }
  });

  test("objetivos de pulsación: cada control y el botón miden al menos 24 por 24 px", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 320, height: ALTO_POR_DEFECTO });
    await abrir(page, estado("tipos-de-campo"));
    for (const c of await page
      .locator("form input, form select, form textarea, form button")
      .all()) {
      const caja = await c.boundingBox();
      expect(caja, "caja").not.toBeNull();
      expect(caja!.width).toBeGreaterThanOrEqual(24);
      expect(caja!.height).toBeGreaterThanOrEqual(24);
    }
  });

  test("con táctil se toca una casilla, una opción y el botón", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: ALTO_POR_DEFECTO });
    await abrir(page, estado("hecho"));
    await campo(page, "nombre").fill("Cliente ficticio");
    await campo(page, "plan").selectOption("basico");
    await radio(page, E.periodicidadSemanal).tap();
    await campo(page, "condiciones").tap();
    await expect(radio(page, E.periodicidadSemanal)).toBeChecked();
    await expect(campo(page, "condiciones")).toBeChecked();
    await guardar(page).tap();
    await expect(resultado(page)).toHaveText(TEXTOS.acciones.resultado.hecha);
  });
});

test.describe("PRUEBA-021 · el formulario solo con teclado (CA-027)", () => {
  test("el tabulador recorre los campos en orden, con contorno de foco en cada uno", async ({
    page,
  }) => {
    await abrir(page, estado("inicial"));
    await campo(page, "nombre").focus();
    const orden = ["codigo", "descripcion", "plan"];
    const contorno = async (l: Locator): Promise<boolean> =>
      l.evaluate((x) => {
        const s = getComputedStyle(x);
        return s.outlineStyle !== "none" && parseFloat(s.outlineWidth) > 0;
      });
    expect(await contorno(campo(page, "nombre"))).toBe(true);
    for (const clave of orden) {
      await page.keyboard.press("Tab");
      await expect(campo(page, clave)).toBeFocused();
      expect(await contorno(campo(page, clave)), clave).toBe(true);
    }
    // El grupo de radios es una sola parada: entra en el primero y las flechas eligen.
    await page.keyboard.press("Tab");
    await expect(radio(page, E.periodicidadDiaria)).toBeFocused();
    await page.keyboard.press("ArrowDown");
    await expect(radio(page, E.periodicidadSemanal)).toBeFocused();
    await expect(radio(page, E.periodicidadSemanal)).toBeChecked();
    await page.keyboard.press("Tab");
    await expect(campo(page, "avisos")).toBeFocused();
    await page.keyboard.press("Space");
    await expect(campo(page, "avisos")).toBeChecked();
    await page.keyboard.press("Tab");
    await expect(campo(page, "condiciones")).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(campo(page, "busqueda")).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(guardar(page)).toBeFocused();
    expect(await contorno(guardar(page))).toBe(true);
  });

  test("rellenar y enviar con el teclado; el foco no se pierde", async ({ page }) => {
    await abrir(page, estado("hecho"));
    await campo(page, "nombre").focus();
    await page.keyboard.type("Cliente ficticio");
    await campo(page, "plan").focus();
    await page.keyboard.press("ArrowDown");
    await expect(campo(page, "plan")).toHaveValue("basico");
    await radio(page, E.periodicidadDiaria).focus();
    await page.keyboard.press("Space");
    await campo(page, "condiciones").focus();
    await page.keyboard.press("Space");
    await guardar(page).focus();
    await page.keyboard.press("Enter");
    await expect(resultado(page)).toHaveText(TEXTOS.acciones.resultado.hecha);
    await expect(guardar(page)).toBeFocused();
  });

  test("tras un envío con errores, el tabulador sigue desde el primer error", async ({ page }) => {
    await abrir(page, estado("inicial"));
    await guardar(page).focus();
    await page.keyboard.press("Enter");
    await expect(campo(page, "nombre")).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(campo(page, "codigo")).toBeFocused();
  });
});

test.describe("PRUEBA-020 · el tema cambia con lo escrito intacto", () => {
  test("al pasar a oscuro: sin recarga, con lo escrito y con los errores", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "light" });
    await abrir(page, estado("inicial"));
    await campo(page, "nombre").fill("Cliente ficticio");
    await guardar(page).click();
    await expect(errorDe(page, "plan")).toBeVisible();
    await page.evaluate(() => {
      (window as unknown as { __marca: string }).__marca = "sin-recarga";
    });
    const fondoClaro = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    await page.emulateMedia({ colorScheme: "dark" });
    await expect
      .poll(() => page.evaluate(() => getComputedStyle(document.body).backgroundColor))
      .not.toBe(fondoClaro);
    expect(await page.evaluate(() => (window as unknown as { __marca?: string }).__marca)).toBe(
      "sin-recarga",
    );
    await expect(campo(page, "nombre")).toHaveValue("Cliente ficticio");
    await expect(errorDe(page, "plan")).toBeVisible();
  });
});

test.describe("PRUEBA-014 · colores forzados y sin color (REQ-038, CA-034)", () => {
  test("colores forzados: los controles conservan su borde, el foco su contorno y el error su icono y su texto", async ({
    page,
  }) => {
    await page.emulateMedia({ forcedColors: "active" });
    await abrir(page, estado("enviado-vacio"));
    // Texto, selección, área de texto y botón dibujan su borde; casillas y radios los dibuja el
    // navegador con los colores del sistema (aspecto nativo).
    const sinBorde = await page
      .locator('form input[type="text"], form select, form textarea, form button')
      .evaluateAll(
        (xs) => xs.filter((x) => parseFloat(getComputedStyle(x).borderTopWidth) === 0).length,
      );
    expect(sinBorde).toBe(0);
    const sinAspectoNativo = await page
      .locator('form input[type="checkbox"], form input[type="radio"]')
      .evaluateAll((xs) => xs.filter((x) => getComputedStyle(x).appearance === "none").length);
    expect(sinAspectoNativo).toBe(0);
    await expect(page.locator("[data-error-de-campo] svg")).toHaveCount(4);
    await expect(errorDe(page, "nombre")).toHaveText(F.errores.obligatorio);
    await campo(page, "codigo").focus();
    expect(await campo(page, "codigo").evaluate((c) => getComputedStyle(c).outlineStyle)).not.toBe(
      "none",
    );
    // El campo con error se distingue por su texto y su icono, no por el color del borde.
    await expect(campo(page, "nombre")).toHaveAttribute("aria-invalid", "true");
  });

  test("sin color: el error se dice con palabras y con un icono, no solo con el borde", async ({
    page,
  }) => {
    await abrir(page, estado("enviado-vacio"));
    for (const clave of ["nombre", "plan", "periodicidad", "condiciones"]) {
      const caja = errorDe(page, clave);
      await expect(caja).not.toHaveText("");
      await expect(caja.locator('svg[aria-hidden="true"]')).toHaveCount(1);
    }
  });
});

test.describe("PRUEBA-025 · axe sobre el formulario, a 320 y 1280 px, en claro y oscuro", () => {
  for (const clave of ["enviado-vacio", "tipos-de-campo"]) {
    for (const ancho of [320, 1280]) {
      for (const tema of TEMAS) {
        test(`${clave} · ${ancho} px · ${tema}`, async ({ page }) => {
          await page.setViewportSize({ width: ancho, height: ALTO_POR_DEFECTO });
          await page.emulateMedia({ colorScheme: tema });
          await abrir(page, estado(clave));
          await comprobarAccesibilidad(page);
        });
      }
    }
  }

  for (const [clave, respuesta] of [
    ["error-servidor", "campo_conocido"],
    ["conexion-perdida", "sin_conexion"],
  ] as const) {
    for (const ancho of [320, 1280]) {
      for (const tema of TEMAS) {
        test(`tras enviar (${respuesta}) · ${ancho} px · ${tema}`, async ({ page }) => {
          await page.setViewportSize({ width: ancho, height: ALTO_POR_DEFECTO });
          await page.emulateMedia({ colorScheme: tema });
          await abrir(page, estado(clave));
          await rellenar(page);
          await guardar(page).click();
          await expect(resultado(page)).toBeVisible();
          await comprobarAccesibilidad(page);
        });
      }
    }
  }
});
