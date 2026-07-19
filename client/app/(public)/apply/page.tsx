import { Suspense } from "react";
import ApplicationForm from "@/src/features/candidate-portal/components/ApplicationForm";

export default function ApplyPage() {
  return (
    <div className="flex w-full flex-1 justify-center px-4 py-8 sm:px-6 sm:py-12">
      <Suspense
        fallback={
          <div className="flex min-h-[40vh] w-full max-w-2xl items-center justify-center">
            <div className="text-sm text-muted-foreground">Loading…</div>
          </div>
        }
      >
        <ApplicationForm />
      </Suspense>
    </div>
  );
}
