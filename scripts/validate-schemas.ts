#!/usr/bin/env ts-node

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import Ajv from 'ajv';
import ajvFormats from 'ajv-formats';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ajv = new Ajv({ allErrors: true, strict: true });
ajvFormats(ajv);

// Load schema
const schemaPath = path.join(__dirname, '../src/schemas/problem.schema.json');
const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf-8'));
const validate = ajv.compile(schema);

// Find all problem files
const problemsDir = path.join(__dirname, '../src/data/problems');
const problemFiles = fs.readdirSync(problemsDir)
  .filter(file => file.endsWith('.json'))
  .sort();

let hasErrors = false;

console.log('🔍 Validating problem schemas...\n');

for (const file of problemFiles) {
  const filePath = path.join(problemsDir, file);
  const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  
  const valid = validate(data);
  
  if (valid) {
    console.log(`✅ ${file}`);
  } else {
    hasErrors = true;
    console.log(`❌ ${file}`);
    if (validate.errors) {
      validate.errors.forEach(error => {
        console.log(`   - ${error.instancePath} ${error.message}`);
      });
    }
  }
}

console.log('');

if (hasErrors) {
  console.log('❌ Schema validation failed');
  process.exit(1);
} else {
  console.log('✅ All schemas valid');
  process.exit(0);
}
