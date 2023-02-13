const express = require("express");
const { connectToDB } = require("../src/db/mongoose");
const userRouter = require("../src/Routers/userRouter");
const taskRouter = require("../src/Routers/taskRouter");
const cors = require("cors");

//Connect to database
connectToDB();

//Create configure express app
const port = process.env.PORT;
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
    optionSuccessStatus: 200,
  })
);

//Attach routers to express server
app.use(userRouter);
app.use(taskRouter);

//Start the server on port
app.listen(port, () => {
  console.log("Server is up and running on port " + port);
});

module.exports = app;
