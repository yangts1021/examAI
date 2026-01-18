import React, { useState, useEffect } from 'react';
import Button from '../components/Button';
import QuestionImage from '../components/QuestionImage';
import { fetchQuizQuestions, saveQuizResult, fetchScopes, fetchSubjects } from '../services/gasService';
import { Question, QuizResult } from '../types';

interface QuizPageProps {
  initialQuestions?: Question[];
  initialSubject?: string;
  initialScope?: string;
}

const QuizPage: React.FC<QuizPageProps> = ({ initialQuestions, initialSubject, initialScope }) => {
  const [step, setStep] = useState<'setup' | 'quiz' | 'result'>('setup');

  const [subjects, setSubjects] = useState<string[]>([]);
  const [isSubjectsLoading, setIsSubjectsLoading] = useState(true);

  const [subject, setSubject] = useState('');
  const [scope, setScope] = useState('');
  const [availableScopes, setAvailableScopes] = useState<string[]>([]);
  const [isScopesLoading, setIsScopesLoading] = useState(false);

  const [questionCount, setQuestionCount] = useState<number>(5);

  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<QuizResult[]>([]);
  const [score, setScore] = useState(0);

  // 初始化：如果有傳入題目 (複習模式)，直接進入測驗
  useEffect(() => {
    if (initialQuestions && initialQuestions.length > 0) {
      setQuestions(initialQuestions);
      setStep('quiz');
      // Set subject and scope from props if available, otherwise fallback
      if (initialSubject) setSubject(initialSubject);
      if (initialScope) setScope(initialScope);

      // If subject is missing (legacy), try to fallback to a string, though it's better to rely on prop
      if (!initialSubject) {
        // @ts-ignore
        setSubject(initialQuestions[0].subject || '錯題複習');
      }
    }
  }, [initialQuestions, initialSubject, initialScope]);

  // 初始化：從 GAS 讀取所有可用的科目
  useEffect(() => {
    // 如果是複習模式 (已經有題目)，不要重新讀取科目，以免覆蓋 subject
    if (initialQuestions && initialQuestions.length > 0) {
      return;
    }

    const loadSubjects = async () => {
      setIsSubjectsLoading(true);
      try {
        const fetchedSubjects = await fetchSubjects();
        if (fetchedSubjects.length > 0) {
          setSubjects(fetchedSubjects);
          setSubject(fetchedSubjects[0]);
        } else {
          throw new Error("No subjects from GAS");
        }
      } catch (error) {
        console.warn("Failed to load subjects online, trying offline...", error);
        // Fallback to offline
        try {
          const { offlineService } = await import('../services/offlineService');
          const offlineSubjects = await offlineService.getSubjects();
          setSubjects(offlineSubjects);
          if (offlineSubjects.length > 0) {
            setSubject(offlineSubjects[0]);
          }
        } catch (offlineError) {
          console.error("Failed to load offline subjects", offlineError);
        }
      } finally {
        setIsSubjectsLoading(false);
      }
    };

    loadSubjects();
  }, [initialQuestions]);

  // 當科目改變時，抓取對應的範圍列表
  useEffect(() => {
    // 如果是複習模式，不要自動讀取範圍以免覆蓋 scope
    if (initialQuestions && initialQuestions.length > 0) {
      return;
    }

    if (!subject) {
      setAvailableScopes([]);
      setScope('');
      return;
    }

    const loadScopes = async () => {
      setIsScopesLoading(true);
      setScope(''); // 重置目前選擇的範圍
      setAvailableScopes([]);

      // Special casing for cross-subject mode is handled by UI hiding this selector, 
      // but double check here if needed? No, purely relying on subject change is fine.
      if (subject === '🏆 李天豪跨科總複習') return;

      try {
        const scopes = await fetchScopes(subject);
        if (scopes.length > 0) {
          setAvailableScopes(scopes);
          setScope(scopes[0]);
        } else {
          throw new Error("No scopes from GAS");
        }
      } catch (error) {
        console.warn("Failed to load scopes online, trying offline...", error);
        try {
          const { offlineService } = await import('../services/offlineService');
          const offlineScopes = await offlineService.getScopes(subject);
          setAvailableScopes(offlineScopes);
          if (offlineScopes.length > 0) {
            setScope(offlineScopes[0]);
          }
        } catch (offlineErr) {
          console.error("Failed to load offline scopes", offlineErr);
        }
      } finally {
        setIsScopesLoading(false);
      }
    };

    loadScopes();
  }, [subject, initialQuestions]);

  const startQuiz = async () => {
    const isCrossSubject = subject === '🏆 李天豪跨科總複習';

    if (!isCrossSubject && !scope.trim()) {
      alert("請選擇範圍 / 章節。");
      return;
    }
    setIsLoading(true);
    try {
      let q: Question[] = [];
      if (isCrossSubject) {
        // Use offline service for cross-subject
        // Dynamically import to avoid circular dep issues if any, or just import at top.
        // Assuming offlineService is imported or available.
        // We need to import it at top of file. 
        const { offlineService } = await import('../services/offlineService');
        q = await offlineService.getCrossSubjectQuestions('李天豪');
      } else {
        // Normal mode: Try online first, fallback to offline
        try {
          q = await fetchQuizQuestions(subject, scope);
          if (q.length === 0) throw new Error("No questions online");
        } catch (onlineErr) {
          console.warn("Failed to fetch questions online, trying offline...", onlineErr);
          const { offlineService } = await import('../services/offlineService');
          q = await offlineService.getQuestions(subject, scope);
        }
      }

      if (q.length === 0) {
        alert(isCrossSubject ? "找不到含有「李天豪」的相關題目 (請先下載離線題庫)。" : "在此科目/範圍找不到題目。");
        return;
      }

      // --- Group-based Shuffling Logic Start ---
      const groups: Record<string, Question[]> = {};

      // 1. Group questions
      q.forEach(question => {
        // Use groupId if available, otherwise create a unique key for single questions
        const key = question.groupId ? question.groupId : `single-${question.id || Math.random()}`;
        if (!groups[key]) {
          groups[key] = [];
        }
        groups[key].push(question);
      });

      // 2. Shuffle the group keys
      const groupKeys = Object.keys(groups).sort(() => 0.5 - Math.random());

      // 3. Reconstruct the list, respecting the limit
      let selectedQuestions: Question[] = [];
      const limit = questionCount === -1 ? q.length : questionCount;

      for (const key of groupKeys) {
        if (selectedQuestions.length >= limit) break;

        // Ensure questions within a group are sorted by question number (if available) to maintain logical order
        const groupQuestions = groups[key].sort((a, b) => (a.questionNumber || 0) - (b.questionNumber || 0));

        selectedQuestions.push(...groupQuestions);
      }

      // Note: This might slightly exceed 'limit' if the last group added has multiple questions.
      // We explicitly ALLOW this to keep groups intact.
      // E.g. limit is 5, we have 4 questions, next group has 3. Total becomes 7.
      // if (selectedQuestions.length > limit) {
      //    selectedQuestions = selectedQuestions.slice(0, limit);
      // }

      // --- Group-based Shuffling Logic End ---

      setQuestions(selectedQuestions);
      setStep('quiz');
      setAnswers({});
    } catch (e) {
      alert("啟動測驗時發生錯誤。");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnswerSelect = (questionIdx: number, answer: string) => {
    setAnswers(prev => ({ ...prev, [questionIdx]: answer }));
  };

  const submitQuiz = async () => {
    // Calculate results
    let correctCount = 0;
    const calcResults: QuizResult[] = questions.map((q, idx) => {
      const selected = answers[idx] || '';
      const isCorrect = selected === q.correctAnswer;
      if (isCorrect) correctCount++;
      return {
        questionNumber: q.questionNumber || (idx + 1),
        selectedAnswer: selected,
        isCorrect,
        correctAnswer: q.correctAnswer
      };
    });

    setResults(calcResults);
    setScore(correctCount);

    setIsLoading(true);
    try {
      const submission = {
        subject,
        scope,
        results: calcResults
      };

      // Try online save first
      const success = await saveQuizResult(submission);
      if (!success) {
        throw new Error("Online save failed");
      }
      setStep('result');
    } catch (e) {
      console.warn("Online save failed, saving locally...", e);
      try {
        const { offlineService } = await import('../services/offlineService');
        await offlineService.saveOfflineResult(
          { subject, scope, results: calcResults },
          correctCount,
          questions.length
        );
        alert("網路不穩，測驗結果已先儲存於本機。下次同步時將自動上傳。");
      } catch (localErr) {
        console.error("Local save failed", localErr);
        alert("測驗已提交，但儲存紀錄失敗 (同時無法寫入本機資料庫)。");
      }
      setStep('result');
    } finally {
      setIsLoading(false);
    }
  };

  const restart = () => {
    setStep('setup');
    setQuestions([]);
    setAnswers({});
    setResults([]);
    setScore(0);
    // Keep current subject/scope selection
  };

  if (step === 'setup') {
    return (
      <div className="max-w-xl mx-auto bg-white p-8 rounded-xl shadow-md border border-slate-200">
        <h2 className="text-2xl font-bold text-slate-800 mb-6">測驗設定</h2>
        <div className="space-y-4">
          {/* 科目選擇 */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">科目</label>
            {isSubjectsLoading ? (
              <div className="w-full rounded-lg border border-slate-300 p-2.5 bg-slate-100 text-slate-500 flex items-center">
                <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-slate-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                載入科目中...
              </div>
            ) : subjects.length > 0 ? (
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full rounded-lg border-slate-300 focus:ring-blue-500 focus:border-blue-500 p-2.5 bg-white text-slate-900"
              >
                <option value="🏆 李天豪跨科總複習">🏆 李天豪跨科總複習</option>
                {subjects.map(opt => (
                  <option key={opt} value={opt} className="bg-white text-slate-900">{opt}</option>
                ))}
              </select>
            ) : (
              <div className="text-red-500 text-sm p-2 bg-red-50 rounded border border-red-100">
                目前資料庫中沒有任何科目資料。請先上傳試卷。
              </div>
            )}
          </div>

          {/* 範圍選擇 (當選擇跨科複習時隱藏) */}
          {subject !== '🏆 李天豪跨科總複習' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">範圍 / 章節</label>
              {isScopesLoading ? (
                <div className="w-full rounded-lg border border-slate-300 p-2.5 bg-slate-100 text-slate-500 flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-slate-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  載入範圍中...
                </div>
              ) : availableScopes.length > 0 ? (
                <select
                  value={scope}
                  onChange={(e) => setScope(e.target.value)}
                  className="w-full rounded-lg border-slate-300 focus:ring-blue-500 focus:border-blue-500 p-2.5 bg-white text-slate-900"
                >
                  {availableScopes.map(s => (
                    <option key={s} value={s} className="bg-white text-slate-900">{s}</option>
                  ))}
                </select>
              ) : (
                <div className="text-slate-500 text-sm p-2 bg-slate-50 rounded border border-slate-200">
                  {subject ? "此科目目前沒有已儲存的考題範圍。" : "請先選擇科目"}
                </div>
              )}
            </div>
          )}

          {/* 題目數量選擇 */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">題目數量</label>
            <select
              value={questionCount}
              onChange={(e) => setQuestionCount(Number(e.target.value))}
              className="w-full rounded-lg border-slate-300 focus:ring-blue-500 focus:border-blue-500 p-2.5 bg-white text-slate-900"
            >
              <option value={5}>5 題</option>
              <option value={10}>10 題</option>
              <option value={20}>20 題</option>
              <option value={30}>30 題</option>
              <option value={50}>50 題</option>
              <option value={100}>100 題</option>
              <option value={-1}>全部題目</option>
            </select>
            <p className="text-xs text-slate-500 mt-1">若資料庫題數不足，將顯示所有可用題目。</p>
          </div>

          <Button
            onClick={startQuiz}
            className="w-full mt-4"
            isLoading={isLoading}
            disabled={isSubjectsLoading || subjects.length === 0 || (subject !== '🏆 李天豪跨科總複習' && (isScopesLoading || availableScopes.length === 0))}
          >
            開始測驗
          </Button>
        </div>
      </div>
    );
  }

  if (step === 'quiz') {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-slate-800">{subject} - {scope}</h2>
          <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded">
            已作答 {Object.keys(answers).length} / {questions.length} 題
          </span>
        </div>

        {questions.map((q, idx) => {
          // Check if we need to display the group passage
          // Display if: It has groupContent AND (it's the first question OR the previous question's groupId is different)
          const showPassage = q.groupContent && (idx === 0 || questions[idx - 1].groupId !== q.groupId);

          return (
            <div key={idx} className="space-y-4">
              {/* Reading Passage Block */}
              {showPassage && (
                <div className="bg-orange-50 p-6 rounded-xl border-l-4 border-orange-400 shadow-sm animate-fade-in">
                  <h3 className="font-bold text-orange-800 mb-3 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd" />
                    </svg>
                    閱讀題組 / Reading Passage
                  </h3>
                  <div className="text-slate-800 whitespace-pre-wrap leading-relaxed text-sm">
                    {q.groupContent}
                  </div>
                </div>
              )}

              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <h3 className="font-semibold text-lg text-slate-900 mb-4">
                  <span className="text-slate-400 mr-2">{idx + 1}.</span>
                  {q.text}
                </h3>

                {/* 顯示題目配圖 (如果有) */}
                {/* 顯示題目配圖 (如果有) */}
                {q.diagramUrl && (
                  <div className="mb-6 flex justify-center bg-slate-50 p-4 rounded-lg border border-slate-100">
                    <QuestionImage
                      src={q.diagramUrl}
                      alt={`Diagram for Question ${q.questionNumber || idx + 1}`}
                      className="max-h-64 max-w-full object-contain rounded"
                    />
                  </div>
                )}

                <div className="space-y-2">
                  {['A', 'B', 'C', 'D'].map((opt) => (
                    <label
                      key={opt}
                      className={`flex items-center p-3 rounded-lg border cursor-pointer transition-colors ${answers[idx] === opt
                        ? 'bg-blue-50 border-blue-500 ring-1 ring-blue-500'
                        : 'border-slate-200 hover:bg-slate-50'
                        }`}
                    >
                      <input
                        type="radio"
                        name={`q-${idx}`}
                        value={opt}
                        checked={answers[idx] === opt}
                        onChange={() => handleAnswerSelect(idx, opt)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                      />
                      <span className="ml-3 text-slate-700">
                        <span className="font-bold mr-2">{opt}.</span>
                        {/* @ts-ignore */}
                        {q[`option${opt}`]}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          );
        })}

        <div className="flex justify-end pt-6">
          <Button
            onClick={submitQuiz}
            disabled={Object.keys(answers).length !== questions.length}
            isLoading={isLoading}
          >
            提交答案
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white p-8 rounded-xl shadow-md border border-slate-200 text-center mb-8">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 text-green-600">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </div>
        <h2 className="text-3xl font-bold text-slate-900 mb-2">測驗完成！</h2>
        <p className="text-xl text-slate-600">
          你的得分： <span className="font-bold text-blue-600">{score}</span> / <span className="font-bold">{questions.length}</span>
        </p>
      </div>

      <div className="space-y-6">
        {questions.map((q, idx) => {
          const res = results[idx];
          // Result page also needs to show the passage context for clarity
          const showPassage = q.groupContent && (idx === 0 || questions[idx - 1].groupId !== q.groupId);

          return (
            <div key={idx} className="space-y-4">
              {showPassage && (
                <div className="bg-slate-100 p-4 rounded-lg border-l-4 border-slate-400 text-sm text-slate-600">
                  <p className="font-bold mb-1">[閱讀題組文章]</p>
                  {q.groupContent}
                </div>
              )}

              <div className={`p-6 rounded-xl border ${res.isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-slate-900">{q.text}</h3>
                  <span className={`text-sm font-bold ${res.isCorrect ? 'text-green-700' : 'text-red-700'}`}>
                    {res.isCorrect ? '答對' : '答錯'}
                  </span>
                </div>

                {q.diagramUrl && (
                  <div className="my-3 flex justify-start">
                    <QuestionImage
                      src={q.diagramUrl}
                      alt="Question Diagram"
                      className="max-h-40 max-w-full object-contain rounded border border-slate-300 p-1 bg-white"
                    />
                  </div>
                )}

                <div className="text-sm text-slate-600 mb-2">
                  你的答案： <span className="font-medium">{res.selectedAnswer}</span>
                </div>
                {!res.isCorrect && (
                  <div className="text-sm text-green-700 font-medium mb-2">
                    正確答案： {q.correctAnswer}
                  </div>
                )}
                <div className="mt-4 p-3 bg-white/60 rounded-lg text-sm text-slate-700">
                  <span className="font-bold">詳解： </span>{q.explanation}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-8 flex justify-center">
        <Button onClick={restart} variant="outline">再測驗一次</Button>
      </div>
    </div>
  );
};

export default QuizPage;
