// Serveur de test local : sert la page et l'API avec une base en mémoire (rien n'est envoyé en ligne).
// Lancer :  node outils/serveur-local.mjs   puis ouvrir http://localhost:8790
// Mode admin local : http://localhost:8790/#admin=cle-admin-de-test
import http from "node:http";
import path from "node:path";
import { readFile } from "node:fs/promises";
import { fileURLToPath, pathToFileURL } from "node:url";

process.env.NOEL_MEMOIRE = "1";
process.env.ADMIN_KEY = process.env.ADMIN_KEY || "cle-admin-de-test";

const racine = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PORT = Number(process.env.PORT || 8790);
const charger = f => import(pathToFileURL(path.join(racine, f)).href);
process.chdir(racine);
const routes = {
  "/": await charger("api/page.js"),
  "/demo": await charger("api/page.js"),
  "/api/etat": await charger("api/etat.js"),
  "/api/reserver": await charger("api/reserver.js"),
  "/api/admin": await charger("api/admin.js")
};

http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const module = routes[url.pathname];
    if (module) {
      const traiter = module[req.method];
      if (!traiter) { res.writeHead(405); res.end(); return; }
      const morceaux = [];
      for await (const m of req) morceaux.push(m);
      const entetes = {};
      for (const k of ["content-type", "x-cle-admin"]) if (req.headers[k]) entetes[k] = req.headers[k];
      const requete = new Request(url, {
        method: req.method,
        headers: entetes,
        body: req.method === "GET" || req.method === "HEAD" ? undefined : Buffer.concat(morceaux)
      });
      const reponse = await traiter(requete);
      res.writeHead(reponse.status, Object.fromEntries(reponse.headers));
      res.end(Buffer.from(await reponse.arrayBuffer()));
      return;
    }
    const statiques = {
      "/page.html": ["page.html", "text/html; charset=utf-8"],
      "/outils/apercu.html": ["outils/apercu.html", "text/html; charset=utf-8"],
      "/partage-noel.jpg": ["partage-noel.jpg", "image/jpeg"],
      "/partage-anniversaire.jpg": ["partage-anniversaire.jpg", "image/jpeg"],
      "/partage-fete.jpg": ["partage-fete.jpg", "image/jpeg"],
      "/apple-touch-icon.png": ["apple-touch-icon.png", "image/png"]
    };
    if (statiques[url.pathname]) {
      const [fichier, type] = statiques[url.pathname];
      res.writeHead(200, { "content-type": type, "cache-control": "no-store" });
      res.end(await readFile(path.join(racine, fichier)));
      return;
    }
    res.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    res.end("Introuvable");
  } catch (e) {
    console.error(e);
    res.writeHead(500);
    res.end("Erreur");
  }
}).listen(PORT, "127.0.0.1", () => console.log(`Liste de Noël en local : http://localhost:${PORT}`));
