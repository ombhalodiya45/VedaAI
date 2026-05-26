'use client';

interface ConfirmModalProps {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  danger = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onCancel}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 flex flex-col gap-5">
        <div>
          <h3 className="text-base font-bold text-gray-900">{title}</h3>
          <p className="text-sm text-gray-500 mt-1">{message}</p>
        </div>

        <div className="flex items-center gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-5 py-2.5 rounded-full border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`px-5 py-2.5 rounded-full text-sm font-semibold text-white transition-colors ${
              danger
                ? 'bg-red-500 hover:bg-red-600'
                : 'bg-gray-900 hover:bg-black'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
