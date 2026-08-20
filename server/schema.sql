CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL CHECK (char_length(name) BETWEEN 1 AND 200),
    mobile TEXT NOT NULL CHECK (mobile ~ '^[6-9][0-9]{9}$'),
    email TEXT NOT NULL CHECK (position('@' IN email) > 1),
    state TEXT,
    district TEXT,
    date_of_birth DATE,
    income NUMERIC(14, 2),
    education TEXT,
    occupation TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS documents (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    document_type TEXT NOT NULL CHECK (char_length(document_type) BETWEEN 1 AND 120),
    issued_at DATE,
    expires_at DATE,
    verification_status TEXT NOT NULL DEFAULT 'unverified' CHECK (verification_status IN ('unverified', 'verified', 'rejected')),
    added_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS documents_user_id_idx ON documents(user_id);

CREATE TABLE IF NOT EXISTS schemes (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    short_description TEXT NOT NULL,
    description TEXT NOT NULL,
    benefits TEXT NOT NULL,
    scope TEXT NOT NULL CHECK (scope IN ('central', 'state')),
    state TEXT,
    eligibility_highlight TEXT NOT NULL,
    eligibility_details TEXT NOT NULL,
    who_can_apply TEXT NOT NULL,
    age_min INTEGER CHECK (age_min IS NULL OR age_min >= 0),
    age_max INTEGER CHECK (age_max IS NULL OR age_max >= age_min),
    income_max NUMERIC(14, 2) CHECK (income_max IS NULL OR income_max >= 0),
    education_requirements TEXT,
    location_requirements TEXT,
    application_procedure TEXT NOT NULL,
    deadline TEXT,
    official_application_url TEXT NOT NULL,
    official_source_url TEXT NOT NULL,
    last_updated DATE NOT NULL,
    imported_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS scheme_documents (
    scheme_id TEXT NOT NULL REFERENCES schemes(id) ON DELETE CASCADE,
    document_type TEXT NOT NULL,
    required BOOLEAN NOT NULL DEFAULT TRUE,
    PRIMARY KEY (scheme_id, document_type)
);

CREATE TABLE IF NOT EXISTS scheme_eligibility_rules (
    scheme_id TEXT PRIMARY KEY REFERENCES schemes(id) ON DELETE CASCADE,
    rules JSONB NOT NULL DEFAULT '{}'::jsonb
);
