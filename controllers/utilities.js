exports.models = require('../models/utilitiesModel');

exports.firebase = require("firebase/app");


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
  