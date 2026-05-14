"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[CoupleBrain Error]", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center px-4">
      <p className="text-4xl">😕</p>
      <h2 className="text-lg font-semibold text-gray-800">Algo salió mal</h2>
      <p className="text-sm text-gray-500 max-w-xs font-mono bg-gray-100 px-3 py-2 rounded-lg">
        {error.message}
      </p>
      <button
        onClick={reset}
        className="px-4 py-2 bg-purple-600 text-white rounded-xl text-sm font-medium"
      >
        Reintentar
      </button>
    </div>
  );
}
