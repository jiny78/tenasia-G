export default function PhotoLoading() {
  return (
    <div className="min-h-screen bg-[#0d0d0d] text-white">
      {/* 네비 바 */}
      <div className="sticky top-0 z-30 border-b border-white/10 bg-black/70 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-12 flex items-center justify-between">
          <div className="w-16 h-3 bg-white/10 rounded animate-pulse" />
          <div className="flex gap-4">
            <div className="w-10 h-3 bg-white/10 rounded animate-pulse" />
            <div className="w-10 h-3 bg-white/10 rounded animate-pulse" />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">

          {/* 이미지 영역 */}
          <div className="w-full lg:w-[60%]">
            <div
              className="relative overflow-hidden rounded-sm bg-white/[0.04] flex items-center justify-center"
              style={{ minHeight: 480 }}
            >
              <div className="w-8 h-8 border-2 border-white/15 border-t-white/60 rounded-full animate-spin" />
            </div>
          </div>

          {/* 메타 영역 */}
          <div className="w-full lg:w-[40%] flex flex-col gap-6">
            {/* 아티스트명 */}
            <div className="space-y-2">
              <div className="h-7 w-48 bg-white/10 rounded animate-pulse" />
              <div className="h-3 w-32 bg-white/8 rounded animate-pulse" />
              <div className="h-3 w-24 bg-white/6 rounded animate-pulse" />
            </div>

            {/* 메타 카드 */}
            <div className="rounded-sm border border-white/10 bg-white/[0.04] p-4">
              <div className="grid grid-cols-2 gap-x-4 gap-y-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="space-y-1.5">
                    <div className="h-2 w-14 bg-white/10 rounded animate-pulse" />
                    <div className="h-3 w-20 bg-white/8 rounded animate-pulse" />
                  </div>
                ))}
              </div>
            </div>

            {/* 라이선스 선택 */}
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-16 rounded-sm border border-white/10 bg-white/[0.04] animate-pulse" />
              ))}
            </div>

            {/* 버튼 */}
            <div className="h-11 rounded-sm bg-white/10 animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}
