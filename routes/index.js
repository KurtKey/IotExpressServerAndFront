var express = require('express');
var router = express.Router();
const http = require('http');
const bodyParser = require('body-parser');
const espdata = require("../models/esp");
let globalLedState  = 'DEFAULT';
let globalEspName = 'default name';
/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('index', { title: 'IoT project' });
});
router.get('/create-esp', (req, res) => {
  res.render('create-esp.ejs'); // Render the EJS view
});

router.post("/addesp", (req, res) => {
  const { espnumber, ipaddress, state, latitude, longitude } = req.body;
  let errors = [];

  if (!espnumber || !latitude || !longitude || !ipaddress || !state) {
    errors.push({ msg: "Parameters are missing" });
  }
  if (errors.length > 0) {
    res.json({ Message: errors })
  } else {
    const newespdata = new espdata({
      espnumber,
      ipaddress,
      state,
      latitude,
      longitude
    });

    newespdata
      .save()
      .then(newespdata => {
        res.redirect('/');
      })
      .catch(err => console.log(err));
  }
});
module.exports = router;

router.get("/getesp/:espnumber", (req, res) => {
  var espnumber = req.params.espnumber;
  console.log(espnumber);

  espdata.find({ espnumber: espnumber }).exec((err, espnumber) => {
    console.log(espnumber);
    res.json(espnumber);
  });
});

router.get("/getall", (req, res) => {
  espdata.find({}, (err, allEspData) => {
    if (err) {
      return res.status(500).json({ error: "An error occurred while fetching data." });
    }
    res.json(allEspData);
  });
});

router.get('/control-esp/:espIP/:wantedState', (req, res) => {
  const espIP = req.params.espIP;
  const wantedState = req.params.wantedState;

  const request = http.get(`http://${espIP}/?wantedState=${wantedState}`, (response) => {
    let data = '';
    response.on('data', (chunk) => {
      data += chunk;
    });

    response.on('end', () => {
      console.log(`TrafficLight changed the state, ESP at IP: ${espIP}`);
      res.sendStatus(200);
    });
  });
  request.on('error', (error) => {
    console.error(`Error making the request: ${error.message}`);
    res.status(500).send('Internal Server Error');
  });
});



router.use(bodyParser.json());
router.get('/get-led-state/:espName', (req, res) => {
  // Extract the 'ledState' parameter from the URL
  let ledState = req.query.ledState;
  let espName = req.params.espName;
  globalLedState = ledState;
  globalEspName = espName;
  console.log('LED State:', ledState);
  //res.setHeader('Cache-Control', 'no-store');
  //res.json({ ledState });
  
});

// Define a route to get the globalLedState
router.get('/get-global-led-state', (req, res) => {
  // You can directly send the globalLedState to the client
  res.json({ globalLedState, globalEspName });
});

// route to tuurn on or off the esp :
router.get('/turnonoff-esp/:espIP/:turn', (req, res) => {
  const espIP = req.params.espIP;
  const turn = req.params.turn;

  // Send an HTTP request to the ESP8266 to control the LED
  http.get(`http://${espIP}/?turn=${turn}`, (response) => {
    let data = '';
    response.on('data', (chunk) => {
      data += chunk;
    });

    response.on('end', () => {
      console.log(`TrafficLight turned on for ESP at IP: ${espIP}`);
      res.sendStatus(200); // Send a response to the client
    });
  });
});

router.post('/update-esp-state/:ip/:state', async (req, res) => {
  const { ip, state } = req.params;

  try {
    // Find the ESP document by IP address and update its state
    const espDoc = await espdata.findOne({ ipaddress: ip });
    
    if (!espDoc) {
      return res.status(404).json({ error: 'ESP not found' });
    }

    espDoc.state = state;
    espDoc.updatedate = new Date();

    // Save the updated document to the database
    await espDoc.save();

    res.status(200).json({ message: `ESP state updated to ${state}` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
