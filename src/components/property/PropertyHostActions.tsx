"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Edit3, LayoutDashboard, CheckCircle2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { EditPropertyModal, type HostPropertyItem } from "@/components/host";

interface PropertyHostActionsProps {
  property: HostPropertyItem;
}

export function PropertyHostActions({ property }: PropertyHostActionsProps) {
  const router = useRouter();
  const [isEditOpen, setIsEditOpen] = React.useState(false);
  const [toastMessage, setToastMessage] = React.useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
    router.refresh();
  };

  return (
    <>
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 rounded-xl bg-slate-900 text-white px-5 py-3 shadow-xl text-sm flex items-center gap-2 border border-slate-700 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="size-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <Button
          onClick={() => setIsEditOpen(true)}
          size="sm"
          className="gap-1.5 font-bold shadow-xs bg-primary hover:bg-primary/90 text-primary-foreground text-xs"
        >
          <Edit3 className="size-3.5" />
          <span>Chỉnh sửa chỗ ở</span>
        </Button>

        <Button
          asChild
          variant="outline"
          size="sm"
          className="gap-1.5 font-semibold text-xs border-border"
        >
          <Link href="/host">
            <LayoutDashboard className="size-3.5" />
            <span>Vào Cổng Host</span>
          </Link>
        </Button>
      </div>

      <EditPropertyModal
        open={isEditOpen}
        onOpenChange={(open) => {
          setIsEditOpen(open);
          if (!open) {
            router.refresh();
          }
        }}
        property={property}
        onSuccessToast={showToast}
      />
    </>
  );
}
