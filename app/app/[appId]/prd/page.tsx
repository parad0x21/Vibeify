import { PrdPageClient } from "./prd-page-client";

export default async function PrdPage({
  params,
}: {
  params: Promise<{ appId: string }>;
}) {
  const { appId } = await params;
  return <PrdPageClient appId={appId} />;
}
