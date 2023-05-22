const express = require('express');
const cors = require('cors')
// const mongoose = require('mongoose')
require('dotenv').config();

const app = express();
const PORT = 8000
// const DB = 'mapDB'

// MIDDLEWARE
app.use(cors(), express.json(), express.urlencoded({ extended: true }));
// Use routes as middleware

// CONNECT to the DB using Mongoose
// require("./config/mongoose.config")(DB);

// ROUTES
require('./Routes/api.routes')(app)

// START THE SERVER
app.listen(PORT, () =>
  console.log(`Server is locked and loaded on port ` + PORT)
);