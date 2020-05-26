exports.models = require('../models/utilitiesModel');

exports.firebase = require("firebase/app");

let utilities = require('../controllers/utilities');



exports.validateAuth = function(req,appConfig){
    var isValid = false;
    var auth = require('basic-auth')
    var credentials = auth(req)
    var compare = require('tsscmp')
    if (!credentials || !credentials.name || !credentials.pass) {
        // credentials not provided
        console.log('credentials not provided')
    } else {
        // Simple method to prevent short-circut and use timing-safe compare
        if(compare(credentials.name,appConfig.apiUser ) && compare(credentials.pass, appConfig.apiPass)){
            isValid = true;
        }else{
            // wrong credentials
            console.log('wrong credentials')
        }
    } 
    return isValid;
}

exports.applyHaversine = function(items, originLat, originLng) {
    let usersLocation = {
      lat: originLat,
      lng: originLng
    };

    items.map(item => {
      let placeLocation = {
        lat: item.location.latitude,
        lng: item.location.longitude
      };

      item.distance = utilities.getDistanceBetweenPoints(
        usersLocation,
        placeLocation,
        "miles"
      ).toFixed(2);
    });

    return items;
  }

  exports.getDistanceBetweenPoints = function(start, end, units) {
    let earthRadius = {
      miles: 3958.8,
      km: 6371
    };

    let R = earthRadius[units || "miles"];
    let lat1 = start.lat;
    let lon1 = start.lng;
    let lat2 = end.lat;
    let lon2 = end.lng;

    let dLat = utilities.toRad(lat2 - lat1);
    let dLon = utilities.toRad(lon2 - lon1);
    let a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(utilities.toRad(lat1)) *
      Math.cos(utilities.toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
    let c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    let d = R * c;

    return d;
  }

  exports.toRad = function(x) {
    return (x * Math.PI) / 180;
  }

  exports.isEmpty = function(obj) {
    for (var key in obj) {
      if (obj.hasOwnProperty(key))
        return false;
    }
    return true;
  }

  exports.filterByCategories = function(item,categories){

  }
  