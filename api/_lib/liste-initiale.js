// Liste affichée tant que rien n'a été enregistré depuis le mode admin.
// Ce sont des exemples : le mode admin permet de tout remplacer.
export const LISTE_INITIALE = {
  exemple: true,
  maj: 0,
  config: {
    theme: "noel",
    titre: "",
    motDore: "",
    sousTitre: "",
    date: "",
    destinataires: "la famille",
    salutation: "Coucou la famille,",
    lettre: [
      "Voici ma liste de Noël, en version un peu spéciale.",
      "Chaque paquet cache une idée. Déballe-les, et si tu veux t'occuper d'un cadeau, appuie sur « Je m'en occupe » et indique ton prénom. Tout le monde voit qui s'occupe de quoi : pas de doublons.",
      "Et surtout, pas de folies. Le plus beau cadeau, ce sera d'être tous ensemble pour les fêtes."
    ],
    fin: "Je vous embrasse fort.",
    signature: ""
  },
  cadeaux: [
    { id: "livre", emoji: "📖", nom: "Le roman que tu as préféré cette année", note: "J'aimerais lire ce qui t'a plu. Avec un petit mot sur la première page, ce serait parfait.", prix: "Environ 20 €", ou: "Ta librairie préférée", details: "Poche ou grand format, peu importe", lien: "", coeur: true, papier: 1, suggestion: "", mot: "" },
    { id: "ecouteurs", emoji: "🎧", nom: "Des écouteurs sans fil", note: "Pour la musique dans les transports. Pas besoin du modèle le plus cher.", prix: "60 à 90 €", ou: "Fnac, Darty, Boulanger", details: "Avec réduction de bruit si possible", lien: "", coeur: true, papier: 4, suggestion: "Papi et Mamie ?", mot: "Idéal à plusieurs : on peut se cotiser." },
    { id: "echarpe", emoji: "🧣", nom: "Une écharpe bien chaude", note: "La mienne a fait son temps. Une grande, douce, qui tient vraiment chaud.", prix: "25 à 40 €", ou: "N'importe quel magasin de vêtements", details: "Gris chiné ou bleu marine", lien: "", coeur: false, papier: 2, suggestion: "", mot: "" },
    { id: "sortie", emoji: "🎟️", nom: "Une sortie ensemble", note: "Un ciné, une expo ou un resto. On choisira la date ensemble.", prix: "Un après-midi ensemble", ou: "Là où tu veux", details: "Un bon fait main ou une simple promesse, ça marche aussi", lien: "", coeur: true, papier: 6, suggestion: "", mot: "" },
    { id: "jeu", emoji: "🎲", nom: "Un jeu de société pour les soirées en famille", note: "Pour jouer tous ensemble pendant les vacances.", prix: "15 à 30 €", ou: "Magasin de jeux ou rayon jouets", details: "Codenames, Dixit ou Skyjo par exemple", lien: "", coeur: false, papier: 5, suggestion: "Les cousins", mot: "" },
    { id: "cafe", emoji: "☕", nom: "Un joli mug et un bon café", note: "Pour les matins difficiles.", prix: "Environ 20 €", ou: "Torréfacteur ou épicerie fine", details: "Café en grains ou moulu", lien: "", coeur: false, papier: 3, suggestion: "", mot: "" },
    { id: "plante", emoji: "🪴", nom: "Une petite plante pour mon bureau", note: "Une plante facile, qui supporte d'être un peu oubliée.", prix: "10 à 20 €", ou: "Jardinerie ou fleuriste", details: "Pothos, cactus ou succulente", lien: "", coeur: false, papier: 4, suggestion: "", mot: "" },
    { id: "chaussettes", emoji: "🧦", nom: "Des chaussettes rigolotes", note: "Le classique indémodable. Plus elles sont drôles, mieux c'est.", prix: "Environ 10 €", ou: "Un peu partout", details: "Avec des motifs de Noël, pourquoi pas", lien: "", coeur: false, papier: 1, suggestion: "", mot: "" }
  ]
};
