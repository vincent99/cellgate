import fetch from 'node-fetch';
import express from 'express';
import morgan from 'morgan';
import jwt_decode from 'jwt-decode';

const apptype = 'ios';
const appversion = '2';
const authusername = process.env.authusername;
const authpassword = process.env.authpassword;
const devicetoken  = process.env.devicetoken;
const voiptoken    = process.env.voiptoken;
let authToken    = process.env?.authtoken;
let decoded;
const mock         = process.env?.mock === 'true';

if ( !authToken ) {
  const res = await login();

  authToken = res.token;
}

if ( !authToken ) {
  console.error('Auth token not provided');
  process.exit(1);
}

decoded = jwt_decode(authToken);

const mapList = {
  "isSuccess": true,
  "message": "Success",
  "data": {
    "isTalkmanAvail": false,
    "showVideoCamera": 0,
    "mapLocations": [
      {
        "Id": 9203,
        "Description": "11284 Hunt Highway (Santan I)",
        "PropertyLocationDeiviceCount": 1,
        "DeviceList": [
          {
            "MapLocationId": "9203",
            "ProertyLocaitonId": "11633",
            "ProperyLocationName": "Front Gate (S1) / #59835",
            "DeviceId": "59835",
            "KitHardwareType": "WTM-EVO",
            "IsOnline": 0
          }
        ]
      },
      {
        "Id": 10293,
        "Description": "26312 S Washington (Santan II)",
        "PropertyLocationDeiviceCount": 1,
        "DeviceList": [
          {
            "MapLocationId": "10293",
            "ProertyLocaitonId": "12811",
            "ProperyLocationName": "Front Gate (S2) /  #57251",
            "DeviceId": "57251",
            "KitHardwareType": "WTM-EVO",
            "IsOnline": 0
          }
        ]
      }
    ]
  }
};

const hunt = {
  "isSuccess": true,
  "message": "Success",
  "data": {
    "devices": {
      "id": 59835,
      "description": "Front Gate (S1) / #59835",
      "supportsMomentary": true,
      "supportsHold": false,
      "ports": [
        {
          "id": 57126,
          "description": "Watchman Gate",
          "portKey": "01",
          "deviceType": "Gate",
          "lastState": "0",
          "descriptionState0": "Gate Closed",
          "descriptionState1": "Gate Open",
          "hardwareType": "WTM-EVO",
          "IsGateHoldOpen": false,
          "isOnline": 2,
          "signalStrength": 0,
          "batteryStatus": 0,
          "supportMediaStreaming": false,
          "isMotionSensorEnabled": false,
          "motionSensorStatus": 0,
          "liveCredits": 0,
          "streamID": null,
          "showMotionTrigger": false
        }
      ],
      "deviceType": "Gate",
      "hardwareType": "WTM-EVO",
      "IsGateHoldOpen": false
    }
  }
};

const elmhurst = {
  "isSuccess": true,
  "message": "Success",
  "data": {
    "devices": {
      "id": 57251,
      "description": "Front Gate (S2) /  #57251",
      "supportsMomentary": true,
      "supportsHold": false,
      "ports": [
        {
          "id": 44094,
          "description": "E Elmhurst Dr Entrance",
          "portKey": "01",
          "deviceType": "Gate",
          "lastState": "0",
          "descriptionState0": "Gate Closed",
          "descriptionState1": "Gate Open",
          "hardwareType": "WTM-EVO",
          "IsGateHoldOpen": false,
          "isOnline": 2,
          "signalStrength": 0,
          "batteryStatus": 0,
          "supportMediaStreaming": false,
          "isMotionSensorEnabled": false,
          "motionSensorStatus": 0,
          "liveCredits": 0,
          "streamID": null,
          "showMotionTrigger": false
        }
      ],
      "deviceType": "Gate",
      "hardwareType": "WTM-EVO",
      "IsGateHoldOpen": false
    }
  }
}


const expired ={
  isSuccess: false,
  message: "Auth Token is Expired",
  data: {
    result: "Auth Token is Expired"
  }
};

const ok = {
  isSuccess: true,
  message: 'Success',
  data: { result: 'Gate Opened Successfully. (Mock)' }
};

async function apiCall(cmd, method='GET', headers={}, body=null) {
  if ( decoded && decoded.exp < (new Date().getTime())/1000 ) {
    return expired;
  }

  if ( mock ) {
    return ok;
  }

  let data;

  try {
    const response = await fetch(`https://cellgate.zapopen.com/api/CellCam/${cmd}`, {
      method,
      body,
      headers,
    });

    data = await response.json();

    console.log(response.status, data);

  } catch (err) {
    console.error(err);
  }

  return data;
}

function authedCall(cmd, method='GET', headers={}, body=null) {
  const moreHeaders = {
    'authorization': `Bearer ${authToken}`,
    'content-length': body ? body.length : 0,
    ...headers
  };

  return apiCall(cmd, method, moreHeaders, body);
}

// function checkAlreadyLoggedIn() {
//   return apiCall('CheckUserAlreadyLogin', 'POST', {}, {
//     authusername,
//     authpassword,
//     apptype,
//     appversion,
//   });
// }

function login() {
  return apiCall('Login', 'POST', {
    authusername,
    authpassword,
    apptype,
    appversion,
    devicetoken,
    voiptoken
  });
}

function open(gate) {
  const device = gate.data.devices;
  const deviceId = device.id;
  const portId = device.ports[0].id;

  return authedCall('Gatecommand', 'POST', {'content-type': 'application/x-www-form-urlencoded; charset=utf-8'}, `GateCommand=MOMENTARY_OPEN&Hours=0&DeviceID=${deviceId}&PortID=${portId}&AccessCode+=1`);
}

const app = express();
app.use(morgan('combined'));
const port = 8000;

app.get('/', async (req, res) => {
  let result;

  if ( typeof req.query['hunt'] !== 'undefined' ) {
    result = await open(hunt);
  } else if ( typeof req.query['elmhurst'] !== 'undefined' ) {
    result = await open(elmhurst);
  }

  res.set('content-type', 'text/html');
  res.end('<html>' +
    '<head>' +
      (result ? '<meta http-equiv="refresh" content="5;url=/" />' : '') +
      '<meta name="viewport" content="width=device-width">' +
      '<style>' +
        'BODY { padding: 20px; background-color: white; font-family: Verdana; }\n' +
        '.btn, .btn:focus, .btn:hover, .btn:visited, .btn:link { padding: 20px; margin-bottom: 20px; text-decoration: none; font-size: 24pt; text-align: center; line-height: 100px; background-color: #ccf; border: 1px solid #33f; border-radius: 5px; display: block; height: 100px; }\n' +
      '</style>' +
    '</head>' +
    '<body>' +
    '<div><a class="btn" href="/?elmhurst">Elmhurst</a></div>' +
    '<div><a class="btn" href="/?hunt">Hunt Highway</a></div>' +
    `<h3 style="color: red; margin: 20px 0;">${result ? (result?.data?.result || result?.message) : ''}</h3>` +
    '</body></html>');
})

app.listen(port, () => {
  console.log(`Listening at http://localhost:${port}`)
  console.log('Token expires', (new Date(decoded.exp*1000)).toString());
}) 
