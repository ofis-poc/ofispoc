import fs from 'fs';
import path from 'path';
import { Case, CaseStats } from './types';

// Path to the local JSON database (used for local development and fallback)
const DB_FILE_PATH = path.join(process.cwd(), 'src', 'data', 'db.json');

// In-memory cache for serverless environments where filesystem writes are not persistent
let inMemoryCasesCache: Case[] | null = null;

// Helper to load cases
export async function getCases(): Promise<Case[]> {
  // Check if Google Sheets configuration is present
  if (
    process.env.GOOGLE_SHEETS_SPREADSHEET_ID &&
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL &&
    process.env.GOOGLE_PRIVATE_KEY
  ) {
    try {
      return await fetchCasesFromGoogleSheets();
    } catch (error) {
      console.error('Failed to fetch from Google Sheets, falling back to local storage:', error);
    }
  }

  // Fallback to local storage (JSON file or memory cache)
  if (inMemoryCasesCache) {
    return inMemoryCasesCache;
  }

  try {
    if (fs.existsSync(DB_FILE_PATH)) {
      const fileData = await fs.promises.readFile(DB_FILE_PATH, 'utf-8');
      const cases = JSON.parse(fileData) as Case[];
      inMemoryCasesCache = cases;
      return cases;
    }
  } catch (error) {
    console.error('Error reading local db.json:', error);
  }

  // Fallback to empty array if all else fails
  return [];
}

// Helper to save a single case or update an existing one
export async function saveCase(caseData: Case): Promise<boolean> {
  const cases = await getCases();
  const existingIndex = cases.findIndex((c) => c.caseId === caseData.caseId);

  if (existingIndex >= 0) {
    cases[existingIndex] = { ...cases[existingIndex], ...caseData };
  } else {
    cases.push(caseData);
  }

  inMemoryCasesCache = cases;

  // Sync to Google Sheets if configured
  if (
    process.env.GOOGLE_SHEETS_SPREADSHEET_ID &&
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL &&
    process.env.GOOGLE_PRIVATE_KEY
  ) {
    try {
      await saveCaseToGoogleSheets(caseData);
      return true;
    } catch (error) {
      console.error('Failed to save to Google Sheets, falling back to local file:', error);
    }
  }

  // Save to local JSON file (will work in local dev, might be read-only on Vercel)
  try {
    const dir = path.dirname(DB_FILE_PATH);
    if (!fs.existsSync(dir)) {
      await fs.promises.mkdir(dir, { recursive: true });
    }
    await fs.promises.writeFile(DB_FILE_PATH, JSON.stringify(cases, null, 2), 'utf-8');
    return true;
  } catch (error) {
    console.warn('Local database file write ignored (likely running in read-only environment like Vercel):', error);
    return true; // Return true because it was successfully saved in memory cache
  }
}

// Get case by ID
export async function getCaseById(id: string): Promise<Case | null> {
  const cases = await getCases();
  return cases.find((c) => c.caseId === id) || null;
}

// Update case status or attributes
export async function updateCase(id: string, updates: Partial<Case>): Promise<Case | null> {
  const caseItem = await getCaseById(id);
  if (!caseItem) return null;

  const updatedCase = {
    ...caseItem,
    ...updates,
  };

  const success = await saveCase(updatedCase);
  return success ? updatedCase : null;
}

// Calculate Statistics
export async function getStats(): Promise<CaseStats> {
  const cases = await getCases();
  
  const totalCases = cases.length;
  const pendingReviews = cases.filter((c) => c.status === 'EXPERT_REVIEW_REQUIRED').length;
  const resolvedCases = cases.filter((c) => c.status === 'RESOLVED').length;
  const highConfidenceCases = cases.filter((c) => c.status === 'HIGH_CONFIDENCE').length;

  return {
    totalCases,
    pendingReviews,
    resolvedCases,
    highConfidenceCases,
  };
}

// ==========================================
// GOOGLE SHEETS REST API IMPLEMENTATION
// ==========================================
// This section implements Google Sheets integration using standard Google REST APIs.
// Avoids heavy external client libraries while staying deployable in any JS runtime.

interface GoogleTokenResponse {
  access_token: string;
  expires_in: number;
}

let googleAccessTokenCache: string | null = null;
let googleAccessTokenExpiry = 0;

// Helper to sign JWT manually for Google Service Account (OAuth 2.0 Server-to-Server)
async function getGoogleAccessToken(): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  
  if (googleAccessTokenCache && now < googleAccessTokenExpiry) {
    return googleAccessTokenCache;
  }

  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  // Handle private keys that might have escaped newlines in environment variables
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!clientEmail || !privateKey) {
    throw new Error('Google Sheets credentials are not fully configured.');
  }

  // Create JWT Header and Claim Set
  const header = { alg: 'RS256', typ: 'JWT' };
  const claim = {
    iss: clientEmail,
    scope: 'https://www.googleapis.com/auth/spreadsheets',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now,
  };

  // Convert Header and Claim to Base64URL
  const base64UrlHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
  const base64UrlClaim = Buffer.from(JSON.stringify(claim)).toString('base64url');
  const signatureInput = `${base64UrlHeader}.${base64UrlClaim}`;

  // Sign with RSA-SHA256 using native crypto
  const crypto = await import('crypto');
  const sign = crypto.createSign('RSA-SHA256');
  sign.update(signatureInput);
  const signature = sign.sign(privateKey, 'base64url');

  const jwt = `${signatureInput}.${signature}`;

  // Post to token endpoint
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Google OAuth failed: ${errorText}`);
  }

  const data = (await response.json()) as GoogleTokenResponse;
  googleAccessTokenCache = data.access_token;
  googleAccessTokenExpiry = now + data.expires_in - 60; // 1 min buffer
  
  return data.access_token;
}

// Fetches cases from the configured Google Spreadsheet
async function fetchCasesFromGoogleSheets(): Promise<Case[]> {
  const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
  const range = process.env.GOOGLE_SHEETS_RANGE || 'Sheet1!A2:K1000'; // Exclude header row (A1:K1)
  
  const token = await getGoogleAccessToken();
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Google Sheets API fetch error: ${errorText}`);
  }

  const result = await response.json();
  const rows = result.values as string[][] | undefined;
  
  if (!rows || rows.length === 0) {
    return [];
  }

  return rows.map((row) => ({
    caseId: row[0] || '',
    phoneNo: row[1] || '',
    imageUrl: row[2] || '',
    aiResponseFarmer: row[3] || '',
    aiResponseDashboard: row[4] || '',
    status: (row[5] || 'EXPERT_REVIEW_REQUIRED') as Case['status'],
    createdAt: row[6] || '',
    expertDiagnosis: row[7] || undefined,
    expertRecommendation: row[8] || undefined,
    messageToFarmer: row[9] || undefined,
    resolvedAt: row[10] || undefined,
  }));
}

// Saves/Updates a case in the Google Spreadsheet
async function saveCaseToGoogleSheets(caseData: Case): Promise<void> {
  const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
  const token = await getGoogleAccessToken();

  // Step 1: Check if the case already exists in the sheet to decide update vs append
  const checkRange = process.env.GOOGLE_SHEETS_RANGE || 'Sheet1!A:A';
  const checkUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(checkRange)}`;
  
  const checkResponse = await fetch(checkUrl, {
    headers: { Authorization: `Bearer ${token}` },
  });

  let existingRowIndex = -1;

  if (checkResponse.ok) {
    const result = await checkResponse.json();
    const values = result.values as string[][] | undefined;
    if (values) {
      existingRowIndex = values.findIndex((row) => row[0] === caseData.caseId);
    }
  }

  const rowValues = [
    caseData.caseId,
    caseData.phoneNo,
    caseData.imageUrl,
    caseData.aiResponseFarmer,
    caseData.aiResponseDashboard,
    caseData.status,
    caseData.createdAt,
    caseData.expertDiagnosis || '',
    caseData.expertRecommendation || '',
    caseData.messageToFarmer || '',
    caseData.resolvedAt || '',
  ];

  if (existingRowIndex >= 0) {
    // Update existing row (index is 0-based, spreadsheet is 1-based, index+1)
    const sheetName = checkRange.includes('!') ? checkRange.split('!')[0] : 'Sheet1';
    const rowNumber = existingRowIndex + 1;
    const updateRange = `${sheetName}!A${rowNumber}:K${rowNumber}`;
    const updateUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(updateRange)}?valueInputOption=USER_ENTERED`;

    const response = await fetch(updateUrl, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        range: updateRange,
        majorDimension: 'ROWS',
        values: [rowValues],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Google Sheets API update error: ${errorText}`);
    }
  } else {
    // Append new row
    const appendRange = process.env.GOOGLE_SHEETS_RANGE || 'Sheet1!A:K';
    const appendUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(appendRange)}:append?valueInputOption=USER_ENTERED`;

    const response = await fetch(appendUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        range: appendRange,
        majorDimension: 'ROWS',
        values: [rowValues],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Google Sheets API append error: ${errorText}`);
    }
  }
}
