const express = require("express")
const router = express.Router()
const User = require("../model/User")
const Temperature = require("../model/Temperature")
const Humidity = require("../model/Humidity")
const FlameSensor = require("../model/FlameSensor")
const MotionDetector = require("../model/MotionDetect")
const RfidDetector = require("../model/Rfid")
const jwt = require("jsonwebtoken")
const auth = require("../middleware/auth")
const { json } = require("body-parser")
const mqtt = require('mqtt');
const mqttBrokerURL = 'mqtt://10.10.23.19'; // MQTT broker URL
const mqttClient = mqtt.connect(mqttBrokerURL);
const config = require("config");
const Rfid = require("../model/Rfid")
const cron = require('node-cron');
const nodemailer = require('nodemailer');
const twilio = require('twilio');
const Notification = require('../model/Notification');
const { Expo } = require('expo-server-sdk');
const expo = new Expo();
const io = require('socket.io-client');
const OneSignal = require('onesignal-node');


const maxTemperature = 20
const maxHumidity = 70
const maxAllowedDelay = 360
require("dotenv").config()
async function sendNotification(data) {
  const socket = io('http://10.10.23.177:8000/');


  const body = { 'data': data }
  //console.log(body)
 
  socket.on('connect', () => {
    console.log('Connected to server');
    socket.emit('serverToserver', body, (ack) => {
      console.log('Event acknowledged by server:', ack);
    });
  });
}

const oneSignalClient = new OneSignal.Client({
  userAuthKey: '36884349-673a-4b88-bc74-82b94a588357',
  app: { appAuthKey: '36884349-673a-4b88-bc74-82b94a588357', appId: 'ZjllOWQ4YzUtODJkYi00MDhlLWI0NGUtZDM0MTczN2I2ODNi' }
});

const checkSensorStatus = async () => {
  try {
    const currentTime = new Date();

    // Check temperature sensor
    const temperatureData = await Temperature.findOne()
      .sort({ timestamp: -1 })
      .exec();
    if (!temperatureData || currentTime - temperatureData.timestamp > maxAllowedDelay) {
      // Temperature sensor is not working or has not been updated
      handleSensorFailure("Temperature Sensor");


    }

    // Check humidity sensor
    const humidityData = await Humidity.findOne()
      .sort({ timestamp: -1 })
      .exec();
    if (!humidityData || currentTime - humidityData.timestamp > maxAllowedDelay) {
      // Humidity sensor is not working or has not been updated
      handleSensorFailure("Humidity Sensor");
    }

    // Check flame sensor
    const flameData = await FlameSensor.findOne()
      .sort({ timestamp: -1 })
      .exec();
    if (!flameData || currentTime - flameData.timestamp > maxAllowedDelay) {
      // Flame sensor is not working or has not been updated
      handleSensorFailure("Flame Sensor");
    }

    // Check motion sensor
    const motionData = await MotionDetector.findOne()
      .sort({ timestamp: -1 })
      .exec();
    if (!motionData || currentTime - motionData.timestamp > maxAllowedDelay) {
      // Motion sensor is not working or has not been updated
      handleSensorFailure("Motion Sensor");
    }

    // Check RFID sensor
    const rfidData = await RfidDetector.findOne()
      .sort({ timestamp: -1 })
      .exec();
    if (!rfidData || currentTime - rfidData.timestamp > maxAllowedDelay) {
      // RFID sensor is not working or has not been updated
      handleSensorFailure("RFID Sensor");
    }
  } catch (err) {
    console.error("Error checking sensor status:", err);
  }
};
const handleSensorFailure = (sensorName) => {
  console.error(`${sensorName}  has failed.`);

  // Additional error handling code or actions can be added here
};
router.post("/signup", async (req, res) => {

  console.log(req.body)
  const { name, email, password, phone, address } = req.body
  const user = new User({ name, email, password, phone, address })

  const token = jwt.sign(
    {
      user_id: user._id, email
    },
    process.env.TOKEN_KEY,
    { expiresIn: "24h" }
  )
  user.token = token
  user.save().then((user) => res.status(200).json({ "msg": "User Added", user, token }))
    .catch((err) => console.log(err))
})

router.post("/login", async (req, res) => {
  res.setHeader('Content-Type', 'application/json');

  console.log(req.body)
  try {

    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (user && (password == user.password)) {
      console.log("fosset if !")
      const token = jwt.sign(
        {
          user_id: user._id, email
        },
        process.env.TOKEN_KEY,
        { expiresIn: "24h" }
      )
      user.token = token
      user.save()
      req.token = token // <-- Set the token on the req object

      console.log("ta7eet save !!", user)

      res.status(200).json({ "token": user.token, user })

    } else {
      res.status(401).json({
        "msg": "Invalid Credentials"
      })
    }

  } catch (err) {
    console.log(err);
  }
})

router.get('/user', auth, async (req, res) => {
  try {
    const token = req.headers.authorization; // Retrieve the token from the request headers
    console.log("test");

    const user = await User.findOne({ token: token }); // Find the user based on the token
    console.log(user);

    if (!user) {
      return res.status(401).json({ message: 'Invalid Token' });
    }

    res.status(200).json(user); // Return the user data
  } catch (error) {
    console.log(error)
    res.status(500).send({ message: error.message });
  }
});


router.post('/update', auth, async (req, res) => {
  console.log('hane f updatye bro')
  const token = req.headers.authorization;
  try {
    const user = await User.findOne({ token: token });
    console.log(req.body)
    if (!user) {
      return res.status(404).send({ message: 'User not found' });
    }
    if (user.email != req.body.email) {
      user.email = req.body.email;
    }
    if (user.name != req.body.name) {
      user.name = req.body.name;
    }

    if (req.body.password != '') {
      user.password = req.body.password;
    }

    user.save().then(res.status(200))
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
});
router.post("/avatar",auth, async (req, res) => {
  const data = req.body.avatar;
  const token = req.headers.authorization;
  const user = await User.findOne({token: token})

  console.log(req)

  /*const split = data.split(',')
  const base64string = split[1]
  const buffer = Buffer.from(base64string, 'base64')*/
  user.avatar = String(data)
  user.save()

  res.status(200)
})
router.post('/postNotId', auth, async (req, res) => {
  const token = req.headers.authorization;
  console.log(req.body.data.id)
  const id = req.body.data
  console.log(id['id'])

  const user = await User.findOne({ token: token });

  if (!user) { return }

  user.notif_id = id['id']

  user.save().then(res.status(200));
});
mqttClient.on('connect', () => {
  console.log('Connected to MQTT broker');
  mqttClient.subscribe('iot_pfe/temp'); // Topic to subscribe to on the MQTT broker
  mqttClient.subscribe('iot_pfe/flame_sensor'); // Topic to subscribe to for flame sensor data
  mqttClient.subscribe('iot_pfe/motion_sensor'); // Topic to subscribe to for Motion Detector sensor data
  mqttClient.subscribe('iot_pfe/rfid'); // Topic to subscribe to for RFID Detector 
  mqttClient.subscribe('iot_pfe/hum'); // Topic to subscribe to on the MQTT broker
});


mqttClient.on('message', async (topic, message) => {
  if (topic === 'iot_pfe/temp') {
    console.log("teeeeeest", message)
    const temperatureData = JSON.parse(message);
    console.log("test temp dataaaa", temperatureData)
    const temperature = new Temperature({ temperature: temperatureData });
    console.log(temperature)
     if (temperatureData > maxTemperature) {
       // Temperature exceeds maximum threshold, send alert notification
       const alertMsg = {msg:`Temperature exceeds maximum threshold: ${temperatureData}`,type:"Temperature"};
       await sendNotificationES(alertMsg, Date());
       await sendNotification(alertMsg)

     }
    try {
      const savedTemperature = await temperature.save();
      console.log('Temperature data saved:', temperatureData);
    } catch (err) {
      console.error('Error saving temperature data:', err);
    }
  }
  if (topic === 'iot_pfe/hum') {
    const humidityData = JSON.parse(message);
    const humidity = new Humidity({ humidity: humidityData });
    console.log(humidityData)
    if (humidityData > maxHumidity) {
      // Temperature exceeds maximum threshold, send alert notification
      const alertMsg = {msg:`Humidity exceeds maximum threshold: ${humidityData}`,type:"humidity"};
      await sendNotificationES(alertMsg, Date());
      await sendNotification(alertMsg)

    }
    try {
      const savedHumidity = await humidity.save();
      console.log('Humidity data saved:', humidityData);
    } catch (err) {
      console.error('Error saving humidity data:', err);
    }
  }
  if (topic === 'iot_pfe/flame_sensor') {
    const flameData = message.toString();;
    const flameSensor = new FlameSensor({ value: flameData });
    if (flameSensor === 'Flame Detected') {
      // Flame detected, send alert notification
      const alertMsg = {msg:'Flame detected!',type:"flmae"};
      await sendNotificationES(alertMsg, Date());
      await sendNotification(alertMsg)

    }
    try {
      const savedFlameSensor = await flameSensor.save();
      console.log('Flame sensor data saved:', flameData);
    } catch (err) {
      console.error('Error saving flame sensor data:', err);
    }
  }
  if (topic === 'iot_pfe/motion_sensor') {
    const motionData = message.toString();
    const motionDetector = new MotionDetector({ value: motionData });
    if (motionDetector === 'Motion Detected') {
      // Motion detected, send alert notification
      const alertMsg = {msg:'Motion detected!',type:"motion"};
      await sendNotificationES(alertMsg, Date());
      await sendNotification(alertMsg)

    }
    try {
      const savedMotionDetector = await motionDetector.save();
      console.log('Motion Detector data saved:', motionData);
    } catch (err) {
      console.error('Error saving Motion Detector data:', err);
    }
  }

  if (topic === 'iot_pfe/rfid') {
    const rfidData = message.toString();
    const rfiddetector = new RfidDetector({ value: rfidData });
    console.log('sawehiii', rfidData)
    if (rfidData == 'Badge is Not Compatible') {
      console.log('hana f west l if test ', rfidData)

      // Access detected, send alert notification
      const alertMsg = {msg:'Badge is Not Compatible!',type:"rfid"};
      await sendNotificationES(alertMsg,Date());
      await sendNotification(alertMsg)

    }
    try {
      const savedRfidDetector = await rfiddetector.save();
      console.log('RFID data saved:', rfidData);
    } catch (err) {
      console.error('Error saving RFID  data:', err);
    }
  }
}); 

router.get('/temperature', async (req, res) => {
  try {
    const result = await Temperature.findOne().sort({ timestamp: -1 }).exec();
    if (result) {
      const latestTemperature = result.temperature;
      const timestamp = result.timestamp;
      res.json({ temperature: latestTemperature, timestamp: timestamp });
    } else {
      res.status(404).send('Temperature data not found');
    }
  } catch (err) {
    console.error('Error fetching temperature data:', err);
    res.status(500).send('Internal Server Error');
  }
});
router.get('/humidity', async (req, res) => {
  try {
    const result = await Humidity.findOne().sort({ timestamp: -1 }).exec();
    if (result) {
      const latestHumidity = result.humidity;
      const timestamp = result.timestamp;
      res.json({ humidity: latestHumidity, timestamp: timestamp });
    } else {
      res.status(404).send('Humidity data not found');
    }
  } catch (err) {
    console.error('Error fetching humidity data:', err);
    res.status(500).send('Internal Server Error');
  }
});

router.get('/flame', async (req, res) => {
  try {
    const result = await FlameSensor.findOne().sort({ timestamp: -1 }).exec();
    if (result) {
      const latestFlameSensorValue = result.value;
      const timestamp = result.timestamp;
      res.json({ value: latestFlameSensorValue, timestamp: timestamp });
    } else {
      res.status(404).send('Flame sensor data not found');
    }
  } catch (err) {
    console.error('Error fetching flame sensor data:', err);
    res.status(500).send('Internal Server Error');
  }
});

router.get('/motion', async (req, res) => {
  try {
    const result = await MotionDetector.findOne().sort({ timestamp: -1 }).exec();
    if (result) {
      const latestMotionDetectorValue = result.value;
      const timestamp = result.timestamp;

      res.json({ value: latestMotionDetectorValue, timestamp: timestamp });
    } else {
      res.status(404).send('Motion Detector data not found');
    }
  } catch (err) {
    console.error('Error fetching Motion Detector data:', err);
    res.status(500).send('Internal Server Error');
  }
});
router.get('/rfid', async (req, res) => {
  try {
    const result = await RfidDetector.findOne().sort({ timestamp: -1 }).exec();
    if (result) {
      const latestRFIDTag = result.value;
      const timestamp = result.timestamp;
console.log('hedhi latestRFID : ',latestRFIDTag)
console.log('hedhi time : ',timestamp)

      res.json({ tag: latestRFIDTag, timestamp: timestamp });
    } else {
      res.status(404).send('RFID Detector data not found');
    }
  } catch (err) {
    console.error('Error fetching RFID Detector data:', err);
    res.status(500).send('Internal Server Error');
  }
});
cron.schedule('*/5 * * * *', () => {
  checkSensorStatus();
});


//  route for handling sensor events
router.get('/Notification', auth, async (req, res) => {
  try {
    const notifications = await Notification.find().sort({time:-1});
    console.log(notifications)
    res.status(200).json(notifications); // Send the notifications as JSON response

  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).send('Internal Server Error');
  }
});
//OneSignal code is heree -----
/*
router.post('/send-notification', async (req, res) => {
  const token = req.headers.authorization;
  const { message } = req.body;
  console.log(message)

  try {
    const user = await User.findOne({ token: token });
    if (!user) {
      return res.status(404).send({ message: 'User not found' });
    }

    // Create the notification payload
    const notification = {
      contents: { en: message },
      include_player_ids: [user.token] // Specify the device token of the user
    }

    oneSignalClient.createNotification(notification).then(response => {
      console.log('Push notification sent:', response.body);

    })

    // Save the notification to the database or perform other actions

    res.status(200).json({ message: 'Push notification sent successfully' });
  } catch (error) {
    console.error('Error sending push notification:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});
*/
/*
// New route to send push notifications
router.post('/send-notification', async (req, res) => {
  const token = req.headers.authorization;
  const {  message } = req.body;

  try {
    const user = await User.findOne({ token: token });
    if (!user) {
      return res.status(404).send({ message: 'User not found' });
    }
    if (!user.token) {
      return res.status(400).send({ message: 'User device token is missing' });
    }
    // Create the push notification message
    const pushNotification = {
      to: user.token,
      sound: 'default',
      title: 'New Notification',
      body: message,
    };

    // Send the push notification using Expo
    const pushTickets = await expo.sendPushNotificationsAsync([pushNotification]);

    // Handle the push notification response
    const receiptIds = [];
    for (const ticket of pushTickets) {
      if (ticket.status === 'ok') {
        receiptIds.push(ticket.id);
      } else {
        console.error(`Error sending push notification: ${ticket.message}`);
      }
    }

    // Save the notification to the database
    const notification = new Notification({
      userId: user.token,
      message: message,
      receiptIds: receiptIds,
    });
    await notification.save();

    res.status(200).json({ message: 'Push notification sent successfully' });
  } catch (error) {
    console.error('Error sending push notification:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});
*/

// Function to send notification
async function sendNotificationES(notf,time) {
  try {

    const twilioClient = twilio('ACcbbf89429c6222c2ed027359d2c0a766', 'c561bd4c21d7bb62af93d0a3948849df');
    const smsMessage = `Alert ${notf.type}: ${notf.msg}\nTime: ${time}`;
    twilioClient.messages.create({
      body: smsMessage,
      from: '+13613146916',
      to: '+21651010512',
    });

    const transporter = nodemailer.createTransport({
      service: 'Gmail',
      auth: {
        user: 'amenallah.melki@etudiant-fst.utm.tn',
        pass: '11670278',
      },
    });

    const users = await User.find({}, 'email')
    console.log(users)
    users.map(user => {

      const mailOptions = {
        from: 'amenallah.melki@etudiant-fst.utm.tn',
        to: `${user.email}`,
        subject: `Alert ${notf.type}`,
        text: `Message: ${notf.msg}\nTime: ${time}`,
      };
  
  transporter.sendMail(mailOptions);
  // Emit the alert message as a notification to the socket server
  // Save notification to the database
 
  
    })
    const notification = new Notification({
      message:   notf.msg ,
      type: notf.type ,
    });


 console.log(notification)
 await notification.save();
} catch (error) {
 console.error('Error sending notification:', error);
 throw error;
}

}





module.exports = router