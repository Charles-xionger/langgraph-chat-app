type JunimoColor = "green" | "blue" | "red" | "yellow" | "purple";

interface JunimoProps {
  color?: JunimoColor;
  className?: string;
  animate?: boolean;
  delay?: number; // 动画延迟（秒）
}

function Junimo({
  color = "green",
  className = "",
  animate = true,
  delay = 0,
}: JunimoProps) {
  const colorFilters: Record<JunimoColor, string> = {
    green: "hue-rotate(0deg)", // 原始绿色
    blue: "hue-rotate(180deg)", // 蓝色
    yellow: "hue-rotate(60deg)", // 黄色
    purple: "hue-rotate(270deg)", // 紫色
    red: "hue-rotate(330deg)", // 红色
  };

  return (
    <div className={`relative inline-block ${className}`}>
      <img
        src="/junimo.svg"
        alt="Junimo"
        className={`w-8 h-8 object-contain ${animate ? "junimo-bounce" : ""}`}
        style={{
          filter: colorFilters[color],
          animationDelay: `${delay}s`,
        }}
      />
    </div>
  );
}

export default Junimo;
