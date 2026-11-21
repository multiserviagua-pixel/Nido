// 001 T-124 (REQ-015, CA-015): Next escribe un bloque gestionado en `AGENTS.md` salvo que
// `agentRules` sea `false`. Fijado en `next.config.ts` para que ninguna orden de Next modifique el archivo.
import { describe, expect, it } from "vitest";

describe("next.config.ts: agentRules", () => {
  it("desactiva las instrucciones gestionadas de Next para agentes", async () => {
    const modulo = (await import("../../../next.config")) as {
      default: { agentRules?: unknown };
    };
    expect(modulo.default.agentRules).toBe(false);
  });
});
