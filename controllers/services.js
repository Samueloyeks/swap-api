let utilities = require('../controllers/utilities');
require("../models/firebase");
let firebase = utilities.firebase;
global.XMLHttpRequest = require("xhr2");
global.atob = require("atob");
const Blob = require("cross-blob");





let upload = async function (data) {
    return new Promise(async function (resolve, reject) {

        if (data.image) {
            try {

                var buffer = Buffer.from(data.image.replace(/^data:image\/[a-z]+;base64,/, ""), 'base64');

                // FIREBASE STORAGE 
                const imageRef = firebase.storage().ref(`items/${Date.now()}.png`);
                // await imageRef.putString(base64Data[1],'base64',{'contentType':'image/jpeg'});
                await imageRef.put(buffer, { 'contentType': 'image/png' })
                downloadURL = await imageRef.getDownloadURL()

                // SERVER STORAGE 
                // var imgBaseURL = 'uploads/' + Date.now() + '.png';
                // require("fs").writeFile(String(imgBaseURL), base64Data[1], 'base64', function (err) {
                //     console.log(err);
                // }); 
                // var downloadURL = 'http://' + global.serverURL + '/' + imgBaseURL;
                let response = new Object();

                // console.log('File available at', downloadURL);
                response = {
                    status: 'success',
                    message: 'Upload Successful',
                    data: { 'url': downloadURL }
                }

                resolve(response);

            } catch (ex) {
                console.log(ex)
                response = {
                    status: 'error',
                    message: 'Could not Upload Image',
                    data: null
                }

                reject(response);
            }

        } else {
            console.log('no image')
        }
    });

};

let multipleUpload = function (data) {
    return new Promise(async function (resolve, reject) {
        var imageUrls = [];

        if (data.images) {
            await Promise.all(data.images.map(async data => {
                var response = await upload(data)

                if (response.status == 'success') {
                    imageUrls.push(response.data.url)
                } else {
                    response = {
                        status: 'error',
                        message: 'Could not Upload Images',
                        data: null
                    }

                    reject(response);
                }

            }))


            response = {
                status: 'success',
                message: 'Uploads Successful',
                data: { 'urls': imageUrls }
            }

            resolve(response);

        } else {
            console.log('no images')

        }
    })
}

let multipleUploadEdit = function (data) {
    return new Promise(async function (resolve, reject) {
        var imageUrls = [];

        if (data.images) {
            await Promise.all(data.images.map(async (data, index) => {

                if (data.image) {
                    var response = await upload(data)

                    if (response.status == 'success') {
                        imageUrls[index] = response.data.url
                    } else {
                        response = {
                            status: 'error',
                            message: 'Could not Upload Images',
                            data: null
                        }

                        reject(response);
                    }
                } else {
                    imageUrls[index] = data.imageUrl
                }



            }))


            response = {
                status: 'success',
                message: 'Uploads Successful',
                data: { 'urls': imageUrls }
            }

            resolve(response);

        } else {
            console.log('no images')

        }
    })
}

let dataURItoBlob = function (data) {
    let binary = data.split(',')[1]
    binary = Buffer.from(binary, 'base64').toString()
    let array = [];
    for (let i = 0; i < binary.length; i++) {
        array.push(binary.charCodeAt(i));
    }

    var blobTest = new Blob([new Uint8Array(array)], { type: 'image/jpeg' });
    console.log("===========================================");
    console.log(typeof (blobTest));
    return new Blob([new Uint8Array(array)], { type: 'image/jpeg' });
};

let base64toBlob = function (base64Data, contentType) {
    contentType = contentType || '';
    var sliceSize = 1024;
    var byteCharacters = atob(base64Data);
    var bytesLength = byteCharacters.length;
    var slicesCount = Math.ceil(bytesLength / sliceSize);
    var byteArrays = new Array(slicesCount);

    for (var sliceIndex = 0; sliceIndex < slicesCount; ++sliceIndex) {
        var begin = sliceIndex * sliceSize;
        var end = Math.min(begin + sliceSize, bytesLength);

        var bytes = new Array(end - begin);
        for (var offset = begin, i = 0; offset < end; ++i, ++offset) {
            bytes[i] = byteCharacters[offset].charCodeAt(0);
        }
        byteArrays[sliceIndex] = new Uint8Array(bytes);
    }
    return new Blob(byteArrays, { type: contentType });
}


module.exports = {
    dataURItoBlob,
    multipleUpload,
    upload,
    base64toBlob,
    multipleUploadEdit
}