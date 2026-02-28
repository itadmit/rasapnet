"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DataList, DataListItem, DataListEmpty } from "@/components/data-list";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  MessageSquare,
  Settings,
  ScrollText,
  Send,
  Loader2,
  CheckCircle2,
  XCircle,
  Wifi,
  WifiOff,
  Tag,
  Calendar,
} from "lucide-react";
import { toast } from "sonner";

interface WhatsAppSettings {
  id: number | null;
  instanceId: string;
  isEnabled: boolean;
  hasToken: boolean;
}

interface WhatsAppLog {
  id: number;
  soldierId: number;
  soldierName: string;
  type: string;
  success: boolean;
  createdAt: string;
}

const typeLabels: Record<string, string> = {
  weekly_summary: "סיכום שבועי",
  day_before: "יום לפני",
  manual: "ידני",
};

export default function WhatsappPage() {
  const [settings, setSettings] = useState<WhatsAppSettings>({
    id: null,
    instanceId: "",
    isEnabled: false,
    hasToken: false,
  });
  const [logs, setLogs] = useState<WhatsAppLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Settings form
  const [token, setToken] = useState("");
  const [instanceId, setInstanceId] = useState("");
  const [isEnabled, setIsEnabled] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Test message
  const [testPhone, setTestPhone] = useState("");
  const [testMessage, setTestMessage] = useState("בדיקת חיבור מערכת רס״פנט ✅");
  const [isSending, setIsSending] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [settingsData, logsData] = await Promise.all([
        api<WhatsAppSettings>("/api/whatsapp/settings"),
        api<WhatsAppLog[]>("/api/whatsapp/logs"),
      ]);
      setSettings(settingsData);
      setInstanceId(settingsData.instanceId);
      setIsEnabled(settingsData.isEnabled);
      setLogs(logsData);
    } catch {
      toast.error("שגיאה בטעינת נתונים");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      await api("/api/whatsapp/settings", {
        method: "PUT",
        body: JSON.stringify({
          token: token || undefined,
          instanceId,
          isEnabled,
        }),
      });
      toast.success("הגדרות נשמרו");
      setToken("");
      loadData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "שגיאה");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSendTest = async () => {
    if (!testPhone.trim()) {
      toast.error("נא להזין מספר טלפון");
      return;
    }
    setIsSending(true);
    try {
      const result = await api<{ success: boolean }>("/api/whatsapp/test", {
        method: "POST",
        body: JSON.stringify({
          phone: testPhone.trim(),
          message: testMessage,
        }),
      });
      if (result.success) {
        toast.success("הודעה נשלחה בהצלחה!");
      } else {
        toast.error("שליחה נכשלה");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "שגיאה");
    } finally {
      setIsSending(false);
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
        <MessageSquare className="w-7 h-7 text-primary shrink-0" />
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">וואטסאפ</h1>
          <p className="text-sm text-muted-foreground">
            חיבור True Story API ושליחת תזכורות
          </p>
        </div>
      </div>

      {/* Connection Status */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {settings.hasToken && settings.isEnabled ? (
                <Wifi className="w-6 h-6 text-green-500" />
              ) : (
                <WifiOff className="w-6 h-6 text-red-500" />
              )}
              <div>
                <p className="font-medium">
                  {settings.hasToken && settings.isEnabled
                    ? "מחובר ופעיל"
                    : "לא מחובר"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {settings.instanceId
                    ? `Instance: ${settings.instanceId}`
                    : "לא הוגדר Instance ID"}
                </p>
              </div>
            </div>
            <Badge
              variant={settings.isEnabled ? "default" : "secondary"}
              className={
                settings.isEnabled
                  ? "bg-green-100 text-green-700"
                  : ""
              }
            >
              {settings.isEnabled ? "מופעל" : "מושבת"}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="settings" dir="rtl">
        <TabsList>
          <TabsTrigger value="settings" className="gap-2">
            <Settings className="w-4 h-4" />
            הגדרות
          </TabsTrigger>
          <TabsTrigger value="test" className="gap-2">
            <Send className="w-4 h-4" />
            הודעת בדיקה
          </TabsTrigger>
          <TabsTrigger value="logs" className="gap-2">
            <ScrollText className="w-4 h-4" />
            לוגים
          </TabsTrigger>
        </TabsList>

        {/* Settings Tab */}
        <TabsContent value="settings" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>הגדרות True Story API</CardTitle>
              <CardDescription>
                הזן את הטוקן ו-Instance ID מ-True Story Dashboard
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Token (API Key)</Label>
                <Input
                  type="password"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder={
                    settings.hasToken
                      ? "••••••••• (כבר מוגדר - הזן חדש לעדכון)"
                      : "הזן token"
                  }
                  dir="ltr"
                />
                <p className="text-xs text-muted-foreground">
                  הטוקן נשמר מוצפן בשרת ולא מוצג בצד הלקוח
                </p>
              </div>
              <div className="space-y-2">
                <Label>Instance ID</Label>
                <Input
                  value={instanceId}
                  onChange={(e) => setInstanceId(e.target.value)}
                  placeholder="הזן Instance ID"
                  dir="ltr"
                />
              </div>
              <div className="flex items-center gap-3">
                <Switch
                  checked={isEnabled}
                  onCheckedChange={setIsEnabled}
                />
                <Label>הפעל שליחת הודעות</Label>
              </div>
              <Button onClick={handleSaveSettings} disabled={isSaving}>
                {isSaving && (
                  <Loader2 className="w-4 h-4 animate-spin ml-2" />
                )}
                שמור הגדרות
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Test Tab */}
        <TabsContent value="test" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>שליחת הודעת בדיקה</CardTitle>
              <CardDescription>
                שלח הודעת בדיקה כדי לוודא שהחיבור תקין
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>מספר טלפון</Label>
                <Input
                  value={testPhone}
                  onChange={(e) => setTestPhone(e.target.value)}
                  placeholder="0501234567"
                  dir="ltr"
                />
              </div>
              <div className="space-y-2">
                <Label>הודעה</Label>
                <Textarea
                  value={testMessage}
                  onChange={(e) => setTestMessage(e.target.value)}
                  rows={3}
                />
              </div>
              <Button onClick={handleSendTest} disabled={isSending}>
                {isSending ? (
                  <Loader2 className="w-4 h-4 animate-spin ml-2" />
                ) : (
                  <Send className="w-4 h-4 ml-2" />
                )}
                שלח הודעת בדיקה
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Logs Tab */}
        <TabsContent value="logs" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>לוג שליחות</CardTitle>
              <CardDescription>
                100 השליחות האחרונות
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <DataList>
                {logs.length === 0 ? (
                  <DataListEmpty message="אין לוגים עדיין" />
                ) : (
                  logs.map((log) => (
                    <DataListItem
                      key={log.id}
                      icon={log.success ? <CheckCircle2 className="w-5 h-5 text-green-600" /> : <XCircle className="w-5 h-5 text-red-600" />}
                      title={log.soldierName}
                      meta={[
                        { icon: <Tag className="w-3.5 h-3.5" />, value: typeLabels[log.type] || log.type },
                        { icon: <Calendar className="w-3.5 h-3.5" />, value: new Date(log.createdAt).toLocaleString("he-IL", { dateStyle: "short", timeStyle: "short" }) },
                      ]}
                    />
                  ))
                )}
              </DataList>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
