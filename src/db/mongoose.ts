import { ServerApiVersion } from "mongodb";
import mongoose from "mongoose";
import envs from "../common/envs";

mongoose.set("strictQuery", false);

const connectionURL = `${envs.baseConnectionURL}/${envs.databaseName}`;

export const connectToDB = () => {
  mongoose.connect(connectionURL);
};
