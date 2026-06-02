"use client";

import { useFormStatus } from "react-dom";

export default function SubmitButton({
  label,
  loadingLabel,
  className,
}: {
  label: string;
  loadingLabel?: string;
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={className ?? "px-5 py-2 bg-green-700 text-white text-sm font-medium rounded-lg hover:bg-green-800 disabled:opacity-60 disabled:cursor-not-allowed"}
    >
      {pending ? (loadingLabel ?? "Saving…") : label}
    </button>
  );
}
