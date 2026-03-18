export function isAdmin(email: string | null | undefined): boolean {
  if (!email) return false;
  const admins = (process.env.ADMIN_EMAILS ?? "").split(",").map((e) => e.trim().toLowerCase());
  return admins.includes(email.toLowerCase());
}

export async function requireAdmin(session: { user?: { email?: string | null } } | null): Promise<boolean> {
  return isAdmin(session?.user?.email);
}
