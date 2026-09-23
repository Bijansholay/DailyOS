import React from 'react';
import { SignIn, SignUp } from '@clerk/clerk-react';
import { X } from 'lucide-react';
import { IconButton } from './Button';

export default function AuthModal({ isOpen, initialRegister = false, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn overflow-y-auto">
      <div className="relative w-full max-w-md journal-card rounded-2xl p-4 border border-[var(--border-color)] shadow-2xl flex flex-col items-center my-8">
        <div className="absolute top-3 right-3 z-10">
          <IconButton onClick={onClose} icon={X} title="Close" />
        </div>

        <div className="w-full pt-6 flex justify-center">
          {initialRegister ? (
            <SignUp routing="virtual" />
          ) : (
            <SignIn routing="virtual" />
          )}
        </div>
      </div>
    </div>
  );
}
