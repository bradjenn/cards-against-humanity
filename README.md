# Cards Against Humanity

A real-time multiplayer web version of the party game for horrible people. Play with friends online - no physical cards required.

## Features

- **Real-time Multiplayer** - Play with 3+ friends in real-time using Supabase Realtime
- **Live Presence** - See who's connected with automatic disconnect detection
- **Multiple Card Packs** - Choose from different card packs when creating a game
- **Judge Rotation** - Automatic judge rotation each round
- **Winner Celebrations** - Confetti and GIFs when you win a round
- **Global Leaderboard** - Track the funniest players across all games
- **Player Statistics** - View your personal stats and ranking
- **Late Join Support** - Players can join games already in progress
- **Mobile Friendly** - Responsive design works on any device

## Tech Stack

- **Framework**: [TanStack Start](https://tanstack.com/start) (React 19 + SSR)
- **Routing**: [TanStack Router](https://tanstack.com/router) (file-based)
- **Database & Realtime**: [Supabase](https://supabase.com)
- **Styling**: [Tailwind CSS](https://tailwindcss.com) + [DaisyUI](https://daisyui.com)
- **Testing**: [Vitest](https://vitest.dev) + [Playwright](https://playwright.dev)
- **Server**: [Nitro](https://nitro.unjs.io)

## Getting Started

### Prerequisites

- Node.js 18+
- npm
- A Supabase project

### Environment Setup

Create a `.env` file in the root directory:

```bash
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Installation

```bash
# Install dependencies
npm install

# Start development server (runs on http://localhost:3000)
npm run dev
```

### Database Setup

Run the Supabase migrations to set up your database schema, then seed the card data:

```bash
# Apply migrations
npx supabase db push

# Seed cards (run the edge function or import directly)
```

## Development

```bash
# Start dev server
npm run dev

# Run unit tests
npm run test

# Run E2E tests
npm run test:e2e

# Run E2E tests with UI
npm run test:e2e:ui

# Build for production
npm run build

# Preview production build
npm run preview
```

## How to Play

1. **Create a Game** - Enter your name, select card packs, and create a new game
2. **Share the Link** - Send the game URL to your friends (3+ players required)
3. **Start the Game** - Once everyone's joined, the host starts the game
4. **Each Round**:
   - A black card with a prompt is shown
   - Non-judge players submit white cards from their hand
   - The judge reveals submissions and picks the funniest
   - The winner gets a point and the judge rotates
5. **Keep Playing** - Continue until you've had enough laughs

## Project Structure

```
src/
├── components/     # React components
│   ├── game/       # Lobby and game setup components
│   └── round/      # Round gameplay components
├── domain/         # Pure business logic (rules, deck management)
├── hooks/          # Custom React hooks
├── lib/            # Utilities and Supabase client
├── loaders/        # Route loaders for data fetching
├── queries/        # Database query functions
├── routes/         # File-based routes (pages)
├── server/         # Server functions (game logic)
├── services/       # Client-side service functions
└── types/          # TypeScript type definitions
```

## License

This project is for personal/educational use. Cards Against Humanity is a trademark of Cards Against Humanity LLC.
