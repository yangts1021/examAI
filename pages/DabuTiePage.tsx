import React, { useEffect, useMemo, useState } from 'react';
import Button from '../components/Button';
import {
  DABU_TIE_SCOPES,
  DabuTieQuestion,
  DabuTieScope,
  getQuestionById,
  getScopeById,
} from '../data/dabuTie';
import {
  DabuTieAttempt,
  DabuTieWrongSummary,
  clearAllWrong,
  clearWrongForQuestion,
  getWrongSummary,
  isAnswerCorrect,
  saveAttempts,
} from '../services/dabuTieService';

type Mode = 'select' | 'practice' | 'result';
type Source = 'all' | 'wrong';
type SectionFilter = 'all' | 'character_phonetic' | 'definition';

interface GradedResult {
  question: DabuTieQuestion;
  userAnswer: string;
  isCorrect: boolean;
}

const SECTION_FILTERS: { id: SectionFilter; label: string }[] = [
  { id: 'all', label: '全部' },
  { id: 'character_phonetic', label: '國字注音' },
  { id: 'definition', label: '注釋' },
];

const matchesSectionFilter = (q: DabuTieQuestion, filter: SectionFilter): boolean => {
  if (filter === 'all') return true;
  if (filter === 'definition') return q.type === 'definition';
  return q.type !== 'definition';
};

const DabuTiePage: React.FC = () => {
  const [mode, setMode] = useState<Mode>('select');
  const [source, setSource] = useState<Source>('all');
  const [sectionFilter, setSectionFilter] = useState<SectionFilter>('all');
  const [scopeId, setScopeId] = useState<string>(DABU_TIE_SCOPES[0]?.id ?? '');
  const [practiceQuestions, setPracticeQuestions] = useState<DabuTieQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [results, setResults] = useState<GradedResult[]>([]);
  const [wrongSummary, setWrongSummary] = useState<DabuTieWrongSummary[]>([]);

  const scope: DabuTieScope | undefined = useMemo(
    () => getScopeById(scopeId),
    [scopeId],
  );

  // 進入頁面或切換範圍時，重新載入錯題摘要
  useEffect(() => {
    if (scope) {
      setWrongSummary(getWrongSummary(scope.id));
    }
  }, [scope, mode]);

  const startPractice = (src: Source) => {
    if (!scope) return;
    let questions: DabuTieQuestion[];
    if (src === 'wrong') {
      const summaries = getWrongSummary(scope.id);
      questions = summaries
        .map((s) => getQuestionById(scope.id, s.questionId))
        .filter((q): q is DabuTieQuestion => !!q)
        .filter((q) => matchesSectionFilter(q, sectionFilter));
      if (questions.length === 0) {
        alert('目前沒有符合條件的錯題，請先進行一次完整練習。');
        return;
      }
    } else {
      questions = scope.questions.filter((q) => matchesSectionFilter(q, sectionFilter));
      if (questions.length === 0) {
        alert('此題型尚無題目。');
        return;
      }
    }
    setSource(src);
    setPracticeQuestions(questions);
    setAnswers({});
    setResults([]);
    setMode('practice');
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  };

  const filteredWrongSummary = useMemo(
    () =>
      wrongSummary.filter((w) => {
        if (!scope) return false;
        const q = getQuestionById(scope.id, w.questionId);
        return q ? matchesSectionFilter(q, sectionFilter) : false;
      }),
    [wrongSummary, scope, sectionFilter],
  );

  const handleAnswerChange = (questionId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleSubmit = () => {
    if (!scope) return;
    const blanks = practiceQuestions.filter(
      (q) => !(answers[q.id] ?? '').trim(),
    );
    if (blanks.length > 0) {
      const ok = window.confirm(
        `還有 ${blanks.length} 題未作答，未作答將視為答錯。確定要送出批改嗎？`,
      );
      if (!ok) return;
    }
    const now = Date.now();
    const graded: GradedResult[] = practiceQuestions.map((q) => {
      const userAnswer = (answers[q.id] ?? '').trim();
      const correct = userAnswer.length > 0 && isAnswerCorrect(userAnswer, q.answer);
      return { question: q, userAnswer, isCorrect: correct };
    });
    const attempts: DabuTieAttempt[] = graded.map((g) => ({
      scopeId: scope.id,
      questionId: g.question.id,
      userAnswer: g.userAnswer,
      correctAnswer: g.question.answer,
      isCorrect: g.isCorrect,
      timestamp: now,
    }));
    saveAttempts(attempts);
    // 「只練錯題」模式答對後，把對應的舊錯題紀錄清掉，避免一直累積
    if (source === 'wrong') {
      graded.forEach((g) => {
        if (g.isCorrect) clearWrongForQuestion(scope.id, g.question.id);
      });
    }
    setResults(graded);
    setMode('result');
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  };

  const backToSelect = () => {
    setMode('select');
    setResults([]);
    setAnswers({});
    setPracticeQuestions([]);
  };

  // ───────────────────── 選擇範圍 ─────────────────────
  if (mode === 'select') {
    return (
      <div className="max-w-3xl mx-auto py-8 space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-extrabold text-slate-900">國文大補帖測驗</h2>
          <p className="text-slate-600">選擇範圍開始練習，作答後立即批改，錯題會記錄供反覆練習。</p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              選擇範圍
            </label>
            <select
              value={scopeId}
              onChange={(e) => setScopeId(e.target.value)}
              className="w-full rounded-lg border-slate-300 focus:ring-blue-500 focus:border-blue-500 text-base p-2.5"
            >
              {DABU_TIE_SCOPES.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                  {s.description ? `（${s.description}）` : ''}
                </option>
              ))}
            </select>
            {scope && (
              <p className="text-xs text-slate-500 mt-2">
                共 {scope.questions.length} 題（
                {scope.questions.filter((q) => q.type !== 'definition').length} 國字注音 +{' '}
                {scope.questions.filter((q) => q.type === 'definition').length} 注釋）
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              題型
            </label>
            <div className="grid grid-cols-3 gap-2">
              {SECTION_FILTERS.map((f) => {
                const count = scope
                  ? scope.questions.filter((q) => matchesSectionFilter(q, f.id)).length
                  : 0;
                const active = sectionFilter === f.id;
                return (
                  <button
                    key={f.id}
                    onClick={() => setSectionFilter(f.id)}
                    className={`px-3 py-2.5 rounded-lg text-sm font-medium border transition-colors ${
                      active
                        ? 'bg-blue-50 border-blue-500 text-blue-700'
                        : 'border-slate-300 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {f.label}
                    <span className={`ml-1 text-xs ${active ? 'text-blue-500' : 'text-slate-400'}`}>
                      ({count})
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Button
              variant="primary"
              size="lg"
              onClick={() => startPractice('all')}
              className="w-full"
            >
              開始練習
            </Button>
            <Button
              variant="secondary"
              size="lg"
              onClick={() => startPractice('wrong')}
              className="w-full"
              disabled={filteredWrongSummary.length === 0}
            >
              {filteredWrongSummary.length > 0
                ? `只練錯題 (${filteredWrongSummary.length})`
                : '尚無錯題'}
            </Button>
          </div>

          {filteredWrongSummary.length > 0 && scope && (
            <div className="pt-4 border-t border-slate-100">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-slate-700">
                  錯題紀錄（{sectionFilter === 'all' ? '全部' : SECTION_FILTERS.find(f => f.id === sectionFilter)?.label}，共 {filteredWrongSummary.length} 題）
                </h3>
                <button
                  onClick={() => {
                    if (window.confirm('確定要清空此範圍所有錯題紀錄嗎？（會清掉所有題型的錯題）')) {
                      clearAllWrong(scope.id);
                      setWrongSummary([]);
                    }
                  }}
                  className="text-xs text-red-600 hover:text-red-700"
                >
                  清空紀錄
                </button>
              </div>
              <div className="max-h-64 overflow-y-auto border border-slate-200 rounded-lg divide-y divide-slate-100">
                {filteredWrongSummary.map((w) => {
                  const q = getQuestionById(scope.id, w.questionId);
                  if (!q) return null;
                  return (
                    <div key={w.questionId} className="px-3 py-2 text-sm flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <span className="text-slate-500 mr-2">
                          {q.section}#{q.number}
                        </span>
                        <span className="text-slate-800">{q.prompt}</span>
                      </div>
                      <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700">
                        錯 {w.wrongCount} 次
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ───────────────────── 答題 ─────────────────────
  if (mode === 'practice' && scope) {
    // 依 section 分組顯示
    const grouped = practiceQuestions.reduce<Record<string, DabuTieQuestion[]>>(
      (acc, q) => {
        (acc[q.section] ||= []).push(q);
        return acc;
      },
      {},
    );

    return (
      <div className="max-w-5xl mx-auto py-4 space-y-6">
        <div className="flex items-center justify-between sticky top-16 bg-slate-50 py-3 z-[5] border-b border-slate-200">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              {scope.name}{source === 'wrong' ? '（只練錯題）' : ''}
            </h2>
            <p className="text-xs text-slate-500">
              共 {practiceQuestions.length} 題
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={backToSelect}>
              放棄
            </Button>
            <Button variant="primary" size="sm" onClick={handleSubmit}>
              送出批改
            </Button>
          </div>
        </div>

        {Object.entries(grouped).map(([section, qs]) => {
          const isDefinition = qs[0]?.type === 'definition';
          const gridClass = isDefinition
            ? 'grid grid-cols-1 gap-y-4 p-5'
            : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-3 p-4';
          return (
            <div key={section} className="bg-white rounded-2xl shadow-sm border border-slate-200">
              <h3 className="px-6 py-3 border-b border-slate-100 text-base font-bold text-slate-800">
                {section}
              </h3>
              <div className={gridClass}>
                {qs.map((q) => (
                  <div key={q.id} className="flex items-start gap-3">
                    <span
                      className={`shrink-0 inline-flex items-center justify-center rounded-md bg-slate-100 text-slate-600 font-semibold ${
                        isDefinition ? 'w-9 h-9 text-base' : 'w-7 h-7 text-xs'
                      }`}
                    >
                      {q.number}
                    </span>
                    <div className="flex-1 min-w-0 space-y-2">
                      <div
                        className={`text-slate-800 break-words leading-snug ${
                          isDefinition ? 'text-xl font-medium' : 'text-sm'
                        }`}
                      >
                        {q.prompt}
                      </div>
                      <input
                        type="text"
                        value={answers[q.id] ?? ''}
                        onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                        placeholder={
                          q.type === 'character'
                            ? '請輸入國字'
                            : q.type === 'phonetic'
                              ? '請輸入注音'
                              : '請輸入釋義'
                        }
                        className={`w-full rounded border-slate-300 focus:ring-blue-500 focus:border-blue-500 ${
                          isDefinition ? 'text-lg p-2.5' : 'text-sm p-1.5'
                        }`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        <div className="flex justify-end gap-2 pb-8">
          <Button variant="outline" onClick={backToSelect}>放棄</Button>
          <Button variant="primary" onClick={handleSubmit}>送出批改</Button>
        </div>
      </div>
    );
  }

  // ───────────────────── 結果 ─────────────────────
  if (mode === 'result' && scope) {
    const total = results.length;
    const correctCount = results.filter((r) => r.isCorrect).length;
    const wrongResults = results.filter((r) => !r.isCorrect);
    const score = total > 0 ? Math.round((correctCount / total) * 100) : 0;
    const grouped = results.reduce<Record<string, GradedResult[]>>((acc, r) => {
      (acc[r.question.section] ||= []).push(r);
      return acc;
    }, {});

    return (
      <div className="max-w-5xl mx-auto py-6 space-y-6">
        {/* 成績卡 */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center space-y-3">
          <div className="text-sm text-slate-500">{scope.name} 測驗結果</div>
          <div className="text-6xl font-extrabold text-slate-900">{score}<span className="text-2xl text-slate-500"> 分</span></div>
          <div className="text-slate-600">
            答對 <span className="font-bold text-emerald-600">{correctCount}</span> 題 / 共 {total} 題
            （錯 <span className="font-bold text-red-600">{wrongResults.length}</span> 題）
          </div>
          <div className="flex justify-center gap-3 pt-3">
            {wrongResults.length > 0 && (
              <Button
                variant="secondary"
                onClick={() => {
                  setPracticeQuestions(wrongResults.map((r) => r.question));
                  setSource('wrong');
                  setAnswers({});
                  setResults([]);
                  setMode('practice');
                  window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
                }}
              >
                重做這次的錯題
              </Button>
            )}
            <Button variant="outline" onClick={backToSelect}>
              回到範圍選擇
            </Button>
          </div>
        </div>

        {/* 詳細答題狀況 */}
        {Object.entries(grouped).map(([section, items]) => {
          const isDefinition = items[0]?.question.type === 'definition';
          return (
            <div key={section} className="bg-white rounded-2xl shadow-sm border border-slate-200">
              <h3 className="px-6 py-3 border-b border-slate-100 text-base font-bold text-slate-800">
                {section}
              </h3>
              <div className="divide-y divide-slate-100">
                {items.map((r) =>
                  isDefinition ? (
                    <div
                      key={r.question.id}
                      className={`px-6 py-4 ${r.isCorrect ? '' : 'bg-red-50/50'}`}
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <span className="inline-flex items-center justify-center w-9 h-9 rounded-md bg-slate-100 text-slate-700 text-base font-semibold shrink-0">
                          {r.question.number}
                        </span>
                        <span className="text-xl font-medium text-slate-800 break-words flex-1">
                          {r.question.prompt}
                        </span>
                        {r.isCorrect ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-700 shrink-0">
                            ✓ 正確
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700 shrink-0">
                            ✗ 錯誤
                          </span>
                        )}
                      </div>
                      <div className="space-y-1.5 pl-12 text-base">
                        <div>
                          <span className="text-slate-500 mr-2">你的答案：</span>
                          <span
                            className={
                              r.isCorrect
                                ? 'text-emerald-700 font-medium'
                                : 'text-red-700 font-medium line-through'
                            }
                          >
                            {r.userAnswer || '（未作答）'}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500 mr-2">正確答案：</span>
                          <span className="text-slate-900 font-semibold">{r.question.answer}</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div
                      key={r.question.id}
                      className={`px-6 py-3 flex flex-col sm:flex-row sm:items-center sm:gap-4 ${
                        r.isCorrect ? '' : 'bg-red-50/50'
                      }`}
                    >
                      <div className="flex items-center gap-2 sm:w-44 shrink-0">
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-md bg-slate-100 text-slate-600 text-xs font-semibold">
                          {r.question.number}
                        </span>
                        <span className="text-sm text-slate-800 truncate">{r.question.prompt}</span>
                      </div>
                      <div className="flex-1 mt-1 sm:mt-0 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-slate-500 mr-2">你的答案：</span>
                          <span
                            className={
                              r.isCorrect
                                ? 'text-emerald-700 font-medium'
                                : 'text-red-700 font-medium line-through'
                            }
                          >
                            {r.userAnswer || '（未作答）'}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500 mr-2">正確答案：</span>
                          <span className="text-slate-900 font-semibold">{r.question.answer}</span>
                        </div>
                      </div>
                      <div className="shrink-0 mt-1 sm:mt-0">
                        {r.isCorrect ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-700">
                            ✓ 正確
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700">
                            ✗ 錯誤
                          </span>
                        )}
                      </div>
                    </div>
                  ),
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return null;
};

export default DabuTiePage;
