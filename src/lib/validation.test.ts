import { test } from 'node:test';
import assert from 'node:assert';
import { validateCasePayload } from './validation';

test('validateCasePayload - Valid payload with string dashboard response', () => {
  const payload = {
    caseId: 'case-101',
    phoneNo: '1234567890',
    imageUrl: 'https://example.com/leaf.jpg',
    aiResponseFarmer: 'Your crop has cacao black pod disease.',
    aiResponseDashboard: 'High probability of cacao black pod disease.',
    status: 'EXPERT_REVIEW_REQUIRED'
  };

  const result = validateCasePayload(payload);
  assert.strictEqual(result.isValid, true);
  assert.strictEqual(result.errors.length, 0);
  assert.strictEqual(result.validatedPayload.caseId, 'case-101');
  assert.strictEqual(result.validatedPayload.aiResponseDashboard, 'High probability of cacao black pod disease.');
});

test('validateCasePayload - Valid payload with object dashboard response', () => {
  const payload = {
    caseId: 'case-102',
    phoneNo: '1234567890',
    imageUrl: 'https://example.com/leaf.jpg',
    aiResponseFarmer: 'Your crop has cacao black pod disease.',
    aiResponseDashboard: { disease: 'cacao black pod', confidence: 0.92 },
    status: 'EXPERT_REVIEW_REQUIRED'
  };

  const result = validateCasePayload(payload);
  assert.strictEqual(result.isValid, true);
  assert.strictEqual(result.errors.length, 0);
  assert.strictEqual(result.validatedPayload.aiResponseDashboard, '{"disease":"cacao black pod","confidence":0.92}');
});

test('validateCasePayload - Missing fields', () => {
  const payload = {
    caseId: 'case-103',
    // phoneNo is missing
    imageUrl: 'https://example.com/leaf.jpg',
    aiResponseFarmer: 'Your crop has cacao black pod disease.',
    aiResponseDashboard: 'High probability of cacao black pod disease.',
    status: 'EXPERT_REVIEW_REQUIRED'
  };

  const result = validateCasePayload(payload);
  assert.strictEqual(result.isValid, false);
  assert.ok(result.errors.some(err => err.includes('phoneNo')));
});

test('validateCasePayload - aiResponseFarmer as object', () => {
  const payload = {
    caseId: 'case-104',
    phoneNo: '1234567890',
    imageUrl: 'https://example.com/leaf.jpg',
    aiResponseFarmer: { text: 'Your crop has cacao black pod disease.' }, // Invalid type
    aiResponseDashboard: 'High probability of cacao black pod disease.',
    status: 'EXPERT_REVIEW_REQUIRED'
  };

  const result = validateCasePayload(payload);
  assert.strictEqual(result.isValid, false);
  assert.ok(result.errors.some(err => err.includes('aiResponseFarmer')));
});

test('validateCasePayload - aiResponseFarmer as array', () => {
  const payload = {
    caseId: 'case-105',
    phoneNo: '1234567890',
    imageUrl: 'https://example.com/leaf.jpg',
    aiResponseFarmer: ['cacao black pod', 'high confidence'], // Invalid type
    aiResponseDashboard: 'High probability of cacao black pod disease.',
    status: 'EXPERT_REVIEW_REQUIRED'
  };

  const result = validateCasePayload(payload);
  assert.strictEqual(result.isValid, false);
  assert.ok(result.errors.some(err => err.includes('aiResponseFarmer')));
});

test('validateCasePayload - aiResponseDashboard as undefined/null', () => {
  const payload = {
    caseId: 'case-106',
    phoneNo: '1234567890',
    imageUrl: 'https://example.com/leaf.jpg',
    aiResponseFarmer: 'Your crop has cacao black pod disease.',
    aiResponseDashboard: null, // Null should be handled safely
    status: 'EXPERT_REVIEW_REQUIRED'
  };

  const result = validateCasePayload(payload);
  assert.strictEqual(result.isValid, true);
  assert.strictEqual(result.validatedPayload.aiResponseDashboard, '');
});
