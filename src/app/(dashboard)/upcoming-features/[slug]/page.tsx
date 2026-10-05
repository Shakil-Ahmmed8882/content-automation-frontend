import UpcomingFeatureDetail from "@/components/modules/upcoming-features/UpcomingFeatureDetail";

export const metadata = { title: "Upcoming feature" };

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <UpcomingFeatureDetail slug={slug} />;
}
