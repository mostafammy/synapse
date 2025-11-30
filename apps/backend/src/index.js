const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(
  cors({
    origin: process.env.NEXTAUTH_URL || "http://localhost:3000",
    credentials: true,
  })
);
app.use(helmet());
app.use(morgan("dev"));
app.use(express.json());

// Routes
app.get("/", (req, res) => {
  res.send("Social Media API is running...");
});

// Import Routes
app.use("/users", require("./routes/users"));
app.use("/posts", require("./routes/posts"));

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
