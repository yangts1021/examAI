// 英文八下 Lesson 5「Some of the Most Useful Ideas Come from Nature」教學內容
// 來源：2 下備課用書 PDF Lesson 5（單字、Dialogue 對話、Reading 閱讀）
// 若要新增其他課次，請依照下方 EnglishLesson 結構另建資料並加入 ENGLISH_LESSONS。

export interface VocabWord {
  word: string;    // 英文單字／片語（點讀時實際發音的內容）
  pos?: string;    // 詞性，例如 "(n.)"、"(adj.)"
  meaning: string; // 中文解釋
}

export interface VocabGroup {
  title: string;
  words: VocabWord[];
}

export interface ArticleLine {
  speaker?: string; // 對話用，朗讀整句時不會唸出
  en: string;       // 英文（點讀整句的內容）
  zh: string;       // 中文翻譯
  stage?: boolean;  // 是否為情境提示（斜體）
}

export interface Article {
  title: string;
  type: 'dialogue' | 'reading';
  lines: ArticleLine[];
}

export interface QuizSentence {
  zh: string; // 中文題目
  en: string; // 正確英文答案
}

export interface EnglishLesson {
  id: string;
  title: string;
  subtitle?: string;
  vocabGroups: VocabGroup[];
  articles: Article[];
  quizSentences: QuizSentence[];
}

const LESSON_5: EnglishLesson = {
  id: 'l5',
  title: 'Lesson 5',
  subtitle: 'Some of the Most Useful Ideas Come from Nature',
  vocabGroups: [
    {
      title: 'Dialogue 對話單字',
      words: [
        { word: 'science', pos: '(n.)', meaning: '科學' },
        { word: 'strange', pos: '(adj.)', meaning: '奇怪的' },
        { word: 'through', pos: '(prep.)', meaning: '穿越' },
        { word: 'noise', pos: '(n.)', meaning: '噪音' },
        { word: 'although', pos: '(conj.)', meaning: '雖然；儘管' },
        { word: 'both', pos: '(pron.)', meaning: '兩者（都）' },
        { word: 'if', pos: '(conj.)', meaning: '如果' },
        { word: 'anyone', pos: '(pron.)', meaning: '任何人（= anybody）' },
        { word: 'answer', pos: '(n.)', meaning: '答案' },
        { word: 'sign', pos: '(n.)', meaning: '告示；標誌' },
        { word: 'body', pos: '(n.)', meaning: '身體' },
        { word: 'change', pos: '(v.)', meaning: '改變' },
        { word: 'copy', pos: '(v.)', meaning: '模仿；抄襲' },
        { word: 'head', pos: '(n.)', meaning: '頭部' },
        { word: 'tunnel', pos: '(n.)', meaning: '隧道' },
        { word: 'design', pos: '(n.; v.)', meaning: '設計' },
        { word: 'beak', pos: '(n.)', meaning: '（鳥類的）嘴；喙' },
        { word: 'sound', pos: '(n.)', meaning: '聲音' },
        { word: 'not at all', pos: '(phr.)', meaning: '一點也不（表達強烈否定）' },
        { word: 'shape', pos: '(n.)', meaning: '外形；形狀' },
        { word: 'bullet train', meaning: '子彈列車' },
        { word: 'Taiwan High Speed Rail', meaning: '台灣高鐵' },
      ],
    },
    {
      title: 'Reading 閱讀單字',
      words: [
        { word: 'nature', pos: '(n.)', meaning: '大自然' },
        { word: 'reason', pos: '(n.)', meaning: '原因' },
        { word: 'tooth', pos: '(n.)', meaning: '牙齒（複數為 teeth）' },
        { word: 'cover', pos: '(v.)', meaning: '覆蓋' },
        { word: 'tip', pos: '(n.)', meaning: '頂端；尖端' },
        { word: 'borrow', pos: '(v.)', meaning: '借用' },
        { word: 'shark', pos: '(n.)', meaning: '鯊魚' },
        { word: 'skin', pos: '(n.)', meaning: '皮膚' },
        { word: 'scale', pos: '(n.)', meaning: '魚鱗' },
        { word: 'swimsuit', pos: '(n.)', meaning: '泳衣' },
        { word: 'plant', pos: '(n.)', meaning: '植物' },
        { word: 'biomimicry', meaning: '仿生學' },
        { word: 'mimic', meaning: '模仿；學……的樣子' },
      ],
    },
    {
      title: 'Word Power 字彙',
      words: [
        { word: 'neck', pos: '(n.)', meaning: '脖子' },
        { word: 'hair', pos: '(n.)', meaning: '頭髮' },
        { word: 'sharp', pos: '(adj.)', meaning: '尖銳的' },
        { word: 'nail', pos: '(n.)', meaning: '指甲' },
        { word: 'lip', pos: '(n.)', meaning: '嘴唇' },
        { word: 'nose', pos: '(n.)', meaning: '鼻子' },
        { word: 'knee', pos: '(n.)', meaning: '膝蓋' },
        { word: 'leg', pos: '(n.)', meaning: '腿' },
      ],
    },
  ],
  articles: [
    {
      title: 'Dialogue · At the Science Museum',
      type: 'dialogue',
      lines: [
        {
          en: '(Ben, David, and Sally are at the science museum.)',
          zh: '（Ben、David 和 Sally 在科學博物館裡。）',
          stage: true,
        },
        { speaker: 'Ben', en: "What's that strange sound?", zh: '那是什麼奇怪的聲音？' },
        { speaker: 'David', en: "Look, it's from the train on TV.", zh: '看，它是從電視上的火車傳來的。' },
        {
          speaker: 'Sally',
          en: "It's going through a tunnel now and making a lot of noise.",
          zh: '那列火車正經過一個隧道並發出很大的噪音。',
        },
        {
          speaker: 'Ben',
          en: "There is another train on the other TV. Although it's running fast, it's not noisy at all.",
          zh: '另一臺電視上有另一列火車。雖然它跑得很快，但一點也不吵。',
        },
        {
          speaker: 'Sally',
          en: 'Both of the trains are fast. Why is the blue one quieter?',
          zh: '這兩列火車都很快。為什麼藍色的列車比較安靜呢？',
        },
        {
          speaker: 'David',
          en: "I don't know. If someone's around, we can ask.",
          zh: '我不知道。如果附近有人，我們可以詢問。',
        },
        {
          speaker: 'Ben',
          en: "I don't see anyone here. We'll need to find out the answer ourselves. Look, there is a sign.",
          zh: '我沒有看到這裡有人。我們需要自己找出答案。看，那裡有個告示牌。',
        },
        {
          speaker: 'David',
          en: 'OK. Let\'s read it.... "People use the shape of animals\' bodies to make useful things. The bullet train in Japan is a good example."',
          zh: '好。讓我們來讀吧……「人們利用動物身體的形狀來製造有用的東西。日本的子彈列車就是個好例子。」',
        },
        { speaker: 'Sally', en: 'What did they do?', zh: '他們做了什麼呢？' },
        {
          speaker: 'Ben',
          en: "People didn't like those noisy trains, so they changed their design.",
          zh: '人們不喜歡那些嘈雜的火車，因此他們改變了火車的設計。',
        },
        {
          speaker: 'David',
          en: "They copied the shape of a bird's long beak and gave those trains a new head. Now the trains are less noisy.",
          zh: '他們模仿一種鳥的長喙外形並給了那些列車新的火車頭。現在火車就比較不吵了。',
        },
        {
          speaker: 'Ben',
          en: 'The special shape also helps the trains run faster than before.',
          zh: '那特別的外形也幫助火車跑得比以前更快了。',
        },
        { speaker: 'Sally', en: "Really? That's so cool.", zh: '真的嗎？那好酷喔。' },
        {
          speaker: 'David',
          en: 'The sign also says, "The Taiwan High Speed Rail train copies the design of the bullet train."',
          zh: '告示牌也寫著：「臺灣高鐵列車模仿子彈列車的設計。」',
        },
        { speaker: 'Sally', en: 'Wow, I learned so much today.', zh: '哇，我今天學了好多。' },
      ],
    },
    {
      title: 'Reading · What Is Biomimicry?',
      type: 'reading',
      lines: [
        {
          en: 'The word biomimicry comes from "bio" and "mimic." "Bio" means "life" and "mimic" means "to copy." Biomimicry is about copying from animals and plants. People learn from nature and create useful things to make their lives better.',
          zh: '仿生這個字源自「bio」和「mimic」兩個字。「Bio」意思是「生命」，「mimic」意思是「模仿」。仿生是關於向動植物模仿的知識。人們向大自然學習並創造出有用的東西來讓他們的生活更好。',
        },
        {
          en: 'The shark is a great example. Although sharks swim faster than most fish, the reason for this was not clear at first. People studied shark skin and found many small scales on it. These scales look like teeth and cover the shark from tip to tail. The shape of the scales helps the shark move through the water more easily and faster. People borrowed this idea to create a new swimsuit. With one of these swimsuits, people can swim much faster.',
          zh: '鯊魚是一個很棒的例子。雖然鯊魚游得比大多數的魚快，但這個原因一開始並不清楚。人們研究鯊魚皮並發現其上有許多小魚鱗。這些魚鱗看起來像牙齒，從鯊魚的頂端覆蓋到尾部。魚鱗的形狀讓鯊魚更容易也更快速地移動穿過水。人們借用這個點子製造新的泳衣。有了其中一種這類的泳衣，人們可以游得更快。',
        },
        {
          en: 'Mother Nature is the best teacher. If you look and listen closely, she may teach you something amazing. The next time you are playing in a park or walking in a forest, ask yourself, "What can I learn from nature today?"',
          zh: '大自然是最好的老師。如果你仔細看、仔細聽，她可能會教給你某個驚人的事物。下一次當你在公園裡玩耍或在森林裡散步時，問問你自己：「我今天可以從大自然中學習什麼？」',
        },
      ],
    },
  ],
  quizSentences: [
    { zh: '那是什麼奇怪的聲音？', en: "What's that strange sound?" },
    { zh: '看，它是從電視上的火車傳來的。', en: "Look, it's from the train on TV." },
    {
      zh: '那列火車正經過一個隧道並發出很大的噪音。',
      en: "It's going through a tunnel now and making a lot of noise.",
    },
    { zh: '雖然它跑得很快，但一點也不吵。', en: "Although it's running fast, it's not noisy at all." },
    { zh: '這兩列火車都很快。', en: 'Both of the trains are fast.' },
    { zh: '如果附近有人，我們可以詢問。', en: "If someone's around, we can ask." },
    { zh: '我沒有看到這裡有人。', en: "I don't see anyone here." },
    {
      zh: '人們利用動物身體的形狀來製造有用的東西。',
      en: "People use the shape of animals' bodies to make useful things.",
    },
    { zh: '日本的子彈列車就是個好例子。', en: 'The bullet train in Japan is a good example.' },
    {
      zh: '人們不喜歡那些嘈雜的火車，因此他們改變了火車的設計。',
      en: "People didn't like those noisy trains, so they changed their design.",
    },
    {
      zh: '那特別的外形也幫助火車跑得比以前更快了。',
      en: 'The special shape also helps the trains run faster than before.',
    },
    {
      zh: '人們向大自然學習並創造出有用的東西來讓他們的生活更好。',
      en: 'People learn from nature and create useful things to make their lives better.',
    },
    { zh: '鯊魚是一個很棒的例子。', en: 'The shark is a great example.' },
    {
      zh: '這些魚鱗看起來像牙齒，從鯊魚的頂端覆蓋到尾部。',
      en: 'These scales look like teeth and cover the shark from tip to tail.',
    },
    {
      zh: '有了其中一種這類的泳衣，人們可以游得更快。',
      en: 'With one of these swimsuits, people can swim much faster.',
    },
    { zh: '大自然是最好的老師。', en: 'Mother Nature is the best teacher.' },
  ],
};

export const ENGLISH_LESSONS: EnglishLesson[] = [LESSON_5];
