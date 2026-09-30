const classroomLanguageConfig = require('../../shared/classroomLanguageConfig.json');

const SUBJECT_ALIASES = {
  c: 'C',
  'c++': 'C++',
  cpp: 'C++',
  java: 'Java',
  python: 'Python',
  javascript: 'JavaScript',
};

const SUPPORTED_CLASSROOM_SUBJECTS = Object.freeze(Object.keys(classroomLanguageConfig));

function normalizeClassroomSubject(value) {
  const raw = String(value || '').trim();
  if (!raw) {
    return null;
  }

  if (classroomLanguageConfig[raw]) {
    return raw;
  }

  const alias = SUBJECT_ALIASES[raw.toLowerCase()];
  return alias || null;
}

function getClassroomLanguageConfig(subject) {
  const normalized = normalizeClassroomSubject(subject);
  if (!normalized) {
    return null;
  }

  return classroomLanguageConfig[normalized] || null;
}

function getMonacoLanguage(subject) {
  return getClassroomLanguageConfig(subject)?.monacoLanguage || 'javascript';
}

function getJudge0LanguageId(subject) {
  return getClassroomLanguageConfig(subject)?.judge0LanguageId || null;
}

function getStarterTemplate(subject) {
  return getClassroomLanguageConfig(subject)?.starterTemplate || classroomLanguageConfig.JavaScript.starterTemplate;
}

function listSupportedClassroomSubjects() {
  return SUPPORTED_CLASSROOM_SUBJECTS.map((subject) => ({
    key: subject,
    label: subject,
    monacoLanguage: classroomLanguageConfig[subject].monacoLanguage,
  }));
}

module.exports = {
  classroomLanguageConfig,
  SUPPORTED_CLASSROOM_SUBJECTS,
  normalizeClassroomSubject,
  getClassroomLanguageConfig,
  getMonacoLanguage,
  getJudge0LanguageId,
  getStarterTemplate,
  listSupportedClassroomSubjects,
};
