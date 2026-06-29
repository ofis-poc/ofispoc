-- SQL Schema for cases database

CREATE SCHEMA IF NOT EXISTS "ofis-farmer";

CREATE TABLE IF NOT EXISTS "ofis-farmer".cases (
    id SERIAL PRIMARY KEY,
    case_id VARCHAR(50) UNIQUE NOT NULL,
    phone_no VARCHAR(30),
    image_url TEXT,
    ai_response_farmer TEXT,
    ai_response_dashboard TEXT,
    status VARCHAR(50),
    expert_diagnosis TEXT,
    expert_recommendation TEXT,
    message_to_farmer TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "ofis-farmer".surveys (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'Draft',
    languages TEXT[] NOT NULL DEFAULT ARRAY['English'],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "ofis-farmer".survey_questions (
    id VARCHAR(50) PRIMARY KEY,
    survey_id VARCHAR(50) NOT NULL REFERENCES "ofis-farmer".surveys(id) ON DELETE CASCADE,
    question_en TEXT NOT NULL,
    question_hi TEXT,
    question_es TEXT,
    question_th TEXT,
    options_en TEXT[],
    options_hi TEXT[],
    options_es TEXT[],
    options_th TEXT[],
    question_type VARCHAR(50) NOT NULL,
    question_order INTEGER NOT NULL,
    required BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "ofis-farmer".listed_farmers (
    id SERIAL PRIMARY KEY,
    phone_no VARCHAR(30) UNIQUE NOT NULL,
    name VARCHAR(255),
    language VARCHAR(50) DEFAULT 'English',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "ofis-farmer".survey_assignments (
    id SERIAL PRIMARY KEY,
    survey_id VARCHAR(50) NOT NULL REFERENCES "ofis-farmer".surveys(id) ON DELETE CASCADE,
    phone_no VARCHAR(30) NOT NULL,
    assigned_at TIMESTAMP DEFAULT NOW(),
    status VARCHAR(30) DEFAULT 'PENDING',
    CONSTRAINT unique_assignment UNIQUE (survey_id, phone_no)
);


