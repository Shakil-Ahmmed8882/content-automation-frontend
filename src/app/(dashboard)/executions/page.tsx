import { Suspense } from "react";
import { ExecutionListSkeleton } from "@/components/modules/executions/ExecutionStateBlocks";
import { ExecutionsHistoryPage } from "@/components/modules/executions/ExecutionsHistoryPage";

export default function Page() {
  return (
    <Suspense fallback={<ExecutionListSkeleton />}>
      <ExecutionsHistoryPage />
    </Suspense>
  );
}
