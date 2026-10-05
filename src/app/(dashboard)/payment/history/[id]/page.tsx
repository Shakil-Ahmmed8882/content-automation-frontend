import { PaymentDetailPage } from "@/components/modules/payment/PaymentDetailPage";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <PaymentDetailPage paymentId={id} />;
}
