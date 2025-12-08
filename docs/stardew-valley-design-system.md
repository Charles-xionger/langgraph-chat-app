# Stardew Valley 设计系统指南

> 一套完整的 Stardew Valley 风格 UI 设计系统，适用于 Next.js + Tailwind CSS 项目

## 目录

1. [设计理念](#设计理念)
2. [配色系统](#配色系统)
3. [核心组件样式](#核心组件样式)
4. [全局 CSS 类](#全局-css-类)
5. [图标与装饰](#图标与装饰)
6. [动画效果](#动画效果)
7. [组件示例](#组件示例)
8. [实现步骤](#实现步骤)

---

## 设计理念

### 核心特征

- **温暖与自然**：使用大地色系（棕色、米色、绿色、金色）
- **像素化元素**：保留复古游戏感
- **手工感**：边框、阴影模拟木质、纸张质感
- **明亮活泼**：使用鲜艳的强调色（金色、绿色、紫色）

### 设计原则

1. ✅ **优先使用 CSS 变量** - 易于维护和主题切换
2. ✅ **语义化命名** - 使用 `--stardew-*` 前缀
3. ✅ **深浅模式适配** - 所有颜色定义 `:root` 和 `.dark` 变体
4. ✅ **组件化样式** - 使用 `@layer components` 定义可复用类
5. ✅ **渐进增强** - 确保无 CSS 时也能正常使用

---

## 配色系统

### CSS 变量定义

在 `globals.css` 中定义：

```css
@layer base {
  :root {
    /* ========== Stardew 固定颜色（不随主题变化） ========== */
    --stardew-cream: #fffae6; /* 奶油色 - 主背景 */
    --stardew-parchment: #f2e6c2; /* 羊皮纸 - 卡片背景 */
    --stardew-wood-light: #c78f56; /* 浅木色 */
    --stardew-wood: #a05030; /* 木色 - 次要文字 */
    --stardew-wood-dark: #552814; /* 深木色 - 边框 */
    --stardew-text: #451806; /* 深棕色 - 主文字 */

    /* ========== 强调色 ========== */
    --stardew-gold: #ffd700; /* 金色 - 重要/高亮 */
    --stardew-green: #5dcc52; /* 绿色 - 成功/生长 */
    --stardew-purple: #9a55ff; /* 紫色 - 魔法/特殊 */
    --stardew-blue: #4fc3f7; /* 蓝色 - 水/天气 */

    /* ========== Tailwind 语义化变量（随主题变化） ========== */
    --background: 42 100% 96%; /* hsl(42, 100%, 96%) */
    --foreground: 15 78% 15%; /* hsl(15, 78%, 15%) */
    --card: 42 60% 92%;
    --card-foreground: 15 78% 15%;
    --popover: 42 60% 92%;
    --popover-foreground: 15 78% 15%;
    --primary: 142 76% 57%; /* 绿色 */
    --primary-foreground: 0 0% 100%;
    --secondary: 42 30% 70%;
    --secondary-foreground: 15 78% 15%;
    --muted: 42 30% 88%;
    --muted-foreground: 15 50% 35%;
    --accent: 45 93% 58%; /* 金色 */
    --accent-foreground: 15 78% 15%;
    --destructive: 0 84% 60%;
    --destructive-foreground: 0 0% 100%;
    --border: 15 40% 35%;
    --input: 15 40% 35%;
    --ring: 270 60% 65%; /* 紫色焦点环 */
  }

  .dark {
    /* ========== 暗色模式的语义化变量 ========== */
    --background: 220 25% 12%; /* 深蓝灰 */
    --foreground: 42 60% 90%; /* 浅米色 */
    --card: 220 20% 18%;
    --card-foreground: 42 60% 90%;
    --popover: 220 20% 18%;
    --popover-foreground: 42 60% 90%;
    --primary: 142 76% 57%;
    --primary-foreground: 0 0% 100%;
    --secondary: 220 15% 25%;
    --secondary-foreground: 42 60% 90%;
    --muted: 220 15% 22%;
    --muted-foreground: 42 30% 60%;
    --accent: 45 93% 58%;
    --accent-foreground: 220 25% 12%;
    --destructive: 0 62% 50%;
    --destructive-foreground: 0 0% 100%;
    --border: 35 40% 30%;
    --input: 35 40% 30%;
    --ring: 270 60% 65%;
  }
}
```

### 浅色模式配色表

| 用途     | CSS 变量              | 颜色值    | Tailwind 类示例                |
| -------- | --------------------- | --------- | ------------------------------ |
| 主背景   | `--stardew-cream`     | `#FFFAE6` | `bg-[--stardew-cream]`         |
| 卡片背景 | `--stardew-parchment` | `#F2E6C2` | `bg-[--stardew-parchment]`     |
| 主要文字 | `--stardew-text`      | `#451806` | `text-[--stardew-text]`        |
| 次要文字 | `--stardew-wood`      | `#A05030` | `text-[--stardew-wood]`        |
| 边框     | `--stardew-wood-dark` | `#552814` | `border-[--stardew-wood-dark]` |
| 金色强调 | `--stardew-gold`      | `#FFD700` | `text-[--stardew-gold]`        |
| 绿色强调 | `--stardew-green`     | `#5DCC52` | `text-[--stardew-green]`       |
| 紫色强调 | `--stardew-purple`    | `#9A55FF` | `text-[--stardew-purple]`      |

### 暗色模式配色表

| 用途     | 颜色值    | Tailwind 类示例                    |
| -------- | --------- | ---------------------------------- |
| 主背景   | `#1a1f2e` | `dark:bg-[#1a1f2e]`                |
| 卡片背景 | `#2a2f3e` | `dark:bg-[#2a2f3e]`                |
| 主要文字 | `#F2E6C2` | `dark:text-[--stardew-parchment]`  |
| 次要文字 | `#C78F56` | `dark:text-[--stardew-wood-light]` |
| 三级文字 | `#8B7355` | `dark:text-[#8B7355]`              |
| 边框     | `#8B6F47` | `dark:border-[#8B6F47]`            |
| 强调色   | 保持一致  | 使用浅色模式相同的金、绿、紫色     |

---

## 核心组件样式

### 1. Stardew Box (卡片容器)

**用途**：所有卡片、对话框、容器的基础样式

```css
@layer components {
  .stardew-box {
    background-color: var(--stardew-parchment);
    border: 3px solid var(--stardew-wood-dark);
    box-shadow: 0 4px 6px -1px rgba(69, 24, 6, 0.1), inset 0 2px 4px rgba(255, 250, 230, 0.6);
    color: var(--stardew-text);
  }

  .dark .stardew-box {
    background-color: hsl(220, 20%, 18%);
    border-color: hsl(35, 40%, 30%);
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3), inset 0 2px 4px rgba(255, 250, 230, 0.05);
    color: hsl(42, 60%, 90%);
  }
}
```

**使用示例**：

```tsx
<div className="stardew-box rounded-lg p-4">
  <h2 className="text-lg font-bold">标题</h2>
  <p className="text-sm">内容文字</p>
</div>
```

### 2. Inventory Slot (物品栏格子)

**用途**：输入框、小容器、物品格子

```css
@layer components {
  .inventory-slot {
    background: linear-gradient(135deg, #f2e6c2 0%, #e8dcc0 100%);
    border: 3px solid var(--stardew-wood-dark);
    box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.06);
  }

  .dark .inventory-slot {
    background: linear-gradient(
      135deg,
      hsl(220, 20%, 22%) 0%,
      hsl(220, 20%, 18%) 100%
    );
    border-color: hsl(35, 40%, 30%);
    box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.2);
  }
}
```

**使用示例**：

```tsx
<input
  type="text"
  className="inventory-slot rounded px-3 py-2 outline-none focus:ring-2 focus:ring-[--stardew-purple]"
  placeholder="输入文字..."
/>
```

### 3. Stardew Button (按钮)

**用途**：主要操作按钮

```css
@layer components {
  .stardew-btn {
    background: linear-gradient(to bottom, #7fc368 0%, #5dcc52 100%);
    border: 3px solid #4a9e3f;
    box-shadow: 0 4px 0 #3d7f33, 0 6px 8px rgba(0, 0, 0, 0.15);
    color: white;
    font-weight: 700;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
    transition: all 0.15s ease;
    position: relative;
    top: 0;
  }

  .stardew-btn:hover:not(:disabled) {
    background: linear-gradient(to bottom, #8fd378 0%, #6ddc62 100%);
    transform: translateY(-2px);
    box-shadow: 0 6px 0 #3d7f33, 0 8px 12px rgba(0, 0, 0, 0.2);
  }

  .stardew-btn:active:not(:disabled) {
    transform: translateY(2px);
    box-shadow: 0 2px 0 #3d7f33, 0 4px 6px rgba(0, 0, 0, 0.15);
  }

  .dark .stardew-btn {
    /* 暗色模式保持相同的绿色，因为这是品牌色 */
  }
}
```

**使用示例**：

```tsx
<button className="stardew-btn rounded px-6 py-3">开始冒险</button>
```

### 4. Pixel Text (像素字体)

**用途**：标题、重要文字

```css
@layer components {
  .pixel-text {
    font-family: "Press Start 2P", monospace; /* 或其他像素字体 */
    letter-spacing: 0.05em;
  }

  .pixel-text-sm {
    font-family: "Press Start 2P", monospace;
    font-size: 10px;
    letter-spacing: 0.05em;
  }
}
```

**字体引入**（在 `layout.tsx` 或 `globals.css`）：

```tsx
import { Press_Start_2P } from "next/font/google";

const pixelFont = Press_Start_2P({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-pixel",
});
```

或使用 CSS：

```css
@import url("https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap");
```

---

## 全局 CSS 类

### 完整的 globals.css

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  /* CSS 变量定义（见上方配色系统部分） */
  :root {
    /* ... */
  }

  .dark {
    /* ... */
  }

  * {
    @apply border-border;
  }

  body {
    @apply bg-background text-foreground;
  }
}

@layer components {
  /* ========== Stardew Box ========== */
  .stardew-box {
    background-color: var(--stardew-parchment);
    border: 3px solid var(--stardew-wood-dark);
    box-shadow: 0 4px 6px -1px rgba(69, 24, 6, 0.1), inset 0 2px 4px rgba(255, 250, 230, 0.6);
    color: var(--stardew-text);
  }

  .dark .stardew-box {
    background-color: hsl(220, 20%, 18%);
    border-color: hsl(35, 40%, 30%);
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3), inset 0 2px 4px rgba(255, 250, 230, 0.05);
    color: hsl(42, 60%, 90%);
  }

  /* ========== Inventory Slot ========== */
  .inventory-slot {
    background: linear-gradient(135deg, #f2e6c2 0%, #e8dcc0 100%);
    border: 3px solid var(--stardew-wood-dark);
    box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.06);
  }

  .dark .inventory-slot {
    background: linear-gradient(
      135deg,
      hsl(220, 20%, 22%) 0%,
      hsl(220, 20%, 18%) 100%
    );
    border-color: hsl(35, 40%, 30%);
    box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.2);
  }

  /* ========== Stardew Button ========== */
  .stardew-btn {
    background: linear-gradient(to bottom, #7fc368 0%, #5dcc52 100%);
    border: 3px solid #4a9e3f;
    box-shadow: 0 4px 0 #3d7f33, 0 6px 8px rgba(0, 0, 0, 0.15);
    color: white;
    font-weight: 700;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
    transition: all 0.15s ease;
    position: relative;
    top: 0;
  }

  .stardew-btn:hover:not(:disabled) {
    background: linear-gradient(to bottom, #8fd378 0%, #6ddc62 100%);
    transform: translateY(-2px);
    box-shadow: 0 6px 0 #3d7f33, 0 8px 12px rgba(0, 0, 0, 0.2);
  }

  .stardew-btn:active:not(:disabled) {
    transform: translateY(2px);
    box-shadow: 0 2px 0 #3d7f33, 0 4px 6px rgba(0, 0, 0, 0.15);
  }

  .stardew-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  /* ========== Pixel Text ========== */
  .pixel-text {
    font-family: "Press Start 2P", monospace;
    letter-spacing: 0.05em;
  }

  .pixel-text-sm {
    font-family: "Press Start 2P", monospace;
    font-size: 10px;
    letter-spacing: 0.05em;
  }
}

@layer utilities {
  /* ========== 圆角快捷类 ========== */
  .rounded-none\! {
    border-radius: 0 !important;
  }
}
```

---

## 图标与装饰

### Emoji 推荐

Stardew Valley 风格常用 emoji：

| 类别 | Emoji             | 用途             |
| ---- | ----------------- | ---------------- |
| 自然 | 🌱 🌿 🌳 🌾 🍃    | 成长、生命、植物 |
| 天气 | ☀️ ⛅ ☁️ 🌧️ ⛈️ ❄️ | 天气状态         |
| 动物 | 🐔 🐄 🐑 🐷 🐴    | 农场动物         |
| 工具 | ⛏️ 🔧 🔨 ⚒️       | 工具调用         |
| 食物 | 🍎 🍇 🥕 🌽 🍞    | 物品、奖励       |
| 符号 | ⭐ ✨ 💎 💰 🎁    | 重要、特殊、奖励 |
| 表情 | 😊 😴 💪 ❤️       | 状态、心情       |
| 能量 | ⚡ 🔥 🔋 💧       | 能量、消耗       |

### 自定义 SVG 图标

Stardew Valley 风格星星：

```tsx
function StardewStar() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5 text-[--stardew-gold]"
      fill="currentColor"
    >
      <path d="M12 2l2.4 7.4h7.6l-6 4.6 2.3 7-6.3-4.6-6.3 4.6 2.3-7-6-4.6h7.6z" />
    </svg>
  );
}
```

### Lucide 图标推荐

```tsx
import {
  Sprout, // 🌱 植物生长
  TreePine, // 🌲 树木
  Cloud, // ☁️ 天气
  Sun, // ☀️ 晴天
  Droplets, // 💧 水分
  Wind, // 💨 风
  Hammer, // 🔨 工具
  Wrench, // 🔧 工具
  Star, // ⭐ 星星
  Heart, // ❤️ 生命/喜爱
  Zap, // ⚡ 能量
} from "lucide-react";
```

---

## 动画效果

### CSS 动画定义

在 `globals.css` 中添加：

```css
@keyframes junimo-bounce {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-8px);
  }
}

@keyframes sparkle {
  0%,
  100% {
    transform: scale(1) rotate(0deg);
    opacity: 1;
  }
  50% {
    transform: scale(1.2) rotate(180deg);
    opacity: 0.8;
  }
}

@keyframes float {
  0%,
  100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-10px);
  }
}

@keyframes pulse-glow {
  0%,
  100% {
    box-shadow: 0 0 10px rgba(255, 215, 0, 0.5);
  }
  50% {
    box-shadow: 0 0 20px rgba(255, 215, 0, 0.8);
  }
}
```

### Tailwind 配置

在 `tailwind.config.ts` 中添加：

```typescript
const config: Config = {
  theme: {
    extend: {
      animation: {
        "junimo-bounce": "junimo-bounce 1s ease-in-out infinite",
        sparkle: "sparkle 2s ease-in-out infinite",
        float: "float 3s ease-in-out infinite",
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
      },
      keyframes: {
        "junimo-bounce": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
        // ... 其他动画
      },
    },
  },
};
```

### 使用示例

```tsx
// 加载动画
<div className="flex items-center gap-1">
  <div className="h-2.5 w-2.5 junimo-bounce rounded-full bg-[--stardew-green] [animation-delay:-0.3s]"></div>
  <div className="h-2.5 w-2.5 junimo-bounce rounded-full bg-[--stardew-gold] [animation-delay:-0.15s]"></div>
  <div className="h-2.5 w-2.5 junimo-bounce rounded-full bg-[--stardew-purple]"></div>
</div>

// 星星闪烁
<Star className="h-5 w-5 text-[--stardew-gold] animate-sparkle" />
```

---

## 组件示例

### 1. 卡片组件

```tsx
interface StardewCardProps {
  title: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
}

export function StardewCard({ title, children, icon }: StardewCardProps) {
  return (
    <div className="stardew-box rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3 border-b-2 border-[--stardew-wood-dark] dark:border-[#8B6F47] pb-2">
        {icon && <span className="text-[--stardew-gold]">{icon}</span>}
        <h3 className="font-bold text-[--stardew-text] dark:text-[--stardew-parchment]">
          {title}
        </h3>
      </div>
      <div className="text-sm text-[--stardew-wood] dark:text-[--stardew-wood-light]">
        {children}
      </div>
    </div>
  );
}
```

**使用**：

```tsx
<StardewCard title="农场信息" icon={<Sprout className="h-4 w-4" />}>
  <p>你的农场正在茁壮成长！</p>
</StardewCard>
```

### 2. 输入框组件

```tsx
interface StardewInputProps {
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  icon?: React.ReactNode;
}

export function StardewInput({
  placeholder,
  value,
  onChange,
  icon,
}: StardewInputProps) {
  return (
    <div className="relative">
      {icon && (
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[--stardew-wood] dark:text-[--stardew-wood-light]">
          {icon}
        </div>
      )}
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`
          w-full inventory-slot rounded px-3 py-2 
          ${icon ? "pl-10" : ""}
          text-[--stardew-text] dark:text-[--stardew-parchment]
          placeholder:text-[--stardew-wood]/60 dark:placeholder:text-[--stardew-wood-light]/60
          outline-none focus:ring-2 focus:ring-[--stardew-purple]
          transition-all
        `}
      />
    </div>
  );
}
```

### 3. 按钮组件

```tsx
interface StardewButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: "primary" | "secondary" | "danger";
}

export function StardewButton({
  children,
  onClick,
  disabled,
  variant = "primary",
}: StardewButtonProps) {
  const variants = {
    primary:
      "stardew-btn bg-gradient-to-b from-[#7fc368] to-[#5dcc52] border-[#4a9e3f]",
    secondary:
      "stardew-btn bg-gradient-to-b from-[#C78F56] to-[#A05030] border-[#552814]",
    danger:
      "stardew-btn bg-gradient-to-b from-[#E05555] to-[#C84848] border-[#8B2828]",
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${variants[variant]} rounded px-6 py-3 text-white`}
    >
      {children}
    </button>
  );
}
```

### 4. 工具调用卡片

```tsx
interface ToolCardProps {
  name: string;
  status: "pending" | "success" | "error";
  children: React.ReactNode;
}

export function ToolCard({ name, status, children }: ToolCardProps) {
  const statusConfig = {
    pending: {
      border: "border-[--stardew-purple]",
      icon: "⚙️",
      text: "处理中...",
    },
    success: {
      border: "border-[--stardew-green]",
      icon: "✅",
      text: "完成",
    },
    error: {
      border: "border-red-600",
      icon: "⚠️",
      text: "失败",
    },
  };

  const config = statusConfig[status];

  return (
    <div className={`stardew-box rounded-lg p-3 border-2 ${config.border}`}>
      <div className="flex items-center gap-2 mb-2">
        <span>{config.icon}</span>
        <span className="text-xs font-medium text-[--stardew-wood] dark:text-[--stardew-wood-light]">
          {name} - {config.text}
        </span>
      </div>
      <div className="text-sm">{children}</div>
    </div>
  );
}
```

### 5. 能量条组件

```tsx
interface EnergyBarProps {
  current: number;
  max: number;
  label?: string;
}

export function EnergyBar({ current, max, label }: EnergyBarProps) {
  const percentage = Math.min((current / max) * 100, 100);

  const getColor = () => {
    if (percentage > 66) return "from-[#5DCC52] to-[#7FE89A]";
    if (percentage > 33) return "from-[#FFD700] to-[#FFA500]";
    return "from-[#FF6B6B] to-[#D84545]";
  };

  return (
    <div className="flex items-center gap-2">
      {label && (
        <span className="text-xs text-[--stardew-wood] dark:text-[--stardew-wood-light]">
          {label}
        </span>
      )}
      <div className="flex-1 h-3 bg-[#8B4513]/30 dark:bg-[#4a3728] rounded-full overflow-hidden border border-[--stardew-wood-dark] dark:border-[#8B6F47]">
        <div
          className={`h-full bg-gradient-to-r ${getColor()} transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="text-xs font-mono text-[--stardew-text] dark:text-[--stardew-parchment]">
        {current}/{max}
      </span>
    </div>
  );
}
```

### 6. 消息气泡组件

```tsx
interface MessageBubbleProps {
  content: string;
  type: "user" | "ai";
  avatar?: string;
}

export function MessageBubble({ content, type, avatar }: MessageBubbleProps) {
  return (
    <div
      className={`flex gap-3 ${
        type === "user" ? "justify-end" : "justify-start"
      }`}
    >
      {type === "ai" && avatar && (
        <div className="shrink-0">
          <img src={avatar} alt="AI" className="w-8 h-8 object-contain" />
        </div>
      )}

      <div
        className={`
        max-w-[80%] stardew-box rounded-2xl px-4 py-3
        ${type === "user" ? "border-2 border-[--stardew-gold]" : ""}
      `}
      >
        <p className="text-sm text-[--stardew-text] dark:text-[--stardew-parchment]">
          {content}
        </p>
      </div>

      {type === "user" && avatar && (
        <div className="shrink-0">
          <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-[--stardew-gold] inventory-slot">
            <img
              src={avatar}
              alt="User"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      )}
    </div>
  );
}
```

### 7. 加载指示器

```tsx
export function JunimoLoader() {
  return (
    <div className="flex items-center gap-3 inventory-slot rounded-lg px-4 py-2">
      <div className="flex items-center gap-1">
        <div className="h-2.5 w-2.5 junimo-bounce rounded-full bg-[--stardew-green] [animation-delay:-0.3s]"></div>
        <div className="h-2.5 w-2.5 junimo-bounce rounded-full bg-[--stardew-gold] [animation-delay:-0.15s]"></div>
        <div className="h-2.5 w-2.5 junimo-bounce rounded-full bg-[--stardew-purple]"></div>
      </div>
      <span className="pixel-text-sm text-[--stardew-wood] dark:text-[--stardew-wood-light]">
        Loading...
      </span>
    </div>
  );
}
```

---

## 实现步骤

### 步骤 1: 初始化项目

```bash
# 创建 Next.js 项目
npx create-next-app@latest my-stardew-app --typescript --tailwind --app

cd my-stardew-app
```

### 步骤 2: 配置 Tailwind

**tailwind.config.ts**:

```typescript
import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class", // 重要！使用 class 策略
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // 可以在这里定义颜色别名
        "stardew-cream": "#FFFAE6",
        "stardew-parchment": "#F2E6C2",
        "stardew-wood": "#A05030",
        "stardew-gold": "#FFD700",
        "stardew-green": "#5DCC52",
        "stardew-purple": "#9A55FF",
      },
      animation: {
        "junimo-bounce": "junimo-bounce 1s ease-in-out infinite",
        sparkle: "sparkle 2s ease-in-out infinite",
      },
      keyframes: {
        "junimo-bounce": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
        sparkle: {
          "0%, 100%": {
            transform: "scale(1) rotate(0deg)",
            opacity: "1",
          },
          "50%": {
            transform: "scale(1.2) rotate(180deg)",
            opacity: "0.8",
          },
        },
      },
    },
  },
  plugins: [],
};

export default config;
```

### 步骤 3: 设置全局样式

创建 `app/globals.css`，复制上方完整的 globals.css 内容。

### 步骤 4: 配置主题切换

**app/layout.tsx**:

```tsx
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <head>
        {/* 系统主题检测脚本 */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
                
                window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
                  if (e.matches) {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                });
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body className="bg-[--stardew-cream] dark:bg-[#1a1f2e] text-[--stardew-text] dark:text-[--stardew-parchment]">
        {children}
      </body>
    </html>
  );
}
```

### 步骤 5: 添加字体（可选）

安装像素字体：

```bash
pnpm add next/font
```

**app/layout.tsx**:

```tsx
import { Press_Start_2P } from "next/font/google";

const pixelFont = Press_Start_2P({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-pixel",
});

export default function RootLayout({ children }) {
  return (
    <html lang="zh-CN" className={pixelFont.variable}>
      {/* ... */}
    </html>
  );
}
```

### 步骤 6: 准备资源文件

在 `public/` 目录下准备：

- `junimo.png` - Junimo 头像
- `junimo-dance.gif` - 加载动画
- `jack-o-lantern.png` - 用户头像
- 其他游戏相关图标

### 步骤 7: 创建组件库

建议的文件结构：

```
components/
├── ui/
│   ├── StardewCard.tsx
│   ├── StardewButton.tsx
│   ├── StardewInput.tsx
│   ├── EnergyBar.tsx
│   ├── MessageBubble.tsx
│   └── JunimoLoader.tsx
├── layout/
│   ├── Header.tsx
│   ├── Sidebar.tsx
│   └── MainLayout.tsx
└── shared/
    ├── ToolCard.tsx
    └── UserAvatar.tsx
```

---

## 最佳实践

### 1. 颜色使用优先级

```tsx
// ✅ 优先使用 CSS 变量
<div className="bg-[--stardew-parchment] text-[--stardew-text]">

// ✅ 次选：Tailwind 语义化类
<div className="bg-background text-foreground">

// ⚠️ 备选：硬编码颜色（需要 dark: 变体）
<div className="bg-[#F2E6C2] dark:bg-[#2a2f3e]">
```

### 2. 响应式设计

```tsx
// 使用 Tailwind 响应式前缀
<div className="
  stardew-box
  p-2 md:p-4 lg:p-6
  text-sm md:text-base
  w-full md:w-auto
">
```

### 3. 动画性能

```tsx
// ✅ 使用 transform 和 opacity
<div className="transition-transform hover:scale-105">

// ❌ 避免动画 width, height
<div className="transition-all hover:w-full"> {/* 性能差 */}
```

### 4. 无障碍访问

```tsx
// 添加 ARIA 属性
<button className="stardew-btn" aria-label="开始新游戏" disabled={loading}>
  {loading ? "加载中..." : "开始"}
</button>
```

### 5. 组件复用

创建可复用的基础组件，通过 props 控制变体：

```tsx
interface CardProps {
  variant?: "default" | "gold" | "purple";
  children: React.ReactNode;
}

export function Card({ variant = "default", children }: CardProps) {
  const borderColors = {
    default: "border-[--stardew-wood-dark]",
    gold: "border-[--stardew-gold]",
    purple: "border-[--stardew-purple]",
  };

  return (
    <div
      className={`stardew-box rounded-lg p-4 border-2 ${borderColors[variant]}`}
    >
      {children}
    </div>
  );
}
```

---

## 常见问题

### Q: 如何处理第三方组件库的样式？

**A**: 覆盖样式并保持 Stardew 风格：

```tsx
// 例如：react-select
import Select from "react-select";

const customStyles = {
  control: (base) => ({
    ...base,
    background: "var(--stardew-parchment)",
    border: "3px solid var(--stardew-wood-dark)",
    borderRadius: "8px",
    boxShadow: "inset 0 2px 4px rgba(0, 0, 0, 0.06)",
  }),
  // ...
};

<Select styles={customStyles} />;
```

### Q: 如何确保暗色模式正确工作？

**A**: 确保：

1. `tailwind.config.ts` 中设置 `darkMode: "class"`
2. `layout.tsx` 中添加主题检测脚本
3. 所有自定义 CSS 类都定义 `.dark` 变体
4. 测试时切换系统主题验证

### Q: 性能优化建议？

**A**:

- 使用 `next/image` 优化图片
- 动画使用 `transform` 和 `opacity`
- 大型列表使用虚拟滚动
- 懒加载非关键组件

```tsx
import dynamic from "next/dynamic";

const HeavyComponent = dynamic(() => import("./HeavyComponent"), {
  loading: () => <JunimoLoader />,
});
```

---

## 扩展资源

### 推荐工具

- **配色工具**: [Coolors](https://coolors.co/)
- **渐变生成**: [CSS Gradient](https://cssgradient.io/)
- **阴影生成**: [Box Shadow Generator](https://box-shadow.dev/)
- **像素艺术**: [Piskel](https://www.piskelapp.com/)

### 游戏资源参考

- Stardew Valley Wiki（颜色参考）
- 游戏截图（UI 布局参考）
- 像素字体库：[Google Fonts - Press Start 2P](https://fonts.google.com/specimen/Press+Start+2P)

### 相关库

```bash
# 动画
pnpm add framer-motion

# 图标
pnpm add lucide-react

# 日期处理
pnpm add date-fns

# Token 计算（如果是 AI 应用）
pnpm add gpt-tokenizer
```

---

## 快速启动模板

### 完整示例页面

```tsx
import { StardewCard } from "@/components/ui/StardewCard";
import { StardewButton } from "@/components/ui/StardewButton";
import { EnergyBar } from "@/components/ui/EnergyBar";
import { MessageBubble } from "@/components/ui/MessageBubble";
import { Sprout, Heart, Star } from "lucide-react";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[--stardew-cream] dark:bg-[#1a1f2e] p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* 标题 */}
        <h1 className="pixel-text text-2xl text-[--stardew-text] dark:text-[--stardew-parchment] flex items-center gap-3">
          <Star className="h-6 w-6 text-[--stardew-gold] animate-sparkle" />
          Stardew Valley Style App
        </h1>

        {/* 卡片网格 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <StardewCard title="农场状态" icon={<Sprout className="h-4 w-4" />}>
            <EnergyBar current={75} max={100} label="能量" />
            <EnergyBar current={120} max={200} label="健康" />
          </StardewCard>

          <StardewCard title="每日任务" icon={<Heart className="h-4 w-4" />}>
            <ul className="space-y-2">
              <li className="flex items-center gap-2">
                <input type="checkbox" className="accent-[--stardew-green]" />
                <span>浇水作物</span>
              </li>
              <li className="flex items-center gap-2">
                <input type="checkbox" className="accent-[--stardew-green]" />
                <span>喂养动物</span>
              </li>
            </ul>
          </StardewCard>
        </div>

        {/* 消息区 */}
        <div className="space-y-3">
          <MessageBubble
            type="ai"
            content="欢迎来到星露谷！今天你想做什么？"
            avatar="/junimo.png"
          />
          <MessageBubble
            type="user"
            content="我想种植一些草莓！"
            avatar="/jack-o-lantern.png"
          />
        </div>

        {/* 操作按钮 */}
        <div className="flex gap-3">
          <StardewButton variant="primary">🌱 开始种植</StardewButton>
          <StardewButton variant="secondary">📦 打开背包</StardewButton>
        </div>
      </div>
    </main>
  );
}
```

---

## 版本历史

- **v1.0.0** (2025-12-08) - 初始版本
  - 完整的配色系统
  - 核心组件样式
  - 动画效果
  - 组件示例
  - 实现步骤

---

## 贡献指南

欢迎提交 PR 改进此设计系统！

建议改进方向：

- 更多组件变体
- 新的动画效果
- 无障碍性增强
- 性能优化技巧
- 更多实用示例

---

## 许可证

本设计系统灵感来源于 Stardew Valley 游戏，仅供学习和个人项目使用。

---

**Happy Coding! 🌾✨**
