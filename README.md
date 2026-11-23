# Ski Live TV

Première version statique en français, conçue pour un écran TV et une navigation à la télécommande. Aucun compte, clé API, compilation ou installation de dépendances n’est nécessaire.

## Démarrer

Sur Mac, double-cliquer sur `DEMARRER-SKI-LIVE-TV.command`. Une fenêtre de terminal reste ouverte pendant le fonctionnement du site ; la fermer arrête le site.

Ou, dans le dossier extrait, lancer manuellement :

```sh
python3 -m http.server 8080
```

Ouvrir `http://localhost:8080` sur l’ordinateur. Pour tester depuis la TV sur le même Wi-Fi, ouvrir `http://ADRESSE-IP-LOCALE-DE-L-ORDINATEUR:8080` et laisser le terminal ouvert. Le pare-feu doit autoriser la connexion sur le réseau local. Ne pas ouvrir `index.html` directement : le mode `file://` peut conserver une ancienne version et bloquer la météo ou certaines webcams. Pour la télévision, utiliser l’adresse HTTP/HTTPS publiée ou celle du petit serveur local ci-dessus.

## Déploiement web gratuit — GitHub Pages

1. Créer un compte GitHub si nécessaire puis un dépôt **public**, par exemple `ski-live-tv`. Le contenu du dépôt sera public.
2. Dans **Add file → Upload files**, déposer à la racine tout le contenu du dossier, y compris le dossier `assets` et si possible `.nojekyll`. Ne pas déposer uniquement le ZIP ou un dossier contenant lui-même ces fichiers.
3. Enregistrer les fichiers avec **Commit changes**.
4. Dans **Settings → Pages**, sélectionner **Deploy from a branch**, branche `main`, dossier **/(root)**, puis **Save**.
5. Attendre la publication et ouvrir l’URL indiquée par GitHub : généralement `https://VOTRE-COMPTE.github.io/ski-live-tv/`.
6. Saisir cette adresse dans le navigateur VIDAA, l’ajouter aux favoris et utiliser le mode plein écran du navigateur s’il est proposé.

GitHub Pages est disponible avec GitHub Free pour les dépôts publics. Instructions officielles : https://docs.github.com/en/pages/quickstart et https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site . Aucune publication n’a été effectuée à votre place.

## Fonctionnalités

- Les 16 stations demandées, avec Val d’Isère affichée au premier lancement.
- Favoris : Val d’Isère, La Bresse-Hohneck, Cervinia, Livigno. Bouton pour ne faire défiler que ces quatre stations.
- Rotation des stations toutes les 30 secondes, réglable à 15, 30, 60 ou 120 secondes ; pause/reprise et boutons précédent/suivant.
- Hauteur de neige déjà présente au sol, estimée par Open-Meteo au village et en altitude ; température, vent et prévisions sur sept jours en complément.
- Vue générale avec les 16 stations ; classement de la neige au sol en altitude avec la valeur au village à côté.
- Vrai fond de carte OpenStreetMap enregistré dans le site, avec les 16 stations et la station courante mise en évidence.
- Webcam visible directement dans le dashboard, sans cliquer. Les vues disponibles tournent automatiquement toutes les 20 secondes, indépendamment de la rotation des stations.
- Les quatre favorites utilisent plusieurs flux ou images directes lorsque disponibles. Les autres stations ouvrent automatiquement leur page webcam dans le cadre ; un lien direct reste présent lorsque le diffuseur interdit l’intégration ou demande un choix de cookies.
- Cache local de six heures maximum et reprise réseau ; affichage explicite des données anciennes et absentes.

## Télécommande et clavier

| Commande | Action |
| --- | --- |
| Flèches | Déplacer le cadre de focus entre les commandes |
| Gauche / droite sur le grand bloc station | Station précédente / suivante |
| OK / Entrée | Activer la commande ; sur le bloc station, pause/reprise |
| CH+ / CH−, Page suivante / précédente | Changer de station, si la TV transmet ces touches |
| Espace | Pause/reprise |
| Retour / Échap | Fermer la vue générale, le classement ou l’aide |
| Tab / Maj+Tab sur ordinateur | Parcourir les commandes |

Une interaction suspend le décompte pendant 30 secondes, puis le décompte restant reprend. Une vue ouverte suspend aussi la rotation. Les liens externes utilisent la même fenêtre : utiliser le retour du navigateur pour revenir à Ski Live TV. Certaines TV réservent CH+/CH− au système : les flèches et les boutons à l’écran restent les commandes principales.

## Données et précision

API : https://open-meteo.com/en/docs . Une requête groupée pour 16 points toutes les 15 minutes pendant que la page est visible. Le bouton Actualiser permet une requête supplémentaire. L’API peut comptabiliser le volume selon les coordonnées et les variables : une requête HTTP ne correspond pas nécessairement à une seule unité de quota.

Les valeurs « maintenant » sont calculées par des **modèles météo**, pas mesurées par une station sur les pistes. Les coordonnées et altitudes de `stations.js` correspondent à des points indicatifs au village/front de neige. Les conditions au sommet peuvent être très différentes. Le fuseau des données est `Europe/Paris`, identique pour les quatre pays concernés. L’horloge en haut utilise l’heure réglée sur l’appareil.

`snow_depth` est la hauteur de neige déjà présente au sol selon le modèle, convertie de mètres en centimètres. Deux points sont interrogés pour chaque station : village/front de neige et altitude du domaine. Ces estimations peuvent différer des relevés des pisteurs ; le bouton Bulletin neige mène à la mesure officielle disponible. Le classement trie les stations selon le point d’altitude. `snowfall_sum`, affiché dans le graphique, correspond uniquement aux chutes prévues par jour. Les barres quotidiennes ont une échelle relative, distincte des degrés Celsius ; les cm exacts apparaissent dessous.

Les données absentes restent `—`. Un zéro signifie une valeur fournie égale à zéro. En cas de panne, un cache valide peut rester visible avec son âge ; au-delà de six heures, les chiffres sont retirés. Sans première connexion réussie, aucun chiffre n’est affiché. Aucune donnée de démonstration n’est utilisée par l’application.

Les ouvertures de pistes ne sont pas importées automatiquement : le lien renvoie à la source. Les vues webcam utilisent selon les stations une image directe ou une page tierce dans un cadre ; certains diffuseurs peuvent la bloquer, afficher leurs cookies ou demander un navigateur plus récent. Le lien Toutes les webcams permet alors d’ouvrir la source directement.

Attribution : données météo Open-Meteo, licence CC BY 4.0 selon https://open-meteo.com/en/terms ; fond de carte © contributeurs OpenStreetMap selon https://www.openstreetmap.org/copyright . L’API gratuite est destinée à l’usage non commercial, sous quotas et sans garantie de disponibilité : https://open-meteo.com/en/pricing . Pour un usage commercial, vérifier l’offre applicable. Les webcams appartiennent à leurs diffuseurs ; le site affiche les sources publiques indiquées dans `stations.js` et conserve le lien vers leur page d’origine.

## Compatibilité VIDAA

JavaScript classique ES5, `XMLHttpRequest`, SVG, Flexbox ; aucun module JS, `fetch`, framework, WebGL, police distante ou vidéo automatique. Le site n’a besoin que d’un accès HTTPS à `api.open-meteo.com`. Le navigateur doit prendre en charge TLS, JavaScript, SVG et Flexbox. Le stockage local est facultatif : son indisponibilité ne bloque pas la météo.

La compatibilité réelle dépend de la version de VIDAA et du modèle Edenwood. Les essais navigateur ne remplacent pas l’essai physique sur votre télévision. Si l’image est coupée, désactiver le surbalayage (overscan) ou choisir l’ajustement à l’écran dans les réglages TV. Si des touches sont capturées par le navigateur, employer ses commandes de retour ou les boutons visibles.

## Fichiers et vérifications

- `index.html` : structure et liens initiaux.
- `style.css` : écran TV et adaptation mobile.
- `stations.js` : coordonnées, altitude, favoris, sources officielles.
- `weather.js` : requête, validation, cumul et classement.
- `app.js` : affichage, cache, rotation, navigation.
- `tests/browser.html` : tests autonomes avec météo fictive isolée, jamais chargés par le site principal.

Lancer le serveur et ouvrir `http://localhost:8080/tests/browser.html` pour exécuter les tests de robustesse. Les tests interceptent le réseau et le stockage **uniquement dans leur iframe**, sans modifier les préférences de l’application réelle.

Consulter `TESTS.md` pour les vérifications effectuées et les limites restantes. Pour changer les liens ou les points météo, modifier `stations.js` puis republier les fichiers.
