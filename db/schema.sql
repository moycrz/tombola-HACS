PRAGMA foreign_keys = ON;

DROP TABLE IF EXISTS draws;
DROP TABLE IF EXISTS prizes;
DROP TABLE IF EXISTS collaborators;

CREATE TABLE collaborators (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  attended INTEGER NOT NULL DEFAULT 0,
  has_won INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE prizes (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  is_assigned INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE draws (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  collaborator_id TEXT NOT NULL,
  collaborator_name TEXT NOT NULL,
  prize_id TEXT NOT NULL,
  prize_name TEXT NOT NULL,
  draw_time TEXT NOT NULL,
  event_name TEXT NOT NULL,
  FOREIGN KEY (collaborator_id) REFERENCES collaborators(id),
  FOREIGN KEY (prize_id) REFERENCES prizes(id)
);
