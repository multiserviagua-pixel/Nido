// Doble de red (T-102, 001): un fetch inyectable que cierra en fallo. Lo que no se ha registrado no
// sale a internet: da error. Las llamadas guardan método, URL y NOMBRES de cabeceras, nunca cuerpos
// ni valores de cabeceras (art. 4). La URL se guarda entera porque es lo que se vigila (ningún
// código ni token en ella).

export interface PeticionDoble {
  metodo: string;
  url: string;
  cabeceras: Headers;
  cuerpo: string | null;
}
export interface LlamadaRegistrada {
  metodo: string;
  url: string;
  cabeceras: string[];
}
export type Manejador = (peticion: PeticionDoble) => Response | Promise<Response>;

export interface DobleRed {
  fetch: (entrada: string | URL | Request, init?: RequestInit) => Promise<Response>;
  responder(metodo: string, url: string, manejador: Manejador): void;
  caer(url: string): void;
  recuperar(url: string): void;
  readonly llamadas: LlamadaRegistrada[];
}

export function crearDobleRed(): DobleRed {
  const manejadores = new Map<string, Manejador>();
  const caidas = new Set<string>();
  const llamadas: LlamadaRegistrada[] = [];

  // En los mensajes solo origen y ruta: la consulta y el fragmento pueden llevar un código o un token.
  const visible = (url: string) => {
    const u = new URL(url);
    return `${u.origin}${u.pathname}`;
  };

  const doble: DobleRed = {
    llamadas,
    responder: (metodo, url, manejador) =>
      void manejadores.set(`${metodo.toUpperCase()} ${new URL(url).href}`, manejador),
    caer: (url) => void caidas.add(new URL(url).href),
    recuperar: (url) => void caidas.delete(new URL(url).href),
    async fetch(entrada, init) {
      const peticion = new Request(entrada, init);
      const metodo = peticion.method.toUpperCase();
      const url = peticion.url;
      const nombres = [...peticion.headers.keys()].sort();
      llamadas.push({ metodo, url, cabeceras: nombres });
      if (caidas.has(url)) throw new Error(`doble de red: red caída: ${visible(url)}`);
      const manejador = manejadores.get(`${metodo} ${url}`);
      if (!manejador)
        throw new Error(`doble de red: sin respuesta registrada para ${metodo} ${visible(url)}`);
      const cuerpo = peticion.body ? await peticion.text() : null;
      return manejador({ metodo, url, cabeceras: peticion.headers, cuerpo });
    },
  };
  return doble;
}
