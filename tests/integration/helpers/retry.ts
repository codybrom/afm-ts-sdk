/**
 * Retry helper for flaky on-device model integration tests.
 *
 * The on-device model can be unreliable — it sometimes responds with text
 * instead of calling a tool, or times out. This helper runs an attempt
 * function multiple times and requires a minimum number of successes.
 */
export interface RetryOptions {
  /** Maximum number of attempts (default: 5). */
  maxAttempts?: number;
  /** Minimum successes required to pass (default: 1). */
  requiredSuccesses?: number;
  /** Delay between attempts in ms (default: 2000). */
  delayMs?: number;
  /** Label for log messages. */
  label?: string;
}

export interface AttemptResult {
  success: boolean;
  detail?: string;
}

/**
 * Run `attemptFn` up to `maxAttempts` times, requiring `requiredSuccesses`
 * successes. Returns the total successes count. Logs progress to console.
 */
export async function retryAttempts(
  attemptFn: () => Promise<AttemptResult>,
  opts: RetryOptions = {},
): Promise<{ successes: number; failures: number }> {
  const { maxAttempts = 5, requiredSuccesses = 1, delayMs = 2_000, label = "retry" } = opts;

  let successes = 0;
  let failures = 0;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const result = await attemptFn();
      if (result.success) {
        successes++;
        console.log(
          `[${label}] attempt ${attempt} succeeded (${successes}/${requiredSuccesses})${result.detail ? `: ${result.detail}` : ""}`,
        );
      } else {
        failures++;
        console.log(
          `[${label}] attempt ${attempt} failed${result.detail ? `: ${result.detail}` : ""}`,
        );
      }
    } catch (err) {
      failures++;
      console.log(`[${label}] attempt ${attempt} threw: ${(err as Error).message}`);
    }

    if (successes >= requiredSuccesses) break;
    if (attempt < maxAttempts) {
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }

  console.log(
    `[${label}] result: ${successes} successes, ${failures} failures out of ${successes + failures} attempts`,
  );
  return { successes, failures };
}
