import assert from "node:assert/strict";
import { decideCaption } from "./moderate-upload.js";

assert.deepEqual(decideCaption("Cart totals in the console", false), { status: "published", caption: "Cart totals in the console" });
assert.deepEqual(decideCaption("Unexpected checkout prompt", true), { status: "rejected", caption: "Unexpected checkout prompt", reason: "image or caption needs review" });
console.log("moderation decision tests passed");
