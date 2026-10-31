import NextLink from "next/link";
import type { ComponentProps } from "react";
import { withRoute } from "@/platform/config/client-env";

// The platform runs under /agency on All the Glory. Every internal link is
// written as if the platform owned the domain ("/roster") and prefixed here,
// so moving to an independent domain is a one-line change in client-env.ts.
export default function Link({ href, ...rest }: ComponentProps<typeof NextLink>) {
  const resolved = typeof href === "string" && href.startsWith("/") && !href.startsWith("//") ? withRoute(href) : href;
  return <NextLink href={resolved} {...rest} />;
}
