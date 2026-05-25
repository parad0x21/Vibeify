import { redirect } from "next/navigation";

export default async function AppRootPage({
  params,
}: {
  params: Promise<{ appId: string }>;
}) {
  const { appId } = await params;
  redirect(`/app/${appId}/prd`);
}
