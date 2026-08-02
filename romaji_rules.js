window.ROMAJI_RULES = {
  // ひらがなごとの入力候補。
  // 例：し は shi でも si でも正解にする。
  kanaRules: {
    'あ': ['a'],
    'い': ['i'],
    'う': ['u'],
    'え': ['e'],
    'お': ['o'],

    'か': ['ka'],
    'き': ['ki'],
    'く': ['ku'],
    'け': ['ke'],
    'こ': ['ko'],

    'さ': ['sa'],
    'し': ['shi', 'si'],
    'す': ['su'],
    'せ': ['se'],
    'そ': ['so'],

    'た': ['ta'],
    'ち': ['chi', 'ti'],
    'つ': ['tsu', 'tu'],
    'て': ['te'],
    'と': ['to'],

    'な': ['na'],
    'に': ['ni'],
    'ぬ': ['nu'],
    'ね': ['ne'],
    'の': ['no'],

    'は': ['ha'],
    'ひ': ['hi'],
    'ふ': ['fu', 'hu'],
    'へ': ['he'],
    'ほ': ['ho'],

    'ま': ['ma'],
    'み': ['mi'],
    'む': ['mu'],
    'め': ['me'],
    'も': ['mo'],

    'や': ['ya'],
    'ゆ': ['yu'],
    'よ': ['yo'],

    'ら': ['ra'],
    'り': ['ri'],
    'る': ['ru'],
    'れ': ['re'],
    'ろ': ['ro'],

    'わ': ['wa'],
    'を': ['wo', 'o'],
    'ん': ['n', 'nn'], // 通常候補。語末だけ nn 必須にする処理は specialRules.finalN で制御します。

    'が': ['ga'],
    'ぎ': ['gi'],
    'ぐ': ['gu'],
    'げ': ['ge'],
    'ご': ['go'],

    'ざ': ['za'],
    'じ': ['ji', 'zi'],
    'ず': ['zu'],
    'ぜ': ['ze'],
    'ぞ': ['zo'],

    'だ': ['da'],
    'ぢ': ['ji', 'di'],
    'づ': ['zu', 'du'],
    'で': ['de'],
    'ど': ['do'],

    'ば': ['ba'],
    'び': ['bi'],
    'ぶ': ['bu'],
    'べ': ['be'],
    'ぼ': ['bo'],

    'ぱ': ['pa'],
    'ぴ': ['pi'],
    'ぷ': ['pu'],
    'ぺ': ['pe'],
    'ぽ': ['po'],

    'きゃ': ['kya'],
    'きゅ': ['kyu'],
    'きょ': ['kyo'],

    'しゃ': ['sha', 'sya'],
    'しゅ': ['shu', 'syu'],
    'しょ': ['sho', 'syo'],

    'ちゃ': ['cha', 'tya', 'cya'],
    'ちゅ': ['chu', 'tyu', 'cyu'],
    'ちょ': ['cho', 'tyo', 'cyo'],

    'にゃ': ['nya'],
    'にゅ': ['nyu'],
    'にょ': ['nyo'],

    'ひゃ': ['hya'],
    'ひゅ': ['hyu'],
    'ひょ': ['hyo'],

    'みゃ': ['mya'],
    'みゅ': ['myu'],
    'みょ': ['myo'],

    'りゃ': ['rya'],
    'りゅ': ['ryu'],
    'りょ': ['ryo'],

    'ぎゃ': ['gya'],
    'ぎゅ': ['gyu'],
    'ぎょ': ['gyo'],

    'じゃ': ['ja', 'jya', 'zya'],
    'じゅ': ['ju', 'jyu', 'zyu'],
    'じょ': ['jo', 'jyo', 'zyo'],

    'びゃ': ['bya'],
    'びゅ': ['byu'],
    'びょ': ['byo'],

    'ぴゃ': ['pya'],
    'ぴゅ': ['pyu'],
    'ぴょ': ['pyo'],

    'ぁ': ['xa', 'la'],
    'ぃ': ['xi', 'li'],
    'ぅ': ['xu', 'lu'],
    'ぇ': ['xe', 'le'],
    'ぉ': ['xo', 'lo'],
    'ゃ': ['xya', 'lya'],
    'ゅ': ['xyu', 'lyu'],
    'ょ': ['xyo', 'lyo'],
    'っ': ['xtu', 'ltu'],
    'ー': ['-']
  },

  // 文脈によって変わる特殊ルール。
  // 例：語中の「ん」は n / nn どちらもOK、語末の「ん」は nn のみOK。
  specialRules: {
    finalN: {
      enabled: true,
      finalOptions: ['nn'],
      middleOptions: ['n', 'nn']
    }
  },

  // すでに roma に英字が登録されている単語にも適用する置換候補。
  // typing_words.js の roma が shuuchuu なら syuuchuu も正解にするための補助ルールです。
  romaSubstitutions: [
    ['shi', 'si'], ['si', 'shi'],
    ['chi', 'ti'], ['ti', 'chi'],
    ['tsu', 'tu'], ['tu', 'tsu'],
    ['fu', 'hu'], ['hu', 'fu'],
    ['ji', 'zi'], ['zi', 'ji'],
    ['ja', 'jya'], ['ja', 'zya'], ['jya', 'ja'], ['zya', 'ja'],
    ['ju', 'jyu'], ['ju', 'zyu'], ['jyu', 'ju'], ['zyu', 'ju'],
    ['jo', 'jyo'], ['jo', 'zyo'], ['jyo', 'jo'], ['zyo', 'jo'],
    ['sha', 'sya'], ['sya', 'sha'],
    ['shu', 'syu'], ['syu', 'shu'],
    ['sho', 'syo'], ['syo', 'sho'],
    ['cha', 'tya'], ['cha', 'cya'], ['tya', 'cha'], ['cya', 'cha'],
    ['chu', 'tyu'], ['chu', 'cyu'], ['tyu', 'chu'], ['cyu', 'chu'],
    ['cho', 'tyo'], ['cho', 'cyo'], ['tyo', 'cho'], ['cyo', 'cho']
  ]
};
