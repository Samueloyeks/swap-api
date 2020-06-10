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
            itemModel.quantity = (data.quantity) ? data.quantity : 1
            itemModel.price = (data.price) ? parseInt(data.price) : null
            itemModel.categories = data.categories;
            itemModel.images = data.images;
            itemModel.preferences = (data.preferences) ? data.preferences : null
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
        let posterRef = firebase.database().ref(`/userProfiles/${data.postedby}`);
        let poster = (await posterRef.once("value")).val();
        let posterItemsRef = firebase.database().ref('/usersItemsRefs').child(poster.itemsRefKey)
        let itemLikersRefKey = await firebase.database().ref(`/itemsLikersRefs`).push().getKey();
        let itemOffersRefKey = await firebase.database().ref(`/itemsOffersRefs`).push().getKey();


        itemModel.id = key
        itemModel.itemLikersRefKey = itemLikersRefKey
        itemModel.itemOffersRefKey = itemOffersRefKey


        firebase.database().ref(`/items`).child(itemModel.id).set(itemModel).then(async function (snapshot) {


            await itemRef.once('value').then(async function (snap) {
                timestamp = snap.val().timestamp * -1
                itemRef.update({ timestamp })

                await posterItemsRef.child(itemModel.id).set({
                    timestamp
                })
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

let editItem = function (data) {
    return new Promise(async function (resolve, reject) {
        let itemModel = require('../models/itemModel');
        itemModel = itemModel.item;

        let itemId, title, description, quantity, price, categories, images, preferences
        try {

            itemId = data.id
            title = data.title;
            description = data.description;
            quantity = (data.quantity) ? data.quantity : 1
            price = data.price ? parseInt(data.price) : null
            categories = data.categories;
            images = data.images;
            preferences = (data.preferences) ? data.preferences : null
            // itemModel.location = data.location

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


        let itemRef = firebase.database().ref(`/items/${itemId}`);

        await itemRef.update({
            title,
            description,
            quantity,
            price,
            categories,
            images,
            preferences
        })

        response = {
            status: 'success',
            message: 'Item Edited Successfully',
            data: null
        }
        resolve(response);

    });

}

let getItems = async function (data) {

    let response = new Object();
    let categoriesRef = firebase.database().ref('/categories');
    let usersRef = firebase.database().ref('/userProfiles');
    let itemsRef = firebase.database().ref('/items').orderByChild('timestamp');
    let usersLikesRefs = firebase.database().ref(`/usersLikesRefs`)
    let usersFavoritesRefs = firebase.database().ref(`/usersFavoritesRefs`)

    let items = [];

    let itemsSnap = await itemsRef.once("value");

    itemsSnap.forEach(function (snap) {
        let item = snap.val();
        if (!item.swapped) {
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

        let userLikedItemsSnap = await usersLikesRefs.child(user.likesRefKey).once("value")

        if (userLikedItemsSnap.exists()) {
            let userLikedItems = userLikedItemsSnap.val();
            item.liked = (userLikedItems[item.id]) ? true : false;
        } else {
            item.liked = false;
        }

        let userFavoriteItemsSnap = await usersFavoritesRefs.child(user.favoritesRefKey).once("value")

        if (userFavoriteItemsSnap.exists()) {
            let userFavoriteItems = userFavoriteItemsSnap.val();
            item.favorited = (userFavoriteItems[item.id]) ? true : false;
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
    let usersLikesRefs = firebase.database().ref(`/usersLikesRefs`)
    let usersFavoritesRefs = firebase.database().ref(`/usersFavoritesRefs`)

    let itemSnap = await itemsRef.child(data.itemId).once("value");
    let item = itemSnap.val();

    if (item) {
        let categories = item.categories
        let postedby = item.postedby



        if (data.includePoster) {
            let posterSnap = await usersRef.child(postedby).once("value");
            let poster = posterSnap.val();

            item.postedby = poster;
        }

        let userSnap = await usersRef.child(data.uid).once("value");
        let user = userSnap.val();

        let userLikedItemsSnap = await usersLikesRefs.child(user.likesRefKey).once("value")

        if (userLikedItemsSnap.exists()) {
            let userLikedItems = userLikedItemsSnap.val();
            item.liked = (userLikedItems[item.id]) ? true : false;
        } else {
            item.liked = false;
        }

        let userFavoriteItemsSnap = await usersFavoritesRefs.child(user.favoritesRefKey).once("value")

        if (userFavoriteItemsSnap.exists()) {
            let userFavoriteItems = userFavoriteItemsSnap.val();
            item.favorited = (userFavoriteItems[item.id]) ? true : false;
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
    let usersLikesRefs = firebase.database().ref(`/usersLikesRefs`)
    let usersFavoritesRefs = firebase.database().ref(`/usersFavoritesRefs`)

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

        let userLikedItemsSnap = await usersLikesRefs.child(user.likesRefKey).once("value")

        if (userLikedItemsSnap.exists()) {
            let userLikedItems = userLikedItemsSnap.val();
            filteredItem.liked = (userLikedItems[filteredItem.id]) ? true : false;
        } else {
            filteredItem.liked = false;
        }

        let userFavoriteItemsSnap = await usersFavoritesRefs.child(user.favoritesRefKey).once("value")

        if (userFavoriteItemsSnap.exists()) {
            let userFavoriteItems = userFavoriteItemsSnap.val();
            filteredItem.favorited = (userFavoriteItems[filteredItem.id]) ? true : false;
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
    let usersLikesRefs = firebase.database().ref(`/usersLikesRefs`)
    let usersFavoritesRefs = firebase.database().ref(`/usersFavoritesRefs`)
    let itemsRef = firebase.database().ref('/items')
        .orderByChild('title')
        .startAt(data.searchString.toLowerCase().trim())
        .endAt(data.searchString.toLowerCase().trim() + "\uf8ff")

    let filteredItems = [];

    let itemsSnap = await itemsRef.once("value");

    itemsSnap.forEach(function (snap) {
        let item = snap.val();

        if (!item.swapped) {
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



        let userLikedItemsSnap = await usersLikesRefs.child(user.likesRefKey).once("value")

        if (userLikedItemsSnap.exists()) {
            let userLikedItems = userLikedItemsSnap.val();
            filteredItem.liked = (userLikedItems[filteredItem.id]) ? true : false;
        } else {
            filteredItem.liked = false;
        }

        let userFavoriteItemsSnap = await usersFavoritesRefs.child(user.favoritesRefKey).once("value")

        if (userFavoriteItemsSnap.exists()) {
            let userFavoriteItems = userFavoriteItemsSnap.val();
            filteredItem.favorited = (userFavoriteItems[filteredItem.id]) ? true : false;
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
    let usersLikesRefs = firebase.database().ref(`/usersLikesRefs`)
    let usersFavoritesRefs = firebase.database().ref(`/usersFavoritesRefs`)

    let filteredItems = [];

    let itemsSnap = await itemsRef.once("value");

    itemsSnap.forEach(function (snap) {
        let item = snap.val();

        if (!item.swapped) {
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


        let userLikedItemsSnap = await usersLikesRefs.child(user.likesRefKey).once("value")

        if (userLikedItemsSnap.exists()) {
            let userLikedItems = userLikedItemsSnap.val();
            filteredItem.liked = (userLikedItems[filteredItem.id]) ? true : false;
        } else {
            filteredItem.liked = false;
        }

        let userFavoriteItemsSnap = await usersFavoritesRefs.child(user.favoritesRefKey).once("value")

        if (userFavoriteItemsSnap.exists()) {
            let userFavoriteItems = userFavoriteItemsSnap.val();
            filteredItem.favorited = (userFavoriteItems[filteredItem.id]) ? true : false;
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

let getItemsByUid = async function (data) {

    let response = new Object();
    let categoriesRef = firebase.database().ref('/categories');
    let usersRef = firebase.database().ref('/userProfiles');
    let itemsRef = firebase.database().ref('/items');
    let usersLikesRefs = firebase.database().ref(`/usersLikesRefs`)
    let usersFavoritesRefs = firebase.database().ref(`/usersFavoritesRefs`)
    let usersItemsRefs = firebase.database().ref('/usersItemsRefs')
    // .orderByChild('timestamp');

    let user = (await usersRef.child(data.uid).once("value")).val()
    let lastItemStamp



    let userItemsRef = usersItemsRefs
        .child(user.itemsRefKey)
        .orderByChild('timestamp')
        .startAt((data.lastItemStamp) ? parseInt(data.lastItemStamp) : null)
        .limitToFirst(data.pageSize)

    let items = [];
    let itemIds = [];


    let itemsSnap = await userItemsRef.once("value");

    itemsSnap.forEach(function (snap) {
        if (snap.exists()) {
            let itemId = snap.key;
            itemIds.push(itemId);
        }
    })



    await Promise.all(itemIds.map(async function (itemId, index) {
        let itemSnap = await itemsRef.child(itemId).once("value");
        let item = await itemSnap.val();

        let categories = item.categories
        let postedby = item.postedby

        let posterSnap = await usersRef.child(postedby).once("value");
        let poster = posterSnap.val();

        item.postedby = poster;

        // let userSnap = await usersRef.child(data.uid).once("value");
        // let user = userSnap.val();

        let userLikedItemsSnap = await usersLikesRefs.child(user.likesRefKey).once("value")

        if (userLikedItemsSnap.exists()) {
            let userLikedItems = userLikedItemsSnap.val();
            item.liked = (userLikedItems[item.id]) ? true : false;
        } else {
            item.liked = false;
        }

        let userFavoriteItemsSnap = await usersFavoritesRefs.child(user.favoritesRefKey).once("value")

        if (userFavoriteItemsSnap.exists()) {
            let userFavoriteItems = userFavoriteItemsSnap.val();
            item.favorited = (userFavoriteItems[item.id]) ? true : false;
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

        items[index] = item
    }))


    if (items.length !== 0) {
        let anchorItem = items.pop();

        if (items[items.length - 1]) {
            lastItemStamp = anchorItem.timestamp
        } else {
            items = [anchorItem]
            lastItemStamp = null
        }
    }


    response = {
        status: 'success',
        message: 'Items loaded',
        data: items,
        variable: lastItemStamp
    }

    return response;

}

let getUserItemsByUid = async function (data) {

    let response = new Object();
    let categoriesRef = firebase.database().ref('/categories');
    let usersRef = firebase.database().ref('/userProfiles');
    let itemsRef = firebase.database().ref('/items')
    let usersLikesRefs = firebase.database().ref(`/usersLikesRefs`)
    let usersFavoritesRefs = firebase.database().ref(`/usersFavoritesRefs`)
    let usersItemsRefs = firebase.database().ref('/usersItemsRefs')


    let user = (await usersRef.child(data.uid).once("value")).val()
    let poster = (await usersRef.child(data.posterId).once("value")).val()

    let userItemsRef = usersItemsRefs
        .child(poster.itemsRefKey)
        .orderByChild('timestamp')
        .startAt((data.lastItemStamp) ? parseInt(data.lastItemStamp) : null)
        .limitToFirst(data.pageSize)

    let lastItemStamp

    let items = [];
    let itemIds = [];

    let itemsSnap = await userItemsRef.once("value");

    itemsSnap.forEach(function (snap) {
        if (snap.exists()) {
            let itemId = snap.key;
            itemIds.push(itemId);
        }
    })

    await Promise.all(itemIds.map(async function (itemId, index) {
        let itemSnap = await itemsRef.child(itemId).once("value");
        let item = await itemSnap.val();

        let categories = item.categories


        item.postedby = poster;

        // let userSnap = await usersRef.child(data.uid).once("value");
        // let user = userSnap.val();

        // item.postedby = user;

        let userLikedItemsSnap = await usersLikesRefs.child(user.likesRefKey).once("value")

        if (userLikedItemsSnap.exists()) {
            let userLikedItems = userLikedItemsSnap.val();
            item.liked = (userLikedItems[item.id]) ? true : false;
        } else {
            item.liked = false;
        }

        let userFavoriteItemsSnap = await usersFavoritesRefs.child(user.favoritesRefKey).once("value")

        if (userFavoriteItemsSnap.exists()) {
            let userFavoriteItems = userFavoriteItemsSnap.val();
            item.favorited = (userFavoriteItems[item.id]) ? true : false;
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

        items[index] = item

    }))

    // await Promise.all(items.map(async function (item) {
    //     let categories = item.categories


    //     item.postedby = poster;

    //     let userSnap = await usersRef.child(data.uid).once("value");
    //     let user = userSnap.val();

    //     // item.postedby = user;

    //     let userLikedItemsSnap = await usersLikesRefs.child(user.likesRefKey).once("value")

    //     if (userLikedItemsSnap.exists()) {
    //         let userLikedItems = userLikedItemsSnap.val();
    //         item.liked = (userLikedItems[item.id]) ? true : false;
    //     } else {
    //         item.liked = false;
    //     }

    //     let userFavoriteItemsSnap = await usersFavoritesRefs.child(user.favoritesRefKey).once("value")

    //     if (userFavoriteItemsSnap.exists()) {
    //         let userFavoriteItems = userFavoriteItemsSnap.val();
    //         item.favorited = (userFavoriteItems[item.id]) ? true : false;
    //     } else {
    //         item.favorited = false;
    //     }



    //     await Promise.all(categories.map(async function (categoryId, index) {

    //         let categoriesSnap = await categoriesRef.once("value");
    //         let fullCategories = categoriesSnap.val();

    //         categories[index] = fullCategories.find(category =>
    //             category.id == categoryId
    //         )

    //     }))
    // }))


    if (items.length !== 0) {
        let anchorItem = items.pop();

        if (items[items.length - 1]) {
            lastItemStamp = anchorItem.timestamp
        } else {
            items = [anchorItem]
            lastItemStamp = null
        }
    }

    response = {
        status: 'success',
        message: 'Items loaded',
        data: items,
        variable: lastItemStamp
    }

    return response;

}

let getItemsByFilters = async function (data) {
    let response = new Object();
    let categoriesRef = firebase.database().ref('/categories');
    let usersRef = firebase.database().ref('/userProfiles');
    let usersLikesRefs = firebase.database().ref(`/usersLikesRefs`)
    let usersFavoritesRefs = firebase.database().ref(`/usersFavoritesRefs`)


    let itemsRef = firebase
        .database()
        .ref('/items')
        .orderByChild('timestamp')
        .startAt((data.lastItemStamp) ? parseInt(data.lastItemStamp) : null)
        .limitToFirst(data.pageSize)

    let filteredItems = [];
    let items = [];
    let lastItemStamp


    let itemsSnap = await itemsRef.once("value");

    itemsSnap.forEach(function (snap) {
        let item = snap.val();

        // FILTER BY CATEGORIES 
        if (!utilities.isEmpty(data.categories)) {
            for (let i = 0; i < item.categories.length; i++) {
                let category = item.categories[i];
                if (data.categories[category] && !item.swapped) {
                    filteredItems.push(item);
                    items.push(item);
                    break;
                }
            }
        } else {
            if (!item.swapped) {
                filteredItems.push(item);
                items.push(item);
            }
        }

        // FILTER BY LOCATION 
        if (data.filterByLocation &&
            (data.location.latitude &&
                data.location.longitude)) {
            filteredItems = utilities.applyHaversine(
                filteredItems,
                data.location.latitude,
                data.location.longitude
            );

            filteredItems.sort((locationA, locationB) => {
                return locationA.distance - locationB.distance;
            });
        }

        // FILTER BY PRICE 
        if (data.filterByPrice) {
            filteredItems = filteredItems.sort((a, b) => {
                return a.price > b.price
            })
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

        let userLikedItemsSnap = await usersLikesRefs.child(user.likesRefKey).once("value")

        if (userLikedItemsSnap.exists()) {
            let userLikedItems = userLikedItemsSnap.val();
            filteredItem.liked = (userLikedItems[filteredItem.id]) ? true : false;
        } else {
            filteredItem.liked = false;
        }

        let userFavoriteItemsSnap = await usersFavoritesRefs.child(user.favoritesRefKey).once("value")

        if (userFavoriteItemsSnap.exists()) {
            let userFavoriteItems = userFavoriteItemsSnap.val();
            filteredItem.favorited = (userFavoriteItems[filteredItem.id]) ? true : false;
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


    if (items.length !== 0) {
        let anchorItem = items.pop();
        let anchorId = anchorItem.id;


        if (items[items.length - 1]) {
            filteredItems = filteredItems.filter(item => item.id !== anchorId)
            lastItemStamp = anchorItem.timestamp
        } else {
            lastItemStamp = null
        }
    }

    response = {
        status: 'success',
        message: 'Items loaded',
        data: filteredItems,
        variable: lastItemStamp
    }

    return response;
}

let getFavoriteItems = async function (data) {

    let response = new Object();
    let categoriesRef = firebase.database().ref('/categories');
    let usersRef = firebase.database().ref('/userProfiles');
    let itemsRef = firebase.database().ref('/items');
    let usersLikesRefs = firebase.database().ref(`/usersLikesRefs`)
    let usersFavoritesRefs = firebase.database().ref(`/usersFavoritesRefs`)

    let user = (await usersRef.child(data.uid).once("value")).val()
    let lastItemStamp

    let usersFavoritesRef = usersFavoritesRefs
        .child(user.favoritesRefKey)
        .orderByChild('timestamp')
        .startAt((data.lastItemStamp) ? parseInt(data.lastItemStamp) : null)
        .limitToFirst(data.pageSize)

    let filteredItems = [];
    let filteredItemIds = []

    let itemsSnap = await usersFavoritesRef.once("value");
    // let userSnap = await usersRef.child(data.uid).once("value");
    // let user = userSnap.val();


    itemsSnap.forEach(function (snap) {
        if (snap.exists()) {
            let itemId = snap.key;
            filteredItemIds.push(itemId)
        }
    })

    await Promise.all(filteredItemIds.map(async function (filteredItemId, index) {
        let itemSnap = await itemsRef.child(filteredItemId).once("value");
        let filteredItem = await itemSnap.val();

        let categories = filteredItem.categories
        let postedby = filteredItem.postedby


        let posterSnap = await usersRef.child(postedby).once("value");
        let poster = posterSnap.val();

        filteredItem.postedby = poster;

        // let userSnap = await usersRef.child(data.uid).once("value");
        // let user = userSnap.val();

        let userLikedItemsSnap = await usersLikesRefs.child(user.likesRefKey).once("value")

        if (userLikedItemsSnap.exists()) {
            let userLikedItems = userLikedItemsSnap.val();
            filteredItem.liked = (userLikedItems[filteredItem.id]) ? true : false;
        } else {
            filteredItem.liked = false;
        }

        let userFavoriteItemsSnap = await usersFavoritesRefs.child(user.favoritesRefKey).once("value")

        if (userFavoriteItemsSnap.exists()) {
            let userFavoriteItems = userFavoriteItemsSnap.val();
            filteredItem.favorited = (userFavoriteItems[filteredItem.id]) ? true : false;
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

        filteredItems[index] = filteredItem
    }))


    if (filteredItems.length !== 0) {
        let anchorItem = filteredItems.pop();

        if (filteredItems[filteredItems.length - 1]) {
            lastItemStamp = anchorItem.timestamp
        } else {
            filteredItems = [anchorItem]
            lastItemStamp = null
        }
    }


    response = {
        status: 'success',
        message: 'Items loaded',
        data: filteredItems,
        variable: lastItemStamp
    }

    return response;

}

let likeItem = function (data) {
    return new Promise(async function (resolve, reject) {
        let response = new Object;
        let usersRef = firebase.database().ref('/userProfiles');
        let itemsRef = firebase.database().ref('/items');
        var likesRef = itemsRef.child(data.itemId).child('likes');
        // var postedbyRef = itemsRef.child(data.itemId).child('postedby');
        let item = (await itemsRef.child(data.itemId).once("value")).val();


        let user = (await usersRef.child(data.uid).once("value")).val()
        let userLikesRef = firebase.database().ref('/usersLikesRefs').child(user.likesRefKey)




        await userLikesRef.child(data.itemId)
            .set({ "timestamp": item.timestamp })

        await likesRef.transaction(function (likes) {
            likes = (likes) ? (likes + 1) : 1
            return likes;
        })

        // let itemRef = itemsRef.child(data.itemId);
        // let itemSnap = await itemRef.once("value");


        // let item = itemSnap.val();
        let postedbyId = item.postedby
        let itemLikersRefKey = item.itemLikersRefKey

        var likedbyRef = firebase.database().ref(`/itemsLikersRefs`).child(itemLikersRefKey)


        await usersRef.child(postedbyId).child('likes').transaction(function (likes) {
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
        // var likedbyRef = itemsRef.child(data.itemId).child('likedby');

        let user = (await usersRef.child(data.uid).once("value")).val()
        let userLikesRef = firebase.database().ref('/usersLikesRefs').child(user.likesRefKey)

        await userLikesRef.child(data.itemId).remove()

        await likesRef.transaction(function (likes) {
            likes = (likes) ? (likes - 1) : 0;
            return likes;
        })

        let itemRef = itemsRef.child(data.itemId);
        let itemSnap = await itemRef.once("value");

        let item = itemSnap.val();
        let postedbyId = item.postedby
        let itemLikersRefKey = item.itemLikersRefKey

        var likedbyRef = firebase.database().ref(`/itemsLikersRefs`).child(itemLikersRefKey)

        await usersRef.child(postedbyId).child('likes').transaction(function (likes) {
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
        let itemsRef = firebase.database().ref('/items');

        let item = (await itemsRef.child(data.itemId).once("value")).val();


        let user = (await usersRef.child(data.uid).once("value")).val()
        let userFavoritesRef = firebase.database().ref('/usersFavoritesRefs').child(user.favoritesRefKey)

        await userFavoritesRef.child(data.itemId)
            .set({
                "timestamp": item.timestamp
            })


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

        let user = (await usersRef.child(data.uid).once("value")).val()
        let userFavoritesRef = firebase.database().ref('/usersFavoritesRefs').child(user.favoritesRefKey)

        await userFavoritesRef.child(data.itemId).remove()

        response = {
            status: 'success',
            message: 'Item unfavorited Successfully',
            data: null
        }
        resolve(response);

    })
}

let deleteItem = function (data) {
    return new Promise(async function (resolve, reject) {
        let response = new Object;
        let itemsRef = firebase.database().ref('/items');
        let usersRef = firebase.database().ref('/userProfiles');

        let swapsRef = firebase.database().ref('/swaps');


        await itemsRef.child(data.itemId).remove()
        await swapsRef.orderByChild('itemId').equalTo(data.itemId).once('value', async function (snap) {
            snap.forEach(async function (swapSnap) {
                let swap = swapSnap.val()
                let swapKey = swapSnap.key
                await swapsRef.child(swapKey).remove();
                await usersRef.child(swap.offeredby).child('swaps').child(swapKey).remove();
            })

        })


        response = {
            status: 'success',
            message: 'Item Deleted Successfully',
            data: null
        }
        resolve(response);
    })
}

let sendOffer = function (data) {
    return new Promise(async function (resolve, reject) {
        let response = new Object;
        let itemsRef = firebase.database().ref('/items');
        let usersRef = firebase.database().ref('/userProfiles');
        let itemsOffersRefs = firebase.database().ref(`/itemsOffersRefs`)
        let usersSwapsRefs = firebase.database().ref(`/usersSwapsRefs`)


        let swapsRef = firebase.database().ref('/swaps');

        let offer = {
            itemId: data.itemId,
            offerItemIds: data.offerItemIds,
            offeredby: data.offeredby,
            postedby: data.postedby,
            offered: new Date().toISOString(),
            accepted: false,
            completed: false,
            swapped: false,
            timestamp: firebase.database.ServerValue.TIMESTAMP
        }

        let item = await (await itemsRef.child(data.itemId).once("value")).val();
        // let itemsOffersRefKey = itemsOffersRefs.child(item.itemOffersRefKey)

        let itemOfferKey = await itemsOffersRefs.child(item.itemOffersRefKey).push().getKey();
        offer.offerId = itemOfferKey
        let swapKey = await swapsRef.push().getKey();
        offer.swapId = swapKey


        await itemsOffersRefs.child(item.itemOffersRefKey).child(itemOfferKey).set(offer);
        let itemOfferRef = itemsOffersRefs.child(item.itemOffersRefKey).child(itemOfferKey);

        await itemOfferRef.once('value').then(function (snap) {
            timestamp = snap.val().timestamp * -1
            itemOfferRef.update({ timestamp })
        })


        await swapsRef.child(swapKey).set(offer);
        let swapRef = swapsRef.child(swapKey);

        await swapRef.once('value').then(async function (snap) {
            timestamp = snap.val().timestamp * -1
            swapRef.update({ timestamp })

            let offerer = (await usersRef.child(data.offeredby).once("value")).val();

            await usersSwapsRefs.child(offerer.swapsRefKey).child(swapKey).set({
                id: swapKey,
                timestamp: timestamp
            })
        })


        // let offerer = (await usersRef.child(data.offeredby).once("value")).val();

        // await usersSwapsRefs.child(offerer.swapsRefKey).child(swapKey).set({
        //     id: swapKey,
        //     timestamp: firebase.database.ServerValue.TIMESTAMP
        // })
        // let userSwapRef = usersSwapsRefs.child(offerer.swapsRefKey).child(swapKey)

        // await userSwapRef.once('value').then(function (snap) {
        //     timestamp = snap.val().timestamp * -1
        //     userSwapRef.update({ timestamp })
        // })


        response = {
            status: 'success',
            message: 'Offer Sent Successfully',
            data: null
        }
        resolve(response);


    })
}

let getItemOffers = function (data) {
    return new Promise(async function (resolve, reject) {
        let response = new Object;
        let itemsRef = firebase.database().ref('/items');
        let usersRef = firebase.database().ref('/userProfiles');
        let itemsOffersRefs = firebase.database().ref(`/itemsOffersRefs`)

        let item = (await itemsRef.child(data.itemId).once("value")).val()
        let lastOfferStamp


        let offersRef = itemsOffersRefs
            .child(item.itemOffersRefKey)
            .orderByChild('timestamp')
            .startAt((data.lastOfferStamp) ? parseInt(data.lastOfferStamp) : null)
            .limitToFirst(data.pageSize)

        // let offersRef = itemsRef.child(data.itemId).child('offers').orderByChild('timestamp');

        let offers = []

        let offersSnap = await offersRef.once('value')

        offersSnap.forEach(function (snap) {
            if (snap.exists()) {
                let offer = snap.val();
                offers.push(offer);
            }
        })



        await Promise.all(offers.map(async function (offer) {
            let offerItemIds = offer.offerItemIds
            let offeredby = offer.offeredby
            let postedby = offer.postedby
            let items = []

            await Promise.all(offerItemIds.map(async function (offerItemId) {
                let data = {
                    itemId: offerItemId.id,
                    uid: postedby,
                    includePoster: true
                }


                var response = await getItemByIndex(data);
                if (response.status == 'success') {
                    items.push(response.data)
                } else {
                    response = {
                        status: 'error',
                        message: 'Could not Load Offers',
                        data: null
                    }

                    reject(response);
                }

            }))

            offer.items = items


            let offererSnap = await usersRef.child(offeredby).once("value");
            let offerer = offererSnap.val();

            offer.offeredby = offerer;

        }))

        if (offers.length !== 0) {
            let anchorOffer = offers.pop();

            if (offers[offers.length - 1]) {
                lastOfferStamp = anchorOffer.timestamp
            } else {
                offers = [anchorOffer]
                lastOfferStamp = null
            }
        }

        response = {
            status: 'success',
            message: 'Offers Loaded',
            data: offers,
            variable: lastOfferStamp
        }
        resolve(response);
    })
}

let acceptOffer = function (data) {
    return new Promise(async function (resolve, reject) {
        let response = new Object;
        let itemsRef = firebase.database().ref('/items');
        let itemsOffersRefs = firebase.database().ref(`/itemsOffersRefs`)


        let item = (await itemsRef.child(data.itemId).once("value")).val();

        let offersRef = itemsOffersRefs.child(item.itemOffersRefKey)

        let swapsRef = firebase.database().ref('/swaps');


        let offerSnap = await offersRef.child(data.offerId).once("value");
        let offer = await offerSnap.val();

        if (offer) {
            await offersRef.child(data.offerId).update({ accepted: true });
            await swapsRef.child(data.swapId).update({ accepted: true });


            response = {
                status: 'success',
                message: 'Offer Accepted Successfully',
                data: null
            }

        } else {
            response = {
                status: 'error',
                message: 'Offer has been removed',
                data: null
            }
        }

        resolve(response);


    })
}

let declineOffer = function (data) {
    return new Promise(async function (resolve, reject) {
        let response = new Object;
        let itemsRef = firebase.database().ref('/items');
        let itemsOffersRefs = firebase.database().ref(`/itemsOffersRefs`)

        let item = (await itemsRef.child(data.itemId).once("value")).val();

        let offersRef = itemsOffersRefs.child(item.itemOffersRefKey)

        let swapsRef = firebase.database().ref('/swaps');

        await offersRef.child(data.offerId).remove();
        await swapsRef.child(data.swapId).remove();

        response = {
            status: 'success',
            message: 'Offer Declined',
            data: null
        }

        resolve(response);

    })
}

let markItemAsSwapped = function (data) {
    return new Promise(async function (resolve, reject) {
        let response = new Object;
        let itemsRef = firebase.database().ref('/items');
        let usersRef = firebase.database().ref('/userProfiles');
        let itemsOffersRefs = firebase.database().ref(`/itemsOffersRefs`)

        let item = (await itemsRef.child(data.id).once("value")).val();

        let offersRef = itemsOffersRefs.child(item.itemOffersRefKey)

        let swapsRef = firebase.database().ref('/swaps');

        let itemRef = itemsRef.child(data.id);
        await itemRef.update({ swapped: true });

        // let itemSnap = await itemRef.once("value");

        // let item = itemSnap.val();
        let postedbyId = item.postedby

        await usersRef.child(postedbyId).child('swapsCompleted').transaction(function (swapsCompleted) {
            swapsCompleted = (swapsCompleted) ? (swapsCompleted + 1) : 1
            return swapsCompleted;
        })


        let offersSnap = await offersRef.once("value");

        if (offersSnap) {

            offersSnap.forEach(async function (snap) {
                let offer = snap.val();
                let offerId = snap.key;
                let swapId = offer.swapId;

                if (offer.accepted) {
                    await offersRef.child(offerId).update({
                        completed: true,
                        swapped: new Date().toISOString()
                    });
                    await swapsRef.child(swapId).update({
                        completed: true,
                        swapped: new Date().toISOString()
                    });
                } else {
                    await offersRef.child(offerId).remove();
                    await swapsRef.child(swapId).remove();
                }
            })

        }



        response = {
            status: 'success',
            message: 'Item Marked as Swapped',
            data: null
        }

        resolve(response);

    })
}

let getAllSwaps = async function (data) {

    let response = new Object();
    let categoriesRef = firebase.database().ref('/categories');
    let swapsRef = firebase.database().ref('/swaps')
    let usersRef = firebase.database().ref('/userProfiles');
    let usersSwapsRefs = firebase.database().ref(`/usersSwapsRefs`)
    let usersLikesRefs = firebase.database().ref(`/usersLikesRefs`)
    let usersFavoritesRefs = firebase.database().ref(`/usersFavoritesRefs`)


    let user = (await usersRef.child(data.uid).once("value")).val()
    let lastSwapStamp

    let userSwapsRef = usersSwapsRefs
        .child(user.swapsRefKey)
        .orderByChild('timestamp')
        .startAt((data.lastSwapStamp) ? parseInt(data.lastSwapStamp) : null)
        .limitToFirst(data.pageSize)

    let swaps = [];
    let swapIds = [];

    let swapsSnap = await userSwapsRef.once("value");

    swapsSnap.forEach(function (snap) {
        if (snap.exists()) {
            let swapId = snap.key;
            swapIds.push(swapId);
        }
    })


    await Promise.all(swapIds.map(async function (swapId, index) {
        let swapSnap = await swapsRef.child(swapId).once("value");
        let swap = await swapSnap.val();

        let postedby = swap.postedby
        let offeredby = swap.offeredby

        let posterSnap = await usersRef.child(postedby).once("value");
        let poster = posterSnap.val();

        let offererSnap = await usersRef.child(offeredby).once("value");
        let offerer = offererSnap.val();

        swap.postedby = poster;
        swap.offeredby = offerer

        // let userSnap = await usersRef.child(data.uid).once("value");
        // let user = userSnap.val();

        let itemId = swap.itemId;
        let itemSnap = await firebase.database().ref('/items').child(itemId).once('value');
        let item = itemSnap.val();

        swap.item = item

        let offerItemIds = swap.offerItemIds
        let offerItems = []

        // item.postedby = user;

        let userLikedItemsSnap = await usersLikesRefs.child(user.likesRefKey).once("value")

        if (userLikedItemsSnap.exists()) {
            let userLikedItems = userLikedItemsSnap.val();
            swap.item.liked = (userLikedItems[swap.item.id]) ? true : false;
        } else {
            swap.item.liked = false;
        }

        let userFavoriteItemsSnap = await usersFavoritesRefs.child(user.favoritesRefKey).once("value")

        if (userFavoriteItemsSnap.exists()) {
            let userFavoriteItems = userFavoriteItemsSnap.val();
            swap.item.favorited = (userFavoriteItems[swap.item.id]) ? true : false;
        } else {
            swap.item.favorited = false;
        }

        await Promise.all(offerItemIds.map(async function (offerItemId, index) {

            let offerItemSnap = await firebase.database().ref('/items').child(offerItemId.id).once('value');
            let offerItem = offerItemSnap.val();

            let offerItemCategories = offerItem.categories

            await Promise.all(offerItemCategories.map(async function (categoryId, index) {

                let categoriesSnap = await categoriesRef.once("value");
                let fullCategories = categoriesSnap.val();

                offerItemCategories[index] = fullCategories.find(category =>
                    category.id == categoryId
                )

            }))

            offerItems.push(offerItem)

        }))

        let categories = swap.item.categories


        await Promise.all(categories.map(async function (categoryId, index) {

            let categoriesSnap = await categoriesRef.once("value");
            let fullCategories = categoriesSnap.val();

            categories[index] = fullCategories.find(category =>
                category.id == categoryId
            )

        }))

        swap.offerItems = offerItems;

        swaps[index] = swap
    }))

    if (swaps.length !== 0) {
        let anchorSwap = swaps.pop();

        if (swaps[swaps.length - 1]) {
            lastSwapStamp = anchorSwap.timestamp
        } else {
            swaps = [anchorSwap]
            lastSwapStamp = null
        }
    }

    response = {
        status: 'success',
        message: 'Items loaded',
        data: swaps,
        variable: lastSwapStamp
    }

    return response;

}

let withdrawOffer = async function (data) {

    let response = new Object();
    let swapsRef = firebase.database().ref('/swaps')
    let usersRef = firebase.database().ref('/userProfiles');
    let itemsRef = firebase.database().ref('/items')
    let itemsOffersRefs = firebase.database().ref(`/itemsOffersRefs`)
    let usersSwapsRefs = firebase.database().ref(`/usersSwapsRefs`)


    let item = (await itemsRef.child(data.itemId).once("value")).val();

    let itemOfferRef = itemsOffersRefs
        .child(item.itemOffersRefKey)
        .child(data.offerId)


    let swapRef = swapsRef.child(data.swapId)

    let itemOfferSnap = await itemOfferRef.once("value")
    let itemOffer = await itemOfferSnap.val();

    let offeredby = (await usersRef.child(itemOffer.offeredby).once("value")).val()

    let userSwapRef = usersSwapsRefs
        .child(offeredby.swapsRefKey)
        .child(data.swapId)


    await itemOfferRef.remove();
    await swapRef.remove();
    await userSwapRef.remove();

    response = {
        status: 'success',
        message: 'Offer Withdrawn',
        data: null
    }

    return response;

}

let rateSwap = async function (data) {

    let response = new Object();
    let swapsRef = firebase.database().ref('/swaps')
    let usersRef = firebase.database().ref('/userProfiles');
    let itemsRef = firebase.database().ref('/items')

    let rating = data.rating;


    let swapSnap = await swapsRef.child(data.id).once("value");
    let swap = await swapSnap.val();

    swap.rating = rating


    await swapsRef.child(data.id).set(swap);

    let userSnap = await usersRef.child(data.uid).once("value")



    let user = await userSnap.val();
    let rateTable = user.rateTable;

    await Promise.all(rateTable.map(rateObj => {

        if (rateObj.rating == data.rating) {
            rateObj.count++;
        }

    }))


    user.rateTable = rateTable

    usersRef.child(data.uid).set(user)

    await usersRef.child(data.uid).child('rating').transaction(function (rating) {

        let totalWeight = 0;
        let totalCount = 0;

        Promise.all(rateTable.map(rateObj => {
            totalWeight += rateObj.rating * rateObj.count;
            totalCount += rateObj.count
        }))

        rating = parseInt((totalWeight / totalCount).toFixed(1))
        return rating;
    })

    response = {
        status: 'success',
        message: 'Swap Rated',
        data: null
    }

    return response;

}


module.exports = {
    uploadItem,
    editItem,
    getItems,
    getItemByIndex,
    getItemsByCategory,
    getItemsBySearch,
    getItemsByFilters,
    getFavoriteItems,
    likeItem,
    favoriteItem,
    unlikeItem,
    unfavoriteItem,
    deleteItem,
    getItemsByPrice,
    getItemsByUid,
    getUserItemsByUid,
    sendOffer,
    acceptOffer,
    declineOffer,
    getItemOffers,
    getAllSwaps,
    markItemAsSwapped,
    withdrawOffer,
    rateSwap
}