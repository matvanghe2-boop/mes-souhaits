// POST /api/reserver : { action: "prendre" | "liberer", id, nom, message, jeton }
// La prise d'un cadeau est atomique (HSETNX) : si deux personnes cliquent en même temps,
// une seule l'obtient et l'autre reçoit 409 avec le nom de celle qui l'a eu.
import { redis, baseDisponible, CLES } from "./_lib/stockage.js";
import { json, erreurBase, lireCorps, texte, empreinte, lireListe, reservationPublique, ID_VALIDE } from "./_lib/commun.js";

export async function POST(request) {
  if (!baseDisponible()) {
    return json({ erreur: "base_absente", message: "Les réservations ne sont pas encore activées." }, 503);
  }
  let corps;
  try { corps = await lireCorps(request, 5000); }
  catch (e) { return json({ erreur: e.message, message: "Requête invalide." }, e.statut || 400); }

  const action = corps.action;
  const id = texte(corps.id, 40);
  const jeton = texte(corps.jeton, 80);
  if (!ID_VALIDE.test(id)) return json({ erreur: "cadeau_inconnu", message: "Ce cadeau n'existe pas." }, 404);
  if (!/^[a-f0-9]{32,64}$/.test(jeton)) return json({ erreur: "jeton_invalide", message: "Recharge la page puis réessaie." }, 400);
  const h = empreinte(jeton);

  try {
    if (action === "prendre") {
      const nom = texte(corps.nom, 40).replace(/\s+/g, " ");
      const message = texte(corps.message, 140).replace(/\s+/g, " ");
      if (!nom) return json({ erreur: "nom_manquant", message: "Indique ton prénom." }, 400);

      const [listeBrute] = await redis(["GET", CLES.liste]);
      if (!lireListe(listeBrute).cadeaux.some(c => c.id === id)) {
        return json({ erreur: "cadeau_inconnu", message: "Ce cadeau n'est plus dans la liste." }, 404);
      }
      const entree = JSON.stringify({ nom, message, quand: Date.now(), h });
      const [pose, actuel] = await redis(["HSETNX", CLES.resa, id, entree], ["HGET", CLES.resa, id]);
      if (Number(pose) === 1) {
        await redis(["INCR", CLES.version]);
        return json({ ok: true, reservation: reservationPublique(actuel) });
      }
      // Déjà pris : par cette même personne (double clic) ou par quelqu'un d'autre.
      let detenteur = null;
      try { detenteur = JSON.parse(actuel); } catch { /* entrée illisible */ }
      if (detenteur && detenteur.h === h) return json({ ok: true, reservation: reservationPublique(actuel) });
      const pub = reservationPublique(actuel);
      return json({ erreur: "deja_pris", message: `${pub ? pub.nom : "Quelqu'un"} s'en occupe déjà.`, reservation: pub }, 409);
    }

    if (action === "liberer") {
      const [actuel] = await redis(["HGET", CLES.resa, id]);
      if (!actuel) return json({ ok: true });
      let detenteur = null;
      try { detenteur = JSON.parse(actuel); } catch { /* entrée illisible */ }
      if (!detenteur || detenteur.h !== h) {
        return json({ erreur: "pas_a_toi", message: "Seule la personne qui s'en occupe peut se retirer." }, 403);
      }
      await redis(["HDEL", CLES.resa, id], ["INCR", CLES.version]);
      return json({ ok: true });
    }

    return json({ erreur: "action_inconnue", message: "Action inconnue." }, 400);
  } catch (e) {
    return erreurBase(e);
  }
}
