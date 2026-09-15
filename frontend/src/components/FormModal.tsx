import type { FormEvent, ReactNode } from "react";
import { Modal } from "./Modal";
import { Button } from "./Button";
import { ErrorBanner } from "./Feedback";

/**
 * The chrome every create-modal in the app shares: a Modal, a <form>, an
 * error banner slot, the field markup a caller provides as children, and a
 * Cancel/Submit button row. Each modal still owns its own fields and
 * submit handler — this only removes the boilerplate wrapper around them.
 */
export function FormModal({
  title,
  onClose,
  onSubmit,
  error,
  isSubmitting,
  submitLabel,
  submitDisabled,
  children,
  widthClassName,
}: {
  title: string;
  onClose: () => void;
  onSubmit: (e: FormEvent) => void;
  error: string | null;
  isSubmitting: boolean;
  submitLabel: string;
  submitDisabled?: boolean;
  children: ReactNode;
  widthClassName?: string;
}) {
  return (
    <Modal title={title} onClose={onClose} widthClassName={widthClassName}>
      <form onSubmit={onSubmit} className="space-y-4">
        {error && <ErrorBanner message={error} />}
        {children}
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSubmitting} disabled={submitDisabled}>
            {submitLabel}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
