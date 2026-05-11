'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Editor from '@monaco-editor/react';
import { Play, Send, ChevronLeft, Code2, CheckCircle, AlertCircle, Loader, Filter } from 'lucide-react';
import toast from 'react-hot-toast';
import Navbar from '@/components/Navbar';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import api from '@/lib/api';

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

const DIFFICULTY_COLORS = { easy: 'success', medium: 'warning', hard: 'danger' };

export default function PracticePage() {
  const [problems,        setProblems]       = useState([]);
  const [selectedProblem, setSelectedProblem] = useState(null);
  const [language,        setLanguage]        = useState('javascript');
  const [code,            setCode]            = useState(DEFAULT_CODE.javascript);
  const [loading,         setLoading]         = useState(true);
  const [running,         setRunning]         = useState(false);
  const [submitting,      setSubmitting]       = useState(false);
  const [runResults,      setRunResults]       = useState(null);
  const [submitResult,    setSubmitResult]     = useState(null);
  const [activeTab,       setActiveTab]        = useState('problem');
  const [filterDiff,      setFilterDiff]       = useState('all');
  const [filterCat,       setFilterCat]        = useState('all');
  const [solvedSet,       setSolvedSet]        = useState(new Set());
  const router = useRouter();

  useEffect(() => {
    loadProblems();
  }, [filterDiff, filterCat]);

  const loadProblems = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterDiff !== 'all') params.set('difficulty', filterDiff);
      if (filterCat  !== 'all') params.set('category',   filterCat);
      const res = await api.get(`/api/practice/problems?${params}`);
      setProblems(res.data.data);
    } catch {
      toast.error('Failed to load problems');
    } finally {
      setLoading(false);
    }
  };

  const selectProblem = (problem) => {
    setSelectedProblem(problem);
    setCode(DEFAULT_CODE[language]);
    setRunResults(null);
    setSubmitResult(null);
    setActiveTab('problem');
  };

  const handleLanguageChange = (lang) => {
    setLanguage(lang);
    setCode(DEFAULT_CODE[lang]);
    setRunResults(null);
  };

  const handleRun = async () => {
    if (!selectedProblem) return;
    if (!code.trim()) { toast.error('Write some code first'); return; }
    setRunning(true);
    setRunResults(null);
    setActiveTab('testcases');
    try {
      const res = await api.post('/api/practice/run', {
        problemId: selectedProblem.id,
        language,
        code,
      });
      setRunResults(res.data.data);
      const { passedCount, totalCount } = res.data.data;
      if (passedCount === totalCount) toast.success(`All ${totalCount} sample tests passed!`);
      else toast(`${passedCount}/${totalCount} sample tests passed`, { icon: '⚠️' });
    } catch (err) {
      toast.error('Run failed');
    } finally {
      setRunning(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedProblem) return;
    if (!code.trim()) { toast.error('Write some code first'); return; }
    setSubmitting(true);
    setSubmitResult(null);
    setActiveTab('result');
    try {
      const res = await api.post('/api/practice/submit', {
        problemId: selectedProblem.id,
        language,
        code,
      });
      const result = res.data.data;
      setSubmitResult(result);
      if (result.score === 100) {
        toast.success('Problem solved! 🎉');
        setSolvedSet(prev => new Set([...prev, selectedProblem.id]));
      } else if (result.score > 0) {
        toast(`${result.passed}/${result.total} test cases passed`, { icon: '⚠️' });
      } else {
        toast.error(result.compileError ? 'Runtime error' : 'Wrong answer');
      }
    } catch (err) {
      toast.error('Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  const categories = ['all', 'arrays', 'strings', 'math', 'algorithms', 'data-structures'];
  const difficulties = ['all', 'easy', 'medium', 'hard'];

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0f' }}>
      <Navbar/>

      {!selectedProblem ? (
        // Problem list view
        <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '40px 24px' }}>
          <div style={{ marginBottom: '32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <div style={{
                width: 36, height: 36, borderRadius: '10px',
                background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Code2 size={18} color="#fff"/>
              </div>
              <h1 style={{ fontSize: '32px', fontWeight: 700 }}>Practice</h1>
            </div>
            <p style={{ color: '#8888aa' }}>
              Solve problems for free. No entry fee. Perfect your skills before competing.
            </p>
          </div>

          {/* Filters */}
          <div style={{ display: 'flex', gap: '24px', marginBottom: '24px', flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: '12px', color: '#55556a', marginBottom: '8px', fontWeight: 500 }}>DIFFICULTY</div>
              <div style={{ display: 'flex', gap: '6px' }}>
                {difficulties.map(d => (
                  <button
                    key={d}
                    onClick={() => setFilterDiff(d)}
                    style={{
                      padding: '5px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: 500,
                      background: filterDiff === d ? 'rgba(124,58,237,0.2)' : '#111118',
                      border: `1px solid ${filterDiff === d ? '#7c3aed' : '#2a2a3a'}`,
                      color: filterDiff === d ? '#8b5cf6' : '#8888aa',
                      cursor: 'pointer', textTransform: 'capitalize',
                    }}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: '#55556a', marginBottom: '8px', fontWeight: 500 }}>CATEGORY</div>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {categories.map(c => (
                  <button
                    key={c}
                    onClick={() => setFilterCat(c)}
                    style={{
                      padding: '5px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: 500,
                      background: filterCat === c ? 'rgba(124,58,237,0.2)' : '#111118',
                      border: `1px solid ${filterCat === c ? '#7c3aed' : '#2a2a3a'}`,
                      color: filterCat === c ? '#8b5cf6' : '#8888aa',
                      cursor: 'pointer', textTransform: 'capitalize',
                    }}
                  >
                    {c.replace('-', ' ')}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Problem list */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px', color: '#55556a' }}>Loading problems...</div>
          ) : problems.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px', color: '#55556a' }}>
              No problems found for this filter.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {problems.map((problem, i) => (
                <motion.div
                  key={problem.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  onClick={() => selectProblem(problem)}
                  whileHover={{ scale: 1.005 }}
                  style={{
                    background: '#111118',
                    border: `1px solid ${solvedSet.has(problem.id) ? 'rgba(16,185,129,0.3)' : '#2a2a3a'}`,
                    borderRadius: '10px', padding: '16px 20px',
                    display: 'flex', alignItems: 'center',
                    justifyContent: 'space-between', gap: '16px',
                    cursor: 'pointer', transition: 'all 0.15s',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1 }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: '8px', flexShrink: 0,
                      background: solvedSet.has(problem.id) ? 'rgba(16,185,129,0.15)' : 'rgba(124,58,237,0.1)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {solvedSet.has(problem.id)
                        ? <CheckCircle size={16} color="#10b981"/>
                        : <Code2 size={16} color="#8b5cf6"/>
                      }
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '15px', marginBottom: '4px' }}>
                        {problem.title}
                      </div>
                      <div style={{ fontSize: '12px', color: '#55556a', textTransform: 'capitalize' }}>
                        {problem.category?.replace('-', ' ')}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Badge variant={DIFFICULTY_COLORS[problem.difficulty]}>
                      {problem.difficulty}
                    </Badge>
                    <div style={{ fontSize: '12px', color: '#55556a' }}>
                      {(problem.test_cases || []).length} examples
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      ) : (
        // Problem solving view — split layout like match screen
        <div style={{ height: 'calc(100vh - 64px)', display: 'flex', overflow: 'hidden' }}>

          {/* Left panel */}
          <div style={{
            width: '40%', borderRight: '1px solid #2a2a3a',
            display: 'flex', flexDirection: 'column', overflow: 'hidden',
          }}>
            {/* Back button */}
            <div style={{
              padding: '12px 16px', borderBottom: '1px solid #2a2a3a',
              background: '#111118', display: 'flex', alignItems: 'center', gap: '12px',
            }}>
              <button
                onClick={() => { setSelectedProblem(null); setSubmitResult(null); setRunResults(null); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  color: '#8888aa', background: 'none', border: 'none',
                  cursor: 'pointer', fontSize: '13px', padding: '4px 8px',
                  borderRadius: '6px', transition: 'color 0.15s',
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#f0f0f5'}
                onMouseLeave={(e) => e.currentTarget.style.color = '#8888aa'}
              >
                <ChevronLeft size={16}/> All Problems
              </button>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: 'auto' }}>
                <Badge variant={DIFFICULTY_COLORS[selectedProblem.difficulty]}>
                  {selectedProblem.difficulty}
                </Badge>
                <span style={{ fontSize: '12px', color: '#55556a', textTransform: 'capitalize' }}>
                  {selectedProblem.category?.replace('-', ' ')}
                </span>
              </div>
            </div>

            {/* Tabs */}
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
                    padding: '10px 20px', fontSize: '13px', fontWeight: 500,
                    color: activeTab === tab.id ? '#f0f0f5' : '#55556a',
                    borderBottom: activeTab === tab.id ? '2px solid #7c3aed' : '2px solid transparent',
                    background: 'none', transition: 'all 0.15s',
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div style={{ flex: 1, overflow: 'auto', padding: '20px' }}>

              {activeTab === 'problem' && (
                <div>
                  <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '16px' }}>
                    {selectedProblem.title}
                  </h2>
                  <p style={{ color: '#c0c0d0', lineHeight: 1.8, fontSize: '14px', whiteSpace: 'pre-wrap' }}>
                    {selectedProblem.description}
                  </p>
                  {selectedProblem.test_cases?.length > 0 && (
                    <div style={{ marginTop: '24px' }}>
                      <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '12px', color: '#8888aa' }}>EXAMPLES</div>
                      {selectedProblem.test_cases.map((tc, i) => (
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
                    background: 'rgba(16,185,129,0.08)',
                    border: '1px solid rgba(16,185,129,0.2)',
                    borderRadius: '8px', fontSize: '13px', color: '#8888aa',
                  }}>
                    🆓 Practice mode — free, no entry fee, no hearts lost.
                    Submit as many times as you want.
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
                      <div style={{ color: '#8888aa' }}>Running test cases...</div>
                    </div>
                  )}
                  {!running && !runResults && (
                    <div style={{ textAlign: 'center', padding: '40px 0', color: '#55556a', fontSize: '14px' }}>
                      Click <strong style={{ color: '#8b5cf6' }}>Run</strong> to test your code
                    </div>
                  )}
                  {!running && runResults && (
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                        <span style={{ fontSize: '14px', fontWeight: 600 }}>Test Results</span>
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
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                              {r.timeMs > 0 && <span style={{ fontSize: '11px', color: '#55556a' }}>{r.timeMs}ms</span>}
                              <Badge variant={r.passed ? 'success' : 'danger'}>{r.passed ? '✓' : '✗'}</Badge>
                            </div>
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
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
                  {submitting && (
                    <div style={{ textAlign: 'center', padding: '40px 0' }}>
                      <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} style={{ display: 'inline-block', marginBottom: '16px' }}>
                        <Loader size={32} color="#7c3aed"/>
                      </motion.div>
                      <div style={{ color: '#f0f0f5', fontWeight: 500 }}>Evaluating...</div>
                      <div style={{ color: '#8888aa', fontSize: '13px', marginTop: '4px' }}>Running against all test cases</div>
                    </div>
                  )}
                  {submitResult && !submitting && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                      <div style={{ textAlign: 'center', padding: '32px 0 24px', borderBottom: '1px solid #2a2a3a', marginBottom: '20px' }}>
                        {submitResult.score === 100
                          ? <CheckCircle size={48} color="#10b981" style={{ marginBottom: '12px' }}/>
                          : <AlertCircle size={48} color="#ef4444" style={{ marginBottom: '12px' }}/>
                        }
                        <div style={{
                          fontSize: '48px', fontWeight: 800,
                          color: submitResult.score === 100 ? '#10b981' : submitResult.score > 0 ? '#f59e0b' : '#ef4444',
                        }}>
                          {submitResult.score}%
                        </div>
                        <div style={{ color: '#8888aa', fontSize: '14px', marginTop: '6px' }}>
                          {submitResult.passed}/{submitResult.total} test cases passed
                        </div>
                        <div style={{ marginTop: '10px' }}>
                          <Badge variant={submitResult.status === 'ACCEPTED' ? 'success' : submitResult.status === 'PARTIAL' ? 'warning' : 'danger'}>
                            {submitResult.status === 'ACCEPTED' ? '✓ Accepted' : submitResult.status === 'PARTIAL' ? 'Partial' : 'Wrong Answer'}
                          </Badge>
                        </div>
                        {submitResult.score === 100 && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            style={{ marginTop: '16px', fontSize: '14px', color: '#10b981' }}
                          >
                            🎉 Problem solved! Ready to compete for real money?
                          </motion.div>
                        )}
                      </div>
                      {submitResult.compileError && (
                        <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '8px', padding: '12px', marginBottom: '16px' }}>
                          <div style={{ fontSize: '12px', color: '#ef4444', marginBottom: '6px', fontWeight: 600 }}>Runtime Error</div>
                          <pre style={{ fontSize: '12px', color: '#f87171', margin: 0, whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>{submitResult.compileError.slice(0, 300)}</pre>
                        </div>
                      )}
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <Button
                          variant="secondary" size="sm" fullWidth
                          onClick={() => { setSubmitResult(null); setActiveTab('problem'); }}
                        >
                          Try again
                        </Button>
                        {submitResult.score === 100 && (
                          <Button
                            size="sm" fullWidth
                            onClick={() => router.push('/lobby')}
                          >
                            Compete now →
                          </Button>
                        )}
                      </div>
                    </motion.div>
                  )}
                  {!submitting && !submitResult && (
                    <div style={{ textAlign: 'center', padding: '40px 0', color: '#55556a', fontSize: '14px' }}>
                      Click <strong style={{ color: '#10b981' }}>Submit</strong> to evaluate your solution
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right: Editor */}
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
              <div style={{ display: 'flex', gap: '8px' }}>
                <Button variant="secondary" size="sm" onClick={handleRun} loading={running}>
                  <Play size={13}/> Run
                </Button>
                <Button variant="success" size="sm" onClick={handleSubmit} loading={submitting}>
                  <Send size={13}/> Submit
                </Button>
              </div>
            </div>

            <div style={{ flex: 1, overflow: 'hidden' }}>
              <Editor
                height="100%"
                language={language}
                value={code}
                onChange={(val) => setCode(val || '')}
                theme="vs-dark"
                options={{
                  fontSize: 14,
                  minimap: { enabled: false },
                  scrollBeyondLastLine: false,
                  padding: { top: 16 },
                  lineNumbers: 'on',
                  tabSize: 2,
                  wordWrap: 'on',
                  automaticLayout: true,
                  cursorBlinking: 'smooth',
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}