//imports
const express = require("express");
const admin = require("firebase-admin");
const multer = require("multer");
const dotenv = require("dotenv");
const cors = require("cors");
const app = express();

//middleware
// app.use(express.json());
app.use(cors());
// app.use(multer({ dest: "uploads/" }).single("file"));
// app.use(multer({ dest: "uploads/" }).array("files", 10));

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Specify the destination folder where you want to save the files
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, "demo");
  },
});

const upload = multer({ storage: storage, limits: { files: 10 } });

app.use(upload.array("files", 10));

dotenv.config();
const port = process.env.SERVER_PORT || 5000;

//initialize firebase
admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  }),
});

//import database connection and routes
const routes = require("./routes/main/routes.js");
const connectToDatabase = require("../config/databases/mongoose.config.js");
app.use(routes);

//starting the server
async function start() {
  try {
    // Connect to MongoDB using Mongoose
    await connectToDatabase();

    app.get("/", (req, res) => {
      console.log("welcome to the server");
      res.send("welcome to the server!");
    });

    app.listen(port, () => {
      console.log(`Server is running on port: ${port}`);
    });
  } catch (err) {
    console.error(err);
  }
}

start();
