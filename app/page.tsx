import { MainLayout } from "@/components/MainLayout";
import { Button } from "@/components/ui/button";
import { ArrowUpIcon } from "lucide-react";

export default function Home() {
  return (
    <MainLayout>
      <div>Thread</div>
      <div className="flex">
        <Button variant="ghost" size="icon">
          <ArrowUpIcon color="green" />
        </Button>
      </div>
    </MainLayout>
  );
}
