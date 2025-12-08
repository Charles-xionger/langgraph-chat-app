# 主题系统指南

## 目录

1. [当前主题系统架构](#当前主题系统架构)
2. [主题系统工作原理](#主题系统工作原理)
3. [问题诊断与解决过程](#问题诊断与解决过程)
4. [开发新组件时的注意事项](#开发新组件时的注意事项)
5. [统一的配色方案](#统一的配色方案)

---

## 当前主题系统架构

### 核心机制

项目使用 **Tailwind CSS 的 class 策略** 实现暗色模式，完全由 **系统主题驱动**，不再有手动切换功能。

### 关键配置文件

#### 1. `tailwind.config.ts`

```typescript
const config: Config = {
  darkMode: "class", // 使用 class 策略，通过 html 标签上的 dark 类控制
  // ...
};
```

#### 2. `app/layout.tsx`

在 `<head>` 中注入初始化脚本，负责：

- 检测系统主题 `prefers-color-scheme`
- 根据系统主题添加/移除 `<html>` 标签的 `dark` 类
- 监听系统主题变化并实时响应

```tsx
<head>
  <script
    dangerouslySetInnerHTML={{
      __html: `
        try {
          // 检测系统主题
          if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            document.documentElement.classList.add('dark');
          } else {
            document.documentElement.classList.remove('dark');
          }
          
          // 监听系统主题变化
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
```

#### 3. `app/globals.css`

定义全局 CSS 变量和组件样式：

```css
@layer base {
  :root {
    /* 浅色模式的颜色变量 */
    --stardew-cream: #fffae6;
    --stardew-parchment: #f2e6c2;
    /* ... */
  }

  .dark {
    /* 暗色模式的颜色变量 */
    --background: 220 25% 12%;
    --foreground: 42 60% 90%;
    /* ... */
  }
}

@layer components {
  /* stardew-box 组件样式 */
  .stardew-box {
    background-color: var(--stardew-parchment);
    /* ... */
  }

  .dark .stardew-box {
    background-color: hsl(220, 20%, 18%);
    /* ... */
  }

  /* inventory-slot 组件样式 */
  .inventory-slot {
    background: linear-gradient(/* 浅色渐变 */);
  }

  .dark .inventory-slot {
    background: linear-gradient(/* 暗色渐变 */);
  }
}
```

---

## 主题系统工作原理

### 1. 初始化流程

```
页面加载
  ↓
执行 layout.tsx 中的脚本
  ↓
检测系统主题 (prefers-color-scheme)
  ↓
添加/移除 <html class="dark">
  ↓
Tailwind CSS 应用对应的 dark: 样式
```

### 2. 主题切换流程

```
用户在 macOS 切换系统主题
  ↓
触发 matchMedia('prefers-color-scheme: dark') 的 change 事件
  ↓
事件监听器更新 <html> 的 dark 类
  ↓
所有组件的 dark: 样式立即生效
```

### 3. Tailwind CSS 的 dark: 工作方式

```html
<!-- 浅色模式 -->
<html>
  <div class="bg-[#FFFAE6] dark:bg-[#1a1f2e]">
    <!-- 应用 bg-[#FFFAE6] -->
  </div>
</html>

<!-- 暗色模式 -->
<html class="dark">
  <div class="bg-[#FFFAE6] dark:bg-[#1a1f2e]">
    <!-- 应用 bg-[#1a1f2e] -->
  </div>
</html>
```

---

## 问题诊断与解决过程

### 原始问题

1. **主题变量和硬编码混用** - 部分组件使用 ThemeContext，部分直接硬编码颜色
2. **ThemeToggle 与 Tailwind 冲突** - 手动控制主题与 Tailwind 的 dark: 机制不协调
3. **某些组件不跟随系统主题** - 缺少 dark: 变体或使用了固定的暗色

### 解决步骤

#### 第 1 步：移除混乱的主题控制

删除文件：

- `components/ThemeToggle.tsx` - 手动主题切换按钮
- `contexts/ThemeContext.tsx` - 主题上下文（未被使用）

修改文件：

- `components/MainLayout.tsx` - 移除 ThemeToggle 导入和使用
- `components/Siderbar.tsx` - 移除 ThemeToggle 导入和使用
- `components/Providers.tsx` - 移除 ThemeProvider（已完成）

#### 第 2 步：统一使用 Tailwind dark: 模式

更新 `app/layout.tsx`，移除 localStorage 控制，只跟随系统主题。

#### 第 3 步：修复所有组件的暗色模式样式

**修复原则**：每个颜色属性都要有对应的 `dark:` 变体

##### 示例 1: Sidebar

```tsx
// ❌ 错误 - 暗色模式下仍显示浅色
<div className="text-[#451806]">

// ✅ 正确 - 添加暗色变体
<div className="text-[#451806] dark:text-[#F2E6C2]">
```

##### 示例 2: Composer

```tsx
// ❌ 错误 - 背景色没有暗色变体
<div className="bg-[#F2E6C2]">

// ✅ 正确 - 添加暗色背景
<div className="bg-[#F2E6C2] dark:bg-[#1a1f2e]">
```

##### 示例 3: ConversationRow

```tsx
// ❌ 错误 - 多个颜色属性缺少暗色变体
<input className="bg-[#FFFAE6] text-[#451806]" />

// ✅ 正确 - 所有颜色都有暗色变体
<input className="bg-[#FFFAE6] dark:bg-[#2a2f3e] text-[#451806] dark:text-[#F2E6C2]" />
```

#### 第 4 步：修复特殊组件

##### MessageContent.tsx - 代码高亮主题

这个组件比较特殊，需要监听系统主题变化来切换代码高亮库的主题：

```tsx
export const MessageContent = ({ message }: MessageContentProps) => {
  const [isDark, setIsDark] = useState(false);

  // 监听系统主题变化
  useEffect(() => {
    const checkTheme = () => {
      setIsDark(document.documentElement.classList.contains("dark"));
    };

    checkTheme();

    // 监听 html 标签的 class 变化
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  // 根据系统主题选择代码高亮样式
  const currentTheme = isDark
    ? darkThemeStyles[theme]
    : lightThemeStyles[theme];

  // ...
};
```

##### globals.css - 自定义组件类

CSS 中的自定义类也需要暗色变体：

```css
/* 浅色模式样式 */
.inventory-slot {
  background: linear-gradient(135deg, #f2e6c2 0%, #e8dcc0 100%);
  border: 3px solid var(--stardew-wood-dark);
}

/* 暗色模式样式 */
.dark .inventory-slot {
  background: linear-gradient(
    135deg,
    hsl(220, 20%, 22%) 0%,
    hsl(220, 20%, 18%) 100%
  );
  border-color: hsl(35, 40%, 30%);
}
```

---

## 开发新组件时的注意事项

### ✅ 必须遵守的规则

#### 1. **优先使用 CSS 变量，避免硬编码颜色**

```tsx
// ✅ 推荐 - 使用语义化的 CSS 变量
<div className="bg-background text-foreground border border-border">
  <p className="text-muted-foreground">次要文字</p>
</div>

// ⚠️ 仅在特殊需求时使用 - 硬编码颜色需要 dark: 变体
<div className="bg-[#FFFAE6] dark:bg-[#1a1f2e] text-[#451806] dark:text-[#F2E6C2]">
```

**CSS 变量的优势**：

- 无需写 `dark:` 变体，自动适配
- 语义化命名，代码更易读
- 统一修改，维护成本低

**何时使用硬编码**：

- Stardew Valley 特有颜色（金色 `#FFD700`、绿色 `#5DCC52`、紫色 `#9A55FF`）
- 需要精确控制而非语义化的场景

#### 2. **如果必须硬编码，所有颜色属性都要有 dark: 变体**

```tsx
// 包括但不限于：
className="
  bg-[color] dark:bg-[color]           // 背景色
  text-[color] dark:text-[color]       // 文字颜色
  border-[color] dark:border-[color]   // 边框颜色
  placeholder:text-[color] dark:placeholder:text-[color]  // placeholder
  hover:bg-[color] dark:hover:bg-[color]  // 悬停状态
"
```

#### 3. **了解可用的 CSS 变量**

在 `globals.css` 中定义的变量：

```tsx
// 背景和前景
bg - background; // 主背景
bg - foreground; // 前景背景
text - foreground; // 主文字色

// 卡片
bg - card; // 卡片背景
text - card - foreground; // 卡片文字

// 弹出层
bg - popover; // 弹出层背景
text - popover - foreground; // 弹出层文字

// 主要/次要
bg - primary; // 主要按钮背景
text - primary - foreground; // 主要按钮文字
bg - secondary; // 次要按钮背景
text - secondary - foreground; // 次要按钮文字

// 静音
bg - muted; // 静音背景
text - muted - foreground; // 静音文字（次要文字）

// 强调
bg - accent; // 强调背景
text - accent - foreground; // 强调文字

// 边框和输入
border - border; // 边框色
border - input; // 输入框边框

// 其他
bg - destructive; // 删除/危险操作
ring - ring; // 焦点环
```

**使用示例**：

```tsx
// 标准卡片
<div className="bg-card text-card-foreground border border-border">
  <h2 className="text-foreground">标题</h2>
  <p className="text-muted-foreground">描述文字</p>
</div>

// 按钮
<button className="bg-primary text-primary-foreground hover:bg-primary/90">
  主要按钮
</button>

<button className="bg-secondary text-secondary-foreground hover:bg-secondary/80">
  次要按钮
</button>
```

#### 4. **使用统一的颜色方案**

参考[统一的配色方案](#统一的配色方案)章节。

**优先级**：

1. 🥇 **首选**：使用 CSS 变量（`bg-background`, `text-foreground` 等）
2. 🥈 **次选**：使用全局 CSS 类（`stardew-box`, `inventory-slot` 等）
3. 🥉 **备选**：硬编码颜色 + `dark:` 变体（仅在必要时）

#### 5. **测试两种主题**

开发完成后，切换 macOS 系统主题测试：

- macOS 浅色模式 → 检查应用是否正常显示
- macOS 暗色模式 → 检查应用是否正常显示

#### 6. **避免硬编码内联样式**

```tsx
// ❌ 避免 - 内联样式无法使用 dark:
<div style={{ backgroundColor: '#FFFAE6' }}>

// ✅ 推荐 - 使用 Tailwind 类和 CSS 变量
<div className="bg-background">
// 或
<div className="bg-[#FFFAE6] dark:bg-[#1a1f2e]">
```

特殊情况（如代码高亮）需要内联样式时，使用 JavaScript 动态设置：

```tsx
const [isDark, setIsDark] = useState(false);
// ... 监听主题变化的逻辑

<div style={{ backgroundColor: isDark ? '#1a1f2e' : '#FFFAE6' }}>
```

#### 7. **使用全局 CSS 类时要定义暗色变体**

在 `globals.css` 中定义新的组件类时：

```css
@layer components {
  .my-custom-component {
    /* 浅色模式样式 */
  }

  .dark .my-custom-component {
    /* 暗色模式样式 - 必须定义 */
  }
}
```

---

## 统一的配色方案

### Stardew Valley 配色系统

#### 浅色模式（日间）

| 用途           | 颜色值    | Tailwind 类        |
| -------------- | --------- | ------------------ |
| 主背景         | `#FFFAE6` | `bg-[#FFFAE6]`     |
| 卡片背景       | `#F2E6C2` | `bg-[#F2E6C2]`     |
| 主要文字       | `#451806` | `text-[#451806]`   |
| 次要文字       | `#A05030` | `text-[#A05030]`   |
| 边框           | `#552814` | `border-[#552814]` |
| 强调色（金色） | `#FFD700` | `text-[#FFD700]`   |
| 强调色（绿色） | `#5DCC52` | `text-[#5DCC52]`   |
| 强调色（紫色） | `#9A55FF` | `text-[#9A55FF]`   |

#### 暗色模式（夜间）

| 用途     | 颜色值                 | Tailwind 类             |
| -------- | ---------------------- | ----------------------- |
| 主背景   | `#1a1f2e`              | `dark:bg-[#1a1f2e]`     |
| 卡片背景 | `#2a2f3e`              | `dark:bg-[#2a2f3e]`     |
| 主要文字 | `#F2E6C2`              | `dark:text-[#F2E6C2]`   |
| 次要文字 | `#C78F56`              | `dark:text-[#C78F56]`   |
| 三级文字 | `#8B7355`              | `dark:text-[#8B7355]`   |
| 边框     | `#3d2f1f` 或 `#8B6F47` | `dark:border-[#3d2f1f]` |
| 强调色   | 保持一致（金、绿、紫） | 同浅色模式              |

### 常用组件样式参考

#### 最佳实践：三种使用 CSS 变量的方式

##### 方式 1：直接使用语义化类名（最推荐）

```tsx
// ✅ 最推荐 - Tailwind 内置的语义化类名
<h1 className="text-foreground">        // 自动适配浅色/暗色
<p className="text-muted-foreground">   // 次要文字
<div className="bg-background">         // 主背景
<div className="bg-card">               // 卡片背景
<div className="border border-border">  // 边框
```

**优点**：

- ✅ 最简洁，可读性最好
- ✅ 自动适配主题，无需 `dark:` 变体
- ✅ Tailwind 官方推荐方式

##### 方式 2：使用 CSS 变量的任意值语法（推荐）

```tsx
// ✅ 推荐 - 使用自定义 CSS 变量
<div className="bg-[--stardew-cream]">           // 使用自定义变量
<div className="text-[--stardew-text]">
<div className="border-[--stardew-wood-dark]">

// 配合 Tailwind 函数
<div className="bg-[hsl(var(--background))]">   // 使用 HSL 变量
<div className="text-[hsl(var(--foreground))]">
```

**优点**：

- ✅ 可以使用任何自定义 CSS 变量
- ✅ 仍然自动适配主题
- ✅ 适合使用 Stardew 特定颜色变量

**注意**：

- 变量必须在 `globals.css` 的 `:root` 和 `.dark` 中定义
- 使用 HSL 变量时需要加 `hsl()` 函数

##### 方式 3：硬编码颜色 + dark: 变体（仅特殊场景）

```tsx
// ⚠️ 备选 - 需要精确控制颜色时
<h1 className="text-[#451806] dark:text-[#F2E6C2]">
<p className="text-[#A05030] dark:text-[#C78F56]">
```

**使用场景**：

- 一次性使用的特殊颜色
- 不需要通过 CSS 变量管理的颜色

---

#### 实际使用示例对比

```tsx
// 场景 1: 标准卡片组件
// ✅ 方式 1 - 最简洁
<div className="bg-card text-card-foreground border border-border">
  <h2 className="text-foreground">标题</h2>
  <p className="text-muted-foreground">描述</p>
</div>

// ✅ 方式 2 - 使用自定义变量
<div className="bg-[--stardew-parchment] text-[--stardew-text] border border-[--stardew-wood-dark]">
  <h2 className="text-[--stardew-text]">标题</h2>
  <p className="text-[--stardew-wood]">描述</p>
</div>

// ⚠️ 方式 3 - 硬编码
<div className="bg-[#F2E6C2] dark:bg-[#2a2f3e] text-[#451806] dark:text-[#F2E6C2]">
  <h2 className="text-[#451806] dark:text-[#F2E6C2]">标题</h2>
  <p className="text-[#A05030] dark:text-[#C78F56]">描述</p>
</div>

// 场景 2: 使用 Stardew 金色强调
// ✅ 推荐 - 使用变量
<span className="text-[--stardew-gold]">⭐ 特殊标记</span>

// 或硬编码（颜色不会变）
<span className="text-[#FFD700]">⭐ 特殊标记</span>
```

---

#### 如何定义可用的 CSS 变量

在 `globals.css` 中：

```css
@layer base {
  :root {
    /* Stardew 固定颜色（不随主题变化） */
    --stardew-cream: #fffae6;
    --stardew-parchment: #f2e6c2;
    --stardew-wood-light: #c78f56;
    --stardew-wood: #a05030;
    --stardew-wood-dark: #552814;
    --stardew-text: #451806;
    --stardew-gold: #ffd700;
    --stardew-green: #5dcc52;
    --stardew-purple: #9a55ff;

    /* 语义化变量（随主题变化） - HSL 格式 */
    --background: 42 100% 96%;
    --foreground: 15 78% 15%;
    --card: 42 60% 92%;
    --muted-foreground: 15 50% 35%;
    /* ... */
  }

  .dark {
    /* 暗色模式下的语义化变量 */
    --background: 220 25% 12%;
    --foreground: 42 60% 90%;
    --card: 220 20% 18%;
    --muted-foreground: 42 30% 60%;
    /* ... */
  }
}
```

**使用这些变量**：

```tsx
// 固定颜色变量（推荐用于 Stardew 特定色）
className = "bg-[--stardew-parchment]";
className = "text-[--stardew-gold]";

// HSL 语义化变量（推荐用于通用组件）
className = "bg-[hsl(var(--background))]";
className = "text-[hsl(var(--foreground))]";

// 或直接使用 Tailwind 类名（最简洁）
className = "bg-background";
className = "text-foreground";
```

#### 1. 文字颜色

```tsx
// 使用语义化变量（推荐）
<h1 className="text-foreground">                    // 主要文字
<p className="text-muted-foreground">              // 次要文字
<span className="text-muted-foreground/70">       // 三级文字（更淡）

// 使用硬编码（特殊场景）
<h1 className="text-[#451806] dark:text-[#F2E6C2]">
<p className="text-[#A05030] dark:text-[#C78F56]">
<span className="text-[#A05030] dark:text-[#8B7355]">
```

#### 2. 背景

```tsx
// 使用语义化变量（推荐）
<div className="bg-background">                    // 主背景
<div className="bg-card">                          // 卡片背景
<div className="bg-muted">                         // 静音背景

// 使用硬编码（特殊场景）
<div className="bg-[#FFFAE6] dark:bg-[#1a1f2e]">
<div className="bg-[#F2E6C2] dark:bg-[#2a2f3e]">

// 使用全局类（已定义暗色变体）
<div className="stardew-box">
<div className="inventory-slot">
```

#### 3. 边框

```tsx
// 使用语义化变量（推荐）
<div className="border border-border">             // 标准边框

// 使用硬编码（特殊场景）
<div className="border-[#552814] dark:border-[#3d2f1f]">
<div className="border-[#552814] dark:border-[#8B6F47]">
```

#### 4. 悬停状态

```tsx
// 使用语义化变量（推荐）
<button className="hover:bg-accent hover:text-accent-foreground">

// 使用硬编码（特殊场景）
<button className="
  text-[#A05030] dark:text-[#C78F56]
  hover:bg-[#C78F56]/20 dark:hover:bg-[#C78F56]/10
">
```

#### 5. 行内代码

```tsx
// 使用语义化变量（推荐）
<code className="bg-muted text-primary">

// 使用硬编码（特殊场景）
<code className="
  bg-pink-50 dark:bg-zinc-200
  text-pink-600 dark:text-pink-700
">
```

---

## 调试技巧

### 1. 快速切换系统主题测试

macOS 快捷方式：

- 打开"系统设置" → "外观"
- 或使用快捷指令切换

### 2. 检查元素是否有暗色样式

在浏览器开发者工具中：

```javascript
// 手动添加 dark 类测试
document.documentElement.classList.add("dark");

// 移除 dark 类测试
document.documentElement.classList.remove("dark");
```

### 3. 查找缺少 dark: 的元素

在组件代码中搜索：

```regex
className="[^"]*text-\[#[^"]*(?!dark:)
className="[^"]*bg-\[#[^"]*(?!dark:)
```

这些正则可以帮助找到可能遗漏 dark: 变体的地方。

### 4. 使用浏览器检查计算样式

选中元素 → 查看 Computed 面板 → 确认实际应用的颜色值

---

## 常见问题

### Q: 为什么我的组件在暗色模式下还是浅色？

A: 检查是否为所有颜色属性添加了 `dark:` 变体。常见遗漏：

- `placeholder:` 没有 `dark:placeholder:`
- `border-` 没有 `dark:border-`
- CSS 全局类没有定义 `.dark .class-name`

### Q: 如何在 JavaScript 中检测当前主题？

A:

```tsx
const [isDark, setIsDark] = useState(
  document.documentElement.classList.contains("dark")
);

// 监听变化
useEffect(() => {
  const observer = new MutationObserver(() => {
    setIsDark(document.documentElement.classList.contains("dark"));
  });

  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class"],
  });

  return () => observer.disconnect();
}, []);
```

### Q: 能否添加手动主题切换功能？

A: 可以，但需要修改 `layout.tsx` 的逻辑，增加 localStorage 存储用户选择。当前架构设计为完全跟随系统，如需手动控制需要重新引入优先级判断。

### Q: 第三方组件库如何适配暗色模式？

A: 参考 MessageContent 中 SyntaxHighlighter 的做法：

1. 监听系统主题变化
2. 根据 `isDark` 状态选择不同的配置
3. 动态传递主题相关的 props

---

## 总结

当前主题系统的核心理念：

- ✅ **简单** - 完全由系统驱动，无需手动控制
- ✅ **统一** - 所有组件使用相同的配色方案和实现方式
- ✅ **响应式** - 系统主题变化立即生效
- ✅ **可维护** - Tailwind 的 dark: 语法清晰直观

开发新功能时，只需记住：**每个颜色都要有 dark: 变体**，参考本文档的配色方案，就能保证主题系统的一致性。
