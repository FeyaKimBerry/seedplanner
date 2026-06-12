import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceLine, ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";
import {
  Wallet, TrendingDown, CalendarClock, Target, Landmark, Settings as Cog,
  LayoutDashboard, Plus, Trash2, Download, Upload, Users, ShieldCheck,
  PiggyBank, GitCompare, Check, FileText, LogOut, ChevronDown,
} from "lucide-react";

/* ------------------------------------------------------------------ *
 * Palette — calm "private ledger". Green = savings growing,
 * clay = money leaving. One accent, lots of quiet.
 * ------------------------------------------------------------------ */
const C = {
  bg: "#F4F9F7",
  sky: "linear-gradient(180deg,#E7F0F1 0%, #F4F9F7 460px)",
  card: "#FFFFFF",
  ink: "#23323C",
  sub: "#5C6E76",
  faint: "#93A4AA",
  line: "#E4ECEC",
  green: "#2E8C8C",
  greenSoft: "#DBEDEB",
  belowBar: "#9FD0CC",
  clay: "#E5A86B",
  claySoft: "#F8EBDA",
  optimistic: "#5FB3AD",
  conservative: "#AFCFCB",
};
const FONT = "ui-rounded, 'SF Pro Rounded', ui-sans-serif, system-ui, -apple-system, sans-serif";
const shadow = "0 8px 24px rgba(40,90,90,0.07)";
const shadowSoft = "0 4px 14px rgba(40,90,90,0.05)";

const num = { fontVariantNumeric: "tabular-nums" };

/* ------------------------------------------------------------------ *
 * i18n — module-level current language + translation table.
 * App sets LANG at the top of render; every component reads it via t().
 * Thai financial terms are a reasonable first pass; worth a native review.
 * ------------------------------------------------------------------ */
let LANG = "en";
const LANGS = [["en", "EN"], ["th", "ไทย"], ["de", "DE"], ["fr", "FR"]];

const STR = {
  en: {
    everyone: "Everyone", export: "Export", import: "Import",
    tab_dashboard: "Overview", tab_income: "Income", tab_expenses: "Expenses",
    tab_oneOffs: "Upcoming", tab_goals: "Goals", tab_balance: "Assets & debts", tab_settings: "Settings",
    footer: "Projections are estimates, not financial advice.",

    stat_surplus: "Monthly surplus", stat_retireNum: "Retirement number",
    stat_retireOn: "On track to retire", stat_balanceIn: "Balance in {n} yrs",
    inout: "{in} in · {out} out", setManually: "set manually", xAnnual: "{n}× annual expenses",
    inYrs: "in {n} yrs", beyond: "beyond horizon — adjust inputs",
    todayDollars: "today's dollars", futureDollars: "future dollars",

    projSavings: "Projected savings", projNetWorth: "Projected net worth",
    savings: "Savings", netWorth: "Net worth", yearly: "Yearly", monthly: "Monthly",
    descMonthly: "Month-by-month balance for the chosen year",
    descYearly: "One bar per year · solid green once you pass your retirement number",
    yearN: "Year {n}", projected: "Projected", whatif: "What-if", retirement: "Retirement",
    yrShort: "{n} yr", monthYear: "{m}, year {n}",

    whatifTitle: "What-if scenario",
    whatifDesc: "Compare a change against your baseline without editing anything. The dashed clay line is the what-if.",
    wiIncome: "Monthly income change", wiExpense: "Monthly expense change",
    wiReturn: "Expected return", wiOneOff: "One-off cost",

    add: "Add", empty: "Nothing here yet — add your first entry.", delete: "Delete",
    title_income: "Income", sub_income: "Recurring and one-off. Tag each to a person for the household toggle.",
    title_expenses: "Expenses", sub_expenses: "Your recurring outgoings. These set your monthly surplus.",
    title_oneOffs: "Upcoming expenses", sub_oneOffs: "Dated one-off costs — travel, gifts, a car. Each one dips your curve on its month.",
    title_goals: "Savings goals", sub_goals: "Named targets, drawn as lines on the chart. Watch the curve cross them.",
    title_assets: "Assets", sub_assets: "What you own — super, investments, property. Feeds the net-worth view.",
    title_debts: "Debts", sub_debts: "Loans amortise over the projection. Payments reduce your monthly surplus until they're cleared.",

    col_source: "Source", col_amount: "Amount", col_howOften: "How often", col_dateOneoff: "Date (one-off)",
    col_person: "Person", col_item: "Item", col_category: "Category", col_what: "What", col_cost: "Cost",
    col_when: "When", col_goal: "Goal", col_target: "Target", col_byWhen: "By when", col_asset: "Asset",
    col_value: "Value", col_debt: "Debt", col_balance: "Balance", col_rate: "Rate %", col_monthlyPay: "Monthly pay",
    freq_monthly: "Monthly", freq_annual: "Annual", freq_oneoff: "One-off",
    new_income: "New income", new_expense: "New expense", new_goal: "New goal",
    new_asset: "New asset", new_debt: "New debt", new_person: "New person",

    whereGoes: "Where it goes", perMo: "/mo",
    emTitle: "Emergency fund", emDesc: "Kept separate from your goals — your buffer before anything else.",
    emCurrent: "Current", emTarget: "Target", emFunded: "{pct}% funded · {a} of {b}",

    setAssumptions: "Projection assumptions", setCurrency: "Currency", setStarting: "Starting savings",
    setYears: "Project forward (years)", setCons: "Conservative return %", setExp: "Expected return %",
    setOpt: "Optimistic return %", setInfl: "Inflation %", setInflToggle: "Show figures in today's dollars (inflation-adjusted)",
    setRetireTitle: "Retirement target", setRetireDesc: "Leave blank to auto-calculate from your spending (the 4% rule = 25× annual expenses).",
    setManualTarget: "Manual target (optional)", auto: "auto", setAutoMultiple: "Auto multiple (× annual expenses)",
    household: "Household", addPerson: "Add person",
    householdDesc: "Tag income, expenses and goals to people, then switch between Everyone and one person up top.",
    setLanguage: "Language",

    exData_title: "Export your data", exData_desc: "Your full backup. Copy or share it to save, then use Import to restore it later.",
    exRep_title: "Export report", exRep_desc: "A printable snapshot. On a computer, tap Print to save as PDF. On a phone, use Share to send it to Files, Notes, or print.",
    copy: "Copy", copied: "Copied ✓", share: "Share", print: "Print", download: "Download",
    downloadHtml: "Download .html", close: "Close",
    previewNote: "Preview — screenshot this to save it on your phone",
    blockedNote: "In the Claude preview only Copy works reliably. Share, Print and Download need the app running in a normal browser — they'll work once it's deployed.",
    importBad: "That file isn't valid Seedplanner data.",

    login_title: "Sign in to Seedplanner",
    login_subtitle: "Plan your savings and see when you can retire.",
    login_google: "Sign in with Google",
    login_note: "Placeholder sign-in — no account is created and nothing leaves your device yet. Real Google sign-in is wired up in the full build.",
    signOut: "Sign out",
    nav_home: "Home", nav_privacy: "Privacy Policy", nav_terms: "Terms of Service",

    rep_title: "Seedplanner — financial projection", rep_generated: "generated", rep_byYear: "Projection by year",
    rep_now: "Now", rep_year: "Year", rep_emergency: "Emergency fund",
    rep_foot: "Projections are estimates based on your inputs and assumed returns — not financial advice.",
  },
  th: {
    everyone: "ทั้งหมด", export: "ส่งออก", import: "นำเข้า",
    tab_dashboard: "ภาพรวม", tab_income: "รายได้", tab_expenses: "รายจ่าย",
    tab_oneOffs: "ที่จะถึง", tab_goals: "เป้าหมาย", tab_balance: "สินทรัพย์และหนี้สิน", tab_settings: "ตั้งค่า",
    footer: "การคาดการณ์เป็นเพียงการประมาณ ไม่ใช่คำแนะนำทางการเงิน",

    stat_surplus: "เงินเหลือต่อเดือน", stat_retireNum: "เงินเกษียณที่ต้องมี",
    stat_retireOn: "คาดว่าจะเกษียณ", stat_balanceIn: "ยอดเงินใน {n} ปี",
    inout: "{in} เข้า · {out} ออก", setManually: "ตั้งเอง", xAnnual: "{n}× ค่าใช้จ่ายต่อปี",
    inYrs: "อีก {n} ปี", beyond: "เกินช่วงที่คำนวณ — ปรับข้อมูล",
    todayDollars: "มูลค่าปัจจุบัน", futureDollars: "มูลค่าอนาคต",

    projSavings: "เงินออมที่คาดการณ์", projNetWorth: "มูลค่าสุทธิที่คาดการณ์",
    savings: "เงินออม", netWorth: "มูลค่าสุทธิ", yearly: "รายปี", monthly: "รายเดือน",
    descMonthly: "ยอดเงินรายเดือนของปีที่เลือก",
    descYearly: "หนึ่งแท่งต่อปี · เป็นสีเขียวเข้มเมื่อถึงเงินเกษียณ",
    yearN: "ปีที่ {n}", projected: "คาดการณ์", whatif: "สมมติ", retirement: "เกษียณ",
    yrShort: "{n} ปี", monthYear: "{m} ปีที่ {n}",

    whatifTitle: "สถานการณ์สมมติ",
    whatifDesc: "เปรียบเทียบการเปลี่ยนแปลงกับค่าพื้นฐานโดยไม่ต้องแก้ข้อมูลจริง เส้นประสีส้มคือสถานการณ์สมมติ",
    wiIncome: "รายได้ต่อเดือนเปลี่ยน", wiExpense: "รายจ่ายต่อเดือนเปลี่ยน",
    wiReturn: "ผลตอบแทนคาดหวัง", wiOneOff: "ค่าใช้จ่ายครั้งเดียว",

    add: "เพิ่ม", empty: "ยังไม่มีรายการ — เพิ่มรายการแรกของคุณ", delete: "ลบ",
    title_income: "รายได้", sub_income: "ทั้งแบบประจำและครั้งเดียว ระบุบุคคลเพื่อใช้สลับมุมมองครัวเรือน",
    title_expenses: "รายจ่าย", sub_expenses: "รายจ่ายประจำของคุณ ใช้คำนวณเงินเหลือต่อเดือน",
    title_oneOffs: "ค่าใช้จ่ายที่จะถึง", sub_oneOffs: "ค่าใช้จ่ายครั้งเดียวที่มีกำหนด — ท่องเที่ยว ของขวัญ รถ แต่ละรายการจะทำให้กราฟลดในเดือนนั้น",
    title_goals: "เป้าหมายการออม", sub_goals: "เป้าหมายที่ตั้งชื่อ แสดงเป็นเส้นบนกราฟ ดูกราฟตัดผ่านเป้าหมาย",
    title_assets: "สินทรัพย์", sub_assets: "สิ่งที่คุณมี — กองทุนเลี้ยงชีพ การลงทุน อสังหาฯ ใช้ในมุมมองมูลค่าสุทธิ",
    title_debts: "หนี้สิน", sub_debts: "เงินกู้จะถูกผ่อนตามช่วงเวลา การผ่อนจะลดเงินเหลือต่อเดือนจนกว่าจะหมด",

    col_source: "แหล่งที่มา", col_amount: "จำนวนเงิน", col_howOften: "ความถี่", col_dateOneoff: "วันที่ (ครั้งเดียว)",
    col_person: "บุคคล", col_item: "รายการ", col_category: "หมวดหมู่", col_what: "รายการ", col_cost: "จำนวนเงิน",
    col_when: "เมื่อไร", col_goal: "เป้าหมาย", col_target: "ยอดเป้าหมาย", col_byWhen: "ภายในเมื่อ", col_asset: "สินทรัพย์",
    col_value: "มูลค่า", col_debt: "หนี้", col_balance: "ยอดคงเหลือ", col_rate: "ดอกเบี้ย %", col_monthlyPay: "ผ่อนต่อเดือน",
    freq_monthly: "รายเดือน", freq_annual: "รายปี", freq_oneoff: "ครั้งเดียว",
    new_income: "รายได้ใหม่", new_expense: "รายจ่ายใหม่", new_goal: "เป้าหมายใหม่",
    new_asset: "สินทรัพย์ใหม่", new_debt: "หนี้ใหม่", new_person: "บุคคลใหม่",

    whereGoes: "เงินไปไหนบ้าง", perMo: "/เดือน",
    emTitle: "เงินสำรองฉุกเฉิน", emDesc: "แยกจากเป้าหมายอื่น — กันชนก่อนเรื่องอื่น",
    emCurrent: "ปัจจุบัน", emTarget: "เป้าหมาย", emFunded: "{pct}% แล้ว · {a} จาก {b}",

    setAssumptions: "สมมติฐานการคำนวณ", setCurrency: "สกุลเงิน", setStarting: "เงินออมเริ่มต้น",
    setYears: "คำนวณล่วงหน้า (ปี)", setCons: "ผลตอบแทนต่ำ %", setExp: "ผลตอบแทนคาดหวัง %",
    setOpt: "ผลตอบแทนสูง %", setInfl: "เงินเฟ้อ %", setInflToggle: "แสดงตัวเลขเป็นมูลค่าปัจจุบัน (ปรับเงินเฟ้อ)",
    setRetireTitle: "เป้าหมายเกษียณ", setRetireDesc: "เว้นว่างเพื่อคำนวณอัตโนมัติจากค่าใช้จ่าย (กฎ 4% = 25× ค่าใช้จ่ายต่อปี)",
    setManualTarget: "ตั้งเป้าหมายเอง (ไม่บังคับ)", auto: "อัตโนมัติ", setAutoMultiple: "ตัวคูณอัตโนมัติ (× ค่าใช้จ่ายต่อปี)",
    household: "ครัวเรือน", addPerson: "เพิ่มบุคคล",
    householdDesc: "ระบุบุคคลให้รายได้ รายจ่าย และเป้าหมาย แล้วสลับระหว่างทั้งหมดกับรายบุคคลด้านบน",
    setLanguage: "ภาษา",

    exData_title: "ส่งออกข้อมูล", exData_desc: "ข้อมูลสำรองทั้งหมด คัดลอกหรือแชร์เพื่อบันทึก แล้วใช้นำเข้าเพื่อกู้คืนภายหลัง",
    exRep_title: "ส่งออกรายงาน", exRep_desc: "ภาพรวมสำหรับพิมพ์ บนคอมพิวเตอร์กดพิมพ์เพื่อบันทึกเป็น PDF บนมือถือใช้แชร์เพื่อส่งไปยังไฟล์ บันทึก หรือพิมพ์",
    copy: "คัดลอก", copied: "คัดลอกแล้ว ✓", share: "แชร์", print: "พิมพ์", download: "ดาวน์โหลด",
    downloadHtml: "ดาวน์โหลด .html", close: "ปิด",
    previewNote: "ตัวอย่าง — ถ่ายภาพหน้าจอเพื่อบันทึกบนมือถือ",
    blockedNote: "ในตัวอย่างของ Claude ใช้ได้เฉพาะคัดลอก ส่วนแชร์ พิมพ์ และดาวน์โหลดต้องเปิดในเบราว์เซอร์ปกติ — จะใช้งานได้เมื่อนำไปติดตั้งจริง",
    importBad: "ไฟล์นี้ไม่ใช่ข้อมูล Seedplanner ที่ถูกต้อง",

    rep_title: "Seedplanner — การคาดการณ์ทางการเงิน", rep_generated: "สร้างเมื่อ", rep_byYear: "การคาดการณ์รายปี",
    rep_now: "ปัจจุบัน", rep_year: "ปีที่", rep_emergency: "เงินสำรองฉุกเฉิน",
    rep_foot: "การคาดการณ์เป็นการประมาณจากข้อมูลและผลตอบแทนที่สมมติ ไม่ใช่คำแนะนำทางการเงิน",
  },
  de: {
    everyone: "Alle", export: "Export", import: "Import",
    tab_dashboard: "Übersicht", tab_income: "Einkommen", tab_expenses: "Ausgaben",
    tab_oneOffs: "Anstehend", tab_goals: "Ziele", tab_balance: "Vermögen & Schulden", tab_settings: "Einstellungen",
    footer: "Prognosen sind Schätzungen, keine Finanzberatung.",

    stat_surplus: "Monatlicher Überschuss", stat_retireNum: "Rentenbetrag",
    stat_retireOn: "Rente voraussichtlich", stat_balanceIn: "Stand in {n} Jahren",
    inout: "{in} ein · {out} aus", setManually: "manuell gesetzt", xAnnual: "{n}× Jahresausgaben",
    inYrs: "in {n} Jahren", beyond: "außerhalb des Zeitraums – Eingaben anpassen",
    todayDollars: "heutige Kaufkraft", futureDollars: "künftige Beträge",

    projSavings: "Prognostizierte Ersparnisse", projNetWorth: "Prognostiziertes Nettovermögen",
    savings: "Ersparnisse", netWorth: "Nettovermögen", yearly: "Jährlich", monthly: "Monatlich",
    descMonthly: "Monatlicher Kontostand für das gewählte Jahr",
    descYearly: "Ein Balken pro Jahr · grün, sobald du deinen Rentenbetrag erreichst",
    yearN: "Jahr {n}", projected: "Prognose", whatif: "Was-wäre-wenn", retirement: "Rente",
    yrShort: "{n} J.", monthYear: "{m}, Jahr {n}",

    whatifTitle: "Was-wäre-wenn-Szenario",
    whatifDesc: "Vergleiche eine Änderung mit deiner Basis, ohne etwas zu bearbeiten. Die gestrichelte Linie ist das Szenario.",
    wiIncome: "Monatl. Einkommen ändern", wiExpense: "Monatl. Ausgaben ändern",
    wiReturn: "Erwartete Rendite", wiOneOff: "Einmalige Kosten",

    add: "Hinzufügen", empty: "Noch nichts hier – füge deinen ersten Eintrag hinzu.", delete: "Löschen",
    title_income: "Einkommen", sub_income: "Wiederkehrend und einmalig. Ordne jedem Eintrag eine Person für die Haushaltsansicht zu.",
    title_expenses: "Ausgaben", sub_expenses: "Deine wiederkehrenden Ausgaben. Sie bestimmen deinen monatlichen Überschuss.",
    title_oneOffs: "Anstehende Ausgaben", sub_oneOffs: "Datierte einmalige Kosten – Reisen, Geschenke, ein Auto. Jede senkt deine Kurve in ihrem Monat.",
    title_goals: "Sparziele", sub_goals: "Benannte Ziele, als Linien im Diagramm dargestellt. Sieh zu, wie die Kurve sie kreuzt.",
    title_assets: "Vermögen", sub_assets: "Was du besitzt – Altersvorsorge, Investitionen, Immobilien. Fließt in die Nettovermögensansicht ein.",
    title_debts: "Schulden", sub_debts: "Kredite werden über den Zeitraum getilgt. Zahlungen senken deinen monatlichen Überschuss, bis sie abbezahlt sind.",

    col_source: "Quelle", col_amount: "Betrag", col_howOften: "Häufigkeit", col_dateOneoff: "Datum (einmalig)",
    col_person: "Person", col_item: "Posten", col_category: "Kategorie", col_what: "Was", col_cost: "Kosten",
    col_when: "Wann", col_goal: "Ziel", col_target: "Zielbetrag", col_byWhen: "Bis wann", col_asset: "Vermögenswert",
    col_value: "Wert", col_debt: "Schuld", col_balance: "Saldo", col_rate: "Zins %", col_monthlyPay: "Monatl. Rate",
    freq_monthly: "Monatlich", freq_annual: "Jährlich", freq_oneoff: "Einmalig",
    new_income: "Neues Einkommen", new_expense: "Neue Ausgabe", new_goal: "Neues Ziel",
    new_asset: "Neuer Vermögenswert", new_debt: "Neue Schuld", new_person: "Neue Person",

    whereGoes: "Wohin es geht", perMo: "/Mon.",
    emTitle: "Notgroschen", emDesc: "Getrennt von deinen Zielen – dein Puffer vor allem anderen.",
    emCurrent: "Aktuell", emTarget: "Ziel", emFunded: "{pct}% gedeckt · {a} von {b}",

    setAssumptions: "Annahmen der Prognose", setCurrency: "Währung", setStarting: "Anfangsersparnis",
    setYears: "Vorausberechnung (Jahre)", setCons: "Konservative Rendite %", setExp: "Erwartete Rendite %",
    setOpt: "Optimistische Rendite %", setInfl: "Inflation %", setInflToggle: "Beträge in heutiger Kaufkraft anzeigen (inflationsbereinigt)",
    setRetireTitle: "Rentenziel", setRetireDesc: "Leer lassen zur automatischen Berechnung aus deinen Ausgaben (4%-Regel = 25× Jahresausgaben).",
    setManualTarget: "Manuelles Ziel (optional)", auto: "auto", setAutoMultiple: "Auto-Faktor (× Jahresausgaben)",
    household: "Haushalt", addPerson: "Person hinzufügen",
    householdDesc: "Ordne Einkommen, Ausgaben und Ziele Personen zu und wechsle oben zwischen Alle und einer Person.",
    setLanguage: "Sprache",

    exData_title: "Daten exportieren", exData_desc: "Deine vollständige Sicherung. Kopiere oder teile sie zum Speichern und stelle sie später über Import wieder her.",
    exRep_title: "Bericht exportieren", exRep_desc: "Eine druckbare Übersicht. Am Computer auf Drucken tippen, um als PDF zu speichern. Am Handy über Teilen an Dateien, Notizen oder Drucken senden.",
    copy: "Kopieren", copied: "Kopiert ✓", share: "Teilen", print: "Drucken", download: "Herunterladen",
    downloadHtml: "HTML herunterladen", close: "Schließen",
    previewNote: "Vorschau – mache einen Screenshot, um sie auf dem Handy zu speichern",
    blockedNote: "In der Claude-Vorschau funktioniert nur Kopieren zuverlässig. Teilen, Drucken und Herunterladen benötigen die App in einem normalen Browser – sie funktionieren nach der Veröffentlichung.",
    importBad: "Diese Datei enthält keine gültigen Seedplanner-Daten.",

    rep_title: "Seedplanner – Finanzprognose", rep_generated: "erstellt", rep_byYear: "Prognose nach Jahr",
    rep_now: "Jetzt", rep_year: "Jahr", rep_emergency: "Notgroschen",
    rep_foot: "Prognosen sind Schätzungen basierend auf deinen Eingaben und angenommenen Renditen – keine Finanzberatung.",
  },
  fr: {
    everyone: "Tout le monde", export: "Exporter", import: "Importer",
    tab_dashboard: "Aperçu", tab_income: "Revenus", tab_expenses: "Dépenses",
    tab_oneOffs: "À venir", tab_goals: "Objectifs", tab_balance: "Actifs et dettes", tab_settings: "Réglages",
    footer: "Les projections sont des estimations, pas des conseils financiers.",

    stat_surplus: "Excédent mensuel", stat_retireNum: "Montant retraite",
    stat_retireOn: "Retraite prévue", stat_balanceIn: "Solde dans {n} ans",
    inout: "{in} entrée · {out} sortie", setManually: "défini manuellement", xAnnual: "{n}× dépenses annuelles",
    inYrs: "dans {n} ans", beyond: "au-delà de la période – ajustez les données",
    todayDollars: "valeur d'aujourd'hui", futureDollars: "valeur future",

    projSavings: "Épargne projetée", projNetWorth: "Valeur nette projetée",
    savings: "Épargne", netWorth: "Valeur nette", yearly: "Annuel", monthly: "Mensuel",
    descMonthly: "Solde mois par mois pour l'année choisie",
    descYearly: "Une barre par an · vert dès que vous dépassez votre montant retraite",
    yearN: "Année {n}", projected: "Projeté", whatif: "Hypothèse", retirement: "Retraite",
    yrShort: "{n} an", monthYear: "{m}, année {n}",

    whatifTitle: "Scénario hypothétique",
    whatifDesc: "Comparez un changement à votre base sans rien modifier. La ligne pointillée est l'hypothèse.",
    wiIncome: "Variation revenu mensuel", wiExpense: "Variation dépense mensuelle",
    wiReturn: "Rendement attendu", wiOneOff: "Coût ponctuel",

    add: "Ajouter", empty: "Rien ici pour l'instant – ajoutez votre première entrée.", delete: "Supprimer",
    title_income: "Revenus", sub_income: "Récurrents et ponctuels. Associez chacun à une personne pour la vue foyer.",
    title_expenses: "Dépenses", sub_expenses: "Vos dépenses récurrentes. Elles déterminent votre excédent mensuel.",
    title_oneOffs: "Dépenses à venir", sub_oneOffs: "Coûts ponctuels datés – voyages, cadeaux, une voiture. Chacun fait baisser votre courbe le mois venu.",
    title_goals: "Objectifs d'épargne", sub_goals: "Objectifs nommés, tracés en lignes sur le graphique. Regardez la courbe les franchir.",
    title_assets: "Actifs", sub_assets: "Ce que vous possédez – retraite, placements, immobilier. Alimente la vue valeur nette.",
    title_debts: "Dettes", sub_debts: "Les prêts s'amortissent sur la période. Les paiements réduisent votre excédent mensuel jusqu'à leur remboursement.",

    col_source: "Source", col_amount: "Montant", col_howOften: "Fréquence", col_dateOneoff: "Date (ponctuel)",
    col_person: "Personne", col_item: "Poste", col_category: "Catégorie", col_what: "Quoi", col_cost: "Coût",
    col_when: "Quand", col_goal: "Objectif", col_target: "Cible", col_byWhen: "Pour quand", col_asset: "Actif",
    col_value: "Valeur", col_debt: "Dette", col_balance: "Solde", col_rate: "Taux %", col_monthlyPay: "Paiement mensuel",
    freq_monthly: "Mensuel", freq_annual: "Annuel", freq_oneoff: "Ponctuel",
    new_income: "Nouveau revenu", new_expense: "Nouvelle dépense", new_goal: "Nouvel objectif",
    new_asset: "Nouvel actif", new_debt: "Nouvelle dette", new_person: "Nouvelle personne",

    whereGoes: "Où va l'argent", perMo: "/mois",
    emTitle: "Fonds d'urgence", emDesc: "Séparé de vos objectifs – votre coussin avant tout le reste.",
    emCurrent: "Actuel", emTarget: "Cible", emFunded: "{pct}% atteint · {a} sur {b}",

    setAssumptions: "Hypothèses de projection", setCurrency: "Devise", setStarting: "Épargne de départ",
    setYears: "Projeter sur (années)", setCons: "Rendement prudent %", setExp: "Rendement attendu %",
    setOpt: "Rendement optimiste %", setInfl: "Inflation %", setInflToggle: "Afficher les montants en valeur d'aujourd'hui (ajusté de l'inflation)",
    setRetireTitle: "Objectif retraite", setRetireDesc: "Laissez vide pour un calcul automatique à partir de vos dépenses (règle des 4 % = 25× dépenses annuelles).",
    setManualTarget: "Objectif manuel (facultatif)", auto: "auto", setAutoMultiple: "Multiple auto (× dépenses annuelles)",
    household: "Foyer", addPerson: "Ajouter une personne",
    householdDesc: "Associez revenus, dépenses et objectifs aux personnes, puis basculez entre Tout le monde et une personne en haut.",
    setLanguage: "Langue",

    exData_title: "Exporter vos données", exData_desc: "Votre sauvegarde complète. Copiez ou partagez-la pour l'enregistrer, puis restaurez-la via Importer.",
    exRep_title: "Exporter le rapport", exRep_desc: "Un aperçu imprimable. Sur ordinateur, touchez Imprimer pour enregistrer en PDF. Sur téléphone, utilisez Partager pour l'envoyer vers Fichiers, Notes ou l'imprimer.",
    copy: "Copier", copied: "Copié ✓", share: "Partager", print: "Imprimer", download: "Télécharger",
    downloadHtml: "Télécharger .html", close: "Fermer",
    previewNote: "Aperçu – faites une capture d'écran pour l'enregistrer sur votre téléphone",
    blockedNote: "Dans l'aperçu Claude, seul Copier fonctionne de façon fiable. Partager, Imprimer et Télécharger nécessitent l'app dans un navigateur normal – ils fonctionneront une fois déployée.",
    importBad: "Ce fichier ne contient pas de données Seedplanner valides.",

    rep_title: "Seedplanner – projection financière", rep_generated: "généré", rep_byYear: "Projection par année",
    rep_now: "Maintenant", rep_year: "Année", rep_emergency: "Fonds d'urgence",
    rep_foot: "Les projections sont des estimations basées sur vos données et des rendements supposés – pas des conseils financiers.",
  },
};

function t(key, vars) {
  const dict = STR[LANG] || STR.en;
  let s = dict[key] != null ? dict[key] : (STR.en[key] != null ? STR.en[key] : key);
  if (vars) for (const k in vars) s = s.split("{" + k + "}").join(vars[k]);
  return s;
}

/* ------------------------------------------------------------------ *
 * Persistence layer.  This is the ONLY storage touchpoint — in the
 * production build it's swapped for the Planourdays Drive
 * appDataFolder sync. Everything else is local-first derived state.
 * ------------------------------------------------------------------ */
/* ------------------------------------------------------------------ *
 * Persistence layer. Local-first, same adapter seam as Planourdays:
 * swap these two methods for Google Drive appDataFolder sync later.
 * ------------------------------------------------------------------ */
const STORE_KEY = "horizon_finance_state_v1";
const store = {
  async load() {
    try {
      const v = localStorage.getItem(STORE_KEY);
      return v ? JSON.parse(v) : null;
    } catch {
      return null;
    }
  },
  async save(state) {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(state));
    } catch (e) {
      console.error("save failed", e);
    }
  },
};

/* ------------------------------------------------------------------ */
const uid = () => Math.random().toString(36).slice(2, 9);

function downloadFile(content, filename, mime) {
  try {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      try { document.body.removeChild(a); } catch {}
      URL.revokeObjectURL(url);
    }, 4000);
    return true;
  } catch {
    return false;
  }
}
const CURRENCIES = [
  "AED","AFN","ALL","AMD","ANG","AOA","ARS","AUD","AWG","AZN","BAM","BBD","BDT","BGN","BHD","BIF",
  "BMD","BND","BOB","BRL","BSD","BTN","BWP","BYN","BZD","CAD","CDF","CHF","CLP","CNY","COP","CRC",
  "CUP","CVE","CZK","DJF","DKK","DOP","DZD","EGP","ERN","ETB","EUR","FJD","FKP","GBP","GEL","GHS",
  "GIP","GMD","GNF","GTQ","GYD","HKD","HNL","HRK","HTG","HUF","IDR","ILS","INR","IQD","IRR","ISK",
  "JMD","JOD","JPY","KES","KGS","KHR","KMF","KPW","KRW","KWD","KYD","KZT","LAK","LBP","LKR","LRD",
  "LSL","LYD","MAD","MDL","MGA","MKD","MMK","MNT","MOP","MRU","MUR","MVR","MWK","MXN","MYR","MZN",
  "NAD","NGN","NIO","NOK","NPR","NZD","OMR","PAB","PEN","PGK","PHP","PKR","PLN","PYG","QAR","RON",
  "RSD","RUB","RWF","SAR","SBD","SCR","SDG","SEK","SGD","SHP","SLE","SOS","SRD","SSP","STN","SYP",
  "SZL","THB","TJS","TMT","TND","TOP","TRY","TTD","TWD","TZS","UAH","UGX","USD","UYU","UZS","VES",
  "VND","VUV","WST","XAF","XCD","XOF","XPF","YER","ZAR","ZMW","ZWL",
];

const _curNames = {};
function currencyName(code) {
  try {
    const loc = LANG === "th" ? "th" : "en";
    if (!_curNames[loc]) _curNames[loc] = new Intl.DisplayNames([loc], { type: "currency" });
    return _curNames[loc].of(code) || code;
  } catch {
    return code;
  }
}

const seed = {
  settings: {
    currency: "AUD",
    lang: "en",
    startingSavings: 25000,
    projectionYears: 30,
    returnConservative: 3,
    returnExpected: 6,
    returnOptimistic: 8,
    inflationRate: 2.5,
    inflationAdjust: false,
    retirementTarget: null, // null = auto (annual expenses × multiple)
    retireMultiple: 25,
  },
  members: [
    { id: "me", name: "Me" },
    { id: "partner", name: "Partner" },
  ],
  income: [
    { id: uid(), label: "Salary (PAYG)", amount: 7200, frequency: "monthly", memberId: "me" },
    { id: uid(), label: "Freelance", amount: 1500, frequency: "monthly", memberId: "me" },
    { id: uid(), label: "Salary", amount: 6500, frequency: "monthly", memberId: "partner" },
  ],
  expenses: [
    { id: uid(), label: "Rent", amount: 2600, frequency: "monthly", category: "Housing", memberId: "me" },
    { id: uid(), label: "Groceries", amount: 900, frequency: "monthly", category: "Food", memberId: "me" },
    { id: uid(), label: "Utilities", amount: 320, frequency: "monthly", category: "Housing", memberId: "partner" },
    { id: uid(), label: "Subscriptions", amount: 90, frequency: "monthly", category: "Lifestyle", memberId: "me" },
    { id: uid(), label: "Transport", amount: 280, frequency: "monthly", category: "Transport", memberId: "partner" },
  ],
  oneOffs: [
    { id: uid(), label: "Japan honeymoon", amount: 12000, date: isoIn(8), memberId: "me" },
    { id: uid(), label: "Christmas gifts", amount: 1500, date: isoIn(6), memberId: "me" },
    { id: uid(), label: "New laptop", amount: 3000, date: isoIn(14), memberId: "partner" },
  ],
  goals: [
    { id: uid(), label: "House deposit", target: 120000, date: isoIn(48), memberId: "me" },
    { id: uid(), label: "Travel fund", target: 20000, date: isoIn(24), memberId: "partner" },
  ],
  debts: [
    { id: uid(), label: "Car loan", balance: 18000, annualRate: 7, monthlyPayment: 600, memberId: "partner" },
  ],
  assets: [
    { id: uid(), label: "Super", value: 85000, memberId: "me" },
  ],
  emergency: { target: 20000, current: 12000 },
};

function isoIn(months) {
  const d = new Date();
  d.setMonth(d.getMonth() + months);
  return d.toISOString().slice(0, 10);
}
function monthsFromNow(iso) {
  if (!iso) return 0;
  const now = new Date();
  const d = new Date(iso);
  return (d.getFullYear() - now.getFullYear()) * 12 + (d.getMonth() - now.getMonth());
}

/* ------------------------------------------------------------------ *
 * Projection engine — pure. The single source of truth for the chart.
 * ------------------------------------------------------------------ */
function monthlyOf(amount, frequency) {
  if (frequency === "annual") return amount / 12;
  return amount; // monthly
}

function buildProjection({ settings, income, expenses, oneOffs, debts, assets, whatIf }) {
  const months = settings.projectionYears * 12;

  let monthlyIncome = income
    .filter((i) => i.frequency !== "oneoff")
    .reduce((s, i) => s + monthlyOf(i.amount, i.frequency), 0);
  let monthlyExpense = expenses.reduce((s, e) => s + monthlyOf(e.amount, e.frequency), 0);
  const monthlyDebtPay = debts.reduce((s, d) => s + (d.monthlyPayment || 0), 0);

  // What-if adjustments (deltas applied on top of baseline)
  if (whatIf?.active) {
    monthlyIncome += whatIf.incomeDelta || 0;
    monthlyExpense += whatIf.expenseDelta || 0;
  }

  const baseNet = monthlyIncome - monthlyExpense - monthlyDebtPay;

  // one-off events keyed by month index
  const oneOffByMonth = {};
  oneOffs.forEach((o) => {
    const m = monthsFromNow(o.date);
    if (m >= 0 && m <= months) oneOffByMonth[m] = (oneOffByMonth[m] || 0) + o.amount;
  });
  // one-off income events
  income.filter((i) => i.frequency === "oneoff").forEach((i) => {
    const m = monthsFromNow(i.date);
    if (m >= 0 && m <= months) oneOffByMonth[m] = (oneOffByMonth[m] || 0) - i.amount;
  });
  if (whatIf?.active && whatIf.oneOffAmount) {
    const m = whatIf.oneOffMonth || 0;
    oneOffByMonth[m] = (oneOffByMonth[m] || 0) + whatIf.oneOffAmount;
  }

  const assetTotal = assets.reduce((s, a) => s + (a.value || 0), 0);

  const rates = {
    conservative: settings.returnConservative / 100,
    expected: (whatIf?.active && whatIf.returnRate != null ? whatIf.returnRate : settings.returnExpected) / 100,
    optimistic: settings.returnOptimistic / 100,
  };

  // run three scenarios + track debt amortisation (shared across rates)
  const bal = {
    conservative: settings.startingSavings,
    expected: settings.startingSavings,
    optimistic: settings.startingSavings,
    whatif: settings.startingSavings,
  };
  let debtState = debts.map((d) => ({ ...d, rem: d.balance }));

  const infl = settings.inflationRate / 100;
  const data = [];

  for (let m = 0; m <= months; m++) {
    if (m > 0) {
      for (const k of ["conservative", "expected", "optimistic"]) {
        bal[k] = bal[k] * (1 + rates[k] / 12) + baseNet - (oneOffByMonth[m] || 0);
      }
      if (whatIf?.active) {
        bal.whatif = bal.whatif * (1 + rates.expected / 12) + baseNet - (oneOffByMonth[m] || 0);
      }
      // amortise debt
      let totalRem = 0;
      debtState = debtState.map((d) => {
        let rem = d.rem;
        rem = rem + (rem * (d.annualRate / 100)) / 12 - (d.monthlyPayment || 0);
        rem = Math.max(0, rem);
        totalRem += rem;
        return { ...d, rem };
      });
    }

    const deflator = settings.inflationAdjust ? Math.pow(1 + infl / 12, m) : 1;
    const debtRem = debtState.reduce((s, d) => s + d.rem, 0);

    const row = {
      month: m,
      year: +(m / 12).toFixed(2),
      conservative: Math.round(bal.conservative / deflator),
      expected: Math.round(bal.expected / deflator),
      optimistic: Math.round(bal.optimistic / deflator),
      netWorth: Math.round((bal.expected + assetTotal - debtRem) / deflator),
    };
    if (whatIf?.active) row.whatif = Math.round(bal.whatif / deflator);
    data.push(row);
  }

  // monthly figures for the summary cards
  return {
    data,
    monthlyIncome,
    monthlyExpense: monthlyExpense + monthlyDebtPay,
    monthlyNet: baseNet,
    assetTotal,
  };
}

/* ------------------------------------------------------------------ *
 * Auth gate — placeholder Google sign-in. No real OAuth yet: the full
 * build swaps onSignIn for the Google Identity flow that unlocks the
 * Drive appDataFolder sync. Until then it just sets a local flag.
 * ------------------------------------------------------------------ */
const AUTH_KEY = "horizon_authed_v1";

function GoogleG({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  );
}

function LoginScreen({ onSignIn }) {
  return (
    <div style={{ background: C.sky, backgroundColor: C.bg, minHeight: "100vh", display: "grid", placeItems: "center", color: C.ink, fontFamily: FONT, padding: 20 }}>
      <div style={{ background: C.card, borderRadius: 20, boxShadow: shadow, padding: "36px 30px", width: "100%", maxWidth: 380, textAlign: "center" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 9, marginBottom: 22 }}>
          <span style={{ width: 26, height: 26, borderRadius: 9, background: C.green, display: "inline-block" }} />
          <span style={{ fontWeight: 600, fontSize: 20, letterSpacing: "-0.01em" }}>Seedplanner</span>
        </div>
        <h1 style={{ fontSize: 19, fontWeight: 600, margin: "0 0 6px" }}>{t("login_title")}</h1>
        <p style={{ color: C.sub, fontSize: 14, lineHeight: 1.5, margin: "0 0 26px" }}>{t("login_subtitle")}</p>
        <button onClick={onSignIn} type="button"
          style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, padding: "11px 14px", borderRadius: 12, border: `1px solid ${C.line}`, background: "#fff", color: C.ink, fontFamily: FONT, fontSize: 15, fontWeight: 600, cursor: "pointer", boxShadow: shadowSoft }}>
          <GoogleG size={18} /> {t("login_google")}
        </button>
        <p style={{ color: C.faint, fontSize: 12, lineHeight: 1.5, margin: "20px 0 0" }}>{t("login_note")}</p>
        <p style={{ fontSize: 12, margin: "16px 0 0" }}>
          <a href="/home.html" style={{ color: C.sub, textDecoration: "none" }}>{t("nav_home")}</a>
          <span style={{ color: C.faint }}> · </span>
          <a href="/privacy.html" style={{ color: C.sub, textDecoration: "none" }}>{t("nav_privacy")}</a>
          <span style={{ color: C.faint }}> · </span>
          <a href="/terms.html" style={{ color: C.sub, textDecoration: "none" }}>{t("nav_terms")}</a>
        </p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * App
 * ------------------------------------------------------------------ */
export default function App() {
  const [state, setState] = useState(null);
  const [tab, setTab] = useState("dashboard");
  const [view, setView] = useState("all"); // member filter
  const [metric, setMetric] = useState("savings"); // savings | networth
  const [whatIf, setWhatIf] = useState({
    active: false, incomeDelta: 0, expenseDelta: 0, returnRate: null,
    oneOffAmount: 0, oneOffMonth: 12,
  });
  const [sheet, setSheet] = useState(null);
  const [authed, setAuthed] = useState(() => {
    try { return localStorage.getItem(AUTH_KEY) === "1"; } catch { return false; }
  });
  const saveTimer = useRef(null);

  useEffect(() => {
    store.load().then((s) => setState(s || seed));
  }, []);

  useEffect(() => {
    if (!state) return;
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => store.save(state), 400);
  }, [state]);

  const fmt = useMemo(() => {
    const cur = state?.settings.currency || "AUD";
    return new Intl.NumberFormat(undefined, {
      style: "currency", currency: cur, maximumFractionDigits: 0,
    });
  }, [state?.settings.currency]);

  const memberName = useCallback(
    (id) => state?.members.find((m) => m.id === id)?.name || "—",
    [state?.members]
  );

  // member-filtered slices
  const filtered = useMemo(() => {
    if (!state) return null;
    const f = (arr) => (view === "all" ? arr : arr.filter((x) => x.memberId === view));
    return {
      income: f(state.income),
      expenses: f(state.expenses),
      oneOffs: f(state.oneOffs),
      goals: f(state.goals),
      debts: f(state.debts),
      assets: f(state.assets),
    };
  }, [state, view]);

  const projection = useMemo(() => {
    if (!state || !filtered) return null;
    return buildProjection({
      settings: state.settings,
      income: filtered.income,
      expenses: filtered.expenses,
      oneOffs: filtered.oneOffs,
      debts: filtered.debts,
      assets: filtered.assets,
      whatIf,
    });
  }, [state, filtered, whatIf]);

  /* ---- placeholder auth gate: show login until signed in ---- */
  LANG = state?.settings?.lang || "en";
  if (!authed) {
    return (
      <LoginScreen
        onSignIn={() => {
          try { localStorage.setItem(AUTH_KEY, "1"); } catch {}
          setAuthed(true);
        }}
      />
    );
  }

  if (!state || !projection) {
    return (
      <div style={{ background: C.bg, minHeight: "100vh", display: "grid", placeItems: "center", color: C.sub, fontFamily: "ui-sans-serif, system-ui" }}>
        Loading…
      </div>
    );
  }

  /* ---- active language (drives every t() call below) ---- */
  LANG = state.settings.lang || "en";

  /* ---- derived headline numbers ---- */
  const annualExpense = projection.monthlyExpense * 12;
  const retireTarget = state.settings.retirementTarget ?? Math.round(annualExpense * state.settings.retireMultiple);
  const chartKey = metric === "networth" ? "netWorth" : "expected";

  const crossing = projection.data.find((d) => d[chartKey] >= retireTarget);
  const retireMonths = crossing ? crossing.month : null;
  const retireDate = retireMonths != null ? isoIn(retireMonths) : null;

  /* ---- mutation helpers ---- */
  const set = (patch) => setState((s) => ({ ...s, ...patch }));
  const setSettings = (patch) =>
    setState((s) => ({ ...s, settings: { ...s.settings, ...patch } }));
  const addItem = (key, item) => setState((s) => ({ ...s, [key]: [...s[key], item] }));
  const updItem = (key, id, patch) =>
    setState((s) => ({ ...s, [key]: s[key].map((i) => (i.id === id ? { ...i, ...patch } : i)) }));
  const delItem = (key, id) =>
    setState((s) => ({ ...s, [key]: s[key].filter((i) => i.id !== id) }));

  /* ---- placeholder sign-out: clears the auth flag, returns to login ---- */
  const signOut = () => {
    try { localStorage.removeItem(AUTH_KEY); } catch {}
    setAuthed(false);
  };

  /* ---- export / import ---- */
  const exportJSON = () => {
    setSheet({
      kind: "data",
      title: t("exData_title"),
      desc: t("exData_desc"),
      content: JSON.stringify(state, null, 2),
      filename: `seedplanner-backup-${new Date().toISOString().slice(0, 10)}.json`,
      mime: "application/json",
    });
  };
  const importJSON = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const r = new FileReader();
    r.onload = () => {
      try { setState(JSON.parse(r.result)); } catch { alert(t("importBad")); }
    };
    r.readAsText(file);
    e.target.value = "";
  };

  const exportPDF = () => {
    const m = (v) => fmt.format(v || 0);
    const dt = (iso) => (iso ? new Date(iso).toLocaleDateString() : "—");
    const viewLabel = view === "all" ? t("everyone") : memberName(view);

    // year-by-year projection rows
    const rows = [];
    for (let y = 0; y <= state.settings.projectionYears; y++) {
      const p = projection.data[Math.min(y * 12, projection.data.length - 1)];
      const passed = p.expected >= retireTarget;
      rows.push(
        `<tr${passed ? ' class="hit"' : ""}><td>${y === 0 ? t("rep_now") : t("rep_year") + " " + y}</td>` +
        `<td class="r">${m(p.expected)}</td><td class="r">${m(p.netWorth)}</td></tr>`
      );
    }

    const section = (title, headers, body) =>
      body.length
        ? `<h3>${title}</h3><table><thead><tr>${headers
            .map((h) => `<th class="${h.r ? "r" : ""}">${h.t}</th>`)
            .join("")}</tr></thead><tbody>${body.join("")}</tbody></table>`
        : "";

    const fr = (f) => t("freq_" + f) || f;
    const incomeRows = filtered.income.map((i) =>
      `<tr><td>${i.label}</td><td class="r">${m(i.amount)}</td><td>${fr(i.frequency)}</td><td>${memberName(i.memberId)}</td></tr>`);
    const expenseRows = filtered.expenses.map((e) =>
      `<tr><td>${e.label}</td><td class="r">${m(e.amount)}</td><td>${fr(e.frequency)}</td><td>${e.category}</td><td>${memberName(e.memberId)}</td></tr>`);
    const oneOffRows = filtered.oneOffs.map((o) =>
      `<tr><td>${o.label}</td><td class="r">${m(o.amount)}</td><td>${dt(o.date)}</td><td>${memberName(o.memberId)}</td></tr>`);
    const goalRows = filtered.goals.map((g) =>
      `<tr><td>${g.label}</td><td class="r">${m(g.target)}</td><td>${dt(g.date)}</td><td>${memberName(g.memberId)}</td></tr>`);
    const debtRows = filtered.debts.map((d) =>
      `<tr><td>${d.label}</td><td class="r">${m(d.balance)}</td><td class="r">${d.annualRate}%</td><td class="r">${m(d.monthlyPayment)}</td><td>${memberName(d.memberId)}</td></tr>`);
    const assetRows = filtered.assets.map((a) =>
      `<tr><td>${a.label}</td><td class="r">${m(a.value)}</td><td>${memberName(a.memberId)}</td></tr>`);

    // pull the live chart SVG so the report shows the bars
    let chartHTML = "";
    try {
      const svg = document.querySelector(".recharts-surface");
      if (svg) chartHTML = `<div class="chart">${svg.outerHTML}</div>`;
    } catch { /* no chart available */ }

    const html = `<!doctype html><html><head><meta charset="utf-8"><title>Seedplanner report</title>
<style>
  @page { margin: 18mm; }
  * { box-sizing: border-box; }
  body { font-family: ui-sans-serif, system-ui, -apple-system, sans-serif; color: #23323C; margin: 0; }
  .head { border-bottom: 2px solid #2E8C8C; padding-bottom: 12px; margin-bottom: 18px; }
  .head h1 { margin: 0; font-size: 22px; color: #2E8C8C; }
  .head .meta { color: #5C6E76; font-size: 12px; margin-top: 4px; }
  .cards { display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 18px; }
  .card { border: 1px solid #E4ECEC; border-radius: 12px; padding: 12px 14px; min-width: 150px; }
  .card .l { font-size: 11px; color: #93A4AA; }
  .card .v { font-size: 20px; font-weight: 600; margin-top: 4px; font-variant-numeric: tabular-nums; }
  .chart { margin: 6px 0 20px; }
  h3 { font-size: 13px; color: #2E8C8C; margin: 20px 0 6px; }
  table { width: 100%; border-collapse: collapse; font-size: 12px; }
  th { text-align: left; color: #93A4AA; font-weight: 500; border-bottom: 1px solid #E4ECEC; padding: 5px 6px; }
  td { padding: 5px 6px; border-bottom: 1px solid #F0F4F4; font-variant-numeric: tabular-nums; }
  .r { text-align: right; }
  tr.hit td { background: #DBEDEB; }
  .foot { margin-top: 22px; color: #93A4AA; font-size: 11px; }
</style></head><body>
  <div class="head">
    <h1>${t("rep_title")}</h1>
    <div class="meta">${viewLabel} · ${t("rep_generated")} ${new Date().toLocaleDateString()} · ${state.settings.currency} · ${state.settings.inflationAdjust ? t("todayDollars") : t("futureDollars")}</div>
  </div>
  <div class="cards">
    <div class="card"><div class="l">${t("stat_surplus")}</div><div class="v">${m(projection.monthlyNet)}</div></div>
    <div class="card"><div class="l">${t("stat_retireNum")}</div><div class="v">${m(retireTarget)}</div></div>
    <div class="card"><div class="l">${t("stat_retireOn")}</div><div class="v">${retireDate ? new Date(retireDate).getFullYear() : "—"}</div></div>
    <div class="card"><div class="l">${t("stat_balanceIn", { n: state.settings.projectionYears })}</div><div class="v">${m(projection.data[projection.data.length - 1].expected)}</div></div>
  </div>
  ${chartHTML}
  <h3>${t("rep_byYear")}</h3>
  <table><thead><tr><th>${t("col_when")}</th><th class="r">${t("savings")}</th><th class="r">${t("netWorth")}</th></tr></thead><tbody>${rows.join("")}</tbody></table>
  ${section(t("title_income"), [{ t: t("col_source") }, { t: t("col_amount"), r: 1 }, { t: t("col_howOften") }, { t: t("col_person") }], incomeRows)}
  ${section(t("title_expenses"), [{ t: t("col_item") }, { t: t("col_amount"), r: 1 }, { t: t("col_howOften") }, { t: t("col_category") }, { t: t("col_person") }], expenseRows)}
  ${section(t("title_oneOffs"), [{ t: t("col_what") }, { t: t("col_cost"), r: 1 }, { t: t("col_when") }, { t: t("col_person") }], oneOffRows)}
  ${section(t("title_goals"), [{ t: t("col_goal") }, { t: t("col_target"), r: 1 }, { t: t("col_byWhen") }, { t: t("col_person") }], goalRows)}
  ${section(t("title_debts"), [{ t: t("col_debt") }, { t: t("col_balance"), r: 1 }, { t: t("col_rate") }, { t: t("col_monthlyPay"), r: 1 }, { t: t("col_person") }], debtRows)}
  ${section(t("title_assets"), [{ t: t("col_asset") }, { t: t("col_value"), r: 1 }, { t: t("col_person") }], assetRows)}
  <h3>${t("rep_emergency")}</h3>
  <table><tbody><tr><td>${t("emCurrent")}</td><td class="r">${m(state.emergency.current)}</td></tr><tr><td>${t("emTarget")}</td><td class="r">${m(state.emergency.target)}</td></tr></tbody></table>
  <div class="foot">${t("rep_foot")}</div>
</body></html>`;

    setSheet({
      kind: "report",
      title: t("exRep_title"),
      desc: t("exRep_desc"),
      content: html,
      filename: `seedplanner-report-${new Date().toISOString().slice(0, 10)}.html`,
      mime: "text/html",
    });
  };

  const TABS = [
    ["dashboard", t("tab_dashboard"), LayoutDashboard],
    ["income", t("tab_income"), Wallet],
    ["expenses", t("tab_expenses"), TrendingDown],
    ["oneOffs", t("tab_oneOffs"), CalendarClock],
    ["goals", t("tab_goals"), Target],
    ["balance", t("tab_balance"), Landmark],
    ["settings", t("tab_settings"), Cog],
  ];

  return (
    <div style={{ background: C.sky, backgroundColor: C.bg, minHeight: "100vh", color: C.ink, fontFamily: FONT }}>
      {/* top bar */}
      <header style={{ borderBottom: `1px solid ${C.line}`, background: "rgba(255,255,255,0.78)", backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)", position: "sticky", top: 0, zIndex: 20 }}>
        <div className="mx-auto flex flex-wrap items-center justify-between gap-2 px-3 py-3 sm:px-5" style={{ maxWidth: 1100 }}>
          <div className="flex items-center gap-2">
            <span style={{ width: 22, height: 22, borderRadius: 8, background: C.green, display: "inline-block" }} />
            <span style={{ fontWeight: 600, letterSpacing: "-0.01em" }}>Seedplanner</span>
          </div>
          <div className="flex items-center gap-2">
            <select value={state.settings.lang || "en"} onChange={(e) => setSettings({ lang: e.target.value })}
              title={t("setLanguage")}
              style={{ border: `1px solid ${C.line}`, borderRadius: 8, padding: "6px 9px", fontSize: 13, background: C.card, color: C.ink }}>
              {LANGS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
            <ViewSwitcher members={state.members} view={view} setView={setView} />
            <button onClick={exportJSON} title={t("export")} aria-label={t("export")}
              className="flex items-center gap-1 rounded-md px-2 py-1.5 text-sm sm:px-2.5"
              style={{ border: `1px solid ${C.line}`, color: C.sub, background: C.card }}>
              <Download size={15} /> <span className="hidden sm:inline">{t("export")}</span>
            </button>
            <button onClick={exportPDF} title="PDF" aria-label="PDF"
              className="flex items-center gap-1 rounded-md px-2 py-1.5 text-sm sm:px-2.5"
              style={{ border: `1px solid ${C.line}`, color: C.sub, background: C.card }}>
              <FileText size={15} /> <span className="hidden sm:inline">PDF</span>
            </button>
            <label title={t("import")} aria-label={t("import")}
              className="flex cursor-pointer items-center gap-1 rounded-md px-2 py-1.5 text-sm sm:px-2.5"
              style={{ border: `1px solid ${C.line}`, color: C.sub, background: C.card }}>
              <Upload size={15} /> <span className="hidden sm:inline">{t("import")}</span>
              <input type="file" accept="application/json" onChange={importJSON} className="hidden" />
            </label>
            <button onClick={signOut} title={t("signOut")} aria-label={t("signOut")}
              className="flex items-center gap-1 rounded-md px-2 py-1.5 text-sm sm:px-2.5"
              style={{ border: `1px solid ${C.line}`, color: C.sub, background: C.card }}>
              <LogOut size={15} /> <span className="hidden sm:inline">{t("signOut")}</span>
            </button>
          </div>
        </div>
        {/* tabs */}
        <div className="mx-auto flex gap-1 overflow-x-auto px-2 sm:px-3" style={{ maxWidth: 1100 }}>
          {TABS.map(([id, label, Icon]) => (
            <button key={id} onClick={() => setTab(id)}
              className="flex items-center gap-1.5 whitespace-nowrap px-3 py-2.5 text-sm"
              style={{
                color: tab === id ? C.ink : C.faint,
                fontWeight: tab === id ? 600 : 500,
                borderBottom: `2px solid ${tab === id ? C.green : "transparent"}`,
              }}>
              <Icon size={15} /> {label}
            </button>
          ))}
        </div>
      </header>

      <main className="mx-auto px-3 py-5 sm:px-5 sm:py-6" style={{ maxWidth: 1100 }}>
        {tab === "dashboard" && (
          <Dashboard {...{ state, projection, fmt, retireTarget, retireDate, retireMonths,
            metric, setMetric, whatIf, setWhatIf, chartKey, filtered }} />
        )}

        {tab === "income" && (
          <ListSection
            title={t("title_income")} subtitle={t("sub_income")}
            items={filtered.income} columns={incomeCols(state.members)}
            onAdd={() => addItem("income", { id: uid(), label: t("new_income"), amount: 0, frequency: "monthly", memberId: state.members[0].id })}
            onUpdate={(id, p) => updItem("income", id, p)}
            onDelete={(id) => delItem("income", id)} fmt={fmt} />
        )}

        {tab === "expenses" && (
          <>
            <ListSection
              title={t("title_expenses")} subtitle={t("sub_expenses")}
              items={filtered.expenses} columns={expenseCols(state.members)}
              onAdd={() => addItem("expenses", { id: uid(), label: t("new_expense"), amount: 0, frequency: "monthly", category: "Other", memberId: state.members[0].id })}
              onUpdate={(id, p) => updItem("expenses", id, p)}
              onDelete={(id) => delItem("expenses", id)} fmt={fmt} />
            <SpendBreakdown expenses={filtered.expenses} fmt={fmt} />
          </>
        )}

        {tab === "oneOffs" && (
          <ListSection
            title={t("title_oneOffs")} subtitle={t("sub_oneOffs")}
            items={filtered.oneOffs} columns={oneOffCols(state.members)}
            onAdd={() => addItem("oneOffs", { id: uid(), label: t("new_expense"), amount: 0, date: isoIn(6), memberId: state.members[0].id })}
            onUpdate={(id, p) => updItem("oneOffs", id, p)}
            onDelete={(id) => delItem("oneOffs", id)} fmt={fmt} />
        )}

        {tab === "goals" && (
          <ListSection
            title={t("title_goals")} subtitle={t("sub_goals")}
            items={filtered.goals} columns={goalCols(state.members)}
            onAdd={() => addItem("goals", { id: uid(), label: t("new_goal"), target: 10000, date: isoIn(24), memberId: state.members[0].id })}
            onUpdate={(id, p) => updItem("goals", id, p)}
            onDelete={(id) => delItem("goals", id)} fmt={fmt} />
        )}

        {tab === "balance" && (
          <>
            <EmergencyCard emergency={state.emergency} setEmergency={(p) => set({ emergency: { ...state.emergency, ...p } })} fmt={fmt} />
            <ListSection
              title={t("title_assets")} subtitle={t("sub_assets")}
              items={filtered.assets} columns={assetCols(state.members)}
              onAdd={() => addItem("assets", { id: uid(), label: t("new_asset"), value: 0, memberId: state.members[0].id })}
              onUpdate={(id, p) => updItem("assets", id, p)}
              onDelete={(id) => delItem("assets", id)} fmt={fmt} />
            <ListSection
              title={t("title_debts")} subtitle={t("sub_debts")}
              items={filtered.debts} columns={debtCols(state.members)}
              onAdd={() => addItem("debts", { id: uid(), label: t("new_debt"), balance: 0, annualRate: 6, monthlyPayment: 0, memberId: state.members[0].id })}
              onUpdate={(id, p) => updItem("debts", id, p)}
              onDelete={(id) => delItem("debts", id)} fmt={fmt} />
          </>
        )}

        {tab === "settings" && (
          <SettingsPanel state={state} setSettings={setSettings} setState={setState} />
        )}
      </main>

      <ExportSheet sheet={sheet} onClose={() => setSheet(null)} />

      <footer className="mx-auto px-3 pb-10 pt-2 sm:px-5" style={{ maxWidth: 1100 }}>
        <p style={{ color: C.faint, fontSize: 12, lineHeight: 1.6 }}>
          {t("footer")}
        </p>
        <p style={{ color: C.faint, fontSize: 12, marginTop: 8 }}>
          <a href="/home.html" style={{ color: C.sub, textDecoration: "none" }}>{t("nav_home")}</a>
          <span style={{ color: C.faint }}> · </span>
          <a href="/privacy.html" style={{ color: C.sub, textDecoration: "none" }}>{t("nav_privacy")}</a>
          <span style={{ color: C.faint }}> · </span>
          <a href="/terms.html" style={{ color: C.sub, textDecoration: "none" }}>{t("nav_terms")}</a>
        </p>
      </footer>
    </div>
  );
}

/* ================================================================== *
 * Dashboard
 * ================================================================== */
function Dashboard({ state, projection, fmt, retireTarget, retireDate, retireMonths, metric, setMetric, whatIf, setWhatIf, chartKey, filtered }) {
  const milestones = [1, 2, 3, 5, 10].filter((y) => y <= state.settings.projectionYears);
  const pointAt = (y) => projection.data[Math.min(y * 12, projection.data.length - 1)];

  const goalLines = filtered.goals;

  // one bar per year (end-of-year balance), easier to scan than a curve
  const yearly = useMemo(() => {
    const out = [];
    for (let y = 1; y <= state.settings.projectionYears; y++) {
      const p = projection.data[Math.min(y * 12, projection.data.length - 1)];
      out.push({ year: y, value: p[chartKey], whatif: p.whatif });
    }
    return out;
  }, [projection, chartKey, state.settings.projectionYears]);

  // monthly drill-down for a chosen year (12 bars)
  const [grain, setGrain] = useState("yearly"); // yearly | monthly
  const [pickYear, setPickYear] = useState(1);
  const year = Math.min(Math.max(1, pickYear), state.settings.projectionYears);

  const monthly = useMemo(() => {
    const out = [];
    const start = (year - 1) * 12 + 1;
    for (let i = 0; i < 12; i++) {
      const m = start + i;
      const p = projection.data[Math.min(m, projection.data.length - 1)];
      const d = new Date();
      d.setMonth(d.getMonth() + m);
      out.push({ label: d.toLocaleString(undefined, { month: "short" }), value: p[chartKey], whatif: p.whatif });
    }
    return out;
  }, [projection, chartKey, year]);

  const isMonthly = grain === "monthly";
  const chartData = isMonthly ? monthly : yearly;
  const xKey = isMonthly ? "label" : "year";
  // label sparsity so the axis never crowds on a phone
  const tickEvery = isMonthly ? 1 : Math.ceil(state.settings.projectionYears / 6);

  return (
    <div className="flex flex-col gap-5">
      {/* headline cards */}
      <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(148px, 1fr))" }}>
        <Stat label={t("stat_surplus")}
          value={fmt.format(projection.monthlyNet)}
          tone={projection.monthlyNet >= 0 ? C.green : C.clay}
          sub={t("inout", { in: fmt.format(projection.monthlyIncome), out: fmt.format(projection.monthlyExpense) })} />
        <Stat label={t("stat_retireNum")}
          value={fmt.format(retireTarget)}
          sub={state.settings.retirementTarget ? t("setManually") : t("xAnnual", { n: state.settings.retireMultiple })} />
        <Stat label={t("stat_retireOn")}
          value={retireDate ? new Date(retireDate).getFullYear() : "—"}
          tone={C.green}
          sub={retireMonths != null ? t("inYrs", { n: (retireMonths / 12).toFixed(1) }) : t("beyond")} />
        <Stat label={t("stat_balanceIn", { n: state.settings.projectionYears })}
          value={fmt.format(projection.data[projection.data.length - 1][chartKey])}
          sub={state.settings.inflationAdjust ? t("todayDollars") : t("futureDollars")} />
      </div>

      {/* chart */}
      <Card>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 style={{ fontWeight: 600, fontSize: 15 }}>{metric === "networth" ? t("projNetWorth") : t("projSavings")}</h2>
            <p style={{ color: C.faint, fontSize: 12 }}>
              {isMonthly ? t("descMonthly") : t("descYearly")}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Segmented options={[["savings", t("savings")], ["networth", t("netWorth")]]} value={metric} onChange={setMetric} />
            <Segmented options={[["yearly", t("yearly")], ["monthly", t("monthly")]]} value={grain} onChange={setGrain} />
          </div>
        </div>

        {isMonthly && (
          <div className="mb-3 flex items-center gap-3">
            <button onClick={() => setPickYear((y) => Math.max(1, y - 1))}
              style={{ border: `1px solid ${C.line}`, borderRadius: 7, width: 30, height: 30, color: C.sub, fontSize: 16 }}>–</button>
            <span style={{ fontSize: 13, fontWeight: 600 }}>{t("yearN", { n: year })}</span>
            <button onClick={() => setPickYear((y) => Math.min(state.settings.projectionYears, y + 1))}
              style={{ border: `1px solid ${C.line}`, borderRadius: 7, width: 30, height: 30, color: C.sub, fontSize: 16 }}>+</button>
            <span style={{ fontSize: 12, color: C.faint }}>{new Date(new Date().setFullYear(new Date().getFullYear() + year)).getFullYear()}</span>
          </div>
        )}

        <div style={{ width: "100%", height: 300 }}>
          <ResponsiveContainer>
            <BarChart data={chartData} margin={{ top: 8, right: 8, bottom: 4, left: 4 }} barCategoryGap={whatIf.active ? "12%" : "22%"}>
              <CartesianGrid stroke={C.line} vertical={false} />
              <XAxis dataKey={xKey} stroke={C.faint} fontSize={11} tickLine={false} axisLine={false}
                interval={tickEvery - 1} tickFormatter={(v) => (isMonthly ? v : `${v}y`)} />
              <YAxis tickFormatter={(v) => abbr(v)} stroke={C.faint} fontSize={11} tickLine={false} axisLine={false} width={44} />
              <Tooltip
                cursor={{ fill: C.greenSoft, fillOpacity: 0.5 }}
                formatter={(v, n) => [fmt.format(v), n === "whatif" ? t("whatif") : t("projected")]}
                labelFormatter={(v) => (isMonthly ? t("monthYear", { m: v, n: year }) : t("yearN", { n: v }))}
                contentStyle={{ borderRadius: 10, border: `1px solid ${C.line}`, fontSize: 12, ...num }} />

              <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={38}>
                {chartData.map((d, i) => (
                  <Cell key={i} fill={d.value >= retireTarget ? C.green : C.belowBar} />
                ))}
              </Bar>
              {whatIf.active && (
                <Bar dataKey="whatif" radius={[6, 6, 0, 0]} maxBarSize={38} fill={C.clay} fillOpacity={0.85} />
              )}

              <ReferenceLine y={retireTarget} stroke={C.clay} strokeDasharray="5 4" strokeWidth={1.5}
                label={{ value: t("retirement"), position: "insideTopRight", fontSize: 10, fill: C.clay }} />
              {goalLines.map((g) => (
                <ReferenceLine key={g.id} y={g.target} stroke={C.conservative} strokeOpacity={0.7} strokeDasharray="2 4"
                  label={{ value: g.label, position: "insideTopLeft", fontSize: 9, fill: C.sub }} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* milestone strip */}
        <div className="mt-3 grid gap-2" style={{ gridTemplateColumns: `repeat(${milestones.length}, 1fr)` }}>
          {milestones.map((y) => (
            <div key={y} style={{ borderTop: `1px solid ${C.line}`, paddingTop: 8 }}>
              <div style={{ fontSize: 11, color: C.faint }}>{t("yrShort", { n: y })}</div>
              <div style={{ fontWeight: 600, fontSize: 13, ...num }}>{fmt.format(pointAt(y)[chartKey])}</div>
            </div>
          ))}
        </div>
      </Card>

      <WhatIf whatIf={whatIf} setWhatIf={setWhatIf} fmt={fmt} settings={state.settings} />
    </div>
  );
}

/* ================================================================== *
 * What-if panel
 * ================================================================== */
function WhatIf({ whatIf, setWhatIf, fmt, settings }) {
  const up = (p) => setWhatIf((w) => ({ ...w, ...p }));
  return (
    <Card>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <GitCompare size={16} color={C.clay} />
          <h2 style={{ fontWeight: 600, fontSize: 15 }}>{t("whatifTitle")}</h2>
        </div>
        <Toggle on={whatIf.active} onChange={(v) => up({ active: v })} />
      </div>
      <p style={{ color: C.faint, fontSize: 12, marginTop: 4 }}>
        {t("whatifDesc")}
      </p>
      {whatIf.active && (
        <div className="mt-4 grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(180px,1fr))" }}>
          <Slider label={t("wiIncome")} value={whatIf.incomeDelta} min={-4000} max={6000} step={100}
            onChange={(v) => up({ incomeDelta: v })} fmt={(v) => (v >= 0 ? "+" : "") + fmt.format(v)} />
          <Slider label={t("wiExpense")} value={whatIf.expenseDelta} min={-3000} max={5000} step={100}
            onChange={(v) => up({ expenseDelta: v })} fmt={(v) => (v >= 0 ? "+" : "") + fmt.format(v)} />
          <Slider label={t("wiReturn")} value={whatIf.returnRate ?? settings.returnExpected} min={0} max={12} step={0.5}
            onChange={(v) => up({ returnRate: v })} fmt={(v) => v + "%"} />
          <Slider label={t("wiOneOff")} value={whatIf.oneOffAmount} min={0} max={80000} step={1000}
            onChange={(v) => up({ oneOffAmount: v })} fmt={(v) => fmt.format(v)} />
        </div>
      )}
    </Card>
  );
}

/* ================================================================== *
 * Generic list section (income / expenses / one-offs / goals / etc.)
 * ================================================================== */
function ListSection({ title, subtitle, items, columns, onAdd, onUpdate, onDelete, fmt }) {
  const [openId, setOpenId] = useState(null);
  const prevLen = useRef(items.length);
  useEffect(() => {
    if (items.length > prevLen.current) setOpenId(items[items.length - 1].id);
    prevLen.current = items.length;
  }, [items]);
  return (
    <Card>
      <div className="mb-1 flex items-start justify-between">
        <div>
          <h2 style={{ fontWeight: 600, fontSize: 15 }}>{title}</h2>
          <p style={{ color: C.faint, fontSize: 12, marginTop: 2, maxWidth: 560 }}>{subtitle}</p>
        </div>
        <button onClick={onAdd}
          className="flex items-center gap-1 rounded-md px-2.5 py-1.5 text-sm"
          style={{ background: C.green, color: "#fff" }}>
          <Plus size={15} /> {t("add")}
        </button>
      </div>

      {/* Desktop / tablet: table */}
      <div className="mt-3 hidden overflow-x-auto sm:block">
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ color: C.faint, textAlign: "left" }}>
              {columns.map((c) => (
                <th key={c.key} style={{ fontWeight: 500, padding: "6px 8px", whiteSpace: "nowrap" }}>{c.label}</th>
              ))}
              <th />
            </tr>
          </thead>
          <tbody>
            {items.length === 0 && (
              <tr><td colSpan={columns.length + 1} style={{ padding: "16px 8px", color: C.faint }}>
                {t("empty")}
              </td></tr>
            )}
            {items.map((it) => (
              <tr key={it.id} style={{ borderTop: `1px solid ${C.line}` }}>
                {columns.map((c) => (
                  <td key={c.key} style={{ padding: "5px 8px" }}>
                    {c.render(it, (patch) => onUpdate(it.id, patch))}
                  </td>
                ))}
                <td style={{ padding: "5px 8px", textAlign: "right" }}>
                  <button onClick={() => onDelete(it.id)} style={{ color: C.faint }} title={t("delete")}>
                    <Trash2 size={15} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile: compact list — tap a row to expand its fields */}
      <div className="mt-3 sm:hidden" style={{ borderTop: `1px solid ${C.line}` }}>
        {items.length === 0 && (
          <p style={{ padding: "12px 2px", color: C.faint, fontSize: 13 }}>{t("empty")}</p>
        )}
        {items.map((it) => {
          const open = openId === it.id;
          const amount = it.amount ?? it.target ?? it.value ?? it.balance;
          return (
            <div key={it.id} style={{ borderBottom: `1px solid ${C.line}` }}>
              <button onClick={() => setOpenId(open ? null : it.id)}
                className="flex w-full items-center justify-between gap-2 py-3 text-left">
                <span style={{ fontWeight: 500, fontSize: 14, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {it.label || "—"}
                </span>
                <span className="flex shrink-0 items-center gap-2" style={{ color: C.sub, fontSize: 13 }}>
                  {amount != null && <span style={num}>{fmt.format(amount)}</span>}
                  <ChevronDown size={16}
                    style={{ color: C.faint, transition: "transform .15s", transform: open ? "rotate(180deg)" : "none" }} />
                </span>
              </button>
              {open && (
                <div className="pb-3">
                  {columns.map((c) => (
                    <div key={c.key} className="mb-2.5 flex flex-col gap-1">
                      <span style={{ color: C.faint, fontSize: 12 }}>{c.label}</span>
                      <div className="mfield">{c.render(it, (patch) => onUpdate(it.id, patch))}</div>
                    </div>
                  ))}
                  <div className="flex justify-end">
                    <button onClick={() => onDelete(it.id)} className="flex items-center gap-1 text-sm"
                      style={{ color: C.faint }} title={t("delete")}>
                      <Trash2 size={15} /> {t("delete")}
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}

/* ---- column definitions ---- */
const inputCell = (val, onChange, props = {}) => (
  <input value={val} onChange={(e) => onChange(e.target.value)}
    style={{ border: `1px solid ${C.line}`, borderRadius: 9, padding: "5px 8px", width: props.w || 130, fontSize: 13, ...(props.num ? num : {}) }}
    {...props} />
);
const moneyCell = (val, onChange) => (
  <input type="number" value={val} onChange={(e) => onChange(+e.target.value || 0)}
    style={{ border: `1px solid ${C.line}`, borderRadius: 9, padding: "5px 8px", width: 110, fontSize: 13, textAlign: "right", ...num }} />
);
const selectCell = (val, onChange, opts) => (
  <select value={val} onChange={(e) => onChange(e.target.value)}
    style={{ border: `1px solid ${C.line}`, borderRadius: 9, padding: "5px 8px", fontSize: 13, background: C.card }}>
    {opts.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
  </select>
);
const memberOpts = (members) => members.map((m) => ({ value: m.id, label: m.name }));
const freqOpts = () => [
  { value: "monthly", label: t("freq_monthly") },
  { value: "annual", label: t("freq_annual") },
  { value: "oneoff", label: t("freq_oneoff") },
];

const incomeCols = (members) => [
  { key: "label", label: t("col_source"), render: (it, u) => inputCell(it.label, (v) => u({ label: v }), { w: 150 }) },
  { key: "amount", label: t("col_amount"), render: (it, u) => moneyCell(it.amount, (v) => u({ amount: v })) },
  { key: "frequency", label: t("col_howOften"), render: (it, u) => selectCell(it.frequency, (v) => u({ frequency: v }), freqOpts()) },
  { key: "date", label: t("col_dateOneoff"), render: (it, u) => it.frequency === "oneoff" ? inputCell(it.date || isoIn(3), (v) => u({ date: v }), { type: "date", w: 140 }) : <span style={{ color: C.faint }}>—</span> },
  { key: "member", label: t("col_person"), render: (it, u) => selectCell(it.memberId, (v) => u({ memberId: v }), memberOpts(members)) },
];
const expenseCols = (members) => [
  { key: "label", label: t("col_item"), render: (it, u) => inputCell(it.label, (v) => u({ label: v }), { w: 150 }) },
  { key: "amount", label: t("col_amount"), render: (it, u) => moneyCell(it.amount, (v) => u({ amount: v })) },
  { key: "frequency", label: t("col_howOften"), render: (it, u) => selectCell(it.frequency, (v) => u({ frequency: v }), freqOpts().slice(0, 2)) },
  { key: "category", label: t("col_category"), render: (it, u) => inputCell(it.category, (v) => u({ category: v }), { w: 120 }) },
  { key: "member", label: t("col_person"), render: (it, u) => selectCell(it.memberId, (v) => u({ memberId: v }), memberOpts(members)) },
];
const oneOffCols = (members) => [
  { key: "label", label: t("col_what"), render: (it, u) => inputCell(it.label, (v) => u({ label: v }), { w: 160 }) },
  { key: "amount", label: t("col_cost"), render: (it, u) => moneyCell(it.amount, (v) => u({ amount: v })) },
  { key: "date", label: t("col_when"), render: (it, u) => inputCell(it.date, (v) => u({ date: v }), { type: "date", w: 140 }) },
  { key: "member", label: t("col_person"), render: (it, u) => selectCell(it.memberId, (v) => u({ memberId: v }), memberOpts(members)) },
];
const goalCols = (members) => [
  { key: "label", label: t("col_goal"), render: (it, u) => inputCell(it.label, (v) => u({ label: v }), { w: 160 }) },
  { key: "target", label: t("col_target"), render: (it, u) => moneyCell(it.target, (v) => u({ target: v })) },
  { key: "date", label: t("col_byWhen"), render: (it, u) => inputCell(it.date, (v) => u({ date: v }), { type: "date", w: 140 }) },
  { key: "member", label: t("col_person"), render: (it, u) => selectCell(it.memberId, (v) => u({ memberId: v }), memberOpts(members)) },
];
const assetCols = (members) => [
  { key: "label", label: t("col_asset"), render: (it, u) => inputCell(it.label, (v) => u({ label: v }), { w: 160 }) },
  { key: "value", label: t("col_value"), render: (it, u) => moneyCell(it.value, (v) => u({ value: v })) },
  { key: "member", label: t("col_person"), render: (it, u) => selectCell(it.memberId, (v) => u({ memberId: v }), memberOpts(members)) },
];
const debtCols = (members) => [
  { key: "label", label: t("col_debt"), render: (it, u) => inputCell(it.label, (v) => u({ label: v }), { w: 150 }) },
  { key: "balance", label: t("col_balance"), render: (it, u) => moneyCell(it.balance, (v) => u({ balance: v })) },
  { key: "annualRate", label: t("col_rate"), render: (it, u) => <input type="number" value={it.annualRate} onChange={(e) => u({ annualRate: +e.target.value || 0 })} style={{ border: `1px solid ${C.line}`, borderRadius: 9, padding: "5px 8px", width: 70, fontSize: 13, textAlign: "right", ...num }} /> },
  { key: "monthlyPayment", label: t("col_monthlyPay"), render: (it, u) => moneyCell(it.monthlyPayment, (v) => u({ monthlyPayment: v })) },
  { key: "member", label: t("col_person"), render: (it, u) => selectCell(it.memberId, (v) => u({ memberId: v }), memberOpts(members)) },
];

/* ================================================================== *
 * Spending breakdown
 * ================================================================== */
function SpendBreakdown({ expenses, fmt }) {
  const byCat = useMemo(() => {
    const m = {};
    expenses.forEach((e) => {
      const mo = e.frequency === "annual" ? e.amount / 12 : e.amount;
      m[e.category || "Other"] = (m[e.category || "Other"] || 0) + mo;
    });
    return Object.entries(m).map(([name, value]) => ({ name, value: Math.round(value) }));
  }, [expenses]);
  const palette = [C.green, C.optimistic, C.clay, C.conservative, "#8AA39B", "#D9A66C"];
  if (!byCat.length) return null;
  return (
    <Card>
      <h2 style={{ fontWeight: 600, fontSize: 15 }}>{t("whereGoes")}</h2>
      <div className="mt-2 flex flex-wrap items-center gap-6">
        <div style={{ width: 180, height: 180 }}>
          <ResponsiveContainer>
            <PieChart>
              <Pie data={byCat} dataKey="value" nameKey="name" innerRadius={48} outerRadius={80} paddingAngle={2}>
                {byCat.map((_, i) => <Cell key={i} fill={palette[i % palette.length]} />)}
              </Pie>
              <Tooltip formatter={(v) => fmt.format(v)} contentStyle={{ borderRadius: 10, border: `1px solid ${C.line}`, fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex flex-col gap-1.5">
          {byCat.sort((a, b) => b.value - a.value).map((c, i) => (
            <div key={c.name} className="flex items-center gap-2" style={{ fontSize: 13 }}>
              <span style={{ width: 10, height: 10, borderRadius: 3, background: palette[i % palette.length] }} />
              <span style={{ width: 110, color: C.sub }}>{c.name}</span>
              <span style={{ fontWeight: 600, ...num }}>{fmt.format(c.value)}<span style={{ color: C.faint, fontWeight: 400 }}>{t("perMo")}</span></span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

/* ================================================================== *
 * Emergency fund
 * ================================================================== */
function EmergencyCard({ emergency, setEmergency, fmt }) {
  const pct = emergency.target ? Math.min(100, Math.round((emergency.current / emergency.target) * 100)) : 0;
  return (
    <Card>
      <div className="flex items-center gap-2">
        <ShieldCheck size={16} color={C.green} />
        <h2 style={{ fontWeight: 600, fontSize: 15 }}>{t("emTitle")}</h2>
      </div>
      <p style={{ color: C.faint, fontSize: 12, marginTop: 2 }}>{t("emDesc")}</p>
      <div className="mt-3 flex flex-wrap items-end gap-5">
        <Field label={t("emCurrent")}>
          <input type="number" value={emergency.current} onChange={(e) => setEmergency({ current: +e.target.value || 0 })}
            style={fieldStyle} />
        </Field>
        <Field label={t("emTarget")}>
          <input type="number" value={emergency.target} onChange={(e) => setEmergency({ target: +e.target.value || 0 })}
            style={fieldStyle} />
        </Field>
        <div style={{ flex: 1, minWidth: 180 }}>
          <div style={{ fontSize: 12, color: C.sub, marginBottom: 4 }}>{t("emFunded", { pct, a: fmt.format(emergency.current), b: fmt.format(emergency.target) })}</div>
          <div style={{ height: 8, background: C.line, borderRadius: 99 }}>
            <div style={{ width: `${pct}%`, height: "100%", background: C.green, borderRadius: 99 }} />
          </div>
        </div>
      </div>
    </Card>
  );
}

/* ================================================================== *
 * Settings
 * ================================================================== */
function SettingsPanel({ state, setSettings, setState }) {
  const s = state.settings;
  const addMember = () => setState((st) => ({ ...st, members: [...st.members, { id: uid(), name: t("new_person") }] }));
  const updMember = (id, name) => setState((st) => ({ ...st, members: st.members.map((m) => m.id === id ? { ...m, name } : m) }));
  const delMember = (id) => setState((st) => ({ ...st, members: st.members.filter((m) => m.id !== id) }));

  return (
    <div className="flex flex-col gap-5">
      <Card>
        <h2 style={{ fontWeight: 600, fontSize: 15 }}>{t("setAssumptions")}</h2>
        <div className="mt-4 grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(190px,1fr))" }}>
          <Field label={t("setLanguage")}>
            <select value={s.lang || "en"} onChange={(e) => setSettings({ lang: e.target.value })} style={fieldStyle}>
              {LANGS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </Field>
          <Field label={t("setCurrency")}>
            <select value={s.currency} onChange={(e) => setSettings({ currency: e.target.value })} style={fieldStyle}>
              {CURRENCIES.map((c) => <option key={c} value={c}>{c} — {currencyName(c)}</option>)}
            </select>
          </Field>
          <Field label={t("setStarting")}>
            <input type="number" value={s.startingSavings} onChange={(e) => setSettings({ startingSavings: +e.target.value || 0 })} style={fieldStyle} />
          </Field>
          <Field label={t("setYears")}>
            <input type="number" value={s.projectionYears} onChange={(e) => setSettings({ projectionYears: Math.max(1, +e.target.value || 1) })} style={fieldStyle} />
          </Field>
          <Field label={t("setCons")}>
            <input type="number" value={s.returnConservative} onChange={(e) => setSettings({ returnConservative: +e.target.value || 0 })} style={fieldStyle} />
          </Field>
          <Field label={t("setExp")}>
            <input type="number" value={s.returnExpected} onChange={(e) => setSettings({ returnExpected: +e.target.value || 0 })} style={fieldStyle} />
          </Field>
          <Field label={t("setOpt")}>
            <input type="number" value={s.returnOptimistic} onChange={(e) => setSettings({ returnOptimistic: +e.target.value || 0 })} style={fieldStyle} />
          </Field>
          <Field label={t("setInfl")}>
            <input type="number" value={s.inflationRate} onChange={(e) => setSettings({ inflationRate: +e.target.value || 0 })} style={fieldStyle} />
          </Field>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <Toggle on={s.inflationAdjust} onChange={(v) => setSettings({ inflationAdjust: v })} />
          <span style={{ fontSize: 13 }}>{t("setInflToggle")}</span>
        </div>
      </Card>

      <Card>
        <h2 style={{ fontWeight: 600, fontSize: 15 }}>{t("setRetireTitle")}</h2>
        <p style={{ color: C.faint, fontSize: 12, marginTop: 2 }}>{t("setRetireDesc")}</p>
        <div className="mt-4 grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(190px,1fr))" }}>
          <Field label={t("setManualTarget")}>
            <input type="number" value={s.retirementTarget ?? ""} placeholder={t("auto")}
              onChange={(e) => setSettings({ retirementTarget: e.target.value === "" ? null : +e.target.value })} style={fieldStyle} />
          </Field>
          <Field label={t("setAutoMultiple")}>
            <input type="number" value={s.retireMultiple} onChange={(e) => setSettings({ retireMultiple: +e.target.value || 25 })} style={fieldStyle} />
          </Field>
        </div>
      </Card>

      <Card>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users size={16} color={C.green} />
            <h2 style={{ fontWeight: 600, fontSize: 15 }}>{t("household")}</h2>
          </div>
          <button onClick={addMember} className="flex items-center gap-1 rounded-md px-2.5 py-1.5 text-sm" style={{ background: C.green, color: "#fff" }}>
            <Plus size={15} /> {t("addPerson")}
          </button>
        </div>
        <p style={{ color: C.faint, fontSize: 12, marginTop: 2 }}>
          {t("householdDesc")}
        </p>
        <div className="mt-3 flex flex-col gap-2">
          {state.members.map((m) => (
            <div key={m.id} className="flex items-center gap-2">
              <input value={m.name} onChange={(e) => updMember(m.id, e.target.value)} style={{ ...fieldStyle, width: 200 }} />
              {state.members.length > 1 && (
                <button onClick={() => delMember(m.id)} style={{ color: C.faint }}><Trash2 size={15} /></button>
              )}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

/* ================================================================== *
 * Export sheet — works on mobile where downloads/print are blocked
 * ================================================================== */
function ExportSheet({ sheet, onClose }) {
  const [copied, setCopied] = useState(false);
  if (!sheet) return null;

  const canShare = typeof navigator !== "undefined" && !!navigator.share;
  const isReport = sheet.kind === "report";

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(sheet.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      alert(t("blockedNote"));
    }
  };

  const share = async () => {
    try {
      const file = new File([sheet.content], sheet.filename, { type: sheet.mime });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: sheet.title });
        return;
      }
      if (navigator.share) {
        await navigator.share({ title: sheet.title, text: sheet.content });
        return;
      }
      throw new Error("unsupported");
    } catch (e) {
      if (e && e.name === "AbortError") return; // user dismissed
      alert(t("blockedNote"));
    }
  };

  const download = () => {
    const ok = downloadFile(sheet.content, sheet.filename, sheet.mime);
    if (!ok) alert(t("blockedNote"));
  };

  const printReport = () => {
    const w = window.open("", "_blank");
    if (w && w.document) {
      w.document.open();
      w.document.write(sheet.content);
      w.document.close();
      const p = () => { try { w.focus(); w.print(); } catch {} };
      w.onload = p;
      setTimeout(p, 700);
    } else {
      alert(t("blockedNote"));
    }
  };

  const btn = (label, onClick, primary) => (
    <button onClick={onClick}
      className="flex-1 rounded-xl px-3 py-2.5 text-sm"
      style={{
        fontWeight: 600,
        background: primary ? C.green : C.card,
        color: primary ? "#fff" : C.ink,
        border: `1px solid ${primary ? C.green : C.line}`,
      }}>
      {label}
    </button>
  );

  return (
    <div onClick={onClose}
      style={{ position: "fixed", inset: 0, background: "rgba(35,50,60,0.35)", zIndex: 50, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
      <div onClick={(e) => e.stopPropagation()}
        style={{ background: C.card, width: "100%", maxWidth: 520, borderRadius: "20px 20px 0 0", padding: 20, boxShadow: "0 -10px 40px rgba(40,90,90,0.18)", maxHeight: "85vh", overflowY: "auto" }}>
        <div style={{ width: 38, height: 4, borderRadius: 99, background: C.line, margin: "0 auto 14px" }} />
        <h2 style={{ fontWeight: 700, fontSize: 17 }}>{sheet.title}</h2>
        <p style={{ color: C.sub, fontSize: 13, marginTop: 4, lineHeight: 1.5 }}>{sheet.desc}</p>

        <div className="mt-4 flex gap-2">
          {btn(copied ? t("copied") : t("copy"), copy, true)}
          {canShare && btn(t("share"), share)}
          {isReport ? btn(t("print"), printReport) : btn(t("download"), download)}
        </div>
        {isReport && <div className="mt-2">{btn(t("downloadHtml"), download)}</div>}

        {/* in-app preview / raw data */}
        {isReport ? (
          <>
            <div style={{ fontSize: 11, color: C.faint, margin: "14px 0 6px" }}>{t("previewNote")}</div>
            <iframe title="report" srcDoc={sheet.content}
              style={{ width: "100%", height: 280, border: `1px solid ${C.line}`, borderRadius: 12, background: "#fff" }} />
          </>
        ) : (
          <textarea readOnly value={sheet.content} onFocus={(e) => e.target.select()}
            style={{ marginTop: 14, width: "100%", height: 150, fontSize: 11, fontFamily: "ui-monospace, Menlo, monospace", border: `1px solid ${C.line}`, borderRadius: 12, padding: 10, color: C.sub, background: C.bg, resize: "none" }} />
        )}

        <div style={{ fontSize: 11, color: C.faint, marginTop: 10, lineHeight: 1.5 }}>
          {t("blockedNote")}
        </div>

        <button onClick={onClose}
          className="mt-3 w-full rounded-xl px-3 py-2.5 text-sm"
          style={{ color: C.sub, background: "transparent", fontWeight: 500 }}>
          {t("close")}
        </button>
      </div>
    </div>
  );
}

/* ================================================================== *
 * Small UI primitives
 * ================================================================== */
const fieldStyle = { border: `1px solid ${C.line}`, borderRadius: 11, padding: "8px 11px", fontSize: 13, width: "100%", background: C.card, ...num };

function Card({ children }) {
  return <section style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 18, padding: 18, boxShadow: shadow }}>{children}</section>;
}
function Field({ label, children }) {
  return (
    <label className="flex flex-col gap-1.5" style={{ minWidth: 120 }}>
      <span style={{ fontSize: 11, color: C.faint, fontWeight: 500 }}>{label}</span>
      {children}
    </label>
  );
}
function Stat({ label, value, sub, tone }) {
  return (
    <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 18, padding: 16, boxShadow: shadowSoft }}>
      <div style={{ fontSize: 12, color: C.faint }}>{label}</div>
      <div style={{ fontWeight: 700, fontSize: 22, color: tone || C.ink, marginTop: 4, letterSpacing: "-0.02em", ...num }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: C.faint, marginTop: 3 }}>{sub}</div>}
    </div>
  );
}
function Segmented({ options, value, onChange }) {
  return (
    <div style={{ display: "inline-flex", background: C.greenSoft, borderRadius: 10, padding: 3 }}>
      {options.map(([v, l]) => (
        <button key={v} onClick={() => onChange(v)}
          style={{ padding: "5px 12px", fontSize: 12.5, borderRadius: 8, fontWeight: value === v ? 600 : 500,
            background: value === v ? C.card : "transparent", color: value === v ? C.ink : C.sub,
            boxShadow: value === v ? "0 1px 3px rgba(40,90,90,0.12)" : "none" }}>
          {l}
        </button>
      ))}
    </div>
  );
}
function ViewSwitcher({ members, view, setView }) {
  return (
    <select value={view} onChange={(e) => setView(e.target.value)}
      style={{ border: `1px solid ${C.line}`, borderRadius: 8, padding: "6px 9px", fontSize: 13, background: C.card, color: C.ink }}>
      <option value="all">{t("everyone")}</option>
      {members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
    </select>
  );
}
function Toggle({ on, onChange }) {
  return (
    <button onClick={() => onChange(!on)}
      style={{ width: 40, height: 23, borderRadius: 99, background: on ? C.green : C.line, position: "relative", transition: "background .15s" }}>
      <span style={{ position: "absolute", top: 2, left: on ? 19 : 2, width: 19, height: 19, borderRadius: 99, background: "#fff", transition: "left .15s", boxShadow: "0 1px 2px rgba(0,0,0,0.2)" }} />
    </button>
  );
}
function Slider({ label, value, min, max, step, onChange, fmt }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span style={{ fontSize: 12, color: C.sub }}>{label}</span>
        <span style={{ fontSize: 12, fontWeight: 600, ...num }}>{fmt(value)}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(+e.target.value)} style={{ accentColor: C.green, width: "100%" }} />
    </div>
  );
}

/* helpers */
function abbr(v) {
  const a = Math.abs(v);
  if (a >= 1e6) return (v / 1e6).toFixed(1).replace(/\.0$/, "") + "m";
  if (a >= 1e3) return (v / 1e3).toFixed(0) + "k";
  return "" + v;
}
function labelFor(n) {
  return { expected: "Expected", conservative: "Conservative", optimistic: "Optimistic", netWorth: "Net worth", whatif: "What-if" }[n] || n;
}
