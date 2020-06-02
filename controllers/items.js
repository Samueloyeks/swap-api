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

let editItem = function (data) {
    return new Promise(async function (resolve, reject) {
        let itemModel = require('../models/itemModel');
        itemModel = itemModel.item;

        let itemId, title, description, quantity, price, categories, images, preferences
        try {

            itemId = data.id
            title = data.title;
            description = data.description;
            quantity = data.quantity;
            price = parseInt(data.price);
            categories = data.categories;
            images = data.images;
            preferences = data.preferences;
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

        if (user.likedItems) {
            item.liked = (user.likedItems[data.itemId]) ? true : false;
        } else {
            item.liked = false;
        }

        if (user.favoriteItems) {
            item.favorited = (user.favoriteItems[data.itemId]) ? true : false;
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

let getItemsByUid = async function (data) {

    let response = new Object();
    let categoriesRef = firebase.database().ref('/categories');
    let usersRef = firebase.database().ref('/userProfiles');
    let itemsRef = firebase.database().ref('/items').orderByChild('timestamp')
    let items = [];

    let itemsSnap = await itemsRef.once("value");

    itemsSnap.forEach(function (snap) {
        let item = snap.val();
        if (item.postedby == data.uid) {
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

        // item.postedby = user;

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

let getUserItemsByUid = async function (data) {

    let response = new Object();
    let categoriesRef = firebase.database().ref('/categories');
    let usersRef = firebase.database().ref('/userProfiles');
    let itemsRef = firebase.database().ref('/items').orderByChild('timestamp')
    let items = [];

    let itemsSnap = await itemsRef.once("value");

    itemsSnap.forEach(function (snap) {
        let item = snap.val();
        if ((item.postedby == data.posterId) && !item.swapped) {
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

        // item.postedby = user;

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

let getItemsByFilters = async function (data) {
    let response = new Object();
    let categoriesRef = firebase.database().ref('/categories');
    let usersRef = firebase.database().ref('/userProfiles');
    let itemsRef = firebase.database().ref('/items').orderByChild('timestamp');
    let filteredItems = [];

    let itemsSnap = await itemsRef.once("value");

    itemsSnap.forEach(function (snap) {
        let item = snap.val();

        // FILTER BY CATEGORIES 
        if (!utilities.isEmpty(data.categories)) {
            for (let i = 0; i < item.categories.length; i++) {
                let category = item.categories[i];
                if (data.categories[category] && !item.swapped) {
                    filteredItems.push(item);
                    break;
                }
            }
        } else {
            if (!item.swapped) {
                filteredItems.push(item);
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

let getFavoriteItems = async function (data) {
    
    let response = new Object();
    let categoriesRef = firebase.database().ref('/categories');
    let usersRef = firebase.database().ref('/userProfiles');
    let itemsRef = firebase.database().ref('/items').orderByChild('timestamp');
    let filteredItems = [];

    let itemsSnap = await itemsRef.once("value");
    let userSnap = await usersRef.child(data.uid).once("value");
    let user = userSnap.val();


    itemsSnap.forEach(function (snap) {
        let item = snap.val();

        if (user.favoriteItems && (user.favoriteItems[item.id])) {
            filteredItems.push(item)
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

let likeItem = function (data) {
    return new Promise(async function (resolve, reject) {
        let response = new Object;
        let usersRef = firebase.database().ref('/userProfiles');
        let itemsRef = firebase.database().ref('/items');
        var likesRef = itemsRef.child(data.itemId).child('likes');
        var likedbyRef = itemsRef.child(data.itemId).child('likedby');
        // var postedbyRef = itemsRef.child(data.itemId).child('postedby');



        await usersRef.child(data.uid).child('likedItems').child(data.itemId)
            .set({ "liked": firebase.database.ServerValue.TIMESTAMP })

        await likesRef.transaction(function (likes) {
            likes = (likes) ? (likes + 1) : 1
            return likes;
        })

        let itemRef = itemsRef.child(data.itemId);
        let itemSnap = await itemRef.once("value");

        let item = itemSnap.val();
        let postedbyId = item.postedby

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
        var likedbyRef = itemsRef.child(data.itemId).child('likedby');


        await usersRef.child(data.uid).child('likedItems').child(data.itemId).remove()

        await likesRef.transaction(function (likes) {
            likes = (likes) ? (likes - 1) : 0;
            return likes;
        })

        let itemRef = itemsRef.child(data.itemId);
        let itemSnap = await itemRef.once("value");

        let item = itemSnap.val();
        let postedbyId = item.postedby

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


        let itemOfferKey = await itemsRef.child(data.itemId).child('offers').push().getKey();
        offer.offerId = itemOfferKey
        let swapKey = await swapsRef.push().getKey();
        offer.swapId = swapKey


        await itemsRef.child(data.itemId).child('offers').child(itemOfferKey).set(offer);
        let itemOfferRef = itemsRef.child(data.itemId).child('offers').child(itemOfferKey);

        await itemOfferRef.once('value').then(function (snap) {
            timestamp = snap.val().timestamp * -1
            itemOfferRef.update({ timestamp })
        })


        await swapsRef.child(swapKey).set(offer);
        let swapRef = swapsRef.child(swapKey);

        await swapRef.once('value').then(function (snap) {
            timestamp = snap.val().timestamp * -1
            swapRef.update({ timestamp })
        })


        await usersRef.child(data.offeredby).child('swaps').child(swapKey).set({
            id: swapKey,
            timestamp: firebase.database.ServerValue.TIMESTAMP
        })
        let userSwapRef = usersRef.child(data.offeredby).child('swaps').child(swapKey)

        await userSwapRef.once('value').then(function (snap) {
            timestamp = snap.val().timestamp * -1
            userSwapRef.update({ timestamp })
        })


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
        let offersRef = itemsRef.child(data.itemId).child('offers').orderByChild('timestamp');

        let offers = []

        let offersSnap = await offersRef.once('value')

        offersSnap.forEach(function (snap) {
            let offer = snap.val();
            offers.push(offer);
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

        response = {
            status: 'success',
            message: 'Offers Loaded',
            data: offers
        }
        resolve(response);
    })
}

let acceptOffer = function (data) {
    return new Promise(async function (resolve, reject) {
        let response = new Object;
        let itemsRef = firebase.database().ref('/items');
        let offersRef = itemsRef
            .child(data.itemId).child('offers')
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
        let offersRef = itemsRef
            .child(data.itemId).child('offers')
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
        let offersRef = itemsRef
            .child(data.id).child('offers')
        let swapsRef = firebase.database().ref('/swaps');

        let itemRef = itemsRef.child(data.id);
        await itemRef.update({ swapped: true });

        let itemSnap = await itemRef.once("value");

        let item = itemSnap.val();
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
    let swapsRef = firebase.database().ref('/swaps').orderByChild('timestamp')
    let usersRef = firebase.database().ref('/userProfiles');
    let itemsRef = firebase.database().ref('/items').orderByChild('timestamp')
    let swaps = [];

    let swapsSnap = await swapsRef.once("value");

    swapsSnap.forEach(function (snap) {
        let swap = snap.val();
        if (swap.offeredby == data.uid || swap.postedby == data.uid) {
            swaps.push(swap);
        }
    })

    await Promise.all(swaps.map(async function (swap) {
        let postedby = swap.postedby
        let offeredby = swap.offeredby

        let posterSnap = await usersRef.child(postedby).once("value");
        let poster = posterSnap.val();

        let offererSnap = await usersRef.child(offeredby).once("value");
        let offerer = offererSnap.val();

        swap.postedby = poster;
        swap.offeredby = offerer

        let userSnap = await usersRef.child(data.uid).once("value");
        let user = userSnap.val();

        let itemId = swap.itemId;
        let itemSnap = await firebase.database().ref('/items').child(itemId).once('value');
        let item = itemSnap.val();

        swap.item = item

        let offerItemIds = swap.offerItemIds
        let offerItems = []

        // item.postedby = user;

        if (user.likedItems) {
            swap.item.liked = (user.likedItems[swap.item.id]) ? true : false;
        } else {
            swap.item.liked = false;
        }

        if (user.favoriteItems) {
            swap.item.favorited = (user.favoriteItems[swap.item.id]) ? true : false;
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

    }))


    response = {
        status: 'success',
        message: 'Items loaded',
        data: swaps
    }

    return response;

}

let withdrawOffer = async function (data) {

    let response = new Object();
    let swapsRef = firebase.database().ref('/swaps')
    let usersRef = firebase.database().ref('/userProfiles');
    let itemsRef = firebase.database().ref('/items')

    let itemOfferRef = itemsRef.child(data.itemId)
        .child('offers')
        .child(data.offerId)


    let swapRef = swapsRef.child(data.swapId)

    let itemOfferSnap = await itemOfferRef.once("value")
    let itemOffer = await itemOfferSnap.val();

    let offeredby = itemOffer.offeredby;

    let userSwapRef = usersRef
        .child(offeredby)
        .child('swaps')
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