/**
 * Date utility helpers for Fish ERP date range calculations and period labels.
 */

export function toLocalDateStr(date = new Date()) {
  const d = new Date(date);
  if (isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * Robustly normalizes any raw date representation (Firestore Timestamp, JS Date, ISO string, YYYY-M-D)
 * into a standard "YYYY-MM-DD" local date string for exact string comparisons.
 */
export function toNormalizedDateStr(rawDate) {
  if (!rawDate) return "";

  // Firestore Timestamp object (.toDate() or .seconds)
  if (typeof rawDate === "object" && typeof rawDate.toDate === "function") {
    return toLocalDateStr(rawDate.toDate());
  }
  if (typeof rawDate === "object" && rawDate.seconds) {
    return toLocalDateStr(new Date(rawDate.seconds * 1000));
  }

  // JS Date object
  if (rawDate instanceof Date) {
    return toLocalDateStr(rawDate);
  }

  // String format
  if (typeof rawDate === "string") {
    const clean = rawDate.trim();
    if (!clean) return "";

    // ISO string "YYYY-MM-DDTHH:mm:ss" or "YYYY-MM-DD HH:mm:ss"
    if (clean.includes("T")) {
      const parts = clean.split("T")[0].split("-");
      if (parts.length === 3 && parts[0].length === 4) {
        return `${parts[0]}-${parts[1].padStart(2, "0")}-${parts[2].padStart(2, "0")}`;
      }
    }
    if (clean.includes(" ")) {
      const parts = clean.split(" ")[0].split("-");
      if (parts.length === 3 && parts[0].length === 4) {
        return `${parts[0]}-${parts[1].padStart(2, "0")}-${parts[2].padStart(2, "0")}`;
      }
    }

    // "YYYY-M-D" or "YYYY-MM-DD"
    const parts = clean.split("-");
    if (parts.length === 3 && parts[0].length === 4) {
      const y = parts[0];
      const m = parts[1].padStart(2, "0");
      const day = parts[2].padStart(2, "0");
      return `${y}-${m}-${day}`;
    }

    // Fallback: JS Date parse
    const parsed = new Date(clean);
    if (!isNaN(parsed.getTime())) {
      return toLocalDateStr(parsed);
    }
  }

  return String(rawDate).slice(0, 10);
}

export function getDateRangeForPeriod(period, customStart = "", customEnd = "") {
  const now = new Date();
  const todayStr = toLocalDateStr(now);

  if (period === "today") {
    return { startDate: todayStr, endDate: todayStr };
  }

  if (period === "week") {
    const day = now.getDay();
    const diffToMonday = day === 0 ? -6 : 1 - day;
    const monday = new Date(now);
    monday.setDate(now.getDate() + diffToMonday);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    return {
      startDate: toLocalDateStr(monday),
      endDate: toLocalDateStr(sunday)
    };
  }

  if (period === "month") {
    const y = now.getFullYear();
    const m = now.getMonth();
    const firstDay = new Date(y, m, 1);
    const lastDay = new Date(y, m + 1, 0);
    return {
      startDate: toLocalDateStr(firstDay),
      endDate: toLocalDateStr(lastDay)
    };
  }

  if (period === "custom") {
    let s = toNormalizedDateStr(customStart) || "1970-01-01";
    let e = toNormalizedDateStr(customEnd) || todayStr;
    // Swap if user picked start date after end date
    if (s > e) {
      const temp = s;
      s = e;
      e = temp;
    }
    return {
      startDate: s,
      endDate: e
    };
  }

  return { startDate: todayStr, endDate: todayStr };
}

export function getPeriodLabel(period, metricNameEn, metricNameUr, lang = "en", isFeminine = true) {
  if (lang === "ur") {
    const prefixes = isFeminine
      ? {
          today: "آج کی ",
          week: "اس ہفتے کی ",
          month: "اس مہینے کی ",
          custom: "منتخب مدت کی "
        }
      : {
          today: "آج کا ",
          week: "اس ہفتے کا ",
          month: "اس مہینے کا ",
          custom: "منتخب مدت کا "
        };
    const prefix = prefixes[period] || prefixes.today;
    return `${prefix}${metricNameUr}`;
  }

  const prefixes = {
    today: "Today's ",
    week: "This Week's ",
    month: "This Month's ",
    custom: "Selected Period "
  };
  const prefix = prefixes[period] || prefixes.today;
  return `${prefix}${metricNameEn}`;
}

export function filterItemsByPeriod(items, period, customStart = "", customEnd = "", dateKey = "date") {
  if (!items || items.length === 0) return [];
  const { startDate, endDate } = getDateRangeForPeriod(period, customStart, customEnd);
  return items.filter(item => {
    const rawDate = item[dateKey];
    if (!rawDate) return false;
    const itemDateStr = toNormalizedDateStr(rawDate);
    if (!itemDateStr) return false;
    return itemDateStr >= startDate && itemDateStr <= endDate;
  });
}
