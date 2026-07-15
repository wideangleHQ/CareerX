import { Suspense } from "react";
import ApplicationForm from "@/src/features/candidate-portal/components/ApplicationForm";

export default function ApplyPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ApplicationForm />
    </Suspense>
  );
}