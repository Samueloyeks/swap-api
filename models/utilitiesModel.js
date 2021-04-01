exports.responseObj = {
    "headerCode":null,
    "status":null,
    "message":null,
    "data":null,
    "variable":null
}

exports.headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin':'*',  
    'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept, Authorization',
    'Access-Control-Allow-Methods': 'POST,OPTIONS',
    'Access-Control-Allow-Credentials': true
}

exports.firebaseConfig = {
    apiKey: "AIzaSyA3P4ParmZmw89N80Ow-zDWcBna_saL1_U",
    authDomain: "swap-eb68d.firebaseapp.com",
    databaseURL: "https://swap-eb68d.firebaseio.com",
    projectId: "swap-eb68d",
    storageBucket: "swap-eb68d.appspot.com",
    messagingSenderId: "655639433389",
    appId: "1:655639433389:web:dacba97ac67ca311233624",
    measurementId: "G-DNEDT77MFC"
};

exports.resCodes = {
    'function_not_found': {
        "code":400,
        "message":"Unable to load specified path"
    },
    'module_not_found':{
        "code":404,
        "message":"sub route does not exist"
    },
    'request_failed':{
        "code":400,     
        "message":"An error occured while performing request"  
    },
    'invalid_data':{
        "code":400,     
        "message":"Invalid data format"  
    },
    'request_succesful':{
        "code":200,
        "message":"Request Successful"
    },
    'route_not_found':{
        "code":500,
        "message":"Cannot find route"
    },
    '500': {
        "code":500,
        "message":""
    },
    '409':{
        "code":409,  
        "message":""
    },
    '401': {
        "code":401,
        "message":"API Authentication Failed"
    },
    '204': {
        "code":204,
        "message":"Handle Options CORS Request"
    }
}

exports.appConfig={
    appState:'test',
    serverURL:global.serverURL, 
    liveHostName:'0.0.0.0',
    livePort:process.env.PORT || 3000,
    testHostName:'127.0.0.1', 
    // testHostName:'192.168.56.1',
    testPort:process.env.PORT || 3000,
    apiUser:"am9objpzbWl0aA==",
    apiPass:"JiZAQEFBMTE6NjcmOCMh"
    // apiUser:process.env.API_USERNAME,
    // apiPass:process.env.API_PASSWORD
}
