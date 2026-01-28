import { signIn } from "@/lib/auth";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export default async function LoginPage() {
  const session = await auth();

  // 如果已登录，重定向到首页
  if (session) {
    redirect("/");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[hsl(var(--background))] p-4">
      <div className="w-full max-w-md space-y-6 stardew-box p-8">
        {/* 星露谷风格装饰星星 */}
        <div className="flex justify-center mb-4">
          <svg
            viewBox="0 0 24 24"
            className="h-16 w-16 text-[#FFD700]"
            fill="currentColor"
          >
            <path d="M12 2l2.4 7.4h7.6l-6 4.6 2.3 7-6.3-4.6-6.3 4.6 2.3-7-6-4.6h7.6z" />
          </svg>
        </div>

        <div className="text-center space-y-3">
          <h1 className="text-3xl font-bold tracking-tight pixel-text text-[#451806] dark:text-[#F2E6C2]">
            Stardew Assistant
          </h1>
          <p className="text-sm text-[#6B4423] dark:text-[#8B7355] pixel-text">
            欢迎来到鹈鹕镇！
          </p>
          <p className="text-xs text-[#A05030] dark:text-[#C78F56]">
            使用 GitHub 账号登录开始你的冒险
          </p>
        </div>

        <form
          action={async () => {
            "use server";
            await signIn("github", { redirectTo: "/" });
          }}
          className="mt-8 space-y-4"
        >
          <button
            type="submit"
            className="w-full stardew-btn flex items-center justify-center gap-3 px-6 py-3 text-base font-bold text-white"
          >
            <svg
              className="h-5 w-5"
              fill="currentColor"
              viewBox="0 0 20 20"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z"
                clipRule="evenodd"
              />
            </svg>
            <span>使用 GitHub 登录</span>
          </button>
        </form>

        {/* 星露谷风格的装饰边框 */}
        <div className="flex items-center justify-center gap-2 pt-4">
          <div className="h-px flex-1 bg-[#552814] dark:bg-[#8B6F47]"></div>
          <svg
            viewBox="0 0 24 24"
            className="h-4 w-4 text-[#5DCC52]"
            fill="currentColor"
          >
            <path d="M12 2l2.4 7.4h7.6l-6 4.6 2.3 7-6.3-4.6-6.3 4.6 2.3-7-6-4.6h7.6z" />
          </svg>
          <div className="h-px flex-1 bg-[#552814] dark:bg-[#8B6F47]"></div>
        </div>

        <p className="text-center text-xs text-[#A05030] dark:text-[#C78F56] leading-relaxed">
          登录即表示您同意我们的服务条款和隐私政策
        </p>
      </div>
    </div>
  );
}
