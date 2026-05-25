import { FeaturesPageClient } from "./features-page-client";

export default async function FeaturesPage({
  params,
}: {
  params: Promise<{ appId: string }>;
}) {
  const { appId } = await params;
  return <FeaturesPageClient appId={appId} />;
}
