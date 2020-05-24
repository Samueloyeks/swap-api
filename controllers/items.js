let utilities = require('../controllers/utilities');
require("../models/firebase");
let firebase = utilities.firebase;
const uuid = require('uuid');



/// modules


let uploadItem = function (data) {
    return new Promise(async function (resolve, reject) {
        let itemModel = require('../models/itemModel');
        itemModel = itemModel.item;
        try {

            // itemModel.id = uuid.v4()
            itemModel.title = data.title;
            itemModel.description = data.description;
            itemModel.quantity = data.quantity;
            itemModel.price = parseInt(data.price);
            itemModel.categories = data.categories;
            itemModel.images = data.images;
            itemModel.preferences = data.preferences;
            itemModel.postedby = data.postedby;
            itemModel.posted = new Date().toISOString()
            itemModel.swapped = false;
            itemModel.likes = 0;
            itemModel.timestamp = firebase.database.ServerValue.TIMESTAMP;
            itemModel.location = data.location


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





        let key = await firebase.database().ref(`/items`).push().getKey();
        let itemRef = firebase.database().ref(`/items/${key}`);
        itemModel.id = key

        firebase.database().ref(`/items`).child(itemModel.id).set(itemModel).then(function (snapshot) {

            itemRef.once('value').then(function (snap) {
                timestamp = snap.val().timestamp * -1
                itemRef.update({ timestamp })
            })

            response = {
                status: 'success',
                message: 'Item Uploaded Successfully',
                data: null
            }
            resolve(response);


        });
    });

}

let getItems = async function (data) {

    let response = new Object();
    let categoriesRef = firebase.database().ref('/categories');
    let usersRef = firebase.database().ref('/userProfiles');
    let itemsRef = firebase.database().ref('/items').orderByChild('timestamp');
    let items = [];

    let itemsSnap = await itemsRef.once("value");

    itemsSnap.forEach(function (snap) {
        let item = snap.val();
        if(!item.swapped){
            items.push(item);
        }
    })

    await Promise.all(items.map(async function (item) {
        let categories = item.categories
        let postedby = item.postedby

        let posterSnap = await usersRef.child(postedby).once("value");
        let poster = posterSnap.val();

        item.postedby = poster;

        let userSnap = await usersRef.child(data.uid).once("value");
        let user = userSnap.val();

        if (user.likedItems) {
            item.liked = (user.likedItems[item.id]) ? true : false;
        } else {
            item.liked = false;
        }

        if (user.favoriteItems) {
            item.favorited = (user.favoriteItems[item.id]) ? true : false;
        } else {
            item.favorited = false;
        }



        await Promise.all(categories.map(async function (categoryId, index) {

            let categoriesSnap = await categoriesRef.once("value");
            let fullCategories = categoriesSnap.val();

            categories[index] = fullCategories.find(category =>
                category.id == categoryId
            )

        }))
    }))


    response = {
        status: 'success',
        message: 'Items loaded',
        data: items
    }

    return response;



    // let itemsSnap = await itemsRef.once("value");
    // let items = itemsSnap.val();

    // if (items) {

    //     for (var key in items) {
    //         let item = items[key];
    //         let categories = item.categories
    //         let postedby = item.postedby

    //         let userSnap = await usersRef.child(postedby).once("value");
    //         let user = userSnap.val();

    //         items[key].postedby = user;

    //         if (user.likedItems) {
    //             items[key].liked = (user.likedItems[key]) ? true : false;
    //         } else {
    //             items[key].liked = false;
    //         }

    //         if (user.favoriteItems) {
    //             items[key].favorited = (user.favoriteItems[key]) ? true : false;
    //         } else {
    //             items[key].favorited = false;
    //         }



    //         await Promise.all(categories.map(async function (categoryId, index) {

    //             let categoriesSnap = await categoriesRef.once("value");
    //             let fullCategories = categoriesSnap.val();

    //             categories[index] = fullCategories.find(category =>
    //                 category.id == categoryId
    //             )

    //         }))
    //     }
    //     response = {
    //         status: 'success',
    //         message: 'Items loaded',
    //         data: items
    //     }


    // } else {

    // }


}

let getItemByIndex = async function (data) {
    let response = new Object();
    let categoriesRef = firebase.database().ref('/categories');
    let usersRef = firebase.database().ref('/userProfiles');
    let itemsRef = firebase.database().ref('/items');

    let itemSnap = await itemsRef.child(data.id).once("value");
    let item = itemSnap.val();

    if (item) {
        let categories = item.categories
        let postedby = item.postedby



        let posterSnap = await usersRef.child(postedby).once("value");
        let poster = posterSnap.val();

        item.postedby = poster;

        let userSnap = await usersRef.child(data.uid).once("value");
        let user = userSnap.val();

        if (user.likedItems) {
            item.liked = (user.likedItems[data.id]) ? true : false;
        } else {
            item.liked = false;
        }

        if (user.favoriteItems) {
            item.favorited = (user.favoriteItems[data.id]) ? true : false;
        } else {
            item.favorited = false;
        }


        await Promise.all(categories.map(async function (categoryId, index) {

            let categoriesSnap = await categoriesRef.once("value");
            let fullCategories = categoriesSnap.val();

            categories[index] = fullCategories.find(category =>
                category.id == categoryId
            )

        }))

        response = {
            status: 'success',
            message: 'Items loaded',
            data: item
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

let getItemsByCategory = async function (data) {
    let response = new Object();
    let categoriesRef = firebase.database().ref('/categories');
    let usersRef = firebase.database().ref('/userProfiles');
    let itemsRef = firebase.database().ref('/items').orderByChild('timestamp');
    let filteredItems = [];

    let itemsSnap = await itemsRef.once("value");

    itemsSnap.forEach(function (snap) {
        let item = snap.val();

        for (let i = 0; i < item.categories.length; i++) {
            let category = item.categories[i];
            if (data.categories[category] && !item.swapped) {
                filteredItems.push(item);
                break;
            }
        }
    })


    await Promise.all(filteredItems.map(async function (filteredItem) {

        let categories = filteredItem.categories
        let postedby = filteredItem.postedby


        let posterSnap = await usersRef.child(postedby).once("value");
        let poster = posterSnap.val();

        filteredItem.postedby = poster;

        let userSnap = await usersRef.child(data.uid).once("value");
        let user = userSnap.val();

        if (user.likedItems) {
            filteredItem.liked = (user.likedItems[filteredItem.id]) ? true : false;
        } else {
            filteredItem.liked = false;
        }

        if (user.favoriteItems) {
            filteredItem.favorited = (user.favoriteItems[filteredItem.id]) ? true : false;
        } else {
            filteredItem.favorited = false;
        }


        await Promise.all(categories.map(async function (categoryId, index) {

            let categoriesSnap = await categoriesRef.once("value");
            let fullCategories = categoriesSnap.val();

            categories[index] = fullCategories.find(category =>
                category.id == categoryId
            )

        }))
    }))


    response = {
        status: 'success',
        message: 'Items loaded',
        data: filteredItems
    }

    return response;
}

let getItemsBySearch = async function (data) {
    let response = new Object();
    let categoriesRef = firebase.database().ref('/categories');
    let usersRef = firebase.database().ref('/userProfiles');
    let itemsRef = firebase.database().ref('/items').orderByChild('title').startAt(data.searchString.toLowerCase())
        .endAt(data.searchString.toLowerCase() + "\uf8ff")
    let filteredItems = [];

    let itemsSnap = await itemsRef.once("value");

    itemsSnap.forEach(function (snap) {
        let item = snap.val();

        if(!item.swapped){
            filteredItems.push(item);
        }
    })


    await Promise.all(filteredItems.map(async function (filteredItem) {

        let categories = filteredItem.categories
        let postedby = filteredItem.postedby


        let posterSnap = await usersRef.child(postedby).once("value");
        let poster = posterSnap.val();

        filteredItem.postedby = poster;

        let userSnap = await usersRef.child(data.uid).once("value");
        let user = userSnap.val();

        

        if (user.likedItems) {
            filteredItem.liked = (user.likedItems[filteredItem.id]) ? true : false;
        } else {
            filteredItem.liked = false;
        }

        if (user.favoriteItems) {
            filteredItem.favorited = (user.favoriteItems[filteredItem.id]) ? true : false;
        } else {
            filteredItem.favorited = false;
        }


        await Promise.all(categories.map(async function (categoryId, index) {

            let categoriesSnap = await categoriesRef.once("value");
            let fullCategories = categoriesSnap.val();

            categories[index] = fullCategories.find(category =>
                category.id == categoryId
            )

        }))
    }))


    response = {
        status: 'success',
        message: 'Items loaded',
        data: filteredItems
    }

    return response;
}
 
let getItemsByPrice = async function () {
    let response = new Object();
    let categoriesRef = firebase.database().ref('/categories');
    let usersRef = firebase.database().ref('/userProfiles');
    let itemsRef = firebase.database().ref('/items').orderByChild('price')
    let filteredItems = [];

    let itemsSnap = await itemsRef.once("value");

    itemsSnap.forEach(function (snap) {
        let item = snap.val();

        if(!item.swapped){
            filteredItems.push(item);
        }
    })


    await Promise.all(filteredItems.map(async function (filteredItem) {

        let categories = filteredItem.categories
        let postedby = filteredItem.postedby


        let posterSnap = await usersRef.child(postedby).once("value");
        let poster = posterSnap.val();

        filteredItem.postedby = poster;

        let userSnap = await usersRef.child(data.uid).once("value");
        let user = userSnap.val();

        if (user.likedItems) {
            filteredItem.liked = (user.likedItems[filteredItem.id]) ? true : false;
        } else {
            filteredItem.liked = false;
        }

        if (user.favoriteItems) {
            filteredItem.favorited = (user.favoriteItems[filteredItem.id]) ? true : false;
        } else {
            filteredItem.favorited = false;
        }


        await Promise.all(categories.map(async function (categoryId, index) {

            let categoriesSnap = await categoriesRef.once("value");
            let fullCategories = categoriesSnap.val();

            categories[index] = fullCategories.find(category =>
                category.id == categoryId
            )

        }))
    }))


    response = {
        status: 'success',
        message: 'Items loaded',
        data: filteredItems
    }

    return response;
}

let getItemsByUid = async function(data){

    let response = new Object();
    let categoriesRef = firebase.database().ref('/categories');
    let usersRef = firebase.database().ref('/userProfiles');
    let itemsRef = firebase.database().ref('/items').orderByChild('timestamp')
    let items = [];

    let itemsSnap = await itemsRef.once("value");

    itemsSnap.forEach(function (snap) {
        let item = snap.val();
        if(!item.swapped && item.postedby == data.uid){
            items.push(item);
        }
    })

    await Promise.all(items.map(async function (item) {
        let categories = item.categories
        let postedby = item.postedby


        let posterSnap = await usersRef.child(postedby).once("value");
        let poster = posterSnap.val();

        item.postedby = poster;

        let userSnap = await usersRef.child(data.uid).once("value");
        let user = userSnap.val();

        item.postedby = user;

        if (user.likedItems) {
            item.liked = (user.likedItems[item.id]) ? true : false;
        } else {
            item.liked = false;
        }

        if (user.favoriteItems) {
            item.favorited = (user.favoriteItems[item.id]) ? true : false;
        } else {
            item.favorited = false;
        }



        await Promise.all(categories.map(async function (categoryId, index) {

            let categoriesSnap = await categoriesRef.once("value");
            let fullCategories = categoriesSnap.val();

            categories[index] = fullCategories.find(category =>
                category.id == categoryId
            )

        }))
    }))


    response = {
        status: 'success',
        message: 'Items loaded',
        data: items
    }

    return response;

}

let likeItem = function (data) {
    return new Promise(async function (resolve, reject) {
        let response = new Object;
        let usersRef = firebase.database().ref('/userProfiles');
        let itemsRef = firebase.database().ref('/items');
        var likesRef = itemsRef.child(data.itemId).child('likes');
        var likedbyRef = itemsRef.child(data.itemId).child('likedby');

        await usersRef.child(data.uid).child('likedItems').child(data.itemId)
            .set({ "liked": firebase.database.ServerValue.TIMESTAMP })

        await likesRef.transaction(function (likes) {
            likes = (likes) ? (likes + 1) : 1
            return likes;
        })

        await likedbyRef.push({ "id": data.uid })

        response = {
            status: 'success',
            message: 'Item liked Successfully',
            data: null
        }
        resolve(response);
    })
}

let unlikeItem = function (data) {
    return new Promise(async function (resolve, reject) {
        let response = new Object;
        let usersRef = firebase.database().ref('/userProfiles');
        let itemsRef = firebase.database().ref('/items');

        var likesRef = itemsRef.child(data.itemId).child('likes');
        var likedbyRef = itemsRef.child(data.itemId).child('likedby');


        await usersRef.child(data.uid).child('likedItems').child(data.itemId).remove()

        await likesRef.transaction(function (likes) {
            likes = (likes) ? (likes - 1) : 0;
            return likes;
        })

        await likedbyRef.once('value', snapshot => {
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
}

let favoriteItem = function (data) {
    return new Promise(async function (resolve, reject) {
        let response = new Object;
        let usersRef = firebase.database().ref('/userProfiles');

        await usersRef.child(data.uid).child('favoriteItems').child(data.itemId)
            .set({ "favorited": firebase.database.ServerValue.TIMESTAMP })
            response = {
                status: 'success',
                message: 'Item favorited Successfully',
                data: null
            }
            resolve(response);
    })
}

let unfavoriteItem = function (data) {
    return new Promise(async function (resolve, reject) {
        let response = new Object;
        let usersRef = firebase.database().ref('/userProfiles');

        await usersRef.child(data.uid).child('favoriteItems').child(data.itemId).remove()

        response = {
            status: 'success',
            message: 'Item unfavorited Successfully',
            data: null
        }
        resolve(response);

    })
}

let sendOffer = function(data){
    return new Promise(async function (resolve, reject) {
        let response = new Object;
        let itemsRef = firebase.database().ref('/items');
        let usersRef = firebase.database().ref('/userProfiles');


        let offer = {
            offerItemIds : data.offerItemIds,
            offeredby : data.offeredby,
            postedby:data.postedby,
            offered : new Date().toISOString()
        }


        await itemsRef.child(data.itemId).child('offers').push(offer)

        response = {
            status: 'success',
            message: 'Offer Sent Successfully',
            data: null
        }
        resolve(response);
    })
}

module.exports = {
    uploadItem,
    getItems,
    getItemByIndex,
    getItemsByCategory,
    getItemsBySearch,
    likeItem,
    favoriteItem,
    unlikeItem,
    unfavoriteItem,
    getItemsByPrice,
    getItemsByUid,
    sendOffer
}