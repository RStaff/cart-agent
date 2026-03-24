"use client";

export default function RunTasksButton({
  onRun,
  disabled,
}: {
  onRun: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      className="bg-indigo-600 hover:bg-indigo-500 disabled:cursor-not-allowed disabled:bg-slate-700 text-white px-4 py-2 rounded-lg text-left transition"
      onClick={onRun}
      type="button"
      disabled={disabled}
    >
      <div className="font-semibold">Run System Tasks</div>
      <div className="mt-2 text-sm leading-6 text-indigo-100">
        Execute queued canonical tasks and write fresh results into the result registry.
      </div>
    </button>
  );
}
