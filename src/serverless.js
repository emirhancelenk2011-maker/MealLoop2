const { createApp } = require('./app');
const { migrate } = require('./database');
const { errorPayload } = require('./errors');

function createServerlessHandler(pool, { initialize = migrate, ...options } = {}) {
  const app = createApp(pool, options);
  let ready;
  return async (req, res) => {
    try {
      // Share initialization between simultaneous cold-start requests.
      // A failed connection can recover on the next request.
      if (!ready) ready = Promise.resolve().then(() => initialize(pool)).catch(error => { ready = undefined; throw error; });
      await ready;
    } catch (error) {
      console.error('PostgreSQL initialization failed. Check DATABASE_URL and database access:', error.code || error.name);
      res.setHeader('Cache-Control', 'no-store');
      res.statusCode = 503;
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify(errorPayload('server_error', req.headers['accept-language'])));
    }
    return app(req, res);
  };
}

module.exports = { createServerlessHandler };
