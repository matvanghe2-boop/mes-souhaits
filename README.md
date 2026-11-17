# Mes souhaits

Une liste de souhaits à partager en famille, pour Noël, un anniversaire ou une fête.
Chaque idée est un paquet à déballer. On peut dire « Je m'en occupe » avec son prénom,
et tout le monde voit qui s'occupe de quoi, en direct, sans doublon possible.

## Ce qu'il y a dedans

- `page.html` : toute la page (décor, animations, réservations, éditeur du mode admin). Elle est servie par `api/page.js`, jamais directement, pour que le titre et l'aperçu de partage suivent l'occasion.
- `api/` : les fonctions Vercel.
  - `page.js` sert la page avec le titre et l'aperçu de partage de l'occasion en cours.
  - `etat.js` renvoie la liste et les réservations.
  - `reserver.js` prend ou libère un cadeau (la prise est atomique : un seul gagnant si deux personnes cliquent en même temps).
  - `admin.js` enregistre la liste, libère un cadeau ou toutes les réservations.
- `outils/` : serveur de test local et génération des images de partage (non déployés).

## Réglages sur Vercel

| Variable | Rôle |
| --- | --- |
| `KV_REST_API_URL`, `KV_REST_API_TOKEN` | Base Redis (Upstash), ajoutées en branchant la base au projet |
| `ADMIN_KEY` | Clé du mode admin. Le lien admin est `https://<adresse du site>/#admin=<clé>` |
| `MIGRATION_DEPUIS`, `MIGRATION_VERS` | Facultatif : ancienne et nouvelle adresse, pour emmener les réglages des visiteurs après un changement d'adresse |

## En local

```bash
node outils/serveur-local.mjs
```

Puis ouvrir http://localhost:8790 (base en mémoire). Mode admin local : http://localhost:8790/#admin=cle-admin-de-test

## Images de partage

```bash
python outils/generer-images.py
```

Demande Google Chrome et la bibliothèque Python Pillow. Produit `partage-noel.jpg`, `partage-anniversaire.jpg`, `partage-fete.jpg` et `apple-touch-icon.png`.

## Mettre en ligne

```bash
npx vercel deploy --prod
```
