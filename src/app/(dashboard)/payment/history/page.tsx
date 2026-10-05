import { Suspense } from "react";
import { PaymentHistoryPage } from "@/components/modules/payment/PaymentHistoryPage";
import { PaymentListSkeleton } from "@/components/modules/payment/PaymentStateBlocks";

export default function Page() {
  return (
    <Suspense fallback={<PaymentListSkeleton />}>
      <PaymentHistoryPage />
    </Suspense>
  );
}
