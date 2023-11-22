const mongoose = require("mongoose");

const connectDatabase = async () => {
  const uri = `${process.env.MONGOOOSE_URI}/${process.env.DATABASE_NAME}`;

  try {
    await mongoose.connect(uri);
    console.log("Connected to MongoDB using Mongoose!");
  } catch (error) {
    console.error("Error connecting to MongoDB:", error.message);
    process.exit(1);
  }
};

module.exports = connectDatabase;
