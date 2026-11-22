// T-010 (a) · el armazón en la muestra (REQ-001, REQ-010, REQ-061; CA-002, CA-004, CA-046):
// entradas del inventario con las áreas de superadmin y de cliente y una página por estado en
// `/muestra/componentes/<componente>/<estado>`. Cada página llama primero al control 2; su título
// es un valor fijo del inventario (la muestra no admite generateMetadata), distinto en cada
// estado y sin datos. Inventario y páginas son uno a uno: lo que no está en el inventario no existe.
import { existsSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import type { ReactElement } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AREAS_CLIENTE_MUESTRA, AREAS_SUPERADMIN } from "../../../src/components/armazon/areas";
import { INVENTARIO, rutaDeEstado } from "../../../src/app/muestra/inventario";
import { TEXTOS } from "../../../src/components/textos";

vi.setConfig({ testTimeout: 60_000 });

const estado = vi.hoisted(() => ({ host: "localhost:3000" as string | null }));
vi.mock("next/navigation", async (original) => ({
  ...(await original<typeof import("next/navigation")>()),
  // El enrutador de la aplicación no está montado al pintar en el servidor de pruebas.
  useRouter: () => ({ replace: () => {}, push: () => {}, refresh: () => {} }),
}));
vi.mock("next/headers", () => ({
  headers: async () => ({ get: (n: string) => (n.toLowerCase() === "host" ? estado.host : null) }),
}));

afterEach(() => {
  vi.unstubAllEnvs();
  estado.host = "localhost:3000";
});

const RAIZ = resolve(import.meta.dirname, "..", "..", "..");
const COMPONENTES = join(RAIZ, "src", "app", "muestra", "componentes");

type Pagina = {
  default: () => Promise<ReactElement>;
  metadata: { title?: string };
};

async function cargar(clave: string, e: string): Promise<Pagina> {
  vi.resetModules();
  const ruta = `../../../src/app/muestra/componentes/${clave}/${e}/page.muestra`;
  return (await import(/* @vite-ignore */ ruta)) as unknown as Pagina;
}
async function pintar(clave: string, e: string): Promise<string> {
  vi.stubEnv("ENTORNO", "preproduccion");
  const m = await cargar(clave, e);
  return renderToStaticMarkup(await m.default());
}

const ENTRADAS = INVENTARIO.filter((e) => /^armazon/.test(e.clave));
const CASOS = ENTRADAS.flatMap((e) => e.estados.map((s) => [e.clave, s.clave] as const));
const SUPERADMIN = INVENTARIO.find((e) => e.clave === "armazon-superadmin");
const CLIENTE = INVENTARIO.find((e) => e.clave === "armazon-cliente");

describe("inventario · entradas del armazón", () => {
  it("hay una entrada con las áreas de superadmin y otra con las de cliente, de tipo componente", () => {
    expect(SUPERADMIN?.tipo).toBe("componente");
    expect(CLIENTE?.tipo).toBe("componente");
    for (const area of AREAS_SUPERADMIN) {
      expect(SUPERADMIN?.estados.map((s) => s.clave)).toContain(area.clave);
    }
    for (const area of AREAS_CLIENTE_MUESTRA) {
      expect(CLIENTE?.estados.map((s) => s.clave)).toContain(area.clave);
    }
  });

  it("el nombre largo de 120 caracteres sigue la convención de nombres de anchos.spec.ts", () => {
    const claves = SUPERADMIN?.estados.map((s) => s.clave) ?? [];
    expect(claves.filter((c) => /120|largo/.test(c))).toEqual(["nombre-largo-120"]);
  });
});

describe("páginas del armazón · una por estado del inventario, ni una más ni una menos", () => {
  it("cada estado del inventario tiene su página", () => {
    for (const [c, e] of CASOS) {
      expect(existsSync(join(COMPONENTES, c, e, "page.muestra.tsx")), `${c}/${e}`).toBe(true);
    }
  });

  it("cada página de armazon-* está en el inventario", () => {
    const enDisco: string[] = [];
    for (const c of readdirSync(COMPONENTES).filter((n) => /^armazon/.test(n))) {
      for (const e of readdirSync(join(COMPONENTES, c))) enDisco.push(`${c}/${e}`);
    }
    expect(enDisco.sort()).toEqual(CASOS.map(([c, e]) => `${c}/${e}`).sort());
  });
});

describe("páginas del armazón · cada estado", () => {
  it("hay estados que recorrer", () => {
    expect(CASOS.length).toBeGreaterThanOrEqual(10);
  });

  it.each(CASOS)("%s/%s: un armazón con un h1, un main y el área actual marcada", async (c, e) => {
    const html = await pintar(c, e);
    expect(html.match(/<h1[\s>]/g)).toHaveLength(1);
    expect(html.match(/<main[\s>]/g)).toHaveLength(1);
    expect(html.match(/<nav[\s>]/g)).toHaveLength(1);
    expect(html.match(/aria-current="page"/g)).toHaveLength(1);
  });

  it("el menú de superadmin lleva cinco entradas y el de cliente, cuatro; los enlaces van a la muestra", async () => {
    const a = await pintar("armazon-superadmin", "ordenes");
    const nav = /<nav[\s\S]*?<\/nav>/.exec(a)![0];
    expect(nav.match(/<a\b/g)).toHaveLength(5);
    for (const area of AREAS_SUPERADMIN) {
      expect(nav).toContain(`href="${rutaDeEstado(SUPERADMIN!, area.clave)}"`);
    }
    expect(nav).not.toContain('href="/admin');
    const b = await pintar("armazon-cliente", "actividad");
    expect(/<nav[\s\S]*?<\/nav>/.exec(b)![0].match(/<a\b/g)).toHaveLength(4);
  });

  it("el área actual es la del estado; el nombre largo cuenta como Clientes", async () => {
    const a = await pintar("armazon-superadmin", "auditoria");
    expect(/<a\b[^>]*aria-current="page"[^>]*>/.exec(a)![0]).toContain("/auditoria");
    const b = await pintar("armazon-superadmin", "nombre-largo-120");
    expect(/<a\b[^>]*aria-current="page"[^>]*>/.exec(b)![0]).toContain("/clientes");
  });

  it("el nombre de 120 caracteres es un dato ficticio dentro de bdi, sin espacios", async () => {
    const html = await pintar("armazon-superadmin", "nombre-largo-120");
    const nombre = /<bdi>([^<]*)<\/bdi>/.exec(html)![1]!;
    expect(nombre).toHaveLength(120);
    expect(nombre).not.toMatch(/\s/);
  });

  it("las tres zonas del cuerpo, en orden", async () => {
    const html = await pintar("armazon-superadmin", "resumen");
    expect([...html.matchAll(/data-zona="([a-z]+)"/g)].map((m) => m[1])).toEqual([
      "cifras",
      "contenido",
      "alertas",
    ]);
  });
});

describe("páginas del armazón · control 2 primero", () => {
  it("sin acceso a la muestra, 404 y no pinta nada", async () => {
    vi.stubEnv("ENTORNO", "preproduccion");
    estado.host = "desconocido.invalid";
    const m = await cargar("armazon-superadmin", "resumen");
    await expect(m.default()).rejects.toMatchObject({ digest: "NEXT_HTTP_ERROR_FALLBACK;404" });
  });

  it("con ENTORNO de producción, 404", async () => {
    vi.stubEnv("ENTORNO", "produccion");
    const m = await cargar("armazon-cliente", "resumen");
    await expect(m.default()).rejects.toMatchObject({ digest: "NEXT_HTTP_ERROR_FALLBACK;404" });
  });
});

describe("título del documento de cada estado", () => {
  it("es el h1, distinto en cada estado y sin datos (los títulos fijos, sin generateMetadata)", async () => {
    vi.stubEnv("ENTORNO", "preproduccion");
    const titulos: string[] = [];
    for (const [c, e] of CASOS) {
      const m = await cargar(c, e);
      const html = renderToStaticMarkup(await m.default());
      const h1 = />([^<]*)<\/h1>/.exec(html)![1]!;
      expect(m.metadata.title, `${c}/${e}`).toBe(h1);
      titulos.push(h1);
    }
    expect(new Set(titulos).size).toBe(titulos.length);
    for (const t of titulos) expect(t).not.toContain(TEXTOS.marca.nombreProducto);
  });
});

describe("T-010 (c) · cabecera en la muestra: cuenta en todos los estados, periodo solo donde se declara", () => {
  it("la cuenta ficticia está en todas las páginas y no sale de la dirección", async () => {
    for (const [c, e] of CASOS) {
      const html = await pintar(c, e);
      expect(html, `${c}/${e}`).toContain(TEXTOS.cuenta.abrir);
    }
  });

  it("solo los estados con-periodo pintan el selector, con las tres cifras ficticias", async () => {
    for (const [c, e] of CASOS) {
      const html = await pintar(c, e);
      expect(html.match(/<select\b/g)?.length ?? 0, `${c}/${e}`).toBe(e === "con-periodo" ? 1 : 0);
    }
    const html = await pintar("armazon-superadmin", "con-periodo");
    expect(html.match(/data-cifra/g)).toHaveLength(3);
  });

  it("el periodo sale de la dirección solo si es de la lista; lo demás vuelve al valor por defecto", async () => {
    vi.stubEnv("ENTORNO", "preproduccion");
    const m = (await cargar("armazon-cliente", "con-periodo")) as unknown as {
      default: (p: { searchParams: Promise<Record<string, string>> }) => Promise<ReactElement>;
    };
    const con = async (q: Record<string, string>) =>
      renderToStaticMarkup(await m.default({ searchParams: Promise.resolve(q) }));
    expect(await con({ periodo: "ultimos-7-dias" })).toMatch(/value="ultimos-7-dias"[^>]*selected/);
    for (const malo of ["<script>", "otro", "ULTIMOS-7-DIAS"]) {
      expect(await con({ periodo: malo })).toMatch(/value="ultimos-30-dias"[^>]*selected/);
    }
    expect(await con({ usuario: "x", cuenta: "Otra Persona" })).not.toContain("Otra Persona");
  });

  it("las cuentas de 120 caracteres: sin espacios en el nombre largo y con espacios en el otro estado", async () => {
    const a = await pintar("armazon-superadmin", "nombre-largo-120");
    const b = await pintar("armazon-cliente", "cuenta-120-con-espacios");
    const nombre = /data-nombre-acortable="true"[^>]*>([^<]*)<\/span>/;
    expect(nombre.exec(a)![1]).toHaveLength(120);
    expect(nombre.exec(a)![1]).not.toMatch(/\s/);
    expect(nombre.exec(b)![1]).toHaveLength(120);
    expect(nombre.exec(b)![1]).toMatch(/\s/);
  });
});
