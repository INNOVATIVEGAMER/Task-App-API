const { ServerApiVersion } = require("mongodb");
const mongoose = require("mongoose");
const validator = require("validator");

mongoose.set("strictQuery", false);

const baseConnectionURL = process.env.MONGODB_BASECONNECTION_URL;
const databaseName = process.env.MONGODB_DATABASE_NAME;

const connectionURL = `${baseConnectionURL}/${databaseName}`;

const connectToDB = () => {
  mongoose.connect(connectionURL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverApi: ServerApiVersion.v1,
  });
};

module.exports = { connectToDB };
