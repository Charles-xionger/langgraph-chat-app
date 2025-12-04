"use client";

import { MainLayout } from "@/components/MainLayout";
import { useParams } from "next/navigation";

export default function ThreadPage() {
  const params = useParams();
  const threadId = params.threadId as string;
  console.log("🚀 ~ ThreadPage ~ threadId:", threadId);

  return (
    <MainLayout>
      <div>Thread Page - {threadId}</div>
    </MainLayout>
  );
}
