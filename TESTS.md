# Vérifications

Vérifié le 23 novembre 2026 :

- chargement réel d’Open-Meteo pour 16 stations × 2 altitudes ;
- hauteur de neige au sol convertie de mètres en centimètres ;
- fond OpenStreetMap local, courbes, rotation automatique et filtre des quatre favoris ;
- classement des 16 stations par neige au sol en altitude ;
- webcam affichée sans clic, rotation automatique entre les vues et lien de repli vers la page officielle ;
- navigation clavier/télécommande, fermeture avec Retour/Échap ;
- cache, panne réseau, réponse incomplète, limite API et retour du réseau ;
- absence de débordement horizontal à 1280 px ;
- contrôle visuel à 1920 × 1080.

La page `tests/browser.html` exécute 36 vérifications isolées avec des données fictives. Résultat final : 36 réussites, 0 échec.

Limites restantes : les webcams sont hébergées par des tiers. Une station peut changer son adresse, refuser l’affichage en cadre, demander un choix de cookies ou nécessiter un navigateur plus récent. Le lien « Page webcam » est conservé pour ce cas. La compatibilité des touches doit être confirmée sur le modèle Edenwood/VIDAA réel.
