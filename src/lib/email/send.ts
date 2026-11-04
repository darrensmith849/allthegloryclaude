// Every email the site sends: Cloudflare Email Sending, through the Worker's
// own `send_email` binding ("EMAIL" in wrangler.jsonc).
//
// There is no API key. The binding is the credential, so there is nothing to
// go missing or rotate. alltheglory.co.za is onboarded for sending, so mail
// from notify@alltheglory.co.za is DKIM-signed for the domain and passes
// DMARC, as it did through Brevo.
//
// This replaced Brevo on 2026-10-05, when 2KO began closing its Brevo account.
// One function for the contact form, the newsletter note, The Study's member
// emails and the owner's alerts, so the result each of them records for the
// Members page ("Is email working?") means the same thing everywhere.

import { getCloudflareContext } from "@opennextjs/cloudflare";

export interface MailAddress {
  email: string;
  name?: string;
}

export interface SendResult {
  ok: boolean;
  // "sent", or the code Cloudflare refused it with (E_RECIPIENT_SUPPRESSED, ...).
  status: string;
  detail?: string;
}

// The part of the send_email binding this site uses.
interface EmailBinding {
  send(message: {
    to: string;
    from: MailAddress;
    replyTo?: string;
    subject: string;
    html: string;
    text: string;
  }): Promise<{ messageId?: string }>;
}

async function emailBinding(): Promise<EmailBinding | null> {
  try {
    const { env } = await getCloudflareContext({ async: true });
    return (env as unknown as { EMAIL?: EmailBinding }).EMAIL ?? null;
  } catch {
    return null;
  }
}

export async function sendEmail(message: {
  to: MailAddress;
  from: MailAddress;
  replyTo?: MailAddress;
  subject: string;
  html: string;
  text: string;
}): Promise<SendResult> {
  const email = await emailBinding();
  if (!email) return { ok: false, status: "not_configured", detail: "No EMAIL binding here" };

  try {
    await email.send({
      to: message.to.email,
      from: message.from,
      replyTo: message.replyTo?.email,
      subject: message.subject,
      html: message.html,
      text: message.text,
    });
    return { ok: true, status: "sent" };
  } catch (e) {
    const err = e as { code?: string; message?: string };
    console.error("Email send failed", err.code, err.message);
    return { ok: false, status: err.code ?? "error", detail: err.message };
  }
}
