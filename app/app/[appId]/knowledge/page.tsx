import { KnowledgeListClient } from "./knowledge-list-client";

export default async function KnowledgePage({
  params,
}: {
  params: Promise<{ appId: string }>;
}) {
  const { appId } = await params;
  return <KnowledgeListClient appId={appId} />;
}
