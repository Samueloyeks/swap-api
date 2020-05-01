let utilities = require('../controllers/utilities');
require("../models/firebase");
let firebase = utilities.firebase;

let upload = function(data){
    return new Promise (function(resolve,reject){
        
        if(data.image){
            var base64Data = data.image.split(',');      
            var imgBaseURL = 'uploads/'+Date.now()+'.png';     
            require("fs").writeFile(String(imgBaseURL),base64Data[1], 'base64', function(err) {
                console.log(err);
            });
            let response = new Object();
            var downloadURL = 'http://'+global.serverURL+'/'+imgBaseURL;
            // Base64 formatted string
            console.log('File available at', downloadURL);
            response = {
                status:'success',
                message:'Upload Successful',
                data:{'url':downloadURL}   
            }
           
            
            resolve(response);
        }else{
            console.log('no image')
            
        }
        

    });

};


let dataURItoBlob = function(data){
    let binary = data.split(',')[1];
    binary = Buffer.from(binary, 'base64').toString()
    let array = [];
    for (let i = 0; i < binary.length; i++) {
      array.push(binary.charCodeAt(i));
    }
    var blobTest = new Blob([new Uint8Array(array)], {type: 'image/jpeg'});
    console.log("===========================================");
    console.log(typeof(blobTest));
    return new Blob([new Uint8Array(array)], {type: 'image/jpeg'});
  };

module.exports = {
    dataURItoBlob,
    upload
    
}