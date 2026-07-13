import assert from "node:assert/strict";

import {
  ANALYTICS_TIME_ZONE,
  bucketKeyForTimestamp,
  buildTimeBuckets,
  classifyTrafficSource,
  compareMetric,
  conversionRate,
  normaliseComparisonKey,
  normaliseDevice,
  normaliseRangeKey,
  percentageChange,
  resolveAnalyticsRange,
  resolveComparison,
} from "./metrics.ts";

const now = Date.UTC(2026, 6, 13, 10, 30);
const trackedSince = Date.UTC(2026, 6, 7, 8, 0);

assert.equal(normaliseRangeKey("90d"), "90d");
assert.equal(normaliseRangeKey("bad"), "30d");
assert.equal(normaliseComparisonKey("year"), "year");
assert.equal(normaliseComparisonKey("bad"), "previous");

const sevenDays = resolveAnalyticsRange("7d", now, trackedSince);
assert.equal(sevenDays.timezone, ANALYTICS_TIME_ZONE);
assert.equal(sevenDays.granularity, "day");
assert.equal(sevenDays.start, Date.UTC(2026, 6, 6, 22, 0));
assert.equal(sevenDays.end, now);

const allTime = resolveAnalyticsRange("all", now, trackedSince);
assert.equal(allTime.start, Date.UTC(2026, 6, 6, 22, 0));

const previous = resolveComparison("previous", sevenDays, trackedSince);
assert.ok(previous);
assert.equal(previous.end, sevenDays.start);
assert.equal(previous.available, false);

const allComparison = resolveComparison("previous", allTime, trackedSince);
assert.ok(allComparison);
assert.equal(allComparison.available, false);

assert.equal(percentageChange(125, 100), 25);
assert.equal(percentageChange(0, 0), 0);
assert.equal(percentageChange(5, 0), null);
assert.deepEqual(compareMetric(5, 0), {
  current: 5,
  previous: 0,
  changePct: null,
  direction: "new",
});
assert.equal(conversionRate(4, 20), 20);
assert.equal(conversionRate(4, 0), null);

assert.equal(classifyTrafficSource("google.com").key, "search");
assert.equal(classifyTrafficSource("facebook.com").key, "social");
assert.equal(classifyTrafficSource("mailchimp.com").key, "email");
assert.equal(classifyTrafficSource("direct").key, "direct");
assert.equal(classifyTrafficSource("example.org").key, "referral");

assert.equal(normaliseDevice("MOBILE"), "mobile");
assert.equal(normaliseDevice("console"), "unknown");

const buckets = buildTimeBuckets(sevenDays.start, sevenDays.end, "day");
assert.equal(buckets.length, 7);
assert.equal(bucketKeyForTimestamp(Date.UTC(2026, 6, 13, 8, 0), "day"), "2026-07-13");

console.log("analytics metric helpers ok");
