"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    // 直接重定向到登录页面，让后端处理认证状态
    router.push("/login");
  }, [router]);
}
