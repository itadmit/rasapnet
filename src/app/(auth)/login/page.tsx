"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { Shield, Phone, Loader2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

export default function LoginPage() {
  const [phone, setPhone] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!phone.trim()) {
      toast.error("נא להזין מספר טלפון");
      return;
    }

    setIsSubmitting(true);
    try {
      await login(phone.trim());
      toast.success("התחברת בהצלחה!");
      router.push("/dashboard");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "שגיאה בהתחברות"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f5f5f7] px-4">
      {/* Subtle background pattern */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(131,117,49,0.04)_0%,_transparent_60%)]" />
      
      <div className="relative w-full max-w-[400px]">
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-[0_2px_20px_rgba(0,0,0,0.06),_0_0_0_1px_rgba(0,0,0,0.04)] p-10">
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-[#837531] to-[#9a8a3e] rounded-[18px] flex items-center justify-center shadow-[0_4px_16px_rgba(131,117,49,0.3)] mb-5">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-[26px] font-semibold text-[#1d1d1f] tracking-tight">
              רס״פנט
            </h1>
            <p className="text-[15px] text-[#86868b] mt-1.5">
              ניהול תורנויות חכם לפי ניקוד אלגוריתמי
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="phone"
                className="block text-[13px] font-medium text-[#1d1d1f] mb-2"
              >
                מספר טלפון
              </label>
              <div className="relative">
                <div className={`
                  relative flex items-center rounded-xl border transition-all duration-200
                  ${isFocused 
                    ? "border-[#837531] shadow-[0_0_0_3px_rgba(131,117,49,0.12)]" 
                    : "border-[#d2d2d7] hover:border-[#86868b]"
                  }
                `}>
                  <div className="pr-3.5 pl-0 flex items-center">
                    <Phone className="w-[18px] h-[18px] text-[#86868b]" />
                  </div>
                  <input
                    id="phone"
                    type="tel"
                    placeholder="050-123-4567"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    className="flex-1 py-3 pl-3.5 text-[16px] text-[#1d1d1f] placeholder:text-[#c7c7cc] bg-transparent outline-none"
                    dir="ltr"
                    autoComplete="tel"
                    disabled={isSubmitting}
                  />
                </div>
              </div>
              <p className="text-[12px] text-[#86868b] mt-2 pr-1">
                הזן את מספר הטלפון הרשום במערכת
              </p>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-[48px] bg-[#837531] hover:bg-[#9a8a3e] active:bg-[#756829] text-white text-[16px] font-medium rounded-xl transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_1px_3px_rgba(131,117,49,0.3)]"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-[18px] h-[18px] animate-spin" />
                  מתחבר...
                </span>
              ) : (
                "התחבר"
              )}
            </button>
          </form>
        </div>

        {/* Footer text */}
        <p className="text-center text-[12px] text-[#86868b] mt-5">
          גרסת פיתוח · כניסה ללא OTP
        </p>
      </div>
    </div>
  );
}
