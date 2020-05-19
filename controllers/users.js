let utilities = require('../controllers/utilities');
require("../models/firebase");
let firebase = utilities.firebase;

/// modules

let register = function (data) {
    return new Promise(function (resolve, reject) {
        let userModel = require('../models/userModel');
        userModel = userModel.user;
        let response = new Object();
        try {

            userModel.fullName = data.fullName;
            userModel.username = data.username;
            userModel.password = data.password;
            userModel.email = data.email;
            userModel.phoneNumber = data.phoneNumber;

        } catch (ex) {
            console.log('validation failed')
            // data validation failed
        }

        //set account status
        if (userModel.status == 'admin') {
            userModel.status = 'pending';
        } else {
            userModel.status = 'active';
        }

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

    return new Promise(function (resolve, reject) {
        let userModel = require('../models/userModel');
        userModel = userModel.user;
        let response = new Object();
        try {

            userModel.uid = data.uid;
            userModel.fullName = data.fullName;
            userModel.email = data.email;
            userModel.phoneNumber = data.phoneNumber;

        } catch (ex) {
            // data validation failed
        }
        firebase.database().ref(`/userProfiles/` + userModel.uid).once('value').then(function (snapshot) {
            userModel = snapshot.val();
            userModel = data;
            //console.log(result)
            firebase.database().ref(`/userProfiles/` + userModel.uid).update(userModel).then((result) => {
                response = {
                    status: 'success',
                    message: 'data updated successfully',
                    data: userModel
                }
                resolve(response);

            })
        }).catch(function (error) {
            // Handle Errors here.
            var message = "";
            var errorCode = error.code;
            var errorMessage = error.message;
            response = {
                'status': 'error',
                'message': 'an error occured during account update',
                'data': data
            }
            reject(response);
        });
    });

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
    updateUserLocation
}