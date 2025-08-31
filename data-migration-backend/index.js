import express from 'express';
import cors from 'cors';

const app = express();

// Enable CORS for all origins (can restrict to http://localhost:5173 or similar if needed)
app.use(cors());


app.get('/api/hello', (req, res) => {
  res.json({ message: 'Hello from backend!' });
});

// Listen on any available port
const server = app.listen(0, () => {
  console.log(`Express backend running on port ${server.address().port}`);
});
