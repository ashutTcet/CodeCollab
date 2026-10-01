export const API_BASE_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
export const SOCKET_BASE_URL = API_BASE_URL.replace(/\/api\/?$/, '');

async function request(path, options = {}) {
  const { headers: optionHeaders, ...restOptions } = options;

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      credentials: 'include',
      ...restOptions,
      headers: {
        'Content-Type': 'application/json',
        ...(optionHeaders || {}),
      },
    });
  } catch (networkError) {
    throw new Error(
      'Unable to connect to the server. Please check that the backend is running.'
    );
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || 'Request failed');
  }

  return data;
}

export const api = {
  register(payload) {
    return request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  login(payload) {
    return request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  me() {
    return request('/auth/me');
  },

  logout() {
    return request('/auth/logout', {
      method: 'POST',
    });
  },

  getStudentDashboard() {
    return request('/student/dashboard');
  },

  getTeacherDashboard() {
    return request('/teacher/dashboard');
  },

  createClassroom(payload) {
    return request('/classrooms', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  getTeacherClassrooms() {
    return request('/classrooms/teacher');
  },

  joinClassroom(payload) {
    return request('/classrooms/join', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  getStudentClassrooms() {
    return request('/classrooms/student');
  },

  getClassroomDetails(id) {
    return request(`/classrooms/${id}`);
  },

  getClassroomStudents(id) {
    return request(`/classrooms/${id}/students`);
  },

  deleteClassroom(id) {
    return request(`/classrooms/${id}`, {
      method: 'DELETE',
    });
  },

  getClassroomProgress(classroomId) {
    return request(`/classrooms/${classroomId}/progress`);
  },

  getClassroomStudentProgress(classroomId, studentId) {
    return request(`/classrooms/${classroomId}/progress/${studentId}`);
  },

  getClassroomMessages(classroomId, options = {}) {
    const params = new URLSearchParams();
    if (options.limit) {
      params.set('limit', String(options.limit));
    }
    if (options.before) {
      params.set('before', String(options.before));
    }

    const query = params.toString();
    const suffix = query ? `?${query}` : '';
    return request(`/classrooms/${classroomId}/messages${suffix}`);
  },

  getLivekitToken(payload) {
    return request('/livekit/token', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  getMyProgress() {
    return request('/progress');
  },

  getMyProgressForLanguage(language) {
    return request(`/progress/${encodeURIComponent(language)}`);
  },

  getExecutionLanguages() {
    return request('/code/languages');
  },

  executeCode(payload) {
    return request('/code/execute', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  explainError(payload) {
    return request('/ai/explain', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  getAIHint(payload) {
    return request('/ai/hint', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  debugWithAI(payload) {
    return request('/ai/debug', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  chatWithAI(payload) {
    return request('/ai/chat', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
};
