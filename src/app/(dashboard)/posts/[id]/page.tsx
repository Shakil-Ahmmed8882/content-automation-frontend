import { PostDetailView } from "@/components/modules/posts/PostDetailView";

export const metadata = { title: "Post detail" };

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <PostDetailView id={id} />;
}
