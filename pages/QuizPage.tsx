import React, { useState, useEffect } from 'react';
import Button from '../components/Button';
import { fetchQuizQuestions, saveQuizResult, fetchScopes, fetchSubjects } from '../services/gasService';
import { Question, QuizResult } from '../types';

const QuizPage: React.FC = () => {
  const [step, setStep] = useState<'setup' | 'quiz' | 'result'>('setup');
  
  const [subjects, setSubjects] = useState<string[]>([]);
  const [isSubjectsLoading, setIsSubjectsLoading] = useState(true);
  
  const [subject, setSubject] = useState('');
  const [scope, setScope] = useState('');
  const [availableScopes, setAvailableScopes] = useState<string[]>([]);
  const [isScopesLoading, setIsScopesLoading] = useState(false);
  
  // 新增：題目數量設定，預設 5 題
  const [questionCount, setQuestionCount] = useState<number>(5);

  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<QuizResult[]>([]);
  const [score, setScore] = useState(0);

  // 初始化：從 GAS 讀取所有可用的科目
  useEffect(() => {
    const loadSubjects = async () => {
      setIsSubjectsLoading(true);
      try {
        const fetchedSubjects = await fetchSubjects();
        setSubjects(fetchedSubjects);
        if (fetchedSubjects.length > 0) {
          setSubject(fetchedSubjects[0]);
        }
      } catch (error) {
        console.error("Failed to load subjects", error);
      } finally {
        setIsSubjectsLoading(false);
      }
    };

    loadSubjects();
  }, []);

  // 當科目改變時，抓取對應的範圍列表
  useEffect(() => {
    if (!subject) {
      setAvailableScopes([]);
      setScope('');
      return;
    }

    const loadScopes = async () => {
      setIsScopesLoading(true);
      setScope(''); // 重置目前選擇的範圍
      setAvailableScopes([]);
      try {
        const scopes = await fetchScopes(subject);
        setAvailableScopes(scopes);
        if (scopes.length > 0) {
          setScope(scopes[0]); // 預設選擇第一個
        }
      } catch (error) {
        console.error("Failed to load scopes", error);
      } finally {
        setIsScopesLoading(false);
      }
    };

    loadScopes();
  }, [subject]);

  const startQuiz = async () => {
    if (!scope.trim()) {
      alert("請選擇範圍 / 章節。");
      return;
    }
    setIsLoading(true);
    try {
      const q = await fetchQuizQuestions(subject, scope);
      if (q.length === 0) {
        alert("在此科目/範圍找不到題目。");
        return;
      }
      
      // 洗牌
      const shuffled = [...q].sort(() => 0.5 - Math.random());
      
      // 根據選擇的數量擷取題目 (若選全部則使用極大值)
      const limit = questionCount === -1 ? shuffled.length : questionCount;
      const selectedQuestions = shuffled.slice(0, limit);

      // 如果實際題目少於要求數量，顯示提示 (非錯誤)
      if (questionCount !== -1 && selectedQuestions.length < questionCount) {
         // 選擇性提示，或者直接開始
         // alert(`注意：資料庫中目前只有 ${selectedQuestions.length} 題符合條件，將全部列出。`);
      }

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
      await saveQuizResult({
        subject,
        scope,
        results: calcResults
      });
      setStep('result');
    } catch (e) {
      alert("測驗已提交，但儲存紀錄失敗。");
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

          {/* 範圍選擇 */}
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
            disabled={isSubjectsLoading || isScopesLoading || subjects.length === 0 || availableScopes.length === 0}
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
        
        {questions.map((q, idx) => (
          <div key={idx} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h3 className="font-semibold text-lg text-slate-900 mb-4">
              <span className="text-slate-400 mr-2">{idx + 1}.</span>
              {q.text}
            </h3>
            
            {/* 顯示題目配圖 (如果有) */}
            {q.diagramUrl && (
              <div className="mb-6 flex justify-center bg-slate-50 p-4 rounded-lg border border-slate-100">
                <img 
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
                  className={`flex items-center p-3 rounded-lg border cursor-pointer transition-colors ${
                    answers[idx] === opt 
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
        ))}

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
          return (
            <div key={idx} className={`p-6 rounded-xl border ${res.isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
               <div className="flex justify-between items-start mb-2">
                 <h3 className="font-semibold text-slate-900">{q.text}</h3>
                 <span className={`text-sm font-bold ${res.isCorrect ? 'text-green-700' : 'text-red-700'}`}>
                   {res.isCorrect ? '答對' : '答錯'}
                 </span>
               </div>
               
               {/* 結果頁也要顯示圖片 */}
               {q.diagramUrl && (
                  <div className="my-3 flex justify-start">
                    <img 
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