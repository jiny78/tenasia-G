import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import CreditAdjust from "./CreditAdjust";
import CredentialActions from "../../CredentialActions";

export default async function UserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      credits: true,
      mediaCredential: true,
      purchases:  { orderBy: { createdAt: "desc" }, take: 20 },
      downloads:  { orderBy: { createdAt: "desc" }, take: 20 },
    },
  });
  if (!user) notFound();

  return (
    <div className="space-y-6 max-w-4xl">
      <h1 className="text-xl font-semibold">사용자 상세</h1>

      {/* 프로필 카드 */}
      <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-5 grid sm:grid-cols-2 gap-4">
        {[
          ["이름", user.name ?? "—"],
          ["이메일", user.email ?? "—"],
          ["회사", user.company ?? "—"],
          ["직함", user.jobTitle ?? "—"],
          ["국가", user.country ?? "—"],
          ["가입일", user.createdAt.toISOString().slice(0, 10)],
          ["프레스 인증", user.pressVerified ? `✓ 인증 (할인 ${user.pressDiscount}%)` : "미인증"],
          ["크레딧", String(user.credits?.balance ?? 0)],
        ].map(([label, value]) => (
          <div key={label}>
            <p className="text-xs text-zinc-500 mb-0.5">{label}</p>
            <p className="text-sm">{value}</p>
          </div>
        ))}
      </div>

      {/* 크레딧 조정 */}
      <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-5">
        <h2 className="text-sm font-medium text-zinc-400 mb-3">크레딧 조정</h2>
        <p className="text-xs text-zinc-500 mb-3">현재 잔액: <span className="text-white">{user.credits?.balance ?? 0}</span></p>
        <CreditAdjust userId={id} />
      </div>

      {/* 프레스 크리덴셜 */}
      {user.mediaCredential && (
        <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-5">
          <h2 className="text-sm font-medium text-zinc-400 mb-3">프레스 크리덴셜</h2>
          <div className="grid sm:grid-cols-2 gap-4 mb-4">
            {[
              ["유형", user.mediaCredential.type],
              ["상태", user.mediaCredential.status],
              ["제출일", user.mediaCredential.createdAt.toISOString().slice(0, 10)],
              ["검토일", user.mediaCredential.reviewedAt?.toISOString().slice(0, 10) ?? "—"],
            ].map(([label, value]) => (
              <div key={label}>
                <p className="text-xs text-zinc-500 mb-0.5">{label}</p>
                <p className="text-sm">{String(value)}</p>
              </div>
            ))}
          </div>
          <a href={user.mediaCredential.fileUrl} target="_blank" rel="noreferrer"
            className="text-xs text-blue-400 hover:underline mb-4 inline-block">파일 보기 →</a>
          {user.mediaCredential.status === "pending" && (
            <div className="flex gap-2 mt-2">
              <CredentialActions credentialId={user.mediaCredential.id} />
            </div>
          )}
        </div>
      )}

      {/* 구매 이력 */}
      <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-5 overflow-x-auto">
        <h2 className="text-sm font-medium text-zinc-400 mb-3">구매 이력</h2>
        <table className="w-full text-xs min-w-[400px]">
          <thead><tr className="text-zinc-600 border-b border-zinc-800">
            <th className="pb-2 text-left">날짜</th><th className="pb-2 text-right">금액</th>
            <th className="pb-2 text-right">크레딧</th><th className="pb-2 text-right">상태</th>
          </tr></thead>
          <tbody>
            {user.purchases.map((p) => (
              <tr key={p.id} className="border-b border-zinc-800/50">
                <td className="py-2 text-zinc-500">{p.createdAt.toISOString().slice(0, 10)}</td>
                <td className="py-2 text-right">${(p.amount / 100).toFixed(2)}</td>
                <td className="py-2 text-right">{p.creditsAdded}cr</td>
                <td className="py-2 text-right text-green-400">{p.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 다운로드 이력 */}
      <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-5 overflow-x-auto">
        <h2 className="text-sm font-medium text-zinc-400 mb-3">다운로드 이력</h2>
        <table className="w-full text-xs min-w-[400px]">
          <thead><tr className="text-zinc-600 border-b border-zinc-800">
            <th className="pb-2 text-left">날짜</th><th className="pb-2 text-left">Photo ID</th>
            <th className="pb-2 text-center">라이선스</th><th className="pb-2 text-right">크레딧</th>
          </tr></thead>
          <tbody>
            {user.downloads.map((d) => (
              <tr key={d.id} className="border-b border-zinc-800/50">
                <td className="py-2 text-zinc-500">{d.createdAt.toISOString().slice(0, 10)}</td>
                <td className="py-2 font-mono truncate max-w-[150px]">{d.photoId}</td>
                <td className="py-2 text-center">
                  <span className={`px-1.5 py-0.5 rounded text-[10px] ${d.licenseType === "commercial" ? "bg-purple-900 text-purple-300" : "bg-zinc-800 text-zinc-400"}`}>
                    {d.licenseType === "editorial" ? "편집" : d.licenseType === "commercial" ? "상업" : d.licenseType}
                  </span>
                </td>
                <td className="py-2 text-right">{d.creditsUsed}cr</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
