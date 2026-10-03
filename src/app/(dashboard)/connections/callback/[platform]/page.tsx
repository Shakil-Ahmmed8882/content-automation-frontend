import { OAuthCallbackHandler } from "@/components/modules/connections/OAuthCallbackHandler";

export const metadata = { title: "Finishing connection" };

export default async function Page({
  params,
}: {
  params: Promise<{ platform: string }>;
}) {
  const { platform } = await params;
  return <OAuthCallbackHandler platform={platform} />;
}
