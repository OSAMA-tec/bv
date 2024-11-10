export default () => ({
  port: parseInt(process.env.PORT, 10) || 3000,
  nodeEnv: process.env.NODE_ENV,
  database: {
    uri: process.env.MONGODB_URI,
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN,
  },
  firebase: {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY,
  },
  blockchain: {
    network: process.env.BLOCKCHAIN_NETWORK,
    contractAddress: process.env.CONTRACT_ADDRESS,
    privateKey: process.env.PRIVATE_KEY,
  },
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
  },
  ipfs: {
    projectId: process.env.IPFS_PROJECT_ID,
    projectSecret: process.env.IPFS_PROJECT_SECRET,
    jwtToken: process.env.IPFS_JWT_TOKEN,
  },
});
