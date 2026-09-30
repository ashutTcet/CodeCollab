const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:8080';
const API_BASE = `${BASE_URL}/api`;

async function request(path, { method = 'GET', token, body } = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await response.json().catch(() => ({}));
  return { status: response.status, data };
}

async function registerUser({ name, email, role }) {
  const password = 'Password123!';
  const result = await request('/auth/register', {
    method: 'POST',
    body: { name, email, role, password, confirmPassword: password },
  });

  if (result.status !== 201) {
    throw new Error(`User registration failed for ${email}: ${result.data.message || result.status}`);
  }

  return result.data;
}

async function expectStatus(label, promise, expected) {
  const result = await promise;
  if (result.status !== expected) {
    throw new Error(`${label} expected HTTP ${expected} but got ${result.status}: ${result.data.message || 'Unknown error'}`);
  }
  return result;
}

async function main() {
  const stamp = Date.now();

  const teacher = await registerUser({
    name: 'Teacher P5',
    email: `teacher.p5.${stamp}@test.local`,
    role: 'teacher',
  });

  const student = await registerUser({
    name: 'Student P5',
    email: `student.p5.${stamp}@test.local`,
    role: 'student',
  });

  const outsider = await registerUser({
    name: 'Outsider P5',
    email: `outsider.p5.${stamp}@test.local`,
    role: 'student',
  });

  const classroom = await expectStatus(
    'create classroom',
    request('/classrooms', {
      method: 'POST',
      token: teacher.token,
      body: {
        name: 'Phase 5 Execution Room',
        subject: 'Compiler Tests',
        description: 'Phase 5 execution test room',
      },
    }),
    201
  );

  await expectStatus(
    'student join classroom',
    request('/classrooms/join', {
      method: 'POST',
      token: student.token,
      body: { roomCode: classroom.data.classroom.roomCode },
    }),
    200
  );

  await expectStatus('execution languages auth', request('/code/languages', { token: teacher.token }), 200);
  await expectStatus('execution languages unauth', request('/code/languages'), 401);

  await expectStatus(
    'execute empty code',
    request('/code/execute', {
      method: 'POST',
      token: teacher.token,
      body: {
        classroomId: classroom.data.classroom.id,
        language: 'javascript',
        sourceCode: '   ',
        stdin: '',
      },
    }),
    400
  );

  await expectStatus(
    'execute invalid language',
    request('/code/execute', {
      method: 'POST',
      token: teacher.token,
      body: {
        classroomId: classroom.data.classroom.id,
        language: 'go',
        sourceCode: 'fmt.Println("test")',
        stdin: '',
      },
    }),
    400
  );

  await expectStatus(
    'execute unauthorized user',
    request('/code/execute', {
      method: 'POST',
      token: outsider.token,
      body: {
        classroomId: classroom.data.classroom.id,
        language: 'javascript',
        sourceCode: 'console.log("test")',
        stdin: '',
      },
    }),
    403
  );

  await expectStatus(
    'execute unauthenticated user',
    request('/code/execute', {
      method: 'POST',
      body: {
        classroomId: classroom.data.classroom.id,
        language: 'javascript',
        sourceCode: 'console.log("test")',
        stdin: '',
      },
    }),
    401
  );

  const languageRuns = [
    {
      name: 'cpp accepted',
      language: 'cpp',
      sourceCode: '#include <iostream>\nusing namespace std;\nint main(){ cout << "CPP_OK"; return 0; }',
      expectedStatus: 'accepted',
    },
    {
      name: 'python accepted',
      language: 'python',
      sourceCode: 'print("PY_OK")',
      expectedStatus: 'accepted',
    },
    {
      name: 'javascript accepted',
      language: 'javascript',
      sourceCode: 'console.log("JS_OK")',
      expectedStatus: 'accepted',
    },
    {
      name: 'java accepted',
      language: 'java',
      sourceCode: 'public class Main { public static void main(String[] args) { System.out.print("JAVA_OK"); } }',
      expectedStatus: 'accepted',
    },
    {
      name: 'compilation error',
      language: 'cpp',
      sourceCode: '#include <iostream>\nint main(){ std::cout << "oops" return 0; }',
      expectedStatus: 'compilation_error',
    },
    {
      name: 'runtime error',
      language: 'python',
      sourceCode: 'raise RuntimeError("boom")',
      expectedStatus: 'runtime_error',
    },
    {
      name: 'time limit exceeded',
      language: 'python',
      sourceCode: 'while True:\n    pass',
      expectedStatus: 'time_limit_exceeded',
    },
  ];

  const runResults = [];
  let executionServiceAvailable = true;

  for (const testCase of languageRuns) {
    const result = await request('/code/execute', {
      method: 'POST',
      token: student.token,
      body: {
        classroomId: classroom.data.classroom.id,
        language: testCase.language,
        sourceCode: testCase.sourceCode,
        stdin: '',
      },
    });

    if (result.status === 503 || result.status === 502) {
      executionServiceAvailable = false;
      runResults.push(`${testCase.name}=service_unavailable`);
      break;
    }

    if (result.status !== 200) {
      throw new Error(`${testCase.name} failed with HTTP ${result.status}: ${result.data.message || 'Unknown error'}`);
    }

    const actual = result.data.status;
    runResults.push(`${testCase.name}=${actual}`);

    if (actual !== testCase.expectedStatus) {
      throw new Error(`${testCase.name} expected ${testCase.expectedStatus} but got ${actual}`);
    }
  }

  console.log('PHASE5_EXECUTION_TEST_SUMMARY');
  console.log(`classroomId=${classroom.data.classroom.id}`);
  console.log(`executionServiceAvailable=${executionServiceAvailable}`);
  runResults.forEach((entry) => console.log(entry));
}

main().catch((error) => {
  console.error('PHASE5_EXECUTION_TEST_FAILED');
  console.error(error.message);
  process.exit(1);
});
