const { SUPPORTED_LANGUAGES } = require('../middleware/language.middleware');

const getLocalizedValue = (lang, values) => {
  const safeLang = SUPPORTED_LANGUAGES.includes(lang) ? lang : 'en';
  const lookup = {
    en: values.en,
    hi: values.hi,
    gu: values.gu,
  };

  return (
    lookup[safeLang] ||
    lookup.en ||
    values.fallback ||
    ''
  );
};

module.exports = {
  getLocalizedValue,
};
