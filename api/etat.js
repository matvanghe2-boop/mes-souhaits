// GET /api/etat : la liste + qui s'occupe de quoi.
// Avec ?v=<version>, répond seulement { inchange: true } si rien n'a bougé (appel très léger).
import { redis, baseDisponible, CLES } from "./_lib/stockage.js";
import { json, erreurBase, lireListe, listeInitiale, reservationsPubliques } from "./_lib/commun.js";

export async function GET(request) {
  if (!baseDisponible()) {
    return json({ horsLigne: true, version: 0, liste: listeInitiale(), reservations: {} });
  }
  try {
    const v = new URL(request.url).searchParams.get("v");
    if (v !== null) {
      const [version] = await redis(["GET", CLES.version]);
      const actuelle = Number(version || 0);
      if (String(actuelle) === v) return json({ inchange: true, version: actuelle });
    }
    const [version, liste, resa] = await redis(["GET", CLES.version], ["GET", CLES.liste], ["HGETALL", CLES.resa]);
    return json({ version: Number(version || 0), liste: lireListe(liste), reservations: reservationsPubliques(resa) });
  } catch (e) {
    return erreurBase(e);
  }
}
