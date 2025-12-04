"use client";

import { MainLayout } from "@/components/MainLayout";
import { Thread } from "@/components/Thread";
import { useParams } from "next/navigation";

export default function ThreadPage() {
  const params = useParams();
  const threadId = params.threadId as string;

  return (
    <MainLayout>
      <Thread threadId={threadId} />
    </MainLayout>
  );
}
