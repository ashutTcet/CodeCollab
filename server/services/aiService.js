const MAX_CODE_LENGTH = 100000;
const MAX_ERROR_LENGTH = 30000;
const MAX_OUTPUT_LENGTH = 30000;
const MAX_QUESTION_LENGTH = 2000;
const MAX_MESSAGE_LENGTH = 4000;

function cleanJsonString(rawText) {
  if (!rawText || typeof rawText !== 'string') return '';
  let cleaned = rawText.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '');
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
  }
  return cleaned.trim();
}

function parseJsonSafe(rawText) {
  const cleaned = cleanJsonString(rawText);
  try {
    return JSON.parse(cleaned);
  } catch (err) {
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    throw new Error('AI returned an unparseable response.');
  }
}

function parseAndValidateExplainResponse(rawText) {
  const parsed = parseJsonSafe(rawText);

  if (typeof parsed !== 'object' || parsed === null) {
    throw new Error('AI response is not an object.');
  }

  return {
    explanation: String(parsed.explanation || 'No explanation provided.').trim(),
    cause: String(parsed.cause || 'The exact cause could not be determined.').trim(),
    fix: String(parsed.fix || 'Review the error output and inspect the corresponding lines in your code.').trim(),
    learningTip: String(parsed.learningTip || 'Always test your code with small examples as you build.').trim(),
  };
}

function parseAndValidateHintResponse(rawText) {
  const parsed = parseJsonSafe(rawText);

  if (typeof parsed !== 'object' || parsed === null) {
    throw new Error('AI response is not an object.');
  }

  return {
    concept: String(parsed.concept || 'Programming fundamentals').trim(),
    hint: String(parsed.hint || 'Review your code structure and logic carefully.').trim(),
    nextStep: String(parsed.nextStep || 'Try running the code with test inputs step by step.').trim(),
    learningTip: String(parsed.learningTip || 'Break complex problems into smaller manageable steps.').trim(),
  };
}

function parseAndValidateDebugResponse(rawText) {
  const parsed = parseJsonSafe(rawText);

  if (typeof parsed !== 'object' || parsed === null) {
    throw new Error('AI response is not an object.');
  }

  const rawBugs = Array.isArray(parsed.bugs) ? parsed.bugs : [];
  const normalizedBugs = rawBugs.map((bug) => {
    const severityRaw = String(bug.severity || 'medium').toLowerCase();
    const severity = ['low', 'medium', 'high'].includes(severityRaw) ? severityRaw : 'medium';

    return {
      type: String(bug.type || 'Logic').trim(),
      severity,
      location: String(bug.location || 'General').trim(),
      explanation: String(bug.explanation || 'Potential issue detected in this area.').trim(),
      suggestion: String(bug.suggestion || 'Review this section for correctness.').trim(),
    };
  });

  return {
    summary: String(parsed.summary || 'Code analysis completed.').trim(),
    bugs: normalizedBugs,
    overallSuggestion: String(parsed.overallSuggestion || 'Test your program with various edge cases to verify behavior.').trim(),
    learningTip: String(parsed.learningTip || 'Using print statements and structured testing helps isolate bugs quickly.').trim(),
  };
}

async function callProvider({ systemInstruction, userContent, parser }) {
  const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  const openAiKey = process.env.OPENAI_API_KEY;

  if (!geminiKey && !openAiKey) {
    const notConfiguredError = new Error(
      'AI service is not configured. Please set GEMINI_API_KEY or OPENAI_API_KEY in the server environment variables.'
    );
    notConfiguredError.status = 503;
    throw notConfiguredError;
  }

  if (geminiKey) {
    const targetModel = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(targetModel)}:generateContent?key=${encodeURIComponent(geminiKey)}`;

    const payload = {
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: `${systemInstruction}\n\n${userContent}`,
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.2,
        responseMimeType: 'application/json',
      },
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error?.message || `Gemini API returned status ${response.status}`;
      const error = new Error(`AI Service error: ${errorMessage}`);
      error.status = 502;
      throw error;
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      throw new Error('AI Service returned an empty response.');
    }

    return parser(text);
  }

  // OpenAI fallback
  const targetModel = process.env.OPENAI_MODEL || 'gpt-4o-mini';
  const url = 'https://api.openai.com/v1/chat/completions';

  const payload = {
    model: targetModel,
    messages: [
      { role: 'system', content: systemInstruction },
      { role: 'user', content: userContent },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.2,
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${openAiKey}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage = errorData.error?.message || `OpenAI API returned status ${response.status}`;
    const error = new Error(`AI Service error: ${errorMessage}`);
    error.status = 502;
    throw error;
  }

  const data = await response.json();
  const text = data.choices?.[0]?.message?.content;

  if (!text) {
    throw new Error('AI Service returned an empty response.');
  }

  return parser(text);
}

async function callProviderText({ systemInstruction, conversation = [], userContent }) {
  const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  const openAiKey = process.env.OPENAI_API_KEY;

  if (!geminiKey && !openAiKey) {
    const notConfiguredError = new Error(
      'AI service is not configured. Please set GEMINI_API_KEY or OPENAI_API_KEY in the server environment variables.'
    );
    notConfiguredError.status = 503;
    throw notConfiguredError;
  }

  // Limit conversation history to last 10 turns
  const recentHistory = Array.isArray(conversation)
    ? conversation.slice(-10).map((msg) => ({
        role: msg.role === 'assistant' ? 'assistant' : 'user',
        content: String(msg.content || '').slice(0, 3000),
      }))
    : [];

  if (geminiKey) {
    const targetModel = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(targetModel)}:generateContent?key=${encodeURIComponent(geminiKey)}`;

    const contents = [];

    if (recentHistory.length === 0) {
      contents.push({
        role: 'user',
        parts: [{ text: `${systemInstruction}\n\n${userContent}` }],
      });
    } else {
      contents.push({
        role: 'user',
        parts: [{ text: `System Context & Guidelines:\n${systemInstruction}` }],
      });
      contents.push({
        role: 'model',
        parts: [{ text: 'Understood. I will act as a patient, beginner-friendly coding tutor.' }],
      });

      for (const turn of recentHistory) {
        contents.push({
          role: turn.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: turn.content }],
        });
      }

      contents.push({
        role: 'user',
        parts: [{ text: userContent }],
      });
    }

    const payload = {
      contents,
      generationConfig: {
        temperature: 0.4,
      },
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error?.message || `Gemini API returned status ${response.status}`;
      const error = new Error(`AI Service error: ${errorMessage}`);
      error.status = 502;
      throw error;
    }

    const data = await response.json();
    const replyText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!replyText) {
      throw new Error('AI Service returned an empty response.');
    }

    return replyText.trim();
  }

  // OpenAI fallback
  const targetModel = process.env.OPENAI_MODEL || 'gpt-4o-mini';
  const url = 'https://api.openai.com/v1/chat/completions';

  const messages = [
    { role: 'system', content: systemInstruction },
    ...recentHistory.map((turn) => ({
      role: turn.role,
      content: turn.content,
    })),
    { role: 'user', content: userContent },
  ];

  const payload = {
    model: targetModel,
    messages,
    temperature: 0.4,
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${openAiKey}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage = errorData.error?.message || `OpenAI API returned status ${response.status}`;
    const error = new Error(`AI Service error: ${errorMessage}`);
    error.status = 502;
    throw error;
  }

  const data = await response.json();
  const replyText = data.choices?.[0]?.message?.content;

  if (!replyText) {
    throw new Error('AI Service returned an empty response.');
  }

  return replyText.trim();
}

// ─── 1. Explain Code Error ──────────────────────────────────────────────────

function buildExplainPrompt({ language, code, error, stdin, executionStatus }) {
  const truncatedCode = code.slice(0, MAX_CODE_LENGTH);
  const truncatedError = error.slice(0, MAX_ERROR_LENGTH);

  const systemInstruction = `You are a friendly, encouraging, and clear coding tutor for students in an educational collaborative IDE (CodeCollab).
A student executed their ${language} program and encountered an error or unexpected output.

Your goal is to explain the error in simple, beginner-friendly terms so the student understands what went wrong and how to fix it themselves.

IMPORTANT TUTOR RULES:
1. Explain what the compiler or runtime error actually means in plain, accessible language.
2. Identify the likely cause and reference the relevant line number or programming concept if present.
3. Explain how the student can fix the error. DO NOT blindly rewrite their entire program or provide a complete copy-paste solution. Keep code snippets minimal and focused only on the fix.
4. Provide a practical, encouraging learning tip to help them avoid similar mistakes in the future.
5. Do NOT invent errors that are not in the provided compiler/runtime output.
6. You MUST return ONLY a valid JSON object matching this exact schema:
{
  "explanation": "Beginner-friendly explanation of what the error message means",
  "cause": "Specific explanation of why this error happened in this code",
  "fix": "Clear steps or targeted small snippet on how to fix it",
  "learningTip": "Short tip or best practice for writing better code"
}`;

  const userContent = `STUDENT CODE (${language}):
\`\`\`${language}
${truncatedCode}
\`\`\`

COMPILER / RUNTIME ERROR OUTPUT:
\`\`\`
${truncatedError}
\`\`\`
${stdin ? `\nSTANDARD INPUT (STDIN):\n\`\`\`\n${stdin.slice(0, 5000)}\n\`\`\`` : ''}
${executionStatus ? `\nEXECUTION STATUS: ${executionStatus}` : ''}

Please analyze the error and provide your response in the specified JSON format.`;

  return { systemInstruction, userContent };
}

async function explainCodeError({ language, code, error, stdin, executionStatus }) {
  const { systemInstruction, userContent } = buildExplainPrompt({
    language,
    code,
    error,
    stdin,
    executionStatus,
  });

  return await callProvider({
    systemInstruction,
    userContent,
    parser: parseAndValidateExplainResponse,
  });
}

// ─── 2. Generate AI Hint ────────────────────────────────────────────────────

function buildHintPrompt({ language, code, error, stdin, userQuestion }) {
  const truncatedCode = code.slice(0, MAX_CODE_LENGTH);
  const truncatedError = (error || '').slice(0, MAX_ERROR_LENGTH);
  const truncatedQuestion = (userQuestion || '').slice(0, MAX_QUESTION_LENGTH);

  const systemInstruction = `You are a supportive, insightful coding tutor in an educational collaborative IDE (CodeCollab).
A student working with ${language} needs guidance on their code or assignment.

HINT RULES:
1. Provide PROGRESSIVE GUIDANCE rather than immediately revealing the complete code solution.
2. Identify the underlying programming concept (e.g. "Array indexing", "Recursion base case", "Variable scoping", "Pointer dereferencing").
3. Point toward the problematic logic or thinking process without giving away the full answer.
4. Give a clear, actionable next step for the student to try.
5. NEVER provide a full copy-paste rewritten solution.
6. Keep the tone encouraging, concise, and beginner-friendly.
7. Return strictly a valid JSON object with the following schema:
{
  "concept": "Core programming concept involved",
  "hint": "Helpful guiding hint pointing toward the solution",
  "nextStep": "Specific actionable next step for the student to test or write",
  "learningTip": "Short educational tip or rule of thumb"
}`;

  const userContent = `STUDENT CODE (${language}):
\`\`\`${language}
${truncatedCode}
\`\`\`
${truncatedError ? `\nRECENT ERROR / OUTPUT:\n\`\`\`\n${truncatedError}\n\`\`\`` : ''}
${stdin ? `\nSTDIN:\n\`\`\`\n${stdin.slice(0, 3000)}\n\`\`\`` : ''}
${truncatedQuestion ? `\nSTUDENT QUESTION / CONTEXT:\n"${truncatedQuestion}"` : ''}

Please generate an encouraging, progressive hint in the requested JSON format.`;

  return { systemInstruction, userContent };
}

async function generateHint({ language, code, error, stdin, userQuestion }) {
  const { systemInstruction, userContent } = buildHintPrompt({
    language,
    code,
    error,
    stdin,
    userQuestion,
  });

  return await callProvider({
    systemInstruction,
    userContent,
    parser: parseAndValidateHintResponse,
  });
}

// ─── 3. AI Debugger ─────────────────────────────────────────────────────────

function buildDebugPrompt({ language, code, error, output, stdin }) {
  const truncatedCode = code.slice(0, MAX_CODE_LENGTH);
  const truncatedError = (error || '').slice(0, MAX_ERROR_LENGTH);
  const truncatedOutput = (output || '').slice(0, MAX_OUTPUT_LENGTH);

  const systemInstruction = `You are an expert, meticulous code debugging assistant and educator in CodeCollab.
A student needs help debugging their ${language} program.

DEBUGGER RULES:
1. Inspect the code for potential syntax errors, runtime bugs, off-by-one errors, unhandled edge cases, logical flaws, or resource issues.
2. Prioritize actual compiler or runtime error messages when provided.
3. Clearly distinguish between confirmed errors (from compiler/runtime logs) and AI-inferred logic bugs.
4. For each detected bug, provide:
   - type: "Syntax" | "Logic" | "Runtime" | "Edge Case" | "Type Error" | "Resource"
   - severity: "low" | "medium" | "high"
   - location: Line number, function, or loop where the issue occurs
   - explanation: Clear reason why this causes an issue
   - suggestion: Focused suggestion on how to fix it
5. If no bugs are detected, bugs array should be empty ([]) and the summary should state the code looks structurally sound.
6. Do NOT rewrite the entire program.
7. Return strictly a valid JSON object matching this schema:
{
  "summary": "Brief 1-2 sentence overview of code status and issues found",
  "bugs": [
    {
      "type": "Logic",
      "severity": "high",
      "location": "Line 12 (for loop condition)",
      "explanation": "Explanation of the bug",
      "suggestion": "How to resolve it"
    }
  ],
  "overallSuggestion": "General advice on testing or structural improvement",
  "learningTip": "Key takeaway for debugging similar problems"
}`;

  const userContent = `STUDENT CODE (${language}):
\`\`\`${language}
${truncatedCode}
\`\`\`
${truncatedError ? `\nCOMPILER / RUNTIME ERROR LOGS:\n\`\`\`\n${truncatedError}\n\`\`\`` : ''}
${truncatedOutput ? `\nPROGRAM OUTPUT:\n\`\`\`\n${truncatedOutput}\n\`\`\`` : ''}
${stdin ? `\nSTDIN:\n\`\`\`\n${stdin.slice(0, 3000)}\n\`\`\`` : ''}

Please analyze the code for bugs and return the structured debugging report in JSON format.`;

  return { systemInstruction, userContent };
}

async function debugCode({ language, code, error, output, stdin }) {
  const { systemInstruction, userContent } = buildDebugPrompt({
    language,
    code,
    error,
    output,
    stdin,
  });

  return await callProvider({
    systemInstruction,
    userContent,
    parser: parseAndValidateDebugResponse,
  });
}

// ─── 4. AI Tutor Chat ───────────────────────────────────────────────────────

function buildTutorChatPrompt({ message, language, code, error, output, stdin }) {
  const truncatedCode = (code || '').slice(0, MAX_CODE_LENGTH);
  const truncatedError = (error || '').slice(0, MAX_ERROR_LENGTH);
  const truncatedOutput = (output || '').slice(0, MAX_OUTPUT_LENGTH);
  const truncatedMessage = (message || '').slice(0, MAX_MESSAGE_LENGTH);

  const systemInstruction = `You are a supportive, patient, and expert coding tutor in an educational live coding classroom (CodeCollab).
You are answering a student's questions regarding their program in a conversational format.

TUTOR GUIDELINES:
1. Explain programming concepts in friendly, clear language tailored to students and beginners.
2. Use the student's current code, selected programming language (${language}), and any execution logs/errors as direct context to answer.
3. If the student asks why something is happening, explain the underlying logic and concepts clearly.
4. Prefer guiding explanations, targeted pointers, and small focused code snippets over blindly generating full copy-paste solutions, unless the student explicitly asks for the full code.
5. If the student refers to previous turns or ideas (e.g., "explain step 2"), use the conversation history to provide seamless context.
6. Clearly distinguish between confirmed compiler/runtime errors (from the logs) and AI-inferred logic/runtime possibilities.
7. Format code snippets using proper markdown backticks and language tags.`;

  const userContent = `STUDENT'S ACTIVE CODE (${language}):
\`\`\`${language}
${truncatedCode}
\`\`\`
${truncatedError ? `\nLATEST EXECUTION ERROR:\n\`\`\`\n${truncatedError}\n\`\`\`` : ''}
${truncatedOutput ? `\nLATEST PROGRAM OUTPUT:\n\`\`\`\n${truncatedOutput}\n\`\`\`` : ''}
${stdin ? `\nSTDIN:\n\`\`\`\n${stdin.slice(0, 3000)}\n\`\`\`` : ''}

STUDENT'S QUESTION / MESSAGE:
${truncatedMessage}`;

  return { systemInstruction, userContent };
}

async function generateTutorResponse({ message, language, code, error, output, stdin, conversation = [] }) {
  const { systemInstruction, userContent } = buildTutorChatPrompt({
    message,
    language,
    code,
    error,
    output,
    stdin,
  });

  return await callProviderText({
    systemInstruction,
    conversation,
    userContent,
  });
}

module.exports = {
  explainCodeError,
  generateHint,
  debugCode,
  generateTutorResponse,
  MAX_CODE_LENGTH,
  MAX_ERROR_LENGTH,
  MAX_OUTPUT_LENGTH,
  MAX_QUESTION_LENGTH,
  MAX_MESSAGE_LENGTH,
};
