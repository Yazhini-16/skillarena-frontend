'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Editor from '@monaco-editor/react';
import { Clock, Zap, CheckCircle, AlertCircle, Loader, Play } from 'lucide-react';
import toast from 'react-hot-toast';
import { useMatchStore } from '@/store/matchStore';
import { useAuthStore } from '@/store/authStore';
import { connectSocket } from '@/lib/socket';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';

// Add state for available languages
const [availableLangs, setAvailableLangs] = useState({
  javascript: true, python: true, cpp: true, java: true,
});

// Fetch availability on mount
useEffect(() => {
  fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/practice/languages`)
    .then(r => r.json())
    .then(d => { if (d.data) setAvailableLangs(d.data); })
    .catch(() => {});
}, []);

const LANGUAGES = [
  { id: 'javascript', label: 'JavaScript' },
  { id: 'python',     label: 'Python'     },
  { id: 'cpp',        label: 'C++'        },
  { id: 'java',       label: 'Java'       },
];

const DEFAULT_CODE = {
  javascript: '// Read input from stdin\nconst lines = require("fs").readFileSync("/dev/stdin","utf8").trim().split("\\n");\n\n// Write your solution below\n\n',
  python:     '# Read input\nimport sys\nlines = sys.stdin.read().strip().split("\\n")\n\n# Write your solution below\n\n',
  cpp:        '#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    ios_base::sync_with_stdio(false);\n    cin.tie(NULL);\n    // Your solution here\n    return 0;\n}\n',
  java:       'import java.util.*;\nimport java.io.*;\n\npublic class Main {\n    public static void main(String[] args) throws Exception {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        // Your solution here\n    }\n}\n',
};

export default function MatchPage() {
  const ready = useRequireAuth();
  const {
    match, opponent, problem, timer,
    opponentStatus, setOpponentStatus, setResult,
  } = useMatchStore();
  const { user }  = useAuthStore();
  const router    = useRouter();

  const [language,   setLanguage]   = useState('javascript');
  const [code,       setCode]       = useState(DEFAULT_CODE.javascript);
  const [timeLeft,   setTimeLeft]   = useState(null);
  const [submitted,  setSubmitted]  = useState(false);
  const [running,    setRunning]    = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const [evalResult, setEvalResult] = useState(null);
  const [runResults, setRunResults] = useState(null);
  const [activeTab,  setActiveTab]  = useState('problem');
  const timerRef     = useRef(null);
  const warningRef   = useRef(0);
  const forfeitedRef = useRef(false);
  const editorRef    = useRef(null);

  // Anti-cheat
  useEffect(() => {
    if (!ready || !match) return;

    const handleVisibilityChange = () => {
      if (document.hidden && !submitted && !forfeitedRef.current) {
        warningRef.current += 1;
        if (warningRef.current >= 2) {
          forfeitedRef.current = true;
          const socket = connectSocket();
          if (socket) {
            socket.emit('match:forfeit_request', {
              matchId: match.matchId,
              reason: 'tab_switch',
            });
          }
          toast.error('Match forfeited — tab switching detected twice', { duration: 5000 });
        } else {
          toast.error(`⚠️ Warning ${warningRef.current}/2: Do not leave this tab!`, { duration: 5000 });
        }
      }
    };

    const handleCopy = (e) => {
      e.preventDefault();
      toast.error('Copying is disabled during a match');
    };

    const handlePaste = (e) => {
      e.preventDefault();
    };

    const handleContextMenu = (e) => e.preventDefault();

    const handleKeyDown = (e) => {
      if (e.ctrlKey && ['c', 'v', 'x'].includes(e.key.toLowerCase())) {
        e.preventDefault();
        toast.error('Copy/paste shortcuts are disabled');
      }
      if (e.key === 'F12') e.preventDefault();
      if (e.ctrlKey && e.shiftKey && ['i', 'j'].includes(e.key.toLowerCase())) {
        e.preventDefault();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('copy',             handleCopy);
    document.addEventListener('paste',            handlePaste);
    document.addEventListener('contextmenu',      handleContextMenu);
    document.addEventListener('keydown',          handleKeyDown);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('copy',             handleCopy);
      document.removeEventListener('paste',            handlePaste);
      document.removeEventListener('contextmenu',      handleContextMenu);
      document.removeEventListener('keydown',          handleKeyDown);
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
    };
  }, [ready, match?.matchId, submitted]);

  // Socket
  useEffect(() => {
    if (!ready) return;
    if (!match) { router.push('/lobby'); return; }

    const socket = connectSocket();
    if (!socket) return;

    socket.emit('match:join', { matchId: match.matchId });

    socket.on('match:timer_sync', (data) => {
      setTimeLeft(Math.floor(data.remainingMs / 1000));
    });

    socket.on('match:opponent_status', (data) => {
      setOpponentStatus(data.status);
      if (data.status === 'submitted') toast('Opponent submitted!', { icon: '⚡' });
    });

    socket.on('match:submission_received', () => {
      setEvaluating(true);
      setActiveTab('result');
    });

    socket.on('match:evaluating', () => {
      setEvaluating(true);
      setActiveTab('result');
    });

    socket.on('match:evaluation_result', (data) => {
      setEvaluating(false);
      setEvalResult(data);
      if (data.score === 100)     toast.success(`All ${data.total} test cases passed!`);
      else if (data.score > 0)    toast(`${data.passed}/${data.total} passed`, { icon: '⚠️' });
      else                        toast.error(data.compileError ? 'Runtime error' : 'Wrong answer');
    });

    socket.on('match:run_started', () => {
      setRunning(true);
      setRunResults(null);
      setActiveTab('testcases');
    });

    socket.on('match:run_result', (data) => {
      setRunning(false);
      setRunResults(data);
      setActiveTab('testcases');
      toast(data.message, { icon: data.passedCount === data.totalCount ? '✅' : '⚠️' });
    });

    socket.on('match:waiting_opponent', () => {
      toast('Waiting for opponent...', { icon: '⏳' });
    });

    socket.on('match:result', (data) => {
      setResult(data);
      router.push('/result');
    });

    socket.on('match:forfeit', (data) => {
      setResult({ ...data, resolveType: 'FORFEIT' });
      router.push('/result');
    });

    socket.on('match:time_up', () => {
      toast.error("Time's up!", { duration: 3000 });
    });

    socket.on('match:error', (data) => {
      toast.error(data.message);
      setEvaluating(false);
      setRunning(false);
    });

    if (timer) {
      const remaining = Math.floor((timer.endTs - Date.now()) / 1000);
      setTimeLeft(Math.max(0, remaining));
    }

    return () => {
      socket.off('match:timer_sync');
      socket.off('match:opponent_status');
      socket.off('match:submission_received');
      socket.off('match:evaluating');
      socket.off('match:evaluation_result');
      socket.off('match:run_started');
      socket.off('match:run_result');
      socket.off('match:waiting_opponent');
      socket.off('match:result');
      socket.off('match:forfeit');
      socket.off('match:time_up');
      socket.off('match:error');
    };
  }, [ready]);

  // Countdown
  useEffect(() => {
    if (timeLeft === null) return;
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { clearInterval(timerRef.current); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [timeLeft !== null]);

  const formatTime = (s) => {
    if (s === null) return '--:--';
    return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  };

  const getTimerColor = () => {
    if (timeLeft === null) return '#8888aa';
    if (timeLeft < 60)  return '#ef4444';
    if (timeLeft < 300) return '#f59e0b';
    return '#10b981';
  };

  const handleLanguageChange = (lang) => {
    if (submitted) return;
    setLanguage(lang);
    setCode(DEFAULT_CODE[lang]);
  };

  const handleRun = () => {
    if (!code.trim()) { toast.error('Write some code first'); return; }
    if (timeLeft === 0) { toast.error("Time's up"); return; }
    const socket = connectSocket();
    if (socket) socket.emit('code:run', { matchId: match.matchId, language, code });
  };

  const handleSubmit = () => {
    if (submitted) { toast.error('Already submitted'); return; }
    if (!code.trim()) { toast.error('Write some code first'); return; }
    if (timeLeft === 0) { toast.error("Time's up"); return; }
    const socket = connectSocket();
    if (socket) socket.emit('code:submit', { matchId: match.matchId, language, code });
    setSubmitted(true);
    setEvaluating(true);
    setActiveTab('result');
  };

  const handleEditorMount = (editor, monacoInstance) => {
    editorRef.current = editor;
    editor.addCommand(
      monacoInstance.KeyMod.CtrlCmd | monacoInstance.KeyCode.KeyV,
      () => toast.error('Pasting is disabled during a match')
    );
  };

  if (!ready || !match) return null;

  return (
    <div style={{
      height: '100vh', display: 'flex', flexDirection: 'column',
      background: '#0a0a0f', overflow: 'hidden',
    }}>
      {/* Top bar */}
      <div style={{
        height: '56px', background: '#111118',
        borderBottom: '1px solid #2a2a3a',
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 20px', flexShrink: 0, gap: '16px',
      }}>
        <motion.div
          animate={{ scale: timeLeft !== null && timeLeft < 60 ? [1,1.05,1] : 1 }}
          transition={{ duration: 0.5, repeat: timeLeft !== null && timeLeft < 60 ? Infinity : 0 }}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            background: '#1a1a24', border: '1px solid #2a2a3a',
            borderRadius: '8px', padding: '6px 14px',
          }}
        >
          <Clock size={16} color={getTimerColor()}/>
          <span style={{
            fontSize: '20px', fontWeight: 700,
            color: getTimerColor(),
            fontVariantNumeric: 'tabular-nums',
            letterSpacing: '0.05em',
          }}>
            {formatTime(timeLeft)}
          </span>
        </motion.div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: 'rgba(139,92,246,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '2px solid #7c3aed',
              fontSize: '12px', fontWeight: 700, color: '#8b5cf6',
            }}>
              {user?.username?.[0]?.toUpperCase()}
            </div>
            <span style={{ fontSize: '13px' }}>{user?.username}</span>
            {submitted && <Badge variant="success">Submitted</Badge>}
          </div>
          <span style={{ color: '#55556a', fontSize: '12px' }}>VS</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '13px' }}>{opponent?.username}</span>
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: opponentStatus === 'connected' ? 'rgba(16,185,129,0.2)' : 'rgba(85,85,106,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: `2px solid ${opponentStatus === 'submitted' ? '#f59e0b' : opponentStatus === 'connected' ? '#10b981' : '#55556a'}`,
              fontSize: '12px', fontWeight: 700,
              color: opponentStatus === 'connected' ? '#10b981' : '#8888aa',
            }}>
              {opponent?.username?.[0]?.toUpperCase()}
            </div>
            <Badge variant={opponentStatus === 'submitted' ? 'warning' : opponentStatus === 'connected' ? 'success' : 'default'}>
              {opponentStatus === 'submitted' ? 'Submitted' : opponentStatus === 'connected' ? 'Coding' : 'Waiting'}
            </Badge>
          </div>
        </div>

        <div style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          background: 'rgba(16,185,129,0.1)',
          border: '1px solid rgba(16,185,129,0.3)',
          borderRadius: '8px', padding: '6px 14px',
        }}>
          <Zap size={14} color="#10b981"/>
          <span style={{ fontSize: '14px', fontWeight: 600, color: '#10b981' }}>
            ₹{match.prizePool} prize
          </span>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* Left panel */}
        <div style={{
          width: '40%', borderRight: '1px solid #2a2a3a',
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
        }}>
          <div style={{ display: 'flex', borderBottom: '1px solid #2a2a3a', background: '#111118' }}>
            {[
              { id: 'problem',   label: 'Problem'    },
              { id: 'testcases', label: 'Test Cases'  },
              { id: 'result',    label: 'Result'      },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: '12px 20px', fontSize: '13px', fontWeight: 500,
                  color: activeTab === tab.id ? '#f0f0f5' : '#55556a',
                  borderBottom: activeTab === tab.id ? '2px solid #7c3aed' : '2px solid transparent',
                  background: 'none', transition: 'all 0.15s',
                }}
              >
                {tab.label}
                {tab.id === 'testcases' && runResults && (
                  <span style={{
                    marginLeft: '6px', fontSize: '11px',
                    color: runResults.passedCount === runResults.totalCount ? '#10b981' : '#f59e0b',
                  }}>
                    {runResults.passedCount}/{runResults.totalCount}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div style={{ flex: 1, overflow: 'auto', padding: '20px' }}>
            {activeTab === 'problem' && problem && (
              <div>
                <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '16px' }}>{problem.title}</h2>
                <p style={{ color: '#c0c0d0', lineHeight: 1.8, fontSize: '14px', whiteSpace: 'pre-wrap' }}>
                  {problem.description}
                </p>
                {problem.testCases?.filter(tc => tc.is_public).length > 0 && (
                  <div style={{ marginTop: '24px' }}>
                    <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '12px', color: '#8888aa' }}>EXAMPLES</div>
                    {problem.testCases.filter(tc => tc.is_public).map((tc, i) => (
                      <div key={i} style={{
                        background: '#0a0a0f', border: '1px solid #2a2a3a',
                        borderRadius: '8px', padding: '14px', marginBottom: '10px',
                      }}>
                        <div style={{ fontSize: '12px', color: '#55556a', marginBottom: '8px' }}>Example {i + 1}</div>
                        <div style={{ marginBottom: '8px' }}>
                          <div style={{ fontSize: '11px', color: '#8888aa', marginBottom: '4px' }}>Input</div>
                          <pre style={{ fontSize: '13px', color: '#10b981', margin: 0, fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>{tc.input}</pre>
                        </div>
                        <div>
                          <div style={{ fontSize: '11px', color: '#8888aa', marginBottom: '4px' }}>Expected Output</div>
                          <pre style={{ fontSize: '13px', color: '#8b5cf6', margin: 0, fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>{tc.expected_output}</pre>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <div style={{
                  marginTop: '20px', padding: '12px 16px',
                  background: 'rgba(124,58,237,0.08)',
                  border: '1px solid rgba(124,58,237,0.2)',
                  borderRadius: '8px', fontSize: '13px', color: '#8888aa',
                }}>
                  💡 <strong style={{ color: '#8b5cf6' }}>Run</strong> tests sample cases.{' '}
                  <strong style={{ color: '#10b981' }}>Submit</strong> runs all hidden test cases and locks your answer.
                </div>
              </div>
            )}

            {activeTab === 'testcases' && (
              <div>
                {running && (
                  <div style={{ textAlign: 'center', padding: '40px 0' }}>
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} style={{ display: 'inline-block', marginBottom: '12px' }}>
                      <Loader size={28} color="#7c3aed"/>
                    </motion.div>
                    <div style={{ color: '#8888aa', fontSize: '14px' }}>Running sample test cases...</div>
                  </div>
                )}
                {!running && !runResults && (
                  <div style={{ textAlign: 'center', padding: '40px 0', color: '#55556a', fontSize: '14px' }}>
                    Click <strong style={{ color: '#8b5cf6' }}>Run</strong> to test against sample cases
                  </div>
                )}
                {!running && runResults && (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                      <span style={{ fontSize: '14px', fontWeight: 600 }}>Sample test results</span>
                      <Badge variant={runResults.passedCount === runResults.totalCount ? 'success' : 'warning'}>
                        {runResults.passedCount}/{runResults.totalCount} passed
                      </Badge>
                    </div>
                    {runResults.results.map((r, i) => (
                      <div key={i} style={{
                        background: '#0a0a0f',
                        border: `1px solid ${r.passed ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
                        borderRadius: '8px', padding: '14px', marginBottom: '10px',
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                          <span style={{ fontSize: '13px', fontWeight: 500 }}>Test {r.index}</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {r.timeMs > 0 && <span style={{ fontSize: '11px', color: '#55556a' }}>{r.timeMs}ms</span>}
                            <Badge variant={r.passed ? 'success' : 'danger'}>{r.passed ? '✓ Passed' : '✗ Failed'}</Badge>
                          </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                          <div>
                            <div style={{ fontSize: '11px', color: '#55556a', marginBottom: '4px' }}>Input</div>
                            <pre style={{ fontSize: '12px', color: '#c0c0d0', margin: 0, fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>{r.input}</pre>
                          </div>
                          <div>
                            <div style={{ fontSize: '11px', color: '#55556a', marginBottom: '4px' }}>Expected</div>
                            <pre style={{ fontSize: '12px', color: '#8b5cf6', margin: 0, fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>{r.expected}</pre>
                          </div>
                        </div>
                        {!r.passed && (
                          <div style={{ marginTop: '8px' }}>
                            <div style={{ fontSize: '11px', color: '#ef4444', marginBottom: '4px' }}>Your output</div>
                            <pre style={{ fontSize: '12px', color: '#ef4444', margin: 0, fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>{r.actual || '(empty)'}</pre>
                          </div>
                        )}
                        {r.error && (
                          <div style={{ marginTop: '8px' }}>
                            <div style={{ fontSize: '11px', color: '#f59e0b', marginBottom: '4px' }}>Error</div>
                            <pre style={{ fontSize: '12px', color: '#f59e0b', margin: 0, fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>{r.error.slice(0, 200)}</pre>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'result' && (
              <div>
                {evaluating && (
                  <div style={{ textAlign: 'center', padding: '40px 0' }}>
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} style={{ display: 'inline-block', marginBottom: '16px' }}>
                      <Loader size={32} color="#7c3aed"/>
                    </motion.div>
                    <div style={{ color: '#f0f0f5', fontWeight: 500, marginBottom: '8px' }}>Evaluating your solution...</div>
                    <div style={{ color: '#8888aa', fontSize: '13px' }}>Running against all hidden test cases</div>
                  </div>
                )}
                {evalResult && !evaluating && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <div style={{ textAlign: 'center', padding: '24px 0 20px', borderBottom: '1px solid #2a2a3a', marginBottom: '20px' }}>
                      {evalResult.score === 100
                        ? <CheckCircle size={40} color="#10b981" style={{ marginBottom: '8px' }}/>
                        : <AlertCircle size={40} color="#ef4444" style={{ marginBottom: '8px' }}/>
                      }
                      <div style={{ fontSize: '40px', fontWeight: 800, color: evalResult.score === 100 ? '#10b981' : evalResult.score > 0 ? '#f59e0b' : '#ef4444' }}>
                        {evalResult.score}%
                      </div>
                      <div style={{ color: '#8888aa', fontSize: '14px', marginTop: '4px' }}>
                        {evalResult.passed}/{evalResult.total} test cases passed
                      </div>
                      <div style={{ marginTop: '8px' }}>
                        <Badge variant={evalResult.status === 'ACCEPTED' ? 'success' : evalResult.status === 'PARTIAL' ? 'warning' : 'danger'}>
                          {evalResult.status}
                        </Badge>
                      </div>
                    </div>
                    {evalResult.compileError && (
                      <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '8px', padding: '12px', marginBottom: '16px' }}>
                        <div style={{ fontSize: '12px', color: '#ef4444', marginBottom: '6px', fontWeight: 600 }}>Runtime Error</div>
                        <pre style={{ fontSize: '12px', color: '#f87171', margin: 0, whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>{evalResult.compileError.slice(0, 300)}</pre>
                      </div>
                    )}
                    <div style={{ padding: '14px', background: '#0a0a0f', borderRadius: '8px', fontSize: '14px', color: '#8888aa', textAlign: 'center' }}>
                      {evalResult.message}
                      <br/>
                      <span style={{ fontSize: '12px', color: '#55556a', marginTop: '4px', display: 'block' }}>Waiting for match to resolve...</span>
                    </div>
                  </motion.div>
                )}
                {!evaluating && !evalResult && (
                  <div style={{ textAlign: 'center', padding: '40px 0', color: '#55556a', fontSize: '14px' }}>
                    Click <strong style={{ color: '#10b981' }}>Submit</strong> to evaluate against all test cases
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Editor */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '8px 16px', background: '#111118', borderBottom: '1px solid #2a2a3a',
          }}>
            <div style={{ display: 'flex', gap: '6px' }}>
              {LANGUAGES.map(lang => {
              const available = availableLangs[lang.id] !== false;
              const active = language === lang.id;
              return (
                <button
                  key={lang.id}
                  onClick={() => available && handleLanguageChange(lang.id)}
                  disabled={submitted}
                  title={!available ? `${lang.label} not available on server` : ''}
                  style={{
                    padding: '5px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 500,
                    background: active ? 'rgba(124,58,237,0.2)' : 'transparent',
                    color: active ? '#8b5cf6' : available ? '#55556a' : '#3a3a4f',
                    border: `1px solid ${active ? 'rgba(124,58,237,0.4)' : 'transparent'}`,
                    cursor: submitted || !available ? 'not-allowed' : 'pointer',
                    transition: 'all 0.15s',
                    opacity: !available ? 0.4 : 1,
                    position: 'relative',
                  }}
                >
                  {lang.label}
                  {!available && (
                    <span style={{ fontSize: '9px', marginLeft: '3px', color: '#f59e0b' }}>✕</span>
                  )}
                </button>
              );
            })}
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <Button variant="secondary" size="sm" onClick={handleRun} loading={running} disabled={submitted || timeLeft === 0}>
                <Play size={13}/> Run
              </Button>
              <AnimatePresence>
                {!submitted ? (
                  <motion.div key="submit" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <Button variant="success" size="sm" onClick={handleSubmit} loading={evaluating} disabled={timeLeft === 0}>
                      <Zap size={13} fill="currentColor"/> Submit
                    </Button>
                  </motion.div>
                ) : (
                  <motion.div key="done" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#10b981', fontSize: '13px', fontWeight: 500, padding: '5px 10px' }}>
                    <CheckCircle size={14}/> Submitted
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div style={{ flex: 1, overflow: 'hidden' }}>
            <Editor
              height="100%"
              language={language}
              value={code}
              onChange={(val) => !submitted && setCode(val || '')}
              theme="vs-dark"
              onMount={handleEditorMount}
              options={{
                fontSize: 14,
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                padding: { top: 16 },
                lineNumbers: 'on',
                tabSize: 2,
                wordWrap: 'on',
                automaticLayout: true,
                readOnly: submitted,
                cursorBlinking: 'smooth',
                contextmenu: false,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}