"use client";

import { useEffect, useRef, useState } from "react";

export default function LoadingBar({
  loading,
  isDark,
}: {
  loading: boolean;
  isDark: boolean;
}) {
  const [width, setWidth] = useState(0);
  const [visible, setVisible] = useState(false);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (hideTimer.current) clearTimeout(hideTimer.current);

    if (loading) {
      setWidth(0);
      setVisible(true);
      // 두 프레임 후 80%까지 천천히 채우기
      requestAnimationFrame(() =>
        requestAnimationFrame(() => setWidth(80))
      );
    } else {
      // 완료: 100%까지 빠르게 채운 뒤 사라짐
      setWidth(100);
      hideTimer.current = setTimeout(() => setVisible(false), 400);
    }

    return () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, [loading]);

  if (!visible) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        zIndex: 9999,
        width: 200,
        height: 3,
        borderRadius: 9999,
        background: isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.1)",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          height: "100%",
          width: `${width}%`,
          borderRadius: 9999,
          background: isDark ? "rgba(255,255,255,0.85)" : "rgba(0,0,0,0.6)",
          transition: loading
            ? "width 2.5s cubic-bezier(0.05, 0.5, 0.2, 1)"
            : "width 0.2s ease",
        }}
      />
    </div>
  );
}
