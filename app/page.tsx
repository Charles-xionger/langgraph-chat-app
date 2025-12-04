import { MainLayout } from "@/components/MainLayout";

export default function Home() {
  return (
    <MainLayout>
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-2">欢迎使用聊天应用</h2>
          <p>从左侧选择一个对话或创建新对话开始聊天</p>
        </div>
      </div>
    </MainLayout>
  );
}
