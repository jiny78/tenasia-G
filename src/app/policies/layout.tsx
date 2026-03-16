import PoliciesShell from "@/components/policies/PoliciesShell";

export default function PoliciesLayout({ children }: { children: React.ReactNode }) {
  return <PoliciesShell>{children}</PoliciesShell>;
}
