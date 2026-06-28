import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceLine, ReferenceDot, ResponsiveContainer, PieChart, Pie, Cell,
  ComposedChart, Line,
} from "recharts";
import {
  Wallet, TrendingDown, Target, Landmark, Settings as Cog,
  LayoutDashboard, Plus, Trash2, Download, Upload, ShieldCheck,
  PiggyBank, GitCompare, Check, FileText, LogOut, ChevronDown, RotateCcw,
  MoreHorizontal, X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Shared snappy, iOS-like easing/timing for all UI motion.
const EASE = [0.32, 0.72, 0, 1];
const SNAP = { duration: 0.22, ease: EASE };
const SNAP_FAST = { duration: 0.16, ease: EASE };

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
    export: "Export", import: "Import",
    tab_dashboard: "Overview", tab_income: "Income", tab_expenses: "Expenses",
    tab_oneOffs: "Upcoming", tab_goals: "Goals", tab_balance: "Assets & debts", tab_settings: "Settings",
    footer: "Projections are estimates, not financial advice.",

    stat_surplus: "Monthly surplus", stat_retireNum: "Retirement number",
    stat_income: "Monthly income", stat_expense: "Monthly expenses", stat_savingsNow: "Savings now",
    ov_now: "Right now", ov_retire: "Retirement outlook", ov_balance: "Balance sheet",
    stat_assets: "Total assets", stat_debts: "Total debts", stat_emergency: "Emergency fund",
    goalPaceAll: "Plans on track", goalPaceHint: "Each dot marks a plan's target amount — if your green bar is above the dot on that date, you have enough saved for it.",
    stat_retireOn: "On track to retire", stat_balanceIn: "Balance in {n} yrs",
    inout: "{in} in · {out} out", setManually: "set manually", xAnnual: "{n}× annual expenses",
    inYrs: "in {n} yrs", beyond: "beyond horizon — adjust inputs",
    todayDollars: "today's dollars", futureDollars: "future dollars",

    projSavings: "Projected savings", projNetWorth: "Projected net worth",
    savings: "Savings", netWorth: "Net worth", yearly: "Yearly", monthly: "Monthly",
    tooltip_remaining: "Remaining",
    scale_log: "Log", scale_linear: "Linear",
    descMonthly: "Month-by-month balance for the chosen year",
    descYearly: "One bar per year · solid green once you pass your retirement number",
    yearN: "Year {n}", projected: "Projected", whatif: "What-if", retirement: "Retirement",
    yrShort: "{n} yr", monthYear: "{m}, year {n}",

    whatifTitle: "What-if scenario",
    whatifDesc: "Compare a change against your baseline without editing anything. The dashed clay line is the what-if.",
    wiIncome: "Monthly income change", wiExpense: "Monthly expense change",
    wiReturn: "Expected return", wiOneOff: "One-off cost", wiReset: "Reset",

    add: "Add", empty: "Nothing here yet — add your first entry.", delete: "Delete", done: "Done",
    title_income: "Income", sub_income: "Recurring and one-off income.",
    title_expenses: "Expenses", sub_expenses: "Your recurring outgoings. These set your monthly surplus.",
    title_oneOffs: "Upcoming expenses", sub_oneOffs: "Dated one-off costs — travel, gifts, a car. Each one dips your curve on its month.",
    title_goals: "Savings goals", sub_goals: "Named targets, stacked on the chart as cumulative dots in date order.",
    col_saved: "Saved",
    nGoals: "{n} goals",
    goalsRankTitle: "Goal tracker", goalsRankSub: "Sorted by date — the goal due soonest is on top.",
    goalAutoHint: "Your savings now ({a}) applied to the soonest-due goal first.",
    g_focus: "Focus next", g_done: "Reached", g_overdue: "Overdue", g_need: "Save {a}/mo", g_needNoDate: "Add a date to track pace",
    plan_on_track: "On track", plan_needs_attn: "Needs attention",
    tab_plans: "Plans", title_plans: "Plans", sub_plans: "Things you're saving toward or spending on — each one appears on your projection.",
    new_plan: "New plan", plan_type: "Type", plan_type_save: "Save toward", plan_type_spend: "One-off spend", col_plan: "Plan",
    title_assets: "Assets", sub_assets: "What you own — super, investments, property. Feeds the net-worth view.",
    title_debts: "Debts", sub_debts: "Loans amortise over the projection. Payments reduce your monthly surplus until they're cleared.",

    col_source: "Source", col_amount: "Amount", col_howOften: "How often", col_dateOneoff: "Date (one-off)",
    col_item: "Item", col_category: "Category", col_what: "What", col_cost: "Cost",
    col_when: "When", col_goal: "Goal", col_target: "Target", col_byWhen: "By when", col_asset: "Asset",
    col_value: "Value", col_debt: "Debt", col_balance: "Balance", col_rate: "Rate %", col_monthlyPay: "Monthly pay",
    freq_monthly: "Monthly", freq_fortnightly: "Fortnightly", freq_annual: "Annual", freq_quarterly: "Quarterly", freq_weekly: "Weekly", freq_daily: "Daily", freq_oneoff: "One-off",
    new_income: "New income", new_expense: "New expense", new_goal: "New goal",
    new_asset: "New asset", new_debt: "New debt",

    presetTitle: "Suggestions", presetHint: "Not sure what to record? Tap to add a common item, then fill in the amount.",
    welcome_title: "Welcome to Seedplanner", welcome_body: "Add your income and expenses to see your savings projection and when you could retire. Start from scratch, or explore with sample data first.",
    welcome_start: "Add my income", loadSample: "Try with sample data",
    welcome_savings_q: "How much do you have saved right now?",
    welcome_savings_hint: "This sets your starting point on the chart. You can update it anytime in Settings.",
    welcome_savings_skip: "Skip for now", welcome_savings_next: "Continue",
    nudge_savings_title: "Update your starting savings?",
    nudge_savings_body: "Your savings balance was last set {n} days ago. Tap to update it so your projection stays accurate.",
    nudge_savings_update: "Update now", nudge_savings_dismiss: "Dismiss",
    data_title: "Data", data_desc: "Load an example to explore, or wipe everything and start fresh.", clearData: "Clear all data",
    clearConfirm: "Clear all your data? This can't be undone.",
    cat_housing: "Housing", cat_food: "Food", cat_transport: "Transport",
    cat_debt: "Debt & loans", cat_health: "Health", cat_lifestyle: "Lifestyle", cat_utilities: "Bills & utilities", cat_other: "Other",
    addCategory: "+ Add category…", newCategory: "New category",
    ig_work: "Employment", ig_invest: "Investments", ig_other: "Other income", presetBlank: "Blank entry",
    p_salary: "Salary", p_freelance: "Freelance / side hustle", p_business: "Business income",
    p_rental: "Rental income", p_dividends: "Dividends", p_interest: "Interest", p_benefit: "Government benefit",
    p_pension: "Pension", p_bonus: "Bonus", p_childsupport: "Child support",
    p_rent: "Rent", p_mortgage: "Mortgage", p_utilities: "Electricity & gas", p_water: "Water",
    p_internet: "Internet", p_phone: "Phone", p_homeins: "Home insurance",
    p_groceries: "Groceries", p_dining: "Dining out",
    p_fuel: "Fuel", p_transit: "Public transport", p_carins: "Car insurance", p_rego: "Car registration",
    p_creditcard: "Credit card payment", p_personalloan: "Personal loan", p_studentloan: "Student loan",
    p_carloan: "Car loan", p_homeloan: "Home loan / mortgage", p_bnpl: "Buy now, pay later",
    p_healthins: "Health insurance", p_gym: "Gym & fitness", p_subs: "Subscriptions", p_childcare: "Childcare",
    p_savings: "Savings / investing", p_insurance: "Life insurance",
    p_gifts: "Gifts & shopping", p_strata: "Strata fees",

    whereGoes: "Where it goes", perMo: "/mo",
    totalSpend: "Total spending", perDay: "/day", perWk: "/wk", perYr: "/yr", perFn: "/fortnight", perOnce: "one-off",
    unit_day: "Day", unit_week: "Week", unit_month: "Month", unit_year: "Year",
    incomeSources: "Where it comes from", totalIncome: "Total income",
    emTitle: "Emergency fund", emDesc: "A safety net to cover essential living costs if your income stops. Kept separate from your savings goals.",
    emCurrent: "Current", emTarget: "Target", emFunded: "{pct}% funded · {a} of {b}",
    emRule: "Most financial advisors recommend 3–6 months of essential expenses. 3 months is the minimum; 6 months is safer if you're self-employed or on a single income.",
    emSuggest: "Based on your expenses:", em3mo: "3 months", em6mo: "6 months", emSetTo: "Set target to",

    setAssumptions: "Projection assumptions", setCurrency: "Currency", setStarting: "Starting savings",
    setYears: "Project forward (years)", setCons: "Conservative return %", setExp: "Expected return %",
    setOpt: "Optimistic return %", setInfl: "Inflation %", setInflToggle: "Show figures in today's dollars (inflation-adjusted)",
    setRetireTitle: "Retirement target", setRetireDesc: "Leave blank to auto-calculate from your spending (the 4% rule = 25× annual expenses).",
    setManualTarget: "Manual target (optional)", auto: "auto", setAutoMultiple: "Auto multiple (× annual expenses)",
    setLanguage: "Language",

    exData_title: "Export your data", exData_desc: "Your full backup. Copy or share it to save, then use Import to restore it later.",
    exRep_title: "Export report", exRep_desc: "A printable snapshot. On a computer, tap Print to save as PDF. On a phone, use Share to send it to Files, Notes, or print.",
    exLender_title: "Lender report", exLender_desc: "A summary of your income, expenses, debts, assets and monthly surplus — formatted for sharing with a mortgage broker or lender. Print or save as PDF.",
    exLender_btn: "Lender report",
    lr_title: "Personal Finance Summary", lr_subtitle: "Prepared for loan assessment purposes",
    lr_disclaimer: "This document is self-reported by the applicant and has not been independently verified. It is intended as a supporting summary only and does not constitute formal financial advice or a verified income statement.",
    lr_generated: "Generated", lr_currency: "Currency",
    lr_section_income: "Income", lr_section_expenses: "Regular Expenses",
    lr_section_debts: "Existing Liabilities", lr_section_assets: "Assets",
    lr_section_summary: "Monthly Cash Flow Summary",
    lr_total_income: "Total monthly income", lr_total_expenses: "Total monthly expenses",
    lr_total_debt_pay: "Total monthly debt repayments", lr_surplus: "Monthly surplus (disposable income)",
    lr_total_assets: "Total assets", lr_total_debts: "Total liabilities (outstanding balances)",
    lr_net_worth: "Net worth (assets minus liabilities)",
    lr_savings: "Current savings",
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
    signOutConfirm: "Sign out now? You'll need to sign in again to get back in.",
    cancel: "Cancel",
    more: "More",
    nav_home: "Home", nav_privacy: "Privacy Policy", nav_terms: "Terms of Service",

    rep_title: "Seedplanner — financial projection", rep_generated: "generated", rep_byYear: "Projection by year",
    rep_now: "Now", rep_year: "Year", rep_emergency: "Emergency fund",
    rep_foot: "Projections are estimates based on your inputs and assumed returns — not financial advice.",
  },
  th: {
    export: "ส่งออก", import: "นำเข้า",
    tab_dashboard: "ภาพรวม", tab_income: "รายได้", tab_expenses: "รายจ่าย",
    tab_oneOffs: "ที่จะถึง", tab_goals: "เป้าหมาย", tab_balance: "สินทรัพย์และหนี้สิน", tab_settings: "ตั้งค่า",
    footer: "การคาดการณ์เป็นเพียงการประมาณ ไม่ใช่คำแนะนำทางการเงิน",

    stat_surplus: "เงินเหลือต่อเดือน", stat_retireNum: "เงินเกษียณที่ต้องมี",
    stat_income: "รายได้ต่อเดือน", stat_expense: "รายจ่ายต่อเดือน", stat_savingsNow: "เงินออมตอนนี้",
    ov_now: "ตอนนี้", ov_retire: "แนวโน้มการเกษียณ", ov_balance: "งบดุล",
    stat_assets: "สินทรัพย์รวม", stat_debts: "หนี้สินรวม", stat_emergency: "เงินสำรองฉุกเฉิน",
    goalPaceAll: "แผนตามเป้า", goalPaceHint: "เส้นแสดงค่าใช้จ่ายสะสมของแผนทั้งหมดถึงแต่ละวันที่ — จุดหมายถึงยอดรวมของแต่ละแผน ถ้าแท่งกราฟสีเขียวอยู่เหนือเส้น แสดงว่าคุณมีเงินเพียงพอ",
    stat_retireOn: "คาดว่าจะเกษียณ", stat_balanceIn: "ยอดเงินใน {n} ปี",
    inout: "{in} เข้า · {out} ออก", setManually: "ตั้งเอง", xAnnual: "{n}× ค่าใช้จ่ายต่อปี",
    inYrs: "อีก {n} ปี", beyond: "เกินช่วงที่คำนวณ — ปรับข้อมูล",
    todayDollars: "มูลค่าปัจจุบัน", futureDollars: "มูลค่าอนาคต",

    projSavings: "เงินออมที่คาดการณ์", projNetWorth: "มูลค่าสุทธิที่คาดการณ์",
    savings: "เงินออม", netWorth: "มูลค่าสุทธิ", yearly: "รายปี", monthly: "รายเดือน",
    tooltip_remaining: "คงเหลือ",
    scale_log: "ลอการิทึม", scale_linear: "เชิงเส้น",
    descMonthly: "ยอดเงินรายเดือนของปีที่เลือก",
    descYearly: "หนึ่งแท่งต่อปี · เป็นสีเขียวเข้มเมื่อถึงเงินเกษียณ",
    yearN: "ปีที่ {n}", projected: "คาดการณ์", whatif: "สมมติ", retirement: "เกษียณ",
    yrShort: "{n} ปี", monthYear: "{m} ปีที่ {n}",

    whatifTitle: "สถานการณ์สมมติ",
    whatifDesc: "เปรียบเทียบการเปลี่ยนแปลงกับค่าพื้นฐานโดยไม่ต้องแก้ข้อมูลจริง เส้นประสีส้มคือสถานการณ์สมมติ",
    wiIncome: "รายได้ต่อเดือนเปลี่ยน", wiExpense: "รายจ่ายต่อเดือนเปลี่ยน",
    wiReset: "รีเซ็ต",
    wiReturn: "ผลตอบแทนคาดหวัง", wiOneOff: "ค่าใช้จ่ายครั้งเดียว",

    add: "เพิ่ม", empty: "ยังไม่มีรายการ — เพิ่มรายการแรกของคุณ", delete: "ลบ", done: "เสร็จ",
    title_income: "รายได้", sub_income: "รายได้ทั้งแบบประจำและครั้งเดียว",
    title_expenses: "รายจ่าย", sub_expenses: "รายจ่ายประจำของคุณ ใช้คำนวณเงินเหลือต่อเดือน",
    title_oneOffs: "ค่าใช้จ่ายที่จะถึง", sub_oneOffs: "ค่าใช้จ่ายครั้งเดียวที่มีกำหนด — ท่องเที่ยว ของขวัญ รถ แต่ละรายการจะทำให้กราฟลดในเดือนนั้น",
    title_goals: "เป้าหมายการออม", sub_goals: "เป้าหมายที่ตั้งชื่อ แสดงบนกราฟเป็นจุดสะสมเรียงตามวันที่",
    col_saved: "ออมแล้ว",
    nGoals: "{n} เป้าหมาย",
    goalsRankTitle: "ตัวติดตามเป้าหมาย", goalsRankSub: "เรียงตามวันที่ — เป้าหมายที่ถึงกำหนดก่อนจะอยู่บนสุด",
    goalAutoHint: "เงินออมตอนนี้ ({a}) นำไปใส่เป้าหมายที่ถึงกำหนดก่อน",
    g_focus: "โฟกัสต่อไป", g_done: "สำเร็จแล้ว", g_overdue: "เลยกำหนด", g_need: "ออม {a}/เดือน", g_needNoDate: "เพิ่มวันที่เพื่อติดตามจังหวะ",
    plan_on_track: "อยู่ในเส้นทาง", plan_needs_attn: "ต้องใส่ใจ",
    tab_plans: "แผน", title_plans: "แผน", sub_plans: "สิ่งที่คุณกำลังออมหรือจะใช้จ่าย — แต่ละรายการจะแสดงในการคาดการณ์",
    new_plan: "แผนใหม่", plan_type: "ประเภท", plan_type_save: "ออมเพื่อ", plan_type_spend: "ใช้จ่ายครั้งเดียว", col_plan: "แผน",
    title_assets: "สินทรัพย์", sub_assets: "สิ่งที่คุณมี — กองทุนเลี้ยงชีพ การลงทุน อสังหาฯ ใช้ในมุมมองมูลค่าสุทธิ",
    title_debts: "หนี้สิน", sub_debts: "เงินกู้จะถูกผ่อนตามช่วงเวลา การผ่อนจะลดเงินเหลือต่อเดือนจนกว่าจะหมด",

    col_source: "แหล่งที่มา", col_amount: "จำนวนเงิน", col_howOften: "ความถี่", col_dateOneoff: "วันที่ (ครั้งเดียว)",
    col_item: "รายการ", col_category: "หมวดหมู่", col_what: "รายการ", col_cost: "จำนวนเงิน",
    col_when: "เมื่อไร", col_goal: "เป้าหมาย", col_target: "ยอดเป้าหมาย", col_byWhen: "ภายในเมื่อ", col_asset: "สินทรัพย์",
    col_value: "มูลค่า", col_debt: "หนี้", col_balance: "ยอดคงเหลือ", col_rate: "ดอกเบี้ย %", col_monthlyPay: "ผ่อนต่อเดือน",
    freq_monthly: "รายเดือน", freq_fortnightly: "รายสองสัปดาห์", freq_annual: "รายปี", freq_quarterly: "รายไตรมาส", freq_weekly: "รายสัปดาห์", freq_daily: "รายวัน", freq_oneoff: "ครั้งเดียว",
    new_income: "รายได้ใหม่", new_expense: "รายจ่ายใหม่", new_goal: "เป้าหมายใหม่",
    new_asset: "สินทรัพย์ใหม่", new_debt: "หนี้ใหม่",

    presetTitle: "รายการแนะนำ", presetHint: "ไม่รู้จะบันทึกอะไร? แตะเพื่อเพิ่มรายการที่พบบ่อย แล้วกรอกจำนวนเงิน",
    welcome_title: "ยินดีต้อนรับสู่ Seedplanner", welcome_body: "เพิ่มรายได้และรายจ่ายเพื่อดูการคาดการณ์เงินออมและว่าคุณจะเกษียณได้เมื่อไหร่ เริ่มจากศูนย์ หรือลองใช้ข้อมูลตัวอย่างก่อนก็ได้",
    welcome_start: "เพิ่มรายได้ของฉัน", loadSample: "ลองใช้ข้อมูลตัวอย่าง",
    welcome_savings_q: "ตอนนี้คุณมีเงินออมเท่าไหร่?",
    welcome_savings_hint: "นี่คือจุดเริ่มต้นบนกราฟ คุณสามารถอัพเดทได้ตลอดเวลาในการตั้งค่า",
    welcome_savings_skip: "ข้ามตอนนี้", welcome_savings_next: "ต่อไป",
    nudge_savings_title: "อัพเดทเงินออมเริ่มต้นของคุณ?",
    nudge_savings_body: "ยอดเงินออมของคุณถูกตั้งค่าเมื่อ {n} วันที่แล้ว แตะเพื่ออัพเดทเพื่อให้การคาดการณ์แม่นยำ",
    nudge_savings_update: "อัพเดทเดี๋ยวนี้", nudge_savings_dismiss: "ปิด",
    data_title: "ข้อมูล", data_desc: "โหลดตัวอย่างเพื่อลองใช้ หรือล้างทั้งหมดเพื่อเริ่มใหม่", clearData: "ล้างข้อมูลทั้งหมด",
    clearConfirm: "ล้างข้อมูลทั้งหมด? ไม่สามารถย้อนกลับได้",
    cat_housing: "ที่อยู่อาศัย", cat_food: "อาหาร", cat_transport: "การเดินทาง",
    cat_debt: "หนี้และเงินกู้", cat_health: "สุขภาพ", cat_lifestyle: "ไลฟ์สไตล์", cat_utilities: "บิลและสาธารณูปโภค", cat_other: "อื่นๆ",
    addCategory: "+ เพิ่มหมวดหมู่…", newCategory: "หมวดหมู่ใหม่",
    ig_work: "งานประจำ", ig_invest: "การลงทุน", ig_other: "รายได้อื่นๆ", presetBlank: "รายการเปล่า",
    p_salary: "เงินเดือน", p_freelance: "ฟรีแลนซ์ / งานเสริม", p_business: "รายได้จากธุรกิจ",
    p_rental: "รายได้ค่าเช่า", p_dividends: "เงินปันผล", p_interest: "ดอกเบี้ย", p_benefit: "สวัสดิการรัฐ",
    p_pension: "บำนาญ", p_bonus: "โบนัส", p_childsupport: "ค่าเลี้ยงดูบุตร",
    p_rent: "ค่าเช่า", p_mortgage: "ผ่อนบ้าน", p_utilities: "ค่าไฟ-แก๊ส", p_water: "ค่าน้ำ",
    p_internet: "อินเทอร์เน็ต", p_phone: "ค่าโทรศัพท์", p_homeins: "ประกันบ้าน",
    p_groceries: "ของใช้-ของกิน", p_dining: "ทานข้าวนอกบ้าน",
    p_fuel: "ค่าน้ำมัน", p_transit: "ขนส่งสาธารณะ", p_carins: "ประกันรถ", p_rego: "ทะเบียนรถ",
    p_creditcard: "จ่ายบัตรเครดิต", p_personalloan: "สินเชื่อส่วนบุคคล", p_studentloan: "เงินกู้การศึกษา",
    p_carloan: "ผ่อนรถ", p_homeloan: "สินเชื่อบ้าน", p_bnpl: "ซื้อก่อนจ่ายทีหลัง",
    p_healthins: "ประกันสุขภาพ", p_gym: "ฟิตเนส", p_subs: "ค่าสมาชิกรายเดือน", p_childcare: "ค่าเลี้ยงเด็ก",
    p_savings: "ออม / ลงทุน", p_insurance: "ประกันชีวิต",
    p_gifts: "ของขวัญและช้อปปิ้ง", p_strata: "ค่าส่วนกลาง",

    whereGoes: "เงินไปไหนบ้าง", perMo: "/เดือน",
    totalSpend: "รายจ่ายรวม", perDay: "/วัน", perWk: "/สัปดาห์", perYr: "/ปี", perFn: "/สองสัปดาห์", perOnce: "ครั้งเดียว",
    unit_day: "วัน", unit_week: "สัปดาห์", unit_month: "เดือน", unit_year: "ปี",
    incomeSources: "รายได้มาจากไหน", totalIncome: "รายได้รวม",
    emTitle: "เงินสำรองฉุกเฉิน", emDesc: "ตาข่ายความปลอดภัยสำหรับค่าใช้จ่ายจำเป็นหากรายได้หยุดชะงัก แยกจากเป้าหมายการออม",
    emCurrent: "ปัจจุบัน", emTarget: "เป้าหมาย", emFunded: "{pct}% แล้ว · {a} จาก {b}",
    emRule: "ที่ปรึกษาการเงินส่วนใหญ่แนะนำ 3–6 เดือนของค่าใช้จ่ายจำเป็น 3 เดือนเป็นขั้นต่ำ 6 เดือนปลอดภัยกว่าหากทำงานฟรีแลนซ์หรือมีรายได้เดียว",
    emSuggest: "จากค่าใช้จ่ายของคุณ:", em3mo: "3 เดือน", em6mo: "6 เดือน", emSetTo: "ตั้งเป้าหมายเป็น",

    setAssumptions: "สมมติฐานการคำนวณ", setCurrency: "สกุลเงิน", setStarting: "เงินออมเริ่มต้น",
    setYears: "คำนวณล่วงหน้า (ปี)", setCons: "ผลตอบแทนต่ำ %", setExp: "ผลตอบแทนคาดหวัง %",
    setOpt: "ผลตอบแทนสูง %", setInfl: "เงินเฟ้อ %", setInflToggle: "แสดงตัวเลขเป็นมูลค่าปัจจุบัน (ปรับเงินเฟ้อ)",
    setRetireTitle: "เป้าหมายเกษียณ", setRetireDesc: "เว้นว่างเพื่อคำนวณอัตโนมัติจากค่าใช้จ่าย (กฎ 4% = 25× ค่าใช้จ่ายต่อปี)",
    setManualTarget: "ตั้งเป้าหมายเอง (ไม่บังคับ)", auto: "อัตโนมัติ", setAutoMultiple: "ตัวคูณอัตโนมัติ (× ค่าใช้จ่ายต่อปี)",
    setLanguage: "ภาษา",

    exData_title: "ส่งออกข้อมูล", exData_desc: "ข้อมูลสำรองทั้งหมด คัดลอกหรือแชร์เพื่อบันทึก แล้วใช้นำเข้าเพื่อกู้คืนภายหลัง",
    exRep_title: "ส่งออกรายงาน", exRep_desc: "ภาพรวมสำหรับพิมพ์ บนคอมพิวเตอร์กดพิมพ์เพื่อบันทึกเป็น PDF บนมือถือใช้แชร์เพื่อส่งไปยังไฟล์ บันทึก หรือพิมพ์",
    exLender_title: "รายงานสำหรับผู้ให้กู้", exLender_desc: "สรุปรายได้ รายจ่าย หนี้สิน สินทรัพย์ และเงินเหลือต่อเดือน — สำหรับแชร์กับนายหน้าสินเชื่อหรือผู้ให้กู้", exLender_btn: "รายงานผู้ให้กู้",
    lr_title: "สรุปการเงินส่วนบุคคล", lr_subtitle: "จัดทำเพื่อประกอบการพิจารณาสินเชื่อ",
    lr_disclaimer: "เอกสารนี้จัดทำโดยผู้สมัครด้วยตนเองและยังไม่ได้รับการตรวจสอบอย่างเป็นทางการ ใช้เป็นเอกสารประกอบเท่านั้น",
    lr_generated: "สร้างเมื่อ", lr_currency: "สกุลเงิน",
    lr_section_income: "รายได้", lr_section_expenses: "รายจ่ายประจำ",
    lr_section_debts: "หนี้สินที่มีอยู่", lr_section_assets: "สินทรัพย์",
    lr_section_summary: "สรุปกระแสเงินสดต่อเดือน",
    lr_total_income: "รายได้ต่อเดือนรวม", lr_total_expenses: "รายจ่ายต่อเดือนรวม",
    lr_total_debt_pay: "ผ่อนหนี้ต่อเดือนรวม", lr_surplus: "เงินเหลือต่อเดือน",
    lr_total_assets: "สินทรัพย์รวม", lr_total_debts: "หนี้สินรวม",
    lr_net_worth: "มูลค่าสุทธิ (สินทรัพย์หักหนี้สิน)",
    lr_savings: "เงินออมปัจจุบัน",
    copy: "คัดลอก", copied: "คัดลอกแล้ว ✓", share: "แชร์", print: "พิมพ์", download: "ดาวน์โหลด",
    downloadHtml: "ดาวน์โหลด .html", close: "ปิด",
    previewNote: "ตัวอย่าง — ถ่ายภาพหน้าจอเพื่อบันทึกบนมือถือ",
    blockedNote: "ในตัวอย่างของ Claude ใช้ได้เฉพาะคัดลอก ส่วนแชร์ พิมพ์ และดาวน์โหลดต้องเปิดในเบราว์เซอร์ปกติ — จะใช้งานได้เมื่อนำไปติดตั้งจริง",
    importBad: "ไฟล์นี้ไม่ใช่ข้อมูล Seedplanner ที่ถูกต้อง",

    login_title: "เข้าสู่ระบบ Seedplanner",
    login_subtitle: "วางแผนการออมและดูว่าคุณจะเกษียณได้เมื่อไหร่",
    login_google: "เข้าสู่ระบบด้วย Google",
    login_note: "การเข้าสู่ระบบนี้เป็นเพียงตัวอย่าง — ยังไม่มีการสร้างบัญชีและไม่มีข้อมูลออกจากอุปกรณ์ของคุณ การเข้าสู่ระบบ Google จริงจะมีในเวอร์ชันเต็ม",
    signOut: "ออกจากระบบ",
    signOutConfirm: "ออกจากระบบตอนนี้หรือไม่? คุณจะต้องเข้าสู่ระบบอีกครั้งเพื่อกลับเข้ามา",
    cancel: "ยกเลิก",
    more: "เพิ่มเติม",
    nav_home: "หน้าแรก", nav_privacy: "นโยบายความเป็นส่วนตัว", nav_terms: "ข้อกำหนดการใช้งาน",

    rep_title: "Seedplanner — การคาดการณ์ทางการเงิน", rep_generated: "สร้างเมื่อ", rep_byYear: "การคาดการณ์รายปี",
    rep_now: "ปัจจุบัน", rep_year: "ปีที่", rep_emergency: "เงินสำรองฉุกเฉิน",
    rep_foot: "การคาดการณ์เป็นการประมาณจากข้อมูลและผลตอบแทนที่สมมติ ไม่ใช่คำแนะนำทางการเงิน",
  },
  de: {
    export: "Export", import: "Import",
    tab_dashboard: "Übersicht", tab_income: "Einkommen", tab_expenses: "Ausgaben",
    tab_oneOffs: "Anstehend", tab_goals: "Ziele", tab_balance: "Vermögen & Schulden", tab_settings: "Einstellungen",
    footer: "Prognosen sind Schätzungen, keine Finanzberatung.",

    stat_surplus: "Monatlicher Überschuss", stat_retireNum: "Rentenbetrag",
    stat_income: "Monatliches Einkommen", stat_expense: "Monatliche Ausgaben", stat_savingsNow: "Aktuelle Ersparnisse",
    ov_now: "Aktuell", ov_retire: "Renten-Ausblick", ov_balance: "Bilanz",
    stat_assets: "Vermögen gesamt", stat_debts: "Schulden gesamt", stat_emergency: "Notgroschen",
    goalPaceAll: "Pläne im Plan", goalPaceHint: "Die Linie zeigt die kumulierten Kosten deiner Pläne bis zum jeweiligen Datum — Punkte markieren den Gesamtbetrag jedes Plans. Wenn deine grünen Balken über der Linie liegen, hast du genug gespart.",
    stat_retireOn: "Rente voraussichtlich", stat_balanceIn: "Stand in {n} Jahren",
    inout: "{in} ein · {out} aus", setManually: "manuell gesetzt", xAnnual: "{n}× Jahresausgaben",
    inYrs: "in {n} Jahren", beyond: "außerhalb des Zeitraums – Eingaben anpassen",
    todayDollars: "heutige Kaufkraft", futureDollars: "künftige Beträge",

    projSavings: "Prognostizierte Ersparnisse", projNetWorth: "Prognostiziertes Nettovermögen",
    savings: "Ersparnisse", netWorth: "Nettovermögen", yearly: "Jährlich", monthly: "Monatlich",
    tooltip_remaining: "Verbleibend",
    scale_log: "Log", scale_linear: "Linear",
    descMonthly: "Monatlicher Kontostand für das gewählte Jahr",
    descYearly: "Ein Balken pro Jahr · grün, sobald du deinen Rentenbetrag erreichst",
    yearN: "Jahr {n}", projected: "Prognose", whatif: "Was-wäre-wenn", retirement: "Rente",
    yrShort: "{n} J.", monthYear: "{m}, Jahr {n}",

    whatifTitle: "Was-wäre-wenn-Szenario",
    whatifDesc: "Vergleiche eine Änderung mit deiner Basis, ohne etwas zu bearbeiten. Die gestrichelte Linie ist das Szenario.",
    wiIncome: "Monatl. Einkommen ändern", wiExpense: "Monatl. Ausgaben ändern",
    wiReset: "Zurücksetzen",
    wiReturn: "Erwartete Rendite", wiOneOff: "Einmalige Kosten",

    add: "Hinzufügen", empty: "Noch nichts hier – füge deinen ersten Eintrag hinzu.", delete: "Löschen", done: "Fertig",
    title_income: "Einkommen", sub_income: "Wiederkehrendes und einmaliges Einkommen.",
    title_expenses: "Ausgaben", sub_expenses: "Deine wiederkehrenden Ausgaben. Sie bestimmen deinen monatlichen Überschuss.",
    title_oneOffs: "Anstehende Ausgaben", sub_oneOffs: "Datierte einmalige Kosten – Reisen, Geschenke, ein Auto. Jede senkt deine Kurve in ihrem Monat.",
    title_goals: "Sparziele", sub_goals: "Benannte Ziele, im Diagramm als kumulative Punkte nach Datum dargestellt.",
    col_saved: "Gespart",
    nGoals: "{n} Ziele",
    goalsRankTitle: "Ziel-Tracker", goalsRankSub: "Nach Datum sortiert — das früheste Ziel steht oben.",
    goalAutoHint: "Deine aktuellen Ersparnisse ({a}) zuerst auf das früheste Ziel angewandt.",
    g_focus: "Als Nächstes", g_done: "Erreicht", g_overdue: "Überfällig", g_need: "{a}/Mon. sparen", g_needNoDate: "Datum hinzufügen, um das Tempo zu verfolgen",
    plan_on_track: "Im Plan", plan_needs_attn: "Aufmerksamkeit nötig",
    tab_plans: "Pläne", title_plans: "Pläne", sub_plans: "Dinge, auf die du sparst oder die du ausgeben wirst — jedes erscheint in deiner Prognose.",
    new_plan: "Neuer Plan", plan_type: "Typ", plan_type_save: "Sparziel", plan_type_spend: "Einmalige Ausgabe", col_plan: "Plan",
    title_assets: "Vermögen", sub_assets: "Was du besitzt – Altersvorsorge, Investitionen, Immobilien. Fließt in die Nettovermögensansicht ein.",
    title_debts: "Schulden", sub_debts: "Kredite werden über den Zeitraum getilgt. Zahlungen senken deinen monatlichen Überschuss, bis sie abbezahlt sind.",

    col_source: "Quelle", col_amount: "Betrag", col_howOften: "Häufigkeit", col_dateOneoff: "Datum (einmalig)",
    col_item: "Posten", col_category: "Kategorie", col_what: "Was", col_cost: "Kosten",
    col_when: "Wann", col_goal: "Ziel", col_target: "Zielbetrag", col_byWhen: "Bis wann", col_asset: "Vermögenswert",
    col_value: "Wert", col_debt: "Schuld", col_balance: "Saldo", col_rate: "Zins %", col_monthlyPay: "Monatl. Rate",
    freq_monthly: "Monatlich", freq_fortnightly: "Vierzehntägig", freq_annual: "Jährlich", freq_quarterly: "Vierteljährlich", freq_weekly: "Wöchentlich", freq_daily: "Täglich", freq_oneoff: "Einmalig",
    new_income: "Neues Einkommen", new_expense: "Neue Ausgabe", new_goal: "Neues Ziel",
    new_asset: "Neuer Vermögenswert", new_debt: "Neue Schuld",

    presetTitle: "Vorschläge", presetHint: "Unsicher, was du erfassen sollst? Tippe, um einen üblichen Posten hinzuzufügen, und trage den Betrag ein.",
    welcome_title: "Willkommen bei Seedplanner", welcome_body: "Füge dein Einkommen und deine Ausgaben hinzu, um deine Sparprognose zu sehen und wann du in Rente gehen könntest. Beginne bei null oder erkunde zuerst mit Beispieldaten.",
    welcome_start: "Mein Einkommen hinzufügen", loadSample: "Mit Beispieldaten testen",
    welcome_savings_q: "Wie viel hast du gerade gespart?",
    welcome_savings_hint: "Das ist dein Startpunkt im Diagramm. Du kannst es jederzeit in den Einstellungen ändern.",
    welcome_savings_skip: "Überspringen", welcome_savings_next: "Weiter",
    nudge_savings_title: "Startersparnisse aktualisieren?",
    nudge_savings_body: "Dein Sparguthaben wurde vor {n} Tagen zuletzt festgelegt. Tippe, um es zu aktualisieren.",
    nudge_savings_update: "Jetzt aktualisieren", nudge_savings_dismiss: "Verwerfen",
    data_title: "Daten", data_desc: "Lade ein Beispiel zum Erkunden oder lösche alles und beginne neu.", clearData: "Alle Daten löschen",
    clearConfirm: "Alle deine Daten löschen? Das kann nicht rückgängig gemacht werden.",
    cat_housing: "Wohnen", cat_food: "Essen", cat_transport: "Transport",
    cat_debt: "Schulden & Kredite", cat_health: "Gesundheit", cat_lifestyle: "Lifestyle", cat_utilities: "Rechnungen & Nebenkosten", cat_other: "Sonstiges",
    addCategory: "+ Kategorie hinzufügen…", newCategory: "Neue Kategorie",
    ig_work: "Beschäftigung", ig_invest: "Investitionen", ig_other: "Sonstiges Einkommen", presetBlank: "Leerer Eintrag",
    p_salary: "Gehalt", p_freelance: "Freiberuflich / Nebenjob", p_business: "Geschäftseinkommen",
    p_rental: "Mieteinnahmen", p_dividends: "Dividenden", p_interest: "Zinsen", p_benefit: "Staatliche Leistung",
    p_pension: "Rente", p_bonus: "Bonus", p_childsupport: "Unterhalt",
    p_rent: "Miete", p_mortgage: "Hypothek", p_utilities: "Strom & Gas", p_water: "Wasser",
    p_internet: "Internet", p_phone: "Telefon", p_homeins: "Hausratversicherung",
    p_groceries: "Lebensmittel", p_dining: "Auswärts essen",
    p_fuel: "Kraftstoff", p_transit: "Öffentlicher Verkehr", p_carins: "Kfz-Versicherung", p_rego: "Kfz-Zulassung",
    p_creditcard: "Kreditkartenzahlung", p_personalloan: "Privatkredit", p_studentloan: "Studienkredit",
    p_carloan: "Autokredit", p_homeloan: "Immobilienkredit", p_bnpl: "Jetzt kaufen, später zahlen",
    p_healthins: "Krankenversicherung", p_gym: "Fitnessstudio", p_subs: "Abonnements", p_childcare: "Kinderbetreuung",
    p_savings: "Sparen / Anlegen", p_insurance: "Lebensversicherung",
    p_gifts: "Geschenke & Einkaufen", p_strata: "Hausverwaltungsgebühren",

    whereGoes: "Wohin es geht", perMo: "/Mon.",
    totalSpend: "Gesamtausgaben", perDay: "/Tag", perWk: "/Wo.", perYr: "/Jahr", perFn: "/2 Wo.", perOnce: "einmalig",
    unit_day: "Tag", unit_week: "Woche", unit_month: "Monat", unit_year: "Jahr",
    incomeSources: "Woher es kommt", totalIncome: "Gesamteinkommen",
    emTitle: "Notgroschen", emDesc: "Ein Sicherheitsnetz für wesentliche Lebenshaltungskosten, falls dein Einkommen wegfällt. Getrennt von deinen Sparzielen.",
    emCurrent: "Aktuell", emTarget: "Ziel", emFunded: "{pct}% gedeckt · {a} von {b}",
    emRule: "Die meisten Finanzberater empfehlen 3–6 Monate wesentlicher Ausgaben. 3 Monate sind das Minimum; 6 Monate sind sicherer bei Selbstständigkeit oder Einzeleinkommen.",
    emSuggest: "Basierend auf deinen Ausgaben:", em3mo: "3 Monate", em6mo: "6 Monate", emSetTo: "Ziel setzen auf",

    setAssumptions: "Annahmen der Prognose", setCurrency: "Währung", setStarting: "Anfangsersparnis",
    setYears: "Vorausberechnung (Jahre)", setCons: "Konservative Rendite %", setExp: "Erwartete Rendite %",
    setOpt: "Optimistische Rendite %", setInfl: "Inflation %", setInflToggle: "Beträge in heutiger Kaufkraft anzeigen (inflationsbereinigt)",
    setRetireTitle: "Rentenziel", setRetireDesc: "Leer lassen zur automatischen Berechnung aus deinen Ausgaben (4%-Regel = 25× Jahresausgaben).",
    setManualTarget: "Manuelles Ziel (optional)", auto: "auto", setAutoMultiple: "Auto-Faktor (× Jahresausgaben)",
    setLanguage: "Sprache",

    exData_title: "Daten exportieren", exData_desc: "Deine vollständige Sicherung. Kopiere oder teile sie zum Speichern und stelle sie später über Import wieder her.",
    exRep_title: "Bericht exportieren", exRep_desc: "Eine druckbare Übersicht. Am Computer auf Drucken tippen, um als PDF zu speichern. Am Handy über Teilen an Dateien, Notizen oder Drucken senden.",
    exLender_title: "Kreditgeber-Bericht", exLender_desc: "Zusammenfassung von Einkommen, Ausgaben, Schulden, Vermögen und monatlichem Überschuss — zum Teilen mit einem Kreditgeber.", exLender_btn: "Kreditgeber-Bericht",
    lr_title: "Persönliche Finanzübersicht", lr_subtitle: "Erstellt für Kreditprüfungszwecke",
    lr_disclaimer: "Dieses Dokument wurde vom Antragsteller selbst erstellt und nicht unabhängig geprüft. Es dient nur als unterstützende Zusammenfassung.",
    lr_generated: "Erstellt", lr_currency: "Währung",
    lr_section_income: "Einkommen", lr_section_expenses: "Regelmäßige Ausgaben",
    lr_section_debts: "Bestehende Verbindlichkeiten", lr_section_assets: "Vermögen",
    lr_section_summary: "Monatliche Cashflow-Übersicht",
    lr_total_income: "Gesamtes Monatseinkommen", lr_total_expenses: "Gesamte Monatsausgaben",
    lr_total_debt_pay: "Gesamte monatliche Schuldentilgung", lr_surplus: "Monatlicher Überschuss",
    lr_total_assets: "Gesamtvermögen", lr_total_debts: "Gesamtverbindlichkeiten",
    lr_net_worth: "Nettovermögen (Vermögen minus Schulden)",
    lr_savings: "Aktuelle Ersparnisse",
    copy: "Kopieren", copied: "Kopiert ✓", share: "Teilen", print: "Drucken", download: "Herunterladen",
    downloadHtml: "HTML herunterladen", close: "Schließen",
    previewNote: "Vorschau – mache einen Screenshot, um sie auf dem Handy zu speichern",
    blockedNote: "In der Claude-Vorschau funktioniert nur Kopieren zuverlässig. Teilen, Drucken und Herunterladen benötigen die App in einem normalen Browser – sie funktionieren nach der Veröffentlichung.",
    importBad: "Diese Datei enthält keine gültigen Seedplanner-Daten.",

    login_title: "Bei Seedplanner anmelden",
    login_subtitle: "Plane dein Sparen und sieh, wann du in Rente gehen kannst.",
    login_google: "Mit Google anmelden",
    login_note: "Platzhalter-Anmeldung – es wird kein Konto erstellt und nichts verlässt dein Gerät. Die echte Google-Anmeldung ist in der vollständigen Version eingebaut.",
    signOut: "Abmelden",
    signOutConfirm: "Jetzt abmelden? Du musst dich erneut anmelden, um zurückzukehren.",
    cancel: "Abbrechen",
    more: "Mehr",
    nav_home: "Startseite", nav_privacy: "Datenschutz", nav_terms: "Nutzungsbedingungen",

    rep_title: "Seedplanner – Finanzprognose", rep_generated: "erstellt", rep_byYear: "Prognose nach Jahr",
    rep_now: "Jetzt", rep_year: "Jahr", rep_emergency: "Notgroschen",
    rep_foot: "Prognosen sind Schätzungen basierend auf deinen Eingaben und angenommenen Renditen – keine Finanzberatung.",
  },
  fr: {
    export: "Exporter", import: "Importer",
    tab_dashboard: "Aperçu", tab_income: "Revenus", tab_expenses: "Dépenses",
    tab_oneOffs: "À venir", tab_goals: "Objectifs", tab_balance: "Actifs et dettes", tab_settings: "Réglages",
    footer: "Les projections sont des estimations, pas des conseils financiers.",

    stat_surplus: "Excédent mensuel", stat_retireNum: "Montant retraite",
    stat_income: "Revenu mensuel", stat_expense: "Dépenses mensuelles", stat_savingsNow: "Épargne actuelle",
    ov_now: "En ce moment", ov_retire: "Perspective retraite", ov_balance: "Bilan",
    stat_assets: "Actifs totaux", stat_debts: "Dettes totales", stat_emergency: "Fonds d'urgence",
    goalPaceAll: "Plans en bonne voie", goalPaceHint: "La ligne montre le coût cumulé de vos plans à chaque date — les points marquent le total de chaque plan. Si vos barres vertes sont au-dessus de la ligne, vous avez suffisamment épargné.",
    stat_retireOn: "Retraite prévue", stat_balanceIn: "Solde dans {n} ans",
    inout: "{in} entrée · {out} sortie", setManually: "défini manuellement", xAnnual: "{n}× dépenses annuelles",
    inYrs: "dans {n} ans", beyond: "au-delà de la période – ajustez les données",
    todayDollars: "valeur d'aujourd'hui", futureDollars: "valeur future",

    projSavings: "Épargne projetée", projNetWorth: "Valeur nette projetée",
    savings: "Épargne", netWorth: "Valeur nette", yearly: "Annuel", monthly: "Mensuel",
    tooltip_remaining: "Restant",
    scale_log: "Log", scale_linear: "Linéaire",
    descMonthly: "Solde mois par mois pour l'année choisie",
    descYearly: "Une barre par an · vert dès que vous dépassez votre montant retraite",
    yearN: "Année {n}", projected: "Projeté", whatif: "Hypothèse", retirement: "Retraite",
    yrShort: "{n} an", monthYear: "{m}, année {n}",

    whatifTitle: "Scénario hypothétique",
    whatifDesc: "Comparez un changement à votre base sans rien modifier. La ligne pointillée est l'hypothèse.",
    wiIncome: "Variation revenu mensuel", wiExpense: "Variation dépense mensuelle",
    wiReset: "Réinitialiser",
    wiReturn: "Rendement attendu", wiOneOff: "Coût ponctuel",

    add: "Ajouter", empty: "Rien ici pour l'instant – ajoutez votre première entrée.", delete: "Supprimer", done: "Terminé",
    title_income: "Revenus", sub_income: "Revenus récurrents et ponctuels.",
    title_expenses: "Dépenses", sub_expenses: "Vos dépenses récurrentes. Elles déterminent votre excédent mensuel.",
    title_oneOffs: "Dépenses à venir", sub_oneOffs: "Coûts ponctuels datés – voyages, cadeaux, une voiture. Chacun fait baisser votre courbe le mois venu.",
    title_goals: "Objectifs d'épargne", sub_goals: "Objectifs nommés, affichés sur le graphique en points cumulés par date.",
    col_saved: "Épargné",
    nGoals: "{n} objectifs",
    goalsRankTitle: "Suivi des objectifs", goalsRankSub: "Trié par date — l'objectif le plus proche est en haut.",
    goalAutoHint: "Votre épargne actuelle ({a}) appliquée d'abord à l'objectif le plus proche.",
    g_focus: "Priorité", g_done: "Atteint", g_overdue: "En retard", g_need: "Épargner {a}/mois", g_needNoDate: "Ajoutez une date pour suivre le rythme",
    plan_on_track: "En bonne voie", plan_needs_attn: "Attention requise",
    tab_plans: "Plans", title_plans: "Plans", sub_plans: "Ce pour quoi vous épargnez ou dépenserez — chaque élément apparaît dans votre projection.",
    new_plan: "Nouveau plan", plan_type: "Type", plan_type_save: "Épargne pour", plan_type_spend: "Dépense ponctuelle", col_plan: "Plan",
    title_assets: "Actifs", sub_assets: "Ce que vous possédez – retraite, placements, immobilier. Alimente la vue valeur nette.",
    title_debts: "Dettes", sub_debts: "Les prêts s'amortissent sur la période. Les paiements réduisent votre excédent mensuel jusqu'à leur remboursement.",

    col_source: "Source", col_amount: "Montant", col_howOften: "Fréquence", col_dateOneoff: "Date (ponctuel)",
    col_item: "Poste", col_category: "Catégorie", col_what: "Quoi", col_cost: "Coût",
    col_when: "Quand", col_goal: "Objectif", col_target: "Cible", col_byWhen: "Pour quand", col_asset: "Actif",
    col_value: "Valeur", col_debt: "Dette", col_balance: "Solde", col_rate: "Taux %", col_monthlyPay: "Paiement mensuel",
    freq_monthly: "Mensuel", freq_fortnightly: "Bimensuel", freq_annual: "Annuel", freq_quarterly: "Trimestriel", freq_weekly: "Hebdomadaire", freq_daily: "Quotidien", freq_oneoff: "Ponctuel",
    new_income: "Nouveau revenu", new_expense: "Nouvelle dépense", new_goal: "Nouvel objectif",
    new_asset: "Nouvel actif", new_debt: "Nouvelle dette",

    presetTitle: "Suggestions", presetHint: "Vous ne savez pas quoi enregistrer ? Touchez pour ajouter un poste courant, puis saisissez le montant.",
    welcome_title: "Bienvenue sur Seedplanner", welcome_body: "Ajoutez vos revenus et dépenses pour voir votre projection d'épargne et quand vous pourrez prendre votre retraite. Partez de zéro, ou explorez d'abord avec des données d'exemple.",
    welcome_start: "Ajouter mes revenus", loadSample: "Essayer avec des données d'exemple",
    welcome_savings_q: "Combien avez-vous épargné en ce moment ?",
    welcome_savings_hint: "C'est votre point de départ sur le graphique. Vous pouvez le modifier à tout moment dans les réglages.",
    welcome_savings_skip: "Passer", welcome_savings_next: "Continuer",
    nudge_savings_title: "Mettre à jour votre épargne de départ ?",
    nudge_savings_body: "Votre solde a été défini il y a {n} jours. Touchez pour le mettre à jour.",
    nudge_savings_update: "Mettre à jour", nudge_savings_dismiss: "Ignorer",
    data_title: "Données", data_desc: "Chargez un exemple pour explorer, ou effacez tout pour repartir à zéro.", clearData: "Effacer toutes les données",
    clearConfirm: "Effacer toutes vos données ? Action irréversible.",
    cat_housing: "Logement", cat_food: "Alimentation", cat_transport: "Transport",
    cat_debt: "Dettes & prêts", cat_health: "Santé", cat_lifestyle: "Style de vie", cat_utilities: "Factures & charges", cat_other: "Autre",
    addCategory: "+ Ajouter une catégorie…", newCategory: "Nouvelle catégorie",
    ig_work: "Emploi", ig_invest: "Investissements", ig_other: "Autres revenus", presetBlank: "Entrée vierge",
    p_salary: "Salaire", p_freelance: "Freelance / activité annexe", p_business: "Revenu d'entreprise",
    p_rental: "Revenu locatif", p_dividends: "Dividendes", p_interest: "Intérêts", p_benefit: "Aide de l'État",
    p_pension: "Pension", p_bonus: "Prime", p_childsupport: "Pension alimentaire",
    p_rent: "Loyer", p_mortgage: "Prêt immobilier", p_utilities: "Électricité & gaz", p_water: "Eau",
    p_internet: "Internet", p_phone: "Téléphone", p_homeins: "Assurance habitation",
    p_groceries: "Courses", p_dining: "Restaurants",
    p_fuel: "Carburant", p_transit: "Transports en commun", p_carins: "Assurance auto", p_rego: "Carte grise",
    p_creditcard: "Paiement carte de crédit", p_personalloan: "Prêt personnel", p_studentloan: "Prêt étudiant",
    p_carloan: "Prêt auto", p_homeloan: "Crédit immobilier", p_bnpl: "Paiement différé",
    p_healthins: "Assurance santé", p_gym: "Sport & fitness", p_subs: "Abonnements", p_childcare: "Garde d'enfants",
    p_savings: "Épargne / investissement", p_insurance: "Assurance vie",
    p_gifts: "Cadeaux & shopping", p_strata: "Charges de copropriété",

    whereGoes: "Où va l'argent", perMo: "/mois",
    totalSpend: "Dépenses totales", perDay: "/jour", perWk: "/sem.", perYr: "/an", perFn: "/quinzaine", perOnce: "ponctuel",
    unit_day: "Jour", unit_week: "Semaine", unit_month: "Mois", unit_year: "Année",
    incomeSources: "D'où ça vient", totalIncome: "Revenu total",
    emTitle: "Fonds d'urgence", emDesc: "Un filet de sécurité pour couvrir les dépenses essentielles si vos revenus s'arrêtent. Séparé de vos objectifs d'épargne.",
    emCurrent: "Actuel", emTarget: "Cible", emFunded: "{pct}% atteint · {a} sur {b}",
    emRule: "La plupart des conseillers financiers recommandent 3 à 6 mois de dépenses essentielles. 3 mois est le minimum ; 6 mois est plus sûr si vous êtes indépendant ou avec un seul revenu.",
    emSuggest: "D'après vos dépenses :", em3mo: "3 mois", em6mo: "6 mois", emSetTo: "Définir la cible à",

    setAssumptions: "Hypothèses de projection", setCurrency: "Devise", setStarting: "Épargne de départ",
    setYears: "Projeter sur (années)", setCons: "Rendement prudent %", setExp: "Rendement attendu %",
    setOpt: "Rendement optimiste %", setInfl: "Inflation %", setInflToggle: "Afficher les montants en valeur d'aujourd'hui (ajusté de l'inflation)",
    setRetireTitle: "Objectif retraite", setRetireDesc: "Laissez vide pour un calcul automatique à partir de vos dépenses (règle des 4 % = 25× dépenses annuelles).",
    setManualTarget: "Objectif manuel (facultatif)", auto: "auto", setAutoMultiple: "Multiple auto (× dépenses annuelles)",
    setLanguage: "Langue",

    exData_title: "Exporter vos données", exData_desc: "Votre sauvegarde complète. Copiez ou partagez-la pour l'enregistrer, puis restaurez-la via Importer.",
    exRep_title: "Exporter le rapport", exRep_desc: "Un aperçu imprimable. Sur ordinateur, touchez Imprimer pour enregistrer en PDF. Sur téléphone, utilisez Partager pour l'envoyer vers Fichiers, Notes ou l'imprimer.",
    exLender_title: "Rapport prêteur", exLender_desc: "Résumé de vos revenus, dépenses, dettes, actifs et excédent mensuel — à partager avec un courtier ou un prêteur.", exLender_btn: "Rapport prêteur",
    lr_title: "Résumé financier personnel", lr_subtitle: "Préparé à des fins d'évaluation de prêt",
    lr_disclaimer: "Ce document est auto-déclaré par le demandeur et n'a pas été vérifié de manière indépendante. Il est fourni à titre de résumé d'appui uniquement.",
    lr_generated: "Généré", lr_currency: "Devise",
    lr_section_income: "Revenus", lr_section_expenses: "Dépenses régulières",
    lr_section_debts: "Passifs existants", lr_section_assets: "Actifs",
    lr_section_summary: "Résumé des flux de trésorerie mensuels",
    lr_total_income: "Revenu mensuel total", lr_total_expenses: "Dépenses mensuelles totales",
    lr_total_debt_pay: "Remboursements mensuels totaux", lr_surplus: "Excédent mensuel",
    lr_total_assets: "Total des actifs", lr_total_debts: "Total des passifs",
    lr_net_worth: "Valeur nette (actifs moins passifs)",
    lr_savings: "Épargne actuelle",
    copy: "Copier", copied: "Copié ✓", share: "Partager", print: "Imprimer", download: "Télécharger",
    downloadHtml: "Télécharger .html", close: "Fermer",
    previewNote: "Aperçu – faites une capture d'écran pour l'enregistrer sur votre téléphone",
    blockedNote: "Dans l'aperçu Claude, seul Copier fonctionne de façon fiable. Partager, Imprimer et Télécharger nécessitent l'app dans un navigateur normal – ils fonctionneront une fois déployée.",
    importBad: "Ce fichier ne contient pas de données Seedplanner valides.",

    login_title: "Se connecter à Seedplanner",
    login_subtitle: "Planifiez votre épargne et voyez quand vous pourrez prendre votre retraite.",
    login_google: "Se connecter avec Google",
    login_note: "Connexion fictive — aucun compte n'est créé et rien ne quitte votre appareil pour l'instant. La vraie connexion Google est intégrée dans la version complète.",
    signOut: "Se déconnecter",
    signOutConfirm: "Se déconnecter maintenant ? Vous devrez vous reconnecter pour revenir.",
    cancel: "Annuler",
    more: "Plus",
    nav_home: "Accueil", nav_privacy: "Politique de confidentialité", nav_terms: "Conditions d'utilisation",

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
    startingSavingsUpdatedAt: new Date().toISOString().slice(0, 10),
    projectionYears: 30,
    returnConservative: 3,
    returnExpected: 6,
    returnOptimistic: 8,
    inflationRate: 2.5,
    inflationAdjust: false,
    retirementTarget: null, // null = auto (annual expenses × multiple)
    retireMultiple: 25,
  },
  income: [
    { id: uid(), label: "Salary (PAYG)", amount: 7200, frequency: "monthly" },
    { id: uid(), label: "Freelance", amount: 1500, frequency: "monthly" },
    { id: uid(), label: "Salary", amount: 6500, frequency: "monthly" },
  ],
  expenses: [
    { id: uid(), label: "Rent", amount: 2600, frequency: "monthly", category: "Housing" },
    { id: uid(), label: "Groceries", amount: 900, frequency: "monthly", category: "Food" },
    { id: uid(), label: "Utilities", amount: 320, frequency: "monthly", category: "Housing" },
    { id: uid(), label: "Subscriptions", amount: 90, frequency: "monthly", category: "Lifestyle" },
    { id: uid(), label: "Transport", amount: 280, frequency: "monthly", category: "Transport" },
  ],
  plans: [
    { id: uid(), label: "Japan honeymoon", amount: 12000, date: isoIn(8) },
    { id: uid(), label: "Christmas gifts", amount: 1500, date: isoIn(6) },
    { id: uid(), label: "New laptop", amount: 3000, date: isoIn(14) },
    { id: uid(), label: "House deposit", amount: 120000, current: 18000, date: isoIn(48) },
    { id: uid(), label: "Travel fund", amount: 20000, current: 4000, date: isoIn(24) },
  ],
  debts: [
    { id: uid(), label: "Car loan", balance: 18000, annualRate: 7, monthlyPayment: 600 },
  ],
  assets: [
    { id: uid(), label: "Super", value: 85000 },
  ],
  emergency: { target: 20000, current: 12000 },
};

// Fresh, honest start for a new user — nothing pre-filled. The sample set above
// is opt-in (via "Try with sample data"), never the silent default.
const emptyState = {
  settings: { ...seed.settings, startingSavings: 0 },
  income: [], expenses: [], plans: [], debts: [], assets: [],
  emergency: { target: 0, current: 0 },
};
const clone = (o) => JSON.parse(JSON.stringify(o));

function isoIn(months) {
  const d = new Date();
  d.setMonth(d.getMonth() + months);
  return d.toISOString().slice(0, 10);
}
function monthsFromNow(iso) {
  if (!iso) return 0;
  const now = new Date();
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(y, m - 1, d); // local midnight — avoids UTC shift for users west of UTC
  return (date.getFullYear() - now.getFullYear()) * 12 + (date.getMonth() - now.getMonth());
}

/* ------------------------------------------------------------------ *
 * Projection engine — pure. The single source of truth for the chart.
 * ------------------------------------------------------------------ */
function monthlyOf(amount, frequency) {
  if (frequency === "annual") return amount / 12;
  if (frequency === "quarterly") return amount / 3;
  if (frequency === "fortnightly") return (amount * 26) / 12;
  if (frequency === "weekly") return (amount * 52) / 12;
  if (frequency === "daily") return (amount * 365) / 12;
  return amount; // monthly
}

function buildProjection({ settings, income, expenses, oneOffs, debts, assets, whatIf }) {
  const months = settings.projectionYears * 12;

  // When what-if is active, exclude plans the user has toggled off.
  const disabledIds = new Set(whatIf?.active ? (whatIf.disabledPlanIds || []) : []);
  const activePlans = oneOffs.filter((o) => !disabledIds.has(o.id));

  const monthlyIncome = income
    .filter((i) => i.frequency !== "oneoff")
    .reduce((s, i) => s + monthlyOf(i.amount, i.frequency), 0);
  const monthlyExpense = expenses.reduce((s, e) => s + monthlyOf(e.amount, e.frequency), 0);
  const monthlyDebtPay = debts.reduce((s, d) => s + (d.monthlyPayment || 0), 0);

  const baseNet = monthlyIncome - monthlyExpense - monthlyDebtPay;

  // one-off events — only active plans (respects what-if toggles)
  const oneOffByMonth = {};
  activePlans.forEach((o) => {
    const m = monthsFromNow(o.date);
    if (m >= 0 && m <= months) oneOffByMonth[m] = (oneOffByMonth[m] || 0) + o.amount;
  });
  // one-off income events
  income.filter((i) => i.frequency === "oneoff").forEach((i) => {
    const m = monthsFromNow(i.date);
    if (m >= 0 && m <= months) oneOffByMonth[m] = (oneOffByMonth[m] || 0) - i.amount;
  });

  const assetTotal = assets.reduce((s, a) => s + (a.value || 0), 0);

  const rates = {
    conservative: settings.returnConservative / 100,
    expected: settings.returnExpected / 100,
    optimistic: settings.returnOptimistic / 100,
  };

  const bal = {
    conservative: settings.startingSavings,
    expected: settings.startingSavings,
    optimistic: settings.startingSavings,
  };
  let debtState = debts.map((d) => ({ ...d, rem: d.balance }));

  const infl = settings.inflationRate / 100;
  const data = [];

  for (let m = 0; m <= months; m++) {
    if (m > 0) {
      for (const k of ["conservative", "expected", "optimistic"]) {
        bal[k] = bal[k] * (1 + rates[k] / 12) + baseNet - (oneOffByMonth[m] || 0);
      }
      debtState = debtState.map((d) => {
        let rem = d.rem;
        rem = rem + (rem * (d.annualRate / 100)) / 12 - (d.monthlyPayment || 0);
        rem = Math.max(0, rem);
        return { ...d, rem };
      });
    }

    const deflator = settings.inflationAdjust ? Math.pow(1 + infl / 12, m) : 1;
    const debtRem = debtState.reduce((s, d) => s + d.rem, 0);

    data.push({
      month: m,
      year: +(m / 12).toFixed(2),
      conservative: Math.round(bal.conservative / deflator),
      expected: Math.round(bal.expected / deflator),
      optimistic: Math.round(bal.optimistic / deflator),
      netWorth: Math.round((bal.expected + assetTotal - debtRem) / deflator),
    });
  }

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
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 22 }}>
          <img src="/logo.png" alt="Seedplanner" style={{ height: 48, width: "auto" }} />
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
  const [metric, setMetric] = useState("savings"); // savings | networth
  // chart view options — kept here (not in Dashboard) so they survive tab switches
  const [grain, setGrain] = useState("monthly"); // yearly | monthly
  const [scaleMode, setScaleMode] = useState("log"); // log | linear
  const [pickYear, setPickYear] = useState(1); // chosen year in the monthly view
  const [whatIf, setWhatIf] = useState({ active: false, disabledPlanIds: [] });
  const [sheet, setSheet] = useState(null);
  const [authed, setAuthed] = useState(() => {
    try { return localStorage.getItem(AUTH_KEY) === "1"; } catch { return false; }
  });
  const saveTimer = useRef(null);
  const [confirm, setConfirm] = useState(null); // { title, message, confirmLabel, danger, onConfirm }
  const [savingsNudgeDismissed, setSavingsNudgeDismissed] = useState(false);

  useEffect(() => {
    store.load().then((s) => {
      if (!s) { setState(clone(emptyState)); return; }
      // migrate old oneOffs + goals → plans
      if (!s.plans && (s.oneOffs || s.goals)) {
        const migrated = [
          ...(s.oneOffs || []).map((o) => ({ id: o.id, label: o.label, amount: o.amount, date: o.date })),
          ...(s.goals || []).map((g) => ({ id: g.id, label: g.label, amount: g.target || 0, date: g.date, current: g.current || 0 })),
        ];
        const { oneOffs: _o, goals: _g, ...rest } = s;
        setState({ ...rest, plans: migrated });
      } else {
        setState({ ...clone(emptyState), ...s });
      }
    });
  }, []);

  const loadSample = () => setState(clone(seed));
  // Seed a few common income/expense rows at $0 so a fresh user has a starting point.
  const startWithPresets = (savingsAmount = 0) => {
    const today = new Date().toISOString().slice(0, 10);
    setState((s) => ({
      ...s,
      settings: { ...s.settings, startingSavings: savingsAmount, startingSavingsUpdatedAt: today },
      income: STARTER_INCOME.map((p) => ({ id: uid(), label: t(p.key), amount: 0, frequency: p.frequency })),
      expenses: STARTER_EXPENSES.map((p) => ({ id: uid(), label: t(p.key), amount: 0, frequency: p.frequency, category: t(p.catKey) })),
    }));
    setTab("income");
  };
  const clearData = () => setConfirm({
    title: t("clearData"),
    message: t("clearConfirm"),
    confirmLabel: t("clearData"),
    danger: true,
    onConfirm: () => setState(clone(emptyState)),
  });

  // Highlight the whole value when a number field is focused, so the user can
  // type over it (e.g. the default 0) instead of deleting it first.
  useEffect(() => {
    const onFocusIn = (e) => {
      const el = e.target;
      if (el && el.tagName === "INPUT" && el.type === "number") {
        setTimeout(() => { try { el.select(); } catch {} }, 0);
      }
    };
    document.addEventListener("focusin", onFocusIn);
    return () => document.removeEventListener("focusin", onFocusIn);
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

  const fmtCompact = useMemo(() => {
    const cur = state?.settings.currency || "AUD";
    return new Intl.NumberFormat(undefined, {
      style: "currency", currency: cur, notation: "compact", maximumFractionDigits: 1,
    });
  }, [state?.settings.currency]);

  const filtered = useMemo(() => {
    if (!state) return null;
    return {
      income: state.income,
      expenses: state.expenses,
      plans: state.plans || [],
      debts: state.debts,
      assets: state.assets,
    };
  }, [state]);

  const projection = useMemo(() => {
    if (!state || !filtered) return null;
    // Plans with sub-items: use sub-items as independent one-offs; plan amount is just the budget cap
    const planOneOffs = filtered.plans.flatMap((p) =>
      p.items && p.items.length > 0
        ? p.items.map((it) => ({ ...it, _planId: p.id }))
        : [p]
    );
    return buildProjection({
      settings: state.settings,
      income: filtered.income,
      expenses: filtered.expenses,
      oneOffs: planOneOffs,
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
  const addItem = (key, item) => setState((s) => ({ ...s, [key]: [item, ...s[key]] }));
  const updItem = (key, id, patch) =>
    setState((s) => ({ ...s, [key]: s[key].map((i) => (i.id === id ? { ...i, ...patch } : i)) }));
  const delItem = (key, id) =>
    setState((s) => ({ ...s, [key]: s[key].filter((i) => i.id !== id) }));

  /* ---- placeholder sign-out: clears the auth flag, returns to login ---- */
  const signOut = () => setConfirm({
    title: t("signOut"),
    message: t("signOutConfirm"),
    confirmLabel: t("signOut"),
    danger: true,
    onConfirm: () => {
      try { localStorage.removeItem(AUTH_KEY); } catch {}
      setAuthed(false);
    },
  });

  /* ---- export / import ---- */
  const exportJSON = () => {
    const disabledIds = new Set(whatIf.active ? (whatIf.disabledPlanIds || []) : []);
    const hasWhatIf = whatIf.active && disabledIds.size > 0;
    const stateWithWhatIf = hasWhatIf
      ? { ...state, plans: state.plans.filter((p) => !disabledIds.has(p.id)) }
      : null;
    setSheet({
      kind: "data",
      title: t("exData_title"),
      desc: t("exData_desc"),
      content: hasWhatIf ? JSON.stringify(stateWithWhatIf, null, 2) : JSON.stringify(state, null, 2),
      contentOriginal: JSON.stringify(state, null, 2),
      hasWhatIf,
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

    // year-by-year projection rows
    const rows = [];
    for (let y = 0; y <= state.settings.projectionYears; y++) {
      const p = projection.data[Math.min(y * 12, projection.data.length - 1)];
      const passed = p.expected >= retireTarget;
      rows.push(
        `<tr${passed ? ' class="hit"' : ""}><td>${y === 0 ? t("rep_now") : new Date().getFullYear() + y}</td>` +
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
      `<tr><td>${i.label}</td><td class="r">${m(i.amount)}</td><td>${fr(i.frequency)}</td></tr>`);
    const expenseRows = filtered.expenses.map((e) =>
      `<tr><td>${e.label}</td><td class="r">${m(e.amount)}</td><td>${fr(e.frequency)}</td><td>${e.category}</td></tr>`);
    const disabledIds = new Set(whatIf.active ? (whatIf.disabledPlanIds || []) : []);
    const hasWhatIf = whatIf.active && disabledIds.size > 0;
    const activePlans = filtered.plans.filter((p) => !disabledIds.has(p.id));

    const buildPlanRows = (plans) => ({
      oneOff: plans.filter((p) => p.type === "spend").map((o) =>
        `<tr><td>${o.label}</td><td class="r">${m(o.amount)}</td><td>${dt(o.date)}</td></tr>`),
      goals: plans.filter((p) => p.type === "save").map((g) =>
        `<tr><td>${g.label}</td><td class="r">${m(g.amount)}</td><td>${dt(g.date)}</td></tr>`),
    });

    const wiRows = buildPlanRows(activePlans);
    const allRows = buildPlanRows(filtered.plans);
    const oneOffRows = wiRows.oneOff;
    const goalRows = wiRows.goals;
    const debtRows = filtered.debts.map((d) =>
      `<tr><td>${d.label}</td><td class="r">${m(d.balance)}</td><td class="r">${d.annualRate}%</td><td class="r">${m(d.monthlyPayment)}</td></tr>`);
    const assetRows = filtered.assets.map((a) =>
      `<tr><td>${a.label}</td><td class="r">${m(a.value)}</td></tr>`);

    // pull the live chart SVG so the report shows the bars
    let chartHTML = "";
    try {
      const svg = document.querySelector(".recharts-surface");
      if (svg) chartHTML = `<div class="chart">${svg.outerHTML}</div>`;
    } catch { /* no chart available */ }

    const buildHTML = (oRows, gRows, note = "") => `<!doctype html><html><head><meta charset="utf-8"><title>Seedplanner report</title>
<style>
  @page { margin: 18mm; }
  * { box-sizing: border-box; }
  body { font-family: ui-sans-serif, system-ui, -apple-system, sans-serif; color: #23323C; margin: 0; }
  .head { border-bottom: 2px solid #2E8C8C; padding-bottom: 12px; margin-bottom: 18px; }
  .head h1 { margin: 0; font-size: 22px; color: #2E8C8C; }
  .head .meta { color: #5C6E76; font-size: 12px; margin-top: 4px; }
  .wi-note { background: #FFF8F0; border: 1px solid #E8C97A; border-radius: 8px; padding: 8px 12px; font-size: 12px; color: #7A5A1A; margin-bottom: 14px; }
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
    <div class="meta">${t("rep_generated")} ${new Date().toLocaleDateString()} · ${state.settings.currency} · ${state.settings.inflationAdjust ? t("todayDollars") : t("futureDollars")}</div>
  </div>
  ${note}
  <div class="cards">
    <div class="card"><div class="l">${t("stat_surplus")}</div><div class="v">${m(projection.monthlyNet)}</div></div>
    <div class="card"><div class="l">${t("stat_retireNum")}</div><div class="v">${m(retireTarget)}</div></div>
    <div class="card"><div class="l">${t("stat_retireOn")}</div><div class="v">${retireDate ? new Date(retireDate).getFullYear() : "—"}</div></div>
    <div class="card"><div class="l">${t("stat_balanceIn", { n: state.settings.projectionYears })}</div><div class="v">${m(projection.data[projection.data.length - 1].expected)}</div></div>
  </div>
  ${chartHTML}
  <h3>${t("rep_byYear")}</h3>
  <table><thead><tr><th>${t("col_when")}</th><th class="r">${t("savings")}</th><th class="r">${t("netWorth")}</th></tr></thead><tbody>${rows.join("")}</tbody></table>
  ${section(t("title_income"), [{ t: t("col_source") }, { t: t("col_amount"), r: 1 }, { t: t("col_howOften") }], incomeRows)}
  ${section(t("title_expenses"), [{ t: t("col_item") }, { t: t("col_amount"), r: 1 }, { t: t("col_howOften") }, { t: t("col_category") }], expenseRows)}
  ${section(t("tab_plans") + " — " + t("plan_type_spend"), [{ t: t("col_plan") }, { t: t("col_amount"), r: 1 }, { t: t("col_when") }], oRows)}
  ${section(t("tab_plans") + " — " + t("plan_type_save"), [{ t: t("col_plan") }, { t: t("col_amount"), r: 1 }, { t: t("col_when") }], gRows)}
  ${section(t("title_debts"), [{ t: t("col_debt") }, { t: t("col_balance"), r: 1 }, { t: t("col_rate") }, { t: t("col_monthlyPay"), r: 1 }], debtRows)}
  ${section(t("title_assets"), [{ t: t("col_asset") }, { t: t("col_value"), r: 1 }], assetRows)}
  <h3>${t("rep_emergency")}</h3>
  <table><tbody><tr><td>${t("emCurrent")}</td><td class="r">${m(state.emergency.current)}</td></tr><tr><td>${t("emTarget")}</td><td class="r">${m(state.emergency.target)}</td></tr></tbody></table>
  <div class="foot">${t("rep_foot")}</div>
</body></html>`;

    const wiNote = `<div class="wi-note">⚡ What-if scenario applied — ${disabledIds.size} plan${disabledIds.size > 1 ? "s" : ""} excluded from this projection.</div>`;
    const html = buildHTML(wiRows.oneOff, wiRows.goals, hasWhatIf ? wiNote : "");
    const htmlOriginal = hasWhatIf ? buildHTML(allRows.oneOff, allRows.goals) : null;

    setSheet({
      kind: "report",
      title: t("exRep_title"),
      desc: t("exRep_desc"),
      content: html,
      contentOriginal: htmlOriginal,
      hasWhatIf,
      filename: `seedplanner-report-${new Date().toISOString().slice(0, 10)}.html`,
      mime: "text/html",
    });
  };

  const exportLenderReport = () => {
    const m = (v) => fmt.format(v || 0);
    const fr = (f) => t("freq_" + f) || f;
    const toMonthly = (amt, freq) => {
      if (freq === "annual") return amt / 12;
      if (freq === "quarterly") return amt / 3;
      if (freq === "fortnightly") return (amt * 26) / 12;
      if (freq === "weekly") return (amt * 52) / 12;
      if (freq === "daily") return (amt * 365) / 12;
      return amt;
    };

    const totalIncome = projection.monthlyIncome;
    const totalExpenses = filtered.expenses.reduce((s, e) => s + toMonthly(e.amount, e.frequency), 0);
    const totalDebtPay = filtered.debts.reduce((s, d) => s + (d.monthlyPayment || 0), 0);
    const surplus = totalIncome - totalExpenses - totalDebtPay;
    const totalAssets = filtered.assets.reduce((s, a) => s + (a.value || 0), 0) + state.settings.startingSavings;
    const totalDebts = filtered.debts.reduce((s, d) => s + (d.balance || 0), 0);
    const netWorth = totalAssets - totalDebts;

    const sec = (title, headers, rows) => rows.length ? `
      <div class="section">
        <h3>${title}</h3>
        <table>
          <thead><tr>${headers.map(h => `<th class="${h.r ? "r" : ""}">${h.t}</th>`).join("")}</tr></thead>
          <tbody>${rows.join("")}</tbody>
        </table>
      </div>` : "";

    const incomeRows = filtered.income
      .filter(i => i.frequency !== "oneoff")
      .map(i => `<tr><td>${i.label}</td><td class="r">${m(i.amount)}</td><td>${fr(i.frequency)}</td><td class="r">${m(toMonthly(i.amount, i.frequency))}/mo</td></tr>`);

    const expenseRows = filtered.expenses
      .map(e => `<tr><td>${e.label}</td><td>${e.category || "—"}</td><td class="r">${m(e.amount)}</td><td>${fr(e.frequency)}</td><td class="r">${m(toMonthly(e.amount, e.frequency))}/mo</td></tr>`);

    const debtRows = filtered.debts
      .map(d => `<tr><td>${d.label}</td><td class="r">${m(d.balance)}</td><td class="r">${d.annualRate}%</td><td class="r">${m(d.monthlyPayment)}/mo</td></tr>`);

    const assetRows = [
      `<tr><td>Savings</td><td class="r">${m(state.settings.startingSavings)}</td></tr>`,
      ...filtered.assets.map(a => `<tr><td>${a.label}</td><td class="r">${m(a.value)}</td></tr>`),
    ];

    const summaryRow = (label, value, highlight = false) =>
      `<tr${highlight ? ' class="highlight"' : ""}><td>${label}</td><td class="r"><strong>${value}</strong></td></tr>`;

    const html = `<!doctype html><html><head><meta charset="utf-8">
<title>${t("lr_title")}</title>
<style>
  @page { margin: 20mm; }
  * { box-sizing: border-box; }
  body { font-family: ui-sans-serif, system-ui, -apple-system, sans-serif; color: #1a2a32; margin: 0; font-size: 13px; }
  .header { border-bottom: 3px solid #1a2a32; padding-bottom: 14px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-end; }
  .header-left h1 { margin: 0 0 4px; font-size: 22px; font-weight: 700; }
  .header-left p { margin: 0; color: #5C6E76; font-size: 13px; }
  .header-right { text-align: right; font-size: 12px; color: #5C6E76; }
  .disclaimer { background: #fff8f0; border: 1px solid #e5a86b; border-radius: 8px; padding: 10px 14px; font-size: 11.5px; color: #7a5a30; margin-bottom: 20px; line-height: 1.5; }
  .summary-cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 24px; }
  .card { border: 1px solid #dde8e8; border-radius: 10px; padding: 12px 14px; }
  .card .label { font-size: 10.5px; color: #93A4AA; text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 4px; }
  .card .value { font-size: 19px; font-weight: 700; font-variant-numeric: tabular-nums; }
  .card .value.pos { color: #2E8C8C; }
  .card .value.neg { color: #c0392b; }
  .section { margin-bottom: 20px; }
  h3 { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: #5C6E76; margin: 0 0 6px; padding-bottom: 4px; border-bottom: 1px solid #dde8e8; }
  table { width: 100%; border-collapse: collapse; }
  th { text-align: left; font-size: 11px; color: #93A4AA; font-weight: 500; padding: 4px 6px; border-bottom: 1px solid #eef2f2; }
  td { padding: 5px 6px; border-bottom: 1px solid #f4f8f8; font-variant-numeric: tabular-nums; }
  .r { text-align: right; }
  tr.highlight td { background: #eaf4f4; font-weight: 600; }
  .footer { margin-top: 28px; padding-top: 12px; border-top: 1px solid #dde8e8; font-size: 11px; color: #93A4AA; line-height: 1.5; }
</style>
</head><body>
  <div class="header">
    <div class="header-left">
      <h1>${t("lr_title")}</h1>
      <p>${t("lr_subtitle")}</p>
    </div>
    <div class="header-right">
      ${t("lr_generated")}: ${new Date().toLocaleDateString()}<br/>
      ${t("lr_currency")}: ${state.settings.currency}
    </div>
  </div>

  <div class="disclaimer">${t("lr_disclaimer")}</div>

  <div class="summary-cards">
    <div class="card"><div class="label">${t("lr_total_income")}</div><div class="value pos">${m(totalIncome)}</div></div>
    <div class="card"><div class="label">${t("lr_total_expenses")} + ${t("lr_total_debt_pay")}</div><div class="value">${m(totalExpenses + totalDebtPay)}</div></div>
    <div class="card"><div class="label">${t("lr_surplus")}</div><div class="value ${surplus >= 0 ? "pos" : "neg"}">${m(surplus)}</div></div>
    <div class="card"><div class="label">${t("lr_total_assets")}</div><div class="value pos">${m(totalAssets)}</div></div>
    <div class="card"><div class="label">${t("lr_total_debts")}</div><div class="value ${totalDebts > 0 ? "neg" : ""}">${m(totalDebts)}</div></div>
    <div class="card"><div class="label">${t("lr_net_worth")}</div><div class="value ${netWorth >= 0 ? "pos" : "neg"}">${m(netWorth)}</div></div>
  </div>

  ${sec(t("lr_section_income"),
    [{ t: "Source" }, { t: "Amount", r: 1 }, { t: "Frequency" }, { t: "Monthly equiv.", r: 1 }],
    incomeRows)}

  ${sec(t("lr_section_expenses"),
    [{ t: "Expense" }, { t: "Category" }, { t: "Amount", r: 1 }, { t: "Frequency" }, { t: "Monthly equiv.", r: 1 }],
    expenseRows)}

  ${sec(t("lr_section_debts"),
    [{ t: "Liability" }, { t: "Outstanding balance", r: 1 }, { t: "Rate", r: 1 }, { t: "Monthly repayment", r: 1 }],
    debtRows)}

  ${sec(t("lr_section_assets"),
    [{ t: "Asset" }, { t: "Value", r: 1 }],
    assetRows)}

  <div class="section">
    <h3>${t("lr_section_summary")}</h3>
    <table>
      <tbody>
        ${summaryRow(t("lr_total_income"), m(totalIncome))}
        ${summaryRow(t("lr_total_expenses"), m(totalExpenses))}
        ${summaryRow(t("lr_total_debt_pay"), m(totalDebtPay))}
        ${summaryRow(t("lr_surplus"), m(surplus), true)}
      </tbody>
    </table>
  </div>

  <div class="footer">${t("lr_disclaimer")}</div>
</body></html>`;

    setSheet({
      kind: "report",
      title: t("exLender_title"),
      desc: t("exLender_desc"),
      content: html,
      filename: `seedplanner-lender-report-${new Date().toISOString().slice(0, 10)}.html`,
      mime: "text/html",
    });
  };

  const TABS = [
    ["dashboard", t("tab_dashboard"), LayoutDashboard],
    ["income", t("tab_income"), Wallet],
    ["expenses", t("tab_expenses"), TrendingDown],
    ["plans", t("tab_plans"), Target],
    ["balance", t("tab_balance"), Landmark],
    ["settings", t("tab_settings"), Cog],
  ];

  return (
    <div style={{ background: C.sky, backgroundColor: C.bg, minHeight: "100vh", color: C.ink, fontFamily: FONT }}>
      {/* top bar */}
      <header style={{ borderBottom: `1px solid ${C.line}`, background: "rgba(255,255,255,0.78)", backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)", position: "sticky", top: 0, zIndex: 20 }}>
        <div className="mx-auto flex flex-wrap items-center justify-between gap-2 px-3 py-3 sm:px-5" style={{ maxWidth: 1100 }}>
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="Seedplanner" style={{ height: 30, width: "auto", display: "block" }} />
          </div>
          <div className="flex items-center gap-2">
            <select value={state.settings.lang || "en"} onChange={(e) => setSettings({ lang: e.target.value })}
              title={t("setLanguage")}
              style={{ border: `1px solid ${C.line}`, borderRadius: 8, padding: "6px 9px", fontSize: 13, background: C.card, color: C.ink }}>
              {LANGS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
            {/* data actions: inline on wider screens, collapsed into a menu on phones */}
            <div className="hidden items-center gap-2 sm:flex">
              <button onClick={exportJSON} title={t("export")} aria-label={t("export")}
                className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm"
                style={{ border: `1px solid ${C.line}`, color: C.sub, background: C.card }}>
                <Download size={15} /> <span>{t("export")}</span>
              </button>
              <button onClick={exportPDF} title="PDF" aria-label="PDF"
                className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm"
                style={{ border: `1px solid ${C.line}`, color: C.sub, background: C.card }}>
                <FileText size={15} /> <span>PDF</span>
              </button>
              <button onClick={exportLenderReport} title={t("exLender_btn")} aria-label={t("exLender_btn")}
                className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm"
                style={{ border: `1px solid ${C.line}`, color: C.sub, background: C.card }}>
                <Landmark size={15} /> <span>{t("exLender_btn")}</span>
              </button>
              <label title={t("import")} aria-label={t("import")}
                className="flex cursor-pointer items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm"
                style={{ border: `1px solid ${C.line}`, color: C.sub, background: C.card }}>
                <Upload size={15} /> <span>{t("import")}</span>
                <input type="file" accept="application/json" onChange={importJSON} className="hidden" />
              </label>
            </div>
            <MoreMenu className="sm:hidden" onExport={exportJSON} onExportPDF={exportPDF} onExportLender={exportLenderReport} onImport={importJSON} />
            <span aria-hidden style={{ width: 1, alignSelf: "stretch", margin: "2px 2px", background: C.line }} />
            <button onClick={signOut} title={t("signOut")} aria-label={t("signOut")}
              className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm"
              style={{ border: `1px solid ${C.claySoft}`, color: C.clay, background: C.claySoft }}>
              <LogOut size={15} /> <span>{t("signOut")}</span>
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
          (state.income.length === 0 && state.expenses.length === 0)
            ? <WelcomeCard onLoadSample={loadSample} onStart={startWithPresets} />
            : <Dashboard {...{ state, projection, fmt, fmtCompact, retireTarget, retireDate, retireMonths,
                metric, setMetric, grain, setGrain, scaleMode, setScaleMode, pickYear, setPickYear,
                whatIf, setWhatIf, chartKey, filtered, setSettings, setTab,
                savingsNudgeDismissed, onDismissSavingsNudge: () => setSavingsNudgeDismissed(true) }} />
        )}

        {tab === "income" && (
          <>
            <ListSection
              title={t("title_income")} subtitle={t("sub_income")}
              items={filtered.income} columns={incomeCols()}
              onAdd={() => addItem("income", { id: uid(), label: "", amount: 0, frequency: "monthly" })}
              onUpdate={(id, p) => updItem("income", id, p)}
              onDelete={(id) => delItem("income", id)} fmt={fmt} sortByDate
              presets={INCOME_PRESETS}
              onAddPreset={(p) => addItem("income", { id: uid(), label: t(p.key), amount: 0, frequency: p.frequency })} />
            <Breakdown items={filtered.income} groupBy={bySource}
              title={t("incomeSources")} totalLabel={t("totalIncome")} fmt={fmt} />
          </>
        )}

        {tab === "expenses" && (
          <>
            <ListSection
              title={t("title_expenses")} subtitle={t("sub_expenses")}
              items={filtered.expenses} columns={expenseCols(state.expenses)}
              onAdd={() => addItem("expenses", { id: uid(), label: "", amount: 0, frequency: "monthly", category: t("cat_other") })}
              onUpdate={(id, p) => updItem("expenses", id, p)}
              onDelete={(id) => delItem("expenses", id)} fmt={fmt} sortByDate
              presets={EXPENSE_PRESETS}
              onAddPreset={(p) => addItem("expenses", { id: uid(), label: t(p.key), amount: 0, frequency: p.frequency, category: t(p.catKey) })} />
            <Breakdown items={filtered.expenses} groupBy={byCategory}
              title={t("whereGoes")} totalLabel={t("totalSpend")} fmt={fmt} />
          </>
        )}

        {tab === "plans" && (
          <>
            <PlansSection
              plans={filtered.plans}
              onAdd={() => addItem("plans", { id: uid(), label: "", amount: 0, date: new Date().toISOString().slice(0, 10), current: 0, items: [] })}
              onUpdate={(id, p) => updItem("plans", id, p)}
              onDelete={(id) => delItem("plans", id)}
              fmt={fmt}
            />
            <GoalProgress goals={filtered.plans} fmt={fmt} pool={state.settings.startingSavings} />
          </>
        )}

        {tab === "balance" && (
          <>
            <EmergencyCard emergency={state.emergency} setEmergency={(p) => set({ emergency: { ...state.emergency, ...p } })} fmt={fmt} monthlyExpenses={projection.monthlyExpense} />
            <ListSection
              title={t("title_assets")} subtitle={t("sub_assets")}
              items={filtered.assets} columns={assetCols()}
              onAdd={() => addItem("assets", { id: uid(), label: "", value: 0 })}
              onUpdate={(id, p) => updItem("assets", id, p)}
              onDelete={(id) => delItem("assets", id)} fmt={fmt} />
            <ListSection
              title={t("title_debts")} subtitle={t("sub_debts")}
              items={filtered.debts} columns={debtCols()}
              onAdd={() => addItem("debts", { id: uid(), label: "", balance: 0, annualRate: 0, monthlyPayment: 0 })}
              onUpdate={(id, p) => updItem("debts", id, p)}
              onDelete={(id) => delItem("debts", id)} fmt={fmt} />
          </>
        )}

        {tab === "settings" && (
          <SettingsPanel state={state} setSettings={setSettings} setState={setState} onLoadSample={loadSample} onClearData={clearData} />
        )}
      </main>

      <ExportSheet sheet={sheet} onClose={() => setSheet(null)} />

      <ConfirmDialog data={confirm} onClose={() => setConfirm(null)} />

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
 * Welcome / empty state — shown until the user has any income or expenses
 * ================================================================== */
function WelcomeCard({ onLoadSample, onStart }) {
  const [step, setStep] = useState("intro"); // "intro" | "savings"
  const [savings, setSavings] = useState("");

  if (step === "savings") {
    return (
      <Card>
        <div className="flex items-center gap-2" style={{ marginBottom: 6 }}>
          <img src="/logo.png" alt="" style={{ height: 26, width: "auto" }} />
        </div>
        <h2 style={{ fontWeight: 600, fontSize: 17, marginBottom: 6 }}>{t("welcome_savings_q")}</h2>
        <p style={{ color: C.sub, fontSize: 13.5, lineHeight: 1.6, maxWidth: 500, marginBottom: 16 }}>{t("welcome_savings_hint")}</p>
        <input
          type="number"
          autoFocus
          placeholder="0"
          value={savings}
          onChange={(e) => setSavings(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onStart(+savings || 0)}
          style={{ ...fieldStyle, fontSize: 22, fontWeight: 600, width: 220, marginBottom: 18 }}
        />
        <div className="flex flex-wrap gap-2">
          <button onClick={() => onStart(+savings || 0)}
            className="rounded-md px-4 py-2 text-sm"
            style={{ background: C.green, color: "#fff", fontWeight: 600 }}>
            {t("welcome_savings_next")}
          </button>
          <button onClick={() => onStart(0)}
            className="rounded-md px-3 py-2 text-sm"
            style={{ border: `1px solid ${C.line}`, color: C.sub, background: C.card }}>
            {t("welcome_savings_skip")}
          </button>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="flex items-center gap-2">
        <img src="/logo.png" alt="" style={{ height: 26, width: "auto" }} />
        <h2 style={{ fontWeight: 600, fontSize: 17 }}>{t("welcome_title")}</h2>
      </div>
      <p style={{ color: C.sub, fontSize: 13.5, marginTop: 8, lineHeight: 1.6, maxWidth: 560 }}>{t("welcome_body")}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <button onClick={() => setStep("savings")}
          className="flex items-center gap-1 rounded-md px-3 py-2 text-sm"
          style={{ background: C.green, color: "#fff", fontWeight: 600 }}>
          <Plus size={15} /> {t("welcome_start")}
        </button>
        <button onClick={onLoadSample}
          className="flex items-center gap-1 rounded-md px-3 py-2 text-sm"
          style={{ border: `1px solid ${C.line}`, color: C.sub, background: C.card, fontWeight: 500 }}>
          {t("loadSample")}
        </button>
      </div>
    </Card>
  );
}

/* Custom chart tooltip — shows the projected/goal values plus, when a bar's
 * year/month holds goals, the individual goals that landed there. */
function ChartTooltip({ active, payload, label, fmt, isMonthly, year }) {
  if (!active || !payload || !payload.length) return null;
  const row = payload[0].payload || {};
  const title = row.cal || (isMonthly ? t("monthYear", { m: label, n: year }) : t("yearN", { n: label }));
  return (
    <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 10, padding: "8px 10px", fontSize: 12, ...num }}>
      <div style={{ fontWeight: 600, marginBottom: 4 }}>{title}</div>
      {payload.filter((p) => p.dataKey !== "goalLine" && p.dataKey !== "planCost").map((p) => (
        <div key={p.dataKey} style={{ color: p.color }}>
          {p.dataKey === "whatif" ? t("whatif") : t("tooltip_remaining")}: {fmt.format(p.value)}
        </div>
      ))}
      {row.oneOffsHere && row.oneOffsHere.length > 0 && (
        <div style={{ marginTop: 5, paddingTop: 5, borderTop: `1px solid ${C.line}` }}>
          {row.oneOffsHere.map((o) => (
            <div key={o.id} style={{ display: "flex", justifyContent: "space-between", gap: 12, color: o.amount < 0 ? C.clay : C.green }}>
              <span>{o.label}</span>
              <span>{o.amount < 0 ? "−" : "+"}{fmt.format(Math.abs(o.amount))}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* Green bar with rounded top corners only when no plan sits on top,
 * flat top when a red plan segment is stacked above it. */
function GreenBar({ x, y, width, height, fill, payload }) {
  if (!height || height <= 0) return null;
  const hasPlan = payload?.planCost > 0;
  if (hasPlan) return <rect x={x} y={y} width={width} height={height} fill={fill} />;
  const r = Math.min(6, width / 2, height / 2);
  return <path fill={fill} d={`M${x},${y+height} V${y+r} Q${x},${y} ${x+r},${y} H${x+width-r} Q${x+width},${y} ${x+width},${y+r} V${y+height} Z`} />;
}

/* ================================================================== *
 * Dashboard
 * ================================================================== */
function Dashboard({ state, projection, fmt, fmtCompact, retireTarget, retireDate, retireMonths, metric, setMetric, grain, setGrain, scaleMode, setScaleMode, pickYear, setPickYear, whatIf, setWhatIf, chartKey, filtered, setSettings, setTab, savingsNudgeDismissed, onDismissSavingsNudge }) {
  // Show savings nudge if starting savings hasn't been updated in 30+ days
  const savingsNudgeDays = (() => {
    const updated = state.settings.startingSavingsUpdatedAt;
    if (!updated) return null;
    const days = Math.floor((Date.now() - new Date(updated).getTime()) / 86400000);
    return days >= 30 ? days : null;
  })();
  const milestones = [1, 2, 3, 5, 10].filter((y) => y <= state.settings.projectionYears);
  const pointAt = (y) => projection.data[Math.min(y * 12, projection.data.length - 1)];
  // Projection year y ends y calendar years from today — label everything by that real year.
  const baseYear = new Date().getFullYear();
  const calYear = (y) => baseYear + y;

  const startBal = projection.data[0][chartKey];

  // All plans as dots at their actual projected savings balance on that date.
  // Using the real projection value (which already dips at each plan) means the line
  // rises between plans and drops when a plan hits — matching the green bars' shape.
  const cumGoals = useMemo(() => {
    const disabledIds = new Set(whatIf.active ? (whatIf.disabledPlanIds || []) : []);
    const sorted = filtered.plans
      .filter((p) => !disabledIds.has(p.id))
      .filter((p) => (p.amount || 0) > 0 && p.date)
      .map((p) => ({ id: p.id, label: p.label, target: p.amount, months: monthsFromNow(p.date) }))
      .filter((p) => p.months > 0)
      .sort((a, b) => a.months - b.months);
    return sorted.map((p) => ({ ...p, cum: p.target }));
  }, [filtered.plans, whatIf.active, whatIf.disabledPlanIds]);

  const projYears = state.settings.projectionYears;

  // Goals clustered by calendar year so the chart never stacks many dots on one bar.
  // Each year keeps its goals and sits at that year's top cumulative total. Ceil() so a
  // goal always buckets to the year it's reached by, keeping its dot on the line.
  const yearBuckets = useMemo(() => {
    const map = new Map();
    cumGoals.forEach((g) => {
      const y = Math.min(Math.max(1, Math.ceil(g.months / 12)), projYears);
      const b = map.get(y) || { year: y, goals: [], cum: 0 };
      b.goals.push(g); b.cum = Math.max(b.cum, g.cum);
      map.set(y, b);
    });
    return [...map.values()].sort((a, b) => a.year - b.year);
  }, [cumGoals, projYears]);

  // Same idea bucketed by exact month, for the monthly view.
  const monthBuckets = useMemo(() => {
    const map = new Map();
    cumGoals.forEach((g) => {
      const b = map.get(g.months) || { months: g.months, goals: [], cum: 0 };
      b.goals.push(g); b.cum = Math.max(b.cum, g.cum);
      map.set(g.months, b);
    });
    return [...map.values()].sort((a, b) => a.months - b.months);
  }, [cumGoals]);

  // All plans show as dips in the tooltip; one-off income shows as a positive delta.
  const oneOffEvents = useMemo(() => {
    const ev = [];
    filtered.plans.forEach((p) => {
      const m = monthsFromNow(p.date);
      if (m >= 1) ev.push({ id: p.id, m, label: p.label, amount: -(p.amount || 0) });
    });
    filtered.income.filter((i) => i.frequency === "oneoff").forEach((i) => {
      const m = monthsFromNow(i.date);
      if (m >= 1) ev.push({ id: i.id, m, label: i.label, amount: +(i.amount || 0) });
    });
    return ev;
  }, [filtered.plans, filtered.income]);
  const eventsByYear = useMemo(() => {
    const map = new Map();
    oneOffEvents.forEach((e) => {
      const y = Math.min(Math.max(1, Math.ceil(e.m / 12)), projYears);
      const arr = map.get(y) || []; arr.push(e); map.set(y, arr);
    });
    return map;
  }, [oneOffEvents, projYears]);
  const eventsByMonth = useMemo(() => {
    const map = new Map();
    oneOffEvents.forEach((e) => { const arr = map.get(e.m) || []; arr.push(e); map.set(e.m, arr); });
    return map;
  }, [oneOffEvents]);

  // Control points for the goals line: (today, savings) → each bucket → flat.
  // Bucketing (not raw goals) avoids duplicate points when goals share a month/year,
  // so the line always reaches the cluster's top total and the dot sits on it.
  const yearlyCtrl = useMemo(() =>
    cumGoals.length ? [{ m: 0, v: startBal }, ...yearBuckets.map((b) => ({ m: b.year * 12, v: b.cum }))] : [],
    [cumGoals.length, yearBuckets, startBal]);
  const monthlyCtrl = useMemo(() =>
    cumGoals.length ? [{ m: 0, v: startBal }, ...monthBuckets.map((b) => ({ m: b.months, v: b.cum }))] : [],
    [cumGoals.length, monthBuckets, startBal]);

  // Piecewise-linear height of the line at a given month from now.
  const sampleLine = (ctrl, month) => {
    if (ctrl.length < 2) return null;
    if (month <= ctrl[0].m) return ctrl[0].v;
    const last = ctrl[ctrl.length - 1];
    if (month > last.m) return null;
    if (month === last.m) return last.v;
    for (let i = 1; i < ctrl.length; i++) {
      if (month <= ctrl[i].m) {
        const a = ctrl[i - 1], b = ctrl[i];
        const f = (month - a.m) / (b.m - a.m || 1);
        return Math.round(a.v + (b.v - a.v) * f);
      }
    }
    return last.v;
  };

  // one bar per year (end-of-year balance), easier to scan than a curve
  const yearly = useMemo(() => {
    const out = [];
    for (let y = 1; y <= state.settings.projectionYears; y++) {
      const p = projection.data[Math.min(y * 12, projection.data.length - 1)];
      const b = yearBuckets.find((bk) => bk.year === y);
      const evY = eventsByYear.get(y) || [];
      const planCostY = evY.reduce((s, e) => e.amount < 0 ? s + Math.abs(e.amount) : s, 0);
      out.push({ year: y, cal: String(calYear(y)), value: p[chartKey], whatif: p.whatif, goalLine: sampleLine(yearlyCtrl, y * 12), goalsHere: b?.goals, oneOffsHere: evY, planCost: planCostY || 0 });
    }
    return out;
  }, [projection, chartKey, projYears, yearlyCtrl, yearBuckets, eventsByYear, baseYear]);

  // monthly drill-down for a chosen year (12 bars). grain/scaleMode/pickYear are lifted
  // to App so the chosen view persists when the user navigates between tabs.
  const logScale = scaleMode === "log";
  const year = Math.min(Math.max(1, pickYear), state.settings.projectionYears);

  const monthly = useMemo(() => {
    const out = [];
    const start = (year - 1) * 12 + 1;
    for (let i = 0; i < 12; i++) {
      const m = start + i;
      const p = projection.data[Math.min(m, projection.data.length - 1)];
      const d = new Date();
      d.setMonth(d.getMonth() + m);
      const b = monthBuckets.find((bk) => bk.months === m);
      const evM = eventsByMonth.get(m) || [];
      const planCostM = evM.reduce((s, e) => e.amount < 0 ? s + Math.abs(e.amount) : s, 0);
      out.push({ label: d.toLocaleString(undefined, { month: "short" }), cal: d.toLocaleString(undefined, { month: "short", year: "numeric" }), value: p[chartKey], whatif: p.whatif, goalLine: sampleLine(monthlyCtrl, m), goalsHere: b?.goals, oneOffsHere: evM, planCost: planCostM || 0 });
    }
    return out;
  }, [projection, chartKey, year, monthlyCtrl, monthBuckets, eventsByMonth]);

  const isMonthly = grain === "monthly";
  const chartData = isMonthly ? monthly : yearly;
  const xKey = isMonthly ? "label" : "year";
  // label sparsity so the axis never crowds on a phone
  const tickEvery = isMonthly ? 1 : Math.ceil(state.settings.projectionYears / 6);

  // one dot per bucket (year, or month in the monthly view) at its cumulative total.
  // When a bucket holds several goals the dot is labelled with the count instead.
  const goalDots = useMemo(() => {
    if (!cumGoals.length) return [];
    const mk = (b, x) => ({ id: String(x), x, y: b.cum, count: b.goals.length,
      label: b.goals.length === 1 ? b.goals[0].label : t("nGoals", { n: b.goals.length }) });
    if (isMonthly) {
      const startM = (year - 1) * 12 + 1;
      return monthBuckets
        .filter((b) => b.months >= startM && b.months <= startM + 11)
        .map((b) => mk(b, monthly[b.months - startM]?.label));
    }
    return yearBuckets.map((b) => mk(b, b.year));
  }, [cumGoals.length, isMonthly, year, monthly, yearBuckets, monthBuckets]);

  return (
    <div className="flex flex-col gap-5">
      {/* Savings nudge — shown after 30 days of stale starting savings */}
      {savingsNudgeDays && !savingsNudgeDismissed && (
        <div style={{ background: C.claySoft, border: `1px solid ${C.clay}`, borderRadius: 12, padding: "12px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: 13.5, color: C.ink }}>{t("nudge_savings_title")}</div>
            <div style={{ fontSize: 12.5, color: C.sub, marginTop: 2 }}>{t("nudge_savings_body", { n: savingsNudgeDays })}</div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setTab("settings")}
              style={{ background: C.clay, color: "#fff", border: "none", borderRadius: 8, padding: "6px 12px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
              {t("nudge_savings_update")}
            </button>
            <button onClick={onDismissSavingsNudge}
              style={{ background: "transparent", border: `1px solid ${C.clay}`, borderRadius: 8, padding: "6px 10px", fontSize: 13, color: C.clay, cursor: "pointer" }}>
              {t("nudge_savings_dismiss")}
            </button>
          </div>
        </div>
      )}

      {/* headline cards — grouped: cashflow now vs retirement outlook */}
      <div className="flex flex-col gap-4">
        <div>
          <h3 style={{ fontSize: 11, fontWeight: 600, color: C.faint, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 7 }}>{t("ov_now")}</h3>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Stat label={t("stat_savingsNow")}
              value={fmt.format(state.settings.startingSavings)}
              tone={C.green} />
            <Stat label={t("stat_income")}
              value={fmt.format(projection.monthlyIncome)}
              tone={C.green} />
            <Stat label={t("stat_expense")}
              value={fmt.format(projection.monthlyExpense)}
              tone={C.clay} />
            <Stat label={t("stat_surplus")}
              value={fmt.format(projection.monthlyNet)}
              tone={projection.monthlyNet >= 0 ? C.green : C.clay}
              sub={t("inout", { in: fmt.format(projection.monthlyIncome), out: fmt.format(projection.monthlyExpense) })} />
          </div>
        </div>
        <div>
          <h3 style={{ fontSize: 11, fontWeight: 600, color: C.faint, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 7 }}>{t("ov_retire")}</h3>
          <StatGroup items={[
            { label: t("stat_retireNum"), value: fmt.format(retireTarget),
              sub: state.settings.retirementTarget ? t("setManually") : t("xAnnual", { n: state.settings.retireMultiple }) },
            { label: t("stat_retireOn"), value: retireDate ? new Date(retireDate).getFullYear() : "—", tone: C.green,
              sub: retireMonths != null ? t("inYrs", { n: (retireMonths / 12).toFixed(1) }) : t("beyond") },
            { label: t("stat_balanceIn", { n: state.settings.projectionYears }), value: fmt.format(projection.data[projection.data.length - 1][chartKey]),
              sub: state.settings.inflationAdjust ? t("todayDollars") : t("futureDollars") },
          ]} />
        </div>

        {/* Balance sheet row — only shown if user has entered at least one value */}
        {(projection.assetTotal > 0 || state.debts.reduce((s,d) => s + (d.balance||0), 0) > 0 || state.emergency.current > 0 || state.emergency.target > 0) && (() => {
          const totalDebts = state.debts.reduce((s, d) => s + (d.balance || 0), 0);
          const emPct = state.emergency.target > 0 ? Math.min(100, Math.round((state.emergency.current / state.emergency.target) * 100)) : null;
          return (
            <div>
              <h3 style={{ fontSize: 11, fontWeight: 600, color: C.faint, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 7 }}>{t("ov_balance")}</h3>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                <Stat label={t("stat_assets")} value={fmt.format(projection.assetTotal)} tone={C.green} />
                <Stat label={t("stat_debts")} value={fmt.format(totalDebts)} tone={totalDebts > 0 ? C.clay : C.green} />
                <Stat label={t("stat_emergency")}
                  value={emPct != null ? `${emPct}%` : "—"}
                  sub={emPct != null ? `${fmt.format(state.emergency.current)} / ${fmt.format(state.emergency.target)}` : null}
                  tone={emPct != null && emPct >= 100 ? C.green : C.clay} />
              </div>
            </div>
          );
        })()}
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
            <Segmented options={[["log", t("scale_log")], ["linear", t("scale_linear")]]} value={scaleMode} onChange={setScaleMode} />
          </div>
        </div>

        {isMonthly && (
          <div className="mb-3 flex items-center gap-3">
            <button onClick={() => setPickYear((y) => Math.max(1, y - 1))}
              style={{ border: `1px solid ${C.line}`, borderRadius: 7, width: 30, height: 30, color: C.sub, fontSize: 16 }}>–</button>
            <span style={{ fontSize: 13, fontWeight: 600 }}>{monthly[0]?.cal} – {monthly[monthly.length - 1]?.cal}</span>
            <button onClick={() => setPickYear((y) => Math.min(state.settings.projectionYears, y + 1))}
              style={{ border: `1px solid ${C.line}`, borderRadius: 7, width: 30, height: 30, color: C.sub, fontSize: 16 }}>+</button>
          </div>
        )}

        <div style={{ width: "100%", height: 300 }}>
          <ResponsiveContainer>
            <ComposedChart data={chartData} margin={{ top: 8, right: 8, bottom: 4, left: 4 }} barCategoryGap="22%">
              <CartesianGrid stroke={C.line} vertical={false} />
              <XAxis dataKey={xKey} stroke={C.faint} fontSize={11} tickLine={false} axisLine={false}
                interval={tickEvery - 1} tickFormatter={(v) => (isMonthly ? v : String(calYear(v)))} />
              <YAxis tickFormatter={(v) => abbr(v)} stroke={C.faint} fontSize={11} tickLine={false} axisLine={false} width={44}
                scale={logScale ? "log" : "auto"} domain={logScale ? [1000, "auto"] : [0, "auto"]} allowDataOverflow={logScale} />
              <Tooltip
                cursor={{ fill: C.greenSoft, fillOpacity: 0.5 }}
                content={<ChartTooltip fmt={fmt} isMonthly={isMonthly} year={year} />} />

              <Bar dataKey="value" stackId="a" shape={<GreenBar />} maxBarSize={38}>
                {chartData.map((d, i) => (
                  <Cell key={i} fill={d.value < 0 ? "#D95F5F" : d.value >= retireTarget ? C.green : C.belowBar} />
                ))}
              </Bar>
              <Bar dataKey="planCost" stackId="a" radius={[6, 6, 0, 0]} maxBarSize={38} fill="#D95F5F" fillOpacity={0.35} />
              {/* cumulative goals line: today's savings → each goal total → flat */}
              {cumGoals.length > 0 && (
                <Line type="linear" dataKey="goalLine"
                  stroke={C.clay} strokeWidth={2}
                  dot={false} connectNulls={false} isAnimationActive={false} />
              )}
              {/* one dot per bucket; clustered years show a goal count */}
              {goalDots.map((m) => (
                <ReferenceDot key={m.id} x={m.x} y={m.y} r={m.count > 1 ? 6 : 4} fill={C.clay} stroke="#fff" strokeWidth={1.5}
                  label={{ value: m.label, position: "top", fontSize: 9, fill: C.clay }} />
              ))}

              <ReferenceLine y={retireTarget} stroke={C.clay} strokeDasharray="5 4" strokeWidth={1.5}
                label={{ value: t("retirement"), position: "insideTopRight", fontSize: 10, fill: C.clay }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* goals line legend — explains the cumulative goals trajectory */}
        {cumGoals.length > 0 && (
          <div className="mt-2 flex items-center gap-1.5">
            <span style={{ width: 16, borderTop: `2px solid ${C.clay}` }} />
            <p style={{ fontSize: 11, color: C.faint }}>{t("goalPaceHint")}</p>
          </div>
        )}

        {/* milestone strip */}
        <div className="mt-3 grid gap-2" style={{ gridTemplateColumns: `repeat(${milestones.length}, 1fr)` }}>
          {milestones.map((y) => (
            <div key={y} style={{ borderTop: `1px solid ${C.line}`, paddingTop: 8 }}>
              <div style={{ fontSize: 11, color: C.faint }}>{calYear(y)}</div>
              <div style={{ fontWeight: 600, fontSize: 13, ...num }}>{fmtCompact.format(pointAt(y)[chartKey])}</div>
            </div>
          ))}
        </div>
      </Card>

      <WhatIf whatIf={whatIf} setWhatIf={setWhatIf} fmt={fmt} plans={filtered.plans} onGoToPlans={() => setTab("plans")} />
    </div>
  );
}



/* ================================================================== *
 * What-if bottom drawer
 * ================================================================== */
function WhatIf({ whatIf, setWhatIf, fmt, plans = [], onGoToPlans }) {
  const up = (p) => setWhatIf((w) => ({ ...w, ...p }));
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const togglePlan = (id) => {
    const current = whatIf.disabledPlanIds || [];
    const next = current.includes(id)
      ? current.filter((x) => x !== id)
      : [...current, id];
    up({ disabledPlanIds: next });
  };

  const disabledIds = new Set(whatIf.disabledPlanIds || []);
  const disabledCount = plans.filter((p) => disabledIds.has(p.id)).length;
  const hasChanges = whatIf.active && disabledCount > 0;

  return (
    <>
      {/* Floating trigger button — fixed at bottom centre */}
      <div style={{
        position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)",
        zIndex: 50, display: "flex", gap: 8,
      }}>
        <motion.button
          onClick={() => setOpen(true)}
          whileTap={{ scale: 0.96 }}
          style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "10px 20px", borderRadius: 999,
            background: whatIf.active ? C.green : C.ink,
            color: "#fff", fontWeight: 600, fontSize: 14,
            boxShadow: "0 4px 20px rgba(0,0,0,0.18)",
            border: "none", cursor: "pointer",
          }}>
          <GitCompare size={16} />
          What-if
          {hasChanges && (
            <span style={{
              background: "rgba(255,255,255,0.25)", borderRadius: 999,
              padding: "1px 7px", fontSize: 12, fontWeight: 700,
            }}>{disabledCount} off</span>
          )}
        </motion.button>
      </div>

      {/* Backdrop */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={() => setOpen(false)}
            style={{
              position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)",
              zIndex: 60,
            }}
          />
        )}
      </AnimatePresence>

      {/* Drawer */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="drawer"
            initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 380, damping: 36, mass: 0.8 }}
            style={{
              position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 70,
              background: C.card, borderRadius: "20px 20px 0 0",
              boxShadow: "0 -4px 32px rgba(0,0,0,0.14)",
              maxHeight: "70vh", display: "flex", flexDirection: "column",
            }}>

            {/* Drag handle + header */}
            <div style={{ padding: "12px 20px 0", flexShrink: 0 }}>
              <div style={{ width: 36, height: 4, borderRadius: 2, background: C.line, margin: "0 auto 14px" }} />
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <GitCompare size={16} color={C.clay} />
                  <span style={{ fontWeight: 700, fontSize: 16 }}>What-if</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  {hasChanges && (
                    <button onClick={() => up({ disabledPlanIds: [] })}
                      style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 10px", borderRadius: 8, border: `1px solid ${C.line}`, background: "none", color: C.sub, fontSize: 12, cursor: "pointer" }}>
                      <RotateCcw size={12} /> Reset
                    </button>
                  )}
                  <Toggle on={whatIf.active} onChange={(v) => up({ active: v })} />
                  <button onClick={() => setOpen(false)}
                    style={{ background: "none", border: "none", cursor: "pointer", color: C.faint, padding: 4, lineHeight: 1 }}>
                    <X size={20} />
                  </button>
                </div>
              </div>
              <p style={{ fontSize: 12, color: C.faint, marginBottom: 12 }}>
                {whatIf.active
                  ? "Toggle plans on/off — the graph updates live above."
                  : "Turn on, then toggle plans to see how they affect your projection."}
              </p>
            </div>

            {/* Scrollable plan list */}
            <div style={{ overflowY: "auto", padding: "0 20px 32px", flex: 1 }}>
              <AnimatePresence initial={false}>
                {whatIf.active && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                    {plans.length === 0 ? (
                      <div style={{ padding: "16px 0" }}>
                        <p style={{ fontSize: 13, color: C.faint }}>
                          No plans yet.{" "}
                          <button onClick={() => { setOpen(false); onGoToPlans(); }}
                            style={{ color: C.green, fontWeight: 600, background: "none", border: "none", cursor: "pointer", padding: 0, fontSize: 13 }}>
                            Add plans →
                          </button>
                        </p>
                      </div>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column" }}>
                        {plans.map((p, i) => {
                          const on = !disabledIds.has(p.id);
                          const meta = [
                            p.date ? new Date(p.date).toLocaleDateString(undefined, { month: "short", year: "numeric" }) : null,
                            p.amount ? fmt.format(p.amount) : null,
                          ].filter(Boolean).join(" · ");
                          return (
                            <div key={p.id} style={{
                              display: "flex", alignItems: "center", gap: 10,
                              padding: "8px 0",
                              borderTop: i === 0 ? "none" : `1px solid ${C.line}`,
                              opacity: on ? 1 : 0.5,
                              transition: "opacity 0.2s",
                            }}>
                              <Toggle on={on} onChange={() => togglePlan(p.id)} />
                              <span style={{
                                flex: 1, minWidth: 0, fontSize: 13, fontWeight: 500,
                                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                                color: on ? C.ink : C.sub,
                                textDecoration: on ? "none" : "line-through",
                              }}>
                                {p.label || "Untitled"}
                              </span>
                              {meta && (
                                <span style={{ fontSize: 12, color: C.faint, whiteSpace: "nowrap", ...num }}>{meta}</span>
                              )}
                            </div>
                          );
                        })}
                        <button onClick={() => { setOpen(false); onGoToPlans(); }}
                          style={{ marginTop: 4, fontSize: 12, color: C.sub, background: "none", border: "none", cursor: "pointer", textAlign: "left", padding: "4px 0" }}>
                          Manage plans →
                        </button>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

/* ================================================================== *
 * Plans section — plans with optional sub-item breakdown
 * ================================================================== */
function PlansSection({ plans, onAdd, onUpdate, onDelete, fmt }) {
  const [openId, setOpenId] = useState(null);
  const prevIds = useRef(new Set(plans.map((p) => p.id)));

  useEffect(() => {
    const added = plans.find((p) => !prevIds.current.has(p.id));
    if (added) setOpenId(added.id);
    prevIds.current = new Set(plans.map((p) => p.id));
  }, [plans]);

  const sorted = [...plans].sort((a, b) => (a.date || "").localeCompare(b.date || ""));

  const addSubItem = (plan) => {
    const newItem = { id: uid(), label: "", amount: 0, date: plan.date || new Date().toISOString().slice(0, 10) };
    onUpdate(plan.id, { items: [...(plan.items || []), newItem] });
  };
  const updateSubItem = (plan, itemId, patch) =>
    onUpdate(plan.id, { items: (plan.items || []).map((it) => it.id === itemId ? { ...it, ...patch } : it) });
  const deleteSubItem = (plan, itemId) =>
    onUpdate(plan.id, { items: (plan.items || []).filter((it) => it.id !== itemId) });

  return (
    <Card>
      <div className="mb-3 flex items-start justify-between">
        <div>
          <h2 style={{ fontWeight: 600, fontSize: 15 }}>{t("title_plans")}</h2>
          <p style={{ color: C.faint, fontSize: 12, marginTop: 2 }}>{t("sub_plans")}</p>
        </div>
        <button onClick={onAdd}
          className="flex items-center gap-1 rounded-md px-2.5 py-1.5 text-sm"
          style={{ background: C.green, color: "#fff" }}>
          <Plus size={15} /> {t("add")}
        </button>
      </div>

      {plans.length === 0 && (
        <p style={{ color: C.faint, fontSize: 13, padding: "8px 0" }}>{t("empty")}</p>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
        {sorted.map((plan) => {
          const isOpen = openId === plan.id;
          const items = plan.items || [];
          const hasItems = items.length > 0;
          const committed = items.reduce((s, it) => s + (it.amount || 0), 0);
          const budget = plan.amount || 0;
          const remaining = budget - committed;
          const pct = budget > 0 ? Math.min(1, committed / budget) : 0;

          return (
            <div key={plan.id} style={{
              borderTop: `1px solid ${C.line}`,
              background: isOpen ? C.bg : "transparent",
              borderRadius: isOpen ? 12 : 0,
              margin: isOpen ? "6px 0" : 0,
              padding: isOpen ? "0 12px" : 0,
              border: isOpen ? `1px solid ${C.line}` : undefined,
              borderTop: isOpen ? undefined : `1px solid ${C.line}`,
            }}>
              {/* Plan header row */}
              <button onClick={() => setOpenId(isOpen ? null : plan.id)}
                className="flex w-full items-center justify-between gap-2 py-3 text-left">
                <span style={{ fontWeight: isOpen ? 600 : 500, fontSize: 14, color: isOpen ? C.green : C.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>
                  {plan.label || "—"}
                  {hasItems && (
                    <span style={{ marginLeft: 6, fontSize: 11, fontWeight: 500, color: C.faint }}>
                      {items.length} item{items.length !== 1 ? "s" : ""}
                    </span>
                  )}
                </span>
                <span className="flex shrink-0 items-center gap-2" style={{ color: C.sub, fontSize: 13 }}>
                  <span style={num}>{fmt.format(hasItems ? committed : budget)}</span>
                  {hasItems && budget > 0 && (
                    <span style={{ fontSize: 11, color: remaining < 0 ? "#D95F5F" : C.green, fontWeight: 600, ...num }}>
                      / {fmt.format(budget)}
                    </span>
                  )}
                  <ChevronDown size={16} style={{ color: isOpen ? C.green : C.faint, transition: "transform .15s", transform: isOpen ? "rotate(180deg)" : "none" }} />
                </span>
              </button>

              {/* Expanded content */}
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }} transition={SNAP} style={{ overflow: "hidden" }}>
                    <div style={{ borderTop: `1px solid ${C.line}`, paddingTop: 12, paddingBottom: 14 }}>

                      {/* Plan fields */}
                      <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(140px,1fr))", marginBottom: 14 }}>
                        <div>
                          <div style={{ fontSize: 12, color: C.faint, marginBottom: 4 }}>{t("col_plan")}</div>
                          <input value={plan.label} onChange={(e) => onUpdate(plan.id, { label: e.target.value })}
                            placeholder={t("col_plan")}
                            style={{ width: "100%", fontSize: 13, border: `1px solid ${C.line}`, borderRadius: 9, padding: "6px 10px", background: C.card, color: C.ink }} />
                        </div>
                        <div>
                          <div style={{ fontSize: 12, color: C.faint, marginBottom: 4 }}>{hasItems ? "Budget" : t("col_amount")}</div>
                          <input type="number" value={plan.amount || ""} onChange={(e) => onUpdate(plan.id, { amount: parseFloat(e.target.value) || 0 })}
                            style={{ width: "100%", fontSize: 13, border: `1px solid ${C.line}`, borderRadius: 9, padding: "6px 10px", background: C.card, color: C.ink, textAlign: "right", ...num }} />
                        </div>
                        <div>
                          <div style={{ fontSize: 12, color: C.faint, marginBottom: 4 }}>{t("col_when")}</div>
                          <input type="date" value={plan.date || ""} onChange={(e) => onUpdate(plan.id, { date: e.target.value })}
                            style={{ width: "100%", fontSize: 13, border: `1px solid ${C.line}`, borderRadius: 9, padding: "6px 10px", background: C.card, color: C.ink }} />
                        </div>
                        <div>
                          <div style={{ fontSize: 12, color: C.faint, marginBottom: 4 }}>{t("col_saved")}</div>
                          <input type="number" value={plan.current || ""} onChange={(e) => onUpdate(plan.id, { current: parseFloat(e.target.value) || 0 })}
                            style={{ width: "100%", fontSize: 13, border: `1px solid ${C.line}`, borderRadius: 9, padding: "6px 10px", background: C.card, color: C.ink, textAlign: "right", ...num }} />
                        </div>
                      </div>

                      {/* Sub-items section */}
                      {hasItems && (
                        <>
                          {/* Progress bar */}
                          <div style={{ marginBottom: 10 }}>
                            <div style={{ height: 6, borderRadius: 99, background: C.line, overflow: "hidden" }}>
                              <motion.div animate={{ width: `${pct * 100}%` }} transition={{ type: "spring", stiffness: 200, damping: 28 }}
                                style={{ height: "100%", borderRadius: 99, background: pct >= 1 ? "#D95F5F" : C.green }} />
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
                              <span style={{ fontSize: 12, color: C.faint, ...num }}>{fmt.format(committed)} committed</span>
                              <span style={{ fontSize: 12, fontWeight: 600, color: remaining < 0 ? "#D95F5F" : C.green, ...num }}>
                                {remaining < 0 ? "−" : ""}{fmt.format(Math.abs(remaining))} {remaining < 0 ? "over budget" : "remaining"}
                              </span>
                            </div>
                          </div>

                          {/* Sub-item rows */}
                          <div style={{ borderRadius: 10, border: `1px solid ${C.line}`, overflow: "hidden", marginBottom: 8 }}>
                            {items.map((it, i) => (
                              <div key={it.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 10px", borderTop: i === 0 ? "none" : `1px solid ${C.line}`, background: C.card }}>
                                <input value={it.label} onChange={(e) => updateSubItem(plan, it.id, { label: e.target.value })}
                                  placeholder="Item"
                                  style={{ flex: 1, fontSize: 13, border: "none", background: "transparent", outline: "none", color: C.ink, minWidth: 60 }} />
                                <input type="number" value={it.amount || ""} onChange={(e) => updateSubItem(plan, it.id, { amount: parseFloat(e.target.value) || 0 })}
                                  placeholder="0"
                                  style={{ width: 80, fontSize: 13, border: `1px solid ${C.line}`, borderRadius: 7, padding: "4px 8px", background: C.bg, color: C.ink, textAlign: "right", ...num }} />
                                <input type="date" value={it.date || ""} onChange={(e) => updateSubItem(plan, it.id, { date: e.target.value })}
                                  style={{ fontSize: 12, border: `1px solid ${C.line}`, borderRadius: 7, padding: "4px 8px", background: C.bg, color: C.ink }} />
                                <button onClick={() => deleteSubItem(plan, it.id)} style={{ color: C.faint, background: "none", border: "none", cursor: "pointer", flexShrink: 0 }}>
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            ))}
                          </div>
                        </>
                      )}

                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <button onClick={() => addSubItem(plan)}
                          className="flex items-center gap-1 text-sm"
                          style={{ color: C.green, fontWeight: 600, background: "none", border: "none", cursor: "pointer", padding: "2px 0" }}>
                          <Plus size={13} /> Add sub-expense
                        </button>
                        <button onClick={() => onDelete(plan.id)} className="flex items-center gap-1 text-sm" style={{ color: C.faint, background: "none", border: "none", cursor: "pointer" }}>
                          <Trash2 size={14} /> {t("delete")}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

/* ================================================================== *
 * Generic list section (income / expenses / one-offs / goals / etc.)
 * ================================================================== */
function ListSection({ title, subtitle, items, columns, onAdd, onUpdate, onDelete, fmt, presets, onAddPreset, sortByDate }) {
  const [openId, setOpenId] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const prevIds = useRef(new Set(items.map((i) => i.id)));
  useEffect(() => {
    // open whichever row was just added, wherever it lands after sorting
    const added = items.find((i) => !prevIds.current.has(i.id));
    if (added) setOpenId(added.id);
    prevIds.current = new Set(items.map((i) => i.id));
  }, [items]);
  // dated items (e.g. one-offs) sorted soonest-first; undated (recurring) keep their order up top
  let rows = items;
  if (sortByDate) {
    const undated = items.filter((i) => !i.date);
    const dated = items.filter((i) => i.date).sort((a, b) => a.date.localeCompare(b.date));
    rows = [...undated, ...dated];
  }
  const hasPresets = (presets || []).length > 0;
  // hide a suggestion once an item with that name already exists
  const have = new Set(items.map((it) => (it.label || "").trim().toLowerCase()));
  const suggestions = (presets || []).filter((p) => !have.has(t(p.key).trim().toLowerCase()));
  // group suggestions by category (expenses) or income group, keeping first-seen order
  const groupOrder = [];
  const grouped = {};
  for (const p of suggestions) {
    const g = p.group || p.catKey || "";
    if (!grouped[g]) { grouped[g] = []; groupOrder.push(g); }
    grouped[g].push(p);
  }
  const addBlank = () => { setShowAdd(false); onAdd(); };
  const addPreset = (p) => { setShowAdd(false); onAddPreset(p); };
  return (
    <Card>
      <div className="mb-1 flex items-start justify-between">
        <div>
          <h2 style={{ fontWeight: 600, fontSize: 15 }}>{title}</h2>
          <p style={{ color: C.faint, fontSize: 12, marginTop: 2, maxWidth: 560 }}>{subtitle}</p>
        </div>
        <button onClick={() => (hasPresets ? setShowAdd((v) => !v) : onAdd())}
          className="flex items-center gap-1 rounded-md px-2.5 py-1.5 text-sm"
          style={{ background: C.green, color: "#fff" }}>
          <Plus size={15} /> {t("add")}
          {hasPresets && <ChevronDown size={14} style={{ transition: "transform .15s", transform: showAdd ? "rotate(180deg)" : "none" }} />}
        </button>
      </div>

      {/* Add menu — blank entry + presets grouped by category */}
      <AnimatePresence initial={false}>
      {hasPresets && showAdd && (
        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }} transition={SNAP} style={{ overflow: "hidden" }}>
        <div className="mt-3" style={{ border: `1px solid ${C.line}`, borderRadius: 12, padding: 12, background: C.bg }}>
          <button onClick={addBlank}
            className="flex w-full items-center gap-1.5 rounded-md px-2.5 py-2 text-sm"
            style={{ border: `1px dashed ${C.line}`, color: C.sub, background: C.card }}>
            <Plus size={14} /> {t("presetBlank")}
          </button>
          {suggestions.length > 0 && (
            <p style={{ fontSize: 11.5, color: C.faint, margin: "10px 0 2px" }}>{t("presetHint")}</p>
          )}
          {groupOrder.map((g) => (
            <div key={g} className="mt-2.5">
              {g && <div style={{ fontSize: 11, fontWeight: 600, color: C.faint, textTransform: "uppercase", letterSpacing: "0.03em", marginBottom: 5 }}>{t(g)}</div>}
              <div className="flex flex-wrap gap-1.5">
                {grouped[g].map((p) => (
                  <button key={p.key} onClick={() => addPreset(p)}
                    className="flex items-center gap-1 rounded-full"
                    style={{ border: `1px solid ${C.line}`, background: C.greenSoft, color: C.ink,
                      fontSize: 12, padding: "4px 10px" }}>
                    <Plus size={12} color={C.green} /> {t(p.key)}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
        </motion.div>
      )}
      </AnimatePresence>

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
            {rows.map((it) => (
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
        {rows.map((it) => {
          const open = openId === it.id;
          const amount = it.amount ?? it.target ?? it.value ?? it.balance;
          return (
            <div key={it.id}
              style={open
                ? { background: C.bg, border: `1px solid ${C.line}`, borderRadius: 12, padding: "0 12px", margin: "8px 0", boxShadow: shadowSoft }
                : { borderBottom: `1px solid ${C.line}` }}>
              <button onClick={() => setOpenId(open ? null : it.id)}
                className="flex w-full items-center justify-between gap-2 py-3 text-left">
                <span style={{ fontWeight: open ? 600 : 500, fontSize: 14, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: open ? C.green : C.ink }}>
                  {it.label || "—"}
                </span>
                <span className="flex shrink-0 items-center gap-2" style={{ color: C.sub, fontSize: 13 }}>
                  {amount != null && (
                    <span style={num}>
                      {fmt.format(amount)}
                      {it.frequency && <span style={{ color: C.faint }}>{freqSuffix(it.frequency)}</span>}
                    </span>
                  )}
                  <ChevronDown size={16}
                    style={{ color: open ? C.green : C.faint, transition: "transform .15s", transform: open ? "rotate(180deg)" : "none" }} />
                </span>
              </button>
              <AnimatePresence initial={false}>
                {open && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={SNAP}
                    style={{ overflow: "hidden" }}>
                    <div className="pb-3" style={{ borderTop: `1px solid ${C.line}`, paddingTop: 10 }}>
                      {columns.map((c) => (
                        <div key={c.key} className="mb-2.5 flex flex-col gap-1">
                          <span style={{ color: C.faint, fontSize: 12 }}>{c.label}</span>
                          <div className="mfield">{c.render(it, (patch) => onUpdate(it.id, patch))}</div>
                        </div>
                      ))}
                      <div className="flex items-center justify-between">
                        <button onClick={() => onDelete(it.id)} className="flex items-center gap-1 text-sm"
                          style={{ color: C.faint }} title={t("delete")}>
                          <Trash2 size={15} /> {t("delete")}
                        </button>
                        <button onClick={() => setOpenId(null)} className="flex items-center gap-1 rounded-md px-3 py-1.5 text-sm"
                          style={{ background: C.greenSoft, color: C.green, fontWeight: 600 }}>
                          <Check size={15} /> {t("done")}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

// Short period label shown after an amount, e.g. "/mo", "/wk".
const FREQ_SUFFIX = { monthly: "perMo", weekly: "perWk", quarterly: "perYr", annual: "perYr", daily: "perDay", fortnightly: "perFn", oneoff: "perOnce" };
const freqSuffix = (frequency) => (FREQ_SUFFIX[frequency] ? t(FREQ_SUFFIX[frequency]) : "");

/* ---- column definitions ---- */
const inputCell = (val, onChange, props = {}) => (
  <input value={val} onChange={(e) => onChange(e.target.value)}
    style={{ border: `1px solid ${C.line}`, borderRadius: 9, padding: "5px 8px", width: props.w || 130, fontSize: 13, ...(props.num ? num : {}) }}
    {...props} />
);
const moneyCell = (val, onChange) => (
  <input type="number" value={val === 0 ? "" : val} placeholder="0"
    onChange={(e) => onChange(+e.target.value || 0)}
    style={{ border: `1px solid ${C.line}`, borderRadius: 9, padding: "5px 8px", width: 110, fontSize: 13, textAlign: "right", ...num }} />
);
const selectCell = (val, onChange, opts) => (
  <select value={val} onChange={(e) => onChange(e.target.value)}
    style={{ border: `1px solid ${C.line}`, borderRadius: 9, padding: "5px 8px", fontSize: 13, background: C.card }}>
    {opts.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
  </select>
);
// Category picker: standard + custom categories, plus a "+ Add category…" option
// that swaps the select for a text input so the user can name their own.
function CategoryCell({ value, extra, onChange }) {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState("");
  const cellStyle = { border: `1px solid ${C.line}`, borderRadius: 9, padding: "5px 8px", fontSize: 13, background: C.card, width: 150 };

  if (adding) {
    const commit = () => {
      const v = draft.trim();
      setAdding(false); setDraft("");
      if (v) onChange(v);
    };
    return (
      <input autoFocus value={draft} placeholder={t("newCategory")}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
          else if (e.key === "Escape") { setAdding(false); setDraft(""); }
        }}
        style={cellStyle} />
    );
  }
  return (
    <select value={value}
      onChange={(e) => { e.target.value === ADD_CUSTOM ? setAdding(true) : onChange(e.target.value); }}
      style={cellStyle}>
      {categoryOpts(value, extra).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      <option disabled>──────────</option>
      <option value={ADD_CUSTOM}>{t("addCategory")}</option>
    </select>
  );
}
const freqOpts = () => [
  { value: "monthly", label: t("freq_monthly") },
  { value: "fortnightly", label: t("freq_fortnightly") },
  { value: "quarterly", label: t("freq_quarterly") },
  { value: "annual", label: t("freq_annual") },
  { value: "weekly", label: t("freq_weekly") },
  { value: "daily", label: t("freq_daily") },
  { value: "oneoff", label: t("freq_oneoff") },
];
const recurringFreqOpts = () => freqOpts().filter((o) => o.value !== "oneoff");

// Expense categories offered as a dropdown so users pick instead of typing.
const CAT_KEYS = ["cat_housing", "cat_utilities", "cat_food", "cat_transport", "cat_health", "cat_debt", "cat_lifestyle", "cat_other"];
const ADD_CUSTOM = "__add_custom__"; // sentinel option that opens the "type your own" input
const categoryOpts = (current, extra = []) => {
  // standard categories first, then any custom ones the user has already added,
  // then the current value (so old/imported data stays selectable) — de-duplicated.
  const seen = new Set();
  const opts = [];
  for (const v of [...CAT_KEYS.map((k) => t(k)), ...extra, current].filter(Boolean)) {
    if (!seen.has(v)) { seen.add(v); opts.push({ value: v, label: v }); }
  }
  return opts;
};

/* ---- preset suggestions ---- */
// Common items grouped so new users can tap to add instead of starting blank.
// `amount: 0` on purpose — the user fills in their own number.
const INCOME_PRESETS = [
  // Employment
  { key: "p_salary", group: "ig_work", frequency: "monthly" },
  { key: "p_freelance", group: "ig_work", frequency: "monthly" },
  { key: "p_business", group: "ig_work", frequency: "monthly" },
  { key: "p_bonus", group: "ig_work", frequency: "annual" },
  // Investments
  { key: "p_rental", group: "ig_invest", frequency: "monthly" },
  { key: "p_dividends", group: "ig_invest", frequency: "monthly" },
  { key: "p_interest", group: "ig_invest", frequency: "monthly" },
  // Other
  { key: "p_benefit", group: "ig_other", frequency: "monthly" },
  { key: "p_pension", group: "ig_other", frequency: "monthly" },
  { key: "p_childsupport", group: "ig_other", frequency: "monthly" },
];
const EXPENSE_PRESETS = [
  // Housing & bills
  { key: "p_rent", catKey: "cat_housing", frequency: "monthly" },
  { key: "p_utilities", catKey: "cat_utilities", frequency: "monthly" },
  { key: "p_water", catKey: "cat_utilities", frequency: "monthly" },
  { key: "p_internet", catKey: "cat_utilities", frequency: "monthly" },
  { key: "p_phone", catKey: "cat_utilities", frequency: "monthly" },
  { key: "p_homeins", catKey: "cat_housing", frequency: "annual" },
  // Food
  { key: "p_groceries", catKey: "cat_food", frequency: "monthly" },
  { key: "p_dining", catKey: "cat_food", frequency: "monthly" },
  // Transport
  { key: "p_fuel", catKey: "cat_transport", frequency: "monthly" },
  { key: "p_transit", catKey: "cat_transport", frequency: "monthly" },
  { key: "p_carins", catKey: "cat_transport", frequency: "monthly" },
  { key: "p_rego", catKey: "cat_transport", frequency: "annual" },
  // Debt & loans
  { key: "p_homeloan", catKey: "cat_debt", frequency: "monthly" },
  { key: "p_carloan", catKey: "cat_debt", frequency: "monthly" },
  { key: "p_personalloan", catKey: "cat_debt", frequency: "monthly" },
  { key: "p_studentloan", catKey: "cat_debt", frequency: "monthly" },
  { key: "p_creditcard", catKey: "cat_debt", frequency: "monthly" },
  { key: "p_bnpl", catKey: "cat_debt", frequency: "fortnightly" },
  // Health
  { key: "p_healthins", catKey: "cat_health", frequency: "monthly" },
  { key: "p_gym", catKey: "cat_health", frequency: "monthly" },
  // Housing extras
  { key: "p_strata", catKey: "cat_housing", frequency: "quarterly" },
  // Lifestyle
  { key: "p_subs", catKey: "cat_lifestyle", frequency: "monthly" },
  { key: "p_childcare", catKey: "cat_lifestyle", frequency: "monthly" },
  { key: "p_gifts", catKey: "cat_lifestyle", frequency: "monthly" },
  { key: "p_insurance", catKey: "cat_health", frequency: "monthly" },
  { key: "p_savings", catKey: "cat_lifestyle", frequency: "monthly" },
];

// A small "starter kit" of the most common items, pre-filled at $0 so a new user
// who picks "Add my income" sees rows to edit instead of a blank page.
const STARTER_INCOME = [
  { key: "p_salary", frequency: "monthly" },
  { key: "p_freelance", frequency: "monthly" },
];
const STARTER_EXPENSES = [
  { key: "p_rent", catKey: "cat_housing", frequency: "monthly" },
  { key: "p_groceries", catKey: "cat_food", frequency: "monthly" },
  { key: "p_utilities", catKey: "cat_utilities", frequency: "monthly" },
  { key: "p_transit", catKey: "cat_transport", frequency: "monthly" },
  { key: "p_subs", catKey: "cat_lifestyle", frequency: "monthly" },
];

const incomeCols = () => [
  { key: "label", label: t("col_source"), render: (it, u) => inputCell(it.label, (v) => u({ label: v }), { w: 150, placeholder: t("col_source") }) },
  { key: "amount", label: t("col_amount"), render: (it, u) => moneyCell(it.amount, (v) => u({ amount: v })) },
  { key: "frequency", label: t("col_howOften"), render: (it, u) => selectCell(it.frequency, (v) => u({ frequency: v }), freqOpts()) },
  { key: "date", label: t("col_dateOneoff"), render: (it, u) => it.frequency === "oneoff" ? inputCell(it.date || isoIn(3), (v) => u({ date: v }), { type: "date", w: 140 }) : <span style={{ color: C.faint }}>—</span> },
];
const expenseCols = (items = []) => {
  // categories already in use (incl. custom ones) so they appear in every row's dropdown
  const usedCats = [...new Set(items.map((i) => i.category).filter(Boolean))];
  return [
    { key: "label", label: t("col_item"), render: (it, u) => inputCell(it.label, (v) => u({ label: v }), { w: 150, placeholder: t("col_item") }) },
    { key: "amount", label: t("col_amount"), render: (it, u) => moneyCell(it.amount, (v) => u({ amount: v })) },
    { key: "frequency", label: t("col_howOften"), render: (it, u) => selectCell(it.frequency, (v) => u({ frequency: v }), recurringFreqOpts()) },
    { key: "category", label: t("col_category"), render: (it, u) => <CategoryCell value={it.category} extra={usedCats} onChange={(v) => u({ category: v })} /> },
  ];
};
const planCols = () => [
  { key: "label", label: t("col_plan"), render: (it, u) => inputCell(it.label, (v) => u({ label: v }), { w: 160, placeholder: t("col_plan") }) },
  { key: "amount", label: t("col_amount"), render: (it, u) => moneyCell(it.amount, (v) => u({ amount: v })) },
  { key: "date", label: t("col_when"), render: (it, u) => inputCell(it.date, (v) => u({ date: v }), { type: "date", w: 140 }) },
  { key: "current", label: t("col_saved"), render: (it, u) => moneyCell(it.current || 0, (v) => u({ current: v })) },
];
const assetCols = () => [
  { key: "label", label: t("col_asset"), render: (it, u) => inputCell(it.label, (v) => u({ label: v }), { w: 160, placeholder: t("col_asset") }) },
  { key: "value", label: t("col_value"), render: (it, u) => moneyCell(it.value, (v) => u({ value: v })) },
];
const debtCols = () => [
  { key: "label", label: t("col_debt"), render: (it, u) => inputCell(it.label, (v) => u({ label: v }), { w: 150, placeholder: t("col_debt") }) },
  { key: "balance", label: t("col_balance"), render: (it, u) => moneyCell(it.balance, (v) => u({ balance: v })) },
  { key: "annualRate", label: t("col_rate"), render: (it, u) => <input type="number" value={it.annualRate} onChange={(e) => u({ annualRate: +e.target.value || 0 })} style={{ border: `1px solid ${C.line}`, borderRadius: 9, padding: "5px 8px", width: 70, fontSize: 13, textAlign: "right", ...num }} /> },
  { key: "monthlyPayment", label: t("col_monthlyPay"), render: (it, u) => moneyCell(it.monthlyPayment, (v) => u({ monthlyPayment: v })) },
];

/* ================================================================== *
 * Income / spending breakdown
 * ================================================================== */
// Factor to convert a monthly figure into the chosen period.
const PERIOD_FACTOR = { day: 12 / 365, week: 12 / 52, month: 1, year: 12 };
const PERIOD_SUFFIX = { day: "perDay", week: "perWk", month: "perMo", year: "perYr" };
const BREAKDOWN_PALETTE = [C.green, C.optimistic, C.clay, C.conservative, "#8AA39B", "#D9A66C"];
const byCategory = (e) => e.category || "Other";
const bySource = (it) => it.label || "—";

// Generic recurring-amount breakdown with a Day/Week/Month/Year selector.
// `groupBy` returns the bucket name for an item; one-off items are ignored.
function Breakdown({ items, groupBy, title, totalLabel, fmt }) {
  const [period, setPeriod] = useState("month");
  const factor = PERIOD_FACTOR[period];
  const groups = useMemo(() => {
    const m = {};
    items.forEach((it) => {
      if (it.frequency === "oneoff") return;
      m[groupBy(it)] = (m[groupBy(it)] || 0) + monthlyOf(it.amount, it.frequency);
    });
    return Object.entries(m).map(([name, value]) => ({ name, value }));
  }, [items, groupBy]);
  if (!groups.length) return null;
  const total = groups.reduce((s, g) => s + g.value, 0);
  const scaled = groups
    .map((g) => ({ name: g.name, value: Math.round(g.value * factor) }))
    .sort((a, b) => b.value - a.value);
  const suffix = t(PERIOD_SUFFIX[period]);
  return (
    <Card>
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
        <div>
          <h2 style={{ fontWeight: 600, fontSize: 15 }}>{title}</h2>
          <div style={{ marginTop: 4 }}>
            <span style={{ fontSize: 12, color: C.sub }}>{totalLabel}: </span>
            <span style={{ fontSize: 18, fontWeight: 700, ...num }}>{fmt.format(Math.round(total * factor))}</span>
            <span style={{ fontSize: 13, color: C.faint }}>{suffix}</span>
          </div>
        </div>
        <Segmented fluid
          options={[["day", t("unit_day")], ["week", t("unit_week")], ["month", t("unit_month")], ["year", t("unit_year")]]}
          value={period} onChange={setPeriod} />
      </div>
      <div className="mt-3" style={{ width: "100%", height: Math.max(120, scaled.length * 38 + 20) }}>
        <ResponsiveContainer>
          <BarChart data={scaled} layout="vertical" margin={{ left: 4, right: 56, top: 4, bottom: 4 }}>
            <XAxis type="number" hide />
            <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 12, fill: C.sub }} axisLine={false} tickLine={false} />
            <Tooltip formatter={(v) => `${fmt.format(v)}${suffix}`} cursor={{ fill: C.greenSoft }}
              contentStyle={{ borderRadius: 10, border: `1px solid ${C.line}`, fontSize: 12 }} />
            <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={20}
              label={{ position: "right", fontSize: 11, fill: C.sub, formatter: (v) => fmt.format(v) }}>
              {scaled.map((_, i) => <Cell key={i} fill={BREAKDOWN_PALETTE[i % BREAKDOWN_PALETTE.length]} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

/* ================================================================== *
 * Plans tracker — overview card showing progress + status for each plan
 * ================================================================== */
function PlansTracker({ plans, fmt, pool }) {
  if (!plans.length) return null;
  const now = new Date();
  const sorted = [...plans].sort((a, b) => (a.date || "9999").localeCompare(b.date || "9999"));

  // waterfall: pour current savings into goals soonest-due first
  let remaining = pool || 0;
  const allocated = {};
  for (const p of sorted) {
    const a = Math.max(0, Math.min(remaining, p.amount || 0));
    allocated[p.id] = a;
    remaining -= a;
  }

  return (
    <Card>
      <div className="flex items-center gap-2" style={{ marginBottom: 12 }}>
        <Target size={16} color={C.green} />
        <h2 style={{ fontWeight: 600, fontSize: 15 }}>{t("tab_plans")}</h2>
      </div>
      <div className="flex flex-col">
        {sorted.map((p, i) => {
          const target = p.amount || 0;
          const current = Math.min(target, (p.current || 0) + (allocated[p.id] || 0));
          const pct = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;
          const done = target > 0 && current >= target;
          const [y, mo, d] = p.date ? p.date.split("-").map(Number) : [];
          const planDate = p.date ? new Date(y, mo - 1, d) : null;
          const overdue = !done && planDate && planDate < now;
          const dateLabel = planDate ? planDate.toLocaleDateString(undefined, { month: "short", year: "numeric" }) : null;

          let statusLabel, statusColor;
          if (done)        { statusLabel = t("g_done");    statusColor = C.green; }
          else if (overdue){ statusLabel = t("g_overdue"); statusColor = "#D95F5F"; }
          else             { statusLabel = `${pct}%`;      statusColor = C.sub; }

          return (
            <div key={p.id} style={{ borderTop: i ? `1px solid ${C.line}` : "none", paddingTop: i ? 14 : 0, marginTop: i ? 14 : 0 }}>
              <div className="flex items-center justify-between gap-2" style={{ marginBottom: 6 }}>
                <span style={{ fontWeight: 600, fontSize: 13.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.label || "—"}</span>
                <span style={{ flexShrink: 0, fontSize: 12, color: overdue ? "#D95F5F" : C.sub }}>{dateLabel}</span>
              </div>
              <div style={{ height: 6, background: C.line, borderRadius: 99 }}>
                <div style={{ width: `${pct}%`, height: "100%", background: done ? C.green : C.optimistic, borderRadius: 99, transition: "width 0.3s" }} />
              </div>
              <div className="flex items-center justify-between" style={{ marginTop: 5, fontSize: 11 }}>
                <span style={{ color: C.faint, ...num }}>{fmt.format(current)} / {fmt.format(target)}</span>
                <span style={{ fontWeight: 500, color: done ? C.green : overdue ? "#D95F5F" : C.sub }}>{statusLabel}</span>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

/* ================================================================== *
 * Goal progress — tracking + "what to tackle first" (urgency ranking)
 * ================================================================== */
function GoalProgress({ goals, fmt, pool }) {
  if (!goals.length) return null;
  const now = new Date();
  // soonest target date on top; undated goals go last
  const sorted = [...goals].sort((a, b) => (a.date || "9999").localeCompare(b.date || "9999"));
  // auto-fund: pour current savings into goals, soonest-due first
  let remaining = pool || 0;
  const allocated = {};
  for (const g of sorted) {
    const a = Math.max(0, Math.min(remaining, g.amount || 0));
    allocated[g.id] = a;
    remaining -= a;
  }
  return (
    <Card>
      <h2 style={{ fontWeight: 600, fontSize: 15 }}>{t("goalsRankTitle")}</h2>
      <p style={{ color: C.faint, fontSize: 12, marginTop: 2 }}>{t("goalAutoHint", { a: fmt.format(pool || 0) })}</p>
      <div className="mt-3 flex flex-col">
        {sorted.map((g, i) => {
          const target = g.amount || 0;
          const current = g.current != null ? Math.min(g.current + allocated[g.id], target) : allocated[g.id] || 0;
          const pct = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;
          const done = target > 0 && current >= target;
          const [gy, gmo, gd] = g.date ? g.date.split("-").map(Number) : [];
          const planDate = g.date ? new Date(gy, gmo - 1, gd) : null;
          const overdue = !done && planDate && planDate < now;
          const dateLabel = planDate ? planDate.toLocaleDateString(undefined, { month: "short", year: "numeric" }) : "—";
          return (
            <div key={g.id} style={{ borderTop: i ? `1px solid ${C.line}` : "none", paddingTop: i ? 12 : 0, marginTop: i ? 12 : 0 }}>
              <div className="flex items-center justify-between gap-2">
                <span style={{ fontWeight: 600, fontSize: 14, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{g.label || "—"}</span>
                <span style={{ flexShrink: 0, fontSize: 12.5, color: overdue ? C.clay : C.sub }}>{dateLabel}</span>
              </div>
              <div style={{ height: 8, background: C.line, borderRadius: 99, marginTop: 7 }}>
                <div style={{ width: `${pct}%`, height: "100%", background: C.green, borderRadius: 99 }} />
              </div>
              <div className="flex items-center justify-between" style={{ marginTop: 4, fontSize: 12 }}>
                <span style={{ color: C.faint, ...num }}>{fmt.format(current)} / {fmt.format(target)}</span>
                <span style={{ fontWeight: 500 }}>
                  {done ? <span style={{ color: C.green }}>{t("g_done")}</span> : <span style={{ color: C.sub }}>{pct}%</span>}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

/* ================================================================== *
 * Emergency fund
 * ================================================================== */
function EmergencyCard({ emergency, setEmergency, fmt, monthlyExpenses }) {
  const pct = emergency.target ? Math.min(100, Math.round((emergency.current / emergency.target) * 100)) : 0;
  const suggest3 = Math.round(monthlyExpenses * 3);
  const suggest6 = Math.round(monthlyExpenses * 6);
  const hasSuggestions = suggest3 > 0;

  return (
    <Card>
      <div className="flex items-center gap-2">
        <ShieldCheck size={16} color={C.green} />
        <h2 style={{ fontWeight: 600, fontSize: 15 }}>{t("emTitle")}</h2>
      </div>
      <p style={{ color: C.faint, fontSize: 12, marginTop: 2 }}>{t("emDesc")}</p>

      {/* 3–6 month rule explainer */}
      <div style={{ background: C.greenSoft, borderRadius: 8, padding: "9px 12px", marginTop: 10, fontSize: 12.5, color: C.ink, lineHeight: 1.55 }}>
        {t("emRule")}
      </div>

      {/* Suggested targets based on their expenses */}
      {hasSuggestions && (
        <div style={{ marginTop: 10, fontSize: 12, color: C.sub }}>
          <span style={{ fontWeight: 500 }}>{t("emSuggest")}</span>
          <div className="mt-1 flex flex-wrap gap-2">
            {[{ label: t("em3mo"), value: suggest3 }, { label: t("em6mo"), value: suggest6 }].map(({ label, value }) => (
              <button key={label} onClick={() => setEmergency({ target: value })}
                style={{
                  border: `1px solid ${emergency.target === value ? C.green : C.line}`,
                  background: emergency.target === value ? C.greenSoft : C.card,
                  color: emergency.target === value ? C.green : C.sub,
                  borderRadius: 8, padding: "4px 10px", fontSize: 12, cursor: "pointer", fontWeight: 500,
                }}>
                {label} — {fmt.format(value)}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-end gap-5">
        <Field label={t("emCurrent")}>
          <input type="number" value={emergency.current} onChange={(e) => setEmergency({ current: +e.target.value || 0 })}
            style={fieldStyle} />
        </Field>
        <Field label={t("emTarget")}>
          <input type="number" value={emergency.target} onChange={(e) => setEmergency({ target: +e.target.value || 0 })}
            style={fieldStyle} />
        </Field>
        {emergency.target > 0 && (
          <div style={{ flex: 1, minWidth: 180 }}>
            <div style={{ fontSize: 12, color: C.sub, marginBottom: 4 }}>{t("emFunded", { pct, a: fmt.format(emergency.current), b: fmt.format(emergency.target) })}</div>
            <div style={{ height: 8, background: C.line, borderRadius: 99 }}>
              <div style={{ width: `${pct}%`, height: "100%", background: pct >= 100 ? C.green : C.optimistic, borderRadius: 99, transition: "width 0.3s" }} />
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}

/* ================================================================== *
 * Settings
 * ================================================================== */
function SettingsPanel({ state, setSettings, setState, onLoadSample, onClearData }) {
  const s = state.settings;

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
            <input type="number" value={s.startingSavings} onChange={(e) => setSettings({ startingSavings: +e.target.value || 0, startingSavingsUpdatedAt: new Date().toISOString().slice(0, 10) })} style={fieldStyle} />
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
        <h2 style={{ fontWeight: 600, fontSize: 15 }}>{t("data_title")}</h2>
        <p style={{ color: C.faint, fontSize: 12, marginTop: 2 }}>{t("data_desc")}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button onClick={onLoadSample}
            className="flex items-center gap-1 rounded-md px-3 py-2 text-sm"
            style={{ border: `1px solid ${C.line}`, color: C.sub, background: C.card, fontWeight: 500 }}>
            {t("loadSample")}
          </button>
          <button onClick={onClearData}
            className="flex items-center gap-1 rounded-md px-3 py-2 text-sm"
            style={{ border: `1px solid ${C.line}`, color: C.clay, background: C.card, fontWeight: 500 }}>
            <Trash2 size={15} /> {t("clearData")}
          </button>
        </div>
      </Card>
    </div>
  );
}

/* ================================================================== *
 * Confirm dialog — centered modal for negative / irreversible actions
 * ================================================================== */
function ConfirmDialog({ data, onClose }) {
  const accent = data?.danger ? C.clay : C.green;
  const confirm = () => { data?.onConfirm?.(); onClose(); };

  return (
    <AnimatePresence>
      {data && (
        <motion.div onClick={onClose}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={SNAP_FAST}
          style={{ position: "fixed", inset: 0, background: "rgba(35,50,60,0.35)", zIndex: 60, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <motion.div onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true"
            initial={{ opacity: 0, scale: 0.94, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 8 }} transition={SNAP}
            style={{ background: C.card, width: "100%", maxWidth: 380, borderRadius: 20, padding: 22, boxShadow: "0 20px 50px rgba(40,90,90,0.22)" }}>
            <h2 style={{ fontWeight: 700, fontSize: 17, color: C.ink }}>{data.title}</h2>
            <p style={{ color: C.sub, fontSize: 13.5, marginTop: 8, lineHeight: 1.5 }}>{data.message}</p>

            <div className="mt-5 flex gap-2">
              <button onClick={onClose}
                className="flex-1 rounded-xl px-3 py-2.5 text-sm"
                style={{ fontWeight: 600, background: C.card, color: C.ink, border: `1px solid ${C.line}` }}>
                {t("cancel")}
              </button>
              <button onClick={confirm} autoFocus
                className="flex-1 rounded-xl px-3 py-2.5 text-sm"
                style={{ fontWeight: 600, background: accent, color: "#fff", border: `1px solid ${accent}` }}>
                {data.confirmLabel || t("done")}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ================================================================== *
 * Export sheet — works on mobile where downloads/print are blocked
 * ================================================================== */
function ExportSheet({ sheet, onClose }) {
  const [copied, setCopied] = useState(false);
  const [applyWhatIf, setApplyWhatIf] = useState(true);

  // Reset toggle whenever a new sheet opens
  useEffect(() => { setApplyWhatIf(true); }, [sheet]);

  const canShare = typeof navigator !== "undefined" && !!navigator.share;
  const isReport = sheet?.kind === "report";

  // Active content: if what-if available and toggle is off, use original
  const activeContent = sheet
    ? (sheet.hasWhatIf && !applyWhatIf && sheet.contentOriginal ? sheet.contentOriginal : sheet.content)
    : "";

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(activeContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      alert(t("blockedNote"));
    }
  };

  const share = async () => {
    try {
      const file = new File([activeContent], sheet.filename, { type: sheet.mime });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: sheet.title });
        return;
      }
      if (navigator.share) {
        await navigator.share({ title: sheet.title, text: activeContent });
        return;
      }
      throw new Error("unsupported");
    } catch (e) {
      if (e && e.name === "AbortError") return;
      alert(t("blockedNote"));
    }
  };

  const download = () => {
    const ok = downloadFile(activeContent, sheet.filename, sheet.mime);
    if (!ok) alert(t("blockedNote"));
  };

  const printReport = () => {
    const w = window.open("", "_blank");
    if (w && w.document) {
      w.document.open();
      w.document.write(activeContent);
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
    <AnimatePresence>
    {sheet && (
    <motion.div onClick={onClose}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={SNAP_FAST}
      style={{ position: "fixed", inset: 0, background: "rgba(35,50,60,0.35)", zIndex: 50, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
      <motion.div onClick={(e) => e.stopPropagation()}
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={SNAP}
        style={{ background: C.card, width: "100%", maxWidth: 520, borderRadius: "20px 20px 0 0", padding: 20, boxShadow: "0 -10px 40px rgba(40,90,90,0.18)", maxHeight: "85vh", overflowY: "auto" }}>
        <div style={{ width: 38, height: 4, borderRadius: 99, background: C.line, margin: "0 auto 14px" }} />
        <h2 style={{ fontWeight: 700, fontSize: 17 }}>{sheet.title}</h2>
        <p style={{ color: C.sub, fontSize: 13, marginTop: 4, lineHeight: 1.5 }}>{sheet.desc}</p>

        {sheet.hasWhatIf && (
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            marginTop: 14, padding: "10px 14px", borderRadius: 12,
            border: `1px solid ${C.line}`, background: C.bg,
          }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: 13 }}>Include what-if changes</div>
              <div style={{ fontSize: 12, color: C.faint, marginTop: 1 }}>Export with excluded plans removed</div>
            </div>
            <Toggle on={applyWhatIf} onChange={setApplyWhatIf} />
          </div>
        )}

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
            <iframe title="report" srcDoc={activeContent}
              style={{ width: "100%", height: 280, border: `1px solid ${C.line}`, borderRadius: 12, background: "#fff" }} />
          </>
        ) : (
          <textarea readOnly value={activeContent} onFocus={(e) => e.target.select()}
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
      </motion.div>
    </motion.div>
    )}
    </AnimatePresence>
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
  // shrink the value font for long numbers so they never overflow / get clipped
  const len = String(value).length;
  const valueFont = len > 13 ? 15 : len > 10 ? 16.5 : 18;
  return (
    <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 14, padding: "11px 13px", boxShadow: shadowSoft }}>
      <div style={{ fontSize: 11.5, color: C.faint, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{label}</div>
      <div style={{ fontWeight: 700, fontSize: valueFont, color: tone || C.ink, marginTop: 2, letterSpacing: "-0.02em",
        whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", ...num }}>{value}</div>
      {sub && <div style={{ fontSize: 10.5, color: C.faint, marginTop: 2 }}>{sub}</div>}
    </div>
  );
}
// Several related stats grouped into one card as rows (label/sub left, value right).
function StatGroup({ items }) {
  return (
    <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 14, padding: "4px 13px", boxShadow: shadowSoft }}>
      {items.map((it, i) => {
        const len = String(it.value).length;
        const valueFont = len > 13 ? 17 : len > 10 ? 18.5 : 20;
        return (
          <div key={i} className="flex items-center justify-between gap-3"
            style={{ padding: "10px 0", borderTop: i ? `1px solid ${C.line}` : "none" }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 12.5, color: C.sub, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{it.label}</div>
              {it.sub && <div style={{ fontSize: 11, color: C.faint, marginTop: 1 }}>{it.sub}</div>}
            </div>
            <div style={{ flexShrink: 0, fontWeight: 700, fontSize: valueFont, color: it.tone || C.ink, letterSpacing: "-0.02em", whiteSpace: "nowrap", ...num }}>{it.value}</div>
          </div>
        );
      })}
    </div>
  );
}
function Segmented({ options, value, onChange, fluid }) {
  return (
    <div className={fluid ? "flex w-full sm:inline-flex sm:w-auto" : "inline-flex"}
      style={{ background: C.greenSoft, borderRadius: 10, padding: 3 }}>
      {options.map(([v, l]) => (
        <button key={v} onClick={() => onChange(v)}
          className={fluid ? "flex-1 sm:flex-none" : ""}
          style={{ padding: "5px 12px", fontSize: 12.5, borderRadius: 8, fontWeight: value === v ? 600 : 500,
            whiteSpace: "nowrap", background: value === v ? C.card : "transparent", color: value === v ? C.ink : C.sub,
            boxShadow: value === v ? "0 1px 3px rgba(40,90,90,0.12)" : "none" }}>
          {l}
        </button>
      ))}
    </div>
  );
}
/* Overflow menu — holds data actions on small screens so the bar stays one row */
function MoreMenu({ onExport, onExportPDF, onExportLender, onImport, className = "" }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDoc); document.removeEventListener("keydown", onKey); };
  }, [open]);

  const item = {
    display: "flex", alignItems: "center", gap: 9, width: "100%",
    padding: "9px 12px", fontSize: 14, color: C.ink, background: "transparent",
    cursor: "pointer", textAlign: "left", borderRadius: 8,
  };
  const hoverOn = (e) => { e.currentTarget.style.background = C.bg; };
  const hoverOff = (e) => { e.currentTarget.style.background = "transparent"; };

  return (
    <div ref={ref} className={className} style={{ position: "relative" }}>
      <button onClick={() => setOpen((o) => !o)} title={t("more")} aria-label={t("more")} aria-expanded={open}
        className="flex items-center rounded-md px-2.5 py-1.5"
        style={{ border: `1px solid ${C.line}`, color: C.sub, background: C.card }}>
        <MoreHorizontal size={17} />
      </button>
      <AnimatePresence>
      {open && (
        <motion.div role="menu"
          initial={{ opacity: 0, scale: 0.95, y: -6 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -6 }}
          transition={SNAP_FAST}
          style={{ transformOrigin: "top right", position: "absolute", right: 0, top: "calc(100% + 6px)", minWidth: 172, background: C.card, border: `1px solid ${C.line}`, borderRadius: 12, boxShadow: shadow, padding: 6, zIndex: 30 }}>
          <button role="menuitem" style={item} onMouseEnter={hoverOn} onMouseLeave={hoverOff}
            onClick={() => { setOpen(false); onExport(); }}>
            <Download size={15} /> {t("export")}
          </button>
          <button role="menuitem" style={item} onMouseEnter={hoverOn} onMouseLeave={hoverOff}
            onClick={() => { setOpen(false); onExportPDF(); }}>
            <FileText size={15} /> PDF
          </button>
          <button role="menuitem" style={item} onMouseEnter={hoverOn} onMouseLeave={hoverOff}
            onClick={() => { setOpen(false); onExportLender(); }}>
            <Landmark size={15} /> {t("exLender_btn")}
          </button>
          <label role="menuitem" style={{ ...item }} onMouseEnter={hoverOn} onMouseLeave={hoverOff}>
            <Upload size={15} /> {t("import")}
            <input type="file" accept="application/json" className="hidden"
              onChange={(e) => { setOpen(false); onImport(e); }} />
          </label>
        </motion.div>
      )}
      </AnimatePresence>
    </div>
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
