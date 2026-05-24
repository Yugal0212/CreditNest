const SUPPORTED_LANGUAGES = ['en', 'hi', 'gu'];

const normalizeLanguage = (value) => {
  if (!value) return 'en';
  const raw = String(value).trim().toLowerCase();
  const token = raw.split(',')[0];
  const base = token.split('-')[0];
  return SUPPORTED_LANGUAGES.includes(base) ? base : 'en';
};

const languageMiddleware = (req, _res, next) => {
  const headerValue = req.headers['x-language'] || req.headers['x-lang'] || req.headers['accept-language'];
  const lang = normalizeLanguage(headerValue);
  req.lang = lang;
  req.language = lang;
  next();
};

module.exports = {
  SUPPORTED_LANGUAGES,
  languageMiddleware,
  normalizeLanguage,
};
