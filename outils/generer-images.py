# Génère l'image de partage (partage.jpg, 1200 × 630) et l'icône (apple-touch-icon.png, 180 × 180)
# à partir de outils/partage.html, avec le navigateur Chrome déjà installé sur Windows.
# Lancer depuis le dossier du projet :  python outils/generer-images.py
import pathlib
import subprocess
import tempfile

from PIL import Image

RACINE = pathlib.Path(__file__).resolve().parent.parent
SOURCE = (RACINE / "outils" / "partage.html").as_uri()
CHROME = r"C:\Program Files\Google\Chrome\Application\chrome.exe"


def capture(url, largeur, hauteur, sortie):
    with tempfile.TemporaryDirectory() as profil:
        subprocess.run([
            CHROME, "--headless=new", "--disable-gpu", "--hide-scrollbars", "--no-first-run",
            f"--user-data-dir={profil}", f"--window-size={largeur},{hauteur}",
            "--virtual-time-budget=8000", f"--screenshot={sortie}", url,
        ], check=True, timeout=120)


THEMES = ("noel", "anniversaire", "fete")

with tempfile.TemporaryDirectory() as dossier:
    for theme in THEMES:
        brut = pathlib.Path(dossier) / f"partage-{theme}.png"
        capture(f"{SOURCE}?theme={theme}", 1200, 630, brut)
        image = Image.open(brut).convert("RGB").crop((0, 0, 1200, 630))
        image.save(RACINE / f"partage-{theme}.jpg", "JPEG", quality=86, optimize=True, progressive=True)

    brut_icone = pathlib.Path(dossier) / "icone.png"
    capture(SOURCE + "?icone=1", 180, 180, brut_icone)
    Image.open(brut_icone).convert("RGB").crop((0, 0, 180, 180)).save(RACINE / "apple-touch-icon.png", optimize=True)

for nom in [f"partage-{t}.jpg" for t in THEMES] + ["apple-touch-icon.png"]:
    f = RACINE / nom
    print(nom, Image.open(f).size, f"{f.stat().st_size // 1024} Ko")
