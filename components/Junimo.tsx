type JunimoColor = "green" | "blue" | "red" | "yellow" | "purple";

function Junimo({
  color = "green",
  className = "",
}: {
  color?: JunimoColor;
  className?: string;
}) {
  const colors: Record<JunimoColor, string> = {
    green: "bg-green-500",
    blue: "bg-blue-400",
    red: "bg-red-400",
    yellow: "bg-yellow-400",
    purple: "bg-purple-500",
  };
  return (
    <div className={`relative ${className}`}>
      <div
        className={`w-6 h-7 ${colors[color]} rounded-t-full relative junimo-bounce`}
      >
        <div className="absolute top-2 left-1 w-1.5 h-1.5 bg-black rounded-full" />
        <div className="absolute top-2 right-1 w-1.5 h-1.5 bg-black rounded-full" />
        <div className="absolute -top-1 left-1 w-1 h-2 bg-green-700 rounded-full transform -rotate-12" />
        <div className="absolute -top-1 right-1 w-1 h-2 bg-green-700 rounded-full transform rotate-12" />
      </div>
    </div>
  );
}

export default Junimo;
