const apiURL = process.env.API_URL
const apiKey = process.env.REACT_APP_API_KEY;


module.exports.getApiKey = async (req, res) => {
  const apiKey = process.env.REACT_APP_API_KEY;
  console.log(process.env);
  const responseData = { apiKey: 'pk.eyJ1IjoiYmVuYmFsZHdpbjU1IiwiYSI6ImNsZ2pwbXJhcjBwZWozZnA0dWFkZ3YydGMifQ.27A8k4rZf87cluG99yfaGw' };
  console.log(responseData);
  res.json(responseData)
}