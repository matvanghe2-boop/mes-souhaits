import { createHash, timingSafeEqual } from "node:crypto";
import { LISTE_INITIALE } from "./liste-initiale.js";

export const ID_VALIDE = /^[a-zA-Z0-9_-]{1,40}$/;
export const THEMES = ["noel", "anniversaire", "fete"];

export function json(donnees, statut = 200) {
  return new Response(JSON.stringify(donnees), {
    status: statut,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" }
  });
}

export function erreurBase(e) {
  console.error(e);
  return json({ erreur: "base_indisponible", message: "La base de données ne répond pas. Réessaie dans un instant." }, 503);
}

export async function lireCorps(request, max = 200000) {
  const brut = await request.text();
  if (brut.length > max) throw Object.assign(new Error("trop_gros"), { statut: 413 });
  try {
    const v = JSON.parse(brut || "{}");
    return v && typeof v === "object" ? v : {};
  } catch {
    throw Object.assign(new Error("json_invalide"), { statut: 400 });
  }
}

export const empreinte = s => createHash("sha256").update(String(s)).digest("hex");

export function memeSecret(a, b) {
  return timingSafeEqual(Buffer.from(empreinte(a)), Buffer.from(empreinte(b)));
}

/** Texte nettoyé : sans caractères de contrôle, sans espaces autour, coupé à `max`. */
export function texte(v, max) {
  const s = typeof v === "string" ? v : v == null ? "" : String(v);
  return s.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, "").trim().slice(0, max);
}

/** Adresse web http(s) valide, ou "" ; ajoute https:// si besoin. */
export function lienSur(s) {
  s = String(s || "").trim();
  if (!s) return "";
  if (!/^[a-z][a-z0-9+.-]*:/i.test(s)) s = "https://" + s;
  try {
    const u = new URL(s);
    if ((u.protocol === "https:" || u.protocol === "http:") && u.hostname.includes(".")) return u.href;
  } catch { /* adresse invalide */ }
  return "";
}

export function listeInitiale() {
  return structuredClone(LISTE_INITIALE);
}

export function lireListe(valeur) {
  if (!valeur) return listeInitiale();
  try { return JSON.parse(valeur); } catch { return listeInitiale(); }
}

/** Réservation telle que tout le monde peut la voir (sans le secret de la personne). */
export function reservationPublique(brut) {
  if (!brut) return null;
  try {
    const r = JSON.parse(brut);
    return { nom: r.nom, message: r.message || "", quand: r.quand, cle: String(r.h || "").slice(0, 16) };
  } catch { return null; }
}

export function reservationsPubliques(plat) {
  const sortie = {};
  const t = Array.isArray(plat) ? plat : [];
  for (let i = 0; i + 1 < t.length; i += 2) {
    const r = reservationPublique(t[i + 1]);
    if (r) sortie[t[i]] = r;
  }
  return sortie;
}

/** Vérifie et nettoie la liste envoyée par le mode admin. */
export function nettoyerListe(brut) {
  const erreurs = [];
  const b = brut && typeof brut === "object" ? brut : {};
  const c = b.config && typeof b.config === "object" ? b.config : {};
  const date = texte(c.date, 10);
  const config = {
    theme: THEMES.includes(c.theme) ? c.theme : "noel",
    titre: texte(c.titre, 40),
    motDore: texte(c.motDore, 30),
    sousTitre: texte(c.sousTitre, 120),
    date: /^\d{4}-\d{2}-\d{2}$/.test(date) && !Number.isNaN(Date.parse(date)) ? date : "",
    destinataires: texte(c.destinataires, 40) || "la famille",
    salutation: texte(c.salutation, 60),
    lettre: (Array.isArray(c.lettre) ? c.lettre : []).map(p => texte(p, 600)).filter(Boolean).slice(0, 8),
    fin: texte(c.fin, 120),
    signature: texte(c.signature, 40)
  };
  const vus = new Set();
  const cadeaux = [];
  for (const g of (Array.isArray(b.cadeaux) ? b.cadeaux : []).slice(0, 60)) {
    if (!g || typeof g !== "object") continue;
    const id = texte(g.id, 40);
    if (!ID_VALIDE.test(id) || vus.has(id)) { erreurs.push({ id, champ: "id", message: "Identifiant de cadeau invalide." }); continue; }
    vus.add(id);
    const nom = texte(g.nom, 120);
    if (!nom) erreurs.push({ id, champ: "nom", message: "Donne un nom à ce cadeau." });
    const lienBrut = texte(g.lien, 500);
    const lien = lienBrut ? lienSur(lienBrut) : "";
    if (lienBrut && !lien) erreurs.push({ id, champ: "lien", message: "Ce lien ne ressemble pas à une adresse web. Exemple : https://www.exemple.fr/produit" });
    const papier = Math.round(Number(g.papier));
    cadeaux.push({
      id,
      emoji: texte(g.emoji, 16) || "🎁",
      nom,
      note: texte(g.note, 400),
      prix: texte(g.prix, 60),
      ou: texte(g.ou, 80),
      details: texte(g.details, 120),
      lien,
      coeur: g.coeur === true,
      papier: papier >= 1 && papier <= 6 ? papier : 1,
      suggestion: texte(g.suggestion, 80),
      mot: texte(g.mot, 200)
    });
  }
  return { liste: { exemple: false, maj: 0, config, cadeaux }, erreurs };
}
