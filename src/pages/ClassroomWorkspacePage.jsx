import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import { io } from 'socket.io-client';
import * as Y from 'yjs';
import { api, SOCKET_BASE_URL } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';

const FALLBACK_LANGUAGES = [
  { key: 'javascript', label: 'JavaScript', monacoLanguage: 'javascript' },
  { key: 'cpp', label: 'C++', monacoLanguage: 'cpp' },
  { key: 'python', label: 'Python', monacoLanguage: 'python' },
  { key: 'java', label: 'Java', monacoLanguage: 'java' },
];

const MONACO_LANGUAGE_MAP = {
  javascript: 'javascript',
  cpp: 'cpp',
  python: 'python',
  java: 'java',
};

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
    });

    socket.on('presence:update', (payload = {}) => {
      if (payload.classroomId !== classroomId) {
        return;
      }

      const safeParticipants = Array.isArray(payload.participants) ? payload.participants : [];
      setParticipants(safeParticipants);
      applyRemoteCursorDecorations(safeParticipants);
    });
  }, [applyRemoteCursorDecorations, bindYjsToEditor, classroomId, currentUserId]);

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
        socketRef.current.emit('classroom:leave', { classroomId });
        socketRef.current.disconnect();
      }

      cleanupRealtimeState();
    };
  }, [classroom, classroomId, cleanupRealtimeState, connectWorkspaceSocket, loadError]);

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
        <div className="grid lg:grid-cols-[minmax(0,1fr)_280px] gap-4 h-[calc(100vh-138px)] min-h-[620px]">
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
                  <div className="flex items-center gap-2 text-xs">
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
                      className={`px-2.5 py-1 rounded-sm border ${activeTerminalTab === 'errors' ? 'border-sky-400 text-sky-200 bg-slate-900' : 'border-slate-700 text-slate-300'}`}
                    >
                      Errors
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTerminalTab('input')}
                      className={`px-2.5 py-1 rounded-sm border ${activeTerminalTab === 'input' ? 'border-sky-400 text-sky-200 bg-slate-900' : 'border-slate-700 text-slate-300'}`}
                    >
                      Input
                    </button>
                  </div>

                  {executionResult && (
                    <div className="text-[11px] text-slate-300">
                      {executionResult.executionTime ? `Time: ${executionResult.executionTime}s` : 'Time: -'}
                      {' · '}
                      {executionResult.memory ? `Memory: ${executionResult.memory} KB` : 'Memory: -'}
                    </div>
                  )}
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
                  ) : (
                    <pre className="text-xs font-mono whitespace-pre-wrap break-words text-rose-200">
                      {executionServiceError || executionResult?.compileOutput || executionResult?.stderr || executionResult?.message || 'No errors.'}
                    </pre>
                  )}
                </div>
              </div>
            </div>
          </section>

          <aside className="bg-white border border-slate-200 rounded-lg p-4 flex flex-col min-h-0">
            <h2 className="text-sm font-semibold text-slate-900">Participants</h2>

            {socketError && (
              <p className="text-xs text-red-600 mt-2 border border-red-200 bg-red-50 rounded-md px-2.5 py-2">
                {socketError}
              </p>
            )}

            <ul className="mt-3 space-y-2 overflow-auto pr-1">
              {participants.length === 0 ? (
                <li className="text-sm text-slate-600">No active users yet.</li>
              ) : (
                participants.map((participant) => {
                  const colorIndex = hashColorIndex(participant.userId);
                  const isMe = participant.userId === currentUserId;

                  return (
                    <li key={participant.userId} className="border border-slate-200 rounded-md px-3 py-2 bg-slate-50">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className={`h-2.5 w-2.5 rounded-sm shrink-0 cc-presence-dot-${colorIndex}`} />
                          <p className="text-sm text-slate-900 font-medium truncate">
                            {participant.name} {isMe ? '(You)' : ''}
                          </p>
                        </div>
                        <span className="text-[10px] uppercase tracking-wider text-slate-500">{participant.role}</span>
                      </div>

                      {participant.cursor ? (
                        <p className="text-xs text-slate-600 mt-1">
                          Cursor: Ln {participant.cursor.startLineNumber}, Col {participant.cursor.startColumn}
                        </p>
                      ) : (
                        <p className="text-xs text-slate-500 mt-1">Cursor inactive</p>
                      )}
                    </li>
                  );
                })
              )}
            </ul>
          </aside>
        </div>
      </main>
    </div>
  );
}
