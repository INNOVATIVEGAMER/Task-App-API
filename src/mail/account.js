const sgMail = require("@sendgrid/mail");

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendWelcomeMail = (name, email) => {
	const welcomeMail = {
		to: email,
		from: "prasadpatewar39@gmail.com",
		subject: "Welcome to our app",
		text: `Thank you for joining our app ${name}`,
	};

	sgMail
		.send(welcomeMail)
		.then(() => console.log("Welcome Email Sent"))
		.catch((err) => console.log(err));
};

const sendAccountDeleteMail = (name, email) => {
	const accountDeleteMail = {
		to: email,
		from: "prasadpatewar39@gmail.com",
		subject: "Account deleted",
		text: `Sorry for your inconvience. ${name} hope you liked our app.`,
	};

	sgMail
		.send(accountDeleteMail)
		.then(() => console.log("Account delete Email Sent"))
		.catch((err) => console.log(err));
};

module.exports = { sendWelcomeMail, sendAccountDeleteMail };
