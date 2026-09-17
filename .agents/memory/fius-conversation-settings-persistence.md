---
name: Blinga per-conversation settings persistence
description: Why a per-chat setting (e.g. "AI role") can appear to save client-side but never actually persist or apply.
---

If a per-conversation UI setting (title rename, AI role/persona, model choice) doesn't seem to save,
check that a server route actually exists for the PATCH/update call the client is making — don't
assume the wiring bug is on the client. In this app, the client sent `PATCH /api/conversations/:id`
for months with zero matching Express route (only GET/GET messages/DELETE existed), so every save
silently 404'd.

Separately, even once persisted to the DB, a per-conversation field (e.g. `customInstructions`) has
to be explicitly read back into the system prompt at each AI request — persisting it and using it
are two different bugs that must both be checked.

**Why:** the failure mode is a totally silent no-op (fetch 404 swallowed, or unused DB column) with no
console error the user notices, so static assumptions ("the client wiring looks right") are misleading.

**How to apply:** when a per-record setting won't stick, grep the server route file for the exact
HTTP method + path the client calls before touching any client code. Then separately verify the value
is actually consumed wherever the record is turned into behavior (e.g. AI system prompt construction).
