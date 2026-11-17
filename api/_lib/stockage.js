// Accès à la base Redis (Upstash) par son API REST, sans dépendance.
// Toutes les clés commencent par "noel:" pour ne jamais toucher aux données d'autres projets.
// En local (NOEL_MEMOIRE=1), une petite base en mémoire imite les mêmes commandes.

export const CLES = {
  liste: "noel:liste",
  resa: "noel:reservations",
  version: "noel:version"
};

function config() {
  return {
    url: process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || "",
    jeton: process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || "",
    memoire: process.env.NOEL_MEMOIRE === "1"
  };
}

export function baseDisponible() {
  const c = config();
  return c.memoire || Boolean(c.url && c.jeton);
}

/** Envoie une ou plusieurs commandes en une seule requête ; renvoie leurs résultats dans l'ordre. */
export async function redis(...commandes) {
  const c = config();
  if (c.memoire) return commandes.map(executerEnMemoire);
  const reponse = await fetch(`${c.url.replace(/\/$/, "")}/pipeline`, {
    method: "POST",
    headers: { Authorization: `Bearer ${c.jeton}`, "Content-Type": "application/json" },
    body: JSON.stringify(commandes)
  });
  if (!reponse.ok) throw new Error(`Redis a répondu ${reponse.status}`);
  const resultats = await reponse.json();
  return resultats.map(r => {
    if (r && r.error) throw new Error(`Redis : ${r.error}`);
    return r ? r.result : null;
  });
}

/* ---------- Base en mémoire (tests locaux uniquement) ---------- */
const memoire = new Map();
function table(cle) {
  if (!(memoire.get(cle) instanceof Map)) memoire.set(cle, new Map());
  return memoire.get(cle);
}
function executerEnMemoire([nom, cle, ...args]) {
  switch (String(nom).toUpperCase()) {
    case "GET": return memoire.has(cle) && !(memoire.get(cle) instanceof Map) ? memoire.get(cle) : null;
    case "SET": memoire.set(cle, String(args[0])); return "OK";
    case "INCR": { const v = Number(memoire.get(cle) || 0) + 1; memoire.set(cle, String(v)); return v; }
    case "HSETNX": { const t = table(cle); if (t.has(args[0])) return 0; t.set(args[0], String(args[1])); return 1; }
    case "HGET": { const t = table(cle); return t.has(args[0]) ? t.get(args[0]) : null; }
    case "HGETALL": return [...table(cle)].flat();
    case "HDEL": { const t = table(cle); let n = 0; for (const a of args) if (t.delete(a)) n++; return n; }
    case "DEL": return memoire.delete(cle) ? 1 : 0;
    default: throw new Error(`Commande non simulée en local : ${nom}`);
  }
}
