import React, { useState } from 'react';

interface QuizItem {
  ch: string;
  en: string;
}

const QUIZ_DATA: QuizItem[] = [
  { ch: '1. 海水每天都變得更髒更暖。', en: 'The water gets dirtier and warmer every day.' },
  { ch: '2. 他們甚至沒有機會長大。', en: "They won't even have a chance to grow up." },
  { ch: '3. 請留給我們乾淨的住所，並停止殺害我們。', en: 'Please leave some clean places for us and stop killing us.' },
  { ch: '4. 我們再也等不了了。', en: 'We cannot wait any longer.' },
  { ch: '5. 由於他辛勤的努力，世界上有許多的西瓜種子都來自於他的公司。', en: 'Thanks to his hard work, lots of watermelon seeds in the world came from his company.' },
  { ch: '6. 他們的努力幫助這座島嶼成為水果天堂。', en: 'Their efforts help make the island a fruit paradise.' },
  { ch: '7. 現在有甚麼是當季的水果呢？', en: 'What is in season now?' },
  { ch: '8. 他們在臺南的一個傳統市場。', en: 'They are at a traditional market in Tainan.' },
];

const speak = (text: string) => {
  if (!('speechSynthesis' in window)) return;
  const msg = new SpeechSynthesisUtterance(text);
  msg.lang = 'en-US';
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(msg);
};

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

const QuizItemRow: React.FC<{ item: QuizItem }> = ({ item }) => {
  const [input, setInput] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const shelfWords = item.en.replace(/[.,!?;:]/g, '').split(/\s+/).filter(Boolean);
  const userWords = input.trim().split(/\s+/).filter(Boolean);
  const correctWords = item.en.trim().split(/\s+/);
  const { userParts, correctParts } = diffWords(userWords, correctWords);
  const isCorrect =
    submitted &&
    userParts.length > 0 &&
    userParts.every((p) => p.type === 'match') &&
    correctParts.every((p) => p.type === 'match');

  return (
    <div className="border border-slate-200 rounded-lg p-4 bg-white">
      <div className="text-base sm:text-lg font-semibold text-slate-800 mb-3">{item.ch}</div>
      <div className="flex flex-wrap gap-2 mb-3">
        {shelfWords.map((w, i) => (
          <button
            key={i}
            type="button"
            onClick={() => speak(w)}
            className="bg-sky-50 hover:bg-sky-600 hover:text-white px-3 py-1 rounded-full border border-sky-200 text-sm transition-colors"
          >
            {w}
          </button>
        ))}
        <button
          type="button"
          onClick={() => speak(item.en)}
          className="bg-indigo-50 hover:bg-indigo-600 hover:text-white px-3 py-1 rounded-full border border-indigo-200 text-sm transition-colors"
          title="朗讀整句"
        >
          🔊 整句
        </button>
      </div>
      <textarea
        value={input}
        onChange={(e) => {
          setInput(e.target.value);
          if (submitted) setSubmitted(false);
        }}
        placeholder="請在此輸入英文翻譯..."
        className="w-full h-16 p-2.5 border-2 border-slate-200 rounded-md text-base resize-none focus:border-blue-500 focus:outline-none"
      />
      <div className="mt-2 flex gap-2">
        <button
          type="button"
          onClick={() => setSubmitted(true)}
          className="bg-slate-700 hover:bg-slate-800 text-white px-5 py-2 rounded-md text-sm font-medium"
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
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-md text-sm"
          >
            重做
          </button>
        )}
      </div>

      {submitted && (
        <div
          className={`mt-3 p-3 rounded-md text-sm sm:text-base ${
            isCorrect
              ? 'bg-emerald-50 border border-emerald-200'
              : 'bg-amber-50 border border-amber-200'
          }`}
        >
          {isCorrect ? (
            <div className="text-emerald-700 font-semibold">✓ 完全正確！</div>
          ) : (
            <>
              <div className="mb-1.5">
                <span className="text-xs text-slate-500 mr-2">你的答案：</span>
                {userParts.length === 0 ? (
                  <span className="text-slate-400">（未作答）</span>
                ) : (
                  userParts.map((p, i) =>
                    p.type === 'match' ? (
                      <span key={i} className="text-slate-700">
                        {p.text}{' '}
                      </span>
                    ) : (
                      <span
                        key={i}
                        className="text-red-700 bg-red-100 line-through rounded px-1 mr-1"
                      >
                        {p.text}
                      </span>
                    ),
                  )
                )}
              </div>
              <div>
                <span className="text-xs text-slate-500 mr-2">正確答案：</span>
                {correctParts.map((p, i) =>
                  p.type === 'match' ? (
                    <span key={i} className="text-slate-700">
                      {p.text}{' '}
                    </span>
                  ) : (
                    <span
                      key={i}
                      className="text-emerald-800 bg-emerald-100 underline decoration-2 underline-offset-2 font-semibold rounded px-1 mr-1"
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

const EnglishQuizSection: React.FC = () => {
  return (
    <section className="w-full max-w-4xl mx-auto bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-slate-900">英文</h2>
        <p className="text-sm text-slate-500 mt-1">
          💡 點擊下方單字可聽發音 | 輸入完成後點擊「檢查答案」
        </p>
      </div>
      <div className="space-y-4">
        {QUIZ_DATA.map((item, idx) => (
          <QuizItemRow key={idx} item={item} />
        ))}
      </div>
    </section>
  );
};

export default EnglishQuizSection;
