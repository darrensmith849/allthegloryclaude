// Context for the reading: who is speaking in each book, who it was for,
// when, and what was going on - and where the same story is told in another
// book (the Gospels, Samuel-Kings and Chronicles, the psalms written about
// an event). A chronological plan reads these side by side, so it helps to
// know whose account you're in. Written for this site in plain words (no
// commentary is copied); where something is tradition rather than stated in
// the Bible, it says so. Shown in the journal next to the reading
// (src/components/study/reading-context.tsx).

import { bookId, BOOKS } from "@/lib/dashboard/bible-books";

export interface BookContext {
  who: string; // who's speaking / writing
  to: string; // who it was for
  when: string;
  about: string; // what's going on
  see?: { label: string; read: string }; // the history behind it, e.g. Acts 16 for Philippians
}

const KINGS = "Unnamed writers, working from the royal records";

export const BOOK_CONTEXT: Record<string, BookContext> = {
  Genesis: {
    who: "Moses, by long tradition - telling the story of the beginnings.",
    to: "Israel, newly freed from slavery in Egypt.",
    when: "Written after the Exodus. The events run from creation to Joseph's death in Egypt.",
    about: "How God made everything, how sin came in, the flood, and God's promise to Abraham and his family.",
  },
  Exodus: {
    who: "Moses, who led Israel out of Egypt.",
    to: "Israel in the wilderness.",
    when: "Israel's slavery in Egypt, the Exodus, and the year at Mount Sinai.",
    about: "God rescues his people, gives them his law at Sinai, and comes to live among them in the tabernacle.",
  },
  Leviticus: {
    who: "God speaking to Moses at Mount Sinai - instructions for the priests and the people.",
    to: "Israel, camped at Mount Sinai.",
    when: "About a month at Sinai, after the tabernacle was set up.",
    about: "How a holy God can live among his people - sacrifices, priests, clean and unclean, and the feasts.",
  },
  Numbers: {
    who: "Moses.",
    to: "Israel.",
    when: "Nearly 40 years in the wilderness, from Mount Sinai to the edge of the promised land.",
    about: "Israel is counted, refuses to go into the land, and wanders until a new generation is ready.",
  },
  Deuteronomy: {
    who: "Moses speaking - his last talks to Israel before he died.",
    to: "The new generation, about to cross the Jordan into the land.",
    when: "On the plains of Moab, at the end of the 40 years.",
    about: "Moses reminds them of all God has done and of his law, and calls them to love and obey God.",
  },
  Joshua: {
    who: "The story of Joshua, who led Israel after Moses.",
    to: "Israel.",
    when: "Right after Moses' death.",
    about: "Israel crosses the Jordan and settles in Canaan - God keeps his promise of the land.",
  },
  Judges: {
    who: "An unnamed writer looking back (tradition says Samuel).",
    to: "Israel.",
    when: "The centuries between Joshua and Israel's first king.",
    about:
      "A cycle repeats: Israel turns from God, enemies oppress them, they cry out, and God sends a judge to rescue them.",
  },
  Ruth: {
    who: "An unnamed writer.",
    to: "Israel.",
    when: "In the days of the judges.",
    about: "A widow from Moab stays loyal to Naomi and to Israel's God, and becomes King David's great-grandmother.",
  },
  "1 Samuel": {
    who: "Unnamed writers - Samuel's life is at the heart of it.",
    to: "Israel.",
    when: "From Samuel's birth to the death of Saul, Israel's first king.",
    about: "Israel asks for a king. Saul fails to obey God, and God chooses David, the shepherd boy.",
  },
  "2 Samuel": {
    who: "Unnamed writers.",
    to: "Israel.",
    when: "King David's 40-year reign.",
    about: "David becomes king, God promises him a kingdom that lasts for ever, then David's sin with Bathsheba and the trouble after it.",
  },
  "1 Kings": {
    who: `${KINGS}.`,
    to: "God's people, probably in exile in Babylon - explaining how it came to that.",
    when: "From King Solomon to the kingdom splitting in two, and the prophet Elijah.",
    about: "Solomon builds the temple. After him the kingdom splits: Israel in the north, Judah in the south.",
  },
  "2 Kings": {
    who: `${KINGS}.`,
    to: "God's people in exile.",
    when: "From Elijah and Elisha to the fall of Israel (to Assyria) and then of Judah and Jerusalem (to Babylon).",
    about: "Kings who turned away from God, prophets who warned them, and the exile.",
  },
  "1 Chronicles": {
    who: "An unnamed writer, often called the Chronicler (tradition says Ezra).",
    to: "The Jews back home after the exile in Babylon.",
    when: "Written after the return, looking back from Adam to King David.",
    about:
      "Retells David's story with the focus on worship and the temple, to remind the returned people who they are. Much of it is the same story as Samuel and Kings.",
  },
  "2 Chronicles": {
    who: "The same writer as 1 Chronicles.",
    to: "The Jews back home after the exile.",
    when: "From Solomon to the exile, ending with King Cyrus letting the people go home.",
    about: "The kings of Judah and the temple - and God's faithfulness to David's family. Much of it is the same story as Kings.",
  },
  Ezra: {
    who: "Ezra, a priest and teacher of God's law - partly in his own words.",
    to: "The Jews who came back from Babylon.",
    when: "About 538-458 BC: the first return, and later Ezra's own return.",
    about: "God's people come home, rebuild the temple, and Ezra calls them back to God's law.",
  },
  Nehemiah: {
    who: "Nehemiah, in his own words - he served the king of Persia.",
    to: "The Jews back in the land.",
    when: "About 445 BC, after Ezra.",
    about: "Jerusalem's walls are rebuilt in spite of opposition, and the people renew their promise to follow God.",
  },
  Esther: {
    who: "An unnamed writer.",
    to: "The Jews.",
    when: "In Persia, in the reign of King Xerxes - before Nehemiah.",
    about: "God isn't named once, yet he saves his people through Queen Esther. It's where the feast of Purim comes from.",
  },
  Job: {
    who: "An unnamed writer. Mostly Job and his friends speaking in turn - then God.",
    to: "Everyone who suffers.",
    when: "Job seems to have lived around the time of Abraham, which is why it's read early in the plan.",
    about: "Why do good people suffer? Job's friends get it wrong, and God answers Job out of the storm.",
  },
  Psalms: {
    who: "Many writers: David wrote about half; also Asaph, the sons of Korah, Solomon, Moses and others. The heading at the top of a psalm often says who, and when.",
    to: "God - these are songs and prayers, sung by Israel in worship.",
    when: "Over about 1,000 years, from Moses to after the exile.",
    about:
      "Praise, sorrow, trust and thanks - the prayer book of God's people. In this plan a psalm often sits beside the event it was written about.",
  },
  Proverbs: {
    who: "Mostly King Solomon; also \"the wise\", Agur (chapter 30) and King Lemuel (chapter 31).",
    to: "Young people - \"my son\" - and anyone who wants wisdom.",
    when: "Solomon's reign, with more collected later under King Hezekiah.",
    about: "Short sayings about living wisely before God. They're wise patterns for life rather than promises.",
  },
  Ecclesiastes: {
    who: "\"The Teacher\", son of David and king in Jerusalem - traditionally Solomon.",
    to: "Anyone searching for meaning.",
    when: "By tradition, late in Solomon's life.",
    about: "Life \"under the sun\" without God is meaningless - so fear God and keep his commandments.",
  },
  "Song of Solomon": {
    who: "A bride and her beloved speaking in turn, with friends - watch for \"he\" and \"she\" changing.",
    to: "Israel.",
    when: "Solomon's reign.",
    about: "A love poem celebrating love between husband and wife; many also read it as a picture of God's love for his people.",
  },
  Isaiah: {
    who: "The prophet Isaiah, speaking God's words.",
    to: "Judah and Jerusalem.",
    when: "About 740-680 BC, under kings Uzziah, Jotham, Ahaz and Hezekiah.",
    about: "Judgment for sin, but comfort and hope - a coming King, and the suffering Servant (Isaiah 53).",
    see: { label: "The history behind it", read: "2 Kings 18-20" },
  },
  Jeremiah: {
    who: "The prophet Jeremiah, often called \"the weeping prophet\".",
    to: "Judah and Jerusalem.",
    when: "About 627-580 BC - the last 40 years before Jerusalem fell to Babylon, and just after.",
    about: "Warnings to turn back to God, the fall of Jerusalem, and the promise of a new covenant.",
    see: { label: "The history behind it", read: "2 Kings 22-25" },
  },
  Lamentations: {
    who: "Traditionally the prophet Jeremiah.",
    to: "God, and the people.",
    when: "Just after Babylon destroyed Jerusalem in 586 BC.",
    about: "Five poems of grief over Jerusalem - with hope in the middle: his mercies are new every morning.",
    see: { label: "What happened", read: "2 Kings 25" },
  },
  Ezekiel: {
    who: "The prophet Ezekiel, a priest taken away to Babylon.",
    to: "The Jews already in exile in Babylon.",
    when: "About 593-571 BC - before and after Jerusalem fell.",
    about: "God's glory leaves the temple because of sin, but he promises new hearts, dry bones living again, and a new temple.",
    see: { label: "The history behind it", read: "2 Kings 24-25" },
  },
  Daniel: {
    who: "Daniel, a young man taken to Babylon. The second half is his visions.",
    to: "God's people in exile.",
    when: "About 605-536 BC, from Nebuchadnezzar of Babylon to Cyrus of Persia.",
    about: "Staying faithful to God in a foreign land - and God ruling over every kingdom.",
    see: { label: "The history behind it", read: "2 Kings 24-25" },
  },
  Hosea: {
    who: "The prophet Hosea.",
    to: "Israel, the northern kingdom.",
    when: "About 750-715 BC, before Assyria took Israel away.",
    about: "God tells Hosea to marry an unfaithful wife - a picture of Israel's unfaithfulness and God's faithful love.",
    see: { label: "The history behind it", read: "2 Kings 14-17" },
  },
  Joel: {
    who: "The prophet Joel.",
    to: "Judah.",
    when: "The date isn't certain.",
    about: "A plague of locusts becomes a warning of the day of the Lord - and a promise that God will pour out his Spirit (quoted by Peter in Acts 2).",
  },
  Amos: {
    who: "Amos, a shepherd from Judah sent to the north.",
    to: "Israel, the northern kingdom.",
    when: "About 760 BC, a rich time under King Jeroboam II.",
    about: "God condemns cruelty to the poor and empty religion: let justice roll on like a river.",
    see: { label: "The history behind it", read: "2 Kings 14" },
  },
  Obadiah: {
    who: "The prophet Obadiah.",
    to: "Edom - and comfort for Judah.",
    when: "Probably just after Jerusalem fell to Babylon.",
    about: "Judgment on Edom, Israel's relative, for cheering when Jerusalem fell.",
  },
  Jonah: {
    who: "The story of the prophet Jonah.",
    to: "Israel.",
    when: "About 780 BC, under King Jeroboam II (2 Kings 14:25).",
    about: "God sends Jonah to Nineveh, Israel's enemy. Jonah runs - and God shows mercy, even to enemies.",
    see: { label: "Jonah in the history", read: "2 Kings 14:23-27" },
  },
  Micah: {
    who: "The prophet Micah.",
    to: "Judah and Israel.",
    when: "About 735-700 BC, at the same time as Isaiah.",
    about: "Judgment and hope - a ruler will come from Bethlehem (Micah 5:2). Do justice, love mercy, walk humbly with your God.",
    see: { label: "The history behind it", read: "2 Kings 16-20" },
  },
  Nahum: {
    who: "The prophet Nahum.",
    to: "Nineveh - and comfort for Judah.",
    when: "Before Nineveh fell in 612 BC.",
    about: "About 100 years after Jonah, Nineveh has gone back to its cruelty, and God will judge it.",
  },
  Habakkuk: {
    who: "The prophet Habakkuk, asking God hard questions - then God answering.",
    to: "God, and then Judah.",
    when: "Shortly before Babylon invaded Judah.",
    about: "Why does God allow evil? Habakkuk ends in trust: the righteous will live by faith.",
  },
  Zephaniah: {
    who: "The prophet Zephaniah.",
    to: "Judah.",
    when: "In the days of King Josiah.",
    about: "The day of the Lord is coming - and God will rejoice over his people with singing.",
    see: { label: "The history behind it", read: "2 Kings 22-23" },
  },
  Haggai: {
    who: "The prophet Haggai.",
    to: "The Jews back from Babylon, and their leaders Zerubbabel and Joshua.",
    when: "520 BC.",
    about: "Stop putting your own houses first - finish rebuilding God's temple.",
    see: { label: "The history behind it", read: "Ezra 5-6" },
  },
  Zechariah: {
    who: "The prophet Zechariah.",
    to: "The Jews back from Babylon.",
    when: "From 520 BC, at the same time as Haggai.",
    about: "Visions to encourage the rebuilding, and the coming King riding on a donkey (Zechariah 9:9).",
    see: { label: "The history behind it", read: "Ezra 5-6" },
  },
  Malachi: {
    who: "The prophet Malachi - the last of the Old Testament prophets.",
    to: "The Jews back in the land.",
    when: "About 430 BC, around Nehemiah's time.",
    about: "The people have grown careless toward God. He promises a messenger to prepare the way - then 400 quiet years until John the Baptist.",
    see: { label: "The same time", read: "Nehemiah 13" },
  },
  Matthew: {
    who: "Matthew (also called Levi), a tax collector who became one of the twelve disciples - an eyewitness.",
    to: "Mainly Jewish readers.",
    when: "Written about AD 50-70, about Jesus' life on earth.",
    about: "Jesus is the promised King. Matthew often shows how he fulfils what the prophets said. Mark and Luke tell many of the same events.",
  },
  Mark: {
    who: "John Mark - early church writers say he wrote down Peter's preaching.",
    to: "Mainly readers who weren't Jewish, probably in Rome.",
    when: "Probably the first Gospel written, about AD 50-65.",
    about: "Short and fast-moving - Jesus the Servant, who came to give his life as a ransom for many.",
  },
  Luke: {
    who: "Luke, a doctor who travelled with Paul. He wasn't an eyewitness, but he carefully checked with those who were.",
    to: "Theophilus, and readers who weren't Jewish.",
    when: "About AD 60. The book of Acts is his part two.",
    about: "An orderly account of Jesus, the Saviour for everyone - the poor, women and outsiders.",
  },
  John: {
    who: "John, \"the disciple whom Jesus loved\", one of the twelve - an eyewitness.",
    to: "Everyone - \"so that you may believe that Jesus is the Christ, the Son of God\" (John 20:31).",
    when: "Probably the last Gospel written, about AD 85-95.",
    about: "Mostly events the other Gospels don't tell - Jesus' signs, his long talks and his \"I am\" sayings.",
  },
  Acts: {
    who: "Luke, part two of his Gospel. Where it says \"we\", Luke was there.",
    to: "Theophilus.",
    when: "About AD 30-62, from Jesus going up to heaven to Paul in Rome.",
    about: "The Holy Spirit comes, and the good news spreads from Jerusalem to the ends of the earth - first through Peter, then Paul.",
  },
  Romans: {
    who: "Paul.",
    to: "The church in Rome, which he hadn't visited yet.",
    when: "About AD 57, from Corinth.",
    about: "The fullest explanation of the gospel: all have sinned, and all who believe are made right with God by faith in Jesus.",
    see: { label: "Where Paul was", read: "Acts 20" },
  },
  "1 Corinthians": {
    who: "Paul.",
    to: "The church he started in Corinth, a busy Greek port city.",
    when: "About AD 55, from Ephesus.",
    about: "Answers to their problems and questions - divisions, sin, marriage, worship, gifts, love (chapter 13) and the resurrection (chapter 15).",
    see: { label: "How this church began", read: "Acts 18" },
  },
  "2 Corinthians": {
    who: "Paul.",
    to: "The church in Corinth.",
    when: "About AD 56.",
    about: "Paul opens his heart and defends his ministry - God's power is made perfect in weakness.",
    see: { label: "How this church began", read: "Acts 18" },
  },
  Galatians: {
    who: "Paul.",
    to: "The churches in Galatia, started on his first journey.",
    when: "About AD 48-55.",
    about: "Some were teaching that you must keep the Jewish law to be saved. Paul says no - we are saved by grace, through faith in Jesus.",
    see: { label: "How these churches began", read: "Acts 13-14" },
  },
  Ephesians: {
    who: "Paul, writing from prison.",
    to: "The church in Ephesus.",
    when: "About AD 60-62.",
    about: "All God has given us in Christ - and how to live it out together, at home and in the spiritual battle.",
    see: { label: "How this church began", read: "Acts 19" },
  },
  Philippians: {
    who: "Paul, with Timothy, writing from prison.",
    to: "The church in Philippi, the first church in Europe.",
    when: "About AD 61-62.",
    about: "A warm thank-you letter full of joy - rejoice in the Lord always - though Paul is in chains.",
    see: { label: "How this church began", read: "Acts 16" },
  },
  Colossians: {
    who: "Paul, writing from prison.",
    to: "The church in Colossae, which Paul hadn't visited.",
    when: "About AD 60-62, sent with Ephesians and Philemon.",
    about: "Jesus is over everything - so don't be drawn into other teachings.",
  },
  "1 Thessalonians": {
    who: "Paul, with Silas and Timothy.",
    to: "The young church in Thessalonica.",
    when: "About AD 51 - one of Paul's first letters.",
    about: "Keep going under pressure - and hope for believers who have died, because Jesus is coming back.",
    see: { label: "How this church began", read: "Acts 17" },
  },
  "2 Thessalonians": {
    who: "Paul, with Silas and Timothy.",
    to: "The church in Thessalonica.",
    when: "A few months after the first letter.",
    about: "Clearing up confusion about Jesus' return - keep working and doing good while you wait.",
    see: { label: "How this church began", read: "Acts 17" },
  },
  "1 Timothy": {
    who: "Paul, an older mentor.",
    to: "Timothy, his young co-worker, leading the church in Ephesus.",
    when: "About AD 62-64.",
    about: "How to lead a church - sound teaching, prayer, and choosing leaders.",
    see: { label: "Where Timothy joined Paul", read: "Acts 16" },
  },
  "2 Timothy": {
    who: "Paul, in prison in Rome near the end of his life - his last letter.",
    to: "Timothy.",
    when: "About AD 66-67.",
    about: "Paul hands on the work: preach the word. \"I have fought the good fight.\"",
    see: { label: "Where Timothy joined Paul", read: "Acts 16" },
  },
  Titus: {
    who: "Paul.",
    to: "Titus, leading the churches on the island of Crete.",
    when: "About AD 63.",
    about: "Appoint good leaders, and teach believers to live out the grace that saved them.",
  },
  Philemon: {
    who: "Paul, writing from prison.",
    to: "Philemon, a believer in Colossae.",
    when: "About AD 60-62.",
    about: "Paul asks Philemon to welcome back Onesimus, his runaway slave, as a dear brother.",
  },
  Hebrews: {
    who: "We don't know who wrote it.",
    to: "Jewish believers tempted to go back to the old ways.",
    when: "Before AD 70 - the temple sacrifices were still going on.",
    about: "Jesus is greater than angels, Moses and the priests, and his one sacrifice is enough. Hold on in faith (chapter 11).",
  },
  James: {
    who: "James, the brother of Jesus, leader of the church in Jerusalem.",
    to: "Jewish believers scattered abroad.",
    when: "Probably about AD 45-50 - one of the earliest letters.",
    about: "Faith that's real shows itself in what you do.",
  },
  "1 Peter": {
    who: "Peter, one of the twelve disciples.",
    to: "Believers scattered across what is now Turkey, suffering for their faith.",
    when: "About AD 62-64, from Rome.",
    about: "Hope and holy living in suffering - you are God's chosen people.",
  },
  "2 Peter": {
    who: "Peter, near the end of his life.",
    to: "The same believers as his first letter.",
    when: "About AD 65-68.",
    about: "Grow in your faith, watch out for false teachers - Jesus will come back.",
  },
  "1 John": {
    who: "John, the disciple - \"what we have seen with our eyes\".",
    to: "Churches he cared for, probably around Ephesus.",
    when: "About AD 85-95.",
    about: "How to know you have eternal life - walk in the light, love one another, believe that Jesus came in the flesh.",
  },
  "2 John": {
    who: "John, \"the elder\".",
    to: "\"The chosen lady and her children\" - probably a church.",
    when: "About AD 85-95.",
    about: "Love one another, and don't welcome false teachers.",
  },
  "3 John": {
    who: "John, \"the elder\".",
    to: "His friend Gaius.",
    when: "About AD 85-95.",
    about: "Thanks for welcoming travelling teachers - and a warning about Diotrephes.",
  },
  Jude: {
    who: "Jude, brother of James (and of Jesus).",
    to: "Believers.",
    when: "About AD 65-80.",
    about: "Stand up for the faith against false teachers who twist God's grace.",
  },
  Revelation: {
    who: "Jesus revealing it to John, who writes down what he sees.",
    to: "Seven churches in what is now Turkey - and every church.",
    when: "About AD 95, while John was exiled on the island of Patmos.",
    about: "Visions of Jesus, the battle between good and evil, and God's final victory - a new heaven and a new earth.",
  },
};

// ── The same story, told in more than one place ─────────────────────
// Each line: a short name, then every place it's told. Ranges may run
// across chapters ("Mark 8:31-9:1").
const SAME_STORY: [string, ...string[]][] = [
  // The Gospels
  ["Jesus' family line (two different lists)", "Matthew 1:1-17", "Luke 3:23-38"],
  ["Jesus is born", "Matthew 1:18-25", "Luke 2:1-7"],
  ["John the Baptist prepares the way", "Matthew 3:1-12", "Mark 1:1-8", "Luke 3:1-18", "John 1:19-28"],
  ["Jesus is baptised", "Matthew 3:13-17", "Mark 1:9-11", "Luke 3:21-22", "John 1:29-34"],
  ["Jesus is tempted in the wilderness", "Matthew 4:1-11", "Mark 1:12-13", "Luke 4:1-13"],
  ["Jesus begins preaching in Galilee", "Matthew 4:12-17", "Mark 1:14-15", "Luke 4:14-15"],
  ["Jesus calls the first disciples", "Matthew 4:18-22", "Mark 1:16-20", "Luke 5:1-11"],
  ["An evil spirit driven out in the synagogue", "Mark 1:21-28", "Luke 4:31-37"],
  ["Peter's mother-in-law and many others healed", "Matthew 8:14-17", "Mark 1:29-34", "Luke 4:38-41"],
  ["Jesus preaches throughout Galilee", "Matthew 4:23-25", "Mark 1:35-39", "Luke 4:42-44"],
  ["A man with leprosy is healed", "Matthew 8:1-4", "Mark 1:40-45", "Luke 5:12-16"],
  ["A paralysed man is lowered through the roof", "Matthew 9:1-8", "Mark 2:1-12", "Luke 5:17-26"],
  ["Jesus calls Matthew (Levi)", "Matthew 9:9-13", "Mark 2:13-17", "Luke 5:27-32"],
  ["A question about fasting", "Matthew 9:14-17", "Mark 2:18-22", "Luke 5:33-39"],
  ["Lord of the Sabbath - picking grain", "Matthew 12:1-8", "Mark 2:23-28", "Luke 6:1-5"],
  ["A man with a shrivelled hand", "Matthew 12:9-14", "Mark 3:1-6", "Luke 6:6-11"],
  ["Crowds follow Jesus by the lake", "Matthew 12:15-21", "Mark 3:7-12", "Luke 6:17-19"],
  ["Jesus chooses the twelve", "Matthew 10:1-4", "Mark 3:13-19", "Luke 6:12-16"],
  ["The blessings (Beatitudes)", "Matthew 5:1-12", "Luke 6:20-26"],
  ["Salt", "Matthew 5:13", "Mark 9:50", "Luke 14:34-35"],
  ["A lamp on a stand", "Matthew 5:14-16", "Mark 4:21-23", "Luke 8:16-18"],
  ["Love your enemies", "Matthew 5:38-48", "Luke 6:27-36"],
  ["The Lord's Prayer", "Matthew 6:9-13", "Luke 11:2-4"],
  ["Treasure in heaven", "Matthew 6:19-21", "Luke 12:33-34"],
  ["The eye is the lamp of the body", "Matthew 6:22-23", "Luke 11:34-36"],
  ["Do not worry", "Matthew 6:25-34", "Luke 12:22-31"],
  ["Do not judge", "Matthew 7:1-5", "Luke 6:37-42"],
  ["Ask, seek, knock", "Matthew 7:7-11", "Luke 11:9-13"],
  ["The narrow door", "Matthew 7:13-14", "Luke 13:23-24"],
  ["A tree and its fruit", "Matthew 7:15-20", "Luke 6:43-45"],
  ["The wise and foolish builders", "Matthew 7:24-27", "Luke 6:46-49"],
  ["The centurion's faith", "Matthew 8:5-13", "Luke 7:1-10"],
  ["The cost of following Jesus", "Matthew 8:18-22", "Luke 9:57-62"],
  ["Jesus calms the storm", "Matthew 8:23-27", "Mark 4:35-41", "Luke 8:22-25"],
  ["Demons sent into the pigs", "Matthew 8:28-34", "Mark 5:1-20", "Luke 8:26-39"],
  ["Jairus' daughter, and the woman who touched his cloak", "Matthew 9:18-26", "Mark 5:21-43", "Luke 8:40-56"],
  ["Jesus sends out the twelve", "Matthew 10:5-15", "Mark 6:7-13", "Luke 9:1-6"],
  ["Who to fear", "Matthew 10:26-33", "Luke 12:2-9"],
  ["Not peace, but division", "Matthew 10:34-36", "Luke 12:51-53"],
  ["John the Baptist's question from prison", "Matthew 11:2-19", "Luke 7:18-35"],
  ["Woe to the towns that didn't repent", "Matthew 11:20-24", "Luke 10:13-15"],
  ["Revealed to little children", "Matthew 11:25-27", "Luke 10:21-22"],
  ["\"By Beelzebul\" - a house divided", "Matthew 12:22-30", "Mark 3:20-27", "Luke 11:14-23"],
  ["Blasphemy against the Holy Spirit", "Matthew 12:31-32", "Mark 3:28-30", "Luke 12:10"],
  ["The sign of Jonah", "Matthew 12:38-42", "Luke 11:29-32"],
  ["The unclean spirit that returns", "Matthew 12:43-45", "Luke 11:24-26"],
  ["Jesus' mother and brothers", "Matthew 12:46-50", "Mark 3:31-35", "Luke 8:19-21"],
  ["The parable of the sower", "Matthew 13:1-23", "Mark 4:1-20", "Luke 8:4-15"],
  ["The mustard seed", "Matthew 13:31-32", "Mark 4:30-32", "Luke 13:18-19"],
  ["The yeast", "Matthew 13:33", "Luke 13:20-21"],
  ["Rejected in his home town, Nazareth", "Matthew 13:53-58", "Mark 6:1-6", "Luke 4:16-30"],
  ["John the Baptist is killed", "Matthew 14:1-12", "Mark 6:14-29", "Luke 9:7-9"],
  ["Jesus feeds the five thousand", "Matthew 14:13-21", "Mark 6:30-44", "Luke 9:10-17", "John 6:1-14"],
  ["Jesus walks on the water", "Matthew 14:22-33", "Mark 6:45-52", "John 6:16-21"],
  ["Healing the sick in Gennesaret", "Matthew 14:34-36", "Mark 6:53-56"],
  ["Clean and unclean", "Matthew 15:1-20", "Mark 7:1-23"],
  ["A Gentile woman's faith", "Matthew 15:21-28", "Mark 7:24-30"],
  ["Jesus feeds the four thousand", "Matthew 15:32-39", "Mark 8:1-10"],
  ["The leaders demand a sign", "Matthew 16:1-4", "Mark 8:11-13"],
  ["The yeast of the Pharisees", "Matthew 16:5-12", "Mark 8:14-21"],
  ["Peter says Jesus is the Christ", "Matthew 16:13-20", "Mark 8:27-30", "Luke 9:18-21"],
  ["Jesus first tells of his death", "Matthew 16:21-28", "Mark 8:31-9:1", "Luke 9:22-27"],
  ["The transfiguration", "Matthew 17:1-13", "Mark 9:2-13", "Luke 9:28-36"],
  ["A boy with an evil spirit", "Matthew 17:14-20", "Mark 9:14-29", "Luke 9:37-43"],
  ["Jesus tells of his death again", "Matthew 17:22-23", "Mark 9:30-32", "Luke 9:43-45"],
  ["Who is the greatest?", "Matthew 18:1-5", "Mark 9:33-37", "Luke 9:46-48"],
  ["Whoever is not against us", "Mark 9:38-41", "Luke 9:49-50"],
  ["Causing others to stumble", "Matthew 18:6-9", "Mark 9:42-48", "Luke 17:1-2"],
  ["The lost sheep", "Matthew 18:12-14", "Luke 15:3-7"],
  ["Forgive again and again", "Matthew 18:21-22", "Luke 17:3-4"],
  ["Teaching about divorce", "Matthew 19:1-12", "Mark 10:1-12"],
  ["Jesus blesses the children", "Matthew 19:13-15", "Mark 10:13-16", "Luke 18:15-17"],
  ["The rich young man", "Matthew 19:16-30", "Mark 10:17-31", "Luke 18:18-30"],
  ["Jesus tells of his death a third time", "Matthew 20:17-19", "Mark 10:32-34", "Luke 18:31-34"],
  ["James and John ask for the best seats", "Matthew 20:20-28", "Mark 10:35-45"],
  ["Blind Bartimaeus at Jericho", "Matthew 20:29-34", "Mark 10:46-52", "Luke 18:35-43"],
  ["Jesus rides into Jerusalem", "Matthew 21:1-11", "Mark 11:1-11", "Luke 19:28-40", "John 12:12-19"],
  ["Jesus clears the temple", "Matthew 21:12-17", "Mark 11:15-19", "Luke 19:45-48"],
  ["The fig tree", "Matthew 21:18-22", "Mark 11:12-14"],
  ["\"By what authority?\"", "Matthew 21:23-27", "Mark 11:27-33", "Luke 20:1-8"],
  ["The parable of the tenants", "Matthew 21:33-46", "Mark 12:1-12", "Luke 20:9-19"],
  ["Paying taxes to Caesar", "Matthew 22:15-22", "Mark 12:13-17", "Luke 20:20-26"],
  ["Marriage at the resurrection", "Matthew 22:23-33", "Mark 12:18-27", "Luke 20:27-40"],
  ["The greatest commandment", "Matthew 22:34-40", "Mark 12:28-34", "Luke 10:25-28"],
  ["Whose son is the Christ?", "Matthew 22:41-46", "Mark 12:35-37", "Luke 20:41-44"],
  ["A warning about the teachers of the law", "Matthew 23:1-12", "Mark 12:38-40", "Luke 20:45-47"],
  ["Woe to the Pharisees", "Matthew 23:13-36", "Luke 11:37-54"],
  ["Jesus grieves over Jerusalem", "Matthew 23:37-39", "Luke 13:34-35"],
  ["The widow's offering", "Mark 12:41-44", "Luke 21:1-4"],
  ["Signs of the end of the age", "Matthew 24:1-35", "Mark 13:1-31", "Luke 21:5-33"],
  ["As in the days of Noah", "Matthew 24:37-41", "Luke 17:26-35"],
  ["The faithful servant", "Matthew 24:45-51", "Luke 12:41-48"],
  ["The plot to kill Jesus", "Matthew 26:1-5", "Mark 14:1-2", "Luke 22:1-2"],
  ["Jesus anointed at Bethany", "Matthew 26:6-13", "Mark 14:3-9", "John 12:1-8"],
  ["Judas agrees to betray Jesus", "Matthew 26:14-16", "Mark 14:10-11", "Luke 22:3-6"],
  ["Getting the Passover ready", "Matthew 26:17-19", "Mark 14:12-16", "Luke 22:7-13"],
  ["The Last Supper", "Matthew 26:20-29", "Mark 14:17-25", "Luke 22:14-23", "John 13:21-30", "1 Corinthians 11:23-26"],
  ["Jesus says Peter will deny him", "Matthew 26:31-35", "Mark 14:27-31", "Luke 22:31-34", "John 13:36-38"],
  ["Jesus prays in Gethsemane", "Matthew 26:36-46", "Mark 14:32-42", "Luke 22:39-46"],
  ["Jesus is arrested", "Matthew 26:47-56", "Mark 14:43-52", "Luke 22:47-53", "John 18:1-11"],
  ["Jesus before the high priest", "Matthew 26:57-68", "Mark 14:53-65", "Luke 22:63-71", "John 18:19-24"],
  ["Peter denies Jesus", "Matthew 26:69-75", "Mark 14:66-72", "Luke 22:54-62", "John 18:15-27"],
  ["Judas dies", "Matthew 27:3-10", "Acts 1:18-19"],
  ["Jesus before Pilate", "Matthew 27:11-14", "Mark 15:2-5", "Luke 23:1-5", "John 18:28-38"],
  ["Barabbas, and Jesus sentenced to die", "Matthew 27:15-26", "Mark 15:6-15", "Luke 23:13-25", "John 18:39-19:16"],
  ["The soldiers mock Jesus", "Matthew 27:27-31", "Mark 15:16-20", "John 19:1-3"],
  ["The crucifixion", "Matthew 27:32-44", "Mark 15:21-32", "Luke 23:26-43", "John 19:17-27"],
  ["Jesus dies", "Matthew 27:45-56", "Mark 15:33-41", "Luke 23:44-49", "John 19:28-37"],
  ["Jesus is buried", "Matthew 27:57-61", "Mark 15:42-47", "Luke 23:50-56", "John 19:38-42"],
  ["The empty tomb - he is risen", "Matthew 28:1-10", "Mark 16:1-8", "Luke 24:1-12", "John 20:1-10"],
  ["Jesus appears to the disciples", "Luke 24:36-43", "John 20:19-23"],
  ["Jesus goes up to heaven", "Luke 24:50-53", "Acts 1:9-11"],
  ["Paul meets Jesus on the Damascus road", "Acts 9:1-19", "Acts 22:3-16", "Acts 26:9-18", "Galatians 1:13-17"],

  // Samuel and Kings - Chronicles (and the prophets who lived it)
  ["Saul dies", "1 Samuel 31:1-13", "1 Chronicles 10:1-14"],
  ["David is made king over all Israel", "2 Samuel 5:1-5", "1 Chronicles 11:1-3"],
  ["David takes Jerusalem", "2 Samuel 5:6-10", "1 Chronicles 11:4-9"],
  ["David's house and family in Jerusalem", "2 Samuel 5:11-16", "1 Chronicles 14:1-7"],
  ["David defeats the Philistines", "2 Samuel 5:17-25", "1 Chronicles 14:8-17"],
  ["The ark, and Uzzah", "2 Samuel 6:1-11", "1 Chronicles 13:1-14"],
  ["The ark comes to Jerusalem", "2 Samuel 6:12-23", "1 Chronicles 15:25-16:3"],
  ["David's song of thanks for the ark", "1 Chronicles 16:8-36", "Psalm 105:1-15", "Psalm 96:1-13"],
  ["God's promise to David", "2 Samuel 7:1-17", "1 Chronicles 17:1-15"],
  ["David's prayer", "2 Samuel 7:18-29", "1 Chronicles 17:16-27"],
  ["David's victories", "2 Samuel 8:1-18", "1 Chronicles 18:1-17"],
  ["War with the Ammonites", "2 Samuel 10:1-19", "1 Chronicles 19:1-19"],
  ["Rabbah is captured", "2 Samuel 12:26-31", "1 Chronicles 20:1-3"],
  ["David's mighty men", "2 Samuel 23:8-39", "1 Chronicles 11:10-47"],
  ["David counts the people", "2 Samuel 24:1-25", "1 Chronicles 21:1-30"],
  ["David's song of deliverance", "2 Samuel 22:1-51", "Psalm 18:1-50"],
  ["Solomon asks for wisdom", "1 Kings 3:4-15", "2 Chronicles 1:2-13"],
  ["Getting ready to build the temple", "1 Kings 5:1-18", "2 Chronicles 2:1-18"],
  ["Solomon builds the temple", "1 Kings 6:1-38", "2 Chronicles 3:1-17"],
  ["The ark is brought into the temple", "1 Kings 8:1-11", "2 Chronicles 5:2-14"],
  ["Solomon's prayer at the temple", "1 Kings 8:22-53", "2 Chronicles 6:12-42"],
  ["God answers Solomon", "1 Kings 9:1-9", "2 Chronicles 7:11-22"],
  ["The queen of Sheba visits", "1 Kings 10:1-13", "2 Chronicles 9:1-12"],
  ["Solomon dies", "1 Kings 11:41-43", "2 Chronicles 9:29-31"],
  ["The kingdom splits in two", "1 Kings 12:1-24", "2 Chronicles 10:1-11:4"],
  ["Shishak of Egypt attacks Jerusalem", "1 Kings 14:25-28", "2 Chronicles 12:1-12"],
  ["King Abijah", "1 Kings 15:1-8", "2 Chronicles 13:1-22"],
  ["King Asa", "1 Kings 15:9-24", "2 Chronicles 14:1-16:14"],
  ["Micaiah warns Ahab and Jehoshaphat", "1 Kings 22:1-40", "2 Chronicles 18:1-34"],
  ["The end of Jehoshaphat's reign", "1 Kings 22:41-50", "2 Chronicles 20:31-21:1"],
  ["King Jehoram of Judah", "2 Kings 8:16-24", "2 Chronicles 21:4-20"],
  ["King Ahaziah of Judah", "2 Kings 8:25-29", "2 Chronicles 22:1-6"],
  ["Athaliah, and young King Joash", "2 Kings 11:1-21", "2 Chronicles 22:10-23:21"],
  ["Joash repairs the temple", "2 Kings 12:1-21", "2 Chronicles 24:1-27"],
  ["King Amaziah", "2 Kings 14:1-22", "2 Chronicles 25:1-28"],
  ["King Uzziah (Azariah)", "2 Kings 15:1-7", "2 Chronicles 26:1-23"],
  ["King Jotham", "2 Kings 15:32-38", "2 Chronicles 27:1-9"],
  ["King Ahaz", "2 Kings 16:1-20", "2 Chronicles 28:1-27"],
  ["Sennacherib threatens Jerusalem", "2 Kings 18:13-19:37", "2 Chronicles 32:1-23", "Isaiah 36:1-37:38"],
  ["Hezekiah is ill and recovers", "2 Kings 20:1-11", "2 Chronicles 32:24-26", "Isaiah 38:1-8"],
  ["Envoys from Babylon", "2 Kings 20:12-21", "Isaiah 39:1-8"],
  ["King Manasseh", "2 Kings 21:1-18", "2 Chronicles 33:1-20"],
  ["King Amon", "2 Kings 21:19-26", "2 Chronicles 33:21-25"],
  ["King Josiah and the Book of the Law", "2 Kings 22:1-23:30", "2 Chronicles 34:1-35:27"],
  ["Kings Jehoahaz and Jehoiakim", "2 Kings 23:31-24:7", "2 Chronicles 36:1-8"],
  ["King Jehoiachin taken to Babylon", "2 Kings 24:8-17", "2 Chronicles 36:9-10"],
  ["Jerusalem falls to Babylon", "2 Kings 25:1-21", "2 Chronicles 36:11-21", "Jeremiah 39:1-10", "Jeremiah 52:1-30"],
  ["Cyrus lets the people go home", "2 Chronicles 36:22-23", "Ezra 1:1-4"],
  ["The Ten Commandments", "Exodus 20:1-17", "Deuteronomy 5:6-21"],

  // Psalms written about an event (the psalm's own heading says so)
  ["David runs from his son Absalom (Psalm 3)", "Psalm 3:1-8", "2 Samuel 15:13-31"],
  ["David pretends to be mad in Gath (Psalms 34 and 56)", "Psalm 34:1-22", "Psalm 56:1-13", "1 Samuel 21:10-15"],
  ["David's sin with Bathsheba (Psalm 51)", "Psalm 51:1-19", "2 Samuel 12:1-14"],
  ["Doeg the Edomite (Psalm 52)", "Psalm 52:1-9", "1 Samuel 22:6-23"],
  ["The Ziphites betray David (Psalm 54)", "Psalm 54:1-7", "1 Samuel 23:19-29"],
  ["Hiding in the cave (Psalms 57 and 142)", "Psalm 57:1-11", "Psalm 142:1-7", "1 Samuel 22:1-2", "1 Samuel 24:1-7"],
  ["Saul's men watch David's house (Psalm 59)", "Psalm 59:1-17", "1 Samuel 19:11-17"],
  ["Victory over Edom (Psalm 60)", "Psalm 60:1-12", "2 Samuel 8:13-14", "1 Chronicles 18:12-13"],
  ["Two almost identical psalms", "Psalm 14:1-7", "Psalm 53:1-6"],
  ["\"Hurry, O God, to save me\"", "Psalm 40:13-17", "Psalm 70:1-5"],
];

// ── Matching a reading to its context ───────────────────────────────

export interface Ref {
  book: number; // 1-66
  from: [number, number]; // chapter, verse
  to: [number, number];
  label: string; // "Mark 8:31-9:1"
  read: string; // what to open in the reader - "Mark 8:31-38" or "Mark 8-9"
}

const ALL = 999;

// "Luke 5", "Job 1-2", "Luke 5:17-26", "Mark 8:31-9:1", "Psalm 51".
export function parseRange(input: string): Ref | null {
  const m = input
    .trim()
    .replace(/\s*[-–]\s*/g, "-")
    .match(/^((?:[1-3]\s*)?[A-Za-z][A-Za-z .]*?)\s*(\d{1,3})(?::(\d{1,3}))?(?:-(\d{1,3})(?::(\d{1,3}))?)?$/);
  if (!m) return null;
  const book = bookId(m[1]);
  if (!book) return null;
  const c1 = Number(m[2]);
  const v1 = m[3] ? Number(m[3]) : 1;
  let c2 = c1;
  let v2 = ALL;
  if (m[4] && m[5]) {
    c2 = Number(m[4]);
    v2 = Number(m[5]);
  } else if (m[4]) {
    if (m[3]) v2 = Number(m[4]); // 5:17-26
    else c2 = Number(m[4]); // 1-2 (chapters)
  } else if (m[3]) v2 = v1; // a single verse
  const name = BOOKS[book - 1] === "Psalms" ? "Psalm" : BOOKS[book - 1];
  const label =
    c1 === c2
      ? v2 === ALL && v1 === 1
        ? `${name} ${c1}`
        : `${name} ${c1}:${v1}${v2 !== v1 ? `-${v2}` : ""}`
      : v2 === ALL && v1 === 1
        ? `${name} ${c1}-${c2}`
        : `${name} ${c1}:${v1}-${c2}:${v2}`;
  const read = c1 === c2 ? label : `${name} ${c1}-${c2}`;
  return { book, from: [c1, v1], to: [c2, v2], label, read };
}

const before = (a: [number, number], b: [number, number]) => a[0] < b[0] || (a[0] === b[0] && a[1] < b[1]);
const overlaps = (a: Ref, b: Ref) => a.book === b.book && !before(a.to, b.from) && !before(b.to, a.from);

const STORIES = SAME_STORY.map(([title, ...refs]) => ({
  title,
  refs: refs.map((r) => parseRange(r)).filter((r): r is Ref => Boolean(r)),
}));

export interface SameStory {
  title: string;
  here: Ref[]; // the places it's told in what's being read
  others: Ref[]; // the other places
}

export interface ReadingContext {
  books: { name: string; context: BookContext }[];
  same: SameStory[];
}

// The context for a day's passages: each book once, and every story they
// tell that's also told somewhere else.
export function readingContext(passages: string[]): ReadingContext {
  const reading = passages.map((p) => parseRange(p)).filter((r): r is Ref => Boolean(r));
  const names = [...new Set(reading.map((r) => BOOKS[r.book - 1] as string))];
  const books = names.filter((n) => BOOK_CONTEXT[n]).map((name) => ({ name, context: BOOK_CONTEXT[name] }));
  const same: SameStory[] = [];
  for (const s of STORIES) {
    const here = s.refs.filter((ref) => reading.some((r) => overlaps(r, ref)));
    if (here.length) same.push({ title: s.title, here, others: s.refs.filter((ref) => !here.includes(ref)) });
  }
  return { books, same };
}

// Every reference above, for checking against the Bible text.
export const ALL_REFS = SAME_STORY.flatMap(([, ...refs]) => refs).concat(
  Object.values(BOOK_CONTEXT).flatMap((c) => (c.see ? [c.see.read] : [])),
);
