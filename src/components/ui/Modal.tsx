'use client';

import { ReactNode } from 'react';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showClose?: boolean;
}

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
};

export function Modal({ isOpen, onClose, title, children, size = 'md', showClose = true }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Content */}
      <div
        className={`
          relative bg-white rounded-xl shadow-xl
          w-full ${sizeClasses[size]}
          max-h-[90vh] overflow-hidden flex flex-col
        `}
      >
        {/* Header */}
        {(title || showClose) && (
          <div className="flex items-center justify-between p-6 border-b">
            {title && (
              <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            )}
            {showClose && (
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors ml-auto"
              >
                ✕
              </button>
            )}
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}

export interface ModalFooterProps {
  children: ReactNode;
  className?: string;
}

export function ModalFooter({ children, className = '' }: ModalFooterProps) {
  return (
    <div className={`p-6 border-t bg-gray-50 ${className}`}>
      {children}
    </div>
  );
}
