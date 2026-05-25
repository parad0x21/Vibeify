import { SignUp } from "@clerk/nextjs";
import { AuthShell } from "@/components/auth-shell";

export default function SignUpPage() {
  return (
    <AuthShell title="Create your account" subtitle="Start shaping your next app idea.">
      <SignUp appearance={{ elements: { footer: "hidden" } }} />
    </AuthShell>
  );
}
