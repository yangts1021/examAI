// 英文八下教學內容（單字、Dialogue 對話、Reading 閱讀、中翻英測驗句）
// 來源：2 下備課用書 PDF（各課 Words、Dialogue、Reading）
// 若要新增其他課次，請依照下方 EnglishLesson 結構新增一個 lesson 並加入 ENGLISH_LESSONS。

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

const LESSON_6: EnglishLesson = {
  id: 'l6',
  title: 'Lesson 6',
  subtitle: 'Where Is He From?',
  vocabGroups: [
    {
      title: 'Dialogue 對話單字',
      words: [
        { word: 'vacation', pos: '(n.)', meaning: '假期' },
        { word: 'belong to', pos: '(phr.)', meaning: '屬於' },
        { word: 'history', pos: '(n.)', meaning: '歷史' },
        { word: 'uniform', pos: '(n.)', meaning: '制服' },
        { word: 'the public', pos: '(n.)', meaning: '民眾' },
        { word: 'glad', pos: '(adj.)', meaning: '高興的' },
        { word: 'perhaps', pos: '(adv.)', meaning: '也許' },
        { word: 'key chain', pos: '(n.)', meaning: '鑰匙圈' },
        { word: 'crow', pos: '(n.)', meaning: '烏鴉' },
        { word: 'raven', pos: '(n.)', meaning: '渡鴉' },
        { word: 'pretty much', pos: '(phr.)', meaning: '幾乎完全地' },
        { word: 'all ears', pos: '(phr.)', meaning: '洗耳恭聽' },
        { word: 'the Tower of London', meaning: '倫敦塔' },
      ],
    },
    {
      title: 'Reading 閱讀單字',
      words: [
        { word: 'dark', pos: '(adj.)', meaning: '深色的' },
        { word: 'ugly', pos: '(adj.)', meaning: '醜的' },
        { word: 'however', pos: '(adv.)', meaning: '然而' },
        { word: 'follow', pos: '(v.)', meaning: '聽從；跟隨' },
        { word: 'quite', pos: '(adv.)', meaning: '很；相當' },
        { word: 'healthy', pos: '(adj.)', meaning: '健康的' },
        { word: 'part', pos: '(n.)', meaning: '一部分' },
        { word: 'be able to', pos: '(phr.)', meaning: '能夠……' },
        { word: 'ground', pos: '(n.)', meaning: '地面' },
        { word: 'stair', pos: '(n.)', meaning: '樓梯' },
        { word: 'high', pos: '(adj.)', meaning: '高的' },
        { word: 'wall', pos: '(n.)', meaning: '牆壁' },
        { word: 'legend', pos: '(n.)', meaning: '傳說' },
        { word: 'kingdom', pos: '(n.)', meaning: '王國' },
        { word: 'keeper', pos: '(n.)', meaning: '飼養者' },
        { word: 'protector', pos: '(n.)', meaning: '保護者' },
        { word: 'tradition', pos: '(n.)', meaning: '傳統' },
        { word: 'honor', pos: '(n.)', meaning: '榮譽' },
        { word: 'safe and sound', pos: '(phr.)', meaning: '安然無恙' },
        { word: 'leave', pos: '(v.)', meaning: '離開（過去式為 left）' },
        { word: 'order', pos: '(v.; n.)', meaning: '命令' },
        { word: 'full-time', pos: '(adj.)', meaning: '全職的' },
        { word: 'King Charles II', meaning: '查理二世' },
      ],
    },
    {
      title: 'Word Power 字彙（職業）',
      words: [
        { word: 'mail carrier', pos: '(n.)', meaning: '郵差（= mailman）' },
        { word: 'voice actor', pos: '(n.)', meaning: '配音員' },
        { word: 'driver', pos: '(n.)', meaning: '駕駛員' },
        { word: 'engineer', pos: '(n.)', meaning: '工程師' },
        { word: 'comic', pos: '(n.)', meaning: '漫畫' },
        { word: 'writer', pos: '(n.)', meaning: '作家' },
        { word: 'soldier', pos: '(n.)', meaning: '士兵；軍人' },
        { word: 'underwater', meaning: '水中的' },
      ],
    },
  ],
  articles: [
    {
      title: 'Dialogue · A Raven Key Chain',
      type: 'dialogue',
      lines: [
        {
          en: '(Tony meets his classmate Zoe after school.)',
          zh: '（Tony 在放學後遇見他的同學 Zoe。）',
          stage: true,
        },
        { speaker: 'Tony', en: 'What are you holding, Zoe?', zh: 'Zoe，妳手上拿著什麼呢？' },
        {
          speaker: 'Zoe',
          en: 'A key chain. I bought it when I was in the UK during winter vacation. Here, take a look.',
          zh: '這是鑰匙圈。我寒假期間在英國時買的。來，拿去看看。',
        },
        { speaker: 'Tony', en: 'Is that black bird a crow?', zh: '這上面的黑鳥是烏鴉嗎？' },
        {
          speaker: 'Zoe',
          en: "Actually, it's a raven. Although crows and ravens belong to the same family, they're different birds.",
          zh: '事實上，它是一隻渡鴉。雖然烏鴉跟渡鴉屬於同個家族的動物，但是牠們是不同的鳥類。',
        },
        {
          speaker: 'Tony',
          en: 'I see, but they are pretty much the same. I heard that some people see crows as bad luck. What about ravens? What do the British think of them?',
          zh: '我了解了，但是牠們長得幾乎完全一樣。我聽說有些人將烏鴉視為厄運，那渡鴉呢？英國人是怎麼看待牠們的？',
        },
        {
          speaker: 'Zoe',
          en: "Ravens are important in UK history. When I visited the Tower of London, I saw a man in uniform taking care of the Tower's ravens.",
          zh: '渡鴉在英國歷史中是很重要的。當我參觀倫敦塔的時候，我看見一位穿著制服的男人在照顧塔上的渡鴉。',
        },
        {
          speaker: 'Tony',
          en: 'That sounds interesting. Tell me more about it.',
          zh: '聽起來很有趣。快告訴我更多關於它的事。',
        },
        {
          speaker: 'Zoe',
          en: "The man also gives tours to the public three times a day. I'm glad that I joined the tour because I learned a lot.",
          zh: '這個男人每天也為大眾導覽倫敦塔三次。我很高興我參加了這個導覽因為我學到了很多。',
        },
        { speaker: 'Tony', en: 'Like what?', zh: '比如呢？' },
        {
          speaker: 'Zoe',
          en: "For example, the history of the Tower and the ravens' names. Perhaps even some ghost stories!",
          zh: '舉例來說，倫敦塔的歷史及渡鴉的名字。或許甚至是一些鬼故事！',
        },
        {
          speaker: 'Tony',
          en: "Cool! I love ghost stories. I'm all ears.",
          zh: '酷耶！我愛鬼故事。我洗耳恭聽。',
        },
      ],
    },
    {
      title: 'Reading · The Ravenmaster',
      type: 'reading',
      lines: [
        {
          en: 'For many people around the world, they think ravens are dark, ugly and bring bad luck. However, the British think differently. Three hundred years ago, there was a popular legend about ravens. "If the ravens leave the Tower of London, the kingdom will fall." Because of this legend, King Charles II ordered his people to always keep ravens in the Tower. Today, the British are still following the king\'s order.',
          zh: '對世界上的很多人來說，他們認為渡鴉既黑又醜而且會帶來厄運。然而，英國人有不同的想法。三百年前，有個關於渡鴉的熱門傳說。「如果渡鴉離開倫敦塔，大英帝國將會殞落。」因為這個傳說，國王查理二世命令他的人民必須將渡鴉永遠留在倫敦塔內。時至今日，英國人仍然遵從這道國王的命令。',
        },
        {
          en: 'There are seven ravens at the Tower now. They have a full-time keeper, the Ravenmaster. Becoming the Ravenmaster is not easy. It often takes quite a few years of training. After that, he works hard every day to make sure the ravens are healthy. Keeping them away from danger is part of his job. Thanks to the Ravenmaster, these birds are safe and sound. Visitors are able to see them on the ground, the stairs or high walls.',
          zh: '現在倫敦塔內有七隻渡鴉。牠們有一位全職照顧者 ― 渡鴉大師。要成為渡鴉大師並不容易。通常需要經過好幾年的訓練。在那之後，他每天努力地工作以保持渡鴉們的健康。讓牠們遠離危險也是他的工作之一。幸虧有渡鴉大師，這些鳥兒們安全無虞。遊客們才能夠在地上、樓梯或高牆上看見牠們。',
        },
        {
          en: 'The Ravenmaster plays an important part in the UK. He is the protector of this British tradition. Although the job is very difficult and takes much effort, it is a great honor to be a Ravenmaster.',
          zh: '渡鴉大師在英國扮演著重要的角色。他是這項英國傳統的守護者。雖然這項工作困難且需要費盡心力，但是擔任渡鴉大師是至高無上的榮耀。',
        },
      ],
    },
  ],
  quizSentences: [
    { zh: 'Zoe，妳手上拿著什麼呢？', en: 'What are you holding, Zoe?' },
    {
      zh: '我寒假期間在英國時買的。',
      en: 'I bought it when I was in the UK during winter vacation.',
    },
    { zh: '這上面的黑鳥是烏鴉嗎？', en: 'Is that black bird a crow?' },
    {
      zh: '雖然烏鴉跟渡鴉屬於同個家族的動物，但是牠們是不同的鳥類。',
      en: "Although crows and ravens belong to the same family, they're different birds.",
    },
    {
      zh: '我聽說有些人將烏鴉視為厄運。',
      en: 'I heard that some people see crows as bad luck.',
    },
    { zh: '渡鴉在英國歷史中是很重要的。', en: 'Ravens are important in UK history.' },
    {
      zh: '聽起來很有趣。快告訴我更多關於它的事。',
      en: 'That sounds interesting. Tell me more about it.',
    },
    {
      zh: '我很高興我參加了這個導覽因為我學到了很多。',
      en: "I'm glad that I joined the tour because I learned a lot.",
    },
    {
      zh: '對世界上的很多人來說，他們認為渡鴉既黑又醜而且會帶來厄運。',
      en: 'For many people around the world, they think ravens are dark, ugly and bring bad luck.',
    },
    { zh: '然而，英國人有不同的想法。', en: 'However, the British think differently.' },
    {
      zh: '因為這個傳說，國王查理二世命令他的人民必須將渡鴉永遠留在倫敦塔內。',
      en: 'Because of this legend, King Charles II ordered his people to always keep ravens in the Tower.',
    },
    { zh: '要成為渡鴉大師並不容易。', en: 'Becoming the Ravenmaster is not easy.' },
    {
      zh: '讓牠們遠離危險也是他的工作之一。',
      en: 'Keeping them away from danger is part of his job.',
    },
    {
      zh: '渡鴉大師在英國扮演著重要的角色。',
      en: 'The Ravenmaster plays an important part in the UK.',
    },
    {
      zh: '雖然這項工作困難且需要費盡心力，但是擔任渡鴉大師是至高無上的榮耀。',
      en: 'Although the job is very difficult and takes much effort, it is a great honor to be a Ravenmaster.',
    },
  ],
};

export const ENGLISH_LESSONS: EnglishLesson[] = [LESSON_5, LESSON_6];
