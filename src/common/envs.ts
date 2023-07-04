const getENVS = () => {
  const port = process.env.PORT;
  const baseConnectionURL = process.env.MONGODB_BASECONNECTION_URL;
  const databaseName = process.env.MONGODB_DATABASE_NAME;
  const jwtSecret = process.env.JWT_SECRET;
  const googleClientId = process.env.GOOGLE_CLIENT_ID;
  const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const googleRedirectURL = process.env.GOOGLE_REDIRECT_URL;

  if (!port) throw new Error("Port not defined");
  if (!baseConnectionURL) throw new Error("baseConnectionURL not defined");
  if (!databaseName) throw new Error("databaseName not defined");
  if (!jwtSecret) throw new Error("jwtSecret not defined");
  if (!googleClientId) throw new Error("googleClientId not defined");
  if (!googleClientSecret) throw new Error("googleClientSecret not defined");
  if (!googleRedirectURL) throw new Error("googleRedirectURL not defined");

  return {
    port,
    baseConnectionURL,
    databaseName,
    jwtSecret,
    googleClientId,
    googleClientSecret,
    googleRedirectURL,
  };
};

export default getENVS();
