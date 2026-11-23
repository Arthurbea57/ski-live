/* Points météo indicatifs au village / front de neige, pas au sommet. */
(function (root) {
  'use strict';
  var fr = 'https://meteofrance.com/meteo-montagne/alpes-du-nord/risques-avalanche';
  var ch = 'https://www.slf.ch/fr/bulletin-davalanches-et-situation-nivologique/';
  var it = 'https://bollettini.aineva.it/';
  var summitAltitudes = {'chamonix':3275,'val-disere':3000,'tignes':3032,'courchevel':2738,'val-thorens':3200,'la-grave':3200,'la-bresse':1350,'la-clusaz':2500,'cervinia':3480,'livigno':2798,'macugnaga':3000,'zermatt':3883,'verbier':3330,'adelboden':2362,'saas-fee':3500,'soelden':3340};
  var snowReports = {'val-disere':'https://www.valdisere.com/live/enneigement/','tignes':'https://en.tignes.net/tignes-weather','val-thorens':'https://www.valthorens.com/infos-neige/','la-bresse':'https://labresse.labellemontagne.com/fr/hiver/infos-station/meteo/','cervinia':'https://cervinia.it/meteo/','livigno':'https://www.livigno.eu/en/snow-data','zermatt':'https://www.matterhornparadise.ch/en/information/snow-report','adelboden':'https://www.adelboden-lenk.ch/de/Service/Wetter','soelden':'https://www.soelden.com/en/live-information/livecams'};
  var webcamEmbeds = {'val-disere':'https://www.valdisere.com/live/webcams/','la-bresse':'https://labresse.labellemontagne.com/fr/hiver/infos-station/webcams/','livigno':'https://webview.livigno.eu/webcam/index','cervinia':'https://cervinia.it/en/webcam'};
  var cameraSources = {
    'val-disere':[
      ['Solaise 2560 m','image-template','https://skaping.s3.gra.io.cloud.ovh.net/val-d-isere/solaise/{date}/hd/{time}.jpg'],
      ['Village 1850 m','image-template','https://skaping.s3.gra.io.cloud.ovh.net/val-d-isere/village/panoramique/{date}/hd/{time}.jpg'],
      ['Crête des Leissières 3000 m','image-template','https://skaping.s3.gra.io.cloud.ovh.net/val-d-isere/leissieres/{date}/hd/{time}.jpg'],
      ['Borsat 2771 m','image-template','https://skaping.s3.gra.io.cloud.ovh.net/val-d-isere/{date}/hd/{time}.jpg'],
      ['Fornet 2327 m','image-template','https://skaping.s3.gra.io.cloud.ovh.net/val-d-isere/fornet/{date}/hd/{time}.jpg'],
      ['Glacier du Pisaillas 2725 m','image-template','https://skaping.s3.gra.io.cloud.ovh.net/val-d-isere/pisallais/{date}/hd/{time}.jpg'],
      ['Vallon du Prariond 2324 m','image-template','https://skaping.s3.gra.io.cloud.ovh.net/val-d-isere/refuge-du-prariond/{date}/hd/{time}.jpg']
    ],
    'la-bresse':[
      ['Front de neige 910 m','iframe','https://www.skaping.com/labresse/front-de-neige'],
      ['Sommet du Hohneck 1363 m','iframe','https://www.skaping.com/la-bresse/hohneck'],
      ['Haut de Vologne 1181 m','iframe','https://www.skaping.com/la-bresse/haut-de-vologne'],
      ['Petit Artimont 1200 m','iframe','https://www.skaping.com/la-bresse/sommet-petit-artimont']
    ],
    'livigno':[
      ['Panoramique 360°','image','https://wtvthmb.feratel.com/thumbnails/6173.jpeg?design=v5&dcsdesign=feratel4'],
      ['Mottolino','image','https://live-image.panomax.com/cams/1628/preview_og.jpg'],
      ['Carosello Intermedia','image','https://webcam.livigno.eu/carosello-intermedia/1430.jpg'],
      ['Mottolino panorama','image','https://webcam.livigno.eu/mottolino-pano/1430.jpg'],
      ['Passo della Forcola','image','https://www.comune.livigno.so.it/s3/3608/public/forc_image.jpg'],
      ['Passo del Foscagno','image','https://www.comune.livigno.so.it/s3/3608/public/pf_image.jpg']
    ],
    'cervinia':[
      ['Plateau Rosa 3480 m','iframe','https://cervinia.it/webcam/plateau-rosa.html'],
      ['Plan Maison 2550 m','iframe','https://cervinia.it/webcam/plan-maison.html'],
      ['Breuil-Cervinia','iframe','https://webtv.feratel.com/webtv/?design=v5&cam=6350&lg=it'],
      ['Cime Bianche','iframe','https://webtv.feratel.com/webtv/?cam=6351&t=1&design=v5&c0=0&c2=1&lg=it&s=0']
    ]
  };
  root.SKI_STATIONS = [
    ['chamonix','Chamonix','France','Mont-Blanc',45.9237,6.8694,1035,false,'https://www.chamonix.com/webcams','https://www.chamonix.com/',fr],
    ['val-disere','Val d’Isère','France','Vanoise',45.4486,6.9806,1850,true,'https://www.valdisere.com/en/live/webcams/','https://www.valdisere.com/live/',fr],
    ['tignes','Tignes','France','Vanoise',45.4686,6.9067,2100,false,'https://en.tignes.net/webcams','https://www.tignes.net/',fr],
    ['courchevel','Courchevel','France','Vanoise',45.4153,6.6347,1850,false,'https://www.mairie-courchevel.com/fr/webcams','https://www.les3vallees.com/fr/live/webcams',fr],
    ['val-thorens','Val Thorens','France','Vanoise',45.2978,6.5809,2300,false,'https://www.valthorens.com/en/webcams/','https://www.valthorens.com/',fr],
    ['la-grave','La Grave','France','Oisans',45.0458,6.3064,1450,false,'https://la-grave.com/webcams/','https://la-grave.com/','https://meteofrance.com/meteo-montagne'],
    ['la-bresse','La Bresse-Hohneck','France','Vosges',48.0361,6.9714,900,true,'https://www.labresse.net/en/nos-webcams/','https://labresse.labellemontagne.com/','https://meteofrance.com/la-fabrique-prototypes/bulletin-securite-montagne'],
    ['la-clusaz','La Clusaz','France','Aravis',45.9044,6.4231,1040,false,'https://www.laclusaz.com/webcams/','https://www.laclusaz.com/webcams/',fr],
    ['cervinia','Cervinia','Italie','Vallée d’Aoste',45.937,7.631,2050,true,'https://www.cervinia.it/webcam/','https://www.cervinia.it/',it],
    ['livigno','Livigno','Italie','Lombardie',46.5386,10.1357,1816,true,'https://www.livigno.eu/en/webcam','https://www.livigno.eu/',it],
    ['macugnaga','Macugnaga','Italie','Piémont',45.9694,7.9672,1327,false,'https://macugnaga-monterosa.com/contenuti/325814/webcam','https://macugnaga-monterosa.com/',it],
    ['zermatt','Zermatt','Suisse','Valais',46.0207,7.7491,1620,false,'https://www.matterhornparadise.ch/en/information/webcams','https://www.matterhornparadise.ch/',ch],
    ['verbier','Verbier','Suisse','Valais',46.0969,7.2286,1500,false,'https://www.verbier.ch/en/practice/live/webcams/','https://www.verbier.ch/',ch],
    ['adelboden','Adelboden','Suisse','Oberland bernois',46.4944,7.5606,1350,false,'https://www.adelboden-lenk.ch/fr/Service/Webcams','https://www.adelboden-lenk.ch/',ch],
    ['saas-fee','Saas-Fee','Suisse','Valais',46.108,7.9272,1800,false,'https://www.saas-fee.ch/en/webcams','https://www.saas-fee.ch/en/webcams',ch],
    ['soelden','Sölden','Autriche','Tyrol',46.9697,11.0108,1377,false,'https://www.soelden.com/en/live-information/livecams','https://www.soelden.com/de/live-infos/status?card=trails','https://avalanche.report/simple']
  ].map(function (r) {
    var cams=(cameraSources[r[0]]||[[r[1]+' · page officielle','iframe',webcamEmbeds[r[0]]||r[8]]]).map(function(c){return {label:c[0],type:c[1],url:c[2]};});
    return {id:r[0],name:r[1],country:r[2],region:r[3],lat:r[4],lon:r[5],elevation:r[6],summit:summitAltitudes[r[0]],favorite:r[7],webcam:r[8],webcamEmbed:webcamEmbeds[r[0]]||r[8],cameras:cams,official:r[9],avalanche:r[10],snowReport:snowReports[r[0]]||r[9]};
  });
}(typeof window !== 'undefined' ? window : this));
