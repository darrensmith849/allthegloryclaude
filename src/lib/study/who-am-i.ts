// Members see "Who am I?" every time they open The Study (each visit - a new
// tab or opening the app), unless they've chosen "Don't show this every
// time" (remembered on this device). It's always in their menu, with the
// switch to turn it back on.

const offKey = (memberId: string) => `atg:study:${memberId}:whoAmIOff`;
const VISIT_KEY = "atg:study:whoAmIVisit"; // this visit (sessionStorage)

export function whoAmIOff(memberId: string): boolean {
  try {
    return window.localStorage.getItem(offKey(memberId)) === "1";
  } catch {
    return false;
  }
}

export function setWhoAmIOff(memberId: string, off: boolean) {
  try {
    if (off) window.localStorage.setItem(offKey(memberId), "1");
    else window.localStorage.removeItem(offKey(memberId));
  } catch {
    // private window
  }
}

export function shownThisVisit(): boolean {
  try {
    return window.sessionStorage.getItem(VISIT_KEY) === "1";
  } catch {
    return true; // can't tell - don't keep sending them there
  }
}

export function markShownThisVisit() {
  try {
    window.sessionStorage.setItem(VISIT_KEY, "1");
  } catch {
    // private window
  }
}
