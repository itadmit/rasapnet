# פריסה ל-Vercel + Neon PostgreSQL

## 1. הגדרת משתני סביבה ב-Vercel

ב-[Vercel Dashboard](https://vercel.com) → Project → Settings → Environment Variables הוסף:

| משתנה | ערך |
|-------|-----|
| `DATABASE_URL` | מחרוזת החיבור מ-Neon (Connection string) |
| `JWT_SECRET` | מפתח סודי חזק (למשל: `openssl rand -base64 32`) |

## 2. חיבור ל-GitHub

1. Push את הקוד ל־https://github.com/itadmit/rasapnet.git
2. ב-Vercel: Import Project → בחר את rasapnet
3. Vercel יזהה אוטומטית Next.js ויבנה

## 3. איפוס מסד הנתונים והרצת Schema

לפני הפריסה הראשונה (או לאיפוס מלא). צור קובץ `.env` עם `DATABASE_URL` והרץ:

```bash
# מחיקת כל הטבלאות הקיימות
npm run db:drop

# הרצת migrations (יצירת טבלאות)
npm run db:migrate

# מילוי נתוני התחלה
npm run db:seed
```

**חלופה:** אם החיבור איטי (Neon cold start), הרץ את ה-SQL מ-`drizzle/0000_natural_warpath.sql` ישירות ב-Neon SQL Editor.

## 4. משתמשי התחלה

לאחר ה-seed:
- **רס״פ ראשי**: 0501234567
- **שלישות**: 0509999999

## 5. פתרון 404 NOT_FOUND

אם אתה מקבל 404 ב-`rasapnet.vercel.app`:

1. **בדוק Build Logs** – Vercel Dashboard → Project → Deployments → בחר deployment → View Build Logs. אם ה-build נכשל, תקן את השגיאות.

2. **Root Directory** – Settings → General → Root Directory חייב להיות ריק או `.` (שורש הפרויקט).

3. **Framework Preset** – Settings → General → Framework Preset = Next.js.

4. **משתני סביבה** – הוסף `DATABASE_URL` (ו-`JWT_SECRET`) ל-Environment Variables עבור Production, Preview ו-Development.

5. **Redeploy** – אחרי שינויים בהגדרות: Deployments → ⋮ → Redeploy.
