---
name: Blinga Games Architecture
description: Key decisions about blinga-games.tsx structure — logos, store catalog, leaderboard
---

## Game logos
- Free game logos: string paths like `/game-memory-match.png` (served from client/public/)
- Files: game-brain-quiz.png, game-car-dodge.png, game-speed-math.png, game-word-scramble.png, game-memory-match.png, game-odd-one-out.png, game-rps.png, game-tictactoe.png
- Previously used webpack `@assets/` imports — migrated to public paths for simplicity

**Why:** New logo assets were provided and copying to public/ is simpler than managing asset imports.

## Store catalog
- Only 2 premium games: Tic-Tac-Toe (30 fragments) and Rock Paper Scissors (15 fragments)
- STORE_CATALOG uses the same public path logos
- Store grid is 2 columns (was 3)

## Leaderboard
- Polls `/api/games/leaderboard` every 30 seconds (setInterval)
- Podium slots defined explicitly: `[{rank:2,silver}, {rank:1,gold}, {rank:3,bronze}]` visual order
- When fewer than 3 leaders exist, empty slots show dashed placeholder (preserves layout)
- Category filter by bestGame.game matching a category map
- Time filter tabs (Day/Week/Month/All Time) are visual only — server returns all-time data

**Why:** Explicit slot mapping avoids bugs when top3 has 1 or 2 entries (previously podiumOrder logic was index-dependent).

## Owned games
- Owned games section only renders when myPurchased.length > 0
- Free games always show as logo-only 3-column grid (no text description cards)
