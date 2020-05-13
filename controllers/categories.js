let utilities = require('../controllers/utilities');
require("../models/firebase");
let firebase = utilities.firebase;

/// modules


let getCategories = function (data) {
    return new Promise(function (resolve, reject) {
        var categories = []
        
        firebase.database().ref(`/categories`).once('value').then(function (snapshot) {
            categories = snapshot.val();

            if (categories.length > 0) {
            
                response = {
                    status: 'success',
                    message: 'Query Successful',
                    data: categories
                }
                resolve(response);
            } else {
                response = {
                    status: 'error',
                    message: 'Could not retrieve categories.',
                    data: categories
                }
                reject(response);
            }

        });
    });

}



module.exports = {
    getCategories
}