import { renderizarPantalla } from "./pantalla.ts";
import fs from "node:fs";
const out = process.argv[2];
const est = {
  formulario: { tipo:"formulario", asistente:"claude", state:"abc", solicitud:"sol1" },
  formulario_error: { tipo:"formulario", asistente:"chatgpt", state:"abc", solicitud:"sol1", codigoNoValido:true },
  bloqueado:{tipo:"bloqueado"}, solicitud_no_valida:{tipo:"solicitud_no_valida"}, no_disponible:{tipo:"no_disponible"},
  aceptado:{tipo:"aceptado",asistente:"claude",codigo:"c1",state:"abc",iss:"https://x.example"},
};
for (const [k,v] of Object.entries(est)) { const r = renderizarPantalla(v); fs.writeFileSync(`${out}/${k}.html`, r.html); console.log(k, r.estado); }
// contrastes
const L=h=>{const c=[1,3,5].map(i=>parseInt(h.slice(i,i+2),16)/255).map(v=>v<=0.03928?v/12.92:((v+0.055)/1.055)**2.4);return .2126*c[0]+.7152*c[1]+.0722*c[2]};
const R=(a,b)=>{const x=L(a),y=L(b);return ((Math.max(x,y)+.05)/(Math.min(x,y)+.05))};
const T={claro:{fondo:"#F8FAFC",sup:"#FFFFFF",texto:"#0F172A",sec:"#475569",ctl:"#64748B",ac:"#6C3CE9",sobre:"#FFFFFF",foco:"#8B5CF6",err:"#B91C1C",ok:"#15803D"},
oscuro:{fondo:"#0B1120",sup:"#151E2E",texto:"#F1F5F9",sec:"#A3B0C2",ctl:"#7D8BA0",ac:"#A78BFA",sobre:"#0F172A",foco:"#A78BFA",err:"#F87171",ok:"#4ADE80"}};
for (const [t,c] of Object.entries(T)) {
 const p=[["texto/superficie (h1,p,label,input)",c.texto,c.sup],["texto/fondo (body)",c.texto,c.fondo],["secundario/superficie (.ayuda)",c.sec,c.sup],["error/superficie (.error)",c.err,c.sup],["correcto/superficie (.correcto)",c.ok,c.sup],["sobre-acento/acento (botón)",c.sobre,c.ac],["[3:1] borde control/superficie",c.ctl,c.sup],["[3:1] foco/superficie",c.foco,c.sup],["[3:1] foco/fondo (fuera de la tarjeta)",c.foco,c.fondo],["[3:1] acento/superficie (botón vs tarjeta)",c.ac,c.sup],["[3:1] error/superficie (borde inválido)",c.err,c.sup]];
 for (const [n,a,b] of p) console.log(t.padEnd(7),n.padEnd(46),a,b,R(a,b).toFixed(2));
}
