CREATE TABLE IF NOT EXISTS SQ_Project (
	id TEXT PRIMARY KEY,
	semester TEXT NOT NULL,
	hw TEXT NOT NULL,
	student TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS SQ_Issue (
	id TEXT PRIMARY KEY,
	project_id TEXT NOT NULL,
	debt TEXT,
	effort TEXT,
	message TEXT,
	rule TEXT,
    severity TEXT,
	type TEXT
);