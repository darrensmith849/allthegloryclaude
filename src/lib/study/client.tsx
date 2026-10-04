"use client";

// Which study the journal screens (Study Notes, Word Journal, word study)
// are working on: the owner's, inside /dashboard, or a member's, inside
// /study. Each has its own APIs, links and on-device cache keys. The
// default is the owner's, so the dashboard needs no provider.

import { createContext, useContext } from "react";

export type CacheName =
  | "notes"
  | "notesSynced"
  | "days"
  | "drafts"
  | "sections"
  | "words"
  | "wordsPending"
  | "wordsSynced"
  | "wordsRejected"
  | "guide";

export interface StudyClient {
  kind: "owner" | "member";
  notesApi: string;
  daysApi: string;
  wordsApi: string;
  fillApi: string;
  loginUrl: string;
  notesUrl: string;
  wordsUrl: string;
  printUrl: string; // the journal laid out to print or save as PDF
  readerUrl?: string; // owner: preview of the shared study
  studyUrl?: string; // member: the owner's study, when it's open to them
  studyName?: string; // member: what the owner's study is called, e.g. "Daniel's study"
  studyAuthor?: string; // member: the owner's name on it, e.g. "Daniel"
  sharing: boolean; // owner: private notes / "include when I share"
  key: (name: CacheName) => string;
}

// The owner's keys predate members - kept as they were so nothing on the
// owner's devices (including unsent changes) is lost.
const OWNER_KEYS: Record<CacheName, string> = {
  notes: "atg:notes:v1",
  notesSynced: "atg:notes:synced",
  days: "atg:notes:days",
  drafts: "atg:notes:drafts",
  sections: "atg:notes:sections",
  words: "atg:words:v1",
  wordsPending: "atg:words:pending",
  wordsSynced: "atg:words:synced",
  wordsRejected: "atg:words:rejected",
  guide: "atg:notes:guide",
};

export const OWNER_CLIENT: StudyClient = {
  kind: "owner",
  notesApi: "/api/study-notes",
  daysApi: "/api/study-days",
  wordsApi: "/api/words",
  fillApi: "/api/word-fill",
  loginUrl: "/dashboard/login",
  notesUrl: "/dashboard/notes",
  wordsUrl: "/dashboard/word-study",
  printUrl: "/dashboard/print",
  readerUrl: "/dashboard/notes/read",
  sharing: true,
  key: (name) => OWNER_KEYS[name],
};

export function memberClient(
  memberId: string,
  opts: { canReadStudy: boolean; author?: string },
): StudyClient {
  const author = opts.author && opts.author !== "All The Glory" ? opts.author : undefined;
  return {
    kind: "member",
    notesApi: "/api/study/notes",
    daysApi: "/api/study/days",
    wordsApi: "/api/study/words",
    fillApi: "/api/study/word-fill",
    loginUrl: "/study/login",
    notesUrl: "/study/journal",
    wordsUrl: "/study/words",
    printUrl: "/study/print",
    studyUrl: opts.canReadStudy ? "/study/read" : undefined,
    studyName: author ? `${author}'s study` : "The study",
    studyAuthor: author,
    sharing: false,
    key: (name) => `atg:study:${memberId}:${name}`,
  };
}

const StudyClientContext = createContext<StudyClient>(OWNER_CLIENT);
export const StudyClientProvider = StudyClientContext.Provider;
export const useStudyClient = () => useContext(StudyClientContext);
