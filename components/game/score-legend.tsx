"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown, InfoIcon } from "lucide-react";
import { useState } from "react";

export default function ScoreLegend() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Card className="p-0 gradient-border glass-card">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger
          nativeButton={false}
          render={
            <CardHeader className="hover:bg-accent/50 py-6 rounded-t-lg transition-colors cursor-pointer">
              <CardTitle className="flex justify-between items-center font-semibold text-sm">
                <div className="flex items-center gap-2">
                  <InfoIcon className="w-4 h-4" />
                  Come si guadagnano i punti
                </div>
                <ChevronDown
                  className={`w-4 h-4 transition-transform duration-200 ${
                    isOpen ? "rotate-180" : ""
                  }`}
                />
              </CardTitle>
            </CardHeader>
          }
        ></CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="space-y-2 pb-6 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Chi indovina:</span>
              <span className="font-medium text-green-600">
                Secondi rimasti
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Disegnatore:</span>
              <span className="font-medium text-blue-600">
                Secondi rimasti ÷ 4
              </span>
            </div>
            <div className="space-y-1 pt-1 border-t text-muted-foreground text-xs">
              <div>
                <strong>Disegnatore:</strong> Guadagna punti = secondi rimasti ÷
                4 (minimo 10)
              </div>
              <div>
                <strong>Esempio:</strong> Se restano 40 secondi → 40 ÷ 4 = 10
                punti
              </div>
              <div className="font-medium text-orange-400 dark:text-yellow-500">
                ⚠️ Il disegnatore guadagna punti solo se qualcuno indovina!
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
