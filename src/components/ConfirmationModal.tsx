import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, X } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
}

export default function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  type = 'danger'
}: ConfirmationModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          />
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden"
          >
            <div className={`p-6 flex items-center justify-between ${
              type === 'danger' ? 'bg-red-600' : 
              type === 'warning' ? 'bg-orange-500' : 'bg-blue-600'
            } text-white`}>
              <h3 className="text-xl font-bold flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                {title}
              </h3>
              <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6">
              <p className="text-slate-600 mb-8">{message}</p>
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 py-3 px-4 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all"
                >
                  {cancelText}
                </button>
                <button
                  onClick={() => {
                    onConfirm();
                    onClose();
                  }}
                  className={`flex-1 py-3 px-4 rounded-xl font-bold text-white transition-all ${
                    type === 'danger' ? 'bg-red-600 hover:bg-red-700 shadow-lg shadow-red-200' : 
                    type === 'warning' ? 'bg-orange-500 hover:bg-orange-600 shadow-lg shadow-orange-200' : 
                    'bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200'
                  }`}
                >
                  {confirmText}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
