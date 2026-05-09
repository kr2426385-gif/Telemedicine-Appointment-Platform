const app = require('../src/app');
const connectDb = require('../src/config/db');

let dbConnection;

module.exports = async (req, res) => {
  if (!dbConnection) {
    dbConnection = connectDb();
  }

  await dbConnection;
  return app(req, res);
};
