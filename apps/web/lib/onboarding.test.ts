import test from 'node:test';
import assert from 'node:assert';

export function computeOnboardingStatus(user: {
  onboardingCompletedAt?: Date | string | null;
  onboardingSkipped?: boolean;
}): 'COMPLETED' | 'SKIPPED' | 'NOT_COMPLETED' {
  if (user.onboardingCompletedAt) return 'COMPLETED';
  if (user.onboardingSkipped) return 'SKIPPED';
  return 'NOT_COMPLETED';
}

test('computeOnboardingStatus returns COMPLETED when onboardingCompletedAt is set', () => {
  const status = computeOnboardingStatus({
    onboardingCompletedAt: '2026-11-06T10:00:00.000Z',
    onboardingSkipped: false,
  });
  assert.strictEqual(status, 'COMPLETED');
});

test('computeOnboardingStatus returns SKIPPED when onboardingSkipped is true and not completed', () => {
  const status = computeOnboardingStatus({
    onboardingCompletedAt: null,
    onboardingSkipped: true,
  });
  assert.strictEqual(status, 'SKIPPED');
});

test('computeOnboardingStatus returns NOT_COMPLETED for newly registered users', () => {
  const status = computeOnboardingStatus({
    onboardingCompletedAt: null,
    onboardingSkipped: false,
  });
  assert.strictEqual(status, 'NOT_COMPLETED');
});

test('computeOnboardingStatus returns COMPLETED when completing profile after previously skipping', () => {
  // User had skipped previously, but now completes profile
  const status = computeOnboardingStatus({
    onboardingCompletedAt: new Date().toISOString(),
    onboardingSkipped: false,
  });
  assert.strictEqual(status, 'COMPLETED');
});

test('isOnboarded flag evaluates correctly across statuses', () => {
  const isCompletedOnboarded = ['COMPLETED', 'SKIPPED'].includes(
    computeOnboardingStatus({ onboardingCompletedAt: '2026-11-06', onboardingSkipped: false }),
  );
  assert.strictEqual(isCompletedOnboarded, true);

  const isSkippedOnboarded = ['COMPLETED', 'SKIPPED'].includes(
    computeOnboardingStatus({ onboardingCompletedAt: null, onboardingSkipped: true }),
  );
  assert.strictEqual(isSkippedOnboarded, true);

  const isPendingOnboarded = ['COMPLETED', 'SKIPPED'].includes(
    computeOnboardingStatus({ onboardingCompletedAt: null, onboardingSkipped: false }),
  );
  assert.strictEqual(isPendingOnboarded, false);
});

