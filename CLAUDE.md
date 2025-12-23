# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Cards Against Humanity-style multiplayer game built with:
- **TanStack Router** (file-based routing)
- **TanStack Start** (SSR framework)
- **React 19**
- **Supabase** (database + realtime)
- **Tailwind CSS** + **DaisyUI**
- **Vitest** for testing
- **Vite** for development server
- **Nitro** for server functions

## Development Commands

```bash
# Install dependencies
npm install

# Start dev server (runs on port 3000)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run tests
npm run test
```

## Architecture

### Database Layer (Supabase)

Two Supabase clients are used:
- `src/lib/supabase.ts` - Client-side Supabase with realtime enabled
- `src/server/supabaseAdmin.ts` - Server-side "admin" client (currently using same anon key, not service role)

Environment variables required:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

### Core Data Models (`src/types/db.ts`)

- `Game` - Game state (slug, status, decks, round_number, judge_index)
- `GamePlayer` - Players in a game (name, score, is_connected)
- `Card` - White/Black cards (text, type, pick)
- `Round` - Round state (black_card_id, judge_id, winning_player_id, revealed_count)
- `PlayerHand` - Cards in player hands (many-to-many: player_id, card_id)

### Routing Structure

File-based routing in `src/routes/`:
- `index.tsx` - Home page
- `new-game.tsx` - Create new game
- `game.$slug.tsx` - Game lobby (join, start game)
- `game_.$slug.round_.$roundNumber.tsx` - Active round view

The `__root.tsx` file contains the layout with `<Outlet />` for nested routes.

### Game Flow

1. **Lobby** (`game.$slug.tsx`):
   - Players join using `src/server/game/joinGame.ts`
   - Host starts game using `src/server/game/startGame.ts`
   - Initial hands dealt via `dealWhiteHandsForPlayers.ts`
   - First round created with black card + judge

2. **Round** (`game_.$slug.round_.$roundNumber.tsx`):
   - Non-judge players submit cards via `src/services/roundService.ts`
   - Judge reveals submissions incrementally
   - Judge picks winner via `src/server/round/pickRoundWinner.ts`
   - Round advances via `src/server/round/advanceRound.ts`

3. **Round Advancement Logic** (`src/server/round/advanceRound.ts`):
   - Removes submitted cards from player hands
   - Refills each player's hand to 10 cards
   - Derives remaining white deck (all white cards minus in-hand and submitted)
   - Derives next black card (all black cards minus used ones)
   - Rotates judge using `pickNextJudge()` from `src/domain/rules.ts`
   - Creates new round and updates `game.round_number`

### Domain Logic

`src/domain/` contains pure business logic:
- `deck.ts` - Card shuffling, dealing, deck management
- `rules.ts` - Game rules (canStartGame, pickInitialJudge, pickNextJudge)

### Realtime Updates

Games use Supabase realtime for live updates:
- `useGame()` - Fetches game by slug and subscribes to realtime changes
- `useRound()` - Syncs round state and submission counts
- `usePlayers()` - Fetches players and subscribes to changes
- `usePresence()` - Tracks player connection status via Supabase Presence API
- `usePlayersWithPresence()` - Combines players with live presence state

### Server Functions

Server functions use TanStack Start's `createServerFn`:
- Located in `src/server/game/` and `src/server/round/`
- Handle game creation, starting, round advancement, winner selection
- Use `supabaseAdmin()` for server-side database access

### Path Aliases

The project uses `@/*` to import from `src/`:
```tsx
import { useGame } from "@/hooks/useGame";
```

Configured in `tsconfig.json` and `vite.config.ts` with `vite-tsconfig-paths`.

### State Management

Local player ID stored in localStorage via `useLocalPlayerId` hook. Used to:
- Identify current player across page refreshes
- Track connection status
- Determine if player is host (created_by matches)
- Determine if player is judge

### Testing

Uses Vitest with `@testing-library/react` and `jsdom`:
- Run all tests: `npm run test`

### Styling

- Tailwind CSS v4 with `@tailwindcss/vite` plugin
- DaisyUI component library for UI components
- Custom components in `src/components/`

## Key Implementation Details

### Late Join Flow
Players can join mid-game. When joining an in-progress game:
1. Player is added to `game_players` table
2. `dealLateJoinHand()` deals them 10 cards
3. Player navigates directly to current round

### Judge Rotation
Judge rotates through players in join order (`joined_at` ASC):
- `game.judge_index` tracks current judge position
- `pickNextJudge()` advances: `(currentIndex + 1) % players.length`

### Card Management
- Decks stored as arrays of card IDs in `games.white_deck` and `games.black_deck`
- Round advancement derives remaining decks dynamically by excluding:
  - White: cards in player hands + submitted cards
  - Black: cards already used in previous rounds
- Cards shuffled on each derivation

### Realtime Patterns
Custom hooks combine initial loader data with realtime subscriptions:
```tsx
const game = useGameRealtime(loaderData.game);
const { round } = useRoundRealtime({ initialRound: loaderData.round });
```

This ensures immediate data on page load, then live updates.

## Common Development Tasks

### Adding a New Route
1. Create file in `src/routes/` (e.g., `my-route.tsx`)
2. TanStack Router auto-generates route config
3. Use `createFileRoute()` to define component and loader

### Adding Database Query
1. Add query function to appropriate file in `src/queries/`
2. Or create service function in `src/services/`
3. Use TypeScript types from `src/types/db.ts`

### Adding Realtime Subscription
1. Use Supabase's `.on()` method with channel subscription
2. Wrap in useEffect for cleanup
3. Update local state when realtime events arrive
