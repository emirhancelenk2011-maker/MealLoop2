const { fixture } = require('./helpers');
module.exports = async () => {
  const env = await fixture(3101);
  return () => env.close();
};
