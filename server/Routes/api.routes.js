const apiController = require("../Controllers/api.controller")

module.exports = app => {
  app.get('/data', apiController.getApiKey);
}