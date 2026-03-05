#!/usr/bin/env node
/**
 * Analytics Hub - Data Migration Script
 * Imports data exported from localStorage into DynamoDB.
 *
 * Usage:
 *   1. In browser DevTools console, run:
 *      copy(JSON.stringify({
 *        projects: JSON.parse(localStorage.getItem('analyticsHub_projects') || '[]'),
 *        requests: JSON.parse(localStorage.getItem('analyticsHub_requests') || '[]'),
 *        inProgress: JSON.parse(localStorage.getItem('analyticsHub_inProgress') || '[]'),
 *        reports: JSON.parse(localStorage.getItem('analyticsHub_reports') || '[]'),
 *        documents: JSON.parse(localStorage.getItem('analyticsHub_documents') || '[]'),
 *        dashboardLinks: JSON.parse(localStorage.getItem('analyticsHub_dashboardLinks') || '[]'),
 *        controlItems: JSON.parse(localStorage.getItem('analyticsHub_controlItems') || '[]')
 *      }))
 *   2. Paste into a file called export.json
 *   3. Run: node scripts/seed-data.js export.json
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, BatchWriteCommand } = require('@aws-sdk/lib-dynamodb');
const fs = require('fs');
const path = require('path');

const ENV = process.env.ENVIRONMENT || 'dev';
const REGION = process.env.AWS_REGION || 'us-east-1';
const PREFIX = `analytics-hub-${ENV}`;

const TABLE_MAP = {
  projects: `${PREFIX}-projects`,
  requests: `${PREFIX}-requests`,
  inProgress: `${PREFIX}-in-progress`,
  reports: `${PREFIX}-reports`,
  documents: `${PREFIX}-documents`,
  dashboardLinks: `${PREFIX}-dashboard-links`,
  controlItems: `${PREFIX}-control-items`
};

const client = new DynamoDBClient({ region: REGION });
const docClient = DynamoDBDocumentClient.from(client);

async function batchWrite(tableName, items) {
  // DynamoDB batch write supports max 25 items per request
  const batches = [];
  for (let i = 0; i < items.length; i += 25) {
    batches.push(items.slice(i, i + 25));
  }

  for (const batch of batches) {
    const params = {
      RequestItems: {
        [tableName]: batch.map(item => ({
          PutRequest: { Item: item }
        }))
      }
    };
    await docClient.send(new BatchWriteCommand(params));
  }
}

async function main() {
  const inputFile = process.argv[2];
  if (!inputFile) {
    console.error('Usage: node scripts/seed-data.js <export.json>');
    process.exit(1);
  }

  const filePath = path.resolve(inputFile);
  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    process.exit(1);
  }

  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

  console.log(`Seeding data into DynamoDB (env: ${ENV}, region: ${REGION})...\n`);

  for (const [key, tableName] of Object.entries(TABLE_MAP)) {
    const items = data[key] || [];
    if (items.length === 0) {
      console.log(`  ${tableName}: 0 items (skipped)`);
      continue;
    }
    await batchWrite(tableName, items);
    console.log(`  ${tableName}: ${items.length} items written`);
  }

  console.log('\nDone! All data has been imported.');
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
