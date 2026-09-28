import React from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { Modal } from './Modal';

export const ConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Verification',
  message = 'Are you sure you wish to proceed with this operation?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isDestructive = false,
  isLoading = false,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="max-w-md">
      <div className="flex items-start gap-4">
        <div
          className={`w-10 h-10 rounded-[2px] flex items-center justify-center flex-shrink-0 ${
            isDestructive
              ? 'bg-[#FDF2F2] text-[#993A3A] border border-[#993A3A]/25'
              : 'bg-[#FBF6ED] text-[#A0702A] border border-[#DFB76C]/35'
          }`}
        >
          <AlertTriangle className="w-5 h-5 stroke-[1.5]" />
        </div>
        <div className="flex-1">
          <p className="text-xs text-[#13152C]/80 leading-relaxed font-sans">{message}</p>
        </div>
      </div>

      <div className="mt-8 flex items-center justify-end gap-3 pt-4 border-t border-[#DFB76C]/20">
        <button
          type="button"
          onClick={onClose}
          disabled={isLoading}
          className="btn-luxury-secondary text-xs"
        >
          {cancelText}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={isLoading}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-[2px] font-sans text-xs font-semibold uppercase tracking-wider transition-all disabled:opacity-50 cursor-pointer ${
            isDestructive
              ? 'bg-[#993A3A] text-white hover:bg-[#822E2E]'
              : 'btn-luxury-primary'
          }`}
        >
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin text-current" /> : null}
          <span>{confirmText}</span>
        </button>
      </div>
    </Modal>
  );
};

export default ConfirmationModal;
