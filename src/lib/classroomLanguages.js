import classroomLanguageConfig from '../../shared/classroomLanguageConfig.json';

const SUBJECT_ALIASES = {
  c: 'C',
  'c++': 'C++',
  cpp: 'C++',
  java: 'Java',
  python: 'Python',
  javascript: 'JavaScript',
};

export const SUPPORTED_CLASSROOM_SUBJECTS = Object.freeze(Object.keys(classroomLanguageConfig));

export function normalizeClassroomSubject(value) {
  const raw = String(value || '').trim();
  if (!raw) {
    return null;
  }

  if (classroomLanguageConfig[raw]) {
    return raw;
  }

  return SUBJECT_ALIASES[raw.toLowerCase()] || null;
}

export function getClassroomLanguageConfig(subject) {
  const normalized = normalizeClassroomSubject(subject);
  if (!normalized) {
    return null;
  }

  return classroomLanguageConfig[normalized] || null;
}

export function getMonacoLanguage(subject) {
  return getClassroomLanguageConfig(subject)?.monacoLanguage || 'javascript';
}

export function getStarterTemplate(subject) {
  return getClassroomLanguageConfig(subject)?.starterTemplate || classroomLanguageConfig.JavaScript.starterTemplate;
}

export function listClassroomSubjects() {
  return SUPPORTED_CLASSROOM_SUBJECTS.map((subject) => ({
    key: subject,
    label: subject,
    monacoLanguage: classroomLanguageConfig[subject].monacoLanguage,
  }));
}
