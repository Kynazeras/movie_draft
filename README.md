# Movie Draft

**Draft movies with friends. Debate who won.**

Movie Draft is a real-time multiplayer app where users create draft rooms, invite friends, and take turns picking movies across custom categories using a snake-draft format. Think fantasy football, but for film lovers.

## Features

- 🎬 **Movie Search** — Search for any movie powered by [The Movie Database (TMDB)](https://www.themoviedb.org/)
- 🏠 **Draft Rooms** — Create rooms with custom categories (e.g. "Best Sci-Fi", "Most Underrated", "Guilty Pleasure")
- 🔄 **Snake Draft** — Fair turn order that reverses each round so no one always picks last
- ⚡ **Real-time Updates** — Live pick tracking via WebSockets (Socket.io) — everyone sees picks instantly
- 🔐 **Authentication** — Register and log in with email/password; JWT-based sessions
- 📨 **Invite Links** — Share a unique invite code or link so friends can join your room

## Tech Stack

| Layer    | Technology                                                   |
| -------- | ------------------------------------------------------------ |
| Frontend | React 19, React Router, Redux Toolkit, Tailwind CSS v4, Vite |
| Backend  | Hono (Node.js), Socket.io                                    |
| Database | PostgreSQL via Prisma ORM                                    |
| Monorepo | Nx                                                           |

## Project Structure

```
apps/
  client/     # React frontend (Vite, port 4200)
  server/     # Hono API + Socket.io server (port 3000)
libs/
  prisma-client/  # Shared Prisma client and schema
  shared/         # Shared utilities
```

## Prerequisites

- [Node.js](https://nodejs.org/) v20+
- [Docker](https://www.docker.com/) (for the database)
- A free [TMDB API key](https://developer.themoviedb.org/docs/getting-started)

## Getting Started

### 1. Install dependencies

```sh
npm install
```

### 2. Configure environment variables

Create a `.env` file in the project root:

```dotenv
# Database
DATABASE_URL="postgresql://movie_draft:movie_draft_dev@localhost:5432/movie_draft"

# Auth — change this in production
AUTH_SECRET="your-secret-key"

# TMDB API key (https://developer.themoviedb.org/docs/getting-started)
TMDB_API_KEY="your-tmdb-api-key"

# Optional overrides
PORT=3000
NODE_ENV=development
CORS_ORIGIN=http://localhost:4200
```

### 3. Start the database

```sh
docker compose up -d
```

This starts a PostgreSQL 16 container (`movie_draft_db`) on port `5432`.

### 4. Run database migrations

```sh
npx prisma migrate deploy --schema=libs/prisma-client/prisma/schema.prisma
```

### 5. Start the server

```sh
npx nx serve server
```

The API will be available at `http://localhost:3000`.

### 6. Start the client

In a separate terminal:

```sh
npx nx serve client
```

The app will be available at `http://localhost:4200`.

## Running Everything

You can start both the client and server in parallel with a single Nx command:

```sh
npx nx run-many -t serve -p client server
```

## API Overview

| Method | Path                    | Description            |
| ------ | ----------------------- | ---------------------- |
| `GET`  | `/health`               | Health check           |
| `POST` | `/auth/register`        | Register a new account |
| `POST` | `/auth/login`           | Log in                 |
| `GET`  | `/rooms`                | List your draft rooms  |
| `POST` | `/rooms`                | Create a draft room    |
| `GET`  | `/rooms/:id`            | Get room details       |
| `POST` | `/draft/:roomId/start`  | Start the draft        |
| `POST` | `/draft/:roomId/pick`   | Make a pick            |
| `GET`  | `/movies/search`        | Search movies via TMDB |
| `GET`  | `/movies/lists/popular` | Get popular movies     |

WebSocket events are served on the same port as the API (`ws://localhost:3000`).

## Database

The schema is defined in [libs/prisma-client/prisma/schema.prisma](libs/prisma-client/prisma/schema.prisma) and includes:

- **User** — accounts and authentication
- **DraftRoom** — a named room with an invite code and draft status (`WAITING`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED`)
- **Category** — custom draft categories within a room (e.g. "Best Horror")
- **Participant** — a user's membership in a room, including their draft position
- **Pick** — a movie picked by a participant for a category, storing TMDB movie metadata

To open Prisma Studio (visual DB browser):

```sh
npx prisma studio --schema=libs/prisma-client/prisma/schema.prisma
```

## Useful Commands

```sh
# Lint all projects
npx nx run-many -t lint

# Run all tests
npx nx run-many -t test

# Build for production
npx nx run-many -t build

# Visualize the project graph
npx nx graph
```

## Troubleshooting

### `nx serve` hangs on "Waiting for task..." indefinitely

This is caused by a stuck Nx daemon. Stop it and reset the workspace cache, then retry:

```sh
npx nx daemon --stop
npx nx reset
npx nx serve server
```
