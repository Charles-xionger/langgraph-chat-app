import prisma from "@/lib/database/pirsma";

/**
 * Ensure a thread exists; create if missing. Title derived from seed (first 100 chars) or fallback.
 * Returns the Prisma thread record.
 */
export async function ensureThread(threadId: string, titleSeed?: string) {
  if (!threadId) throw new Error("threadId is required");
  const existing = await prisma.thread.findUnique({ where: { id: threadId } });

  // 如果线程已存在
  if (existing) {
    // 检查是否需要用第一条消息更新标题
    // 如果当前标题是默认的时间格式（以"对话 "开头），且有消息内容，则更新标题
    if (titleSeed?.trim() && existing.title.startsWith("对话 ")) {
      let newTitle = titleSeed.trim().substring(0, 30);
      if (titleSeed.length > 30) newTitle += "...";

      return prisma.thread.update({
        where: { id: threadId },
        data: { title: newTitle },
      });
    }
    return existing;
  }

  // 生成智能标题
  let title: string;
  if (titleSeed?.trim()) {
    // 如果有消息内容，截取前30个字符作为标题
    title = titleSeed.trim().substring(0, 30);
    if (titleSeed.length > 30) title += "...";
  } else {
    // 否则使用时间戳
    const now = new Date();
    const timeStr = now.toLocaleTimeString("zh-CN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    title = `对话 ${timeStr}`;
  }

  return prisma.thread.create({ data: { id: threadId, title } });
}
