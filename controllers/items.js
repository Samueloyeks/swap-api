let utilities = require('../controllers/utilities');
require("../models/firebase");
let firebase = utilities.firebase;
const uuid = require('uuid');



/// modules


let uploadItem = function (data) {
    return new Promise(function (resolve, reject) {
        let itemModel = require('../models/itemModel');
        itemModel = itemModel.item;
        try {

            itemModel.id = uuid.v4()
            itemModel.title = data.title;
            itemModel.description = data.description;
            itemModel.quantity = data.quantity;
            itemModel.price = data.price;
            itemModel.categories = data.categories;
            itemModel.images = data.images;
            itemModel.preferences = data.preferences;
            itemModel.postedby = data.postedby;
            itemModel.posted = new Date().toISOString()
            itemModel.swapped = false;
            itemModel.likes = 0;


        } catch (ex) {
            // data validation failed

            console.log('item upload:data validation failed')
            response = {
                status: 'error',
                message: 'Filed to upload Item',
                data: null
            }
            reject(response);
        }
        firebase.database().ref(`/items`).push(itemModel).then(function (snapshot) {

            response = {
                status: 'success',
                message: 'Item Uploaded Successfully',
                data: null
            }
            resolve(response);


        });
    });

}

let getItems = async function () {

    let response = new Object();
    let categoriesRef = firebase.database().ref('/categories');
    let usersRef = firebase.database().ref('/userProfiles');
    let itemsRef = firebase.database().ref('/items').orderByKey();

    let itemsSnap = await itemsRef.once("value");
    let items = itemsSnap.val();
    if (items) {

        for (var key in items) {
            let item = items[key];
            let categories = item.categories
            let postedby = item.postedby

            let userSnap = await usersRef.child(postedby).once("value");
            let user = userSnap.val();

            items[key].postedby = user;


            await Promise.all(categories.map(async function (categoryId, index) {

                let categoriesSnap = await categoriesRef.once("value");
                let fullCategories = categoriesSnap.val();

                categories[index] = fullCategories.find(category =>
                    category.id == categoryId
                )

            }))
        }
        response = {
            status: 'success',
            message: 'Items loaded',
            data: items
        }


    } else {
        response = {
            status: 'error',
            message: 'Unable to get Items',
            data: null
        }
    }

    return response;

}


module.exports = {
    uploadItem,
    getItems
}