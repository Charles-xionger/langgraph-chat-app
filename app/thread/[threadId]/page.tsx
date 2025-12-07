"use client";

import { MainLayout } from "@/components/MainLayout";
import ChatPane from "@/components/ChatPane";
import { useParams } from "next/navigation";

export default function ThreadPage() {
  const params = useParams();
  const threadId = params.threadId as string;

  return (
    <MainLayout>
      <ChatPane threadId={threadId} />
    </MainLayout>
  );
}
