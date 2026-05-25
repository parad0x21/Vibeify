import { SignIn } from "@clerk/nextjs";
import { AuthShell } from "@/components/auth-shell";

export default function SignInPage() {
  return (
    <AuthShell title="Welcome back" subtitle="Sign in to continue planning your apps.">
      <SignIn appearance={{ elements: { footer: "hidden" } }} />
    </AuthShell>
  );
}
