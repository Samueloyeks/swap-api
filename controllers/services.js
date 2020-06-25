let utilities = require('../controllers/utilities');
require("../models/firebase");
let firebase = utilities.firebase;
global.XMLHttpRequest = require("xhr2");
global.atob = require("atob");
const Blob = require("cross-blob");
const uuid = require('uuid')




let upload = async function (data) {
    return new Promise(async function (resolve, reject) {
        let response = new Object();
        let downloadURL = null

        if (data.image) {
            try {

                // FIREBASE STORAGE 
                var buffer = Buffer.from(data.image.replace(/^data:image\/[a-z]+;base64,/, ""), 'base64');
                const imageRef = firebase.storage().ref(`images/${uuid.v1()}.png`);
                await imageRef.put(buffer, { 'contentType': 'image/png' });
                downloadURL = await imageRef.getDownloadURL();

                // SERVER STORAGE 
                // var imgBaseURL = 'uploads/' + uuid.v1() + '.png';
                // await writeFile(String(imgBaseURL), await data.image.replace(/^data:image\/[a-z]+;base64,/, ""), 'base64')
                // var downloadURL = 'http://' + global.serverURL + '/' + imgBaseURL;

                response = {
                    status: 'success',
                    message: 'Upload Successful',
                    data: { 'url': downloadURL }
                }

                resolve(response);

            } catch (ex) {
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
        let response = new Object();
        var imageUrls = [];

        if (data.images) {
            await Promise.all(data.images.map(async (data, index) => {
                var uploadResponse = await upload(data);

                if (uploadResponse.status == 'success') {
                    imageUrls[index] = await uploadResponse.data.url
                    // imageUrls.push(response.data.url)
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
        let response = new Object();
        var imageUrls = [];

        if (data.images) {
            await Promise.all(data.images.map(async (data, index) => {

                if (data.image) {
                    var uploadResponse = await upload(data)

                    if (uploadResponse.status == 'success') {
                        imageUrls[index] = uploadResponse.data.url
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

let deleteImage = async function (data) {
    let response = new Object();

    let imageUrl = data.imageUrl
    var targetRef = firebase.storage().refFromURL(imageUrl)

    await targetRef.delete().then(function () {
        response = {
            status: 'success',
            message: 'Image Deleted Successfully',
            data: null
        }

    }).catch(function (error) {
        response = {
            status: 'error',
            message: 'Could not Delete Image',
            data: null
        }
    });

    return response;
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

const writeFile = (path, data, opts = 'base64') =>
    new Promise((resolve, reject) => {
        require('fs').writeFile(path, data, opts, (err) => {
            if (err) reject(err)
            else resolve()
        })
    })



module.exports = {
    dataURItoBlob,
    multipleUpload,
    upload,
    base64toBlob,
    multipleUploadEdit,
    deleteImage
}