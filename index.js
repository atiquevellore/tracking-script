const express = require("express");
const cors = require("cors");
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.static("public"));

app.get("/", (req, res) => {
  res.send("Express.js server running on Fly.io 🚀");
});

// Serve your tracking script
app.get("/tracking.js", (req, res) => {
  res.sendFile(__dirname + "/public/tracking.js");
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
