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
