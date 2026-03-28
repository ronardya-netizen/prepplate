"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RootPage() {
  const router = useRouter();
  useEffect(() => {
    const onboarded = localStorage.getItem("prepplate-onboarded");
    router.replace(onboarded ? "/home" : "/onboarding");
  }, [router]);
  return null;
}