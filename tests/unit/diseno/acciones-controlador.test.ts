// T-010 (d) · cerrojo, plazo de 30 s y resultado por envío de `useAccion` (diseño 020, «Estados de
// cada vista», «Cada resultado pertenece a su envío»; REQ-073, REQ-074; PRUEBA-015, PRUEBA-016;
// CA-017, CA-045). La lógica vive en un controlador sin React, para probarla con reloj simulado sin
// navegador; el gancho solo lo conecta al componente. Que dos pulsaciones reales den un solo envío
// lo mide `acciones.spec.ts` en el navegador.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  crearControladorDeAccion,
  PLAZO_DE_ACCION_MS,
  type EstadoDeAccion,
} from "../../../src/components/acciones/controlador";

const LISTAS = { motivos: ["estado_distinto"], campos: ["nombre"], codigos: ["obligatorio"] };
const HECHA = { cuerpo: { resultado: "hecha" } };

type Pendiente = { resolver: (v: unknown) => void; rechazar: (e: unknown) => void };

function montar() {
  const pendientes: Pendiente[] = [];
  const ejecutar = vi.fn(
    () =>
      new Promise<unknown>((resolver, rechazar) => {
        pendientes.push({ resolver, rechazar });
      }),
  );
  const alReleer = vi.fn();
  const controlador = crearControladorDeAccion({ ejecutar, alReleer, lectura: LISTAS });
  return { controlador, ejecutar, alReleer, pendientes };
}
const resultadoDe = (e: EstadoDeAccion): string | null =>
  e.fase === "terminada" ? e.lectura.resultado : null;

beforeEach(() => {
  vi.useFakeTimers();
});
afterEach(() => {
  vi.useRealTimers();
});

describe("useAccion · cerrojo contra el doble envío (REQ-074, CA-017)", () => {
  it("empieza en reposo y la primera pulsación envía", () => {
    const { controlador, ejecutar } = montar();
    expect(controlador.obtener()).toEqual({ fase: "reposo" });
    expect(controlador.lanzar()).toBe(true);
    expect(ejecutar).toHaveBeenCalledTimes(1);
    expect(controlador.obtener()).toEqual({ fase: "en_curso", envio: 1 });
  });

  it("dos pulsaciones en el mismo instante, o Intro repetido, envían una sola vez", () => {
    const { controlador, ejecutar } = montar();
    expect(controlador.lanzar()).toBe(true);
    expect(controlador.lanzar()).toBe(false);
    expect(controlador.lanzar()).toBe(false);
    expect(ejecutar).toHaveBeenCalledTimes(1);
  });

  it("dos pulsaciones con menos de 300 ms entre ellas envían una sola vez", async () => {
    const { controlador, ejecutar } = montar();
    controlador.lanzar();
    await vi.advanceTimersByTimeAsync(299);
    expect(controlador.lanzar()).toBe(false);
    expect(ejecutar).toHaveBeenCalledTimes(1);
  });

  it("el cerrojo se suelta al llegar el resultado, sea cual sea", async () => {
    for (const respuesta of [HECHA, undefined, "ilegible", { estado: 500 }]) {
      const { controlador, ejecutar, pendientes } = montar();
      controlador.lanzar();
      pendientes[0]!.resolver(respuesta);
      await vi.advanceTimersByTimeAsync(0);
      expect(controlador.obtener().fase).toBe("terminada");
      expect(controlador.lanzar()).toBe(true);
      expect(ejecutar).toHaveBeenCalledTimes(2);
    }
  });

  it("el cerrojo se suelta si ejecutar rechaza o lanza", async () => {
    const a = montar();
    a.controlador.lanzar();
    a.pendientes[0]!.rechazar(new Error("sin red"));
    await vi.advanceTimersByTimeAsync(0);
    expect(resultadoDe(a.controlador.obtener())).toBe("incierta");
    expect(a.controlador.lanzar()).toBe(true);

    const lanza = crearControladorDeAccion({
      ejecutar: () => {
        throw new Error("a propósito");
      },
    });
    expect(lanza.lanzar()).toBe(true);
    expect(resultadoDe(lanza.obtener())).toBe("incierta");
    expect(lanza.lanzar()).toBe(true);
  });

  it("si ejecutar devuelve un valor que no es una promesa, también se lee", async () => {
    const c = crearControladorDeAccion({ ejecutar: () => HECHA });
    c.lanzar();
    await vi.advanceTimersByTimeAsync(0);
    expect(resultadoDe(c.obtener())).toBe("hecha");
  });
});

describe("useAccion · resultado por la correspondencia exhaustiva", () => {
  it("hecha solo con confirmación expresa, y entonces la vista relee", async () => {
    const { controlador, alReleer, pendientes } = montar();
    controlador.lanzar();
    pendientes[0]!.resolver(HECHA);
    await vi.advanceTimersByTimeAsync(0);
    expect(controlador.obtener()).toEqual({
      fase: "terminada",
      envio: 1,
      lectura: { resultado: "hecha" },
    });
    expect(alReleer).toHaveBeenCalledTimes(1);
  });

  it("error del servidor, cuerpo ilegible, resultado desconocido o nada: incierta y 0 éxitos", async () => {
    const casos: unknown[] = [
      { estado: 500, cuerpo: { resultado: "hecha" } },
      { estado: 502 },
      "<html>Bad gateway</html>",
      { cuerpo: { resultado: "exito" } },
      { cuerpo: null },
      undefined,
      null,
    ];
    for (const caso of casos) {
      const { controlador, pendientes } = montar();
      controlador.lanzar();
      pendientes[0]!.resolver(caso);
      await vi.advanceTimersByTimeAsync(0);
      expect(resultadoDe(controlador.obtener()), JSON.stringify(caso)).toBe("incierta");
    }
  });

  it("sesión caducada (401): no_permitida, y la vista relee el estado real", async () => {
    const { controlador, alReleer, pendientes } = montar();
    controlador.lanzar();
    pendientes[0]!.resolver({ estado: 401 });
    await vi.advanceTimersByTimeAsync(0);
    expect(resultadoDe(controlador.obtener())).toBe("no_permitida");
    expect(alReleer).toHaveBeenCalledTimes(1);
  });

  it("rechazada: lleva el motivo de la lista y no relee (no cambió nada)", async () => {
    const { controlador, alReleer, pendientes } = montar();
    controlador.lanzar();
    pendientes[0]!.resolver({ cuerpo: { resultado: "rechazada", motivo: "estado_distinto" } });
    await vi.advanceTimersByTimeAsync(0);
    expect(controlador.obtener()).toMatchObject({
      fase: "terminada",
      lectura: { resultado: "rechazada", motivo: "estado_distinto" },
    });
    expect(alReleer).not.toHaveBeenCalled();
  });

  it("incierta: no relee sola ni se reintenta sola", async () => {
    const { controlador, alReleer, ejecutar, pendientes } = montar();
    controlador.lanzar();
    pendientes[0]!.rechazar(new Error("conexión perdida"));
    await vi.advanceTimersByTimeAsync(PLAZO_DE_ACCION_MS * 3);
    expect(alReleer).not.toHaveBeenCalled();
    expect(ejecutar).toHaveBeenCalledTimes(1);
  });
});

describe("useAccion · plazo de 30 s (REQ-073, CA-045)", () => {
  it("el plazo es de 30 s", () => {
    expect(PLAZO_DE_ACCION_MS).toBe(30_000);
  });

  it("a los 29,999 s sigue en curso y con el cerrojo; a los 30 s es incierta y se libera", async () => {
    const { controlador, ejecutar } = montar();
    controlador.lanzar();
    await vi.advanceTimersByTimeAsync(PLAZO_DE_ACCION_MS - 1);
    expect(controlador.obtener()).toEqual({ fase: "en_curso", envio: 1 });
    expect(controlador.lanzar()).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    expect(controlador.obtener()).toEqual({
      fase: "terminada",
      envio: 1,
      lectura: { resultado: "incierta" },
    });
    expect(controlador.lanzar()).toBe(true);
    expect(ejecutar).toHaveBeenCalledTimes(2);
  });

  it("al vencer no se cancela nada, no se reintenta sola y la vista no relee por su cuenta", async () => {
    const { controlador, ejecutar, alReleer } = montar();
    controlador.lanzar();
    await vi.advanceTimersByTimeAsync(PLAZO_DE_ACCION_MS * 4);
    expect(ejecutar).toHaveBeenCalledTimes(1);
    expect(alReleer).not.toHaveBeenCalled();
  });

  it("un resultado a tiempo cancela el plazo: a los 30 s no cambia nada", async () => {
    const { controlador, pendientes } = montar();
    const cambios = vi.fn();
    controlador.suscribir(cambios);
    controlador.lanzar();
    pendientes[0]!.resolver(HECHA);
    await vi.advanceTimersByTimeAsync(0);
    const antes = controlador.obtener();
    const veces = cambios.mock.calls.length;
    await vi.advanceTimersByTimeAsync(PLAZO_DE_ACCION_MS * 2);
    expect(controlador.obtener()).toBe(antes);
    expect(cambios).toHaveBeenCalledTimes(veces);
  });
});

describe("useAccion · cada resultado pertenece a su envío (N-4, CA-045)", () => {
  it("éxito tardío sin segundo envío: 0 éxitos mostrados, sigue incierta y la vista relee", async () => {
    const { controlador, alReleer, pendientes } = montar();
    controlador.lanzar();
    await vi.advanceTimersByTimeAsync(PLAZO_DE_ACCION_MS);
    const incierta = controlador.obtener();
    expect(resultadoDe(incierta)).toBe("incierta");
    pendientes[0]!.resolver(HECHA);
    await vi.advanceTimersByTimeAsync(0);
    expect(controlador.obtener()).toBe(incierta);
    expect(alReleer).toHaveBeenCalledTimes(1);
  });

  it("éxito tardío con un segundo envío en curso: no se atribuye al segundo y la vista relee", async () => {
    const { controlador, alReleer, pendientes } = montar();
    controlador.lanzar();
    await vi.advanceTimersByTimeAsync(PLAZO_DE_ACCION_MS);
    expect(controlador.lanzar()).toBe(true);
    expect(controlador.obtener()).toEqual({ fase: "en_curso", envio: 2 });
    pendientes[0]!.resolver(HECHA);
    await vi.advanceTimersByTimeAsync(0);
    expect(controlador.obtener()).toEqual({ fase: "en_curso", envio: 2 });
    expect(controlador.lanzar(), "el cerrojo del envío 2 sigue puesto").toBe(false);
    expect(alReleer).toHaveBeenCalledTimes(1);
    // El envío 2 sí acaba con su propio resultado.
    pendientes[1]!.resolver({ estado: 503 });
    await vi.advanceTimersByTimeAsync(0);
    expect(controlador.obtener()).toMatchObject({
      fase: "terminada",
      envio: 2,
      lectura: { resultado: "incierta" },
    });
  });

  it("una respuesta tardía de cualquier tipo solo provoca relectura: 401, 500, ilegible o nada", async () => {
    for (const tardia of [{ estado: 401 }, { estado: 500 }, "ilegible", undefined]) {
      const { controlador, alReleer, pendientes } = montar();
      controlador.lanzar();
      await vi.advanceTimersByTimeAsync(PLAZO_DE_ACCION_MS);
      const antes = controlador.obtener();
      pendientes[0]!.resolver(tardia);
      await vi.advanceTimersByTimeAsync(0);
      expect(controlador.obtener(), JSON.stringify(tardia)).toBe(antes);
      expect(alReleer).toHaveBeenCalledTimes(1);
    }
  });

  it("un rechazo tardío de la promesa tampoco cambia lo que se muestra", async () => {
    const { controlador, pendientes } = montar();
    controlador.lanzar();
    await vi.advanceTimersByTimeAsync(PLAZO_DE_ACCION_MS);
    const antes = controlador.obtener();
    pendientes[0]!.rechazar(new Error("tarde"));
    await vi.advanceTimersByTimeAsync(0);
    expect(controlador.obtener()).toBe(antes);
  });

  it("un éxito tardío del envío 1 no pisa el resultado ya terminado del envío 2", async () => {
    const { controlador, pendientes } = montar();
    controlador.lanzar();
    await vi.advanceTimersByTimeAsync(PLAZO_DE_ACCION_MS);
    controlador.lanzar();
    pendientes[1]!.resolver({ estado: 500 });
    await vi.advanceTimersByTimeAsync(0);
    const segundo = controlador.obtener();
    expect(resultadoDe(segundo)).toBe("incierta");
    pendientes[0]!.resolver(HECHA);
    await vi.advanceTimersByTimeAsync(0);
    expect(controlador.obtener()).toBe(segundo);
  });

  it("la relectura por una tardía nunca repite el envío", async () => {
    const { controlador, ejecutar, pendientes } = montar();
    controlador.lanzar();
    await vi.advanceTimersByTimeAsync(PLAZO_DE_ACCION_MS);
    pendientes[0]!.resolver(HECHA);
    await vi.advanceTimersByTimeAsync(PLAZO_DE_ACCION_MS);
    expect(ejecutar).toHaveBeenCalledTimes(1);
  });
});

describe("useAccion · suscripción, restablecer y desmontaje", () => {
  it("la instantánea no cambia de identidad si no cambia el estado, y avisa a los oyentes al cambiar", async () => {
    const { controlador, pendientes } = montar();
    const oyente = vi.fn();
    const baja = controlador.suscribir(oyente);
    const a = controlador.obtener();
    expect(controlador.obtener()).toBe(a);
    controlador.lanzar();
    expect(oyente).toHaveBeenCalledTimes(1);
    controlador.lanzar();
    expect(oyente, "una pulsación ignorada no cambia nada").toHaveBeenCalledTimes(1);
    pendientes[0]!.resolver(HECHA);
    await vi.advanceTimersByTimeAsync(0);
    expect(oyente).toHaveBeenCalledTimes(2);
    baja();
    controlador.restablecer();
    expect(oyente).toHaveBeenCalledTimes(2);
  });

  it("restablecer vuelve a reposo solo desde un resultado, nunca con un envío en curso", async () => {
    const { controlador, pendientes } = montar();
    controlador.lanzar();
    controlador.restablecer();
    expect(controlador.obtener()).toEqual({ fase: "en_curso", envio: 1 });
    pendientes[0]!.resolver(HECHA);
    await vi.advanceTimersByTimeAsync(0);
    controlador.restablecer();
    expect(controlador.obtener()).toEqual({ fase: "reposo" });
  });

  it("desactivar (desmontaje): ignora respuestas y plazos, sin relectura ni cambios", async () => {
    const { controlador, alReleer, pendientes } = montar();
    controlador.lanzar();
    controlador.desactivar();
    pendientes[0]!.resolver(HECHA);
    await vi.advanceTimersByTimeAsync(PLAZO_DE_ACCION_MS * 2);
    expect(alReleer).not.toHaveBeenCalled();
    expect(controlador.obtener()).toEqual({ fase: "en_curso", envio: 1 });
  });

  it("activar tras desactivar (doble montaje de React) deja el controlador como nuevo para lanzar", () => {
    const { controlador, ejecutar } = montar();
    controlador.desactivar();
    controlador.activar();
    expect(controlador.lanzar()).toBe(true);
    expect(ejecutar).toHaveBeenCalledTimes(1);
  });

  it("un fallo de alReleer no rompe el controlador", async () => {
    const c = crearControladorDeAccion({
      ejecutar: () => Promise.resolve(HECHA),
      alReleer: () => {
        throw new Error("a propósito");
      },
    });
    c.lanzar();
    await vi.advanceTimersByTimeAsync(0);
    expect(resultadoDe(c.obtener())).toBe("hecha");
  });
});
