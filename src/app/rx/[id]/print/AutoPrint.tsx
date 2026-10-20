"use client";

import { useEffect } from "react";
import { Printer } from "lucide-react";
import { Button } from "@/components/ui/Button";

/** Opens the browser's print dialog on load, where "Save as PDF" lives. */
export function AutoPrint() {
  useEffect(() => {
    const timer = setTimeout(() => window.print(), 400);
    return () => clearTimeout(timer);
  }, []);

  return (
    <Button variant="secondary" onClick={() => window.print()} className="print:hidden">
      <Printer aria-hidden="true" className="size-[18px]" />
      Print or save as PDF
    </Button>
  );
}
