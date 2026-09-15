import { useState } from "react";

/**
 * Every create-modal in the app follows the same submit lifecycle: track
 * isSubmitting, clear any previous error, run the request, call onSuccess,
 * catch and format an error message, and always reset isSubmitting after.
 * This hook is that lifecycle, so a modal only needs to describe its own
 * request — not re-implement the bookkeeping around it.
 */
export function useSubmit<T>(action: (input: T) => Promise<unknown>, onSuccess: () => void) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(input: T, fallbackMessage: string) {
    setIsSubmitting(true);
    setError(null);
    try {
      await action(input);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : fallbackMessage);
    } finally {
      setIsSubmitting(false);
    }
  }

  return { submit, isSubmitting, error };
}
