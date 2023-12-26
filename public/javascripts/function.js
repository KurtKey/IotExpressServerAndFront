let data;
let currentId = 0;
function getespsBySearch() {
  var espnumber = document.getElementById('espnumber').value;
  if (espnumber.trim() === "") {
    loadAllEspData();
  } else {
    var settings = {
      "async": true,
      "crossDomain": true,
      "url": "http://localhost:3000/getesp/" + espnumber,
      "method": "GET",
      "headers": {
        "cache-control": "no-cache"
      }
    }
    populateTable(settings);
  }
}

function loadAllEspData() {
  var settings = {
    "async": true,
    "crossDomain": true,
    "url": "http://localhost:3000/getall",
    "method": "GET",
    "headers": {
      "cache-control": "no-cache"
    }
  }
  populateTable(settings);
}

function populateTable(settings) {
  const tableBody = document.querySelector("table tbody");
  tableBody.innerHTML = "";

  $.ajax(settings).done(function (response) {
    data = response;
    if (data.length > 0) { // Change this line
      let newtab = "";
      let serialno = 1;
      for (let i = (data.length) - 1; i >= 0; i--) { // Changed the loop condition
        newtab = newtab + `<tr>
              <td> ` + serialno + `</td>
              <td> ` + data[i].espnumber + `</td>
              <td> ` + data[i].state + `</td>
              <td> ` + moment(data[i].updatedate).format("MM/DD/YYYY h:mm:ss a") + `</td>
              <td> <button type="button" class="btn btn-info" id="` + i + `" onclick="updatelocation(this.id)">View</button>
              <td> <button type="button" class="btn btn-warning" id="` + i + `" onclick="controlTrafficLight('${data[i].ipaddress}','${data[i].state}')">Change State</button>
              <td> <button type="button" class="btn btn-danger" id="` + i + `" onclick="turnOnOffTrafficLight('${data[i].ipaddress}','${data[i].state}')">Power</button>
              </td></tr>`;
        serialno++;
      }

      $("table").find('tbody').html("");
      $("table").find("tbody").append(newtab);
      currentId = data.length - 1;
      updatemap(data[data.length - 1].latitude, data[data.length - 1].longitude);
    } else {
      console.log("no data found");
    }
  });
}

function updatemap(newLat, newLong) {
  map.flyTo([newLat, newLong], map.getZoom());
  marker.setLatLng([newLat, newLong]).update();
}

function updatelocation(click_id) {
  currentId = click_id;
  document.getElementById('map').scrollIntoView({ behavior: 'smooth' });
  updatemap(data[click_id].latitude, data[click_id].longitude);
}

function pingHighLed() {
  axios.get('/get-global-led-state')
    .then(response => {
      const globalLedState = response.data.globalLedState;
      const globalEspName = response.data.globalEspName;
      const [f1State, f2State] = globalLedState.split(';');
      console.log('Received Global LED State:', globalLedState);
      console.log('Received Global LED Name:', globalEspName);
      if (globalEspName === data[currentId].espnumber) {
        updateLEDState(f1State, f2State)
      }
    })
    .catch(error => {
      console.error('Error fetching Global LED State:', error);
    });
}
function updateLEDState(state1, state2) {
  if (state1 === 'RED' && state2 === 'GREEN') {
    $('#ledImage').attr('src', 'images/red.png');
    $('#ledImage2').attr('src', 'images/green.png');
  } else if (state1 === 'RED' && state2 === 'YELLOW') {
    $('#ledImage').attr('src', 'images/red.png');
    $('#ledImage2').attr('src', 'images/yellow.png');
  } else if (state1 === 'GREEN') {
    $('#ledImage').attr('src', 'images/green.png');
    $('#ledImage2').attr('src', 'images/red.png');
  } else if (state1 === 'YELLOW') {
    $('#ledImage').attr('src', 'images/yellow.png');
    $('#ledImage2').attr('src', 'images/red.png');
  } else {
    $('#ledImage').attr('src', 'images/default.png');
    $('#ledImage2').attr('src', 'images/default.png');
  }
}

function controlTrafficLight(espIP, wantedState) {
  // Send a request to your server to control the LED
  console.log(`Control TrafficLight called with IP: ${espIP}`);
  fetch(`/control-esp/${espIP}/${wantedState}`)
    .then(response => {
      if (response.status === 200) {
        console.log(`TrafficLight control request sent for ESP at IP: ${espIP}`);
      } else {
        console.error(`Failed to send TrafficLight control request for ESP at IP: ${espIP}`);
      }
    })
    .catch(error => {
      console.error(`Error: ${error}`);
    });
}

function turnOnOffTrafficLight(espIP, onOff) {
  // Send a request to your server to control the LED
  if (onOff === 'ON') {
    onOff = 'OFF'
  } else {
    onOff = 'ON'
  }
  console.log(`turnOnOffTrafficLight called with IP: ${espIP}`);
  // First, update the state in the database
  fetch(`/update-esp-state/${espIP}/${onOff}`, { method: 'POST' })
    .then(response => {
      if (response.status === 200) {

        console.log(`ESP state updated to ${onOff} for IP: ${espIP}`);
        fetch(`/turnonoff-esp/${espIP}/${onOff}`)
          .then(response => {
            if (response.status === 200) {
              console.log(`TrafficLight poweronoff request sent for ESP at IP: ${espIP}`);
              setTimeout(function () {
                location.reload();
              }, 200);
            } else {
              console.error(`Failed to send TrafficLight power request for ESP at IP: ${espIP}`);
            }
          })
          .catch(error => {
            console.error(`Error: ${error}`);
          });


      } else {
        console.error(`Failed to update ESP state for IP: ${espIP}`);
      }
    })
    .catch(error => {
      console.error(`Error: ${error}`);
    });
}

document.addEventListener("DOMContentLoaded", () => {
  loadAllEspData();
});