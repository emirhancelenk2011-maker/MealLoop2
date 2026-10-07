const messages = require('../shared/errors.json');
function errorPayload(message, language) {
  const code = messages[message] ? message : 'server_error';
  const locale = /^(uz|ru|en)(?:-|,|;|$)/i.exec(language || '')?.[1]?.toLowerCase() || 'uz';
  return { code, error: messages[code][locale] };
}
module.exports = { errorPayload };
