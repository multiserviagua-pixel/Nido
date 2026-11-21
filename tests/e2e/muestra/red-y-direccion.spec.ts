// PRUEBA-018 (diseño 020 §Pruebas): registro de red de toda la muestra (0 peticiones a otros
// dominios y 0 a rutas propias fuera de `/muestra/` y de los recursos estáticos); almacenamiento
// del navegador vacío; dirección sin nombres, correos ni texto escrito; parámetros de usuario o
// cliente añadidos que no cambian nada; un texto puesto en la dirección, en el fragmento o enviado
// como mensaje entre ventanas que no aparece en la página; e inventario de infracciones de una
// política de contenido estricta en modo de solo informe, sobre todos los estados (se entrega a la
// 021). CA-024, CA-043, CA-044, CA-046. Las cadenas de prueba son ficticias e inertes.
import { writeFileSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";
import { TEXTOS } from "../../../src/components/textos";
import { ESTADOS, abrirEstado, anotarPendiente } from "./apoyo/estados";

/** Origen de la aplicación: el de `baseURL` de la configuración, nunca uno escrito aquí. */
function origenDe(baseURL: string | undefined): string {
  if (baseURL === undefined) throw new Error("la configuración no define baseURL");
  return new URL(baseURL).origin;
}

/** Directiva estricta de solo informe: lo que no sea del propio origen y ningún código en línea. */
const POLITICA_ESTRICTA =
  "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self'; font-src 'self'; " +
  "connect-src 'self'; object-src 'none'; base-uri 'none'; form-action 'self'";

test("el inventario tiene al menos un estado que recorrer", () => {
  expect(ESTADOS.length).toBeGreaterThan(0);
});

/** Registra las peticiones de la página hasta que se pida el resultado. */
function registrarRed(page: Page): { urls: string[] } {
  const registro = { urls: [] as string[] };
  page.on("request", (peticion) => registro.urls.push(peticion.url()));
  return registro;
}

/** Peticiones a otro origen que el de la aplicación. */
function peticionesAjenas(urls: string[], origenPropio: string): string[] {
  return urls.filter((u) => new URL(u).origin !== origenPropio);
}

/**
 * Rutas propias que no son de `/muestra/` ni un recurso estático. De lo de Next solo se admite
 * `/_next/static/` (código y estilos compilados). `/_next/data/` no se admite: con el enrutador de
 * aplicación las navegaciones piden `/muestra/...`, no datos de páginas; si alguna vez hiciera
 * falta, se añade aquí con su motivo y no antes.
 */
function rutasPropiasFuera(urls: string[], origenPropio: string): string[] {
  return urls
    .filter((u) => new URL(u).origin === origenPropio)
    .map((u) => new URL(u).pathname)
    .filter(
      (r) => !(r === "/muestra" || r.startsWith("/muestra/") || r.startsWith("/_next/static/")),
    );
}

/** Todo lo que el navegador guarda para la página abierta. */
async function leerAlmacenamiento(page: Page): Promise<Record<string, unknown>> {
  return page.evaluate(async () => ({
    local: localStorage.length,
    sesion: sessionStorage.length,
    galletasDelDocumento: document.cookie,
    bases: (await indexedDB.databases()).length,
    cachesDeApi: (await caches.keys()).length,
    trabajadores: (await navigator.serviceWorker.getRegistrations()).length,
  }));
}

const ALMACENAMIENTO_VACIO = {
  local: 0,
  sesion: 0,
  galletasDelDocumento: "",
  bases: 0,
  cachesDeApi: 0,
  trabajadores: 0,
};

/**
 * Envía el testigo por todas las vías de entrada que no son la dirección. No lanza un `popstate`
 * artificial: el enrutador de Next lo toma por una navegación ajena y recarga la página, y la
 * recarga borraría lo que la prueba quiere ver (la comprobación pasaría en vacío).
 */
async function lanzarTestigo(page: Page, testigo: string): Promise<string> {
  await page.evaluate((t) => {
    window.postMessage(t, "*");
    window.postMessage({ texto: t, nombre: t, cliente: t }, "*");
    location.hash = `#${t}`;
    history.pushState({ texto: t }, "", `#${t}-historial`);
    window.dispatchEvent(new HashChangeEvent("hashchange"));
    window.dispatchEvent(new StorageEvent("storage", { key: "t", newValue: t }));
  }, testigo);
  // Un mensaje entre ventanas de verdad: la página abre una ventana con la misma dirección, espera
  // a que cargue, le envía el mensaje y la cierra. Devuelve el contenido de esa ventana.
  const [ventana] = await Promise.all([
    page.waitForEvent("popup"),
    page.evaluate((url) => {
      (window as unknown as { __ventana: Window | null }).__ventana = window.open(url, "_blank");
    }, page.url().split("#")[0]),
  ]);
  await ventana.waitForLoadState("load");
  await page.evaluate((t) => {
    (window as unknown as { __ventana: Window | null }).__ventana?.postMessage(t, "*");
  }, testigo);
  await page.waitForTimeout(500);
  const contenido = await ventana.content();
  await ventana.close();
  return contenido;
}

/** Enlaces con consulta o con fragmento. Solo se admite el del salto al contenido (fragmento de un id que existe). */
async function enlacesIndebidos(page: Page): Promise<string[]> {
  return page.evaluate((saltar) => {
    const malos: string[] = [];
    for (const a of document.querySelectorAll<HTMLAnchorElement>("a[href]")) {
      const href = a.getAttribute("href")!;
      if (href.trim() === "") {
        // Un href vacío apunta a la propia dirección, con su consulta y su fragmento.
        if (location.search !== "")
          malos.push(`consulta: ${(a.textContent ?? "").trim().slice(0, 30)} → (vacío)`);
        if (location.hash !== "")
          malos.push(`fragmento: ${(a.textContent ?? "").trim().slice(0, 30)} → (vacío)`);
        continue;
      }
      // Se resuelve contra la ruta sin consulta: «#otro» en una página con consulta no es un enlace con consulta.
      const u = new URL(a.getAttribute("href")!, location.origin + location.pathname);
      const nombre = `${(a.textContent ?? "").trim().slice(0, 30)} → ${a.getAttribute("href")}`;
      if (u.search !== "") malos.push(`consulta: ${nombre}`);
      if (u.hash !== "") {
        // Único fragmento admisible: el enlace «Saltar al contenido» hacia un id de esta página.
        const esSalto =
          (a.textContent ?? "").trim() === saltar &&
          u.pathname === location.pathname &&
          document.getElementById(decodeURIComponent(u.hash.slice(1))) !== null;
        if (!esSalto) malos.push(`fragmento: ${nombre}`);
      }
    }
    return malos;
  }, TEXTOS.armazon.saltarAlContenido);
}

/** Abre la dirección con parámetros y texto en el fragmento; dice si el contenido cambia y qué testigos aparecen. */
async function mirarConParametros(
  page: Page,
  ruta: string,
  base: string,
  testigos: string[],
): Promise<{ estado: number | undefined; cambia: boolean; apariciones: string[] }> {
  const respuesta = await page.goto(
    `${ruta}?usuario=otro-usuario&cliente=otro-cliente&sesion=otra&nombre=${testigos[0]}&correo=${testigos[1]}#${testigos[2]}`,
  );
  await page.waitForLoadState("networkidle");
  const texto = await page.locator("body").innerText();
  // El árbol sin los guiones de datos de Next, que llevan la consulta serializada (H-1).
  const arbol = await page.evaluate(() => {
    const copia = document.documentElement.cloneNode(true) as HTMLElement;
    copia.querySelectorAll("script").forEach((e) => e.remove());
    return copia.outerHTML;
  });
  const apariciones = testigos.filter((t) => texto.includes(t) || arbol.includes(t));
  return { estado: respuesta?.status(), cambia: texto !== base, apariciones };
}

for (const estado of ESTADOS) {
  test.describe(`PRUEBA-018 · ${estado.etiqueta}`, () => {
    test("red: 0 peticiones a otros dominios y 0 a rutas propias fuera de /muestra/ y lo estático", async ({
      page,
      baseURL,
    }) => {
      const red = registrarRed(page);
      await abrirEstado(page, estado);
      await page.waitForLoadState("networkidle");
      expect(red.urls.length, "se ha registrado alguna petición").toBeGreaterThan(0);
      const origen = origenDe(baseURL);
      expect(peticionesAjenas(red.urls, origen), "peticiones a otros dominios").toEqual([]);
      expect(
        rutasPropiasFuera(red.urls, origen),
        "rutas propias fuera de /muestra/ y de lo estático",
      ).toEqual([]);
    });

    test("almacenamiento del navegador vacío", async ({ page, context }) => {
      await abrirEstado(page, estado);
      await page.waitForLoadState("networkidle");
      expect(await leerAlmacenamiento(page)).toEqual(ALMACENAMIENTO_VACIO);
      expect(await context.cookies(), "galletas del contexto").toEqual([]);
    });

    test("dirección sin texto escrito, y los enlaces no llevan consulta ni fragmento", async ({
      page,
    }) => {
      await abrirEstado(page, estado);
      // Se escribe texto en todo campo que haya antes de mirar la dirección (CA-044).
      const escrito = "TESTIGO-ESCRITO-018";
      const campos = page.locator(
        'input:not([type="hidden"]):not([type="checkbox"]):not([type="radio"]), textarea',
      );
      const cuantos = await campos.count();
      for (let i = 0; i < cuantos; i++) await campos.nth(i).fill(escrito);
      if (cuantos === 0) {
        anotarPendiente(
          test.info(),
          `dirección tras escribir texto en ${estado.etiqueta}: el estado no tiene campos de texto`,
          "T-010 (formulario, filtros y búsqueda)",
        );
      }
      await page.keyboard.press("Enter");
      const url = new URL(page.url());
      expect(url.search).toBe("");
      expect(url.hash).toBe("");
      expect(page.url(), "lo escrito no está en la dirección").not.toContain(escrito);
      expect(await enlacesIndebidos(page), "enlaces con consulta o fragmento").toEqual([]);
    });

    test("parámetros añadidos a la dirección no cambian nada y su texto no aparece", async ({
      page,
    }) => {
      await abrirEstado(page, estado);
      const base = await page.locator("body").innerText();
      const testigos = [
        "TESTIGO-NOMBRE-018",
        "ficticio-018@ejemplo.invalid",
        "TESTIGO-FRAGMENTO-018",
      ];
      const visto = await mirarConParametros(page, estado.ruta, base, testigos);
      expect(visto.estado).toBe(200);
      expect(visto.cambia, "el contenido es el mismo").toBe(false);
      // La página: ni su texto ni su árbol (sin los guiones de datos de Next) llevan lo escrito.
      expect(visto.apariciones, "testigos que aparecen en la página").toEqual([]);
    });

    test("HALLAZGO H-1: la consulta de la dirección viaja en los datos de Next, solo dentro de guiones y escapada", async ({
      page,
    }) => {
      // Documenta lo que hay, con sus límites: el texto de la consulta aparece en la carga serializada
      // de Next (`self.__next_f`), nunca fuera de un `script`, y sin que un `<` o una comilla lo
      // saquen de él. Si Next deja de poner la consulta en los guiones, falla la aserción de que
      // aparece en alguno y el hallazgo se cierra.
      const hostil = "TESTIGO-H1-018</script><img src=x onerror=window.__ejecutado=1>\"'";
      await page.goto(`${estado.ruta}?nombre=${encodeURIComponent(hostil)}`);
      await page.waitForLoadState("networkidle");
      expect(
        await page.evaluate(() => (window as unknown as { __ejecutado?: number }).__ejecutado),
        "ningún código se ejecuta",
      ).toBeUndefined();
      const donde = await page.evaluate(() => {
        const dentro = [...document.querySelectorAll("script")]
          .map((s) => s.textContent ?? "")
          .filter((t) => t.includes("TESTIGO-H1-018")).length;
        const copia = document.documentElement.cloneNode(true) as HTMLElement;
        copia.querySelectorAll("script").forEach((e) => e.remove());
        return {
          dentroDeGuiones: dentro,
          fueraDeGuiones: copia.outerHTML.includes("TESTIGO-H1-018"),
          imagenesCreadas: document.querySelectorAll('img[src="x"]').length,
        };
      });
      expect(
        donde.dentroDeGuiones,
        "la consulta viaja en los guiones de datos de Next",
      ).toBeGreaterThan(0);
      expect(donde.fueraDeGuiones, "fuera de los guiones no aparece").toBe(false);
      expect(donde.imagenesCreadas, "la cadena no crea elementos").toBe(0);
      test.info().annotations.push({
        type: "hallazgo H-1",
        description: `la consulta aparece en ${donde.dentroDeGuiones} guiones de datos de Next (documento crudo); la 021 decide si basta`,
      });
    });

    test("un texto en el fragmento, en el historial o enviado como mensaje no aparece en la página", async ({
      page,
    }) => {
      await abrirEstado(page, estado);
      await page.waitForLoadState("networkidle");
      const base = await page.locator("body").innerText();
      const testigo = "TESTIGO-MENSAJE-018";
      const ventana = await lanzarTestigo(page, testigo);
      expect(await page.content()).not.toContain(testigo);
      expect(ventana, "la ventana que recibió el mensaje no lo pinta").not.toContain(testigo);
      expect(await page.locator("body").innerText(), "el contenido no cambia").toBe(base);
    });

    test("política de contenido estricta en solo informe: inventario de infracciones", async ({
      page,
      baseURL,
    }, info) => {
      // La cabecera se añade en la prueba, no en la aplicación: la 021 decide la política real.
      await page.route("**/*", async (ruta) => {
        if (ruta.request().resourceType() !== "document") return ruta.continue();
        const respuesta = await ruta.fetch();
        await ruta.fulfill({
          response: respuesta,
          headers: {
            ...respuesta.headers(),
            "content-security-policy-report-only": POLITICA_ESTRICTA,
          },
        });
      });
      await page.addInitScript(() => {
        const w = window as unknown as { __infracciones: unknown[] };
        w.__infracciones = [];
        document.addEventListener("securitypolicyviolation", (e) => {
          w.__infracciones.push({
            directiva: e.effectiveDirective,
            bloqueado: e.blockedURI,
            disposicion: e.disposition,
            muestra: (e.sample ?? "").slice(0, 60),
          });
        });
      });
      await abrirEstado(page, estado);
      await page.waitForLoadState("networkidle");
      const avisos = (await page.evaluate(
        () => (window as unknown as { __infracciones: unknown[] }).__infracciones,
      )) as Array<{ directiva: string; bloqueado: string; disposicion: string; muestra: string }>;
      // Resumen por directiva y tipo de bloqueo, para la 021.
      const resumen: Record<string, number> = {};
      for (const i of avisos) {
        const clave = `${i.directiva} · ${i.bloqueado === "inline" || i.bloqueado === "eval" ? i.bloqueado : "recurso"}`;
        resumen[clave] = (resumen[clave] ?? 0) + 1;
      }
      const ruta = info.outputPath(`inventario-csp-${estado.entrada}-${estado.estado}.json`);
      writeFileSync(
        ruta,
        JSON.stringify(
          { estado: estado.etiqueta, politica: POLITICA_ESTRICTA, resumen, infracciones: avisos },
          null,
          2,
        ),
      );
      await info.attach("inventario-csp", { path: ruta, contentType: "application/json" });
      info.annotations.push({
        type: "infracciones de la política",
        description: JSON.stringify(resumen),
      });
      // Lo que no se admite: que algo bloquee un recurso de otro origen (no debe haber ninguno).
      const deOtroOrigen = avisos.filter(
        (i) => /^https?:/.test(i.bloqueado) && new URL(i.bloqueado).origin !== origenDe(baseURL),
      );
      expect(deOtroOrigen, "bloqueos de recursos de otro origen").toEqual([]);
    });
  });
}

test.describe("PRUEBA-018 · controles: la medida detecta lo que debe", () => {
  test("una petición a otro dominio y una ruta propia ajena las señalan los mismos filtros", async ({
    page,
    baseURL,
  }) => {
    await page.route("**/*", async (ruta) => {
      const u = ruta.request().url();
      if (u.includes("dominio-ajeno.invalid") || u.includes("/api/salud")) {
        return ruta.fulfill({ status: 200, body: "{}", contentType: "application/json" });
      }
      return ruta.continue();
    });
    const red = registrarRed(page);
    await page.goto("/muestra");
    await page.evaluate(() => {
      void fetch("https://dominio-ajeno.invalid/x");
      void fetch("/api/salud");
    });
    await expect.poll(() => red.urls.some((u) => u.includes("dominio-ajeno.invalid"))).toBe(true);
    await expect.poll(() => red.urls.some((u) => u.endsWith("/api/salud"))).toBe(true);
    const origen = origenDe(baseURL);
    expect(peticionesAjenas(red.urls, origen)).toEqual(["https://dominio-ajeno.invalid/x"]);
    expect(rutasPropiasFuera(red.urls, origen)).toEqual(["/api/salud"]);
    // Una ruta de datos de Next no se admite como estática.
    expect(rutasPropiasFuera([`${origen}/_next/data/x/muestra.json`], origen)).toEqual([
      "/_next/data/x/muestra.json",
    ]);
    expect(rutasPropiasFuera([`${origen}/_next/static/chunks/x.js`], origen)).toEqual([]);
  });

  test("el almacenamiento con algo guardado y la dirección con texto no pasan la comprobación", async ({
    page,
    context,
  }) => {
    await page.goto("/muestra?q=texto#frag");
    const url = new URL(page.url());
    expect(url.search !== "" && url.hash !== "").toBe(true);
    await page.evaluate(() => {
      localStorage.setItem("clave-ficticia", "valor-ficticio");
      sessionStorage.setItem("clave-ficticia", "valor-ficticio");
      document.cookie = "galleta=ficticia";
    });
    const leido = await leerAlmacenamiento(page);
    expect(leido).not.toEqual(ALMACENAMIENTO_VACIO);
    expect(leido).toMatchObject({ local: 1, sesion: 1, galletasDelDocumento: "galleta=ficticia" });
    expect((await context.cookies()).length).toBeGreaterThan(0);
  });

  test("un parámetro que cambia el contenido y enlaces con consulta o fragmento los detecta la comprobación", async ({
    page,
  }) => {
    // Se siembra una respuesta que, solo cuando trae parámetros, añade texto, el testigo y enlaces.
    await page.route(/\/muestra\?/, async (ruta) => {
      const respuesta = await ruta.fetch();
      const cuerpo = (await respuesta.text()).replace(
        "</body>",
        '<p>contenido solo con parámetros TESTIGO-NOMBRE-018</p><a href="/muestra?q=1">con consulta</a><a href="#otro">con fragmento</a></body>',
      );
      await ruta.fulfill({ response: respuesta, body: cuerpo });
    });
    await page.goto("/muestra");
    const base = await page.locator("body").innerText();
    const visto = await mirarConParametros(page, "/muestra", base, [
      "TESTIGO-NOMBRE-018",
      "ficticio-018@ejemplo.invalid",
      "TESTIGO-FRAGMENTO-018",
    ]);
    expect(visto.cambia, "el contenido cambia").toBe(true);
    expect(visto.apariciones).toContain("TESTIGO-NOMBRE-018");
    const malos = await enlacesIndebidos(page);
    expect(malos.join(" ")).toContain("consulta: con consulta");
    expect(malos.join(" ")).toContain("fragmento: con fragmento");
    // Cada enlace indebido se etiqueta una sola vez y con su motivo: «#otro» no es una consulta.
    expect(malos).toHaveLength(2);
  });

  test("el enlace de salto al contenido es el único fragmento admitido", async ({ page }) => {
    await page.goto("/muestra");
    await page.evaluate((texto) => {
      const destino = document.createElement("div");
      destino.id = "contenido-sembrado";
      const a = document.createElement("a");
      a.href = "#contenido-sembrado";
      a.textContent = texto;
      document.body.append(a, destino);
    }, TEXTOS.armazon.saltarAlContenido);
    expect(await enlacesIndebidos(page)).toEqual([]);
    await page.evaluate(() => {
      const a = document.createElement("a");
      a.href = "#contenido-sembrado";
      a.textContent = "otro enlace";
      document.body.append(a);
    });
    expect(await enlacesIndebidos(page)).toHaveLength(1);
  });

  test("un enlace con href vacío apunta a la propia dirección: con consulta o fragmento, se detecta", async ({
    page,
  }) => {
    const sembrar = () =>
      page.evaluate(() => {
        const a = document.createElement("a");
        a.setAttribute("href", "");
        a.textContent = "vacío";
        document.body.append(a);
      });
    // Sin consulta ni fragmento, apuntar a sí mismo no lleva nada (control positivo).
    await page.goto("/muestra");
    await sembrar();
    expect(await enlacesIndebidos(page)).toEqual([]);
    await page.goto("/muestra?usuario=otro-usuario");
    await sembrar();
    const conConsulta = await enlacesIndebidos(page);
    expect(conConsulta).toHaveLength(1);
    expect(conConsulta[0]).toContain("consulta: vacío");
    await page.goto("/muestra#otro");
    await sembrar();
    const conFragmento = await enlacesIndebidos(page);
    expect(conFragmento).toHaveLength(1);
    expect(conFragmento[0]).toContain("fragmento: vacío");
  });

  test("una página que pinta lo recibido por mensaje o fragmento la detecta la comprobación", async ({
    page,
  }) => {
    await page.goto("/muestra");
    await page.waitForLoadState("networkidle");
    await page.evaluate(() => {
      const pintar = (t: string): void => {
        const p = document.createElement("p");
        p.textContent = t;
        document.body.appendChild(p);
      };
      window.addEventListener("message", (e) => pintar(String(e.data)));
      window.addEventListener("hashchange", () => pintar(location.hash));
    });
    const testigo = "TESTIGO-CONTROL-018";
    await lanzarTestigo(page, testigo);
    expect(await page.content()).toContain(testigo);
  });

  test("la política en solo informe registra un código en línea sembrado", async ({ page }) => {
    await page.route("**/muestra", async (ruta) => {
      const respuesta = await ruta.fetch();
      await ruta.fulfill({
        response: respuesta,
        headers: {
          ...respuesta.headers(),
          "content-security-policy-report-only": POLITICA_ESTRICTA,
        },
      });
    });
    await page.addInitScript(() => {
      const w = window as unknown as { __n: number };
      w.__n = 0;
      document.addEventListener("securitypolicyviolation", () => (w.__n += 1));
    });
    await page.goto("/muestra");
    await page.evaluate(() => {
      const e = document.createElement("div");
      e.setAttribute("style", "color: red");
      e.textContent = "estilo en línea sembrado";
      document.body.appendChild(e);
      e.style.cssText = "color: red";
    });
    await expect
      .poll(() => page.evaluate(() => (window as unknown as { __n: number }).__n))
      .toBeGreaterThan(0);
  });

  test("las vistas de /muestra/servidor/ no existen aún", async () => {
    // Registro, supervisión y vistas de servidor: no hay rutas de servidor en la muestra (T-008 (c),
    // T-009 (i)). Queda anotado, no comprobado.
    anotarPendiente(
      test.info(),
      "tras activar todas las vistas de /muestra/servidor/, 0 líneas nuevas en el registro y 0 envíos a la supervisión",
      "la muestra de servidor (T-008, T-016) y su registro sustituido por un contador",
    );
    // Cuando el inventario traiga esas vistas, esta prueba falla a propósito: hay que escribir
    // entonces la comprobación real en vez de dejar el aviso.
    expect(
      ESTADOS.some((e) => e.ruta.startsWith("/muestra/servidor/")),
      "el inventario ya tiene vistas de servidor: falta escribir su comprobación de registro y supervisión",
    ).toBe(false);
  });
});
