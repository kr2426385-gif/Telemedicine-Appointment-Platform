const app = require('../src/app');
const connectDb = require('../src/config/db');

let dbConnection;

function setCorsHeaders(req, res) {
  const origin = req.headers.origin || '*';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  res.setHeader('Access-Control-Max-Age', '86400');
}

module.exports = async (req, res) => {
  setCorsHeaders(req, res);

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    return res.end();
  }

  try {
    if (!dbConnection) {
      dbConnection = connectDb();
    }

    await dbConnection;
    return app(req, res);
  } catch (error) {
    console.error('API startup error:', error);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({
      message: 'Backend failed to start. Check MONGODB_URI and JWT_SECRET in Vercel environment variables.'
    }));
  }
};
