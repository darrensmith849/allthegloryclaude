"use client";

import { forwardRef, useImperativeHandle, useLayoutEffect, useRef } from "react";

// A textarea that grows to fit its text, so everything is readable without
// scrolling inside the box.
export const GrowingTextarea = forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement> & { minRows?: number }
>(function GrowingTextarea({ minRows = 2, ...props }, forwarded) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useImperativeHandle(forwarded, () => ref.current as HTMLTextAreaElement);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight + 2}px`;
  }, [props.value]);
  return <textarea ref={ref} rows={minRows} {...props} />;
});
