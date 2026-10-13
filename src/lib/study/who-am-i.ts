// Members see "Who am I?" the first time they open The Study each day (on
// this device); after that, home opens straight away. Also in their menu.

const key = (memberId: string) => `atg:study:${memberId}:whoAmI`;
const today = () => new Date().toLocaleDateString("en-CA"); // the device's own date, YYYY-MM-DD

export function seenWhoAmIToday(memberId: string): boolean {
  try {
    return window.localStorage.getItem(key(memberId)) === today();
  } catch {
    return true; // private window - don't keep sending them there
  }
}

export function markWhoAmISeen(memberId: string) {
  try {
    window.localStorage.setItem(key(memberId), today());
  } catch {
    // private window
  }
}
