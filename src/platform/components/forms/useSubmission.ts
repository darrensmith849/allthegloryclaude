"use client";

import { useCallback, useRef, useState } from "react";
import type { z } from "zod";
import { withRoute } from "@/platform/config/client-env";
import { fieldErrors } from "@/platform/domain/schemas";

// Submission state machine shared by the public forms. The idempotency key is
// created once per form instance and reused on retries, so a double click or
// a network retry can never create two records. Input is never cleared on a
// recoverable failure.

export type SubmissionState =
  | { status: "idle" }
  | { status: "submitting" }
  | { status: "invalid"; errors: Record<string, string>; message: string }
  | { status: "error"; message: string }
  | { status: "success"; reference: string; message: string };

function newKey(): string {
  return crypto.randomUUID().replace(/-/g, "");
}

export function useSubmission<T>(endpoint: string, schema: z.ZodType<T>) {
  const [state, setState] = useState<SubmissionState>({ status: "idle" });
  const idempotencyKey = useRef<string>("");
  const startedAt = useRef<number>(0);

  const markStarted = useCallback(() => {
    if (!startedAt.current) startedAt.current = Date.now();
    if (!idempotencyKey.current) idempotencyKey.current = newKey();
  }, []);

  const submit = useCallback(
    async (data: unknown, extra: { turnstileToken: string; website: string }): Promise<boolean> => {
      markStarted();
      const parsed = schema.safeParse(data);
      if (!parsed.success) {
        setState({ status: "invalid", errors: fieldErrors(parsed.error), message: "Please check the highlighted fields." });
        return false;
      }
      setState({ status: "submitting" });
      try {
        const res = await fetch(withRoute(endpoint), {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            data: parsed.data,
            meta: { idempotencyKey: idempotencyKey.current, turnstileToken: extra.turnstileToken, website: extra.website, startedAt: startedAt.current },
          }),
        });
        const body = (await res.json().catch(() => ({}))) as { ok?: boolean; reference?: string; message?: string; errors?: Record<string, string> };
        if (res.ok && body.ok && body.reference) {
          setState({ status: "success", reference: body.reference, message: body.message ?? "Thank you." });
          return true;
        }
        if (res.status === 422 && body.errors) {
          setState({ status: "invalid", errors: body.errors, message: body.message ?? "Please check the highlighted fields." });
          return false;
        }
        setState({ status: "error", message: body.message ?? "Something went wrong. Your answers are still here — please try again." });
        return false;
      } catch {
        setState({ status: "error", message: "We could not reach the server. Check your connection — your answers are still here." });
        return false;
      }
    },
    [endpoint, schema, markStarted],
  );

  return { state, submit, markStarted };
}
