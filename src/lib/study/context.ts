// Context for the reading: each book in brief, who is speaking in it, who it
// was for and when - and where the same story is told in another
// book (the Gospels, Samuel-Kings and Chronicles, the psalms written about
// an event). A chronological plan reads these side by side, so it helps to
// know whose account you're in. Written for this site in plain words (no
// commentary is copied); where something is tradition rather than stated in
// the Bible, it says so. Shown in the journal next to the reading
// (src/components/study/reading-context.tsx).

import { bookId, BOOKS } from "@/lib/dashboard/bible-books";

export interface BookContext {
  brief: string; // the whole book in a few sentences
  who: string; // who's speaking / writing
  to: string; // who it was for
  when: string;
  see?: { label: string; read: string }; // the history behind it, e.g. Acts 16 for Philippians
}

export const BOOK_CONTEXT: Record<string, BookContext> = {
  Genesis: {
    brief: "God creates the world and people. Sin comes in through Adam and Eve and spreads until the flood. Then God calls Abraham and promises to bless the whole world through his family, and the story follows Isaac, Jacob and Joseph, ending with Jacob's family living in Egypt.",
    who: "Moses, as Jewish and Christian tradition holds - Jesus spoke of the Law as Moses' writing (John 5:46).",
    to: "Israel, newly freed from slavery in Egypt.",
    when: "Written after the Exodus. The events run from creation to Joseph's death in Egypt.",
  },
  Exodus: {
    brief: "God hears Israel crying out as slaves in Egypt and sends Moses to lead them out - the plagues, the Passover and the crossing of the Red Sea. At Mount Sinai God makes his covenant with them and gives the Ten Commandments. It ends with the tabernacle built and God's glory filling it.",
    who: "Moses, who led Israel out of Egypt.",
    to: "Israel in the wilderness.",
    when: "Israel's slavery in Egypt, the Exodus, and the year at Mount Sinai.",
  },
  Leviticus: {
    brief: "God's instructions for worship: the offerings, the priests, clean and unclean, the Day of Atonement and the yearly feasts. It shows how sinful people can come near a holy God - \"be holy, because I am holy\".",
    who: "God speaking to Moses at Mount Sinai, for the priests and the people.",
    to: "Israel, camped at Mount Sinai.",
    when: "About a month at Sinai, after the tabernacle was set up.",
  },
  Numbers: {
    brief: "Israel is counted and sets out from Mount Sinai for the promised land. When the spies come back afraid, the people refuse to go in, so that generation wanders in the wilderness for 40 years. It ends with their children camped by the Jordan, ready to go in.",
    who: "Moses.",
    to: "Israel.",
    when: "Nearly 40 years in the wilderness, from Mount Sinai to the edge of the promised land.",
  },
  Deuteronomy: {
    brief: "Moses' farewell talks to Israel before they enter the land. He looks back on all God has done, goes over God's law again, and calls them to love the Lord with all their heart. It ends with Moses' death on Mount Nebo.",
    who: "Moses speaking - his last words to Israel.",
    to: "The new generation, about to cross the Jordan into the land.",
    when: "On the plains of Moab, at the end of the 40 years.",
  },
  Joshua: {
    brief: "Joshua leads Israel across the Jordan into Canaan. Jericho falls, the land is taken and shared out between the twelve tribes. Joshua ends by calling the people to choose whom they will serve - \"as for me and my house, we will serve the Lord\".",
    who: "The story of Joshua, who led Israel after Moses.",
    to: "Israel.",
    when: "Right after Moses' death.",
  },
  Judges: {
    brief: "After Joshua dies, Israel keeps turning away from God. Each time, enemies oppress them, they cry out, and God raises up a judge to rescue them - like Deborah, Gideon and Samson. Things get worse and worse, because everyone did what was right in their own eyes.",
    who: "An unnamed writer looking back (tradition says Samuel).",
    to: "Israel.",
    when: "The centuries between Joshua and Israel's first king.",
  },
  Ruth: {
    brief: "In the time of the judges, Naomi loses her husband and sons, and Ruth, her daughter-in-law from Moab, refuses to leave her. In Bethlehem, Boaz marries Ruth as her family redeemer - and their great-grandson is King David.",
    who: "An unnamed writer.",
    to: "Israel.",
    when: "In the days of the judges.",
  },
  "1 Samuel": {
    brief: "Samuel, the last judge, leads Israel. The people ask for a king, and God gives them Saul, who disobeys God. God chooses David, who defeats Goliath and then spends years running from a jealous Saul. It ends with Saul's death.",
    who: "Unnamed writers - Samuel's life is at the heart of it.",
    to: "Israel.",
    when: "From Samuel's birth to the death of Saul, Israel's first king.",
  },
  "2 Samuel": {
    brief: "David becomes king over all Israel, makes Jerusalem his capital and brings the ark there. God promises David a kingdom that will last forever. Then David sins with Bathsheba, and trouble follows in his family, including his son Absalom's rebellion.",
    who: "Unnamed writers.",
    to: "Israel.",
    when: "King David's 40-year reign.",
  },
  "1 Kings": {
    brief: "Solomon becomes king, asks God for wisdom and builds the temple. Later he turns to other gods, and after he dies the kingdom splits in two - Israel in the north, Judah in the south. The prophet Elijah stands against King Ahab and the prophets of Baal.",
    who: "Unnamed writers, working from the royal records.",
    to: "God's people, probably in exile in Babylon - explaining how it came to that.",
    when: "From King Solomon to the kingdom splitting in two, and the prophet Elijah.",
  },
  "2 Kings": {
    brief: "Elisha carries on after Elijah. Kings come and go in Israel and Judah, most of them turning from God in spite of the prophets' warnings. Israel falls to Assyria, then Judah and Jerusalem fall to Babylon, and the people are taken into exile.",
    who: "Unnamed writers, working from the royal records.",
    to: "God's people in exile.",
    when: "From Elijah and Elisha to the fall of Israel (to Assyria) and then of Judah and Jerusalem (to Babylon).",
  },
  "1 Chronicles": {
    brief: "It starts with family lists from Adam onwards, then retells King David's reign - especially David bringing the ark to Jerusalem and getting everything ready for the temple. Much of it is the same story as Samuel.",
    who: "An unnamed writer, often called the Chronicler (tradition says Ezra).",
    to: "The Jews back home after the exile in Babylon - reminding them who they are.",
    when: "Written after the return from exile, looking back from Adam to King David.",
  },
  "2 Chronicles": {
    brief: "It retells the story of Solomon and the kings of Judah, from building the temple to its destruction by Babylon. Kings who seek God are blessed. It ends with King Cyrus letting the people go home. Much of it is the same story as Kings.",
    who: "The same writer as 1 Chronicles.",
    to: "The Jews back home after the exile.",
    when: "From Solomon to the exile, ending with King Cyrus of Persia.",
  },
  Ezra: {
    brief: "King Cyrus of Persia lets the Jews go back to Jerusalem, and they rebuild the temple in spite of opposition. Years later, Ezra the priest arrives and calls the people back to God's law.",
    who: "Ezra, a priest and teacher of God's law - partly in his own words.",
    to: "The Jews who came back from Babylon.",
    when: "About 538-458 BC: the first return, and later Ezra's own return.",
  },
  Nehemiah: {
    brief: "Nehemiah, who served the king of Persia, hears that Jerusalem's walls are broken down. He goes back and leads the people to rebuild them in 52 days, in spite of opposition. Ezra reads God's law to the people, and they promise to follow it.",
    who: "Nehemiah, in his own words.",
    to: "The Jews back in the land.",
    when: "About 445 BC, after Ezra.",
  },
  Esther: {
    brief: "In Persia, a Jewish girl named Esther becomes queen. When Haman plots to destroy all the Jews, Esther risks her life to go to the king, and her people are saved. God isn't named once, but he is clearly at work. It's where the feast of Purim comes from.",
    who: "An unnamed writer.",
    to: "The Jews.",
    when: "In Persia, in the reign of King Xerxes - before Nehemiah.",
  },
  Job: {
    brief: "Job is a good man who loses his wealth, his children and his health. His friends insist he must have sinned, and Job pours out his questions to God. At the end God speaks to him out of the storm, and Job trusts him.",
    who: "An unnamed writer. Mostly Job and his friends speaking in turn - then God.",
    to: "Everyone who suffers.",
    when: "Job seems to have lived around the time of Abraham, which is why it's read early in the plan.",
  },
  Psalms: {
    brief: "150 songs and prayers Israel sang in worship - praise, thanks, sorrow, confession and trust, covering all of life. Many are quoted in the New Testament and point forward to Jesus. In this plan a psalm often sits beside the event it was written about.",
    who: "Many writers: David wrote about half; also Asaph, the sons of Korah, Solomon, Moses and others. The heading at the top of a psalm often says who, and when.",
    to: "God - these are songs and prayers, sung by Israel in worship.",
    when: "Over nearly 1,000 years, from Moses to after the exile.",
  },
  Proverbs: {
    brief: "Short, wise sayings about everyday life - work, money, words, friendship and family. It starts from the truth that the fear of the Lord is the beginning of wisdom. They're wise patterns for life rather than promises.",
    who: "Mostly King Solomon; also \"the wise\", Agur (chapter 30) and King Lemuel (chapter 31).",
    to: "Young people - \"my son\" - and anyone who wants wisdom.",
    when: "Solomon's reign, with more collected later under King Hezekiah.",
  },
  Ecclesiastes: {
    brief: "The Teacher looks for meaning in wisdom, pleasure, work and riches, and finds that life \"under the sun\" without God is meaningless. His conclusion: fear God and keep his commandments.",
    who: "\"The Teacher\", son of David and king in Jerusalem - traditionally Solomon.",
    to: "Anyone searching for meaning.",
    when: "By tradition, late in Solomon's life.",
  },
  "Song of Solomon": {
    brief: "A love poem between a bride and her beloved, celebrating love between husband and wife. Many also see in it a picture of God's love for his people.",
    who: "Traditionally Solomon. In the poem a bride and her beloved speak in turn, with friends - watch for \"he\" and \"she\" changing.",
    to: "Israel.",
    when: "Solomon's reign.",
  },
  Isaiah: {
    brief: "Isaiah warns Judah and the nations of God's judgment for sin, but brings great hope: a child to be born, a King from David's line, and the suffering Servant who carries our sins (chapter 53). It ends with new heavens and a new earth.",
    who: "The prophet Isaiah, speaking God's words.",
    to: "Judah and Jerusalem.",
    when: "About 740-680 BC, under kings Uzziah, Jotham, Ahaz and Hezekiah.",
    see: { label: "The history behind it", read: "2 Kings 18-20" },
  },
  Jeremiah: {
    brief: "For 40 years Jeremiah warns Judah to turn back to God before Babylon comes, and he is mocked and imprisoned for it. He sees Jerusalem fall - and brings God's promise of a new covenant, written on people's hearts.",
    who: "The prophet Jeremiah, often called \"the weeping prophet\".",
    to: "Judah and Jerusalem.",
    when: "About 627-580 BC - the last 40 years before Jerusalem fell to Babylon, and just after.",
    see: { label: "The history behind it", read: "2 Kings 22-25" },
  },
  Lamentations: {
    brief: "Five poems of grief over the destruction of Jerusalem. In the middle comes hope: the Lord's mercies never end - they are new every morning.",
    who: "Traditionally the prophet Jeremiah.",
    to: "God, and the people.",
    when: "Just after Babylon destroyed Jerusalem in 586 BC.",
    see: { label: "What happened", read: "2 Kings 25" },
  },
  Ezekiel: {
    brief: "Ezekiel, a priest in exile in Babylon, sees visions of God's glory. He warns that Jerusalem will fall because of sin; after it falls, he brings hope - new hearts, a valley of dry bones coming to life, and a new temple.",
    who: "The prophet Ezekiel, a priest taken away to Babylon.",
    to: "The Jews already in exile in Babylon.",
    when: "About 593-571 BC - before and after Jerusalem fell.",
    see: { label: "The history behind it", read: "2 Kings 24-25" },
  },
  Daniel: {
    brief: "Daniel and his friends stay faithful to God in Babylon - the fiery furnace, the writing on the wall, the lions' den. The second half is Daniel's visions of kingdoms rising and falling, and of God's kingdom that will never end.",
    who: "Daniel, a young man taken to Babylon. The second half is his visions.",
    to: "God's people in exile.",
    when: "About 605-536 BC, from Nebuchadnezzar of Babylon to Cyrus of Persia.",
    see: { label: "The history behind it", read: "2 Kings 24-25" },
  },
  Hosea: {
    brief: "God tells Hosea to marry Gomer, who is unfaithful to him, and to take her back. Their marriage is a picture of Israel's unfaithfulness to God - and of God's faithful love that keeps calling them home.",
    who: "The prophet Hosea.",
    to: "Israel, the northern kingdom.",
    when: "About 750-715 BC, before Assyria took Israel away.",
    see: { label: "The history behind it", read: "2 Kings 14-17" },
  },
  Joel: {
    brief: "A huge plague of locusts strips the land, and Joel calls the people to return to God with all their hearts. He speaks of the coming day of the Lord, and of God pouring out his Spirit on all people (quoted by Peter in Acts 2).",
    who: "The prophet Joel.",
    to: "Judah.",
    when: "The date isn't certain.",
  },
  Amos: {
    brief: "Amos, a shepherd, is sent to Israel at a time of wealth. He speaks against their cruelty to the poor and their empty worship, and warns of judgment - ending with a promise to restore David's fallen house.",
    who: "Amos, a shepherd from Judah sent to the north.",
    to: "Israel, the northern kingdom.",
    when: "About 760 BC, a rich time under King Jeroboam II.",
    see: { label: "The history behind it", read: "2 Kings 14" },
  },
  Obadiah: {
    brief: "The shortest book in the Old Testament. It announces judgment on Edom, Israel's relative, for gloating over Jerusalem's fall and helping its enemies, and promises that the kingdom will be the Lord's.",
    who: "The prophet Obadiah.",
    to: "Edom - and comfort for Judah.",
    when: "The date isn't certain - many think just after Jerusalem fell to Babylon.",
  },
  Jonah: {
    brief: "God sends Jonah to preach to Nineveh, Israel's enemy. Jonah runs away, is swallowed by a great fish, and finally goes. Nineveh turns to God and is spared - and when Jonah is angry, God shows him his compassion.",
    who: "The story of the prophet Jonah.",
    to: "Israel.",
    when: "In the time of King Jeroboam II, about 790-750 BC (2 Kings 14:25).",
    see: { label: "Jonah in the history", read: "2 Kings 14:23-27" },
  },
  Micah: {
    brief: "Micah speaks against the leaders of Israel and Judah for their injustice and false religion. He also brings hope: a ruler will come from Bethlehem (Micah 5:2). God asks us to do justice, love mercy and walk humbly with him.",
    who: "The prophet Micah.",
    to: "Judah and Israel.",
    when: "About 735-700 BC, at the same time as Isaiah.",
    see: { label: "The history behind it", read: "2 Kings 16-20" },
  },
  Nahum: {
    brief: "Nahum announces that Nineveh, the cruel capital of Assyria, will fall. More than 100 years after Jonah, it had gone back to its evil ways. For Judah it's comfort: the Lord is good, a refuge in times of trouble.",
    who: "The prophet Nahum.",
    to: "Nineveh - and comfort for Judah.",
    when: "Before Nineveh fell in 612 BC.",
  },
  Habakkuk: {
    brief: "Habakkuk asks God why he lets evil go on, and God says he will use Babylon to judge Judah. Habakkuk asks again, God answers, and the book ends in trust: even if everything fails, I will rejoice in the Lord.",
    who: "The prophet Habakkuk, asking God hard questions - then God answering.",
    to: "God, and then Judah.",
    when: "Shortly before Babylon invaded Judah.",
  },
  Zephaniah: {
    brief: "Zephaniah warns that the day of the Lord is coming on Judah and the nations, and calls the people to seek the Lord. It ends with God rejoicing over his people with singing.",
    who: "The prophet Zephaniah.",
    to: "Judah.",
    when: "In the days of King Josiah.",
    see: { label: "The history behind it", read: "2 Kings 22-23" },
  },
  Haggai: {
    brief: "The Jews back from Babylon have stopped rebuilding the temple and are busy with their own houses. Haggai stirs them to finish God's house, and promises its glory will be greater than before.",
    who: "The prophet Haggai.",
    to: "The Jews back from Babylon, and their leaders Zerubbabel and Joshua.",
    when: "520 BC.",
    see: { label: "The history behind it", read: "Ezra 5-6" },
  },
  Zechariah: {
    brief: "Zechariah encourages the returned Jews with visions to finish the temple. He also looks ahead to the coming King, humble and riding on a donkey (Zechariah 9:9), and to the day the Lord will be king over all the earth.",
    who: "The prophet Zechariah.",
    to: "The Jews back from Babylon.",
    when: "From 520 BC, at the same time as Haggai.",
    see: { label: "The history behind it", read: "Ezra 5-6" },
  },
  Malachi: {
    brief: "The people have grown careless toward God - in their offerings, their marriages and their giving. God says \"I have loved you\", calls them back, and promises to send a messenger to prepare his way. Then 400 quiet years until John the Baptist.",
    who: "The prophet Malachi - the last of the Old Testament prophets.",
    to: "The Jews back in the land.",
    when: "About 430 BC, around Nehemiah's time.",
    see: { label: "The same time", read: "Nehemiah 13" },
  },
  Matthew: {
    brief: "Matthew shows that Jesus is the promised Messiah and King - from his family line and birth to his death and resurrection - and often shows how he fulfils what the prophets said. It includes the Sermon on the Mount and many parables, and ends with the Great Commission to make disciples of all nations.",
    who: "Matthew (also called Levi), a tax collector who became one of the twelve disciples - an eyewitness.",
    to: "Mainly Jewish readers.",
    when: "Written about AD 50-70, about Jesus' life on earth.",
  },
  Mark: {
    brief: "The shortest Gospel, moving quickly from one event to the next. It shows Jesus as the Servant who heals, teaches and drives out demons, and gives the most space to his last week - his death and resurrection.",
    who: "John Mark - early church writers say he wrote down Peter's preaching.",
    to: "Mainly readers who weren't Jewish, probably in Rome.",
    when: "Probably the first Gospel written, about AD 50-65.",
  },
  Luke: {
    brief: "A careful, orderly account of Jesus' life, from the births of John the Baptist and Jesus to the resurrection and Jesus going up to heaven. Luke shows Jesus' care for the poor, women and outsiders, and has parables like the good Samaritan and the prodigal son.",
    who: "Luke, a doctor who travelled with Paul. He wasn't an eyewitness, but he carefully checked with those who were.",
    to: "Theophilus, and readers who weren't Jewish.",
    when: "About AD 60. The book of Acts is his part two.",
  },
  John: {
    brief: "John writes so that we may believe Jesus is the Son of God and have life in his name. He tells signs like turning water into wine and raising Lazarus, Jesus' \"I am\" sayings, and his long talk with the disciples the night before he died - mostly things the other Gospels don't tell.",
    who: "John, \"the disciple whom Jesus loved\", one of the twelve - an eyewitness.",
    to: "Everyone - \"so that you may believe that Jesus is the Christ, the Son of God\" (John 20:31).",
    when: "Probably the last Gospel written, about AD 85-95.",
  },
  Acts: {
    brief: "After Jesus goes up to heaven, the Holy Spirit comes at Pentecost and the church is born in Jerusalem. The good news spreads through Peter, Stephen and Philip, then through Paul's journeys across the Roman world, ending with Paul in Rome.",
    who: "Luke, part two of his Gospel. Where it says \"we\", Luke was there.",
    to: "Theophilus.",
    when: "About AD 30-62, from Jesus going up to heaven to Paul in Rome.",
  },
  Romans: {
    brief: "Paul explains the gospel step by step: everyone has sinned, and we are made right with God by faith in Jesus, not by keeping the law. He speaks of new life in the Spirit, God's plan for Israel, and how to live as one body in Christ.",
    who: "Paul.",
    to: "The church in Rome, which he hadn't visited yet.",
    when: "About AD 57, from Corinth.",
    see: { label: "Where Paul was", read: "Acts 20" },
  },
  "1 Corinthians": {
    brief: "Paul writes to a gifted but divided church. He deals with quarrels, sexual sin, lawsuits, marriage, food offered to idols, worship and spiritual gifts - with the great chapters on love (13) and the resurrection (15).",
    who: "Paul.",
    to: "The church he started in Corinth, a busy Greek port city.",
    when: "About AD 55, from Ephesus.",
    see: { label: "How this church began", read: "Acts 18" },
  },
  "2 Corinthians": {
    brief: "Paul's most personal letter. He defends his ministry against those who doubted him, shares his sufferings, and teaches about generous giving. God's power is made perfect in weakness.",
    who: "Paul.",
    to: "The church in Corinth.",
    when: "About AD 56.",
    see: { label: "How this church began", read: "Acts 18" },
  },
  Galatians: {
    brief: "Some were teaching that believers must keep the Jewish law to be saved. Paul says we are made right with God by faith in Christ alone, and calls them to live in the freedom of the Spirit and show the fruit of the Spirit.",
    who: "Paul.",
    to: "The churches in Galatia - likely the ones Paul started on his first journey.",
    when: "About AD 48-55.",
    see: { label: "Paul's first journey", read: "Acts 13-14" },
  },
  Ephesians: {
    brief: "The first half celebrates all God has done for us in Christ - chosen, forgiven, saved by grace and made one family. The second half shows how to live it out: in the church, in marriage and family, and by putting on the armour of God.",
    who: "Paul, writing from prison.",
    to: "The church in Ephesus.",
    when: "About AD 60-62.",
    see: { label: "How this church began", read: "Acts 19" },
  },
  Philippians: {
    brief: "Written from prison, yet full of joy. Paul thanks the church for their support, points to Jesus' humility as our example, and teaches contentment in every situation - \"rejoice in the Lord always\".",
    who: "Paul, with Timothy, writing from prison.",
    to: "The church in Philippi, the first church in Europe.",
    when: "About AD 61-62.",
    see: { label: "How this church began", read: "Acts 16" },
  },
  Colossians: {
    brief: "Paul shows that Jesus is over all creation and the church, and that in him we have everything we need. So don't be drawn away by other teachings - set your hearts on things above.",
    who: "Paul, writing from prison.",
    to: "The church in Colossae, which Paul hadn't visited.",
    when: "About AD 60-62, sent with Ephesians and Philemon.",
  },
  "1 Thessalonians": {
    brief: "Paul thanks God for this young church's faith under pressure, encourages them to live holy lives, and comforts them about believers who have died: Jesus will come back, and we will be with him forever.",
    who: "Paul, with Silas and Timothy.",
    to: "The young church in Thessalonica.",
    when: "About AD 51 - one of Paul's first letters.",
    see: { label: "How this church began", read: "Acts 17" },
  },
  "2 Thessalonians": {
    brief: "Some thought the day of the Lord had already come. Paul corrects this, encourages them to stand firm under persecution, and tells those who had stopped working to get back to work.",
    who: "Paul, with Silas and Timothy.",
    to: "The church in Thessalonica.",
    when: "A few months after the first letter.",
    see: { label: "How this church began", read: "Acts 17" },
  },
  "1 Timothy": {
    brief: "Paul's guidance to Timothy for leading the church in Ephesus: guard sound teaching, pray for everyone, choose leaders of good character, and care well for widows. Fight the good fight of faith.",
    who: "Paul, an older mentor.",
    to: "Timothy, his young co-worker, leading the church in Ephesus.",
    when: "About AD 62-64.",
    see: { label: "Where Timothy joined Paul", read: "Acts 16" },
  },
  "2 Timothy": {
    brief: "Paul's last letter, written from prison near the end of his life. He urges Timothy to be strong, not ashamed of the gospel, to hold on to Scripture and to preach the word - \"I have finished the race\".",
    who: "Paul, in prison in Rome.",
    to: "Timothy.",
    when: "About AD 66-67.",
    see: { label: "Where Timothy joined Paul", read: "Acts 16" },
  },
  Titus: {
    brief: "Paul tells Titus to appoint good leaders in the churches on Crete and to teach sound doctrine, so that believers of every age live in a way that shows God's grace.",
    who: "Paul.",
    to: "Titus, leading the churches on the island of Crete.",
    when: "About AD 63.",
  },
  Philemon: {
    brief: "A short personal letter. Paul asks Philemon to welcome back his runaway slave Onesimus, who has become a believer - no longer as a slave, but as a dear brother.",
    who: "Paul, writing from prison.",
    to: "Philemon, a believer in Colossae.",
    when: "About AD 60-62.",
  },
  Hebrews: {
    brief: "Jesus is greater than the angels, Moses and the priests of the old covenant. He is our great high priest, and his one sacrifice is enough. Chapter 11 remembers heroes of faith, and the letter urges readers to hold on and run the race.",
    who: "We don't know who wrote it.",
    to: "Jewish believers tempted to go back to the old ways.",
    when: "Before AD 70 - the temple sacrifices were still going on.",
  },
  James: {
    brief: "Practical wisdom for living out our faith: joy in trials, taming the tongue, not favouring the rich, and caring for the poor. Faith without works is dead.",
    who: "James, the brother of Jesus, leader of the church in Jerusalem.",
    to: "Jewish believers scattered abroad.",
    when: "Probably the 40s or 50s AD - one of the earliest letters.",
  },
  "1 Peter": {
    brief: "Written to believers suffering for their faith. Peter reminds them of their living hope in Jesus, calls them to holy living, and encourages them to follow Christ's example when they suffer.",
    who: "Peter, one of the twelve disciples.",
    to: "Believers scattered across what is now Turkey.",
    when: "About AD 62-64, from Rome.",
  },
  "2 Peter": {
    brief: "Peter's last letter. He urges believers to keep growing in faith and goodness, warns against false teachers, and reminds them that the Lord will come back, as he promised.",
    who: "Peter, near the end of his life.",
    to: "The same believers as his first letter.",
    when: "About AD 65-68.",
  },
  "1 John": {
    brief: "John writes so that believers can know they have eternal life. God is light and God is love - so walk in the light, love one another, and believe that Jesus truly came in the flesh.",
    who: "John, the disciple - \"what we have seen with our eyes\".",
    to: "Churches he cared for, probably around Ephesus.",
    when: "About AD 85-95.",
  },
  "2 John": {
    brief: "A short letter: keep walking in truth and love, and don't welcome teachers who deny that Jesus came in the flesh.",
    who: "John, \"the elder\".",
    to: "\"The chosen lady and her children\" - probably a church.",
    when: "About AD 85-95.",
  },
  "3 John": {
    brief: "A short letter to Gaius, thanking him for welcoming travelling teachers, and warning about Diotrephes, who loves to be first.",
    who: "John, \"the elder\".",
    to: "His friend Gaius.",
    when: "About AD 85-95.",
  },
  Jude: {
    brief: "Jude urges believers to stand up for the faith, warns about false teachers who turn God's grace into an excuse to sin, and ends with a beautiful blessing.",
    who: "Jude, brother of James (and of Jesus).",
    to: "Believers.",
    when: "About AD 65-80.",
  },
  Revelation: {
    brief: "John's vision of the risen Jesus, his messages to seven churches, and visions of God's throne, the battle between good and evil, and God's final judgment. It ends with a new heaven and a new earth, where God lives with his people.",
    who: "Jesus revealing it to John, who writes down what he sees.",
    to: "Seven churches in what is now Turkey - and every church.",
    when: "About AD 95, while John was exiled on the island of Patmos.",
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
