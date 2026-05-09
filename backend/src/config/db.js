const mongoose = require('mongoose');
const dns = require('dns');

const connectDb = async () => {
  dns.setServers(['8.8.8.8', '8.8.4.4']);

  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/telemedicine';
  const options = {
    useNewUrlParser: true,
    useUnifiedTopology: true
  };

  const connection = await mongoose.connect(uri, options);
  console.log(`MongoDB connected: ${connection.connection.host}`);
  return connection;
};

module.exports = connectDb;
