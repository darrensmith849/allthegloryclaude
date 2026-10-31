import "server-only";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { contactKey } from "@/platform/domain/contacts";
import { consentWording, type ConsentRecord, type ConsentSource } from "@/platform/domain/consent";
import { humanReference, newId } from "@/platform/domain/ids";
import type { ApplicationState, EnquiryState } from "@/platform/domain/lifecycle";
import type { ApplicationInput, EnquiryInput } from "@/platform/domain/schemas";
import type { AnalyticsEvent, CoreApi, SubmissionContext, SubmissionResult } from "./types";

// DEVELOPMENT ONLY. A JSON file that mirrors the shape of the Phase 2
// PostgreSQL tables (db/migrations/0001_core_schema.sql) closely enough to
// exercise deduplication, consent, lifecycle, audit and alerting rules.
// env.ts refuses this mode when DEPLOYMENT_ENV=production.

interface Contact {
  id: string;
  email: string;
  phone: string | null;
  name: string;
  country: string;
  lawfulBasis: "respond-to-request";
  sources: ConsentSource[];
  createdAt: string;
  updatedAt: string;
}

interface StoreShape {
  version: 1;
  contacts: Contact[];
  consents: ConsentRecord[];
  enquiries: { id: string; reference: string; contactId: string; state: EnquiryState; data: Omit<EnquiryInput, "privacyAccepted" | "marketingOptIn">; createdAt: string }[];
  applications: { id: string; reference: string; contactId: string; state: ApplicationState; data: Omit<ApplicationInput, "privacyAccepted" | "marketingOptIn" | "rightsConfirmed">; rightsConfirmedAt: string; createdAt: string }[];
  auditEvents: { id: string; action: string; entity: string; entityId: string; actor: "public-form"; at: string; detail: Record<string, unknown> }[];
  outbox: { id: string; channel: "internal-alert" | "acknowledgement-email"; template: string; entityId: string; status: "queued"; createdAt: string }[];
  idempotency: Record<string, SubmissionResult & { kind: string }>;
  analytics: AnalyticsEvent[];
}

const empty = (): StoreShape => ({ version: 1, contacts: [], consents: [], enquiries: [], applications: [], auditEvents: [], outbox: [], idempotency: {}, analytics: [] });

export class DevFileCoreApi implements CoreApi {
  readonly mode = "dev-file" as const;
  private queue: Promise<unknown> = Promise.resolve();
  private readonly path: string;

  constructor(path: string) {
    this.path = resolve(/*turbopackIgnore: true*/ process.cwd(), path);
  }

  /** Serialise writes within this process so concurrent requests cannot clobber each other. */
  private transaction<T>(fn: (store: StoreShape) => T): Promise<T> {
    const run = this.queue.then(async () => {
      const store = await this.load();
      const result = fn(store);
      await this.save(store);
      return result;
    });
    this.queue = run.catch(() => undefined);
    return run;
  }

  private async load(): Promise<StoreShape> {
    try {
      return { ...empty(), ...(JSON.parse(await readFile(this.path, "utf8")) as StoreShape) };
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return empty();
      throw error;
    }
  }

  private async save(store: StoreShape): Promise<void> {
    await mkdir(dirname(this.path), { recursive: true });
    const tmp = `${this.path}.${process.pid}.tmp`;
    await writeFile(tmp, JSON.stringify(store, null, 2));
    await rename(tmp, this.path);
  }

  private upsertContact(store: StoreShape, input: { name: string; email: string; phone?: string; country: string }, source: ConsentSource, at: string): Contact {
    const key = contactKey(input.email, input.phone);
    const existing = store.contacts.find((c) => c.email === key.email);
    if (existing) {
      existing.updatedAt = at;
      existing.phone ??= key.phone;
      if (!existing.sources.includes(source)) existing.sources.push(source);
      store.auditEvents.push({ id: newId("aud"), action: "contact.matched", entity: "contact", entityId: existing.id, actor: "public-form", at, detail: { source } });
      return existing;
    }
    const contact: Contact = { id: newId("con"), email: key.email, phone: key.phone, name: input.name, country: input.country, lawfulBasis: "respond-to-request", sources: [source], createdAt: at, updatedAt: at };
    store.contacts.push(contact);
    store.auditEvents.push({ id: newId("aud"), action: "contact.created", entity: "contact", entityId: contact.id, actor: "public-form", at, detail: { source } });
    return contact;
  }

  private recordConsents(store: StoreShape, contactId: string, marketingOptIn: boolean, source: ConsentSource, ctx: SubmissionContext): void {
    store.consents.push({ id: newId("cns"), contactId, purpose: "privacy-notice", granted: true, wordingVersion: ctx.policyVersions.privacy, source, recordedAt: ctx.receivedAt, withdrawnAt: null });
    // Marketing is recorded only when explicitly ticked; silence is not consent.
    if (marketingOptIn) {
      store.consents.push({ id: newId("cns"), contactId, purpose: "marketing", granted: true, wordingVersion: ctx.policyVersions.marketingConsent, source, recordedAt: ctx.receivedAt, withdrawnAt: null });
    }
  }

  private replay(store: StoreShape, kind: string, key: string): SubmissionResult | null {
    const hit = store.idempotency[`${kind}:${key}`];
    return hit ? { id: hit.id, reference: hit.reference, alertQueued: hit.alertQueued, replayed: true } : null;
  }

  submitEnquiry(input: EnquiryInput, ctx: SubmissionContext): Promise<SubmissionResult> {
    return this.transaction((store) => {
      const replayed = this.replay(store, "enquiry", ctx.idempotencyKey);
      if (replayed) return replayed;

      const contact = this.upsertContact(store, input, "project-brief", ctx.receivedAt);
      this.recordConsents(store, contact.id, input.marketingOptIn, "project-brief", ctx);
      const { privacyAccepted: _p, marketingOptIn: _m, ...data } = input;
      const id = newId("enq");
      const reference = humanReference(id);
      store.enquiries.push({ id, reference, contactId: contact.id, state: "new", data, createdAt: ctx.receivedAt });
      store.auditEvents.push({ id: newId("aud"), action: "enquiry.received", entity: "enquiry", entityId: id, actor: "public-form", at: ctx.receivedAt, detail: { turnstile: ctx.turnstileMode, consentWording: consentWording.privacy } });
      store.outbox.push(
        { id: newId("out"), channel: "internal-alert", template: "new-enquiry", entityId: id, status: "queued", createdAt: ctx.receivedAt },
        { id: newId("out"), channel: "acknowledgement-email", template: "enquiry-received", entityId: id, status: "queued", createdAt: ctx.receivedAt },
      );
      const result: SubmissionResult = { id, reference, replayed: false, alertQueued: true };
      store.idempotency[`enquiry:${ctx.idempotencyKey}`] = { ...result, kind: "enquiry" };
      return result;
    });
  }

  submitApplication(input: ApplicationInput, ctx: SubmissionContext): Promise<SubmissionResult> {
    return this.transaction((store) => {
      const replayed = this.replay(store, "application", ctx.idempotencyKey);
      if (replayed) return replayed;

      const contact = this.upsertContact(store, input, "roster-application", ctx.receivedAt);
      this.recordConsents(store, contact.id, input.marketingOptIn, "roster-application", ctx);
      const { privacyAccepted: _p, marketingOptIn: _m, rightsConfirmed: _r, ...data } = input;
      const id = newId("app");
      const reference = humanReference(id);
      store.applications.push({ id, reference, contactId: contact.id, state: "received", data, rightsConfirmedAt: ctx.receivedAt, createdAt: ctx.receivedAt });
      store.auditEvents.push({ id: newId("aud"), action: "application.received", entity: "application", entityId: id, actor: "public-form", at: ctx.receivedAt, detail: { turnstile: ctx.turnstileMode } });
      store.outbox.push(
        { id: newId("out"), channel: "internal-alert", template: "new-application", entityId: id, status: "queued", createdAt: ctx.receivedAt },
        { id: newId("out"), channel: "acknowledgement-email", template: "application-received", entityId: id, status: "queued", createdAt: ctx.receivedAt },
      );
      const result: SubmissionResult = { id, reference, replayed: false, alertQueued: true };
      store.idempotency[`application:${ctx.idempotencyKey}`] = { ...result, kind: "application" };
      return result;
    });
  }

  recordEvents(events: AnalyticsEvent[]): Promise<void> {
    return this.transaction((store) => {
      store.analytics.push(...events);
      // Keep the development file small.
      if (store.analytics.length > 2000) store.analytics.splice(0, store.analytics.length - 2000);
    });
  }
}
