// Curated Strong's lexicon - common Greek (G) and Hebrew (H) words a believer
// is most likely to study. Not exhaustive; intended as an offline-first answer
// that the AI route deepens. Each entry includes the Strong's number,
// transliteration, the original-language word, one-line gloss, and a fuller
// note on usage.

export interface StrongsEntry {
  number: string; // e.g. "G26", "H7225"
  language: "greek" | "hebrew";
  translit: string; // e.g. "agape"
  original: string; // the original glyph
  gloss: string; // a short definition
  usage: string; // longer pastoral note
  english: string[]; // English words this often translates as
  examples: { ref: string; quote?: string }[];
}

const RAW: StrongsEntry[] = [
  // ── Greek ─────────────────────────────────────────────────────────
  {
    number: "G26",
    language: "greek",
    translit: "agapē",
    original: "ἀγάπη",
    gloss: "self-giving, covenant love",
    usage:
      "The love that originates in God, sets its affection on its object before any merit, and gives without expecting return. Not primarily emotion - primarily decision and action. Used of God's love for the world (John 3:16) and of the love the Spirit pours into the heart (Rom 5:5).",
    english: ["love", "charity"],
    examples: [
      { ref: "1 John 4:8", quote: "God is love." },
      { ref: "1 Corinthians 13:4-7" },
      { ref: "John 3:16" },
    ],
  },
  {
    number: "G5485",
    language: "greek",
    translit: "charis",
    original: "χάρις",
    gloss: "grace; unmerited favour",
    usage:
      "God's freely given favour that saves and sustains. Source of both salvation (Eph 2:8) and the strength to live the Christian life (2 Cor 12:9). Carries the older sense of 'beauty' / 'pleasing' - God's grace is not only powerful, it is winsome.",
    english: ["grace", "favour", "thanks"],
    examples: [
      { ref: "Ephesians 2:8" },
      { ref: "2 Corinthians 12:9", quote: "My grace is sufficient for you." },
      { ref: "Titus 2:11" },
    ],
  },
  {
    number: "G4151",
    language: "greek",
    translit: "pneuma",
    original: "πνεῦμα",
    gloss: "spirit, breath, wind",
    usage:
      "The Spirit of God, the human spirit, or breath/wind, depending on context. Jesus uses the same root for both 'wind' and 'Spirit' in John 3:8 - the Spirit moves where He wills.",
    english: ["spirit", "Spirit", "wind", "breath"],
    examples: [
      { ref: "John 3:8" },
      { ref: "Romans 8:16" },
      { ref: "Acts 2:4" },
    ],
  },
  {
    number: "G4102",
    language: "greek",
    translit: "pistis",
    original: "πίστις",
    gloss: "faith; trustful reliance",
    usage:
      "Not bare intellectual assent - pistis is a trust that acts. In Hebrews 11 it is the substance and conviction by which the saints move. Carries the active sense of 'faithfulness' as well as 'belief'.",
    english: ["faith", "belief", "faithfulness"],
    examples: [
      { ref: "Hebrews 11:1" },
      { ref: "Romans 1:17" },
      { ref: "Galatians 2:20" },
    ],
  },
  {
    number: "G1680",
    language: "greek",
    translit: "elpis",
    original: "ἐλπίς",
    gloss: "hope; confident expectation",
    usage:
      "Far stronger than the English 'I hope it doesn't rain'. Biblical elpis is settled confidence that God will do what He promised. Anchored in Christ (Heb 6:19), it does not put to shame (Rom 5:5).",
    english: ["hope"],
    examples: [
      { ref: "Romans 5:5" },
      { ref: "Hebrews 6:19" },
    ],
  },
  {
    number: "G1411",
    language: "greek",
    translit: "dunamis",
    original: "δύναμις",
    gloss: "power, ability, miraculous power",
    usage:
      "Inherent power - the root of 'dynamite' and 'dynamic'. Used of the gospel (Rom 1:16) and the Spirit (Acts 1:8). Not flashy force, but God's effective ability working through people.",
    english: ["power", "might", "ability", "miracle"],
    examples: [
      { ref: "Acts 1:8" },
      { ref: "Romans 1:16" },
    ],
  },
  {
    number: "G3056",
    language: "greek",
    translit: "logos",
    original: "λόγος",
    gloss: "word; rational account; the Word",
    usage:
      "Speech, message, or principle of reason. John 1:1 names Christ the Logos - the eternal divine self-expression who became flesh. In ordinary use it can mean a saying, an account, or a sermon.",
    english: ["word", "saying", "message", "account"],
    examples: [
      { ref: "John 1:1" },
      { ref: "Hebrews 4:12" },
    ],
  },
  {
    number: "G4487",
    language: "greek",
    translit: "rhēma",
    original: "ῥῆμα",
    gloss: "spoken word, utterance",
    usage:
      "A specific spoken word - the now-word of God to a moment. Often contrasted (gently) with logos as the broader written Word vs. the Spirit-applied living word that pierces today (Eph 6:17).",
    english: ["word", "saying"],
    examples: [
      { ref: "Ephesians 6:17", quote: "the sword of the Spirit, which is the word (rhēma) of God" },
      { ref: "Romans 10:17" },
    ],
  },
  {
    number: "G1391",
    language: "greek",
    translit: "doxa",
    original: "δόξα",
    gloss: "glory, splendour, weight",
    usage:
      "The visible weight of God's worth - His radiance and reputation. From the verb 'to think well of'. In Christ we behold the doxa of God (2 Cor 4:6), and we are being transformed from glory to glory (2 Cor 3:18).",
    english: ["glory", "honour", "praise"],
    examples: [
      { ref: "John 1:14" },
      { ref: "2 Corinthians 3:18" },
      { ref: "Romans 11:36" },
    ],
  },
  {
    number: "G40",
    language: "greek",
    translit: "hagios",
    original: "ἅγιος",
    gloss: "holy, set apart",
    usage:
      "Set apart for God. Used of God Himself, of the Spirit, of believers ('saints' = hagioi), of the temple. Not first a moral category but a positional one - being God's - which then trains moral character.",
    english: ["holy", "saint"],
    examples: [
      { ref: "1 Peter 1:16", quote: "Be holy, for I am holy." },
      { ref: "Romans 12:1" },
    ],
  },
  {
    number: "G2222",
    language: "greek",
    translit: "zōē",
    original: "ζωή",
    gloss: "life - the divine kind",
    usage:
      "The life of God Himself, given to those in Christ (John 10:10). Often distinguished from bios (biological life). Eternal zoē begins now and continues forever (John 17:3).",
    english: ["life"],
    examples: [
      { ref: "John 10:10", quote: "I came that they may have life and have it abundantly." },
      { ref: "John 17:3" },
    ],
  },
  {
    number: "G5547",
    language: "greek",
    translit: "Christos",
    original: "Χριστός",
    gloss: "Christ, Anointed One",
    usage:
      "The Greek for Hebrew Mashiach - the Anointed. Title before name: 'Jesus the Christ'. Carries every messianic expectation of the Old Testament - King, Priest, Prophet.",
    english: ["Christ", "Messiah"],
    examples: [
      { ref: "Matthew 16:16" },
      { ref: "John 20:31" },
    ],
  },
  {
    number: "G2424",
    language: "greek",
    translit: "Iēsous",
    original: "Ἰησοῦς",
    gloss: "Jesus - 'Yahweh saves'",
    usage:
      "The Greek transliteration of Yeshua / Joshua - 'the LORD is salvation'. Named by angel before birth, because He will save His people from their sins (Matt 1:21).",
    english: ["Jesus"],
    examples: [
      { ref: "Matthew 1:21" },
      { ref: "Acts 4:12" },
    ],
  },
  {
    number: "G2962",
    language: "greek",
    translit: "Kurios",
    original: "Κύριος",
    gloss: "Lord, Master",
    usage:
      "Standard Greek translation of the divine name YHWH in the Septuagint, and Paul's confession of Christ (Phil 2:11). To say 'Jesus is Kurios' is to confess Him as the God of Israel.",
    english: ["Lord", "master"],
    examples: [
      { ref: "Philippians 2:11" },
      { ref: "Romans 10:9" },
    ],
  },
  {
    number: "G2098",
    language: "greek",
    translit: "euangelion",
    original: "εὐαγγέλιον",
    gloss: "good news, gospel",
    usage:
      "Originally a herald's announcement of victory or accession. The 'gospel' is the news that Jesus is risen King - and through Him sinners are reconciled to God.",
    english: ["gospel", "good news"],
    examples: [
      { ref: "Romans 1:16" },
      { ref: "Mark 1:1" },
    ],
  },
  {
    number: "G1577",
    language: "greek",
    translit: "ekklēsia",
    original: "ἐκκλησία",
    gloss: "church; called-out assembly",
    usage:
      "Not a building - the gathered people called out by God. In Greek civic life a town assembly; in the NT, the global and local people of Jesus.",
    english: ["church", "assembly"],
    examples: [
      { ref: "Matthew 16:18" },
      { ref: "Ephesians 1:22-23" },
    ],
  },
  {
    number: "G3340",
    language: "greek",
    translit: "metanoeō",
    original: "μετανοέω",
    gloss: "to repent; to change one's mind",
    usage:
      "A turning of the inner life - the mind, will, and direction - toward God. More than emotion ('I feel bad'); a re-orientation that produces fruit (Matt 3:8).",
    english: ["repent", "change of mind"],
    examples: [
      { ref: "Matthew 4:17" },
      { ref: "Acts 2:38" },
    ],
  },
  {
    number: "G1342",
    language: "greek",
    translit: "dikaios",
    original: "δίκαιος",
    gloss: "righteous, just",
    usage:
      "Right standing before God, by faith. Paul builds Romans 1-4 on this - 'the just shall live by faith' - that God's righteousness is gift, not earned status.",
    english: ["righteous", "just"],
    examples: [
      { ref: "Romans 1:17" },
      { ref: "Romans 5:1" },
    ],
  },
  {
    number: "G266",
    language: "greek",
    translit: "hamartia",
    original: "ἁμαρτία",
    gloss: "sin; missing the mark",
    usage:
      "An archery term - to miss the target. Sin is both failure to hit God's standard and a power that enslaves until Christ liberates (Rom 6).",
    english: ["sin"],
    examples: [
      { ref: "Romans 3:23" },
      { ref: "Romans 6:23" },
    ],
  },
  {
    number: "G1515",
    language: "greek",
    translit: "eirēnē",
    original: "εἰρήνη",
    gloss: "peace; wholeness (= Heb. shalom)",
    usage:
      "More than absence of conflict - God's wholeness. Paul opens nearly every letter with grace and peace; the peace that guards the heart (Phil 4:7).",
    english: ["peace"],
    examples: [
      { ref: "John 14:27" },
      { ref: "Philippians 4:7" },
    ],
  },
  {
    number: "G3870",
    language: "greek",
    translit: "parakaleō",
    original: "παρακαλέω",
    gloss: "to call alongside; comfort, encourage, exhort",
    usage:
      "The verb behind 'Paraclete' (John 14-16). Used both of urgent appeal and gentle comfort - God calls us alongside Himself and sends us alongside others.",
    english: ["comfort", "encourage", "exhort", "urge"],
    examples: [
      { ref: "2 Corinthians 1:3-4" },
      { ref: "John 14:16" },
    ],
  },
  // ── Hebrew ───────────────────────────────────────────────────────
  {
    number: "H3068",
    language: "hebrew",
    translit: "YHWH",
    original: "יְהוָה",
    gloss: "the LORD - the personal name of God",
    usage:
      "The covenant name revealed at the burning bush (Ex 3:14). Traditionally read aloud as 'Adonai'. Most English Bibles render it 'LORD' in small caps. The name speaks of God's self-existence and faithfulness.",
    english: ["LORD", "Yahweh", "Jehovah"],
    examples: [
      { ref: "Exodus 3:14-15" },
      { ref: "Psalm 23:1" },
    ],
  },
  {
    number: "H430",
    language: "hebrew",
    translit: "Elohim",
    original: "אֱלֹהִים",
    gloss: "God; mighty ones (plural of majesty)",
    usage:
      "The plural noun used for the one true God - opens Genesis 1:1. The plural form does not imply many gods but the fullness and majesty of the One.",
    english: ["God", "god", "judges"],
    examples: [
      { ref: "Genesis 1:1" },
      { ref: "Psalm 19:1" },
    ],
  },
  {
    number: "H136",
    language: "hebrew",
    translit: "Adonai",
    original: "אֲדֹנָי",
    gloss: "Lord, Master",
    usage:
      "'My Lord' - the reverent substitute spoken when reading YHWH aloud. Isaiah 6 - 'I saw the Adonai sitting on a throne'.",
    english: ["Lord"],
    examples: [
      { ref: "Isaiah 6:1" },
      { ref: "Psalm 8:1" },
    ],
  },
  {
    number: "H2617",
    language: "hebrew",
    translit: "chesed",
    original: "חֶסֶד",
    gloss: "steadfast love; covenant loyalty",
    usage:
      "One of the great Hebrew words - God's loyal love that keeps covenant even when His people break it. Psalm 136 says it 'endures forever' twenty-six times in a row.",
    english: ["lovingkindness", "steadfast love", "mercy", "kindness"],
    examples: [
      { ref: "Psalm 136" },
      { ref: "Lamentations 3:22-23" },
      { ref: "Micah 6:8" },
    ],
  },
  {
    number: "H7965",
    language: "hebrew",
    translit: "shalom",
    original: "שָׁלוֹם",
    gloss: "peace, wholeness, well-being",
    usage:
      "Not merely the absence of war but the presence of every good thing. The Aaronic blessing ends with shalom (Num 6:26); the Messiah is the Prince of Shalom (Isa 9:6).",
    english: ["peace", "well-being", "wholeness"],
    examples: [
      { ref: "Numbers 6:24-26" },
      { ref: "Isaiah 9:6" },
    ],
  },
  {
    number: "H7307",
    language: "hebrew",
    translit: "ruach",
    original: "רוּחַ",
    gloss: "spirit, wind, breath",
    usage:
      "Same semantic field as pneuma. The Ruach of God hovers over the waters in Gen 1:2; God breathes ruach into Adam (Gen 2:7); the dry bones live by ruach in Ezek 37.",
    english: ["spirit", "Spirit", "wind", "breath"],
    examples: [
      { ref: "Genesis 1:2" },
      { ref: "Ezekiel 37:9-10" },
    ],
  },
  {
    number: "H539",
    language: "hebrew",
    translit: "aman",
    original: "אָמַן",
    gloss: "to confirm, to support, to believe",
    usage:
      "The root of 'amen'. Originally the leaning of a parent on a child or a wall on a foundation - to lean one's full weight. To believe God is to lean on Him.",
    english: ["believe", "amen", "faithful", "trust"],
    examples: [
      { ref: "Genesis 15:6" },
      { ref: "Habakkuk 2:4" },
    ],
  },
  {
    number: "H1288",
    language: "hebrew",
    translit: "barak",
    original: "בָּרַךְ",
    gloss: "to bless; to kneel",
    usage:
      "The same root for 'bless' and 'kneel'. God blesses by giving; humanity blesses God by bowing. The blessing of Aaron (Num 6) is one of the oldest words still prayed today.",
    english: ["bless", "kneel", "praise"],
    examples: [
      { ref: "Genesis 12:2-3" },
      { ref: "Numbers 6:24" },
    ],
  },
  {
    number: "H3034",
    language: "hebrew",
    translit: "yadah",
    original: "יָדָה",
    gloss: "to thank, to praise (with extended hands)",
    usage:
      "Literally 'to throw' or 'cast forth'. Carries the picture of lifting the hands - open, empty, receiving. Behind many of the Psalms' calls to give thanks.",
    english: ["praise", "thank", "give thanks"],
    examples: [
      { ref: "Psalm 100:4" },
      { ref: "Psalm 107:1" },
    ],
  },
  {
    number: "H1984",
    language: "hebrew",
    translit: "halal",
    original: "הָלַל",
    gloss: "to praise, to boast, to be clamorous",
    usage:
      "Loud, exuberant praise - the root of Hallelujah ('praise Yah'). Often associated with celebration that is not quiet.",
    english: ["praise", "boast", "celebrate"],
    examples: [
      { ref: "Psalm 150" },
      { ref: "Psalm 22:22" },
    ],
  },
  {
    number: "H7225",
    language: "hebrew",
    translit: "reshit",
    original: "רֵאשִׁית",
    gloss: "beginning, firstfruits, chief",
    usage:
      "Genesis opens with bereshit - 'in the beginning'. Same root as 'firstfruits' and 'first/chief'. God claims the first of everything - time, harvest, sons.",
    english: ["beginning", "first", "firstfruits"],
    examples: [
      { ref: "Genesis 1:1" },
      { ref: "Proverbs 1:7" },
    ],
  },
  {
    number: "H3519",
    language: "hebrew",
    translit: "kavod",
    original: "כָּבוֹד",
    gloss: "glory; weight, heaviness",
    usage:
      "Literally 'weight'. God's kavod is His weighty presence - what filled the tabernacle (Ex 40) and the temple (1 Kgs 8). Doxa is the Greek counterpart.",
    english: ["glory", "honour", "weight"],
    examples: [
      { ref: "Exodus 33:18" },
      { ref: "Isaiah 6:3" },
    ],
  },
  {
    number: "H6944",
    language: "hebrew",
    translit: "qodesh",
    original: "קֹדֶשׁ",
    gloss: "holiness; set apart",
    usage:
      "Used of God, ground, days, garments, and the people themselves. 'Holy holy holy' (Isa 6:3) - qadosh qadosh qadosh - is the only attribute repeated three times of God in scripture.",
    english: ["holy", "holiness", "sanctuary"],
    examples: [
      { ref: "Isaiah 6:3" },
      { ref: "Leviticus 11:44" },
    ],
  },
  {
    number: "H3467",
    language: "hebrew",
    translit: "yasha",
    original: "יָשַׁע",
    gloss: "to save, to deliver",
    usage:
      "The verb behind Yeshua/Joshua and Hoshana ('save now'). The cry of Israel before deliverance - at the Red Sea, at the cross, at the second coming.",
    english: ["save", "deliver", "rescue"],
    examples: [
      { ref: "Exodus 14:13" },
      { ref: "Matthew 1:21" },
    ],
  },
  {
    number: "H8104",
    language: "hebrew",
    translit: "shamar",
    original: "שָׁמַר",
    gloss: "to keep, to guard, to watch over",
    usage:
      "The verb in 'The LORD will keep you' (Ps 121). Used of guarding the garden (Gen 2:15) and keeping the commandments. Active care, not passive observation.",
    english: ["keep", "guard", "watch", "observe"],
    examples: [
      { ref: "Psalm 121:7-8" },
      { ref: "Numbers 6:24" },
    ],
  },
  {
    number: "H8085",
    language: "hebrew",
    translit: "shema",
    original: "שָׁמַע",
    gloss: "to hear; to listen and obey",
    usage:
      "Hebrew hearing is never bare audition. 'Hear, O Israel' (Deut 6:4) calls for listening that issues in loving action. To shema is to incline the heart.",
    english: ["hear", "listen", "obey"],
    examples: [
      { ref: "Deuteronomy 6:4-5" },
      { ref: "1 Samuel 3:9" },
    ],
  },
  {
    number: "H7521",
    language: "hebrew",
    translit: "ratson",
    original: "רָצוֹן",
    gloss: "favour, acceptance, good pleasure",
    usage:
      "God's favour - the smile of heaven. The year of the LORD's ratson (Isa 61:2) is the year of His grace, which Jesus claimed in Luke 4.",
    english: ["favour", "will", "pleasure", "acceptance"],
    examples: [
      { ref: "Isaiah 61:2" },
      { ref: "Psalm 30:5" },
    ],
  },
  {
    number: "H226",
    language: "hebrew",
    translit: "oth",
    original: "אוֹת",
    gloss: "sign, token, mark",
    usage:
      "The rainbow (Gen 9:13), circumcision (Gen 17:11), the sabbath (Ex 31:13) - all are 'oth' - covenant signs that point back to God.",
    english: ["sign", "token"],
    examples: [
      { ref: "Genesis 9:13" },
      { ref: "Exodus 31:13" },
    ],
  },
  {
    number: "H7218",
    language: "hebrew",
    translit: "rosh",
    original: "רֹאשׁ",
    gloss: "head, chief, beginning",
    usage:
      "From the same root as reshit. The head of a household, the chief of a tribe, the beginning of a month (Rosh Chodesh). Christ is the Rosh of the church.",
    english: ["head", "chief", "top", "first"],
    examples: [
      { ref: "Psalm 23:5" },
      { ref: "Psalm 118:22" },
    ],
  },
];

// Build flexible search index - by number, translit, English, or substring.
const norm = (s: string) =>
  s.toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "");

export function searchStrongs(query: string): StrongsEntry[] {
  const q = norm(query.trim());
  if (!q) return [];
  const exact: StrongsEntry[] = [];
  const partial: StrongsEntry[] = [];
  for (const e of RAW) {
    const hay = [
      e.number,
      e.translit,
      e.original,
      e.gloss,
      ...e.english,
    ]
      .map(norm)
      .join(" | ");
    if (e.number.toLowerCase() === q || norm(e.translit) === q) {
      exact.push(e);
    } else if (hay.includes(q)) {
      partial.push(e);
    }
  }
  return [...exact, ...partial].slice(0, 12);
}

export function getAllStrongs(): StrongsEntry[] {
  return RAW;
}
