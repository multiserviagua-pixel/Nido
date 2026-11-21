// PRUEBA-013 (diseño 020 §Pruebas): todos los estados del inventario en nueve anchos sin
// desplazamiento horizontal; ancho máximo en 1920 y 2560; 375 por 667 en vertical y horizontal;
// ventana de 640 y de 320 px (zum al 200 % y al 400 % sobre 1280); espaciado de texto de la norma;
// el zum no está bloqueado; diálogo a 568 por 320 y a 320 por 256; 999.999.999 completa a 320;
// nombre de 120 caracteres sin solapes. CA-006, CA-032, CA-049, CA-050, CA-053.
// Generada sobre `m/inventario.ts`: lo que aún no tiene entrada queda anotado como «no ejecutada».
import { expect, test } from "@playwright/test";
import { ESTADOS, abrirEstado, anotarPendiente, estadosDe } from "./apoyo/estados";
import {
  inyectarEspaciadoDeTexto,
  leerViewport,
  medirDesborde,
  medirRecortes,
  medirSolapes,
} from "./apoyo/medidas";

const ANCHOS = [320, 375, 414, 768, 1024, 1280, 1440, 1920, 2560] as const;
const ALTO = 800;
/** REQ-008: 1440 px de contenido, sin contar el menú; lo fija el armazón (T-010 (a)). */
const ANCHO_MAXIMO = 1440;

/*
 * CONVENCIÓN DE NOMBRES que T-010 debe respetar en `m/inventario.ts` (los casos de abajo se
 * eligen por la clave de la entrada o del estado; un nombre distinto los dejaría sin ejecutar
 * sin que nada fallara, y por eso hay pruebas centinela más abajo):
 *   - armazón y vistas de ejemplo: la clave de la entrada empieza por `armazon` o `vista`;
 *   - diálogo: la clave de la entrada contiene `dialogo`;
 *   - cifra grande (999.999.999): la clave del estado contiene `999`;
 *   - nombre de 120 caracteres: la clave del estado contiene `120` o `largo`.
 * Si T-010 prefiere otros nombres, cambia aquí las expresiones y los centinelas a la vez.
 */
const CON_ARMAZON = /^(armazon|vista)/;
const DIALOGO = /dialogo/;
const CIFRA_GRANDE = /999/;
const NOMBRE_LARGO = /120|largo/;

type Candidato = { entrada: string; estado: string };

/** Entradas o estados que por su nombre parecen de una categoría pero que sus casos no recogen. */
function sinCaso(estados: readonly Candidato[]): string[] {
  const fallos: string[] = [];
  for (const e of estados) {
    const id = `${e.entrada}/${e.estado}`;
    if (/armaz|vista|shell|layout/i.test(e.entrada) && !CON_ARMAZON.test(e.entrada)) {
      fallos.push(`${id}: parece armazón o vista y no empieza por armazon ni vista`);
    }
    if (/dialog|modal/i.test(e.entrada) && !DIALOGO.test(e.entrada)) {
      fallos.push(`${id}: parece un diálogo y su entrada no contiene dialogo`);
    }
    if (/cifra|grande|mill|big/i.test(e.estado) && !CIFRA_GRANDE.test(e.estado)) {
      fallos.push(`${id}: parece una cifra grande y su estado no contiene 999`);
    }
    if (/nombre|long|extens/i.test(e.estado) && !NOMBRE_LARGO.test(e.estado)) {
      fallos.push(`${id}: parece un nombre largo y su estado no contiene 120 ni largo`);
    }
  }
  return fallos;
}

test("centinela: ninguna entrada del inventario queda fuera de los casos por nombre", () => {
  expect(sinCaso(ESTADOS), "entradas cuyo nombre no sigue la convención de anchos.spec.ts").toEqual(
    [],
  );
});

test("control del centinela: detecta un nombre fuera de la convención y admite los correctos", () => {
  const mal = [
    { entrada: "layout-principal", estado: "x" },
    { entrada: "modal-confirmar", estado: "x" },
    { entrada: "tarjeta", estado: "cifra-enorme" },
    { entrada: "tarjeta", estado: "nombre-extenso" },
  ];
  expect(sinCaso(mal)).toHaveLength(4);
  const bien = [
    { entrada: "armazon", estado: "x" },
    { entrada: "vista-resumen", estado: "x" },
    { entrada: "dialogo-confirmar", estado: "x" },
    { entrada: "tarjeta", estado: "cifra-999999999" },
    { entrada: "tarjeta", estado: "nombre-120" },
    { entrada: "tabla", estado: "nombre-largo" },
  ];
  expect(sinCaso(bien)).toEqual([]);
});

test("el inventario tiene al menos un estado que recorrer", () => {
  expect(ESTADOS.length).toBeGreaterThan(0);
});

for (const estado of ESTADOS) {
  test.describe(`PRUEBA-013 · ${estado.etiqueta}`, () => {
    test("sin desplazamiento horizontal en los nueve anchos", async ({ page }) => {
      await abrirEstado(page, estado);
      for (const ancho of ANCHOS) {
        await page.setViewportSize({ width: ancho, height: ALTO });
        const d = await medirDesborde(page);
        expect(d, `${ancho} px: desplazamiento horizontal`).toEqual({ sobra: 0, fuera: [] });
      }
    });

    test("ancho máximo del contenido en 1920 y 2560 px", async ({ page }) => {
      await abrirEstado(page, estado);
      if (!CON_ARMAZON.test(estado.entrada)) {
        anotarPendiente(
          test.info(),
          `ancho máximo de 1440 px de ${estado.etiqueta}: la página no está dentro del armazón`,
          "T-010 (a) para el armazón y las vistas de ejemplo",
        );
        return;
      }
      for (const ancho of [1920, 2560]) {
        await page.setViewportSize({ width: ancho, height: ALTO });
        const contenido = await page
          .locator("main")
          .first()
          .evaluate((e) => e.getBoundingClientRect().width);
        expect(contenido, `${ancho} px: ancho del contenido`).toBeLessThanOrEqual(ANCHO_MAXIMO);
      }
    });

    test("375 por 667 en vertical y en horizontal", async ({ page }) => {
      await abrirEstado(page, estado);
      for (const [ancho, alto] of [
        [375, 667],
        [667, 375],
      ] as const) {
        await page.setViewportSize({ width: ancho, height: alto });
        expect(await medirDesborde(page), `${ancho}x${alto}`).toEqual({ sobra: 0, fuera: [] });
        expect(await medirRecortes(page), `${ancho}x${alto}: recortes`).toEqual([]);
      }
    });

    test("zum al 200 % y al 400 % sobre 1280 (ventana de 640 y de 320 px)", async ({ page }) => {
      await abrirEstado(page, estado);
      for (const [ancho, alto] of [
        [640, 400],
        [320, 200],
      ] as const) {
        await page.setViewportSize({ width: ancho, height: alto });
        expect(await medirDesborde(page), `${ancho} px`).toEqual({ sobra: 0, fuera: [] });
        expect(await medirRecortes(page), `${ancho} px: recortes`).toEqual([]);
      }
    });

    test("espaciado de texto de la norma 1.4.12 sin desplazamiento ni recortes", async ({
      page,
    }) => {
      await abrirEstado(page, estado);
      await inyectarEspaciadoDeTexto(page);
      for (const ancho of [320, 1280]) {
        await page.setViewportSize({ width: ancho, height: ALTO });
        expect(await medirDesborde(page), `${ancho} px`).toEqual({ sobra: 0, fuera: [] });
        expect(await medirRecortes(page), `${ancho} px: recortes`).toEqual([]);
        expect(await medirSolapes(page), `${ancho} px: solapes`).toEqual([]);
      }
    });

    test("el zum no está bloqueado", async ({ page }) => {
      await abrirEstado(page, estado);
      const viewport = (await leerViewport(page)).replace(/\s/g, "").toLowerCase();
      expect(viewport).not.toContain("user-scalable=no");
      expect(viewport).not.toContain("user-scalable=0");
      const maximo = /maximum-scale=([0-9.]+)/.exec(viewport);
      if (maximo !== null) expect(Number(maximo[1])).toBeGreaterThanOrEqual(5);
    });
  });
}

// Casos que dependen de una entrada concreta del inventario (diálogo, cifra grande, nombre largo).
test.describe("PRUEBA-013 · casos con entrada propia en el inventario", () => {
  const dialogos = estadosDe(DIALOGO);
  const cifrasGrandes = ESTADOS.filter((e) => CIFRA_GRANDE.test(e.estado));
  const nombresLargos = ESTADOS.filter((e) => NOMBRE_LARGO.test(e.estado));

  test("cobertura: lo que aún no tiene entrada en el inventario", () => {
    if (dialogos.length === 0) {
      anotarPendiente(test.info(), "diálogo a 568 por 320 y a 320 por 256", "T-010 (diálogo)");
    }
    if (cifrasGrandes.length === 0) {
      anotarPendiente(test.info(), "999.999.999 completa a 320 px", "T-010 (tarjeta de cifra)");
    }
    if (nombresLargos.length === 0) {
      anotarPendiente(
        test.info(),
        "nombre de 120 caracteres sin solapes",
        "T-010 (armazón, tarjeta, tabla)",
      );
    }
  });

  for (const estado of dialogos) {
    for (const [ancho, alto] of [
      [568, 320],
      [320, 256],
    ] as const) {
      test(`${estado.etiqueta} · diálogo a ${ancho} por ${alto}`, async ({ page }) => {
        await page.setViewportSize({ width: ancho, height: alto });
        await abrirEstado(page, estado);
        const cuadro = page.locator('dialog[open], [role="dialog"]').first();
        await expect(cuadro).toBeVisible();
        const r = await cuadro.evaluate((e) => {
          const c = e.getBoundingClientRect();
          const s = getComputedStyle(e);
          return {
            dentro:
              c.left >= -1 &&
              c.top >= -1 &&
              c.right <= window.innerWidth + 1 &&
              c.bottom <= window.innerHeight + 1,
            seDesplaza:
              e.scrollHeight <= e.clientHeight + 1 || ["auto", "scroll"].includes(s.overflowY),
          };
        });
        expect(r.dentro, "el diálogo cabe en la ventana").toBe(true);
        expect(r.seDesplaza, "lo que no cabe se desplaza dentro del diálogo").toBe(true);
        expect(await medirDesborde(page)).toEqual({ sobra: 0, fuera: [] });
      });
    }
  }

  for (const estado of cifrasGrandes) {
    test(`${estado.etiqueta} · cifra completa a 320 px`, async ({ page }) => {
      await page.setViewportSize({ width: 320, height: ALTO });
      await abrirEstado(page, estado);
      await expect(page.getByText("999.999.999").first()).toBeVisible();
      expect(await medirDesborde(page)).toEqual({ sobra: 0, fuera: [] });
      expect(await medirRecortes(page)).toEqual([]);
    });
  }

  for (const estado of nombresLargos) {
    test(`${estado.etiqueta} · nombre largo sin solapes ni recortes`, async ({ page }) => {
      for (const ancho of [320, 1280]) {
        await page.setViewportSize({ width: ancho, height: ALTO });
        await abrirEstado(page, estado);
        expect(await medirSolapes(page), `${ancho} px: solapes`).toEqual([]);
        expect(await medirRecortes(page), `${ancho} px: recortes`).toEqual([]);
        expect(await medirDesborde(page), `${ancho} px: desplazamiento`).toEqual({
          sobra: 0,
          fuera: [],
        });
      }
    });
  }
});
