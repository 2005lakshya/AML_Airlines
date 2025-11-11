"use client";

import { ReactNode, useEffect, useState } from "react";
import { createPortal } from "react-dom";

interface ModalProps {
  children: ReactNode;
  onClose: () => void;
  overlay?: boolean;
}

export default function Modal({ children, onClose, overlay = true }: ModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("keydown", handleEscape);
      setMounted(false);
    };
  }, [onClose]);

  if (!mounted) return null;

  const outerClass = overlay
    ? "fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
    : "fixed inset-0 z-50 flex items-center justify-center";

  return createPortal(
    <div className={outerClass} onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative max-h-[90vh] overflow-auto mx-4"
      >
        <button
          className="absolute top-2 right-2 text-white hover:text-white/70 z-10 text-2xl w-8 h-8 flex items-center justify-center"
          onClick={onClose}
        >
          ✕
        </button>
        {children}
      </div>
    </div>,
    document.body
  );
}