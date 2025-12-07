"use client";

interface GhostIconButtonProps {
  label: string;
  children: React.ReactNode;
}

export default function GhostIconButton({
  label,
  children,
}: GhostIconButtonProps) {
  return (
    <button
      className="hidden rounded inventory-slot p-2 text-[#6B4423] hover:bg-[#C78F56]/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9A55FF] md:inline-flex dark:text-[#4A2818]"
      aria-label={label}
      title={label}
    >
      {children}
    </button>
  );
}
