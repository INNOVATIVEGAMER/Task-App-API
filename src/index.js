const express = require("express");
const { connectToDB } = require("./db/mongoose");
const userRouter = require("./Routers/userRouter");
const taskRouter = require("./Routers/taskRouter");

const startApp = async () => {
	try {
		//Connect to database
		await connectToDB();

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

		//Attach routers to express server
		app.use(userRouter);
		app.use(taskRouter);

		//Start the server on port
		app.listen(port, () => {
			console.log("Server is up and running on port " + port);
		});
	} catch (error) {
		console.log(error);
	}
};

startApp();
