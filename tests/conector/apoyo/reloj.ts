// Reloj de la prueba (T-102, 001). Un solo objeto da la hora a la aplicación (inyectado) y, si se
// enlaza con una base de datos de apoyo, a su now(). Sin enlace, solo mueve la hora de la aplicación.
// Los cambios se serializan en una cola propia y el nuevo estado se calcula dentro de su turno, de modo
// que dos `avanzar` a la vez suman (Promise.all([avanzar(60000), avanzar(60000)]) = 120 s).

export type EnlaceReloj = (estado: { fijoMs: number | null; desfaseMs: number }) => Promise<void>;

type Calculo = (fijoMs: number | null, desfaseMs: number) => [number | null, number];

export class RelojPrueba {
  #fijoMs: number | null = null;
  #desfaseMs = 0;
  #enlace: EnlaceReloj | null = null;
  #cola: Promise<unknown> = Promise.resolve();

  /** Hora actual de la prueba: la real más el desfase, o el instante fijado más el desfase. */
  actual(): Date {
    return new Date((this.#fijoMs ?? Date.now()) + this.#desfaseMs);
  }

  /** Adelanta (o atrasa, con un valor negativo) el reloj. */
  async avanzar(ms: number): Promise<void> {
    if (!Number.isFinite(ms)) throw new Error("reloj: milisegundos no válidos");
    await this.#aplicar((fijo, desfase) => [fijo, desfase + ms]);
  }

  /** Congela el reloj en un instante; después, `avanzar` lo mueve desde ahí. */
  async fijar(instante: Date): Promise<void> {
    if (Number.isNaN(instante.getTime())) throw new Error("reloj: instante no válido");
    const ms = instante.getTime();
    await this.#aplicar(() => [ms, 0]);
  }

  /** Vuelve a la hora real. */
  async liberar(): Promise<void> {
    await this.#aplicar(() => [null, 0]);
  }

  /** Lo usa la base de datos de apoyo; se aplica de inmediato el estado actual. */
  async enlazar(enlace: EnlaceReloj): Promise<void> {
    await this.#enTurno(async () => {
      await enlace({ fijoMs: this.#fijoMs, desfaseMs: this.#desfaseMs });
      this.#enlace = enlace;
    });
  }

  desenlazar(): void {
    this.#enlace = null;
  }

  #enTurno<T>(fn: () => Promise<T>): Promise<T> {
    const turno = this.#cola.then(fn);
    this.#cola = turno.catch(() => undefined);
    return turno;
  }

  /** Propaga primero; el estado de la aplicación solo cambia si la base lo aceptó. */
  #aplicar(calculo: Calculo): Promise<void> {
    return this.#enTurno(async () => {
      const [fijoMs, desfaseMs] = calculo(this.#fijoMs, this.#desfaseMs);
      await this.#enlace?.({ fijoMs, desfaseMs });
      this.#fijoMs = fijoMs;
      this.#desfaseMs = desfaseMs;
    });
  }
}
