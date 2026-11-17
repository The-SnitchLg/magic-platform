#!/usr/bin/env node

/**
 * Secret & Credential Leakage Scanner
 * Scans all committed and staged files to enforce zero-leakage policy for
 * administrator credentials, secret keys, passwords, and sensitive tokens.
 */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const FORBIDDEN_PATTERNS = [
  /password\s*[:=]\s*['"][^'"]{8,}['"]/i,
  /service_role\s*[:=]\s*['"]ey[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*['"]/i,
  /SUPABASE_SERVICE_ROLE_KEY\s*=\s*['"][A-Za-z0-9-_.]+['"]/i,
  /ghp_[A-Za-z0-9]{36}/,
  /github_pat_[A-Za-z0-9_]{82}/,
  /sk-[A-Za-z0-9]{32,}/,
  /BEGIN (RSA|EC|OPENSSH|PGP) PRIVATE KEY/
];

const IGNORED_DIRS = new Set([
  'node_modules',
  '.git',
  'dist',
  'build',
  'coverage',
  '.gemini',
  '.supabase'
]);

function scanDirectory(dir, issues = []) {
  const entries = readdirSync(dir);
  for (const entry of entries) {
    if (IGNORED_DIRS.has(entry)) continue;
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);

    if (stat.isDirectory()) {
      scanDirectory(fullPath, issues);
    } else if (stat.isFile()) {
      // Skip binary files and this scanner itself
      if (entry.endsWith('.png') || entry.endsWith('.jpg') || entry.endsWith('.ico') || entry === 'scan-secrets.mjs') {
        continue;
      }
      try {
        const content = readFileSync(fullPath, 'utf-8');
        for (const pattern of FORBIDDEN_PATTERNS) {
          if (pattern.test(content)) {
            issues.push({
              file: relative(process.cwd(), fullPath),
              pattern: pattern.toString()
            });
          }
        }
      } catch {
        // Skip unreadable files
      }
    }
  }
  return issues;
}

const issues = scanDirectory(process.cwd());

if (issues.length > 0) {
  console.error('\x1b[31m[SECURITY ALERT] Potential secrets or forbidden credential patterns detected:\x1b[0m');
  for (const issue of issues) {
    console.error(` - ${issue.file}: matched ${issue.pattern}`);
  }
  console.error('\x1b[31mOperation halted per Mandatory Credential Confidentiality Policy.\x1b[0m');
  process.exit(1);
} else {
  console.log('\x1b[32m[SECURITY CHECK PASSED] No secrets or credential leaks detected.\x1b[0m');
  process.exit(0);
}
