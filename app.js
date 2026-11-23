(function () {
  'use strict';
  var stations=window.SKI_STATIONS, W=window.SkiWeather, records={}, index=1;
  var favoritesOnly=false, playing=true, seconds=30, remaining=30, lastTick=Date.now(), modal=null;
  var busy=false, lastAttempt=0, lastFocus=null, cacheKey='ski-live-tv-v1', holdUntil=0;
  var lastError='', durations=[15,30,60,120], REFRESH=900000, MAX_CACHE=21600000;
  var cameraIndex=0, cameraChangedAt=Date.now(), webcamLoadToken=0, CAMERA_SECONDS=20;
  function el(id){return document.getElementById(id);}
  function text(id,value){el(id).textContent=value;}
  function esc(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
  function num(v,d){if(!W.number(v)){return '—';}var rounded=v.toFixed(d||0);return (Number(rounded)===0?(0).toFixed(d||0):rounded).replace('.',',');}
  function localDay(){
    // All stations share CET/CEST. Compute Paris day without requiring Intl on older TVs.
    var now=new Date(), y=now.getUTCFullYear();
    var march=new Date(Date.UTC(y,2,31,1)), october=new Date(Date.UTC(y,9,31,1));
    march.setUTCDate(31-march.getUTCDay());october.setUTCDate(31-october.getUTCDay());
    var offset=now>=march && now<october?2:1;
    return new Date(now.getTime()+offset*3600000).toISOString().slice(0,10);
  }
  function dayLabel(s){var d=new Date(s+'T12:00:00Z');return ['dim.','lun.','mar.','mer.','jeu.','ven.','sam.'][d.getUTCDay()]+' '+d.getUTCDate();}
  function age(r){return r?Math.max(0,Math.floor((Date.now()-r.savedAt)/60000)):0;}
  function usable(s){var r=records[s.id];return r && Date.now()-r.savedAt<MAX_CACHE && r.savedAt<=Date.now() && W.valid(r.data)?r:null;}
  function fresh(r){return r && age(r)<30 && r.data.daily.time[0]===localDay();}
  function sequence(){return stations.filter(function(s){return !favoritesOnly || s.favorite;});}
  function setStation(id){for(var i=0;i<stations.length;i++){if(stations[i].id===id){index=i;break;}}cameraIndex=0;cameraChangedAt=Date.now();remaining=seconds;render();savePreferences();}
  function advance(delta){var list=sequence(), pos=0;for(var i=0;i<list.length;i++){if(list[i].id===stations[index].id){pos=i;break;}}setStation(list[(pos+delta+list.length)%list.length].id);}
  function togglePlay(){playing=!playing;remaining=seconds;updatePlayback();savePreferences();}
  function updatePlayback(){text('play',playing?'Pause':'Lecture');el('play').setAttribute('aria-pressed',String(playing));text('duration',seconds+' s / station');text('filter',favoritesOnly?'★ Les 4 favoris':'Toutes les stations');el('filter').setAttribute('aria-pressed',String(favoritesOnly));}
  function savePreferences(){try{localStorage.setItem('ski-live-tv-preferences',JSON.stringify({id:stations[index].id,favoritesOnly:favoritesOnly,seconds:seconds,playing:playing}));}catch(e){/* TV storage can be disabled. */}}
  function load(){
    try{var p=JSON.parse(localStorage.getItem('ski-live-tv-preferences')||'null');if(p){favoritesOnly=p.favoritesOnly===true;playing=p.playing!==false;if(durations.indexOf(p.seconds)!==-1){seconds=p.seconds;remaining=seconds;}stations.forEach(function(s,i){if(s.id===p.id){index=i;}});if(favoritesOnly&&!stations[index].favorite){index=1;}}}catch(e){}
    try{var cache=JSON.parse(localStorage.getItem(cacheKey)||'{}');stations.forEach(function(s){var r=cache[s.id];if(r && W.number(r.savedAt) && r.savedAt<=Date.now() && Date.now()-r.savedAt<MAX_CACHE && W.valid(r.data)){records[s.id]=r;}});}catch(e){}
  }
  function requestWeather(force){
    if(busy || (!force && Date.now()-lastAttempt<REFRESH)){return;}
    busy=true;lastAttempt=Date.now();el('refresh').disabled=true;text('refresh','Chargement…');lastError='';renderStatus();
    var xhr=new XMLHttpRequest(), finished=false;
    var timeout=setTimeout(function(){xhr.abort();finish('Délai réseau dépassé');},22000);
    function finish(error){if(finished){return;}finished=true;clearTimeout(timeout);busy=false;lastError=error||'';el('refresh').disabled=false;text('refresh','Actualiser');render();if(modal==='overview'||modal==='ranking'){renderOverlay(true);}}
    xhr.open('GET',W.url(stations),true);xhr.timeout=20000;
    xhr.onload=function(){
      if(xhr.status!==200){finish(xhr.status===429?'Limite API atteinte, réessai dans 15 min':'Météo indisponible (HTTP '+xhr.status+')');return;}
      try{
        var data=JSON.parse(xhr.responseText);
        if(!Array.isArray(data)||data.length!==stations.length*2){throw new Error('Réponse météo incomplète');}
        var invalid=0;
        stations.forEach(function(s,i){var base=data[i*2],summit=data[i*2+1];if(W.valid(base)){records[s.id]={data:base,summit:summit,savedAt:Date.now()};}else{invalid++;}});
        try{localStorage.setItem(cacheKey,JSON.stringify(records));}catch(e){}
        finish(invalid?'Certaines stations sont indisponibles':'');
      }catch(e){finish('Réponse météo inutilisable');}
    };
    xhr.onerror=function(){finish('Connexion météo impossible');};xhr.ontimeout=function(){finish('Délai réseau dépassé');};
    try{xhr.send();}catch(e){finish('Connexion météo impossible');}
  }
  function renderStatus(){
    var r=usable(stations[index]), message='';
    if(!r){message=busy?'Connexion à Open-Meteo…':(lastError||'Données indisponibles')+' · bouton Actualiser pour réessayer.';}
    else {
      var current=r.data.current || {}, time=current.time?current.time.replace('T',' à '):'non disponible';
      message=(fresh(r)?'':'Données anciennes · ')+(lastError?lastError+' · ':'')+'Modèle : '+time+' (heure des stations) · reçu il y a '+age(r)+' min';
      if(busy){message+=' · actualisation…';}
    }
    text('status',message);el('status').className='status'+(!r||!fresh(r)||lastError?' warning':'');
  }
  function chart(data, compact){
    if(!data){return '<p class="empty">Pas de prévisions disponibles.<br>Vérifiez la connexion Internet.</p>';}
    var daily=data.daily, min=daily.temperature_2m_min,max=daily.temperature_2m_max,snow=daily.snowfall_sum;
    var values=min.concat(max).filter(W.number), lo=values.length?Math.floor(Math.min.apply(null,values)/5)*5:0,hi=values.length?Math.ceil(Math.max.apply(null,values)/5)*5:5;
    if(hi===lo){hi=lo+5;}var width=600,height=compact?70:145,top=compact?7:18,bottom=compact?63:122;
    function x(i){return 48+i*84;}function y(v){return bottom-(v-lo)/(hi-lo)*(bottom-top);}
    var svg='<svg role="img" aria-label="Températures minimales et maximales en degrés Celsius'+(compact?'':', barres de neige à échelle relative, quantités en centimètres sous le graphique')+'" viewBox="0 0 '+width+' '+height+'" preserveAspectRatio="none">';
    if(!compact){[lo,(lo+hi)/2,hi].forEach(function(v){svg+='<line x1="39" x2="588" y1="'+y(v)+'" y2="'+y(v)+'" stroke="#314958" stroke-dasharray="3 5"/><text x="0" y="'+(y(v)+4)+'">'+num(v)+'°</text>';});}
    var maxSnow=Math.max.apply(null,snow.filter(W.number).concat([1]));
    if(!compact){snow.forEach(function(v,i){if(W.number(v)&&v>0){var h=Math.max(2,v/maxSnow*38);svg+='<rect x="'+(x(i)-13)+'" y="'+(bottom-h)+'" width="26" height="'+h+'" rx="3" fill="#518694" opacity=".7"/>';}});}
    [min,max].forEach(function(arr,k){var path='',drawing=false;arr.forEach(function(v,i){if(!W.number(v)){drawing=false;return;}path+=(drawing?'L':'M')+x(i)+','+y(v)+' ';drawing=true;});svg+='<path d="'+path+'" fill="none" stroke="'+(k?'#a1e9d5':'#99bafd')+'" stroke-width="'+(compact?2:3)+'"'+(!k?' stroke-dasharray="5 4"':'')+'/>';if(!compact){arr.forEach(function(v,i){if(W.number(v)){svg+='<circle cx="'+x(i)+'" cy="'+y(v)+'" r="3" fill="'+(k?'#a1e9d5':'#99bafd')+'"/>';}});}});
    return svg+'</svg>';
  }
  function renderDays(data){
    var html='';if(data){data.daily.time.forEach(function(day,i){html+='<div class="day">'+dayLabel(day)+'<strong>'+num(data.daily.temperature_2m_min[i])+' / '+num(data.daily.temperature_2m_max[i])+'°</strong><span class="snow-value">'+num(data.daily.snowfall_sum[i],1)+' cm</span></div>';});}
    el('days').innerHTML=html;text('date-range',data?data.daily.time[0].slice(8)+'/'+data.daily.time[0].slice(5,7)+' — '+data.daily.time[6].slice(8)+'/'+data.daily.time[6].slice(5,7):'');
  }
  function renderMap(){
    var selected=stations[index];
    function x(lon){return ((lon+180)/360*64-33)*256;}function y(lat){var r=lat*Math.PI/180;return ((1-Math.log(Math.tan(r)+1/Math.cos(r))/Math.PI)/2*64-22)*256;}
    var svg='<svg viewBox="0 0 256 300" role="img" aria-label="Carte géographique des 16 stations. Station sélectionnée en jaune."><image href="assets/map/osm-alpes-33-22-v2.png" x="0" y="0" width="256" height="256"/><image href="assets/map/osm-alpes-33-23-v2.png" x="0" y="256" width="256" height="256"/>';
    stations.forEach(function(s){svg+='<circle cx="'+x(s.lon)+'" cy="'+y(s.lat)+'" r="'+(s.id===selected.id?5:2.8)+'" fill="'+(s.id===selected.id?'#ffe09a':s.favorite?'#a1e9d5':'#d5e1e7')+'" stroke="#102330" stroke-width="1.5"><title>'+esc(s.name)+'</title></circle>';});
    svg+='<circle cx="'+x(selected.lon)+'" cy="'+y(selected.lat)+'" r="9" fill="none" stroke="#ffe09a" stroke-width="2"/><rect x="'+Math.max(3,Math.min(168,x(selected.lon)-42))+'" y="'+Math.max(4,y(selected.lat)-27)+'" width="86" height="18" rx="4" fill="#07141c" opacity=".9"/><text x="'+Math.max(7,Math.min(172,x(selected.lon)-38))+'" y="'+Math.max(17,y(selected.lat)-14)+'" fill="#fff">'+esc(selected.name)+'</text>';
    el('map').innerHTML=svg+'</svg>';el('map-link').href='https://www.openstreetmap.org/?mlat='+selected.lat+'&mlon='+selected.lon+'#map=11/'+selected.lat+'/'+selected.lon;
  }
  function pad2(n){return ('0'+n).slice(-2);}
  function cameraCandidates(template){
    var urls=[], now=Date.now();
    for(var i=1;i<=8;i++){var d=new Date(now-i*600000),date=d.getFullYear()+'/'+pad2(d.getMonth()+1)+'/'+pad2(d.getDate()),time=pad2(d.getHours())+'-'+pad2(Math.floor(d.getMinutes()/10)*10);urls.push(template.replace('{date}',date).replace('{time}',time));}
    return urls;
  }
  function renderWebcam(){
    var s=stations[index],cams=s.cameras||[],cam=cams[cameraIndex%Math.max(1,cams.length)],stage=el('webcam-stage'),token=++webcamLoadToken;
    if(!cam){stage.innerHTML='<p class="empty">Webcam indisponible.</p>';text('webcam-label',s.name);text('webcam-count','');return;}
    text('webcam-label',cam.label);text('webcam-count','Caméra '+(cameraIndex%cams.length+1)+' / '+cams.length+' · changement automatique dans '+CAMERA_SECONDS+' s');
    if(cam.type==='iframe'){
      stage.innerHTML='<iframe src="'+esc(cam.url)+'" title="Webcam '+esc(cam.label)+'" allow="autoplay; fullscreen; picture-in-picture" referrerpolicy="no-referrer-when-downgrade"></iframe><span class="webcam-overlay-note">Flux externe · prochaine vue dans 20 s</span>';
    } else {
      var candidates=cam.type==='image-template'?cameraCandidates(cam.url):[cam.url+(cam.url.indexOf('?')>=0?'&':'?')+'_refresh='+Math.floor(Date.now()/300000)],attempt=0,attemptId=0,timer=null,img=document.createElement('img');
      stage.innerHTML='<p class="empty webcam-loading">Connexion à la caméra…<br><small>Essai automatique des images disponibles</small></p>';
      img.alt='Webcam '+cam.label;img.style.opacity='0';
      function nextCandidate(){
        if(token!==webcamLoadToken){return;}
        clearTimeout(timer);
        if(attempt>=candidates.length){stage.innerHTML='<p class="empty">Image momentanément indisponible.<br><a href="'+esc(s.webcam)+'">Ouvrir la page webcam</a></p>';return;}
        var current=++attemptId,url=candidates[attempt++];
        img.onload=function(){if(token!==webcamLoadToken||current!==attemptId){return;}clearTimeout(timer);stage.innerHTML='';stage.appendChild(img);img.style.opacity='1';};
        img.onerror=function(){if(token===webcamLoadToken&&current===attemptId){nextCandidate();}};
        img.src=url;
        timer=setTimeout(function(){if(token===webcamLoadToken&&current===attemptId){nextCandidate();}},3500);
      }
      nextCandidate();
    }
  }
  function renderList(){
    var nodes=el('station-list').querySelectorAll('button');
    if(!nodes.length){stations.forEach(function(s){var b=document.createElement('button');b.className='station-button';b.setAttribute('data-station',s.id);b.innerHTML='<span>'+esc(s.name)+'</span>'+(s.favorite?'<span class="star" aria-label="favorite">★</span>':'');b.onclick=function(){setStation(s.id);};el('station-list').appendChild(b);});nodes=el('station-list').querySelectorAll('button');}
    for(var i=0;i<nodes.length;i++){nodes[i].hidden=favoritesOnly&&!stations[i].favorite;nodes[i].className='station-button'+(i===index?' selected':'');nodes[i].setAttribute('aria-current',i===index?'true':'false');}
    var selected=nodes[index];if(selected && el('station-list').scrollHeight>el('station-list').clientHeight){var list=el('station-list');if(selected.offsetTop-list.offsetTop<list.scrollTop || selected.offsetTop-list.offsetTop+selected.offsetHeight>list.scrollTop+list.clientHeight){list.scrollTop=selected.offsetTop-list.offsetTop-list.clientHeight/2;}}
  }
  function render(){
    var s=stations[index],r=usable(s),data=r?r.data:null,c=data&&data.current?data.current:{};
    text('station-name',s.name);text('location',s.country+' / '+s.region+(s.favorite?' · FAVORI':''));text('point','Point météo : '+s.elevation+' m · village / front de neige');
    el('station-number').innerHTML=('0'+(index+1)).slice(-2)+' <small>/ 16</small>';
    el('temperature').innerHTML=num(c.temperature_2m)+'<small> °C</small>';
    el('snow-base').innerHTML=num(W.snowDepthCm(data))+'<small> cm</small>';
    el('snow-summit').innerHTML=num(r?W.snowDepthCm(r.summit):null)+'<small> cm</small>';
    text('snow-base-label','Village · '+s.elevation+' m');text('snow-summit-label','Altitude · '+s.summit+' m');
    el('wind').innerHTML=num(c.wind_speed_10m)+'<small> km/h</small>';
    text('condition',W.condition(c.weather_code)+' · ressenti '+num(c.apparent_temperature)+'°');
    var dirs=['N','NE','E','SE','S','SO','O','NO'];text('gusts','Rafales '+num(c.wind_gusts_10m)+' km/h · '+(W.number(c.wind_direction_10m)?dirs[Math.round(c.wind_direction_10m/45)%8]:'—'));
    el('chart').innerHTML=chart(data,false);renderDays(data);renderMap();renderWebcam();renderList();renderStatus();updatePlayback();
    el('webcam').href=s.webcam;el('snow-report').href=s.snowReport;el('official').href=s.official;
  }
  function openOverlay(type){lastFocus=document.activeElement;modal=type;el('overlay').hidden=false;renderOverlay(false);el('close').focus();}
  function closeOverlay(){el('overlay').hidden=true;modal=null;remaining=seconds;if(lastFocus&&lastFocus.offsetWidth){lastFocus.focus();}else{el('station-stage').focus();}}
  function renderOverlay(preserve){
    var focusId=preserve&&document.activeElement?document.activeElement.getAttribute('data-pick'):null;
    var html='', title='',r,data;
    if(modal==='webcam'){
      var ws=stations[index];title='Webcam · '+ws.name;html='<p class="webcam-fallback">La page webcam est chargée dans Ski Live TV. Si le diffuseur refuse l’intégration sur votre téléviseur, utilisez <a href="'+esc(ws.webcam)+'">ouvrir la page webcam officielle</a>.</p><iframe class="webcam-frame" src="'+esc(ws.webcamEmbed)+'" title="Webcam '+esc(ws.name)+'" allow="autoplay; fullscreen; picture-in-picture" referrerpolicy="no-referrer-when-downgrade"></iframe>';
    }else if(modal==='overview'){
      title='Toutes les stations, en un regard';html='<p class="overlay-intro">Neige déjà au sol estimée au village et en altitude, puis météo. Sélectionnez une station avec OK.</p><div class="overview-grid">';
      stations.forEach(function(s){r=usable(s);data=r?r.data:null;var c=data&&data.current?data.current:{};html+='<button class="overview-card" data-pick="'+s.id+'"><h3>'+esc(s.name)+(s.favorite?' ★':'')+'</h3><p>'+esc(s.country)+'</p><strong>'+num(W.snowDepthCm(data))+' / '+num(r?W.snowDepthCm(r.summit):null)+' cm</strong><p>village / altitude</p><small>'+num(c.temperature_2m)+'° · '+(r?(fresh(r)?'reçu il y a '+age(r)+' min':'données anciennes'):'connexion nécessaire')+'</small></button>';});html+='</div>';
    }else if(modal==='ranking'){
      title='Neige déjà au sol';var ranking=stations.map(function(s){var rr=usable(s);return {station:s,base:rr?W.snowDepthCm(rr.data):null,summit:rr?W.snowDepthCm(rr.summit):null};}).sort(function(a,b){var av=W.number(a.summit)?a.summit:-1,bv=W.number(b.summit)?b.summit:-1;return bv-av;});html='<p class="overlay-intro">Estimation Open-Meteo de la hauteur présente au sol. Classement par hauteur en altitude. Le bulletin officiel de la station reste la référence.</p>';
      ranking.forEach(function(item,i){var missing=!W.number(item.base)&&!W.number(item.summit);html+='<button class="rank-row'+(missing?' unavailable':'')+'" data-pick="'+item.station.id+'"><span class="place">'+(i+1)+'</span><span class="name">'+esc(item.station.name)+'</span><span class="snow-columns"><span>Village<br><strong>'+num(item.base)+' cm</strong></span><span>Altitude<br><strong>'+num(item.summit)+' cm</strong></span></span></button>';});
    }else{
      title='Votre télécommande suffit';html='<div class="help-copy"><p><kbd>↑</kbd> <kbd>↓</kbd> <kbd>←</kbd> <kbd>→</kbd> déplacent le cadre jaune entre les boutons. <kbd>OK</kbd> active le bouton. Sur le grand bloc de la station, <kbd>←</kbd> et <kbd>→</kbd> changent de station, <kbd>OK</kbd> met la rotation en pause.</p><p><kbd>CH+</kbd> / <kbd>CH−</kbd> ou <kbd>Page suivante</kbd> / <kbd>Page précédente</kbd> changent de station si votre navigateur transmet ces touches. <kbd>Espace</kbd> : lecture/pause. <kbd>Retour</kbd> ou <kbd>Échap</kbd> ferme cette fenêtre.</p><p>La rotation attend 30 secondes après une interaction et reste suspendue dans les vues générales. Choisissez « Les 4 favoris » pour ne faire défiler que Val d’Isère, La Bresse-Hohneck, Cervinia et Livigno. Les réglages sont conservés si le navigateur autorise le stockage local.</p><p>Météo actualisée toutes les 15 minutes. Les conditions actuelles proviennent de modèles météo, pas de capteurs sur les pistes. Les barres indiquent la neige quotidienne (échelle relative) ; les quantités exactes sont inscrites sous la courbe. Une valeur manquante est affichée « — ».</p><p>Les webcams et bulletins s’ouvrent dans cette fenêtre. Utilisez le retour du navigateur pour revenir. Leur affichage dépend du site officiel et du modèle de TV. La carte intégrée situe les stations par coordonnées ; le lien ouvre OpenStreetMap.</p><p>Sources : <a href="https://open-meteo.com/en/docs">documentation Open-Meteo</a> · <a href="https://open-meteo.com/en/terms">conditions et attribution CC BY 4.0</a>. API gratuite pour usage non commercial, selon les limites du fournisseur.</p></div>';
    }
    text('overlay-title',title);el('overlay-content').innerHTML=html;
    var cards=el('overlay-content').querySelectorAll('[data-pick]');for(var i=0;i<cards.length;i++){cards[i].onclick=function(){var id=this.getAttribute('data-pick');favoritesOnly=false;setStation(id);closeOverlay();};if(focusId===cards[i].getAttribute('data-pick')){cards[i].focus();}}
  }
  function focusables(){var parent=modal?el('overlay'):document.querySelector('.app');return Array.prototype.filter.call(parent.querySelectorAll('button,a,[tabindex="0"]'),function(n){return !n.disabled && n.offsetWidth>0 && n.offsetHeight>0;});}
  function moveFocus(direction){
    var current=document.activeElement, list=focusables(), box=current.getBoundingClientRect(), cx=box.left+box.width/2,cy=box.top+box.height/2,best=null,bestScore=Infinity;
    list.forEach(function(n){if(n===current){return;}var b=n.getBoundingClientRect(),dx=b.left+b.width/2-cx,dy=b.top+b.height/2-cy;var primary=(direction===37?-dx:direction===39?dx:direction===38?-dy:dy),secondary=(direction===37||direction===39)?Math.abs(dy):Math.abs(dx);if(primary<=1){return;}var score=primary+secondary*3;if(score<bestScore){bestScore=score;best=n;}});
    if(best){best.focus();}else if(list.indexOf(current)<0 && list.length){list[0].focus();}
  }
  document.addEventListener('keydown',function(e){
    var k=e.keyCode||e.which;
    holdUntil=Date.now()+30000;
    if(k===27||k===8||k===461||k===10009){if(modal){e.preventDefault();closeOverlay();}return;}
    if(k===9&&modal){var nodes=focusables(),at=nodes.indexOf(document.activeElement);if(e.shiftKey&&at<=0){e.preventDefault();nodes[nodes.length-1].focus();}else if(!e.shiftKey&&at===nodes.length-1){e.preventDefault();nodes[0].focus();}return;}
    if(k>=37&&k<=40){e.preventDefault();if(!modal&&document.activeElement===el('station-stage')&&(k===37||k===39)){advance(k===37?-1:1);}else{moveFocus(k);}return;}
    if(!modal&&(k===33||k===34||k===427||k===428)){e.preventDefault();advance(k===33||k===427?1:-1);return;}
    if(!modal&&(k===32||k===19||k===179||k===10252)){e.preventDefault();togglePlay();return;}
    if(k===13&&document.activeElement===el('station-stage')){e.preventDefault();togglePlay();}
  });
  document.addEventListener('click',function(){holdUntil=Date.now()+30000;});
  el('previous').onclick=function(){advance(-1);};el('next').onclick=function(){advance(1);};el('play').onclick=togglePlay;
  el('duration').onclick=function(){seconds=durations[(durations.indexOf(seconds)+1)%durations.length];remaining=seconds;updatePlayback();savePreferences();};
  el('filter').onclick=function(){favoritesOnly=!favoritesOnly;if(favoritesOnly&&!stations[index].favorite){index=1;}remaining=seconds;render();savePreferences();};
  el('refresh').onclick=function(){requestWeather(true);};el('overview').onclick=function(){openOverlay('overview');};el('ranking').onclick=function(){openOverlay('ranking');};el('webcam-player').onclick=function(){openOverlay('webcam');};el('help').onclick=function(){openOverlay('help');};el('close').onclick=closeOverlay;el('dashboard').onclick=function(){el('station-stage').focus();};
  function tick(){
    var now=Date.now(),delta=Math.min(2,(now-lastTick)/1000);lastTick=now;
    var date=new Date();text('clock',('0'+date.getHours()).slice(-2)+':'+('0'+date.getMinutes()).slice(-2));text('today',dayLabel(date.getFullYear()+'-'+('0'+(date.getMonth()+1)).slice(-2)+'-'+('0'+date.getDate()).slice(-2))+' / '+('0'+(date.getMonth()+1)).slice(-2));
    if(playing&&!modal&&!document.hidden&&now>=holdUntil){remaining-=delta;if(remaining<=0){advance(1);}}
    var cams=stations[index].cameras||[];
    if(!document.hidden&&cams.length&&now-cameraChangedAt>=CAMERA_SECONDS*1000){cameraIndex=(cameraIndex+1)%cams.length;cameraChangedAt=now;renderWebcam();}
    if(cams.length){text('webcam-count','Caméra '+(cameraIndex%cams.length+1)+' / '+cams.length+' · prochaine vue dans '+Math.max(1,Math.ceil((CAMERA_SECONDS*1000-(now-cameraChangedAt))/1000))+' s');}
    text('rotation',!playing?'Rotation en pause':modal?'Rotation suspendue':now<holdUntil?'Reprise dans '+Math.ceil((holdUntil-now)/1000)+' s':'Prochaine station dans '+Math.ceil(remaining)+' s');
    el('progress').style.width=((seconds-remaining)/seconds*100)+'%';
    if(!document.hidden){requestWeather(false);} // finite timeout keeps failures from blocking future refreshes
  }
  document.addEventListener('visibilitychange',function(){lastTick=Date.now();if(!document.hidden){render();requestWeather(false);}});
  window.addEventListener('online',function(){requestWeather(true);});
  load();render();el('station-stage').focus();requestWeather(true);setInterval(tick,1000);
  setInterval(function(){renderStatus();if(modal==='ranking'||modal==='overview'){renderOverlay(true);}},60000);
}());
