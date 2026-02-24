"use client";

interface Props {
  onClick: () => void;
  loading: boolean;
}

export function PipelineRunButton({ onClick, loading }: Props) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="
        flex items-center gap-2 px-4 py-2 rounded-lg
        bg-orange-500 hover:bg-orange-400 disabled:bg-orange-800
        text-white font-semibold text-sm
        transition-colors duration-150
        disabled:cursor-not-allowed
      "
    >
      {loading ? (
        <>
          <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          Running…
        </>
      ) : (
        <>
          <span>▶</span>
          Run Pipeline
        </>
      )}
    </button>
  );
}
