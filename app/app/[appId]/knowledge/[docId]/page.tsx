import { KnowledgeEditorClient } from "./knowledge-editor-client";

export default async function KnowledgeDocPage({
  params,
}: {
  params: Promise<{ appId: string; docId: string }>;
}) {
  const { appId, docId } = await params;
  return <KnowledgeEditorClient appId={appId} docId={docId} />;
}
