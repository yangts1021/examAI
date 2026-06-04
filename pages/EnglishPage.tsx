import React, { useState } from 'react';
import Button from '../components/Button';
import { ENGLISH_LESSONS, EnglishLesson, Article, QuizSentence } from '../data/englishL5';

const speak = (text: string, rate = 1) => {
  if (!('speechSynthesis' in window)) return;
  const msg = new SpeechSynthesisUtterance(text);
  msg.lang = 'en-US';
  msg.rate = rate;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(msg);
};

// ───────── LCS word-diff (用於測驗批改) ─────────
type DiffOp = 'match' | 'add' | 'remove';
interface DiffPart {
  text: string;
  type: DiffOp;
}

const normWord = (w: string) => w.toLowerCase().replace(/[.,!?;:'"`’]/g, '');

const diffWords = (
  user: string[],
  correct: string[],
): { userParts: DiffPart[]; correctParts: DiffPart[] } => {
  const m = user.length;
  const n = correct.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] =
        normWord(user[i - 1]) === normWord(correct[j - 1])
          ? dp[i - 1][j - 1] + 1
          : Math.max(dp[i - 1][j], dp[i][j - 1]);
    }
  }
  const userOut: DiffPart[] = [];
  const correctOut: DiffPart[] = [];
  let i = m;
  let j = n;
  while (i > 0 && j > 0) {
    if (normWord(user[i - 1]) === normWord(correct[j - 1])) {
      userOut.unshift({ text: user[i - 1], type: 'match' });
      correctOut.unshift({ text: correct[j - 1], type: 'match' });
      i--;
      j--;
    } else if (dp[i - 1][j] >= dp[i][j - 1]) {
      userOut.unshift({ text: user[i - 1], type: 'remove' });
      i--;
    } else {
      correctOut.unshift({ text: correct[j - 1], type: 'add' });
      j--;
    }
  }
  while (i > 0) userOut.unshift({ text: user[--i], type: 'remove' });
  while (j > 0) correctOut.unshift({ text: correct[--j], type: 'add' });
  return { userParts: userOut, correctParts: correctOut };
};

// ───────── 教學：單字與文章點讀 + 語速調整 ─────────

// 去除單字前後標點，用於發音（保留大小寫）
const cleanForSpeak = (w: string) => w.replace(/^[^A-Za-z']+|[^A-Za-z']+$/g, '');

// 將句子切成可點讀的 token（保留空白與標點），每個含字母的詞可點擊發音
const ClickableSentence: React.FC<{ text: string; rate: number }> = ({ text, rate }) => {
  const tokens = text.split(/(\s+)/);
  return (
    <span>
      {tokens.map((tok, i) => {
        if (/^\s+$/.test(tok) || tok === '') return <span key={i}>{tok}</span>;
        const speakable = cleanForSpeak(tok);
        if (!speakable) return <span key={i}>{tok}</span>;
        return (
          <span
            key={i}
            role="button"
            tabIndex={0}
            onClick={() => speak(speakable, rate)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                speak(speakable, rate);
              }
            }}
            className="cursor-pointer rounded px-0.5 hover:bg-sky-100 dark:hover:bg-sky-800/60 hover:text-sky-700 dark:hover:text-sky-200 transition-colors"
          >
            {tok}
          </span>
        );
      })}
    </span>
  );
};

// 單字卡：點擊發音
const VocabChip: React.FC<{ word: string; pos?: string; meaning: string; rate: number }> = ({
  word,
  pos,
  meaning,
  rate,
}) => (
  <button
    type="button"
    onClick={() => speak(word, rate)}
    className="text-left bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 hover:border-sky-400 dark:hover:border-sky-500 hover:shadow-sm transition-all"
  >
    <div className="flex items-center gap-1.5">
      <span className="text-sky-600 dark:text-sky-300 text-sm">🔊</span>
      <span className="font-semibold text-slate-800 dark:text-slate-100">{word}</span>
      {pos && <span className="text-xs text-slate-400 dark:text-slate-500">{pos}</span>}
    </div>
    <div className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{meaning}</div>
  </button>
);

// 文章點讀：逐句可點讀，並可切換中文翻譯
const ArticleView: React.FC<{ article: Article; rate: number }> = ({ article, rate }) => {
  const [showZh, setShowZh] = useState(true);
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">{article.title}</h3>
        <button
          type="button"
          onClick={() => setShowZh((v) => !v)}
          className="text-xs px-3 py-1 rounded-full border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
        >
          {showZh ? '隱藏中文' : '顯示中文'}
        </button>
      </div>

      <div className="space-y-3">
        {article.lines.map((line, idx) => (
          <div
            key={idx}
            className="border border-slate-200 dark:border-slate-700 rounded-lg p-3 bg-white dark:bg-slate-800"
          >
            <div className="flex items-start gap-2">
              <button
                type="button"
                onClick={() => speak(line.en, rate)}
                title="朗讀整句"
                className="shrink-0 mt-0.5 w-8 h-8 flex items-center justify-center rounded-md bg-indigo-50 hover:bg-indigo-600 hover:text-white dark:bg-indigo-900/40 dark:text-indigo-200 dark:hover:bg-indigo-600 dark:hover:text-white border border-indigo-200 dark:border-indigo-700 transition-colors"
              >
                🔊
              </button>
              <div className="flex-1 leading-relaxed">
                {line.speaker && (
                  <span className="font-bold text-indigo-600 dark:text-indigo-300 mr-1">
                    {line.speaker}:
                  </span>
                )}
                <span
                  className={
                    line.stage
                      ? 'italic text-slate-500 dark:text-slate-400'
                      : 'text-slate-800 dark:text-slate-100'
                  }
                >
                  <ClickableSentence text={line.en} rate={rate} />
                </span>
                {showZh && (
                  <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">{line.zh}</div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

type TeachSection = 'vocab' | number; // number = articles 的索引

const TeachView: React.FC<{ onBack: () => void; lesson: EnglishLesson }> = ({ onBack, lesson }) => {
  const [rate, setRate] = useState(1);
  const [section, setSection] = useState<TeachSection>('vocab');

  const tabs: { key: TeachSection; label: string }[] = [
    { key: 'vocab', label: '單字' },
    ...lesson.articles.map((a, i) => ({
      key: i as TeachSection,
      label: a.type === 'dialogue' ? '對話' : '閱讀',
    })),
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            英文 · 教學 · {lesson.title}
          </h2>
          {lesson.subtitle && (
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{lesson.subtitle}</p>
          )}
        </div>
        <Button variant="outline" size="sm" onClick={onBack}>
          返回
        </Button>
      </div>

      <div className="sticky top-16 z-[5] bg-slate-50/95 dark:bg-slate-900/95 backdrop-blur border border-slate-200 dark:border-slate-700 rounded-xl p-4 space-y-3">
        <div className="flex items-center gap-3">
          <label htmlFor="rate" className="text-sm font-medium text-slate-700 dark:text-slate-200 shrink-0">
            語速
          </label>
          <input
            id="rate"
            type="range"
            min={0.5}
            max={1.5}
            step={0.05}
            value={rate}
            onChange={(e) => setRate(parseFloat(e.target.value))}
            className="flex-1 accent-blue-600"
          />
          <span className="text-sm tabular-nums w-12 text-right text-slate-700 dark:text-slate-200">
            {rate.toFixed(2)}x
          </span>
          <button
            type="button"
            onClick={() => setRate(1)}
            className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 underline"
          >
            重設
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          {tabs.map((t) => (
            <button
              key={String(t.key)}
              type="button"
              onClick={() => setSection(t.key)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                section === t.key
                  ? 'bg-blue-600 text-white'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400">
          💡 點擊單字或文章中的任一個字可單獨發音,點擊句首的 🔊 可朗讀整句,皆依目前語速播放。
        </p>
      </div>

      {section === 'vocab' ? (
        <div className="space-y-6">
          {lesson.vocabGroups.map((group, gi) => (
            <div key={gi}>
              <h3 className="text-base font-bold text-slate-700 dark:text-slate-200 mb-2">
                {group.title}
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {group.words.map((w, wi) => (
                  <VocabChip key={wi} word={w.word} pos={w.pos} meaning={w.meaning} rate={rate} />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <ArticleView article={lesson.articles[section]} rate={rate} />
      )}
    </div>
  );
};

// ───────── 測驗:中翻英 + 字詞 diff ─────────
const QuizItemRow: React.FC<{ item: QuizSentence; index: number }> = ({ item, index }) => {
  const [input, setInput] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const userWords = input.trim().split(/\s+/).filter(Boolean);
  const correctWords = item.en.trim().split(/\s+/);
  const { userParts, correctParts } = diffWords(userWords, correctWords);
  const isCorrect =
    submitted &&
    userParts.length > 0 &&
    userParts.every((p) => p.type === 'match') &&
    correctParts.every((p) => p.type === 'match');

  return (
    <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 bg-white dark:bg-slate-800">
      <div className="text-base sm:text-lg font-semibold text-slate-800 dark:text-slate-100 mb-3">
        {index + 1}. {item.zh}
      </div>
      <textarea
        value={input}
        onChange={(e) => {
          setInput(e.target.value);
          if (submitted) setSubmitted(false);
        }}
        placeholder="請在此輸入英文翻譯..."
        className="w-full h-16 p-2.5 border-2 border-slate-200 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:placeholder-slate-500 rounded-md text-base resize-none focus:border-blue-500 focus:outline-none"
      />
      <div className="mt-2 flex gap-2">
        <button
          type="button"
          onClick={() => setSubmitted(true)}
          className="bg-slate-700 hover:bg-slate-800 dark:bg-slate-600 dark:hover:bg-slate-500 text-white px-5 py-2 rounded-md text-sm font-medium"
        >
          檢查答案
        </button>
        {submitted && (
          <button
            type="button"
            onClick={() => {
              setInput('');
              setSubmitted(false);
            }}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-slate-200 px-4 py-2 rounded-md text-sm"
          >
            重做
          </button>
        )}
      </div>

      {submitted && (
        <div
          className={`mt-3 p-3 rounded-md text-sm sm:text-base ${
            isCorrect
              ? 'bg-emerald-50 border border-emerald-200 dark:bg-emerald-900/30 dark:border-emerald-700'
              : 'bg-amber-50 border border-amber-200 dark:bg-amber-900/20 dark:border-amber-700'
          }`}
        >
          {isCorrect ? (
            <div className="text-emerald-700 dark:text-emerald-300 font-semibold">✓ 完全正確!</div>
          ) : (
            <>
              <div className="mb-1.5">
                <span className="text-xs text-slate-500 dark:text-slate-400 mr-2">你的答案:</span>
                {userParts.length === 0 ? (
                  <span className="text-slate-400 dark:text-slate-500">(未作答)</span>
                ) : (
                  userParts.map((p, i) =>
                    p.type === 'match' ? (
                      <span key={i} className="text-slate-700 dark:text-slate-200">
                        {p.text}{' '}
                      </span>
                    ) : (
                      <span
                        key={i}
                        className="text-red-700 bg-red-100 dark:text-red-200 dark:bg-red-900/50 line-through rounded px-1 mr-1"
                      >
                        {p.text}
                      </span>
                    ),
                  )
                )}
              </div>
              <div>
                <span className="text-xs text-slate-500 dark:text-slate-400 mr-2">正確答案:</span>
                {correctParts.map((p, i) =>
                  p.type === 'match' ? (
                    <span key={i} className="text-slate-700 dark:text-slate-200">
                      {p.text}{' '}
                    </span>
                  ) : (
                    <span
                      key={i}
                      className="text-emerald-800 bg-emerald-100 dark:text-emerald-200 dark:bg-emerald-900/50 underline decoration-2 underline-offset-2 font-semibold rounded px-1 mr-1"
                    >
                      {p.text}
                    </span>
                  ),
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

const QuizView: React.FC<{ onBack: () => void; lesson: EnglishLesson }> = ({ onBack, lesson }) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            英文 · 中翻英測驗 · {lesson.title}
          </h2>
          {lesson.subtitle && (
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{lesson.subtitle}</p>
          )}
        </div>
        <Button variant="outline" size="sm" onClick={onBack}>
          返回
        </Button>
      </div>
      <p className="text-sm text-slate-500 dark:text-slate-400">輸入英文翻譯後,點擊「檢查答案」即可批改。</p>
      <div className="space-y-3">
        {lesson.quizSentences.map((item, idx) => (
          <QuizItemRow key={idx} item={item} index={idx} />
        ))}
      </div>
    </div>
  );
};

// ───────── 主頁:卡片選擇 ─────────
type Mode = 'select' | 'teach' | 'quiz';

// ───────── 課程選單（教學 / 測驗共用）─────────
const LessonMenu: React.FC<{
  title: string;
  hint: string;
  onBack: () => void;
  onSelect: (lessonId: string) => void;
}> = ({ title, hint, onBack, onSelect }) => (
  <div className="space-y-4">
    <div className="flex items-center justify-between">
      <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{title}</h2>
      <Button variant="outline" size="sm" onClick={onBack}>
        返回
      </Button>
    </div>
    <p className="text-sm text-slate-500 dark:text-slate-400">{hint}</p>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {ENGLISH_LESSONS.map((lesson) => (
        <button
          key={lesson.id}
          type="button"
          onClick={() => onSelect(lesson.id)}
          className="text-left bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-lg hover:border-sky-300 dark:hover:border-sky-500 transition-all p-6"
        >
          <div className="w-12 h-12 rounded-xl bg-sky-100 dark:bg-sky-900/40 text-sky-600 dark:text-sky-300 flex items-center justify-center mb-4 text-2xl">
            📖
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-1">{lesson.title}</h3>
          {lesson.subtitle && (
            <p className="text-slate-500 dark:text-slate-400 text-sm">{lesson.subtitle}</p>
          )}
        </button>
      ))}
    </div>
  </div>
);

const EnglishPage: React.FC = () => {
  const [mode, setMode] = useState<Mode>('select');
  const [lessonId, setLessonId] = useState<string | null>(null);

  const goMode = (m: Mode) => {
    setLessonId(null);
    setMode(m);
  };

  const lesson = lessonId ? ENGLISH_LESSONS.find((l) => l.id === lessonId) : undefined;

  if (mode === 'teach') {
    if (lesson) {
      return (
        <div className="max-w-4xl mx-auto py-4">
          <TeachView onBack={() => setLessonId(null)} lesson={lesson} />
        </div>
      );
    }
    return (
      <div className="max-w-4xl mx-auto py-4">
        <LessonMenu
          title="英文 · 教學"
          hint="選擇課程開始點讀練習。"
          onBack={() => setMode('select')}
          onSelect={setLessonId}
        />
      </div>
    );
  }
  if (mode === 'quiz') {
    if (lesson) {
      return (
        <div className="max-w-4xl mx-auto py-4">
          <QuizView onBack={() => setLessonId(null)} lesson={lesson} />
        </div>
      );
    }
    return (
      <div className="max-w-4xl mx-auto py-4">
        <LessonMenu
          title="英文 · 中翻英測驗"
          hint="選擇課程開始中翻英測驗。"
          onBack={() => setMode('select')}
          onSelect={setLessonId}
        />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-extrabold text-slate-900 dark:text-slate-100">英文</h2>
        <p className="text-slate-600 dark:text-slate-300">選擇模式開始練習</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <button
          type="button"
          onClick={() => goMode('teach')}
          className="text-left bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-lg hover:border-blue-300 dark:hover:border-blue-500 transition-all p-6"
        >
          <div className="w-12 h-12 rounded-xl bg-sky-100 dark:bg-sky-900/40 text-sky-600 dark:text-sky-300 flex items-center justify-center mb-4 text-2xl">
            🔊
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">教學</h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            點擊單字或整句聽發音,可調整語速反覆聆聽,熟悉句子節奏與字彙發音。
          </p>
        </button>

        <button
          type="button"
          onClick={() => goMode('quiz')}
          className="text-left bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-lg hover:border-emerald-300 dark:hover:border-emerald-500 transition-all p-6"
        >
          <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-300 flex items-center justify-center mb-4 text-2xl">
            ✏️
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">中翻英測驗</h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            輸入英文翻譯,即時批改並顯示與正確答案的字詞差異,協助找出錯字與遺漏。
          </p>
        </button>
      </div>
    </div>
  );
};

export default EnglishPage;
