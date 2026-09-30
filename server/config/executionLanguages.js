const { classroomLanguageConfig, normalizeClassroomSubject } = require('./classroomLanguages');

const LANGUAGE_CONFIG = Object.fromEntries(
  Object.entries(classroomLanguageConfig).map(([subject, config]) => [
    subject,
    {
      key: subject,
      label: config.displayName,
      monacoLanguage: config.monacoLanguage,
      judge0LanguageId: config.judge0LanguageId,
    },
  ])
);

function getExecutionLanguage(language) {
  const normalized = normalizeClassroomSubject(language);
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
