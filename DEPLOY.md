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
