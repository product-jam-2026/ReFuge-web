// app/api/geo/cities/route.ts
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const country = searchParams.get("country"); // ISO2 code e.g. "SD"
  const q = searchParams.get("q"); // Search query

  if (!country || !q) {
    return NextResponse.json({ items: [] });
  }

  const username = process.env.GEONAMES_USERNAME || "demo"; // החליפי ב-Env Var שלך

  try {
    // פנייה ל-GeoNames API
    // משתמשים ב-searchJSON כדי למצוא ערים
    const url = `http://api.geonames.org/searchJSON?country=${country}&name_startsWith=${encodeURIComponent(q)}&maxRows=10&featureClass=P&style=FULL&username=${username}&lang=en`; 
    
    const res = await fetch(url);
    const data = await res.json();

    if (!data.geonames) {
      return NextResponse.json({ items: [] });
    }

    // מיפוי התוצאות למבנה שלנו
    // GeoNames לא תמיד מחזיר שמות בערבית/עברית בצורה מושלמת, אז נשתמש במה שיש או באנגלית כברירת מחדל
    const items = data.geonames.map((item: any) => ({
      // מנסים למצוא שם מקומי אם קיים, אחרת אנגלית
      ar: item.alternateNames?.find((n: any) => n.lang === 'ar')?.name || item.name, 
      he: item.alternateNames?.find((n: any) => n.lang === 'he')?.name || item.name, 
      originalName: item.name
    }));

    return NextResponse.json({ items });

  } catch (error) {
    console.error("GeoNames error:", error);
    return NextResponse.json({ items: [] });
  }
}