// Re-exported for optional standalone use; server.js connects directly via mongoose.connect
const mongoose = require('mongoose');

const connectDB = async () => {
  const conn = await mongoose.connect(process.env.MONGO_URI);
  return conn;
};

module.exports = connectDB;
