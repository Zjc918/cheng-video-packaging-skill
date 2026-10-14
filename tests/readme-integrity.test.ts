import {createHash} from 'node:crypto';
import {existsSync, readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {describe, expect, it} from 'vitest';

const root = resolve(import.meta.dirname, '..');
const read = (path: string) => readFileSync(resolve(root, path));
const sha256 = (value: Buffer) => createHash('sha256').update(value).digest('hex').toUpperCase();

describe('public README evidence', () => {
  it('links only existing local preview assets', () => {
    const markdown = read('README.md').toString('utf8');
    const links = [...markdown.matchAll(/!\[[^\]]*\]\(([^)]+)\)/g)].map((match) => match[1]);
    expect(links.length).toBeGreaterThanOrEqual(4);
    expect(markdown).not.toContain('docs/assets/previews/');
    for (const link of links) expect(existsSync(resolve(root, link))).toBe(true);
  });

  it('maps every preview to the verified output and matching file hash', () => {
    const manifest = JSON.parse(read('examples/current-demo/preview-manifest.json').toString('utf8'));
    expect(manifest.kind).toBe('synthetic-renderer-example');
    expect(manifest.version).toBe(JSON.parse(read('package.json').toString('utf8')).version);
    for (const frame of manifest.images) {
      const path = resolve(root, frame.file);
      expect(existsSync(path)).toBe(true);
      expect(sha256(readFileSync(path))).toBe(frame.sha256.toUpperCase());
    }
  });

  it('credits the original project without its business contact', () => {
    const text = read('README.md').toString('utf8');
    expect(text).toContain('基于 Nana AI');
    expect(text).not.toContain(['nanaya', '093'].join(''));
  });
});
