import { StackPageClient } from "./stack-page-client";

export default async function StackPage({
  params,
}: {
  params: Promise<{ appId: string }>;
}) {
  const { appId } = await params;
  return <StackPageClient appId={appId} />;
}
