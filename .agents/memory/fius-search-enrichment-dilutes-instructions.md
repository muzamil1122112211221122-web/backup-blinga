---
name: Search-enrichment can dilute system-prompt instructions
description: Why a special chat mode (e.g. document generation) can silently degrade into a normal chat answer even though the system prompt looks correct.
---

The Ask-tab send flow wraps the user's raw message in DuckDuckGo search snippets before sending it
to the AI ("[Web search results for: ...] ... User: <original message>") whenever the message isn't a
short greeting. This is fine for normal Q&A, but for a special mode whose entire point is a clean topic
prompt (e.g. "document mode", which appends a DOCUMENT_MODE_INSTRUCTION system prompt expecting a
structured long-form write-up), wrapping the topic in search-result noise buries the actual ask and the
model responds like a search-summary answer instead of following the mode's instruction — even though
every other part of the mode's wiring (flag passed, system prompt appended, metadata set, download
buttons gated on isDone) is completely correct.

**Why:** all the mode-specific plumbing can be verified correct by static reading and still not work,
because the bug is in an unrelated shared code path (generic search enrichment) that runs before the
mode-specific system prompt gets a clean input to work with.

**How to apply:** for any special chat mode that expects the AI to treat the user message as a
specific kind of input (a topic, a command, a template variable) rather than an open question, make
sure that mode explicitly skips generic message-enrichment/rewriting steps (web search wrapping,
answer-cache lookups) — same pattern as the existing skip logic for short greetings.
