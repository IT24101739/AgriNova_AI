-- ============================================================
-- AgriShield — Supabase PostgreSQL Migration
-- Feature Slice 1: Farmer Reporting + AI Analysis
-- Run this once in your Supabase SQL Editor
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- FARMS
-- ============================================================
CREATE TABLE IF NOT EXISTS farms (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    farmer_id   UUID NOT NULL,
    crop        VARCHAR(100) NOT NULL,
    latitude    DOUBLE PRECISION NOT NULL,
    longitude   DOUBLE PRECISION NOT NULL,
    district    VARCHAR(100),
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_farms_farmer_id ON farms(farmer_id);

-- ============================================================
-- REPORTS
-- ============================================================
CREATE TABLE IF NOT EXISTS reports (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    farm_id             UUID NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
    crop                VARCHAR(100) NOT NULL,
    description         TEXT,
    image_url           TEXT,
    preferred_language  VARCHAR(5) NOT NULL DEFAULT 'en',

    -- AI populated
    disease             VARCHAR(200),
    confidence          DOUBLE PRECISION,
    severity            VARCHAR(20),
    spread_risk         VARCHAR(20),

    status              VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    created_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reports_farm_id   ON reports(farm_id);
CREATE INDEX IF NOT EXISTS idx_reports_status    ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_created   ON reports(created_at DESC);

-- ============================================================
-- ANALYSIS RESULTS (populated by Member 1 AI pipeline)
-- ============================================================
CREATE TABLE IF NOT EXISTS analysis_results (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_id           UUID NOT NULL UNIQUE REFERENCES reports(id) ON DELETE CASCADE,

    -- Disease classifier output (Member 1)
    disease             VARCHAR(200),
    disease_confidence  DOUBLE PRECISION,

    -- Severity estimator output (Member 1)
    severity            VARCHAR(20),
    affected_percentage DOUBLE PRECISION,

    -- Weather / aggregation (Member 2 — leave NULL initially)
    weather_risk        VARCHAR(20),
    outbreak_risk       VARCHAR(20),
    final_confidence    DOUBLE PRECISION,
    spread_risk         VARCHAR(20)
);

CREATE INDEX IF NOT EXISTS idx_analysis_report_id ON analysis_results(report_id);

-- ============================================================
-- OFFICER TICKETS (Member 3 — created here so FK is valid)
-- ============================================================
CREATE TABLE IF NOT EXISTS officer_tickets (
    id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_id        UUID REFERENCES reports(id),
    reason           TEXT,
    priority         VARCHAR(20),
    assigned_officer UUID,
    status           VARCHAR(30) DEFAULT 'OPEN',
    created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- OUTBREAKS (Member 3)
-- ============================================================
CREATE TABLE IF NOT EXISTS outbreaks (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    disease      VARCHAR(200),
    crop         VARCHAR(100),
    latitude     DOUBLE PRECISION,
    longitude    DOUBLE PRECISION,
    radius_km    DOUBLE PRECISION,
    status       VARCHAR(30) DEFAULT 'ACTIVE',
    confirmed_at TIMESTAMPTZ
);

-- ============================================================
-- NOTIFICATIONS (shared)
-- ============================================================
CREATE TABLE IF NOT EXISTS notifications (
    id        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id   UUID NOT NULL,
    report_id UUID REFERENCES reports(id),
    type      VARCHAR(50),
    message   TEXT,
    read      BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- AI FEEDBACK (shared)
-- ============================================================
CREATE TABLE IF NOT EXISTS ai_feedback (
    id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_id         UUID REFERENCES reports(id),
    predicted_disease VARCHAR(200),
    confirmed_disease VARCHAR(200),
    confidence        DOUBLE PRECISION,
    created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- USERS (Supabase Auth manages auth.users — this extends it)
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
    id                 UUID PRIMARY KEY,  -- matches auth.users.id
    name               VARCHAR(200),
    role               VARCHAR(50) DEFAULT 'farmer',
    preferred_language VARCHAR(5)  DEFAULT 'en'
);

-- ============================================================
-- Storage bucket (run separately in Supabase dashboard or CLI)
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('crop-images', 'crop-images', true)
-- ON CONFLICT DO NOTHING;
-- ============================================================
