const LANGUAGE_CONFIG = {
  javascript: {
    key: 'javascript',
    label: 'JavaScript',
    monacoLanguage: 'javascript',
    judge0LanguageId: 63,
  },
  cpp: {
    key: 'cpp',
    label: 'C++',
    monacoLanguage: 'cpp',
    judge0LanguageId: 54,
  },
  python: {
    key: 'python',
    label: 'Python',
    monacoLanguage: 'python',
    judge0LanguageId: 71,
  },
  java: {
    key: 'java',
    label: 'Java',
    monacoLanguage: 'java',
    judge0LanguageId: 62,
  },
};

function getExecutionLanguage(language) {
  const normalized = String(language || '').trim().toLowerCase();
  return LANGUAGE_CONFIG[normalized] || null;
}

function listExecutionLanguages() {
  return Object.values(LANGUAGE_CONFIG).map((language) => ({
    key: language.key,
    label: language.label,
    monacoLanguage: language.monacoLanguage,
  }));
}

module.exports = {
  LANGUAGE_CONFIG,
  getExecutionLanguage,
  listExecutionLanguages,
};
