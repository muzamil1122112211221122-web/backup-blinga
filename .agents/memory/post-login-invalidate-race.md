---
name: Post-login invalidateQueries race condition
description: Why calling invalidateQueries immediately after login causes a redirect loop
---

**Rule:** After a successful login where you manually call `queryClient.setQueryData(["/api/auth/user"], user)`, do NOT call `queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] })`.

**Why:** `invalidateQueries` immediately schedules a background refetch. This refetch fires before the browser has a chance to use the session cookie set by the login response (the requests arrive at the server at 0–1ms). The cookie isn't sent, the server returns 401, and the error state triggers a redirect loop back to the login page.

**How to apply:** After login, just call `setQueryData` and navigate. The cached user data (staleTime: Infinity) will serve the chat page without any network request. For page refreshes, rely on the session cookie persisting correctly (see session-cookie-replit.md).
