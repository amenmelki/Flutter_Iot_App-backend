const jwt = require('jsonwebtoken')
require("dotenv").config()

const config = process.env
const auth = (req, res, next) => {
  try {
    // Retrieve the token from the request headers
    const token = req.header('Authorization');
    console.log(token)

    if (!token) {
      console.log("famesh token")
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    // Verify the token
    const decoded = jwt.verify(token, process.env.TOKEN_KEY);

    // Attach the decoded user data to the request object
    req.user = decoded.user;

    // Proceed to the next middleware or route
    console.log("9bal l next")
    next();
  } catch (error) {
    //console.log(token)
    res.status(401).json({ message: 'Token is not valid' });
  }
};

module.exports = auth;