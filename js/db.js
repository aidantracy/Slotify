// Database layer for Slotify, built on libSQL (a SQLite fork).
//
// The same code runs in two modes, chosen by environment variables:
//   - Local development: DATABASE_URL="file:slotify.db" (a plain SQLite file)
//   - Production:        DATABASE_URL="libsql://<your-db>.turso.io"
//                        DATABASE_AUTH_TOKEN="<token from Turso>"
//
// See .env.example. If DATABASE_URL is unset, we default to a local file so the
// app just works out of the box.

import { createClient } from '@libsql/client';

const url = process.env.DATABASE_URL || 'file:slotify.db';
const authToken = process.env.DATABASE_AUTH_TOKEN; // only needed for Turso

export const db = createClient({ url, authToken });

// Create tables if they don't exist and make sure a default provider exists.
// Called once on server startup.
export async function initDb() {
  await db.executeMultiple(`
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS users (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      created_at    TEXT NOT NULL DEFAULT (datetime('now')),
      email_address TEXT,
      first_name    TEXT,
      last_name     TEXT,
      password      TEXT
    );

    CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users(email_address);

    CREATE TABLE IF NOT EXISTS bookings (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      created_at    TEXT NOT NULL DEFAULT (datetime('now')),
      start_time    TEXT,
      end_time      TEXT,
      date          TEXT,
      provider_id   INTEGER NOT NULL,
      email_address TEXT,
      first_name    TEXT,
      last_name     TEXT,
      FOREIGN KEY (provider_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS time_intervals (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      created_at    TEXT NOT NULL DEFAULT (datetime('now')),
      time_interval INTEGER DEFAULT 30,
      user_id       INTEGER,
      FOREIGN KEY (user_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE
    );

    -- Per-provider booking availability. One row per user; sensible defaults
    -- (9 AM–5 PM, 30-minute slots, Monday–Friday) apply when no row exists.
    CREATE TABLE IF NOT EXISTS availability (
      user_id      INTEGER PRIMARY KEY,
      start_hour   INTEGER NOT NULL DEFAULT 9,
      end_hour     INTEGER NOT NULL DEFAULT 17,
      slot_minutes INTEGER NOT NULL DEFAULT 30,
      days         TEXT NOT NULL DEFAULT '1,2,3,4,5',
      FOREIGN KEY (user_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE
    );
  `);

  // Seed a demo provider (id = 1) so there's an account to log in with and a
  // provider to book right away. Login: demo@slotify.local / password123
  // The password below is a bcrypt hash of "password123".
  const demoHash = '$2b$10$JtEUKwfMK4HZoDboVTXJq.4AlUUNuKcEO.KvaaR6g0lC0BXPOMNOa';
  await db.execute({
    sql: `INSERT OR IGNORE INTO users (id, first_name, last_name, email_address, password)
          VALUES (1, 'Demo', 'Provider', 'demo@slotify.local', ?)`,
    args: [demoHash],
  });
}
