// 國文大補帖題目資料
// 題目來源：實體大補帖學習單，由人工輸入。
// 若需新增其他範圍，請依照 DabuTieScope 結構在 DABU_TIE_SCOPES 陣列追加。

export type DabuTieQuestionType =
  | 'character'   // 給注音 → 寫國字
  | 'phonetic'    // 給國字 → 寫注音
  | 'definition'; // 給詞語 → 寫釋義

export interface DabuTieQuestion {
  id: string;          // 範圍內唯一 (例如 "k1-1"、"k2-3")
  number: number;      // 顯示題號
  section: string;     // 大題名稱 (例如「一、國字、注音」)
  type: DabuTieQuestionType;
  prompt: string;      // 題目顯示文字
  answer: string;      // 標準答案 (用於嚴格字串比對)
  hint?: string;       // 可選的補充說明
}

export interface DabuTieScope {
  id: string;
  name: string;
  description?: string;
  questions: DabuTieQuestion[];
}

// ─────────────────────────────────────────────────
// 八下二 (L4、L5、語一)
// ─────────────────────────────────────────────────
const SCOPE_8B2: DabuTieScope = {
  id: '8b2',
  name: '八下二',
  description: '範圍：L4、L5、語一',
  questions: [
    // ── 一、國字、注音 ──
    { id: '8b2-k1', number: 1, section: '一、國字、注音', type: 'phonetic', prompt: '「嫵」媚動人', answer: 'ㄨˇ' },
    { id: '8b2-k2', number: 2, section: '一、國字、注音', type: 'character', prompt: '萬「ㄓㄢˇ」金燈', answer: '盞' },
    { id: '8b2-k3', number: 3, section: '一、國字、注音', type: 'phonetic', prompt: '「栩」栩如生', answer: 'ㄒㄩˇ' },
    { id: '8b2-k4', number: 4, section: '一、國字、注音', type: 'character', prompt: '「ㄕㄨㄣˋ」息萬變', answer: '瞬' },
    { id: '8b2-k5', number: 5, section: '一、國字、注音', type: 'phonetic', prompt: '「酪」漿', answer: 'ㄌㄠˋ' },
    { id: '8b2-k6', number: 6, section: '一、國字、注音', type: 'character', prompt: '春意「ㄤˋ」然', answer: '盎' },
    { id: '8b2-k7', number: 7, section: '一、國字、注音', type: 'character', prompt: '「ㄑㄧㄥˇ」刻間', answer: '頃' },
    { id: '8b2-k8', number: 8, section: '一、國字、注音', type: 'phonetic', prompt: '目「眩」神迷', answer: 'ㄒㄩㄢˋ' },
    { id: '8b2-k9', number: 9, section: '一、國字、注音', type: 'character', prompt: '「ㄧㄥ」粟花', answer: '罌' },
    { id: '8b2-k10', number: 10, section: '一、國字、注音', type: 'character', prompt: '「ㄧㄣ」勤問候', answer: '殷' },
    { id: '8b2-k11', number: 11, section: '一、國字、注音', type: 'phonetic', prompt: '「烹」烤', answer: 'ㄆㄥ' },
    { id: '8b2-k12', number: 12, section: '一、國字、注音', type: 'character', prompt: '點「ㄓㄨㄟˋ」', answer: '綴' },
    { id: '8b2-k13', number: 13, section: '一、國字、注音', type: 'phonetic', prompt: '「碩」大', answer: 'ㄕㄨㄛˋ' },
    { id: '8b2-k14', number: 14, section: '一、國字、注音', type: 'phonetic', prompt: '「冉冉」漸隱', answer: 'ㄖㄢˇ' },
    { id: '8b2-k15', number: 15, section: '一、國字、注音', type: 'character', prompt: '「ㄍㄨㄟˋ」拜', answer: '跪' },
    { id: '8b2-k16', number: 16, section: '一、國字、注音', type: 'phonetic', prompt: '諸「葛」亮', answer: 'ㄍㄜˇ' },
    { id: '8b2-k17', number: 17, section: '一、國字、注音', type: 'phonetic', prompt: '「怯」怜怜', answer: 'ㄑㄩㄝˋ' },
    { id: '8b2-k18', number: 18, section: '一、國字、注音', type: 'character', prompt: '鬱「ㄑㄧㄥˋ」', answer: '磬' },
    { id: '8b2-k19', number: 19, section: '一、國字、注音', type: 'phonetic', prompt: '休「憩」', answer: 'ㄑㄧˋ' },
    { id: '8b2-k20', number: 20, section: '一、國字、注音', type: 'character', prompt: '等閒細「ㄋㄧˋ」', answer: '膩' },
    { id: '8b2-k21', number: 21, section: '一、國字、注音', type: 'character', prompt: '「ㄙㄢˇ」上金粉', answer: '糝' },
    { id: '8b2-k22', number: 22, section: '一、國字、注音', type: 'phonetic', prompt: '「恣」意', answer: 'ㄗˋ' },
    { id: '8b2-k23', number: 23, section: '一、國字、注音', type: 'phonetic', prompt: '建「醮」', answer: 'ㄐㄧㄠˋ' },
    { id: '8b2-k24', number: 24, section: '一、國字、注音', type: 'character', prompt: '萬「ㄌㄩˇ」金輝', answer: '縷' },
    { id: '8b2-k25', number: 25, section: '一、國字、注音', type: 'character', prompt: '褻「ㄉㄨˊ」神明', answer: '瀆' },
    { id: '8b2-k26', number: 26, section: '一、國字、注音', type: 'character', prompt: '「ㄔㄨㄟ」煙裊裊', answer: '炊' },
    { id: '8b2-k27', number: 27, section: '一、國字、注音', type: 'phonetic', prompt: '「翳」入天聽', answer: 'ㄧˋ' },
    { id: '8b2-k28', number: 28, section: '一、國字、注音', type: 'character', prompt: '一線「ㄕㄨˋ」光', answer: '曙' },
    { id: '8b2-k29', number: 29, section: '一、國字、注音', type: 'character', prompt: '譏「ㄈㄥˇ」朝政', answer: '諷' },
    { id: '8b2-k30', number: 30, section: '一、國字、注音', type: 'phonetic', prompt: '「伺」機而動', answer: 'ㄙˋ' },
    { id: '8b2-k31', number: 31, section: '一、國字、注音', type: 'character', prompt: '麻「ㄕㄨˇ」', answer: '糬' },
    { id: '8b2-k32', number: 32, section: '一、國字、注音', type: 'character', prompt: '「ㄈㄟˇ」翠', answer: '翡' },
    { id: '8b2-k33', number: 33, section: '一、國字、注音', type: 'character', prompt: '攏「ㄉㄞˋ」', answer: '戴' },
    { id: '8b2-k34', number: 34, section: '一、國字、注音', type: 'phonetic', prompt: '土「阜」', answer: 'ㄈㄨˋ' },
    { id: '8b2-k35', number: 35, section: '一、國字、注音', type: 'character', prompt: '「ㄓㄨˋ」刻', answer: '鑄' },
    { id: '8b2-k36', number: 36, section: '一、國字、注音', type: 'character', prompt: '卻上輕「ㄩˊ」趁曉涼', answer: '輿' },
    { id: '8b2-k37', number: 37, section: '一、國字、注音', type: 'character', prompt: '初生之「ㄉㄨˊ」', answer: '犢' },
    { id: '8b2-k38', number: 38, section: '一、國字、注音', type: 'phonetic', prompt: '溫「馨」感人', answer: 'ㄒㄧㄣ' },
    { id: '8b2-k39', number: 39, section: '一、國字、注音', type: 'character', prompt: '劉「ㄩˇ」錫', answer: '禹' },
    { id: '8b2-k40', number: 40, section: '一、國字、注音', type: 'character', prompt: '學問「ㄩㄢ」博', answer: '淵' },
    { id: '8b2-k41', number: 41, section: '一、國字、注音', type: 'phonetic', prompt: '青「苔」', answer: 'ㄊㄞˊ' },
    { id: '8b2-k42', number: 42, section: '一、國字、注音', type: 'character', prompt: '「ㄊㄠ」光養晦', answer: '韜' },
    { id: '8b2-k43', number: 43, section: '一、國字、注音', type: 'character', prompt: '「ㄏㄨㄥˊ」儒', answer: '鴻' },
    { id: '8b2-k44', number: 44, section: '一、國字、注音', type: 'character', prompt: '身材豐「ㄩˊ」', answer: '腴' },
    { id: '8b2-k45', number: 45, section: '一、國字、注音', type: 'character', prompt: '連篇累「ㄉㄨˊ」', answer: '牘' },
    { id: '8b2-k46', number: 46, section: '一、國字、注音', type: 'phonetic', prompt: '水「溶溶」', answer: 'ㄖㄨㄥˊ' },
    { id: '8b2-k47', number: 47, section: '一、國字、注音', type: 'phonetic', prompt: '「伺」候父母', answer: 'ㄘˋ' },
    { id: '8b2-k48', number: 48, section: '一、國字、注音', type: 'character', prompt: '阿「ㄩˊ」奉承', answer: '諛' },
    { id: '8b2-k49', number: 49, section: '一、國字、注音', type: 'character', prompt: '漠「ㄌㄥˊㄌㄥˊ」', answer: '楞楞' },
    { id: '8b2-k50', number: 50, section: '一、國字、注音', type: 'character', prompt: '煙霧「ㄇㄧˊ」漫', answer: '瀰' },
    { id: '8b2-k51', number: 51, section: '一、國字、注音', type: 'character', prompt: '「ㄆㄨˊ」公英', answer: '蒲' },
    { id: '8b2-k52', number: 52, section: '一、國字、注音', type: 'character', prompt: '土壤肥「ㄨㄛˋ」', answer: '沃' },
    { id: '8b2-k53', number: 53, section: '一、國字、注音', type: 'character', prompt: '「ㄌㄧㄥˊ」機一動', answer: '靈' },
    { id: '8b2-k54', number: 54, section: '一、國字、注音', type: 'character', prompt: '一「ㄙ」不苟', answer: '絲' },
    { id: '8b2-k55', number: 55, section: '一、國字、注音', type: 'character', prompt: '世間「ㄏㄢˇ」見', answer: '罕' },
    { id: '8b2-k56', number: 56, section: '一、國字、注音', type: 'character', prompt: '映入眼「ㄌㄧㄢˊ」', answer: '簾' },
    { id: '8b2-k57', number: 57, section: '一、國字、注音', type: 'character', prompt: '因「ㄌㄡˋ」就簡', answer: '陋' },
    { id: '8b2-k58', number: 58, section: '一、國字、注音', type: 'character', prompt: '石「ㄅㄟ」', answer: '碑' },
    { id: '8b2-k59', number: 59, section: '一、國字、注音', type: 'character', prompt: '刻苦自「ㄌㄧˋ」', answer: '勵' },
    { id: '8b2-k60', number: 60, section: '一、國字、注音', type: 'phonetic', prompt: '連「署」', answer: 'ㄕㄨˇ' },

    // ── 二、注釋 ──
    { id: '8b2-d1', number: 1, section: '二、注釋', type: 'definition', prompt: '荒誕', answer: '荒唐而不合情理。' },
    { id: '8b2-d2', number: 2, section: '二、注釋', type: 'definition', prompt: '溫存', answer: '溫柔。' },
    { id: '8b2-d3', number: 3, section: '二、注釋', type: 'definition', prompt: '「嫵」媚', answer: '嬌美。' },
    { id: '8b2-d4', number: 4, section: '二、注釋', type: 'definition', prompt: '漠楞楞', answer: '模糊不清的樣子。' },
    { id: '8b2-d5', number: 5, section: '二、注釋', type: 'definition', prompt: '「伺候」著河上的風光', answer: '此指探訪等候。' },
    { id: '8b2-d6', number: 6, section: '二、注釋', type: 'definition', prompt: '栩栩', answer: '活生生的樣子。' },
    { id: '8b2-d7', number: 7, section: '二、注釋', type: 'definition', prompt: '怯怜怜', answer: '膽小可憐的樣子。' },
    { id: '8b2-d8', number: 8, section: '二、注釋', type: 'definition', prompt: '冉冉', answer: '緩慢移動的樣子。' },
    { id: '8b2-d9', number: 9, section: '二、注釋', type: 'definition', prompt: '山「巖」', answer: '高峻的山崖。' },
    { id: '8b2-d10', number: 10, section: '二、注釋', type: 'definition', prompt: '剎那', answer: '極短的時間。' },
    { id: '8b2-d11', number: 11, section: '二、注釋', type: 'definition', prompt: '惟吾德「馨」', answer: '使香氣遠播。' },
    { id: '8b2-d12', number: 12, section: '二、注釋', type: 'definition', prompt: '「糝」上金粉', answer: '撒落。' },
    { id: '8b2-d13', number: 13, section: '二、注釋', type: 'definition', prompt: '金經', answer: '指佛經或珍貴的書籍。' },
    { id: '8b2-d14', number: 14, section: '二、注釋', type: 'definition', prompt: '翳入了天聽', answer: '隱沒。' },
    { id: '8b2-d15', number: 15, section: '二、注釋', type: 'definition', prompt: '案「牘」', answer: '古代用以書寫文字的木片。' },
    { id: '8b2-d16', number: 16, section: '二、注釋', type: 'definition', prompt: '何陋之有', answer: '即「有何陋」，指有什麼簡陋的呢？' },
    { id: '8b2-d17', number: 17, section: '二、注釋', type: 'definition', prompt: '爛縵', answer: '光彩紛呈的樣子。' },
    { id: '8b2-d18', number: 18, section: '二、注釋', type: 'definition', prompt: '參差', answer: '不整齊的樣子。' },
    { id: '8b2-d19', number: 19, section: '二、注釋', type: 'definition', prompt: '草色「入」簾青', answer: '映入。' },
    { id: '8b2-d20', number: 20, section: '二、注釋', type: 'definition', prompt: '鴻儒', answer: '學問淵博的人。' },
  ],
};

export const DABU_TIE_SCOPES: DabuTieScope[] = [
  SCOPE_8B2,
];

export const getScopeById = (id: string): DabuTieScope | undefined =>
  DABU_TIE_SCOPES.find((s) => s.id === id);

export const getQuestionById = (
  scopeId: string,
  questionId: string,
): DabuTieQuestion | undefined =>
  getScopeById(scopeId)?.questions.find((q) => q.id === questionId);
