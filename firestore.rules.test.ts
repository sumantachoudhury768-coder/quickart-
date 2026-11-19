import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const rulesPath = path.resolve(process.cwd(), 'DRAFT_firestore.rules');
const finalRulesPath = path.resolve(process.cwd(), 'firestore.rules');

function readActiveRules(): string {
  if (fs.existsSync(finalRulesPath)) {
    return fs.readFileSync(finalRulesPath, 'utf8');
  }
  return fs.readFileSync(rulesPath, 'utf8');
}

test('Phase 0 Security TDD: Dirty Dozen static policy invariants are enforced in Firestore rules', () => {
  const rules = readActiveRules();

  // 1. Default-deny catch-all first
  assert.match(rules, /match \/\{document=\*\*\}\s*\{\s*allow read, write: if false;/);

  // 2. Rules version 2
  assert.match(rules, /rules_version = '2';/);

  // 3. Bootstrapped admin requires email_verified == true (Email Spoofing Test)
  assert.match(rules, /request\.auth\.token\.email_verified == true/);
  assert.match(rules, /sumantachoudhury768@gmail\.com/);

  // 4. Self-admin escalation prevented on user profile creation
  assert.match(rules, /incoming\(\)\.role == 'customer'/);

  // 5. Self-role escalation prevented on user profile update
  assert.match(rules, /incoming\(\)\.role == existing\(\)\.role/);

  // 6. Strict key allowlisting (Shadow Update Test)
  assert.ok(rules.includes('data.keys().hasOnly('));
  assert.ok(rules.includes('affectedKeys().hasOnly('));

  // 7. Path variable ID poisoning guard
  assert.match(rules, /function isValidId\(id\)/);
  assert.match(rules, /\^\[a-zA-Z0-9_\\\\-\]\+\$/);

  // 8. PII Isolation: no blanket isSignedIn() read on users or orders
  assert.doesNotMatch(rules, /match \/users\/\{userId\}[\s\S]{0,200}allow read: if isSignedIn\(\);/);
  assert.doesNotMatch(rules, /match \/orders\/\{orderId\}[\s\S]{0,200}allow list: if isSignedIn\(\);/);

  // 9. Referential integrity via exists() on stores when creating products/orders
  assert.match(rules, /exists\(\/databases\/\$\(database\)\/documents\/stores\/\$\(incoming\(\)\.storeId\)\)/);

  // 10. Terminal state locking on orders (delivered / cancelled)
  assert.match(rules, /!\(existing\(\)\.status in \['delivered', 'cancelled'\]\)/);

  // 11. Temporal integrity via request.time
  assert.match(rules, /incoming\(\)\.createdAt == request\.time/);
  assert.match(rules, /incoming\(\)\.updatedAt == request\.time/);

  // 12. Bounded array guarding on order items
  assert.match(rules, /data\.items is list && data\.items\.size\(\) >= 1 && data\.items\.size\(\) <= 30 && data\.items\[0\] is map/);
});
