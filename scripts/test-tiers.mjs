#!/usr/bin/env node
/* Tier rules tests. Node only. Run: npm run test:tiers */
import assert from 'node:assert/strict';
import { tierForProduct, tierGrants } from '../js/tiers.js';
import { LS_PRODUCT_TIERS, LS_PRODUCT_IDS } from '../js/ls-config.js';

const map = { 1: 'journal', 2: 'all', 3: 'keylevels' };
assert.equal(tierForProduct(1, map), 'journal');
assert.equal(tierForProduct('2', map), 'all');
assert.equal(tierForProduct(99, map), null);
assert.equal(tierForProduct(1, { 1: 'bogus' }), null);

assert.ok(tierGrants('journal', 'journal'));
assert.ok(!tierGrants('journal', 'modules'));
assert.ok(!tierGrants('journal', 'keylevels'));
for (const n of ['journal', 'modules', 'keylevels']) assert.ok(tierGrants('all', n));
assert.ok(tierGrants('keylevels', 'keylevels'));
assert.ok(!tierGrants('keylevels', 'journal'));
assert.ok(!tierGrants('keylevels', 'modules'));
assert.ok(!tierGrants(null, 'journal'));

// Config: every accepted id maps to a known tier; test product is All Access.
for (const id of LS_PRODUCT_IDS) assert.ok(tierForProduct(id, LS_PRODUCT_TIERS), `unmapped ${id}`);
assert.equal(tierForProduct(1472366), 'all');
console.log('tiers: all tests passed');
