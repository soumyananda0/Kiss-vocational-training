// Vercel serverless entry point: wraps the Express app.
const app = require('../backend/src/server');

module.exports = async (req, res) => {
  await app.ready;
  return app(req, res);
};
