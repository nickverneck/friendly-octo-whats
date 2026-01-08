# friendly-octo-whats

Runs an hourly calendar check for today's events (Eastern time by default), matches events by title substring, extracts a group name from the description, looks up the group ID in Google Sheets, and sends a Wassenger group message using a configurable template. Also exposes a webhook to sync the latest sheet row to Wassenger group IDs.

Notes:
- Wassenger group IDs are typically WIDs like `1234567890-123456@g.us`.

## Setup

1) Copy config and env files:

```bash
cp config.example.toml config.toml
cp .env.example .env
```

2) Fill in `config.toml` and `.env`.

3) Install dependencies:

```bash
bun install
```

## Run

```bash
bun run src/index.ts
```

The webhook listens at `http://localhost:3000/webhook` by default.
