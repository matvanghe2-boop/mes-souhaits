// GET / (via une réécriture dans vercel.json) : sert index.html avec le titre, l'aperçu de partage
// et le thème de l'occasion en cours. Les messageries (WhatsApp, SMS…) lisent ces balises sans exécuter
// la page : c'est ici que l'aperçu du lien suit le thème choisi dans le mode admin.
import { readFile } from "node:fs/promises";
import path from "node:path";
import { redis, baseDisponible, CLES } from "./_lib/stockage.js";
import { lireListe, texte, THEMES } from "./_lib/commun.js";

// Mêmes textes par défaut que la table THEMES de index.html.
const META = {
  noel: { emoji: "🎄", titre: "Ma liste de", motDore: "Noël", couleur: "#0c1d1a", sousTitre: "Quelques idées pour remplir la hotte.",
    intro: "Chut… on allume les lumières", rubrique: "Sous le sapin", pied: "Joyeux Noël à tous." },
  anniversaire: { emoji: "🎂", titre: "Ma liste d'", motDore: "anniversaire", couleur: "#160f26", sousTitre: "Quelques idées pour souffler les bougies en beauté.",
    intro: "Chut… on allume les bougies", rubrique: "La pile de cadeaux", pied: "Merci d'avance, et vive la fête !" },
  fete: { emoji: "🎉", titre: "Ma liste pour la", motDore: "fête", couleur: "#0b1229", sousTitre: "Quelques idées pour faire plaisir.",
    intro: "Chut… on allume les lampions", rubrique: "La table des cadeaux", pied: "Merci d'avance, et à très vite !" }
};
const DESCRIPTION = "Déballe les paquets et dis à la famille de quel cadeau tu t'occupes.";
const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const joindre = (debut, mot) => (/['’]$/.test(debut) ? debut + mot : `${debut} ${mot}`);

let gabarit = null;

export async function GET(request) {
  if (!gabarit) gabarit = await readFile(path.join(process.cwd(), "index.html"), "utf8");
  let config = {};
  if (baseDisponible()) {
    try {
      const [brut] = await redis(["GET", CLES.liste]);
      config = lireListe(brut).config || {};
    } catch (e) {
      console.error(e);
    }
  }
  const theme = THEMES.includes(config.theme) ? config.theme : "noel";
  const m = META[theme];
  const debut = texte(config.titre, 40) || m.titre, mot = texte(config.motDore, 30) || m.motDore;
  const titre = joindre(debut, mot);
  const long = titre.length > 22 || Math.max(...titre.split(/\s+/).map(x => x.length)) > 11;
  const h1 = /['’]$/.test(debut) ? `${esc(debut)}<em>${esc(mot)}</em>` : `${esc(debut)} <em>${esc(mot)}</em>`;
  const base = new URL(request.url).origin;
  const bloc = [
    `<title>${esc(titre)}</title>`,
    `<meta name="description" content="${esc(DESCRIPTION)}">`,
    `<meta property="og:type" content="website">`,
    `<meta property="og:url" content="${esc(base)}/">`,
    `<meta property="og:title" content="${esc(`${titre} ${m.emoji}`)}">`,
    `<meta property="og:description" content="${esc(DESCRIPTION)}">`,
    `<meta property="og:image" content="${esc(base)}/partage-${theme}.jpg">`,
    `<meta property="og:image:type" content="image/jpeg">`,
    `<meta property="og:image:width" content="1200">`,
    `<meta property="og:image:height" content="630">`,
    `<meta property="og:image:alt" content="Des paquets cadeaux emballés et le titre Ma liste de souhaits">`,
    `<meta property="og:locale" content="fr_FR">`,
    `<meta name="twitter:card" content="summary_large_image">`,
    `<meta name="theme-color" content="${m.couleur}">`
  ].join("\n");
  // Remplacements par fonction : un « $ » tapé dans un titre ne doit jamais être interprété.
  const entre = (re, contenu) => html => html.replace(re, (_, avant, apres) => avant + contenu + apres);
  const etapes = [
    h => h.replace(/<!--meta:debut-->[\s\S]*?<!--meta:fin-->/, () => `<!--meta:debut-->\n${bloc}\n<!--meta:fin-->`),
    h => h.replace('<html lang="fr">', () => `<html lang="fr" data-theme="${theme}">`),
    h => h.replace(/<h1 id="titre-page">[\s\S]*?<\/h1>/, () => `<h1 id="titre-page"${long ? ' class="long"' : ""}>${h1}</h1>`),
    entre(/(<p class="sous-titre" id="sous-titre">)[\s\S]*?(<\/p>)/, esc(texte(config.sousTitre, 120) || m.sousTitre)),
    entre(/(<p class="intro-texte" id="intro-texte">)[\s\S]*?(<\/p>)/, esc(m.intro)),
    entre(/(<h2 id="titre-liste">)[\s\S]*?(<\/h2>)/, esc(m.rubrique)),
    entre(/(<p class="signe" id="pied-signe">)[\s\S]*?(<\/p>)/, esc(m.pied))
  ];
  // Ancienne adresse (réglée dans Vercel : MIGRATION_DEPUIS → MIGRATION_VERS) : la page emmène
  // les réglages du visiteur vers la nouvelle adresse. Les adresses ne sont pas écrites dans le code.
  const depuis = process.env.MIGRATION_DEPUIS, vers = process.env.MIGRATION_VERS;
  if (depuis && vers && new URL(request.url).hostname === depuis && /^[a-z0-9.-]+$/i.test(vers)) {
    etapes.push(h => h.replace("<head>", () => `<head>\n<script>window.__MIGRATION_VERS__=${JSON.stringify(vers)}</script>`));
  }
  const html = etapes.reduce((h, f) => f(h), gabarit);
  return new Response(html, {
    headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" }
  });
}
