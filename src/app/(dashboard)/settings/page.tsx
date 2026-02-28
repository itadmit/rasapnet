"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Settings,
  Building2,
  Shield,
  Plus,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

interface Department {
  id: number;
  name: string;
  createdAt: string;
}

export default function SettingsPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Department form
  const [deptDialogOpen, setDeptDialogOpen] = useState(false);
  const [newDeptName, setNewDeptName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const depts = await api<Department[]>("/api/departments");
      setDepartments(depts);
    } catch {
      toast.error("שגיאה בטעינת נתונים");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAddDept = async () => {
    if (!newDeptName.trim()) {
      toast.error("נא להזין שם מחלקה");
      return;
    }
    setIsSubmitting(true);
    try {
      await api("/api/departments", {
        method: "POST",
        body: JSON.stringify({ name: newDeptName.trim() }),
      });
      toast.success("מחלקה נוספה");
      setDeptDialogOpen(false);
      setNewDeptName("");
      loadData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "שגיאה");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Settings className="w-7 h-7 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">הגדרות</h1>
          <p className="text-sm text-muted-foreground">
            ניהול מחלקות והגדרות מערכת
          </p>
        </div>
      </div>

      <Tabs defaultValue="departments" dir="rtl">
        <TabsList>
          <TabsTrigger value="departments" className="gap-2">
            <Building2 className="w-4 h-4" />
            מחלקות
          </TabsTrigger>
          <TabsTrigger value="system" className="gap-2">
            <Shield className="w-4 h-4" />
            מערכת
          </TabsTrigger>
        </TabsList>

        {/* Departments Tab */}
        <TabsContent value="departments" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>ניהול מחלקות</CardTitle>
                <CardDescription>
                  {departments.length} מחלקות במערכת
                </CardDescription>
              </div>
              <Button
                size="sm"
                onClick={() => {
                  setNewDeptName("");
                  setDeptDialogOpen(true);
                }}
              >
                <Plus className="w-4 h-4 ml-2" />
                הוסף מחלקה
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>שם</TableHead>
                    <TableHead>תאריך יצירה</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {departments.map((dept) => (
                    <TableRow key={dept.id}>
                      <TableCell className="font-medium">
                        {dept.name}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {dept.createdAt
                          ? new Date(dept.createdAt).toLocaleDateString(
                              "he-IL"
                            )
                          : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* System Tab */}
        <TabsContent value="system" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>מידע מערכת</CardTitle>
              <CardDescription>פרטים כלליים על המערכת</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-muted rounded-lg p-4">
                  <p className="text-sm text-muted-foreground">גרסה</p>
                  <p className="font-bold mt-1">0.1.0</p>
                </div>
                <div className="bg-muted rounded-lg p-4">
                  <p className="text-sm text-muted-foreground">סביבה</p>
                  <p className="font-bold mt-1">פיתוח</p>
                </div>
                <div className="bg-muted rounded-lg p-4">
                  <p className="text-sm text-muted-foreground">מסד נתונים</p>
                  <p className="font-bold mt-1">PostgreSQL (Neon)</p>
                </div>
                <div className="bg-muted rounded-lg p-4">
                  <p className="text-sm text-muted-foreground">Framework</p>
                  <p className="font-bold mt-1">Next.js + Drizzle</p>
                </div>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <p className="text-sm text-amber-800 font-medium">
                  ⚠️ גרסת פיתוח
                </p>
                <p className="text-sm text-amber-700 mt-1">
                  המערכת בגרסת פיתוח. התחברות ללא OTP.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Department Dialog */}
      <Dialog open={deptDialogOpen} onOpenChange={setDeptDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>הוספת מחלקה חדשה</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>שם המחלקה</Label>
              <Input
                value={newDeptName}
                onChange={(e) => setNewDeptName(e.target.value)}
                placeholder='למשל: מחלקה ד'
                onKeyDown={(e) => e.key === "Enter" && handleAddDept()}
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">ביטול</Button>
            </DialogClose>
            <Button onClick={handleAddDept} disabled={isSubmitting}>
              {isSubmitting && (
                <Loader2 className="w-4 h-4 animate-spin ml-2" />
              )}
              הוסף
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
