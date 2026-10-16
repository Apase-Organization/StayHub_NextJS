import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const source = readFileSync(new URL('../src/components/property/HeroSearchBar.tsx', import.meta.url), 'utf8');

test('desktop search has explicit tracks and a compact nonshrinking action', () => {
  assert.ok(source.includes('lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_minmax(0,1fr)_auto]'));
  assert.match(source, /h-11 shrink-0 items-center whitespace-nowrap/);
  assert.ok(source.includes('>Search</span>'));
  assert.ok(source.includes('router.push(`/search?${params.toString()}`)'));
});

test('tablet avoids the squeezed desktop row; guest bounds and overlays remain', () => {
  assert.ok(source.includes('sm:grid-cols-2'));
  assert.ok(!source.includes('md:flex-row'));
  assert.ok(!source.includes('md:rounded-full'));
  assert.match(source, /shrink-0 whitespace-nowrap cursor-pointer/);
  assert.ok(source.includes('Math.max(1, prev - 1)'));
  assert.ok(source.includes('Math.min(16, prev + 1)'));
  assert.ok(source.includes('absolute right-0 top-full'));
  assert.ok(source.includes('absolute left-0 top-full'));
});
