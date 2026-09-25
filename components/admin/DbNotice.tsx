import Link from "next/link";
import { Database } from "lucide-react";

type Props = {
  title?: string;
  message?: string;
  showSetupHint?: boolean;
};

export default function DbNotice({
  title = "Database unavailable",
  message = "The database could not be reached. Check that MONGODB_URI is configured and the cluster is reachable.",
  showSetupHint = false,
}: Props) {
  return (
    <div
      role="status"
      className="rounded-xl border border-amber-200 bg-amber-50 px-6 py-10 text-center"
    >
      <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-amber-100">
        <Database className="h-5 w-5 text-amber-700" aria-hidden="true" />
      </span>
      <h2 className="mt-4 font-display text-lg font-semibold tracking-tight text-slate-900">
        {title}
      </h2>
      <p className="mx-auto mt-2 max-w-lg text-sm leading-relaxed text-amber-800">{message}</p>
      {showSetupHint && (
        <Link
          href="/admin/settings"
          className="mt-5 inline-flex items-center justify-center rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-amber-700"
        >
          View setup instructions
        </Link>
      )}
    </div>
  );
}
