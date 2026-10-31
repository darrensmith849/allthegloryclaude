"use client";

import Link from "@/platform/components/ui/Link";
import { usePathname, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { creativeRoles, genres } from "@/platform/domain/options";
import type { SampleProfile } from "@/platform/demo-data/roster";
import { TalentCard } from "./TalentCard";

// Filter state lives in the URL, so every filtered view is a shareable deep
// link and the back button restores the previous filter (MASTER_PLAN §7).
// Typing in search replaces the history entry to avoid flooding it; select
// changes push a new entry.

type FilterKey = "role" | "genre" | "country" | "remote" | "q";

export function RosterExplorer({ profiles }: { profiles: SampleProfile[] }) {
  const pathname = usePathname();
  const params = useSearchParams();
  const [query, setQuery] = useState(params.get("q") ?? "");

  const role = params.get("role") ?? "";
  const genre = params.get("genre") ?? "";
  const country = params.get("country") ?? "";
  const remote = params.get("remote") === "1";
  const q = (params.get("q") ?? "").trim().toLowerCase();

  const countries = useMemo(() => Array.from(new Set(profiles.map((p) => p.country))).sort(), [profiles]);
  const usedRoles = useMemo(() => creativeRoles.filter((r) => profiles.some((p) => p.roles.includes(r.value))), [profiles]);
  const usedGenres = useMemo(() => genres.filter((g) => profiles.some((p) => p.genres.includes(g.value))), [profiles]);

  const results = profiles.filter(
    (p) =>
      (!role || p.roles.includes(role as SampleProfile["roles"][number])) &&
      (!genre || p.genres.includes(genre as SampleProfile["genres"][number])) &&
      (!country || p.country === country) &&
      (!remote || p.remoteReady) &&
      (!q || `${p.name} ${p.headline} ${p.city} ${p.country}`.toLowerCase().includes(q)),
  );

  function update(next: Partial<Record<FilterKey, string>>, mode: "push" | "replace" = "push") {
    const sp = new URLSearchParams(params.toString());
    for (const [key, value] of Object.entries(next)) {
      if (value) sp.set(key, value);
      else sp.delete(key);
    }
    const url = sp.toString() ? `${pathname}?${sp}` : pathname;
    // Native history updates are synced by Next.js into useSearchParams without
    // a server round trip, so filtering is instant even on slow connections.
    if (mode === "push") window.history.pushState(null, "", url);
    else window.history.replaceState(null, "", url);
  }

  const active = Boolean(role || genre || country || remote || q);

  return (
    <div>
      <form className="roster-toolbar" role="search" aria-label="Filter the roster" onSubmit={(e) => e.preventDefault()}>
        <div className="roster-toolbar__row">
          <div className="field">
            <label className="field__label" htmlFor="roster-q">
              Search
            </label>
            <input
              id="roster-q"
              className="input"
              type="search"
              value={query}
              placeholder="Name, city or style"
              onChange={(e) => {
                setQuery(e.target.value);
                update({ q: e.target.value.trim() }, "replace");
              }}
            />
          </div>
          <div className="field">
            <label className="field__label" htmlFor="roster-role">
              Role
            </label>
            <select id="roster-role" className="select" value={role} onChange={(e) => update({ role: e.target.value })}>
              <option value="">All roles</option>
              {usedRoles.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label className="field__label" htmlFor="roster-genre">
              Genre
            </label>
            <select id="roster-genre" className="select" value={genre} onChange={(e) => update({ genre: e.target.value })}>
              <option value="">All genres</option>
              {usedGenres.map((g) => (
                <option key={g.value} value={g.value}>
                  {g.label}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label className="field__label" htmlFor="roster-country">
              Based in
            </label>
            <select id="roster-country" className="select" value={country} onChange={(e) => update({ country: e.target.value })}>
              <option value="">Anywhere</option>
              {countries.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="roster-toolbar__foot">
          <label className="check" style={{ gridTemplateColumns: "24px auto" }}>
            <input type="checkbox" checked={remote} onChange={(e) => update({ remote: e.target.checked ? "1" : "" })} />
            <span>Remote delivery only</span>
          </label>
          <p aria-live="polite" role="status">
            {results.length} of {profiles.length} sample profiles
          </p>
          {active ? (
            <button
              type="button"
              className="btn btn--ghost btn--sm"
              onClick={() => {
                setQuery("");
                update({ role: "", genre: "", country: "", remote: "", q: "" });
              }}
            >
              Clear filters
            </button>
          ) : null}
        </div>
      </form>

      {results.length ? (
        <div className="roster-grid">
          {results.map((p) => (
            <TalentCard key={p.slug} profile={p} headingLevel={2} />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <h2>No sample profiles match those filters</h2>
          <p className="muted">Clear a filter, or tell us what you need and we will match you from the full network.</p>
          <div className="cluster">
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => {
                setQuery("");
                update({ role: "", genre: "", country: "", remote: "", q: "" });
              }}
            >
              Clear filters
            </button>
            <Link className="btn" href="/contact">
              Send a brief instead
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
