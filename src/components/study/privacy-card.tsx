// Who can read what, in plain words. Every line here has to stay true: shared
// notes are locked in the browser (src/lib/study/shared-groups.ts); a member's
// own journal is kept off every owner and team page, but it isn't locked with a
// key of its own, so this doesn't claim it is.

export function PrivacyCard() {
  return (
    <section className="shared-privacy" id="privacy">
      <h2 className="shared-privacy-title">🔒 Who can read your notes</h2>
      <div className="shared-privacy-row">
        <h3>Notes you share with a group - locked</h3>
        <p>
          They&apos;re scrambled on your own device before they&apos;re sent. The key is part of your group&apos;s link, and that part
          of the link never reaches our server, so all we ever store is scrambled text. Without the link no one can read them: not
          Daniel, not the team, not other members.
        </p>
        <p>
          We can only see that a group exists, who&apos;s in it and how many notes it has - never its name or a word of what&apos;s
          written. Anyone you give the link to can join, so send it only to people you trust. The group&apos;s leader can take someone
          out.
        </p>
      </div>
      <div className="shared-privacy-row">
        <h3>The key stays on your device</h3>
        <p>
          Once you open a group&apos;s link, this phone or computer remembers the key so the group opens by itself. Logging out
          leaves it there; deleting your account on this device wipes it from this device. Don&apos;t open a group&apos;s link on a computer other people use.
        </p>
        <p>
          Our pages only run the site&apos;s own code and won&apos;t load scripts from other websites, which helps keep that key on
          your device.
        </p>
      </div>
      <div className="shared-privacy-row">
        <h3>Your own journal - private</h3>
        <p>
          Nobody else sees it unless you share a note yourself. Daniel and the team have no page, button or download that shows it -
          only your name, your email and how many notes and words you&apos;ve saved. It&apos;s kept in the site&apos;s protected
          database, so this part is our promise to you rather than a lock only you hold.
        </p>
      </div>
      <p className="shared-privacy-more">
        <a href="/privacy">Our full privacy policy</a>
      </p>
    </section>
  );
}
