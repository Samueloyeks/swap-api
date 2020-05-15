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
        firebase.database().ref(`/items`).child(itemModel.id).set(itemModel).then(function (snapshot) {
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

            if (user.likedItems) {
                items[key].liked = (user.likedItems[key]) ? true : false;
            } else {
                items[key].liked = false;
            }

            if (user.favoriteItems) {
                items[key].favorited = (user.favoriteItems[key]) ? true : false;
            } else {
                items[key].favorited = false;
            }



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

let likeItem = function (data) {
    return new Promise(function (resolve, reject) {
        let response = new Object;
        let usersRef = firebase.database().ref('/userProfiles');
        let itemsRef = firebase.database().ref('/items');


        usersRef.child(data.uid).child('likedItems').child(data.itemId)
            .set({ "liked": firebase.database.ServerValue.TIMESTAMP }).then(function () {
                var likesRef = itemsRef.child(data.itemId).child('likes');
                var likedbyRef = itemsRef.child(data.itemId).child('likedby');

                likesRef.transaction(function (likes) {
                    likes = (likes) ? (likes + 1) : 1
                    return likes;
                }).then(function () {

                    likedbyRef.push({ "id": data.uid }).then(function () {

                        response = {
                            status: 'success',
                            message: 'Item liked Successfully',
                            data: null
                        }
                        resolve(response);

                    })

                })
            })
    })
}

let unlikeItem = function (data) {
    return new Promise(async function (resolve, reject) {
        let response = new Object;
        let usersRef = firebase.database().ref('/userProfiles');
        let itemsRef = firebase.database().ref('/items');


        await usersRef.child(data.uid).child('likedItems').child(data.itemId).remove()

        var likesRef = itemsRef.child(data.itemId).child('likes');
        var likedbyRef = itemsRef.child(data.itemId).child('likedby');

        likesRef.transaction(function (likes) {
            likes = (likes) ? (likes - 1) : 0;
            return likes;
        }).then(function () {

            likedbyRef.on('value', snapshot => {
                snapshot.forEach(snap => {
                    if (snap.val().id == data.uid) {
                        snap.ref.remove()
                    }
                })
            })

            response = {
                status: 'success',
                message: 'Item unliked Successfully',
                data: null
            }
            resolve(response);

        })
    })
}

let favoriteItem = function (data) {
    return new Promise(function (resolve, reject) {
        let response = new Object;
        let usersRef = firebase.database().ref('/userProfiles');

        usersRef.child(data.uid).child('favoriteItems').child(data.itemId)
            .set({ "favorited": firebase.database.ServerValue.TIMESTAMP }).then(function () {
                response = {
                    status: 'success',
                    message: 'Item favorited Successfully',
                    data: null
                }
                resolve(response);
            })
    })
}

let unfavoriteItem = function (data) {
    return new Promise(async function (resolve, reject) {
        let response = new Object;
        let usersRef = firebase.database().ref('/userProfiles');

        await usersRef.child(data.uid).child('favoriteItems').child(data.itemId).remove().then(function () {
            response = {
                status: 'success',
                message: 'Item unfavorited Successfully',
                data: null
            }
            resolve(response);
        })

    })
}

module.exports = {
    uploadItem,
    getItems,
    likeItem,
    favoriteItem,
    unlikeItem,
    unfavoriteItem
}