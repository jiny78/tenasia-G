interface PolicySectionProps {
  id: string;
  title: string;
  children: React.ReactNode;
}

export default function PolicySection({ id, title, children }: PolicySectionProps) {
  return (
    <section id={id} className="scroll-mt-24">
      <h2 className="text-xl font-semibold mb-4 pt-10 border-t border-current/10">{title}</h2>
      <div className="space-y-3 text-sm leading-relaxed opacity-80">
        {children}
      </div>
    </section>
  );
}
