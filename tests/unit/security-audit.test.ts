import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

describe('Security, Confidentiality & Terminology Scanner Verification', () => {
  it('confirms .gitignore excludes environment files and secret keys', () => {
    const gitignorePath = join(process.cwd(), '.gitignore');
    expect(existsSync(gitignorePath)).toBe(true);

    const content = readFileSync(gitignorePath, 'utf-8');
    expect(content).toContain('.env');
    expect(content).toContain('secrets/');
    expect(content).toContain('*.key');
  });

  it('confirms .env.example contains zero real secrets or credentials', () => {
    const envExamplePath = join(process.cwd(), '.env.example');
    expect(existsSync(envExamplePath)).toBe(true);

    const content = readFileSync(envExamplePath, 'utf-8');
    expect(content).not.toMatch(/password\s*[:=]\s*['"][^'"]+['"]/i);
    expect(content).not.toContain('service_role');
  });

  it('verifies that the bootstrap-admin script does not embed any hardcoded credentials', () => {
    const scriptPath = join(process.cwd(), 'scripts', 'bootstrap-admin.mjs');
    expect(existsSync(scriptPath)).toBe(true);

    const content = readFileSync(scriptPath, 'utf-8');
    expect(content).toContain('process.env.BOOTSTRAP_ADMIN_EMAIL');
    expect(content).toContain('process.env.BOOTSTRAP_ADMIN_PASSWORD');
    expect(content).not.toMatch(/ADMIN_PASSWORD\s*=\s*['"][^'"]+['"]/);
  });

  it('strictly ensures zero occurrences of "Seguimiento Doctoral" exist in source code', () => {
    const srcDir = join(process.cwd(), 'src');
    
    function scanDirectory(dir: string): string[] {
      let files: string[] = [];
      const entries = readdirSync(dir);
      for (const entry of entries) {
        const fullPath = join(dir, entry);
        const stat = statSync(fullPath);
        if (stat.isDirectory()) {
          files = files.concat(scanDirectory(fullPath));
        } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
          files.push(fullPath);
        }
      }
      return files;
    }

    const sourceFiles = scanDirectory(srcDir);
    const violations: string[] = [];

    for (const file of sourceFiles) {
      const content = readFileSync(file, 'utf-8');
      if (/seguimiento\s+doctoral/i.test(content)) {
        violations.push(file);
      }
    }

    expect(violations).toEqual([]);
  });
});
