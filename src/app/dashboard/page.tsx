"use client";

import { WhoAmI } from "@/components/dashboard/who-am-i";
import { IDENTITY_STATEMENTS } from "@/lib/dashboard/identity";

export default function WhoAmIPage() {
  return <WhoAmI statements={IDENTITY_STATEMENTS} open={{ href: "/dashboard/today", label: "Open Dashboard" }} />;
}
