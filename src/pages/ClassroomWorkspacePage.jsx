import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import { io } from 'socket.io-client';
import * as Y from 'yjs';
import '@livekit/components-styles';
import { api, SOCKET_BASE_URL } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import CommunicationPanel from '../components/communication/CommunicationPanel';

const MAX_CLASSROOM_CHAT_LENGTH = 2000;

const FALLBACK_LANGUAGES = [
  { key: 'javascript', label: 'JavaScript', monacoLanguage: 'javascript' },
  { key: 'python', label: 'Python', monacoLanguage: 'python' },
  { key: 'java', label: 'Java', monacoLanguage: 'java' },
  { key: 'cpp', label: 'C++', monacoLanguage: 'cpp' },
  { key: 'c', label: 'C', monacoLanguage: 'c' },
];

const MONACO_LANGUAGE_MAP = {
  javascript: 'javascript',
  python: 'python',
  java: 'java',
  cpp: 'cpp',
  c: 'c',
};

const STARTER_TEMPLATES = {
  javascript: `function main() {\n  console.log("Hello CodeCollab!");\n}\n\nmain();\n`,
  python: `def main():\n    print("Hello CodeCollab!")\n\nif __name__ == "__main__":\n    main()\n`,
  java: `public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello CodeCollab!");\n    }\n}\n`,
  cpp: `#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "Hello CodeCollab!" << endl;\n    return 0;\n}\n`,
  c: `#include <stdio.h>\n\nint main() {\n    printf("Hello CodeCollab!\\n");\n    return 0;\n}\n`,
};

function isStarterTemplate(content) {
  const trimmed = (content || '').trim();
  if (!trimmed) return true;
  return Object.values(STARTER_TEMPLATES).some((t) => t.trim() === trimmed);
}

function normalizeIncomingBinary(input) {
  if (!input) {
    return null;
  }

  if (input instanceof Uint8Array) {
    return input;
  }

  if (Array.isArray(input)) {
    return Uint8Array.from(input);
  }

  if (input.type === 'Buffer' && Array.isArray(input.data)) {
    return Uint8Array.from(input.data);
  }

  if (input instanceof ArrayBuffer) {
    return new Uint8Array(input);
  }

  return null;
}

function hashColorIndex(id) {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  }
  return hash % 8;
}

function getStatusClass(status) {
  if (status === 'accepted') return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  if (status === 'running') return 'border-sky-200 bg-sky-50 text-sky-700';
  if (status === 'ready') return 'border-slate-300 bg-slate-50 text-slate-700';
  return 'border-rose-200 bg-rose-50 text-rose-700';
}

function getEditorLanguage(language) {
  return MONACO_LANGUAGE_MAP[language] || 'javascript';
}

export default function ClassroomWorkspacePage() {
  const { id: classroomId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [classroom, setClassroom] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [loading, setLoading] = useState(true);
  const [socketError, setSocketError] = useState('');
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const [language, setLanguage] = useState('javascript');
  const [executionLanguages, setExecutionLanguages] = useState(FALLBACK_LANGUAGES);
  const [participants, setParticipants] = useState([]);

  const [stdin, setStdin] = useState('');
  const [activeTerminalTab, setActiveTerminalTab] = useState('output');
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionResult, setExecutionResult] = useState(null);
  const [executionStatus, setExecutionStatus] = useState({ key: 'ready', label: 'Ready' });
  const [executionServiceError, setExecutionServiceError] = useState('');
  const [aiMode, setAiMode] = useState('explain');
  const [aiExplanation, setAiExplanation] = useState(null);
  const [aiHint, setAiHint] = useState(null);
  const [aiDebug, setAiDebug] = useState(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiLoadingAction, setAiLoadingAction] = useState(null);
  const [aiError, setAiError] = useState('');
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatSending, setIsChatSending] = useState(false);
  const [chatError, setChatError] = useState('');
  const [communicationTab, setCommunicationTab] = useState('chat');
  const [classroomMessages, setClassroomMessages] = useState([]);
  const [classroomChatInput, setClassroomChatInput] = useState('');
  const [classroomChatSending, setClassroomChatSending] = useState(false);
  const [classroomChatError, setClassroomChatError] = useState('');
  const [classroomChatLoading, setClassroomChatLoading] = useState(true);
  const [classroomChatLoadError, setClassroomChatLoadError] = useState('');
  const [typingUsers, setTypingUsers] = useState([]);
  const [chatPresence, setChatPresence] = useState([]);
  const [isInCall, setIsInCall] = useState(false);
  const [isJoiningCall, setIsJoiningCall] = useState(false);
  const [callMode, setCallMode] = useState('audio');
  const [callError, setCallError] = useState('');
  const [livekitToken, setLivekitToken] = useState('');
  const [livekitServerUrl, setLivekitServerUrl] = useState('');
  const [livekitParticipantIds, setLivekitParticipantIds] = useState([]);

  const editorRef = useRef(null);
  const monacoRef = useRef(null);
  const socketRef = useRef(null);
  const ydocRef = useRef(null);
  const yTextRef = useRef(null);
  const yUpdateHandlerRef = useRef(null);
  const selectionListenerRef = useRef(null);
  const modelListenerRef = useRef(null);
  const yTextObserverRef = useRef(null);
  const decorationIdsRef = useRef([]);
  const isApplyingRemoteRef = useRef(false);
  const cursorSentAtRef = useRef(0);
  const joinedRef = useRef(false);
  const pendingSyncUpdateRef = useRef(null);
  const pendingSyncLanguageRef = useRef('javascript');
  const chatEndRef = useRef(null);
  const typingStopTimerRef = useRef(null);

  const currentUserId = user?.id || null;

  const meRoleDashboardPath = useMemo(() => {
    if (user?.role === 'teacher') {
      return '/teacher/dashboard';
    }
    return '/student/dashboard';
  }, [user?.role]);

  const isConnected = connectionStatus === 'connected';

  const applyRemoteCursorDecorations = useCallback(
    (nextParticipants) => {
      const editor = editorRef.current;
      const monaco = monacoRef.current;
      if (!editor || !monaco) {
        return;
      }

      const remoteParticipants = nextParticipants.filter(
        (participant) => participant.userId !== currentUserId && participant.cursor
      );

      const decorations = remoteParticipants.map((participant) => {
        const index = hashColorIndex(participant.userId);
        const range = new monaco.Range(
          participant.cursor.startLineNumber,
          participant.cursor.startColumn,
          participant.cursor.endLineNumber,
          participant.cursor.endColumn
        );

        return {
          range,
          options: {
            className: `cc-remote-line cc-remote-line-${index}`,
            beforeContentClassName: `cc-remote-caret cc-remote-caret-${index}`,
            after: {
              content: ` ${participant.name}`,
              inlineClassName: `cc-remote-label cc-remote-label-${index}`,
            },
            stickiness: monaco.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges,
            hoverMessage: {
              value: `${participant.name} (${participant.cursor.startLineNumber}:${participant.cursor.startColumn})`,
            },
          },
        };
      });

      decorationIdsRef.current = editor.deltaDecorations(decorationIdsRef.current, decorations);
    },
    [currentUserId]
  );

  const bindYjsToEditor = useCallback(
    (syncUpdate, syncedLanguage) => {
      const editor = editorRef.current;
      const monaco = monacoRef.current;
      if (!editor || !monaco || !syncUpdate) {
        pendingSyncUpdateRef.current = syncUpdate;
        pendingSyncLanguageRef.current = syncedLanguage || 'javascript';
        return;
      }

      if (selectionListenerRef.current) {
        selectionListenerRef.current.dispose();
        selectionListenerRef.current = null;
      }

      if (modelListenerRef.current) {
        modelListenerRef.current.dispose();
        modelListenerRef.current = null;
      }

      if (yTextRef.current && yTextObserverRef.current) {
        yTextRef.current.unobserve(yTextObserverRef.current);
        yTextObserverRef.current = null;
      }

      if (ydocRef.current && yUpdateHandlerRef.current) {
        ydocRef.current.off('update', yUpdateHandlerRef.current);
      }

      if (ydocRef.current) {
        ydocRef.current.destroy();
      }

      const ydoc = new Y.Doc();
      const yText = ydoc.getText('code');
      Y.applyUpdate(ydoc, syncUpdate, 'initial-sync');

      const model = monaco.editor.createModel(yText.toString(), getEditorLanguage(syncedLanguage));
      editor.setModel(model);

      const applyDeltaToModel = (delta) => {
        let cursorOffset = 0;
        const edits = [];

        delta.forEach((entry) => {
          if (entry.retain) {
            cursorOffset += entry.retain;
            return;
          }

          if (entry.delete) {
            const start = model.getPositionAt(cursorOffset);
            const end = model.getPositionAt(cursorOffset + entry.delete);
            edits.push({
              range: new monaco.Range(start.lineNumber, start.column, end.lineNumber, end.column),
              text: '',
            });
            return;
          }

          if (typeof entry.insert === 'string') {
            const start = model.getPositionAt(cursorOffset);
            edits.push({
              range: new monaco.Range(start.lineNumber, start.column, start.lineNumber, start.column),
              text: entry.insert,
            });
            cursorOffset += entry.insert.length;
          }
        });

        if (edits.length === 0) {
          return;
        }

        isApplyingRemoteRef.current = true;
        model.pushEditOperations([], edits, () => null);
        isApplyingRemoteRef.current = false;
      };

      modelListenerRef.current = model.onDidChangeContent((event) => {
        if (isApplyingRemoteRef.current) {
          return;
        }

        ydoc.transact(() => {
          const orderedChanges = [...event.changes].sort((a, b) => b.rangeOffset - a.rangeOffset);

          orderedChanges.forEach((change) => {
            if (change.rangeLength > 0) {
              yText.delete(change.rangeOffset, change.rangeLength);
            }

            if (change.text) {
              yText.insert(change.rangeOffset, change.text);
            }
          });
        }, 'monaco-local');
      });

      const yObserver = (event) => {
        if (event.transaction.origin === 'monaco-local') {
          return;
        }

        applyDeltaToModel(event.delta || []);
      };

      yText.observe(yObserver);
      yTextObserverRef.current = yObserver;

      const onUpdate = (update, origin) => {
        if (origin === 'initial-sync' || origin === 'socket-remote') {
          return;
        }

        if (!socketRef.current || !joinedRef.current) {
          return;
        }

        socketRef.current.emit('document:update', {
          classroomId,
          update,
        });
      };

      ydoc.on('update', onUpdate);

      selectionListenerRef.current = editor.onDidChangeCursorSelection((event) => {
        if (!socketRef.current || !joinedRef.current) {
          return;
        }

        const now = Date.now();
        if (now - cursorSentAtRef.current < 100) {
          return;
        }
        cursorSentAtRef.current = now;

        socketRef.current.emit('cursor:update', {
          classroomId,
          cursor: {
            startLineNumber: event.selection.startLineNumber,
            startColumn: event.selection.startColumn,
            endLineNumber: event.selection.endLineNumber,
            endColumn: event.selection.endColumn,
          },
        });
      });

      ydocRef.current = ydoc;
      yTextRef.current = yText;
      yUpdateHandlerRef.current = onUpdate;
      pendingSyncUpdateRef.current = null;
    },
    [classroomId]
  );

  const handleLanguageChange = (nextLanguage) => {
    if (nextLanguage === language) return;

    // Get the current editor content and check if it is unchanged starter code.
    const currentContent = yTextRef.current
      ? yTextRef.current.toString()
      : editorRef.current?.getModel()?.getValue() || '';

    const needsConfirmation = !isStarterTemplate(currentContent);

    if (needsConfirmation) {
      const confirmed = window.confirm(
        'Switching language will replace the current code with a new starter template. Continue?'
      );
      if (!confirmed) return;
    }

    setLanguage(nextLanguage);

    const editor = editorRef.current;
    const monaco = monacoRef.current;
    if (editor && monaco) {
      const model = editor.getModel();
      if (model) {
        monaco.editor.setModelLanguage(model, getEditorLanguage(nextLanguage));
      }
    }

    if (socketRef.current && joinedRef.current) {
      socketRef.current.emit('language:update', {
        classroomId,
        language: nextLanguage,
        forceReplace: needsConfirmation,
      });
    }
  };

  const cleanupRealtimeState = useCallback(() => {
    joinedRef.current = false;

    if (selectionListenerRef.current) {
      selectionListenerRef.current.dispose();
      selectionListenerRef.current = null;
    }

    if (modelListenerRef.current) {
      modelListenerRef.current.dispose();
      modelListenerRef.current = null;
    }

    if (yTextRef.current && yTextObserverRef.current) {
      yTextRef.current.unobserve(yTextObserverRef.current);
      yTextObserverRef.current = null;
    }

    if (ydocRef.current && yUpdateHandlerRef.current) {
      ydocRef.current.off('update', yUpdateHandlerRef.current);
    }

    if (ydocRef.current) {
      ydocRef.current.destroy();
      ydocRef.current = null;
    }

    yTextRef.current = null;

    yUpdateHandlerRef.current = null;
    pendingSyncUpdateRef.current = null;

    if (editorRef.current) {
      decorationIdsRef.current = editorRef.current.deltaDecorations(decorationIdsRef.current, []);
      const model = editorRef.current.getModel();
      if (model) {
        model.dispose();
      }
    }
  }, []);

  const connectWorkspaceSocket = useCallback(() => {
    if (!classroomId) {
      return;
    }

    const socket = io(SOCKET_BASE_URL, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 800,
      reconnectionDelayMax: 3000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setConnectionStatus('connected');
      setSocketError('');
      socket.emit('classroom:join', { classroomId });
    });

    socket.io.on('reconnect_attempt', () => {
      setConnectionStatus('reconnecting');
    });

    socket.on('disconnect', () => {
      setConnectionStatus('disconnected');
      joinedRef.current = false;
      setParticipants((prev) => prev.filter((participant) => participant.userId !== currentUserId));
      setTypingUsers([]);
      setClassroomChatError('Socket disconnected. Reconnecting...');
    });

    socket.on('connect_error', () => {
      setConnectionStatus('disconnected');
      setSocketError('Unable to connect to real-time workspace. Reconnecting...');
    });

    socket.on('classroom:error', (payload = {}) => {
      setSocketError(payload.message || 'Workspace error occurred.');
    });

    socket.on('document:sync', (payload = {}) => {
      if (payload.classroomId !== classroomId) {
        return;
      }

      const update = normalizeIncomingBinary(payload.update);
      if (!update) {
        setSocketError('Failed to initialize classroom document state.');
        return;
      }

      const nextLanguage = payload.language || 'javascript';
      setLanguage(nextLanguage);
      joinedRef.current = true;

      bindYjsToEditor(update, nextLanguage);
    });

    socket.on('document:update', (payload = {}) => {
      if (payload.classroomId !== classroomId || !ydocRef.current) {
        return;
      }

      const incoming = normalizeIncomingBinary(payload.update);
      if (!incoming) {
        return;
      }

      Y.applyUpdate(ydocRef.current, incoming, 'socket-remote');
    });

    socket.on('language:update', (payload = {}) => {
      if (payload.classroomId !== classroomId) {
        return;
      }

      const nextLanguage = payload.language || 'javascript';
      setLanguage(nextLanguage);

      const editor = editorRef.current;
      const monaco = monacoRef.current;
      if (editor && monaco) {
        const model = editor.getModel();
        if (model) {
          monaco.editor.setModelLanguage(model, getEditorLanguage(nextLanguage));
        }
      }

      // If the server replaced content, a document:sync will follow
      // which will re-bind the Yjs document with the new content.
      // No additional action needed here — bindYjsToEditor handles it.
    });

    socket.on('presence:update', (payload = {}) => {
      if (payload.classroomId !== classroomId) {
        return;
      }

      const safeParticipants = Array.isArray(payload.participants) ? payload.participants : [];
      setParticipants(safeParticipants);
      applyRemoteCursorDecorations(safeParticipants);
    });

    socket.on('chat:message', (payload = {}) => {
      if (payload.classroomId !== classroomId) {
        return;
      }

      setClassroomMessages((prev) => {
        if (prev.some((msg) => msg.id === payload.id)) {
          return prev;
        }

        return [...prev, payload];
      });
      setClassroomChatError('');
      setTypingUsers((prev) => prev.filter((name) => name !== payload.sender?.name));
    });

    socket.on('chat:error', (payload = {}) => {
      if (!payload.classroomId || payload.classroomId === classroomId) {
        setClassroomChatError(payload.message || 'Unable to send chat message.');
      }
      setClassroomChatSending(false);
    });

    socket.on('chat:typing', (payload = {}) => {
      if (payload.classroomId !== classroomId || !payload.user?.name || payload.user?.id === currentUserId) {
        return;
      }

      setTypingUsers((prev) => {
        const withoutUser = prev.filter((name) => name !== payload.user.name);
        if (!payload.isTyping) {
          return withoutUser;
        }

        return [...withoutUser, payload.user.name];
      });
    });

    socket.on('chat:presence', (payload = {}) => {
      if (payload.classroomId !== classroomId) {
        return;
      }

      const safeParticipants = Array.isArray(payload.participants) ? payload.participants : [];
      setChatPresence(safeParticipants);
    });
  }, [applyRemoteCursorDecorations, bindYjsToEditor, classroomId, currentUserId]);

  const activeErrorText = useMemo(() => {
    if (executionServiceError) return executionServiceError;
    if (executionResult?.compileOutput) return executionResult.compileOutput;
    if (executionResult?.stderr) return executionResult.stderr;
    if (
      executionResult?.status &&
      executionResult.status !== 'accepted' &&
      executionResult.status !== 'ready' &&
      executionResult.status !== 'running'
    ) {
      return executionResult.message || executionResult.statusDescription || '';
    }
    return '';
  }, [executionResult, executionServiceError]);

  const hasExecutionError = Boolean(
    activeErrorText &&
    activeErrorText.trim() &&
    activeErrorText.trim() !== 'No errors.'
  );

  const handleExplainError = useCallback(async () => {
    if (isAiLoading || !hasExecutionError) {
      return;
    }

    const sourceCode = yTextRef.current
      ? yTextRef.current.toString()
      : editorRef.current?.getModel()?.getValue() || '';

    if (!sourceCode.trim()) {
      return;
    }

    setAiMode('explain');
    setIsAiLoading(true);
    setAiLoadingAction('explaining');
    setAiError('');
    setActiveTerminalTab('ai-tutor');

    try {
      const result = await api.explainError({
        classroomId,
        language,
        code: sourceCode,
        error: activeErrorText,
        stdin,
        executionStatus: executionStatus.label,
      });

      setAiExplanation(result);
    } catch (err) {
      setAiError(err.message || 'Unable to generate AI explanation.');
    } finally {
      setIsAiLoading(false);
      setAiLoadingAction(null);
    }
  }, [activeErrorText, classroomId, executionStatus.label, hasExecutionError, isAiLoading, language, stdin]);

  const handleGetHint = useCallback(async () => {
    if (isAiLoading) {
      return;
    }

    const sourceCode = yTextRef.current
      ? yTextRef.current.toString()
      : editorRef.current?.getModel()?.getValue() || '';

    if (!sourceCode.trim()) {
      setAiError('Please write some code first to get a hint.');
      setAiMode('hint');
      setActiveTerminalTab('ai-tutor');
      return;
    }

    setAiMode('hint');
    setIsAiLoading(true);
    setAiLoadingAction('hinting');
    setAiError('');
    setActiveTerminalTab('ai-tutor');

    try {
      const result = await api.getAIHint({
        classroomId,
        language,
        code: sourceCode,
        error: activeErrorText,
        stdin,
      });

      setAiHint(result);
    } catch (err) {
      setAiError(err.message || 'Unable to generate AI hint.');
    } finally {
      setIsAiLoading(false);
      setAiLoadingAction(null);
    }
  }, [activeErrorText, classroomId, isAiLoading, language, stdin]);

  const handleDebugWithAI = useCallback(async () => {
    if (isAiLoading) {
      return;
    }

    const sourceCode = yTextRef.current
      ? yTextRef.current.toString()
      : editorRef.current?.getModel()?.getValue() || '';

    if (!sourceCode.trim()) {
      setAiError('Please write some code first to debug.');
      setAiMode('debug');
      setActiveTerminalTab('ai-tutor');
      return;
    }

    setAiMode('debug');
    setIsAiLoading(true);
    setAiLoadingAction('debugging');
    setAiError('');
    setActiveTerminalTab('ai-tutor');

    try {
      const result = await api.debugWithAI({
        classroomId,
        language,
        code: sourceCode,
        error: activeErrorText,
        output: executionResult?.stdout || '',
        stdin,
      });

      setAiDebug(result);
    } catch (err) {
      setAiError(err.message || 'Unable to debug code with AI.');
    } finally {
      setIsAiLoading(false);
      setAiLoadingAction(null);
    }
  }, [activeErrorText, classroomId, executionResult?.stdout, isAiLoading, language, stdin]);

  const handleSendChatMessage = useCallback(async (customText) => {
    const text = (customText !== undefined ? customText : chatInput).trim();
    if (!text || isChatSending) {
      return;
    }

    const sourceCode = yTextRef.current
      ? yTextRef.current.toString()
      : editorRef.current?.getModel()?.getValue() || '';

    if (!sourceCode.trim()) {
      setChatError('Please write or load code in the editor first to ask the tutor.');
      setAiMode('chat');
      setActiveTerminalTab('ai-tutor');
      return;
    }

    const userMsg = {
      id: `user-${Date.now()}-${Math.random()}`,
      role: 'user',
      content: text,
      timestamp: Date.now(),
    };

    const newHistory = [...chatMessages, userMsg];
    setChatMessages(newHistory);
    setChatInput('');
    setChatError('');
    setIsChatSending(true);
    setAiMode('chat');
    setActiveTerminalTab('ai-tutor');

    try {
      const formattedConversation = newHistory.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const response = await api.chatWithAI({
        classroomId,
        language,
        code: sourceCode,
        error: activeErrorText,
        output: executionResult?.stdout || '',
        stdin,
        message: text,
        conversation: formattedConversation.slice(-10),
      });

      const aiMsg = {
        id: `assistant-${Date.now()}-${Math.random()}`,
        role: 'assistant',
        content: response.reply,
        timestamp: Date.now(),
      };

      setChatMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      setChatError(err.message || 'Failed to get response from AI tutor.');
    } finally {
      setIsChatSending(false);
    }
  }, [activeErrorText, chatInput, chatMessages, classroomId, executionResult?.stdout, isChatSending, language, stdin]);

  const handleClearChat = useCallback(() => {
    setChatMessages([]);
    setChatError('');
  }, []);

  const stopTypingSignal = useCallback(() => {
    if (!socketRef.current || !joinedRef.current) {
      return;
    }

    socketRef.current.emit('chat:typing', {
      classroomId,
      isTyping: false,
    });
  }, [classroomId]);

  const handleClassroomChatInputChange = useCallback(
    (value) => {
      setClassroomChatInput(value);

      if (!socketRef.current || !joinedRef.current || !isConnected) {
        return;
      }

      const hasText = value.trim().length > 0;
      socketRef.current.emit('chat:typing', {
        classroomId,
        isTyping: hasText,
      });

      if (typingStopTimerRef.current) {
        clearTimeout(typingStopTimerRef.current);
      }

      if (hasText) {
        typingStopTimerRef.current = setTimeout(() => {
          stopTypingSignal();
        }, 1200);
      }
    },
    [classroomId, isConnected, stopTypingSignal]
  );

  const handleClassroomMessageSend = useCallback(() => {
    const text = String(classroomChatInput || '').trim();
    if (!text || !socketRef.current || !isConnected || !joinedRef.current || classroomChatSending) {
      return;
    }

    if (text.length > MAX_CLASSROOM_CHAT_LENGTH) {
      setClassroomChatError(`Message exceeds ${MAX_CLASSROOM_CHAT_LENGTH} characters.`);
      return;
    }

    setClassroomChatSending(true);
    setClassroomChatError('');

    socketRef.current.emit('chat:send', {
      classroomId,
      message: text,
    });

    socketRef.current.emit('chat:typing', {
      classroomId,
      isTyping: false,
    });

    if (typingStopTimerRef.current) {
      clearTimeout(typingStopTimerRef.current);
      typingStopTimerRef.current = null;
    }

    setClassroomChatInput('');
    setTimeout(() => {
      setClassroomChatSending(false);
    }, 120);
  }, [classroomChatInput, classroomChatSending, classroomId, isConnected]);

  const handleJoinCall = useCallback(async () => {
    if (isJoiningCall || isInCall) {
      return;
    }

    setIsJoiningCall(true);
    setCallError('');

    try {
      const response = await api.getLivekitToken({ classroomId });

      setLivekitToken(response.token || '');
      setLivekitServerUrl(response.serverUrl || '');
      setIsInCall(true);
    } catch (error) {
      setCallError(error.message || 'Failed to join classroom call.');
    } finally {
      setIsJoiningCall(false);
    }
  }, [classroomId, isInCall, isJoiningCall]);

  const handleLeaveCall = useCallback(() => {
    setIsInCall(false);
    setLivekitToken('');
    setLivekitServerUrl('');
    setLivekitParticipantIds([]);
    setCallError('');
  }, []);

  const communicationParticipants = useMemo(() => {
    const onlineMap = new Map();
    const baseList = chatPresence.length > 0
      ? chatPresence
      : participants.map((participant) => ({
          userId: participant.userId,
          name: participant.name,
          role: participant.role,
          status: 'online',
          connectedSockets: participant.connectedSockets || 1,
        }));

    baseList.forEach((participant) => {
      onlineMap.set(participant.userId, {
        userId: participant.userId,
        name: participant.name,
        role: participant.role,
        status: 'online',
        connectedSockets: participant.connectedSockets || 1,
      });
    });

    const inCallUserIds = new Set(
      livekitParticipantIds
        .map((identity) => String(identity || ''))
        .filter((identity) => identity.startsWith('u_'))
        .map((identity) => identity.slice(2))
    );

    inCallUserIds.forEach((userId) => {
      const existing = onlineMap.get(userId);
      if (existing) {
        existing.status = 'in-call';
        onlineMap.set(userId, existing);
      }
    });

    return Array.from(onlineMap.values());
  }, [chatPresence, participants, livekitParticipantIds]);

  useEffect(() => {
    if (aiMode === 'chat' && activeTerminalTab === 'ai-tutor') {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, isChatSending, aiMode, activeTerminalTab]);

  useEffect(() => {
    return () => {
      if (typingStopTimerRef.current) {
        clearTimeout(typingStopTimerRef.current);
      }
    };
  }, []);

  const runCode = useCallback(async () => {
    if (isExecuting) {
      return;
    }

    const sourceCode = yTextRef.current
      ? yTextRef.current.toString()
      : editorRef.current?.getModel()?.getValue() || '';

    if (!sourceCode.trim()) {
      setExecutionServiceError('Code cannot be empty.');
      setExecutionStatus({ key: 'execution_failed', label: 'Execution Failed' });
      setActiveTerminalTab('errors');
      return;
    }

    setExecutionServiceError('');
    setAiExplanation(null);
    setAiError('');
    setIsExecuting(true);
    setExecutionStatus({ key: 'running', label: 'Running...' });

    try {
      const result = await api.executeCode({
        classroomId,
        language,
        sourceCode,
        stdin,
      });

      setExecutionResult(result);
      setExecutionStatus({ key: result.status || 'execution_failed', label: result.statusLabel || 'Execution Failed' });

      if (result.status === 'accepted') {
        setActiveTerminalTab('output');
      } else {
        setActiveTerminalTab('errors');
      }
    } catch (error) {
      setExecutionResult(null);
      setExecutionStatus({ key: 'execution_failed', label: 'Execution Failed' });
      setExecutionServiceError(error.message || 'Code execution failed.');
      setActiveTerminalTab('errors');
    } finally {
      setIsExecuting(false);
    }
  }, [classroomId, isExecuting, language, stdin]);

  useEffect(() => {
    let isActive = true;

    async function loadClassroom() {
      setLoading(true);
      setLoadError('');

      try {
        const response = await api.getClassroomDetails(classroomId);

        if (!isActive) {
          return;
        }

        setClassroom(response.classroom || null);
      } catch (error) {
        if (isActive) {
          setLoadError(error.message || 'Failed to load classroom workspace.');
        }
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    }

    loadClassroom();

    return () => {
      isActive = false;
    };
  }, [classroomId]);

  useEffect(() => {
    setCommunicationTab('chat');
    setClassroomMessages([]);
    setClassroomChatInput('');
    setClassroomChatError('');
    setTypingUsers([]);
    setChatPresence([]);
    setLivekitParticipantIds([]);
    setCallError('');
    setIsInCall(false);
    setLivekitToken('');
    setLivekitServerUrl('');
  }, [classroomId]);

  useEffect(() => {
    let isActive = true;

    async function loadClassroomMessages() {
      setClassroomChatLoading(true);
      setClassroomChatLoadError('');

      try {
        const response = await api.getClassroomMessages(classroomId, { limit: 100 });
        if (!isActive) {
          return;
        }

        const messages = Array.isArray(response.messages) ? response.messages : [];
        setClassroomMessages(messages);
      } catch (error) {
        if (isActive) {
          setClassroomChatLoadError(error.message || 'Failed to load chat history.');
        }
      } finally {
        if (isActive) {
          setClassroomChatLoading(false);
        }
      }
    }

    loadClassroomMessages();

    return () => {
      isActive = false;
    };
  }, [classroomId]);

  useEffect(() => {
    let isActive = true;

    async function loadExecutionLanguages() {
      try {
        const response = await api.getExecutionLanguages();
        const languages = Array.isArray(response.languages) ? response.languages : [];

        if (!isActive || languages.length === 0) {
          return;
        }

        setExecutionLanguages(languages);
      } catch (_error) {
        if (isActive) {
          setExecutionLanguages(FALLBACK_LANGUAGES);
        }
      }
    }

    loadExecutionLanguages();

    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    if (!classroom || loadError) {
      return undefined;
    }

    connectWorkspaceSocket();

    return () => {
      if (socketRef.current) {
        socketRef.current.emit('chat:typing', {
          classroomId,
          isTyping: false,
        });
        socketRef.current.emit('classroom:leave', { classroomId });
        socketRef.current.disconnect();
      }

      handleLeaveCall();
      cleanupRealtimeState();
    };
  }, [classroom, classroomId, cleanupRealtimeState, connectWorkspaceSocket, handleLeaveCall, loadError]);

  const onEditorMount = useCallback((editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    monaco.editor.defineTheme('codecollab-light', {
      base: 'vs',
      inherit: true,
      rules: [],
      colors: {
        'editor.background': '#ffffff',
        'editor.lineHighlightBackground': '#eff6ff',
        'editorLineNumber.foreground': '#64748b',
        'editorLineNumber.activeForeground': '#1e3a8a',
        'editorCursor.foreground': '#1d4ed8',
        'editor.selectionBackground': '#bfdbfe66',
      },
    });

    monaco.editor.setTheme('codecollab-light');

    if (pendingSyncUpdateRef.current) {
      bindYjsToEditor(pendingSyncUpdateRef.current, pendingSyncLanguageRef.current);
    }
  }, [bindYjsToEditor]);

  const connectionLabel =
    connectionStatus === 'connected'
      ? 'Connected'
      : connectionStatus === 'reconnecting'
        ? 'Reconnecting...'
        : 'Disconnected';

  const activeUsers = participants.length;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 flex items-center justify-center">
        <p className="text-sm text-slate-600">Loading classroom workspace...</p>
      </div>
    );
  }

  if (loadError || !classroom) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 flex items-center justify-center px-4">
        <div className="w-full max-w-lg bg-white border border-slate-200 rounded-lg p-6">
          <h1 className="text-xl font-semibold text-slate-900">Workspace unavailable</h1>
          <p className="text-sm text-red-600 mt-3">{loadError || 'Classroom not found.'}</p>
          <Link to={meRoleDashboardPath} className="btn-secondary mt-5">Back to Dashboard</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <header className="border-b border-slate-200 bg-white px-4 sm:px-6 py-3">
        <div className="max-w-[1400px] mx-auto flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold tracking-wider uppercase text-brand-700">CodeCollab Workspace</p>
            <h1 className="text-lg sm:text-xl font-semibold text-slate-900">{classroom.name}</h1>
            <p className="text-xs text-slate-600 mt-0.5">Room: {classroom.roomCode} · Subject: {classroom.subject}</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className={`px-3 py-1.5 rounded-md border text-xs font-semibold ${isConnected ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-amber-200 bg-amber-50 text-amber-700'}`}>
              {connectionLabel}
            </span>
            <span className={`px-3 py-1.5 rounded-md border text-xs font-semibold ${getStatusClass(executionStatus.key)}`}>
              {executionStatus.label}
            </span>
            <span className="px-3 py-1.5 rounded-md border border-slate-300 bg-slate-50 text-xs font-semibold text-slate-700">
              Active Users: {activeUsers}
            </span>
            <button type="button" className="btn-secondary" onClick={() => navigate(-1)}>
              Exit Classroom
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto px-4 sm:px-6 py-4">
        <div className="grid lg:grid-cols-[minmax(0,1fr)_360px] gap-4 h-[calc(100vh-138px)] min-h-[620px]">
          <section className="bg-white border border-slate-200 rounded-lg flex flex-col min-h-0">
            <div className="border-b border-slate-200 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-wrap">
                <label htmlFor="workspace-language" className="text-sm text-slate-700 font-medium">Language</label>
                <select
                  id="workspace-language"
                  value={language}
                  onChange={(event) => handleLanguageChange(event.target.value)}
                  className="px-3 py-2 text-sm border border-slate-300 rounded-md bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-200"
                >
                  {executionLanguages.map((option) => (
                    <option key={option.key} value={option.key}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <button type="button" className="btn-primary" onClick={runCode} disabled={isExecuting || !isConnected}>
                  {isExecuting ? 'Running...' : 'Run Code'}
                </button>
              </div>

              <p className="text-xs text-slate-600">Shared document across all classroom participants</p>
            </div>

            <div className="flex-1 min-h-0 grid grid-rows-[minmax(0,1fr)_260px]">
              <div className="min-h-0">
                <Editor
                  height="100%"
                  defaultLanguage="javascript"
                  options={{
                    minimap: { enabled: false },
                    smoothScrolling: true,
                    automaticLayout: true,
                    fontSize: 14,
                    lineNumbers: 'on',
                    tabSize: 2,
                    insertSpaces: true,
                    scrollBeyondLastLine: false,
                    padding: { top: 16 },
                  }}
                  onMount={onEditorMount}
                />
              </div>

              <div className="border-t border-slate-200 bg-slate-950 text-slate-100 flex flex-col min-h-0">
                <div className="px-3 py-2 border-b border-slate-800 flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-1.5 text-xs flex-wrap">
                    <button
                      type="button"
                      onClick={() => setActiveTerminalTab('output')}
                      className={`px-2.5 py-1 rounded-sm border ${activeTerminalTab === 'output' ? 'border-sky-400 text-sky-200 bg-slate-900' : 'border-slate-700 text-slate-300'}`}
                    >
                      Output
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTerminalTab('errors')}
                      className={`px-2.5 py-1 rounded-sm border flex items-center gap-1.5 ${activeTerminalTab === 'errors' ? 'border-sky-400 text-sky-200 bg-slate-900' : 'border-slate-700 text-slate-300'}`}
                    >
                      <span>Errors</span>
                      {hasExecutionError && (
                        <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTerminalTab('input')}
                      className={`px-2.5 py-1 rounded-sm border ${activeTerminalTab === 'input' ? 'border-sky-400 text-sky-200 bg-slate-900' : 'border-slate-700 text-slate-300'}`}
                    >
                      Input
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTerminalTab('ai-tutor')}
                      className={`px-2.5 py-1 rounded-sm border flex items-center gap-1.5 transition-colors ${
                        activeTerminalTab === 'ai-tutor'
                          ? 'border-indigo-400 text-indigo-200 bg-indigo-950/60 font-medium'
                          : 'border-indigo-800/80 text-indigo-300 bg-indigo-950/30 hover:bg-indigo-950/50'
                      }`}
                    >
                      <span>✨ AI Tutor</span>
                      {isAiLoading && (
                        <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-ping" />
                      )}
                    </button>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    {hasExecutionError && (
                      <button
                        type="button"
                        onClick={handleExplainError}
                        disabled={isAiLoading}
                        className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm transition-colors disabled:opacity-50"
                        title="Explain current compiler or runtime error"
                      >
                        {isAiLoading && aiLoadingAction === 'explaining' ? (
                          <>
                            <svg className="animate-spin h-3 w-3 text-white" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                            </svg>
                            <span>Analyzing...</span>
                          </>
                        ) : (
                          <>
                            <span>✨</span>
                            <span>Explain Error</span>
                          </>
                        )}
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={handleGetHint}
                      disabled={isAiLoading}
                      className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded border border-amber-500/50 bg-amber-950/40 text-amber-200 hover:bg-amber-950/70 shadow-sm transition-colors disabled:opacity-50"
                      title="Get a progressive guiding hint"
                    >
                      {isAiLoading && aiLoadingAction === 'hinting' ? (
                        <>
                          <svg className="animate-spin h-3 w-3 text-amber-200" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                          </svg>
                          <span>Thinking...</span>
                        </>
                      ) : (
                        <>
                          <span>💡</span>
                          <span>Get Hint</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={handleDebugWithAI}
                      disabled={isAiLoading}
                      className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded border border-cyan-500/50 bg-cyan-950/40 text-cyan-200 hover:bg-cyan-950/70 shadow-sm transition-colors disabled:opacity-50"
                      title="Analyze code for bugs and logic issues"
                    >
                      {isAiLoading && aiLoadingAction === 'debugging' ? (
                        <>
                          <svg className="animate-spin h-3 w-3 text-cyan-200" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                          </svg>
                          <span>Debugging...</span>
                        </>
                      ) : (
                        <>
                          <span>🐞</span>
                          <span>Debug</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setAiMode('chat');
                        setActiveTerminalTab('ai-tutor');
                      }}
                      className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded border shadow-sm transition-colors ${
                        activeTerminalTab === 'ai-tutor' && aiMode === 'chat'
                          ? 'border-indigo-400 bg-indigo-900/60 text-indigo-100 font-semibold'
                          : 'border-indigo-500/50 bg-indigo-950/40 text-indigo-200 hover:bg-indigo-950/70'
                      }`}
                      title="Open AI Tutor Chat"
                    >
                      <span>💬</span>
                      <span>Chat</span>
                    </button>

                    {executionResult && (
                      <div className="text-[11px] text-slate-300 ml-1">
                        {executionResult.executionTime ? `Time: ${executionResult.executionTime}s` : 'Time: -'}
                        {' · '}
                        {executionResult.memory ? `Memory: ${executionResult.memory} KB` : 'Memory: -'}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex-1 min-h-0 overflow-auto px-3 py-2">
                  {activeTerminalTab === 'input' ? (
                    <div className="h-full flex flex-col gap-2">
                      <label htmlFor="terminal-stdin" className="text-xs text-slate-300">Standard Input</label>
                      <textarea
                        id="terminal-stdin"
                        value={stdin}
                        onChange={(event) => setStdin(event.target.value)}
                        placeholder="Enter input passed to stdin"
                        className="flex-1 min-h-0 bg-slate-900 border border-slate-700 rounded-sm px-2 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:ring-1 focus:ring-sky-500 resize-none"
                      />
                    </div>
                  ) : activeTerminalTab === 'output' ? (
                    <pre className="text-xs font-mono whitespace-pre-wrap break-words text-slate-100">
                      {executionResult?.stdout || (executionStatus.key === 'ready' ? 'Ready to run code.' : 'No output yet.')}
                    </pre>
                  ) : activeTerminalTab === 'errors' ? (
                    <div className="space-y-2">
                      {hasExecutionError && (
                        <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
                          <span className="text-[11px] font-semibold text-rose-400">Execution / Compiler Output</span>
                          <button
                            type="button"
                            onClick={handleExplainError}
                            disabled={isAiLoading}
                            className="inline-flex items-center gap-1 text-[11px] font-medium text-indigo-300 hover:text-indigo-200 underline"
                          >
                            <span>✨ Ask AI Tutor to explain this error</span>
                          </button>
                        </div>
                      )}
                      <pre className="text-xs font-mono whitespace-pre-wrap break-words text-rose-200">
                        {activeErrorText || 'No errors.'}
                      </pre>
                    </div>
                  ) : (
                    /* activeTerminalTab === 'ai-tutor' */
                    <div className="h-full flex flex-col min-h-0 space-y-2">
                      {/* AI Mode Sub-Tabs */}
                      <div className="flex items-center justify-between pb-1.5 border-b border-slate-800 gap-2 flex-wrap shrink-0">
                        <div className="flex items-center gap-1 text-xs flex-wrap">
                          {hasExecutionError && (
                            <button
                              type="button"
                              onClick={() => setAiMode('explain')}
                              className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                                aiMode === 'explain'
                                  ? 'bg-indigo-600 text-white font-semibold'
                                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                              }`}
                            >
                              ✨ Error Explainer
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => setAiMode('hint')}
                            className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                              aiMode === 'hint'
                                ? 'bg-amber-600 text-white font-semibold'
                                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                            }`}
                          >
                            💡 AI Hint
                          </button>
                          <button
                            type="button"
                            onClick={() => setAiMode('debug')}
                            className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                              aiMode === 'debug'
                                ? 'bg-cyan-700 text-white font-semibold'
                                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                            }`}
                          >
                            🐞 AI Debugger
                          </button>
                          <button
                            type="button"
                            onClick={() => setAiMode('chat')}
                            className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors flex items-center gap-1 ${
                              aiMode === 'chat'
                                ? 'bg-indigo-700 text-white font-semibold'
                                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                            }`}
                          >
                            <span>💬 Tutor Chat</span>
                            {chatMessages.length > 0 && (
                              <span className="px-1 py-0.2 text-[9px] rounded-full bg-indigo-900 text-indigo-200 border border-indigo-600">
                                {chatMessages.length}
                              </span>
                            )}
                          </button>
                        </div>

                        <div>
                          {aiMode === 'explain' && aiExplanation && (
                            <button
                              type="button"
                              onClick={handleExplainError}
                              disabled={isAiLoading}
                              className="text-[11px] text-slate-400 hover:text-slate-200 underline"
                            >
                              Re-analyze
                            </button>
                          )}
                          {aiMode === 'hint' && (
                            <button
                              type="button"
                              onClick={handleGetHint}
                              disabled={isAiLoading}
                              className="text-[11px] text-amber-300 hover:text-amber-200 underline"
                            >
                              {aiHint ? 'Refresh Hint' : 'Get Hint'}
                            </button>
                          )}
                          {aiMode === 'debug' && (
                            <button
                              type="button"
                              onClick={handleDebugWithAI}
                              disabled={isAiLoading}
                              className="text-[11px] text-cyan-300 hover:text-cyan-200 underline"
                            >
                              {aiDebug ? 'Re-run Debugger' : 'Run Debugger'}
                            </button>
                          )}
                          {aiMode === 'chat' && chatMessages.length > 0 && (
                            <button
                              type="button"
                              onClick={handleClearChat}
                              className="text-[11px] text-slate-400 hover:text-rose-300 underline"
                            >
                              Clear Chat
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Content Area */}
                      <div className="flex-1 min-h-0 overflow-auto">
                        {aiMode === 'chat' ? (
                          /* ── Mode 4: Tutor Chat ── */
                          <div className="h-full flex flex-col justify-between gap-2">
                            {/* Messages List */}
                            <div className="flex-1 min-h-0 overflow-y-auto space-y-2.5 pr-1">
                              {chatMessages.length === 0 ? (
                                <div className="py-4 px-2 flex flex-col items-center justify-center text-center space-y-3">
                                  <div>
                                    <p className="text-xs font-semibold text-slate-200">
                                      👋 Ask your AI Tutor anything about your code
                                    </p>
                                    <p className="text-[11px] text-slate-400 mt-0.5">
                                      The tutor has full context of your active code, language, and execution results.
                                    </p>
                                  </div>

                                  <div className="grid grid-cols-2 gap-2 w-full max-w-md pt-1">
                                    <button
                                      type="button"
                                      onClick={() => handleSendChatMessage('Explain my current code in simple terms')}
                                      className="text-left px-2.5 py-1.5 rounded bg-slate-900 border border-slate-800 hover:border-indigo-500/60 hover:bg-slate-850 text-[11px] text-slate-200 transition-colors"
                                    >
                                      <span className="text-indigo-400 font-semibold block">🔍 Explain Code</span>
                                      <span className="text-[10px] text-slate-400">Break down the active program</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleSendChatMessage('Why is my code failing or giving this output?')}
                                      className="text-left px-2.5 py-1.5 rounded bg-slate-900 border border-slate-800 hover:border-indigo-500/60 hover:bg-slate-850 text-[11px] text-slate-200 transition-colors"
                                    >
                                      <span className="text-amber-400 font-semibold block">❓ Why It Fails</span>
                                      <span className="text-[10px] text-slate-400">Diagnose unexpected outputs</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleSendChatMessage('Give me a step-by-step hint for the next part')}
                                      className="text-left px-2.5 py-1.5 rounded bg-slate-900 border border-slate-800 hover:border-indigo-500/60 hover:bg-slate-850 text-[11px] text-slate-200 transition-colors"
                                    >
                                      <span className="text-emerald-400 font-semibold block">💡 Step Hint</span>
                                      <span className="text-[10px] text-slate-400">Guide without full answer</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleSendChatMessage('Explain the core computer science concept behind this code')}
                                      className="text-left px-2.5 py-1.5 rounded bg-slate-900 border border-slate-800 hover:border-indigo-500/60 hover:bg-slate-850 text-[11px] text-slate-200 transition-colors"
                                    >
                                      <span className="text-cyan-400 font-semibold block">🎓 Key Concept</span>
                                      <span className="text-[10px] text-slate-400">Deepen fundamentals</span>
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                chatMessages.map((msg) => (
                                  <div
                                    key={msg.id}
                                    className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                                  >
                                    <div
                                      className={`rounded-lg px-3 py-2 text-xs leading-relaxed max-w-[90%] sm:max-w-[85%] whitespace-pre-wrap break-words ${
                                        msg.role === 'user'
                                          ? 'bg-indigo-600 text-white shadow-sm'
                                          : 'bg-slate-900/95 border border-slate-800 text-slate-100 space-y-1'
                                      }`}
                                    >
                                      {msg.role === 'assistant' && (
                                        <div className="flex items-center gap-1.5 text-[10px] font-semibold text-indigo-300 pb-0.5 border-b border-slate-800">
                                          <span>✨ AI Tutor</span>
                                        </div>
                                      )}
                                      <div>{msg.content}</div>
                                    </div>
                                  </div>
                                ))
                              )}

                              {isChatSending && (
                                <div className="flex items-start">
                                  <div className="rounded-lg px-3 py-2 bg-slate-900/95 border border-slate-800 text-xs text-indigo-300 flex items-center gap-2">
                                    <div className="h-3.5 w-3.5 rounded-full border-2 border-indigo-400 border-t-transparent animate-spin" />
                                    <span>AI Tutor is thinking...</span>
                                  </div>
                                </div>
                              )}

                              {chatError && (
                                <div className="p-2.5 bg-rose-950/40 border border-rose-800/60 rounded-md text-xs text-rose-200 flex items-center justify-between">
                                  <span>{chatError}</span>
                                  <button
                                    type="button"
                                    onClick={() => handleSendChatMessage(chatMessages[chatMessages.length - 1]?.content)}
                                    className="text-[11px] text-indigo-300 hover:text-indigo-200 underline ml-2"
                                  >
                                    Retry
                                  </button>
                                </div>
                              )}

                              <div ref={chatEndRef} />
                            </div>

                            {/* Chat Input Form */}
                            <form
                              onSubmit={(event) => {
                                event.preventDefault();
                                handleSendChatMessage();
                              }}
                              className="shrink-0 flex items-center gap-2 pt-1 border-t border-slate-800/80"
                            >
                              <textarea
                                value={chatInput}
                                onChange={(event) => setChatInput(event.target.value)}
                                onKeyDown={(event) => {
                                  if (event.key === 'Enter' && !event.shiftKey) {
                                    event.preventDefault();
                                    handleSendChatMessage();
                                  }
                                }}
                                placeholder="Ask tutor about your code... (Enter to send, Shift+Enter for new line)"
                                rows={1}
                                className="flex-1 min-h-[34px] max-h-[70px] bg-slate-900 border border-slate-700 rounded-md px-2.5 py-1.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none font-sans"
                                disabled={isChatSending}
                              />
                              <button
                                type="submit"
                                disabled={!chatInput.trim() || isChatSending}
                                className="px-3 py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:hover:bg-indigo-600 text-white text-xs font-semibold shadow-sm transition-colors shrink-0"
                              >
                                {isChatSending ? '...' : 'Send'}
                              </button>
                            </form>
                          </div>
                        ) : isAiLoading ? (
                          <div className="py-6 flex flex-col items-center justify-center text-center">
                            <div className="h-7 w-7 rounded-full border-2 border-indigo-400 border-t-transparent animate-spin mb-3" />
                            <p className="text-xs font-semibold text-indigo-200">
                              {aiLoadingAction === 'explaining'
                                ? 'AI Tutor is analyzing your error...'
                                : aiLoadingAction === 'hinting'
                                  ? 'AI Tutor is crafting a progressive hint...'
                                  : 'AI Debugger is inspecting your code for bugs and logic issues...'}
                            </p>
                            <p className="text-[11px] text-slate-400 mt-1 max-w-sm">
                              {aiLoadingAction === 'hinting'
                                ? 'Identifying key concepts and guiding your next step without giving away the full answer.'
                                : aiLoadingAction === 'debugging'
                                  ? 'Examining syntax, boundary conditions, and potential runtime problems.'
                                  : 'Inspecting syntax, runtime logs, and preparing a beginner-friendly explanation.'}
                            </p>
                          </div>
                        ) : aiError ? (
                          <div className="p-3 bg-rose-950/40 border border-rose-800/60 rounded-md text-xs space-y-2">
                            <div className="flex items-center justify-between">
                              <p className="font-semibold text-rose-300">AI Request Failed</p>
                              <button
                                type="button"
                                onClick={() => {
                                  if (aiMode === 'explain') handleExplainError();
                                  else if (aiMode === 'hint') handleGetHint();
                                  else handleDebugWithAI();
                                }}
                                className="text-xs text-indigo-400 hover:text-indigo-300 underline font-medium"
                              >
                                Try Again
                              </button>
                            </div>
                            <p className="text-rose-200">{aiError}</p>
                          </div>
                        ) : aiMode === 'explain' ? (
                          /* ── Mode 1: Error Explainer ── */
                          aiExplanation ? (
                            <div className="space-y-2.5 text-xs py-1">
                              <div className="bg-slate-900/90 border border-slate-800 rounded p-2.5">
                                <div className="flex items-center gap-1.5 text-sky-400 font-semibold mb-1">
                                  <span>🔍</span>
                                  <span>What happened</span>
                                </div>
                                <p className="text-slate-200 leading-relaxed">{aiExplanation.explanation}</p>
                              </div>

                              <div className="bg-slate-900/90 border border-slate-800 rounded p-2.5">
                                <div className="flex items-center gap-1.5 text-amber-400 font-semibold mb-1">
                                  <span>⚠️</span>
                                  <span>Why it happened</span>
                                </div>
                                <p className="text-slate-200 leading-relaxed">{aiExplanation.cause}</p>
                              </div>

                              <div className="bg-slate-900/90 border border-slate-800 rounded p-2.5">
                                <div className="flex items-center gap-1.5 text-emerald-400 font-semibold mb-1">
                                  <span>💡</span>
                                  <span>How to fix it</span>
                                </div>
                                <p className="text-slate-200 leading-relaxed whitespace-pre-wrap font-mono text-[11px] bg-slate-950 p-2 rounded mt-1 border border-slate-800/80">
                                  {aiExplanation.fix}
                                </p>
                              </div>

                              <div className="bg-indigo-950/40 border border-indigo-800/50 rounded p-2.5">
                                <div className="flex items-center gap-1.5 text-indigo-300 font-semibold mb-1">
                                  <span>🎓</span>
                                  <span>Learning Tip</span>
                                </div>
                                <p className="text-indigo-100 leading-relaxed">{aiExplanation.learningTip}</p>
                              </div>
                            </div>
                          ) : (
                            <div className="py-6 flex flex-col items-center justify-center text-center text-slate-400">
                              <p className="text-xs">No active error explanation.</p>
                              {hasExecutionError ? (
                                <button
                                  type="button"
                                  onClick={handleExplainError}
                                  className="mt-2 text-xs text-indigo-400 hover:text-indigo-300 underline font-medium"
                                >
                                  Click here to explain current error with AI
                                </button>
                              ) : (
                                <p className="text-[11px] mt-1 text-slate-500">
                                  Run your code. If an error occurs, click &quot;Explain Error&quot;.
                                </p>
                              )}
                            </div>
                          )
                        ) : aiMode === 'hint' ? (
                          /* ── Mode 2: AI Hint ── */
                          aiHint ? (
                            <div className="space-y-2.5 text-xs py-1">
                              <div className="flex items-center gap-2">
                                <span className="text-slate-400 text-[11px]">Concept:</span>
                                <span className="px-2 py-0.5 rounded-full bg-indigo-950/80 border border-indigo-700/60 text-indigo-300 text-[11px] font-medium">
                                  {aiHint.concept}
                                </span>
                              </div>

                              <div className="bg-slate-900/90 border border-slate-800 rounded p-2.5">
                                <div className="flex items-center gap-1.5 text-amber-400 font-semibold mb-1">
                                  <span>💡</span>
                                  <span>Guiding Hint</span>
                                </div>
                                <p className="text-slate-200 leading-relaxed">{aiHint.hint}</p>
                              </div>

                              <div className="bg-slate-900/90 border border-slate-800 rounded p-2.5">
                                <div className="flex items-center gap-1.5 text-emerald-400 font-semibold mb-1">
                                  <span>🎯</span>
                                  <span>Next Step to Try</span>
                                </div>
                                <p className="text-slate-200 leading-relaxed font-mono text-[11px] bg-slate-950 p-2 rounded mt-1 border border-slate-800/80">
                                  {aiHint.nextStep}
                                </p>
                              </div>

                              <div className="bg-amber-950/30 border border-amber-800/50 rounded p-2.5">
                                <div className="flex items-center gap-1.5 text-amber-300 font-semibold mb-1">
                                  <span>🎓</span>
                                  <span>Learning Tip</span>
                                </div>
                                <p className="text-amber-100 leading-relaxed">{aiHint.learningTip}</p>
                              </div>
                            </div>
                          ) : (
                            <div className="py-6 flex flex-col items-center justify-center text-center text-slate-400">
                              <p className="text-xs">Need guidance on your code?</p>
                              <button
                                type="button"
                                onClick={handleGetHint}
                                className="mt-2 inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded bg-amber-600 hover:bg-amber-500 text-white shadow-sm transition-colors"
                              >
                                <span>💡</span>
                                <span>Get AI Hint</span>
                              </button>
                              <p className="text-[11px] mt-1 text-slate-500">
                                Get progressive guidance without giving away the full solution.
                              </p>
                            </div>
                          )
                        ) : (
                          /* ── Mode 3: AI Debugger ── */
                          aiDebug ? (
                            <div className="space-y-2.5 text-xs py-1">
                              <div className="bg-slate-900/90 border border-slate-800 rounded p-2.5">
                                <div className="flex items-center gap-1.5 text-cyan-400 font-semibold mb-1">
                                  <span>🔍</span>
                                  <span>Code Analysis Summary</span>
                                </div>
                                <p className="text-slate-200 leading-relaxed">{aiDebug.summary}</p>
                              </div>

                              <div className="space-y-2">
                                <div className="text-[11px] font-semibold text-slate-300 flex items-center justify-between">
                                  <span>Detected Issues ({aiDebug.bugs?.length || 0})</span>
                                </div>

                                {(!aiDebug.bugs || aiDebug.bugs.length === 0) ? (
                                  <div className="bg-emerald-950/30 border border-emerald-800/50 rounded p-2.5 text-emerald-200">
                                    ✅ No bugs or critical syntax issues detected. Code structure looks sound.
                                  </div>
                                ) : (
                                  aiDebug.bugs.map((bug, index) => {
                                    const sev = String(bug.severity || 'medium').toLowerCase();
                                    const sevClass =
                                      sev === 'high'
                                        ? 'bg-rose-950/60 border-rose-800 text-rose-300'
                                        : sev === 'low'
                                          ? 'bg-sky-950/60 border-sky-800 text-sky-300'
                                          : 'bg-amber-950/60 border-amber-800 text-amber-300';

                                    return (
                                      <div
                                        key={index}
                                        className="bg-slate-900 border border-slate-800 rounded p-2.5 space-y-1.5"
                                      >
                                        <div className="flex items-center justify-between gap-2 flex-wrap">
                                          <div className="flex items-center gap-2">
                                            <span className="font-semibold text-slate-100">{bug.type} Issue</span>
                                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border ${sevClass} uppercase tracking-wider`}>
                                              {bug.severity}
                                            </span>
                                          </div>
                                          {bug.location && (
                                            <span className="text-[11px] text-slate-400 font-mono">
                                              {bug.location}
                                            </span>
                                          )}
                                        </div>

                                        <p className="text-slate-300 text-[11px] leading-relaxed">
                                          {bug.explanation}
                                        </p>

                                        <div className="bg-slate-950 p-2 rounded border border-slate-800/80">
                                          <span className="text-emerald-400 font-medium text-[11px]">Suggested Fix: </span>
                                          <span className="text-slate-200 text-[11px]">{bug.suggestion}</span>
                                        </div>
                                      </div>
                                    );
                                  })
                                )}
                              </div>

                              {aiDebug.overallSuggestion && (
                                <div className="bg-slate-900/90 border border-slate-800 rounded p-2.5">
                                  <div className="flex items-center gap-1.5 text-cyan-400 font-semibold mb-1">
                                    <span>🛠️</span>
                                    <span>Testing & Improvement Suggestion</span>
                                  </div>
                                  <p className="text-slate-200 leading-relaxed">{aiDebug.overallSuggestion}</p>
                                </div>
                              )}

                              {aiDebug.learningTip && (
                                <div className="bg-cyan-950/30 border border-cyan-800/50 rounded p-2.5">
                                  <div className="flex items-center gap-1.5 text-cyan-300 font-semibold mb-1">
                                    <span>🎓</span>
                                    <span>Debugging Tip</span>
                                  </div>
                                  <p className="text-cyan-100 leading-relaxed">{aiDebug.learningTip}</p>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="py-6 flex flex-col items-center justify-center text-center text-slate-400">
                              <p className="text-xs">Ready to debug your code?</p>
                              <button
                                type="button"
                                onClick={handleDebugWithAI}
                                className="mt-2 inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded bg-cyan-700 hover:bg-cyan-600 text-white shadow-sm transition-colors"
                              >
                                <span>🐞</span>
                                <span>Debug Code with AI</span>
                              </button>
                              <p className="text-[11px] mt-1 text-slate-500">
                                Analyzes syntax, edge cases, logic bugs, and runtime logs.
                              </p>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>

          <CommunicationPanel
            activeTab={communicationTab}
            onTabChange={setCommunicationTab}
            chatProps={{
              messages: classroomMessages,
              loading: classroomChatLoading,
              loadError: classroomChatLoadError,
              error: classroomChatError || socketError,
              currentUserId,
              messageInput: classroomChatInput,
              onMessageInputChange: handleClassroomChatInputChange,
              onSendMessage: handleClassroomMessageSend,
              sending: classroomChatSending,
              typingUsers,
              connected: isConnected,
            }}
            callProps={{
              isInCall,
              isJoining: isJoiningCall,
              callMode,
              onCallModeChange: setCallMode,
              onJoinCall: handleJoinCall,
              onLeaveCall: handleLeaveCall,
              token: livekitToken,
              serverUrl: livekitServerUrl,
              onParticipantIdsChange: setLivekitParticipantIds,
              callError,
            }}
            participantProps={{
              participants: communicationParticipants,
              currentUserId,
            }}
          />
        </div>
      </main>
    </div>
  );
}
