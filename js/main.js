if ("serviceWorker" in navigator) {
    navigator.serviceWorker
        .register("service-worker.js")
        .then(function() {});
}

window.isUpdateAvailable = new Promise(function(resolve, reject) {
    if ("serviceWorker" in navigator && ["localhost", "127"].indexOf(location.hostname) === -1) {
        navigator.serviceWorker
            .register("service-worker.js")
            .then(reg => {
                reg.onupdatefound = () => {
                    const installingWorker = reg.installing;
                    installingWorker.onstatechange = () => {
                        switch (installingWorker.state) {
                            case "installed":
                                if (navigator.serviceWorker.controller) {
                                    resolve(true);
                                } else {
                                    resolve(false);
                                }
                                break;
                        }
                    };
                };
            })
            .catch(err => console.error("[SW ERROR]", err));
    }
});

const installContainer = document.getElementById('installContainer');
const butInstall = document.getElementById('butInstall');
const confirm = document.getElementById('confirm');
const yes = document.getElementById('yes');
const no = document.getElementById('no');
const history = document.getElementById('history');
const Help = document.getElementById('Help');
const container = document.getElementById('container');
const intro = document.getElementById('intro');
const why = document.getElementById('reason');
const modes = document.getElementById('mode');
const refresh = document.getElementById('new');
const controls = document.getElementById('controls');
const start = document.getElementById('start');
const stop = document.getElementById('stop');
const mapholder = document.getElementById('mapholder');
const info = document.getElementById('info');
const offline = document.getElementById("offline");
const info2 = document.getElementById('info2');
const historyPanel = document.getElementById('historyPanel');
const helpPanel = document.getElementById('helpPanel');
let distance;
let continueJourney = false;

window.addEventListener('load', function() {
    window.history.pushState({}, '');
});

window.addEventListener('popstate', function() {
    window.history.pushState({}, '');
});

window.addEventListener('offline', () => {
  stop.disabled = true;
  offline.classList.toggle('hidden', false);
  document.getElementById("offline").innerHTML = "You are offline";
});

window.addEventListener('online', () => {
  stop.disabled = false;
  offline.classList.toggle('hidden', true);
});

window.onload = function() {
  if (window.matchMedia("(display-mode: browser)").matches && navigator.platform === "iPhone") {
      alert("Using Safari, go to Settings > Add to Home Screen");
  }

  window.addEventListener('beforeinstallprompt', (event) => {
      window.deferredPrompt = event;
      installContainer.classList.toggle('hidden', false);
      container.style.opacity = 0.5;
  });

  installContainer.addEventListener('click', () => {
      const promptEvent = window.deferredPrompt;
      if (!promptEvent) {
          return;
      }
      promptEvent.prompt();
      promptEvent.userChoice.then((result) => {
          window.deferredPrompt = null;
          installContainer.classList.toggle('hidden', true);
          container.style.opacity = 1;
      });
  });

  window.addEventListener('appinstalled', (event) => {
  });

  let purpose, mode, startTime;
  let myOptions = {
      center: new google.maps.LatLng(56, -4),
      zoom: 8,
      mapTypeId: google.maps.MapTypeId.ROADMAP,
      mapTypeControl: false,
      streetViewControl: false
  };

  map = new google.maps.Map(
      document.getElementById("mapholder"),
      myOptions
  );

  checkUnfinishedJourney();
};

let reasonButtons = document.querySelectorAll(".reason");
for (let i = 0; i < reasonButtons.length; i++) {
  reasonButtons[i].addEventListener("click", function(e) {
      intro.classList.toggle('hidden', true);
      modes.classList.toggle('hidden', false);
      historyPanel.classList.toggle('hidden', true);
      helpPanel.classList.toggle('hidden', true);
      purpose = this.id;
      document.getElementById("selectedReason").innerHTML =
          "You have selected: " + this.id.bold();
  });
}

let transportButtons = document.querySelectorAll(".transport");
for (let i = 0; i < transportButtons.length; i++) {
    transportButtons[i].addEventListener("click", function(e) {
        controls.classList.toggle('hidden', false);
        start.classList.toggle('hidden', false);
        why.classList.toggle('hidden', false);
        mode = this.id;
        document.getElementById("selectedMode").innerHTML =
            "You have selected: " + this.id.bold();
    });
}

function newJourney() {
  location.reload();
}

function getLocation(transport) {
  why.classList.toggle('hidden', true);
  modes.classList.toggle('hidden', true);
  start.classList.toggle('hidden', true);
  stop.classList.toggle('hidden', false);
  mapholder.classList.toggle('hidden', false);
  info.classList.toggle('hidden', false);
  historyPanel.classList.toggle('hidden', true);
  helpPanel.classList.toggle('hidden', true);
  if (navigator.geolocation) {
      switch (mode) {
          case "Bus":

              var trafficLayer = new google.maps.TrafficLayer();
              trafficLayer.setMap(map);
              break;

          case "LargeCar":

              var trafficLayer = new google.maps.TrafficLayer();
              trafficLayer.setMap(map);
              break;

          case "SmallCar":

              var trafficLayer = new google.maps.TrafficLayer();
              trafficLayer.setMap(map);
              break;

          case "MediumCar":

              var trafficLayer = new google.maps.TrafficLayer();
              trafficLayer.setMap(map);
              break;

          case "Bicycle":

              var bikeLayer = new google.maps.BicyclingLayer();
              bikeLayer.setMap(map);
              break;

          case "Ferry":
              break;

          case "Plane":
              break;

          case "Subway":

              var transitLayer = new google.maps.TransitLayer();
              transitLayer.setMap(map);
              break;

          case "Train":

              var transitLayer = new google.maps.TransitLayer();
              transitLayer.setMap(map);
              break;

          case "Tram":

              var transitLayer = new google.maps.TransitLayer();
              transitLayer.setMap(map);
              break;

      }

      navigator.geolocation.watchPosition(
          showPosition,
          showError,
          clearWatch, {
              enableHighAccuracy: true,
              maximumAge: 60000,
              timeout: 30000
          }
      );
  } else {
      alert("Your browser does not support the geolocation API.");
  }
}

start.addEventListener("click", function() {
  startTime = new Date().toLocaleString("en-GB", {
      timeZone: "Europe/London"
  });
  localStorage.startTime = startTime;
  localStorage.purpose = purpose;
  localStorage.mode = mode;
  localStorage.journeyStarted = true;
  getLocation();
});

let flightPathCoordinates = [];
let lat1, lng1;
let first_check = false;
let marker = null;
let x = document.getElementById("info");
let y = document.getElementById("info2");

function showPosition(position) {
  if (!first_check) {
      distance = 0;
      if (continueJourney) {
          lat1 = parseFloat(localStorage.lat1);
          lng1 = parseFloat(localStorage.lng1);
      } else {
          lat1 = position.coords.latitude;
          lng1 = position.coords.longitude; 
      }
      localStorage.lat1 = lat1;
      localStorage.lng1 = lng1;
      first_check = true;   
  
  }
      let distanceFrom = function(points) {
          if (continueJourney) {
              lat1 = parseFloat(localStorage.lat1);
              lng1 = parseFloat(localStorage.lng1);
          } else {
              lat1 = points.lat1;
              lng1 = points.lng1;
          }
          let radianLat1 = lat1 * (Math.PI / 180);
          let radianLng1 = lng1 * (Math.PI / 180);            
          
          let lat2 = points.lat2;
          let radianLat2 = lat2 * (Math.PI / 180);
          let lng2 = points.lng2;
          let radianLng2 = lng2 * (Math.PI / 180);
          let earth_radius = 3959;
          let diffLat = radianLat1 - radianLat2;
          let diffLng = radianLng1 - radianLng2;
          let sinLat = Math.sin(diffLat / 2);
          let sinLng = Math.sin(diffLng / 2);
          let a =
              Math.pow(sinLat, 2.0) +
              Math.cos(radianLat1) *
              Math.cos(radianLat2) *
              Math.pow(sinLng, 2.0);
          let distanc =
              earth_radius * 2 * 1.60934 * Math.asin(Math.min(1, Math.sqrt(a)));
          
          return distanc.toFixed(0);
      };

      distance = distanceFrom({
          lat1: lat1,
          lng1: lng1,
          lat2: position.coords.latitude,
          lng2: position.coords.longitude
      });
  x.innerHTML =
      "<br><strong>Start:<\/strong> " +
      "<span id='startTime'>" +
      startTime +
      "<\/span>" +
      "<br><strong>Distance travelled:<\/strong> " +
      distance +
      " km" +
      "<br><strong>Purpose of travel:<\/strong> " +
      purpose +
      "<br><strong>Mode of transport:<\/strong> " +
      mode +
      "<span id='carbon' class='hidden'>&nbsp;<\/span>" +
      "<span id='trees' class='hidden'>&nbsp;<\/span>";

  latlon = new google.maps.LatLng(
      position.coords.latitude,
      position.coords.longitude
  );
  timestamp = new Date(position.timestamp).toLocaleString("en-GB");

  if (marker !== null) {
      marker.setPosition(latlon);
  } else {
      marker = new google.maps.Marker({
          position: latlon,
          map: map,
          title: "You are here!"
      });
      
      infowindow = new google.maps.InfoWindow({
          content: "You are here!"
      });
      
      google.maps.event.addListener(marker, "click", function() {
          infowindow.open(map, marker);
      });
      
      marker.setPosition(latlon);
      map.panTo(latlon);
      map.setZoom(16);
      map.getCenter();
  }

  flightPathCoordinates.push(
      new google.maps.LatLng(
          position.coords.latitude,
          position.coords.longitude
      )
  );
  
  let flightPath = new google.maps.Polyline({
      path: flightPathCoordinates,
      strokeColor: "#FF0000",
      strokeOpacity: 1.0,
      strokeWeight: 2
  });
  
  flightPath.setMap(map);
}

function showError(error) {
  switch (error.code) {
      case error.PERMISSION_DENIED:
          alert("You denied the request for Geolocation. You may need to go to your settings to enable this.");
          break;
      case error.POSITION_UNAVAILABLE:
          alert("Location information is unavailable. If you are in airplane mode, remember to switch off airplane mode before selecting stop.");
          break;
      case error.TIMEOUT:
          alert("The request to get your location timed out.");
          break;
      case error.UNKNOWN_ERROR:
          alert("An unknown error occurred.");
          break;
  }
}

function clearWatch(position) {
  navigator.geolocation.clearWatch(position);
  endTime = new Date();
  stop.classList.toggle('hidden', true);
}

stop.addEventListener("click", function() {
  clearWatch();
  
  why.classList.toggle('hidden', false);
  mapholder.classList.toggle('hidden', true);
  info.classList.toggle('hidden', true);
  
  let stop = new Date().toLocaleString("en-GB");
  if (isNaN(parseFloat(distance))) {
      distance = 0;
  }
  let carbonCalc = getCarbon(distance);
  let treesCalc = getTrees(carbonCalc);
  let treesVisual = getTreesVisual(treesCalc);
  let stopTime = document.getElementById("stopTime");
  let carbon = document.getElementById("carbon");
  carbon.innerHTML = (carbonCalc / 1000).toFixed(2) + " kg";
  let trees = document.getElementById("trees");
  trees.innerHTML = treesCalc + " trees ";
  let journey = {
      start: localStorage.startTime,
      end: stop,
      purpose: localStorage.purpose,
      mode: localStorage.mode,
      distance: distance,
      carbon: (carbonCalc / 1000).toFixed(2),
      trees: treesCalc
  };

  let request = window.indexedDB.open("carbon", 7);

  request.onupgradeneeded = function(event) {
      db = this.result;
      let journeys = db.createObjectStore(["journey"], {
          autoIncrement: true
      });
  };

  request.onsuccess = function(event) {
      db = this.result;
      let tx = db.transaction(["journey"], "readwrite");
      let store = tx.objectStore("journey");
      let rec=store.add(journey);
      rec.onerror = function(event) {
          alert("error storing journey " + event.target.errorCode);
      };
      rec.onsuccess = function() { 
          why.classList.toggle('hidden', true);
          info2.classList.toggle('hidden', false);
          y.innerHTML = "You travelled " + distance + "km by " + mode + " for " + purpose + " and burned " + (carbonCalc / 1000).toFixed(2) + "kg of carbon" + ", which is equal to " + treesCalc + " trees.<p><button onClick='share()' id='share'><img data-src='/images/mycarbonimpact/app/share.webp' alt='Share' width='85' height='85' class='lazyload'><\/button>&nbsp;<button onClick='newJourney()' id='new'><img data-src='/images/mycarbonimpact/app/reload.webp' alt='Reload' width='85' height='85' class='lazyload'><\/button><\/p>";
      };   
  };

  request.onerror = function(event) {
      alert("error opening database " + this.errorCode);
  };  
  clearStorage();
});

function checkUnfinishedJourney() {
  if (localStorage.journeyStarted=='true') {
      confirm.classList.toggle('hidden', false);
      document.getElementById("intro").hidden = true;
      document.getElementById("reason").hidden = true;
  } else {
      document.getElementById("confirm").hidden = true;
  }
}

yes.addEventListener("click", function() {
confirm.classList.toggle('hidden', true);
continueJourney = true;
startTime = localStorage.startTime;
purpose = localStorage.purpose;
mode = localStorage.mode;
localStorage.journeyStarted = true;
getLocation();
intro.style.display = "none";
controls.classList.toggle('hidden', false);
stop.classList.toggle('hidden', false);
});
      
no.addEventListener("click", function() {
confirm.classList.toggle('hidden', true);
document.getElementById("intro").hidden = false;
document.getElementById("reason").hidden = false;
clearStorage();
});

function clearStorage() {
  localStorage.startTime = '';
  localStorage.purpose = '';
  localStorage.mode = '';
  localStorage.lat1 = '';
  localStorage.lng1 = '';
  localStorage.journeyStarted = false;
}

history.addEventListener("click", function() {
  historyPanel.classList.toggle('hidden', false);
  helpPanel.classList.toggle('hidden', true);
  let request = indexedDB.open("carbon",7);
  request.onerror = function(event) {
  };

  let db;
  request.onupgradeneeded = function(event) {
      db = event.target.result;
      let journeys = db.createObjectStore(["journey"], {
          autoIncrement: true
      });
  };
      
  request.onsuccess = function(event) {
      db = request.result;
      let tx = db.transaction(["journey"], "readonly");
      let store = tx.objectStore("journey");
      let totalTrees = 0;
      let records = store.getAll();

      records.onsuccess = function(event) {
          let allJourneys = records.result;
          let head = "<h1>MyCarbonFootprint<\/h1>";
          let detail = "<h2>Journeys<\/h2>";
          detail='<div id="journeysTable"><table id="tableJourneys"><thead><tr>' +
              '<th scope="col">Date<\/th><th scope="col">Time<\/th><th scope="col">Reason<\/th>' +
              '<th scope="col">Mode<\/th><th scope="col">Distance<\/th><th scope="col">Carbon<\/th>' +
              '<th class="hidden" scope="col">Trees<\/th><\/tr><\/thead><tbody>';                   
          for (let i = allJourneys.length - 1; i > -1; i--) {
              detail +=
                  '<tr><td> ' +
                  allJourneys[i].start.substring(0, 10) +
                  "<\/td><td>" +
              allJourneys[i].start.substring(11, 17) +
                  "<\/td><td>" +
                  allJourneys[i].purpose +
                  "<\/td><td>" +
                  allJourneys[i].mode +
                  "<\/td><td>" +
                  allJourneys[i].distance +
                  "<\/td><td>" +
                  allJourneys[i].carbon +        
                  "<\/td><td class=\"hidden\">" +
              allJourneys[i].trees +        
                  "<\/td><\/tr>";
              totalTrees += parseFloat(allJourneys[i].trees);
          }
          detail += "<\/tobdy><\/table><\/div>";

          let summary =
              '<div id="summary"><h2>' +
              totalTrees.toFixed(2) +
              " trees<\/h2>" +
              getTreesVisual(totalTrees) +
              "<\/div>";
          let filters='<div><h3>Date from<\/h2><input oninput="filterTable()" type="date" id="dateFilterFrom"><\/div>' +
              '<div><h3>Date to<\/h3><input oninput="filterTable()" type="date" id="dateFilterTo"><\/div>' +
              '<div><h3>Reason<\/h3> <select onchange="filterTable()" id="reasonFilter" name="reasonFilter">' +
              '<option value="ALL">All reasons<\/option><option value="Business">Business<\/option><option value="Leisure">Leisure<\/option> <\/select><\/div>' +
              '<div><h3>Mode<\/h3><select onchange="filterTable()" id="modeFilter" name="modeFilter"><option value="ALL">All modes<\/option>' +
              '<option value="LargeCar">Large Car<\/option><option value="SmallCar">Small Car<\/option><option value="MediumCar">Medium Car<\/option>' + 
              '<option value="Bus">Bus<\/option><option value="Train">Train<\/option><option value="Plane">Plane<\/option>' + 
              '<option value="Ferry">Ferry<\/option><option value="Subway">Subway<\/option><option value="Train">Train<\/option>' +
              '<\/select><\/div><div id="controlsTwo"><button onClick="showHistory()" id="showHistory"><img data-src="/images/mycarbonimpact/app/reload.webp" alt="Reload" width="85" height="85" class="lazyload"><\/button><\/button><button onClick="exportTable()" id="exportTable"><img data-src="/images/mycarbonimpact/app/download.webp" alt="Download" width="85" height="85" class="lazyload"><\/button><\/div>';

          let history= document.getElementById("historyPanel");
          history.innerHTML=  head + summary + filters + detail;
      }
  };
  request.onerror = function(event) {
      alert("error in cursor request " + event.target.errorCode);
  };
});

function clearHistory() {
  let request = indexedDB.deleteDatabase("carbon", 7);
  request.onsuccess = function () {
      alert('DB deleted');
  };
  request.onfailure = function (event) {
      alert('DB deletion failed');
  };
  request.onblocked = function () {
      alert('DB blocked');
  };
}

Help.addEventListener("click", function() {
  helpPanel.classList.toggle('hidden', false);
  historyPanel.classList.toggle('hidden', true);
  document.getElementById("helpPanel").innerHTML =
      "<h2>Help<\/h2><p>1. Select your reason for travelling<\/p><table style='width:50%'><tbody><tr><td scope='row'><img alt='' src='/images/mycarbonimpact/app/business.webp' width='50' height='50'><\/td><td>Business<\/td><\/tr><tr><td scope='row'><img alt='' src='/images/mycarbonimpact/app/leisure.webp' width='50' height='50'><\/td><td>Leisure<\/td><\/tr><\/tbody><\/table><p>2. Select your method of transport<\/p><table style='width:50%'><tbody><tr><td scope='row'><img alt='' src='/images/mycarbonimpact/app/small-car.webp' width='50' height='50'><\/td><td>Small car<\/td><\/tr><tr><td scope='row'><img alt='' src='/images/mycarbonimpact/app/medium-car.webp' width='50' height='50'><\/td><td>Medium car<\/td><\/tr><tr><td scope='row'><img alt='' src='/images/mycarbonimpact/app/large-car.webp' width='50' height='50'><\/td><td>Large car<\/td><\/tr><tr><td scope='row'><img alt='' src='/images/mycarbonimpact/app/bus.webp' width='50' height='50'><\/td><td>Bus<\/td><\/tr><tr><td scope='row'><img alt='' src='/images/mycarbonimpact/app/train.webp' width='50' height='50'><\/td><td>Train<\/td><\/tr><tr><td scope='row'><img alt='' src='/images/mycarbonimpact/app/plane.webp' width='50' height='50'><\/td><td>Plane<\/td><\/tr><tr><td scope='row'><img alt='' src='/images/mycarbonimpact/app/ferry.webp' width='50' height='50'><\/td><td>Ferry<\/td><\/tr><tr><td scope='row'><img alt='' src='/images/mycarbonimpact/app/subway.webp' width='50' height='50'><\/td><td>Subway<\/td><\/tr><tr><td scope='row'><img alt='' src='/images/mycarbonimpact/app/tram.webp' width='50' height='50'><\/td><td>Tram<\/td><\/tr><\/tbody><\/table><p>3. Select the play button<\/p><p><strong>If you receive the following message 'User denied the request for Geolocation', please check the privacy/location settings on your device.<\/strong>";
});

function getTreesVisual(numTrees) {
  let html = "";
  let wholeTrees = Math.floor(numTrees);
  if (numTrees > 0.2) {
      for (let i = 0; i < wholeTrees; i++) {
          html += '<img src="/images/mycarbonimpact/app/tree.webp" style="width:100px;" alt="Tree" />&nbsp;';
      }
      let partialTrees = numTrees - wholeTrees;
      let pc;
      if (partialTrees == 0) {
          pc = 100;
      } else {
          pc = 100 - partialTrees * 100;
      }
      html +='<img style="width: 100px; clip-path:inset(0% ' +
          pc +
          "% 0% 0%);-webkit-clip-path:inset(0% " +
          pc +
          '% 0% 0%);" src="/images/mycarbonimpact/app/tree.webp" alt="Tree" />&nbsp;';
  }
  return html;
}

function getCarbon(distance) {
  let calc = 0;
  switch (mode) {
      case "Bus":
          calc = distance * 103.91;
          break;
      case "LargeCar":
          calc = distance * 209.47;
          break;
      case "SmallCar":
          calc = distance * 153.71;
          break;
      case "MediumCar":
          calc = distance * 170.61;
          break;
      case "Ferry":
          calc = distance * 116;
          break;
      case "Plane":
          calc = distance * 94.9;
          break;
      case "Subway":
          calc = distance * 45.2;
          break;
      case "Train":
          calc = distance * 60;
          break;
      case "Tram":
          calc = distance * 35.08;
          break;
      default:
          calc = 0;
          break;
  }
  return calc.toFixed(2);
}

function getTrees(carbon) {
  let calc = (carbon / 210000).toFixed(2);
  return calc;
}

function filterTable() {
  let table, tr, i;
  let idx=document.getElementById('modeFilter').options.selectedIndex;            
  let mode=document.getElementById('modeFilter').options[idx].value.toUpperCase();
  idx=document.getElementById('reasonFilter').options.selectedIndex; 
  let reason=document.getElementById('reasonFilter').options[idx].value.toUpperCase();            
  let from=document.getElementById('dateFilterFrom').value;
  let to=document.getElementById('dateFilterTo').value;
  from = from || '2010-01-01'; 
  to = to || '2050-12-31';
  table = document.getElementById("tableJourneys");
  tr = table.getElementsByTagName("tr");
  let totalTrees=0,trees=0;
  for (i = 1; i < tr.length; i++) {
      let tdDate = tr[i].getElementsByTagName("td")[0];
      let tdReason = tr[i].getElementsByTagName("td")[2];
      let tdMode = tr[i].getElementsByTagName("td")[3];
      let rowDate=tdDate.innerHTML.split("/");
      let chkDate=rowDate[1]+","+rowDate[0]+","+rowDate[2];
      if ((mode=="ALL" ||tdMode.innerHTML.toUpperCase().indexOf(mode) > -1 ) && 
          (reason=="ALL" || tdReason.innerHTML.toUpperCase().indexOf(reason) > -1) &&
          (dateCheck(from,to,chkDate))) {
              tr[i].style.display = "table-row";
              let trees=tr[i].getElementsByTagName("td")[6].innerHTML;
              totalTrees+=parseFloat(trees);
      } else {
              tr[i].style.display = "none";
      }
      let summary=document.getElementById("summary");
      summary.innerHTML = '<div id="summary"><h2>' +totalTrees.toFixed(2) + " trees<\/h2>" + getTreesVisual(totalTrees) +"<\/div>";
  }
}
function dateCheck(from,to,check) {
  let fDate,lDate,cDate;
  firstDate = Date.parse(from);
  lastDate = Date.parse(to);
  checkDate = Date.parse(check);
  if((checkDate <= lastDate && checkDate >= firstDate)) {
      return true;
  }
  return false;
}

function exportTable() {
  if ('storage' in navigator && 'estimate' in navigator.storage) {
      navigator.storage.estimate()
          .then(function(estimate){
              console.log(`Using ${estimate.usage} out of ${estimate.quota} bytes.`);
      });
  }
  let table, tr, td, i;    
  table = document.getElementById("tableJourneys");
  tr = table.getElementsByTagName("tr");        
  let csvContent = "Date,Time,Reason,Mode,Distance,Carbon\r\n";        
  for (i = 1; i < tr.length; i++) {
      if (tr[i].style.display != "none") {
          csvContent+=tr[i].getElementsByTagName("td")[0].innerHTML+",";
          csvContent+=tr[i].getElementsByTagName("td")[1].innerHTML+",";
          csvContent+=tr[i].getElementsByTagName("td")[2].innerHTML+",";
          csvContent+=tr[i].getElementsByTagName("td")[3].innerHTML+",";
          csvContent+=tr[i].getElementsByTagName("td")[4].innerHTML+",";
          csvContent+=tr[i].getElementsByTagName("td")[5].innerHTML+"\r\n";
      }
  }
  let hiddenElement = document.createElement('a');
  hiddenElement.href = 'data:text/csv;charset=utf-8,' + encodeURI(csvContent);
  hiddenElement.target = '_blank';
  hiddenElement.download = 'MyCarbonImpact.csv';
  hiddenElement.click();  
}

const shareBtn = document.querySelector('#share');

function share() {
if (isNaN(parseFloat(distance))) {
  distance = 0;
}
if (navigator.share) {
  navigator.share({
  title: 'MyCarbonImpact',
  text: 'I travelled ' + distance + 'km by ' + mode + ' for ' + purpose + '.',
  url: window.location.href
  }).then(() => {
  })
  .catch(err => {
  });
} else {
  console.log('web share not supported');
}
}
