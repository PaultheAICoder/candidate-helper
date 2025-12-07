import { useEffect, useState } from "react";

interface CostData {
  currentMonth: number;
  byModel: Record<string, number>;
  audioModeEnabled: boolean;
}

export function CostDashboard() {
  const [data, setData] = useState<CostData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/admin/costs", { cache: "no-store" });
        if (!res.ok) {
          setError("Failed to load cost data");
          return;
        }
        const json = (await res.json()) as CostData;
        setData(json);
      } catch (err) {
        console.error("Cost dashboard load error:", err);
        setError("Unexpected error loading cost data");
      }
    };
    load();
  }, []);

  if (error) {
    return (
      <div className="border rounded-lg p-4">
        <p className="text-destructive text-sm">{error}</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="border rounded-lg p-4">
        <p className="text-sm text-muted-foreground">Loading cost data...</p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Cost Dashboard</h3>
        <span
          className={`text-xs px-2 py-1 rounded ${
            data.audioModeEnabled ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"
          }`}
        >
          Audio Mode: {data.audioModeEnabled ? "Enabled" : "Disabled"}
        </span>
      </div>
      <p className="text-sm text-muted-foreground">
        Current month estimated: ${data.currentMonth.toFixed(2)}
      </p>
      <ul className="text-sm text-muted-foreground space-y-1">
        {Object.entries(data.byModel).map(([model, cost]) => (
          <li key={model}>
            {model}: ${cost.toFixed(2)}
          </li>
        ))}
      </ul>
    </div>
  );
}
