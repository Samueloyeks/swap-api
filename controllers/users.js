let utilities = require('../controllers/utilities');
require("../models/firebase");
let firebase = utilities.firebase;
let services = require('../controllers/services')

/// modules

let register = function (data) {
    return new Promise(async function (resolve, reject) {
        let userModel = require('../models/userModel');
        userModel = userModel.user;
        let response = new Object();
        let rateTable = [
            { rating: 5, count: 0 },
            { rating: 4, count: 0 },
            { rating: 3, count: 0 },
            { rating: 2, count: 0 },
            { rating: 1, count: 0 },
        ]
        try {

            userModel.fullName = data.fullName;
            userModel.username = data.username;
            userModel.usernameLower = data.username.toLowerCase()
            userModel.password = data.password;
            userModel.email = data.email;
            userModel.phoneNumber = data.phoneNumber;
            userModel.profilePicture = data.profilePicture
            userModel.fcmToken = data.fcmToken
            userModel.deviceType = data.deviceType
            userModel.likes = 0
            userModel.rating = 0
            userModel.rateTable = rateTable
            userModel.swapsCompleted = 0
            userModel.reports = 0



        } catch (ex) {
            console.log(ex)
            console.log('validation failed')
            // data validation failed
        }

        //set account status
        if (userModel.status == 'admin') {
            userModel.status = 'pending';
        } else {
            userModel.status = 'active';
        }

        let itemsRefKey = await firebase.database().ref(`/usersItemsRefs`).push().getKey();
        let likesRefKey = await firebase.database().ref(`/usersLikesRefs`).push().getKey();
        let favoritesRefKey = await firebase.database().ref(`/usersFavoritesRefs`).push().getKey();
        let swapsRefKey = await firebase.database().ref(`/usersSwapsRefs`).push().getKey();


        userModel.itemsRefKey = itemsRefKey
        userModel.likesRefKey = likesRefKey
        userModel.favoritesRefKey = favoritesRefKey
        userModel.swapsRefKey = swapsRefKey



        //
        firebase.auth().createUserWithEmailAndPassword(userModel.email, userModel.password)
            .then(function (result) {
                userModel.uid = result.user.uid,
                    userModel.lastSeen = Date(result.user.lastLoginAt),
                    userModel.dateCreated = Date(result.user.createdAt),
                    userModel.verified = result.user.emailVerified

                delete userModel['password'];

                firebase.database().ref(`/userProfiles/${result.user.uid}`).set(userModel).then(() => {
                    console.log('saved to firebase')
                    firebase.auth().currentUser.sendEmailVerification();
                    console.log('email sent')
                });


                response = {
                    status: 'success',
                    message: 'Registration Successful',
                    data: userModel
                }

                resolve(response);

                // var database = firebase.database();
                //firebase.database().ref('users/' + userModel.email).set(userModel);
            })
            .catch(function (error) {
                // Handle Errors here. 
                var message = "";
                var errorCode = error.code;
                var errorMessage = error.message;

                response = {
                    'status': 'error',
                    'message': error.message,
                    'data': data
                }
                reject(response);
            });


    });

}

let login = function (data) {
    return new Promise(function (resolve, reject) {
        let userModel = require('../models/userModel');
        userModel = userModel.user;
        let response = new Object();
        try {

            userModel.password = data.password;
            userModel.email = data.email;

        } catch (ex) {
            // data validation failed
            console.log('login:data validation failed')
        }
        firebase.auth().signInWithEmailAndPassword(userModel.email, userModel.password)
            .then(function (result) {
                firebase.database().ref(`/userProfiles/` + result.user.uid).once('value').then(function (snapshot) {
                    userModel = snapshot.val();
                    // delete userModel['password']; 
                    userModel['uid'] = snapshot.key;
                    userModel.lastSeen = Date(result.user.lastLoginAt);
                    userModel.dateCreated = Date(result.user.createdAt);
                    userModel.verified = result.user.emailVerified;
                    if (userModel.verified) {
                        response = {
                            status: 'success',
                            message: 'Login Successful',
                            data: userModel
                        }
                        resolve(response);
                    } else {
                        response = {
                            status: 'error',
                            message: 'Kindly Verify your email address to continue using Swap.',
                            data: userModel
                        }
                        reject(response);
                    }


                    //Email sent
                });



                // var database = firebase.database();
                //firebase.database().ref('users/' + userModel.email).set(userModel);
            })
            .catch(function (error) {
                // Handle Errors here.
                var message = "";
                var errorCode = error.code;
                var errorMessage = error.message;

                response = {
                    'status': 'error',
                    'message': error.message,
                    'data': data
                }
                reject(response);
            });


    });

}

let fetchUserById = function (data) {

    return new Promise(function (resolve, reject) {
        let userModel = require('../models/userModel');
        userModel = userModel.user;
        let response = new Object();
        try {

            userModel.uid = data.uid;

        } catch (ex) {
            // data validation failed
            console.log('fetchUserById:data validation failed')
        }

        firebase.database().ref(`/userProfiles/` + userModel.uid).once('value').then(function (snapshot) {
            //console.log('got here::fetchUserById')
            userModel = snapshot.val();
            delete userModel['password'];

            //uData.lastSeen = Date(result.user.lastLoginAt);
            //uData.dateCreated = Date(result.user.createdAt);
            //console.log(uData)

            response = {
                status: 'success',
                message: 'data retrieved successfully',
                data: userModel
            }
            resolve(response);

            //Email sent
        }).catch(function (error) {
            // Handle Errors here.
            var message = "";
            var errorCode = error.code;
            var errorMessage = error.message;
            response = {
                'status': 'error',
                'message': 'Invalid user id',
                'data': data
            }
            reject(response);
        });


    });

}

let update = function (data) {

    return new Promise(async function (resolve, reject) {
        // let userModel = require('../models/userModel');
        // userModel = userModel.user;
        let response = new Object();
        let uid, fullName, username, phoneNumber, profilePicture;
        let profilePictureObj;

        try {

            uid = data.uid;
            fullName = data.fullName;
            username = data.username;
            phoneNumber = data.phoneNumber;
            profilePictureObj = data.profilePicture

        } catch (ex) {
            // data validation failed
        }
        let userRef = firebase.database().ref(`/userProfiles/` + uid)

 
        if (profilePictureObj.image) {
            let uploadResponse = await services.upload(profilePictureObj);

            if (uploadResponse.status == 'success') {
                profilePicture = uploadResponse.data.url
            }

        } else {
            profilePicture = profilePictureObj.imageUrl;
        }


        userRef.once(('value'), async function (snap) {
            let userData = await snap.val();

            userData.fullName = fullName;
            userData.username = username;
            userData.phoneNumber = phoneNumber;
            userData.profilePicture = profilePicture

            await userRef.set(userData).then((result) => {

                response = { 
                    status: 'success',
                    message: 'data updated successfully',
                    data: null
                }
                resolve(response);

            }).catch(function (error) {
                // Handle Errors here.
                var message = "";
                var errorCode = error.code;
                var errorMessage = error.message;
                response = {
                    'status': 'error',
                    'message': 'an error occured during account update',
                    'data': null
                }
                reject(response);
            });
        })

    });

}

let updatePassword = function (data) {
    return new Promise(async function (resolve, reject) {
        let response = new Object();

        try {

            let credentials = await firebase.auth.EmailAuthProvider
                .credential(data.email, data.oldPassword);

            await firebase
                .auth()
                .signInWithEmailAndPassword(data.email, data.oldPassword)

            await firebase
                .auth()
                .currentUser
                .reauthenticateWithCredential(credentials).then(async function () {
                    await firebase.auth().currentUser.updatePassword(data.newPassword).then(function () {
                        console.log('Password Changed');

                        response = {
                            status: 'success',
                            message: 'Password Updated Successfully',
                            data: null
                        }

                    })
                })
        } catch (ex) {

            // console.log(ex)

            response = {
                status: 'error',
                message: ex.message,
                data: null
            }
            resolve(response)
        }

        resolve(response)

    })
}

let updateEmail = function (data) {
    return new Promise(async function (resolve, reject) {
        let response = new Object();

        let userRef = firebase.database().ref('/userProfiles/' + data.uid);

        try {

            let credentials = await firebase.auth.EmailAuthProvider
                .credential(data.oldEmail, data.password);

            await firebase
                .auth()
                .signInWithEmailAndPassword(data.oldEmail, data.password)

            await firebase
                .auth()
                .currentUser
                .reauthenticateWithCredential(credentials).then(async function () {
                    await firebase.auth().currentUser.updateEmail(data.newEmail).then(async function () {
                        console.log('Email Changed');

                        await userRef.update({ email: data.newEmail });
                        await firebase.auth().currentUser.sendEmailVerification();
                        response = {
                            status: 'success',
                            message: 'Email Updated Successfully',
                            data: null
                        }

                    })
                })
        } catch (ex) {

            console.log(ex.message)

            response = {
                status: 'error',
                message: ex.message,
                data: null
            }
            resolve(response)
        }

        resolve(response)

    })
}

let forgotPassword = function (data) {

    return new Promise(function (resolve, reject) {
        let userModel = require('../models/userModel');
        userModel = userModel.user;
        let response = new Object();
        try {

            userModel.email = data.email;

        } catch (ex) {
            // data validation failed
            console.log('forgot password:data validation failed')
        }
        firebase.auth().sendPasswordResetEmail(userModel.email);


        response = {
            status: 'success',
            message: 'password reset mail has been sent to ' + userModel.email,
            data: userModel
        }
        resolve(response);


    });




}

let deleteAccount = function (data) {
    return new Promise(async function (resolve, reject) {
        let userModel = require('../models/userModel');
        userModel = userModel.user;

        let itemsRef = firebase.database().ref('/items');
        let swapsRef = firebase.database().ref('/swaps');

        let response = new Object();

        try {

            userModel.uid = data.uid;

            // let credentials = await firebase.auth.EmailAuthProvider
            //     .credential(data.email, data.oldPassword);

            await firebase
                .auth()
                .signInWithEmailAndPassword(data.email, data.password)


            await firebase
                .auth()
                .currentUser
                .delete().then(async function () {
                    let userRef = firebase.database().ref(`/userProfiles/` + userModel.uid);

                    let userSnap = await userRef.once('value');

                    let user = await userSnap.val();
                    let userSwaps = user.swaps;

                    for (var key in userSwaps) {

                        await swapsRef.child(key).remove();

                    }

                    let itemsSnap = await itemsRef.once('value');
                    let items = itemsSnap.val();

                    for (var key in items) {

                        let item = items[key]
                        if (item.postedby == userModel.uid) {

                            await itemsRef.child(key).remove();

                        }

                    }

                    await userRef.remove()

                    response = {
                        status: 'success',
                        message: 'Account deleted successfully',
                        data: null
                    }
                    resolve(response);
                })
        } catch (ex) {

            console.log(ex)

            response = {
                status: 'error',
                message: ex.message,
                data: null
            }
            resolve(response)
        }

        resolve(response)

    })
    return new Promise(async function (resolve, reject) {
        let userModel = require('../models/userModel');
        userModel = userModel.user;

        let itemsRef = firebase.database().ref('/items');
        let swapsRef = firebase.database().ref('/swaps');

        let response = new Object();

        try {

            userModel.uid = data.uid;

        } catch (ex) {
            // data validation failed
            console.log('fetchUserById:data validation failed')
            response = {
                status: 'error',
                message: 'error deleting account',
                data: null
            }
            reject(response);
        }

        let userRef = firebase.database().ref(`/userProfiles/` + userModel.uid);

        let userSnap = await userRef.once('value');

        let user = await userSnap.val();
        let userSwaps = user.swaps;

        for (var key in userSwaps) {

            await swapsRef.child(key).remove();

        }

        let itemsSnap = await itemsRef.once('value');
        let items = itemsSnap.val();

        for (var key in items) {

            let item = items[key]
            if (item.postedby == userModel.uid) {

                await itemsRef.child(key).remove();

            }

        }

        await userRef.remove()

        response = {
            status: 'success',
            message: 'Account deleted successfully',
            data: null
        }
        resolve(response);

    });
}

let reportUser = function (data) {
    return new Promise(async function (resolve, reject) {
        let reportsRef = firebase.database().ref('/reports');
        let usersRef = firebase.database().ref('/userProfiles');
        let response = new Object();

        data.reported = new Date().toISOString();
        data.timestamp = firebase.database.ServerValue.TIMESTAMP;

        await reportsRef.push(data);

        await usersRef.child(data.offender).child('reports').transaction(function (reports) {
            reports = (reports) ? (reports + 1) : 1
            return reports;
        })

        response = {
            status: 'success',
            message: 'Report Successful',
            data: null
        }
        resolve(response);

    })
}

let isUsernameTaken = function (data) {
    return new Promise(async function (resolve, reject) {
        let response = new Object();

        let username = data.username
        let usersRef = firebase.database().ref('/userProfiles');


        await usersRef
            .orderByChild('usernameLower')
            .equalTo(username.toLowerCase())
            .once('value')
            .then(snapshot => {
                snapshot.forEach(function (snap) {
                    let id = snap.val().uid;

                    if (snapshot.exists()) {
                        if (data.uid) {
                            if (id !== data.uid) {
                                response = {
                                    status: true,
                                    message: 'username is taken',
                                    data: null
                                }
                            } else {
                                response = {
                                    status: false,
                                    message: 'username is available',
                                    data: null
                                }
                            }
                        } else {
                            response = {
                                status: true,
                                message: 'username is taken',
                                data: null
                            }
                        }
                    } else {
                        response = {
                            status: false,
                            message: 'username is available',
                            data: null
                        }
                    }
                })
            });

        resolve(response);

    })

}

let updateFcmToken = function (data){
    return new Promise(async function (resolve, reject) {
        let response = new Object();

        let fcmToken = data.fcmToken
        let uid = data.uid

        let usersRef = firebase.database().ref('/userProfiles');

        await usersRef.child(uid).update({
            fcmToken
        })

        response = {
            status: true,
            message: 'fcmToken updated',
            data: null
        }

        resolve(response);
    })
}



// let activateLikesListener = function (data) {
//     return new Promise(function (resolve, reject) {
//         let response = new Object();

//         let userRef = firebase
//             .database()
//             .ref('/userProfiles')
//             .child(data.uid);

//         let likesRef = userRef
//             .child('likes')

//         likesRef.on('value', function (snap) {

//             let likes = snap.val();
//             // console.log(likes)
//             response = {
//                 status: 'success',
//                 message: 'likes retrieved successfully',
//                 data: likes
//             }
//             resolve(response);
//         })
//     })
// }

/* let forgotPassword = function(data){
    
    return new Promise (function(resolve,reject){
        let userModel =  require('../models/userModel');
        userModel = userModel.user;
        let response = new Object();
        try{
            
            userModel.email = data.email;
            userModel.oldPassword = data.oldPassword;
            userModel.newPassword = data.newPassword;
           
        }catch(ex){
            // data validation failed
            console.log('forgot password:data validation failed')
        }
        firebase.auth.EmailAuthProvider.credential(userModel.email);
  
       
        response = {
            status:'success',
            message:'password reset mail has been sent to '+userModel.email,
            data:userModel
        }
        resolve(response);
            
        
    });
        
        
} */

module.exports = {
    fetchUserById,
    update,
    register,
    login,
    forgotPassword,
    updatePassword,
    updateEmail,
    deleteAccount,
    reportUser,
    isUsernameTaken,
    updateFcmToken
    // activateLikesListener
}