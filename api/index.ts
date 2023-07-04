import express from "express";
import { connectToDB } from "../src/db/mongoose";
import userRouter from "../src/Routers/userRouter";
import taskRouter from "../src/Routers/taskRouter";
import cors from "cors";
import envs from "../src/common/envs";

//Connect to database
connectToDB();

//Create configure express app
const app = express();

// Add express middlewares
// //Site maintainance middleware
// app.use((req, res, next) => {
// 	res.status(503).send(
// 		"Site is under maintainance, Please check back soon :)"
// 	);
// });

//Add json body to response object
app.use(express.json());

// Using cors
app.use(
  cors({
    origin: "*",
    credentials: true, //access-control-allow-credentials:true
  })
);

//Attach routers to express server
app.use(userRouter);
app.use(taskRouter);

//Start the server on port
app.listen(envs.port, () => {
  console.log("Server is up and running on port " + envs.port);
});

export default app;
