const mongoose = require("mongoose");

const espdataSchema = new mongoose.Schema({
    espnumber : {
        type: String,
        required: true
    },
    ipaddress : {
        type: String,
        required: true
    },
    state : {
        type: String,
        required: true
    },
    latitude : {
        type: String,
        required: true
    },
    longitude: {
        type: String,
        required: true
    },
    updatedate: {
        type: Date,
        default: Date.now(),
        required: false
    }
});

const espdata = mongoose.model("esp", espdataSchema);

module.exports = espdata;