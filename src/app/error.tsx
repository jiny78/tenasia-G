"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[GlobalError boundary]", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-black text-white p-8 font-mono">
      <h1 className="text-red-400 text-2xl font-bold mb-4">
        ⚠ Client-side Exception
      </h1>
      <div className="mb-4 space-y-2">
        <p className="text-yellow-300 text-lg">
          <span className="text-gray-400">name: </span>
          {error.name}
        </p>
        <p className="text-white text-lg">
          <span className="text-gray-400">message: </span>
          {error.message}
        </p>
        {error.digest && (
          <p className="text-gray-400 text-sm">
            <span>digest: </span>
            {error.digest}
          </p>
        )}
      </div>
      {error.stack && (
        <pre className="bg-gray-900 border border-gray-700 rounded p-4 text-xs text-green-300 overflow-auto max-h-[60vh] whitespace-pre-wrap break-all">
          {error.stack}
        </pre>
      )}
      <button
        onClick={reset}
        className="mt-6 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-white text-sm"
      >
        Try again
      </button>
    </div>
  );
}
