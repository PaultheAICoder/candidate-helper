"use client";

import type { Strength, Clarification } from "@/types/models";

interface ReportPaneProps {
  type: "strengths" | "clarifications";
  title: string;
  icon: string;
  items: (Strength | Clarification)[];
}

export function ReportPane({ type, title, icon, items }: ReportPaneProps) {
  return (
    <div className="bg-card border rounded-lg p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="text-3xl">{icon}</div>
        <h2 className="text-2xl font-bold">{title}</h2>
      </div>

      {/* Items Grid */}
      <div className="space-y-4">
        {items.map((item, index) => {
          if (type === "strengths") {
            const strength = item as Strength;
            return (
              <div key={index} className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                <h4 className="font-semibold mb-2">{strength.text}</h4>
                <p className="text-sm text-muted-foreground">
                  <strong>Evidence:</strong> {strength.evidence}
                </p>
              </div>
            );
          } else {
            const clarification = item as Clarification;
            return (
              <div key={index} className="bg-muted/50 border rounded-lg p-4">
                <h4 className="font-semibold mb-2">{clarification.suggestion}</h4>
                <p className="text-sm text-muted-foreground">
                  <strong>Why:</strong> {clarification.rationale}
                </p>
              </div>
            );
          }
        })}
      </div>

      {/* Empty State */}
      {items.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <p>No {type} to display yet.</p>
        </div>
      )}
    </div>
  );
}
