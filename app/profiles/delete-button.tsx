"use client";

import { deleteProfile } from "@/app/actions/profiles";

export function DeleteProfileButton({ profileId, name }: { profileId: string; name: string }) {
  return (
    <form
      action={async () => {
        if (confirm(`Delete ${name}?`)) {
          await deleteProfile(profileId);
        }
      }}
    >
      <button
        type="submit"
        className="text-stone-400 hover:text-red-500 text-sm px-2 py-1 rounded transition-colors"
      >
        Delete
      </button>
    </form>
  );
}
