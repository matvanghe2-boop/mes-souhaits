// POST /api/admin (en-tête x-cle-admin obligatoire)
//   { action: "verifier" }
//   { action: "enregistrer", liste, base }   base = valeur "maj" de la liste sur laquelle tu as travaillé
//   { action: "liberer", id }                 libère n'importe quel cadeau
//   { action: "vider" }                       libère toutes les réservations (nouvelle occasion)
import { redis, baseDisponible, CLES } from "./_lib/stockage.js";
import { json, erreurBase, lireCorps, memeSecret, nettoyerListe, lireListe, texte, ID_VALIDE } from "./_lib/commun.js";

export async function POST(request) {
  const attendue = process.env.ADMIN_KEY;
  if (!attendue) return json({ erreur: "admin_non_configure", message: "Le mode admin n'est pas configuré." }, 503);
  const fournie = request.headers.get("x-cle-admin") || "";
  if (!fournie || !memeSecret(fournie, attendue)) {
    return json({ erreur: "cle_invalide", message: "Ce lien admin n'est pas valide." }, 401);
  }

  let corps;
  try { corps = await lireCorps(request); }
  catch (e) { return json({ erreur: e.message, message: "Requête invalide." }, e.statut || 400); }

  if (corps.action === "verifier") return json({ ok: true, base: baseDisponible() });
  if (!baseDisponible()) {
    return json({ erreur: "base_absente", message: "La base de données n'est pas encore branchée." }, 503);
  }

  try {
    if (corps.action === "enregistrer") {
      const { liste, erreurs } = nettoyerListe(corps.liste);
      if (erreurs.length) return json({ erreur: "liste_invalide", message: "Quelques champs sont à corriger.", erreurs }, 400);

      const [brut, resaBrut] = await redis(["GET", CLES.liste], ["HGETALL", CLES.resa]);
      const actuelle = lireListe(brut);
      if (corps.base !== undefined && Number(corps.base) !== Number(actuelle.maj || 0)) {
        return json({ erreur: "liste_modifiee", message: "La liste a été modifiée depuis un autre écran.", liste: actuelle }, 409);
      }
      liste.maj = Date.now();
      // Un cadeau supprimé emporte sa réservation.
      const ids = new Set(liste.cadeaux.map(c => c.id));
      const orphelins = [];
      const t = Array.isArray(resaBrut) ? resaBrut : [];
      for (let i = 0; i < t.length; i += 2) if (!ids.has(t[i])) orphelins.push(t[i]);
      const commandes = [["SET", CLES.liste, JSON.stringify(liste)]];
      if (orphelins.length) commandes.push(["HDEL", CLES.resa, ...orphelins]);
      commandes.push(["INCR", CLES.version]);
      await redis(...commandes);
      return json({ ok: true, liste });
    }

    if (corps.action === "vider") {
      // Nouvelle occasion : toutes les réservations sont libérées d'un coup.
      await redis(["DEL", CLES.resa], ["INCR", CLES.version]);
      return json({ ok: true });
    }

    if (corps.action === "liberer") {
      const id = texte(corps.id, 40);
      if (!ID_VALIDE.test(id)) return json({ erreur: "cadeau_inconnu", message: "Ce cadeau n'existe pas." }, 404);
      await redis(["HDEL", CLES.resa, id], ["INCR", CLES.version]);
      return json({ ok: true });
    }

    return json({ erreur: "action_inconnue", message: "Action inconnue." }, 400);
  } catch (e) {
    return erreurBase(e);
  }
}
