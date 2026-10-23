import React from 'react';
import { ShieldAlert, Check, X } from 'lucide-react';
import { ConfirmationRequest } from '../types';

interface ConfirmationModalProps {
  request: ConfirmationRequest | null;
  onCancel: () => void;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  request,
  onCancel,
}) => {
  if (!request) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-sm p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
    >
      <div className="w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-2xl border border-slate-200 shadow-xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-150">
        {/* Mobile grab handle */}
        <div className="w-10 h-1.5 bg-slate-300 rounded-full mx-auto mt-3 sm:hidden" />

        <div className="p-5 sm:p-6">
          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center shrink-0 text-amber-700">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-amber-800">
                ग्राहक सुरक्षा एवं पुष्टि जांच
              </p>
              <h3
                id="confirm-modal-title"
                className="text-lg font-bold text-slate-900 mt-0.5"
              >
                {request.titleHi}
              </h3>
              <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                {request.descriptionHi}
              </p>
            </div>
          </div>

          {request.recipientOrTargetHi && (
            <div className="mt-4 p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-sm">
              <span className="text-slate-500 font-medium">प्रभावित प्राप्तकर्ता / लक्ष्य: </span>
              <span className="font-semibold text-slate-900">
                {request.recipientOrTargetHi}
              </span>
            </div>
          )}

          {request.messagePreviewHi && (
            <div className="mt-3 p-3.5 rounded-xl bg-amber-50/60 border border-amber-200/80">
              <p className="text-xs font-medium text-amber-900 mb-1">
                संदेश / बदलाव का पूर्वावलोकन (Preview):
              </p>
              <p className="text-sm text-slate-800 whitespace-pre-wrap leading-relaxed font-normal">
                {request.messagePreviewHi}
              </p>
            </div>
          )}

          <div className="mt-4 p-3 rounded-xl bg-slate-100 text-xs text-slate-700 leading-relaxed">
            <strong>महत्वपूर्ण:</strong> {request.impactWarningHi}
          </div>

          <div className="mt-6 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onCancel}
              className="min-h-[46px] px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-700 font-semibold text-sm hover:bg-slate-50 transition-colors flex items-center justify-center gap-2 whitespace-nowrap shrink-0"
            >
              <X className="w-4 h-4" />
              <span>रद्द करें (वापस जाएं)</span>
            </button>
            <button
              type="button"
              onClick={() => {
                request.onConfirm();
                onCancel();
              }}
              className="min-h-[46px] px-5 py-2.5 rounded-xl bg-slate-900 text-white font-semibold text-sm hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 whitespace-nowrap shrink-0"
            >
              <Check className="w-4 h-4" />
              <span>{request.confirmButtonLabelHi}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
