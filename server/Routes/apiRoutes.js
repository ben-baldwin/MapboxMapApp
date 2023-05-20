const apiKey = process.env.API_KEY;

app.get('/api/data', (req, res) => {
  // Use the apiKey variable to make an API request
  fetch(`https://api.example.com/data?apiKey=${apiKey}`)
    .then(response => response.json())
    .then(data => {
      // Process the received data
      // ...
      res.json(data);
    })
    .catch(error => {
      // Handle any errors that occurred during the API request
      console.error(error);
      res.status(500).json({ error: 'An error occurred' });
    });
})