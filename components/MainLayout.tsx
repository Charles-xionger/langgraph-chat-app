import { ReactNode } from "react";

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Sidebar */}
      <div>Siderbar</div>

      {/* Main Content area */}
      <div className="bg-gray-100 flex min-w-0 flex-1 flex-col">
        {/* header */}
        <div className="z-10">Header</div>

        {/* Main Content */}
        <div>{children}</div>
      </div>
    </div>
  );
}
