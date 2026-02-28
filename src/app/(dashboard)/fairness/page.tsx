"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DataList, DataListItem, DataListEmpty } from "@/components/data-list";
import {
  BarChart3,
  Loader2,
  TrendingUp,
  TrendingDown,
  Minus,
  Award,
  Users,
  ClipboardList,
} from "lucide-react";
import { toast } from "sonner";

interface Breakdown {
  category: string;
  count: number;
  points: number;
}

interface FairnessEntry {
  id: number;
  fullName: string;
  departmentId: number;
  departmentName: string;
  status: string;
  totalPoints: number;
  totalDuties: number;
  breakdown: Breakdown[];
}

const statusLabels: Record<string, string> = {
  active: "פעיל",
  training: "בהכשרה",
  exempt: "פטור",
  vacation: "חופשה",
};

export default function FairnessPage() {
  const [data, setData] = useState<FairnessEntry[]>([]);
  const [range, setRange] = useState("60");
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await api<FairnessEntry[]>(
        `/api/fairness?range=${range}`
      );
      setData(result);
    } catch {
      toast.error("שגיאה בטעינת נתונים");
    } finally {
      setIsLoading(false);
    }
  }, [range]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const avgPoints = data.length
    ? data.reduce((sum, d) => sum + d.totalPoints, 0) / data.length
    : 0;

  const maxPoints = Math.max(...data.map((d) => d.totalPoints), 0);
  const minPoints = Math.min(...data.map((d) => d.totalPoints), 0);

  // Collect all unique categories
  const allCategories = Array.from(
    new Set(data.flatMap((d) => d.breakdown.map((b) => b.category)))
  );

  const getPointsColor = (points: number) => {
    if (points === 0) return "";
    if (points <= avgPoints * 0.5) return "text-green-600";
    if (points >= avgPoints * 1.5) return "text-red-600";
    return "";
  };

  const getPointsIcon = (points: number) => {
    if (points === 0) return <Minus className="w-4 h-4 text-gray-400" />;
    if (points >= avgPoints * 1.5)
      return <TrendingUp className="w-4 h-4 text-red-500" />;
    if (points <= avgPoints * 0.5)
      return <TrendingDown className="w-4 h-4 text-green-500" />;
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <BarChart3 className="w-7 h-7 text-primary shrink-0" />
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">דוח הוגנות</h1>
            <p className="text-sm text-muted-foreground">
              ניקוד עומס לכל חייל בטווח הזמן הנבחר
            </p>
          </div>
        </div>
        <Select value={range} onValueChange={setRange}>
          <SelectTrigger className="w-full sm:w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="30">30 יום אחרונים</SelectItem>
            <SelectItem value="60">60 יום אחרונים</SelectItem>
            <SelectItem value="90">90 יום אחרונים</SelectItem>
            <SelectItem value="180">חצי שנה</SelectItem>
            <SelectItem value="365">שנה</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">ממוצע נקודות</p>
                <p className="text-2xl font-bold mt-1">
                  {avgPoints.toFixed(1)}
                </p>
              </div>
              <Award className="w-8 h-8 text-amber-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">הכי עמוס</p>
                <p className="text-2xl font-bold mt-1 text-red-600">
                  {maxPoints.toFixed(1)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {data.find((d) => d.totalPoints === maxPoints)?.fullName}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">הכי פנוי</p>
                <p className="text-2xl font-bold mt-1 text-green-600">
                  {minPoints.toFixed(1)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {data.find((d) => d.totalPoints === minPoints)?.fullName}
                </p>
              </div>
              <TrendingDown className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* List - iOS style */}
      {isLoading ? (
        <div className="flex items-center justify-center h-32">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">פירוט לפי חייל</CardTitle>
            <CardDescription>
              ממוין מהכי עמוס לפחות עמוס
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <DataList>
              {data.length === 0 ? (
                <DataListEmpty message="אין נתונים" />
              ) : (
                data.map((entry, idx) => (
                  <DataListItem
                    key={entry.id}
                    icon={getPointsIcon(entry.totalPoints) || <Users className="w-5 h-5" />}
                    title={
                      <span className={getPointsColor(entry.totalPoints)}>
                        {idx + 1}. {entry.fullName}
                      </span>
                    }
                    subtitle={entry.departmentName}
                    meta={[
                      { icon: <Award className="w-3.5 h-3.5" />, value: <span className={`font-bold ${getPointsColor(entry.totalPoints)}`}>{entry.totalPoints.toFixed(1)}</span> },
                      { icon: <ClipboardList className="w-3.5 h-3.5" />, value: `${entry.totalDuties} תור׳` },
                      { icon: null, value: <Badge variant="secondary" className="text-xs">{statusLabels[entry.status] || entry.status}</Badge> },
                    ]}
                    expandable={entry.breakdown.length > 0}
                  >
                    {entry.breakdown.length > 0 ? (
                      <div className="space-y-1.5 text-sm">
                        <div className="font-medium text-muted-foreground">פירוט לפי קטגוריה</div>
                        {entry.breakdown.map((b) => (
                          <div key={b.category} className="flex justify-between">
                            <span>{b.category}</span>
                            <span>{b.count} תור׳ ({b.points.toFixed(0)} נק׳)</span>
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </DataListItem>
                ))
              )}
            </DataList>
          </CardContent>
        </Card>
      )}

      {/* Fairness bar visualization */}
      {data.length > 0 && maxPoints > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">ויזואליזציית עומס</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.map((entry) => (
              <div key={entry.id} className="flex items-center gap-3">
                <div className="w-28 text-sm truncate text-left">
                  {entry.fullName}
                </div>
                <div className="flex-1 bg-muted rounded-full h-5 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      entry.totalPoints >= avgPoints * 1.5
                        ? "bg-red-400"
                        : entry.totalPoints <= avgPoints * 0.5
                          ? "bg-green-400"
                          : "bg-blue-400"
                    }`}
                    style={{
                      width: `${maxPoints > 0 ? (entry.totalPoints / maxPoints) * 100 : 0}%`,
                    }}
                  />
                </div>
                <span className="text-sm font-medium w-12 text-left">
                  {entry.totalPoints.toFixed(0)}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
