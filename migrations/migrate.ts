import fs from 'fs';
import path from 'path';
import { Pool } from 'pg';
import { loadEnvConfig } from '@next/env';

// Load environment variables from .env.local or .env using Next.js helper
loadEnvConfig(path.join(__dirname, '..'));

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('❌ Error: DATABASE_URL environment variable is not defined.');
  process.exit(1);
}

const pool = new Pool({
  connectionString,
  ssl: connectionString.includes('neon.tech')
    ? { rejectUnauthorized: false }
    : undefined,
});

async function runMigration() {
  console.log('🚀 Starting PostgreSQL migration...');

  const schemaPath = path.join(__dirname, 'schema.sql');
  const dbJsonPath = path.join(__dirname, '../src/data/db.json');

  const client = await pool.connect();

  try {
    // 1. Create table using schema.sql
    if (fs.existsSync(schemaPath)) {
      console.log('📄 Executing schema.sql to set up tables...');
      const schemaSql = fs.readFileSync(schemaPath, 'utf8');
      await client.query(schemaSql);
      console.log('✅ Database schema initialized successfully.');
    } else {
      console.warn('⚠️ Warning: schema.sql file not found. Skipping table creation.');
    }

    // 2. Read and parse db.json
    if (fs.existsSync(dbJsonPath)) {
      console.log(`📂 Reading existing data from ${dbJsonPath}...`);
      const fileContent = fs.readFileSync(dbJsonPath, 'utf8');
      const cases = JSON.parse(fileContent);

      if (!Array.isArray(cases)) {
        throw new Error('db.json format is invalid: expected an array of cases.');
      }

      console.log(`🔄 Found ${cases.length} cases to migrate.`);
      let insertedCount = 0;

      for (const caseData of cases) {
        // Map types correctly
        const sql = `
          INSERT INTO "ofis-farmer".cases (
            case_id, phone_no, image_url, ai_response_farmer, ai_response_dashboard, 
            status, expert_diagnosis, expert_recommendation, message_to_farmer, created_at, resolved_at
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
          ON CONFLICT (case_id)
          DO NOTHING -- Avoid duplicates, don't overwrite if they exist
        `;

        const params = [
          caseData.caseId,
          caseData.phoneNo,
          caseData.imageUrl,
          caseData.aiResponseFarmer,
          caseData.aiResponseDashboard,
          caseData.status,
          caseData.expertDiagnosis || null,
          caseData.expertRecommendation || null,
          caseData.messageToFarmer || null,
          caseData.createdAt ? new Date(caseData.createdAt) : new Date(),
          caseData.resolvedAt ? new Date(caseData.resolvedAt) : null,
        ];

        const result = await client.query(sql, params);
        if (result.rowCount && result.rowCount > 0) {
          insertedCount++;
        }
      }

      console.log(`🎉 Migration finished! Successfully migrated ${insertedCount} new cases into PostgreSQL.`);
    } else {
      console.log('ℹ️ No existing db.json file found to migrate. PostgreSQL schema is initialized.');
    }
  } catch (error) {
    const err = error as Error;
    console.error('❌ Migration failed:', err.message);
    console.error(err.stack);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration();
