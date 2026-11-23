(function (root) {
  'use strict';
  function number(v) { return typeof v === 'number' && isFinite(v); }
  function total(values) {
    if (!values || values.length !== 7) { return null; }
    var sum = 0;
    for (var i=0;i<7;i++) { if (!number(values[i]) || values[i]<0) { return null; } sum += values[i]; }
    return Math.round(sum*10)/10;
  }
  function valid(data) {
    if (!data || !data.daily || !data.daily.time || data.daily.time.length !== 7) { return false; }
    var keys = ['temperature_2m_min','temperature_2m_max','snowfall_sum'];
    for (var k=0;k<keys.length;k++) {
      var a=data.daily[keys[k]];
      if (!Array.isArray(a) || a.length !== 7) { return false; }
      for (var j=0;j<7;j++) { if (a[j] !== null && !number(a[j])) { return false; } }
    }
    for (var i=0;i<7;i++) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(data.daily.time[i])) { return false; }
      if (i && Date.parse(data.daily.time[i])-Date.parse(data.daily.time[i-1]) !== 86400000) { return false; }
    }
    return true;
  }
  function url(stations) {
    var points=[];
    stations.forEach(function(s){points.push({lat:s.lat,lon:s.lon,elevation:s.elevation});points.push({lat:s.lat,lon:s.lon,elevation:s.summit});});
    function list(key) { return points.map(function(s){return s[key];}).join(','); }
    return 'https://api.open-meteo.com/v1/forecast?latitude='+list('lat')+'&longitude='+list('lon')+'&elevation='+list('elevation')+
      '&current=temperature_2m,apparent_temperature,weather_code,wind_speed_10m,wind_gusts_10m,wind_direction_10m,snow_depth'+
      '&daily=temperature_2m_max,temperature_2m_min,snowfall_sum&forecast_days=7&timezone=Europe%2FParis&temperature_unit=celsius&wind_speed_unit=kmh';
  }
  function snowDepthCm(data) {
    var value=data&&data.current?data.current.snow_depth:null;
    return number(value)&&value>=0?Math.round(value*100):null;
  }
  function condition(c) {
    if (!number(c)) {return 'Conditions indisponibles';}
    if (c===0) {return 'Ciel dégagé';}
    if (c<=2) {return 'Éclaircies';}
    if (c===3) {return 'Ciel couvert';}
    if (c===45 || c===48) {return 'Brouillard';}
    if ((c>=71 && c<=77) || c===85 || c===86) {return 'Neige';}
    if (c>=95) {return 'Orages';}
    if (c>=51 && c<=82) {return 'Précipitations';}
    return 'Conditions variables';
  }
  function rank(stations, records, now, day) {
    return stations.map(function(s){return {station:s,record:records[s.id]};}).filter(function(x){
      return x.record && valid(x.record.data) && now-x.record.savedAt<1800000 && x.record.savedAt<=now &&
        x.record.data.daily.time[0]===day && total(x.record.data.daily.snowfall_sum)!==null;
    }).map(function(x){return {station:x.station,snow:total(x.record.data.daily.snowfall_sum)};}).sort(function(a,b){return b.snow-a.snow || a.station.name.localeCompare(b.station.name);});
  }
  root.SkiWeather={number:number,total:total,valid:valid,url:url,condition:condition,rank:rank,snowDepthCm:snowDepthCm};
}(typeof window !== 'undefined' ? window : this));
