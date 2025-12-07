import ChatPane from "@/components/ChatPane";
import { MainLayout } from "@/components/MainLayout";

export default function Home() {
  return (
    <MainLayout>
      <ChatPane threadId="default" />
    </MainLayout>
  );
}
