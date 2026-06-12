"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  Banknote,
  CalendarClock,
  Check,
  ChevronDown,
  Copy,
  Landmark,
  LineChart,
  PiggyBank,
  RotateCcw,
  Sparkles,
  Target,
  TrendingUp,
  User,
  Wallet
} from "lucide-react";
import {
  DEFAULT_PLAN,
  buildPlan,
  formatBaht,
  formatBahtCompact,
  type PlanInput
} from "@/lib/retirement/engine";
import { SliderField, useAnimatedNumber } from "./fields";
import ReadinessGauge from "./ReadinessGauge";
import WealthChart from "./WealthChart";

const STORAGE_KEY = "rt-plan-v1";

const PRESETS: { label: string; emoji: string; plan: PlanInput }[] = [
  {
    label: "เริ่มทำงาน",
    emoji: "🌱",
    plan: { ...DEFAULT_PLAN, currentAge: 25, retireAge: 60, currentSavings: 100_000, monthlySaving: 8_000, monthlyExpense: 25_000 }
  },
  {
    label: "วัยสร้างตัว",
    emoji: "🚀",
    plan: { ...DEFAULT_PLAN, currentAge: 35, retireAge: 60, currentSavings: 1_200_000, monthlySaving: 20_000, monthlyExpense: 35_000 }
  },
  {
    label: "ใกล้เกษียณ",
    emoji: "🌅",
    plan: { ...DEFAULT_PLAN, currentAge: 50, retireAge: 60, currentSavings: 5_000_000, monthlySaving: 30_000, monthlyExpense: 40_000, preReturnPct: 5 }
  }
];

const numTH = (v: number) => new Intl.NumberFormat("th-TH").format(Math.round(v));

function StatCard({
  icon,
  label,
  value,
  sub,
  tone = "text-slate-100"
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  sub?: string;
  tone?: string;
}) {
  const animated = useAnimatedNumber(value);
  return (
    <div className="rt-panel flex flex-col gap-1 px-5 py-4">
      <span className="flex items-center gap-2 text-xs font-medium text-slate-400">
        {icon}
        {label}
      </span>
      <span className={`rt-display text-2xl font-bold tracking-tight ${tone}`}>{formatBaht(animated)}</span>
      {sub && <span className="text-[11px] leading-4 text-slate-500">{sub}</span>}
    </div>
  );
}

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-200">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-400/10 text-cyan-300">{icon}</span>
        {title}
      </h3>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

export default function RetirementPlanner() {
  const [input, setInput] = useState<PlanInput>(DEFAULT_PLAN);
  const [showTable, setShowTable] = useState(false);
  const [copied, setCopied] = useState(false);

  // restore the last plan once on the client
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setInput({ ...DEFAULT_PLAN, ...JSON.parse(raw) });
    } catch {
      /* corrupt storage — keep defaults */
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(input));
    } catch {
      /* private mode — skip persistence */
    }
  }, [input]);

  const plan = useMemo(() => buildPlan(input), [input]);
  const set = (patch: Partial<PlanInput>) => setInput((p) => ({ ...p, ...patch }));

  const onTarget = plan.gap >= 0;
  const extraNeeded = Math.max(0, plan.requiredMonthlySaving - plan.input.monthlySaving);

  const insights = useMemo(() => {
    const list: { icon: string; text: string }[] = [];
    const c = plan.input;
    list.push({
      icon: "⏳",
      text: `เหลือเวลาออมอีก ${plan.yearsToRetire} ปี และต้องมีเงินใช้หลังเกษียณนาน ${plan.retirementYears} ปี`
    });
    list.push({
      icon: "🛒",
      text: `ค่าใช้จ่าย ${numTH(c.monthlyExpense)} บาท/เดือนวันนี้ จะกลายเป็น ~${numTH(plan.monthlyExpenseAtRetire)} บาท/เดือน ณ วันเกษียณ (เงินเฟ้อ ${c.inflationPct}%)`
    });
    if (onTarget) {
      list.push({
        icon: "🎉",
        text: `แผนปัจจุบันเกินเป้า ${formatBahtCompact(plan.gap)} — คาดว่าจะมีเงินเหลือ ณ อายุ ${c.endAge} ประมาณ ${formatBahtCompact(plan.endBalance)}`
      });
    } else {
      list.push({
        icon: "⚡",
        text: `ยังขาดอีก ${formatBahtCompact(-plan.gap)} — หากออมเพิ่มเป็น ${numTH(plan.requiredMonthlySaving)} บาท/เดือน (เพิ่มอีก ${numTH(extraNeeded)}) จะถึงเป้าพอดี`
      });
    }
    if (plan.depletionAge !== null) {
      list.push({
        icon: "🚨",
        text: `ตามแผนปัจจุบัน เงินจะหมดเมื่ออายุ ${plan.depletionAge} ปี ก่อนสิ้นสุดแผนที่อายุ ${c.endAge}`
      });
    }
    if (!onTarget && c.retireAge < 65) {
      list.push({
        icon: "💡",
        text: "อีกทางเลือก: เลื่อนอายุเกษียณออกไป 2–3 ปี ช่วยทั้งเพิ่มเวลาออมและลดจำนวนปีที่ต้องถอนใช้"
      });
    }
    return list;
  }, [plan, onTarget, extraNeeded]);

  const copySummary = async () => {
    const c = plan.input;
    const text = [
      `📋 สรุปแผนเกษียณ (พ.ศ. ${new Date().getFullYear() + 543})`,
      `อายุ ${c.currentAge} → เกษียณ ${c.retireAge} → วางแผนถึง ${c.endAge}`,
      `เงินก้อนที่ต้องมี ณ วันเกษียณ: ${formatBaht(plan.requiredFund)}`,
      `คาดว่าจะมี: ${formatBaht(plan.projectedFund)} (${Math.round(plan.readinessPct)}% ของเป้า)`,
      onTarget
        ? `✅ เกินเป้า ${formatBaht(plan.gap)}`
        : `⚠️ ขาดอีก ${formatBaht(-plan.gap)} — ควรออม ${numTH(plan.requiredMonthlySaving)} บาท/เดือน`
    ].join("\n");
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable */
    }
  };

  return (
    <div className="rt-root fixed inset-0 z-[70] overflow-y-auto bg-[#060a13] text-slate-100">
      {/* layered futuristic backdrop */}
      <div aria-hidden className="pointer-events-none fixed inset-0">
        <div className="rt-grid-bg absolute inset-0 opacity-60 [mask-image:radial-gradient(75%_60%_at_50%_30%,#000,transparent)]" />
        <div className="rt-aurora absolute -top-40 left-[8%] h-[480px] w-[480px] rounded-full bg-cyan-500/15 blur-[120px]" />
        <div className="rt-aurora-slow absolute top-[20%] right-[-10%] h-[520px] w-[520px] rounded-full bg-violet-600/15 blur-[130px]" />
        <div className="rt-aurora absolute bottom-[-15%] left-[30%] h-[420px] w-[420px] rounded-full bg-pink-500/10 blur-[120px]" />
      </div>

      <div className="relative mx-auto w-[min(1240px,94vw)] pb-20 pt-8">
        {/* header */}
        <motion.header
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8 flex flex-wrap items-center justify-between gap-4"
        >
          <div>
            <Link
              href="/"
              className="mb-3 inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 transition hover:text-cyan-300"
            >
              <ArrowLeft size={14} /> กลับหน้าหลัก
            </Link>
            <h1 className="rt-display text-3xl font-bold tracking-tight sm:text-4xl">
              <span className="bg-gradient-to-r from-cyan-300 via-violet-300 to-pink-300 bg-clip-text text-transparent">
                วางแผนเกษียณ
              </span>{" "}
              <span className="text-slate-500">·</span>{" "}
              <span className="text-slate-300">Retirement Planner</span>
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-400">
              จำลองเส้นทางการเงินทั้งชีวิตแบบเรียลไทม์ — ปรับตัวเลขด้านซ้าย แล้วดูอนาคตของคุณเปลี่ยนทันที
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {PRESETS.map((p) => (
              <button
                key={p.label}
                onClick={() => setInput(p.plan)}
                className="rt-panel px-4 py-2 text-xs font-semibold text-slate-300 transition hover:scale-105 hover:text-cyan-300 active:scale-95"
              >
                {p.emoji} {p.label}
              </button>
            ))}
            <button
              onClick={() => setInput(DEFAULT_PLAN)}
              aria-label="ล้างค่ากลับเป็นเริ่มต้น"
              className="rt-panel px-3 py-2 text-slate-400 transition hover:scale-105 hover:text-rose-300 active:scale-95"
            >
              <RotateCcw size={14} />
            </button>
          </div>
        </motion.header>

        <div className="grid gap-6 lg:grid-cols-[380px,1fr]">
          {/* ── input column ─────────────────────────────── */}
          <motion.aside
            initial={{ opacity: 0, x: -24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="rt-panel rt-panel-glow h-fit space-y-7 p-6 lg:sticky lg:top-6"
          >
            <Section icon={<User size={15} />} title="ข้อมูลของคุณ">
              <SliderField label="อายุปัจจุบัน" value={input.currentAge} min={18} max={70} step={1} unit="ปี" onChange={(v) => set({ currentAge: v })} />
              <SliderField label="อายุที่จะเกษียณ" value={input.retireAge} min={40} max={75} step={1} unit="ปี" accent="pink" onChange={(v) => set({ retireAge: v })} />
              <SliderField
                label="วางแผนถึงอายุ"
                hint="อายุคาดเฉลี่ยของคนไทยอยู่ราว 80 ปี เผื่อไว้ถึง 85–90 จะปลอดภัยกว่า"
                value={input.endAge}
                min={70}
                max={100}
                step={1}
                unit="ปี"
                accent="violet"
                onChange={(v) => set({ endAge: v })}
              />
            </Section>

            <Section icon={<Wallet size={15} />} title="เงินออมและการลงทุน">
              <SliderField label="เงินเก็บปัจจุบัน" value={input.currentSavings} min={0} max={20_000_000} step={50_000} unit="บาท" format={numTH} onChange={(v) => set({ currentSavings: v })} />
              <SliderField label="ออมต่อเดือน" value={input.monthlySaving} min={0} max={200_000} step={1_000} unit="บาท" format={numTH} onChange={(v) => set({ monthlySaving: v })} />
              <SliderField
                label="ออมเพิ่มขึ้นปีละ"
                hint="ตามเงินเดือนที่โตขึ้น เช่น ปรับเพิ่มการออม 3% ทุกปี"
                value={input.savingGrowthPct}
                min={0}
                max={15}
                step={0.5}
                unit="%"
                onChange={(v) => set({ savingGrowthPct: v })}
              />
            </Section>

            <Section icon={<TrendingUp size={15} />} title="สมมติฐานผลตอบแทน">
              <SliderField label="ผลตอบแทนก่อนเกษียณ" hint="พอร์ตเติบโต เช่น กองทุนหุ้น 6–8% ต่อปี" value={input.preReturnPct} min={0} max={15} step={0.5} unit="%/ปี" onChange={(v) => set({ preReturnPct: v })} />
              <SliderField label="ผลตอบแทนหลังเกษียณ" hint="พอร์ตปลอดภัยขึ้น เช่น ตราสารหนี้ 3–5% ต่อปี" value={input.postReturnPct} min={0} max={12} step={0.5} unit="%/ปี" accent="violet" onChange={(v) => set({ postReturnPct: v })} />
              <SliderField label="อัตราเงินเฟ้อ" value={input.inflationPct} min={0} max={8} step={0.5} unit="%/ปี" accent="pink" onChange={(v) => set({ inflationPct: v })} />
            </Section>

            <Section icon={<Banknote size={15} />} title="ชีวิตหลังเกษียณ">
              <SliderField label="ค่าใช้จ่ายที่อยากมี" hint="คิดเป็นมูลค่าเงินวันนี้ ระบบจะปรับเงินเฟ้อให้เอง" value={input.monthlyExpense} min={5_000} max={300_000} step={1_000} unit="บาท/เดือน" format={numTH} accent="pink" onChange={(v) => set({ monthlyExpense: v })} />
              <SliderField label="บำนาญ/รายได้อื่น" hint="เช่น ประกันสังคม กบข. ค่าเช่า — มูลค่าเงินวันนี้" value={input.monthlyPension} min={0} max={100_000} step={500} unit="บาท/เดือน" format={numTH} accent="violet" onChange={(v) => set({ monthlyPension: v })} />
            </Section>
          </motion.aside>

          {/* ── results column ───────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="space-y-6"
          >
            {/* verdict + gauge */}
            <div className="rt-panel rt-panel-glow grid gap-6 p-6 sm:grid-cols-[auto,1fr]">
              <ReadinessGauge readinessPct={plan.readinessPct} />
              <div className="grid content-center gap-3 sm:grid-cols-2">
                <StatCard icon={<Target size={13} />} label="เงินก้อนที่ต้องมี ณ วันเกษียณ" value={plan.requiredFund} sub={`สำหรับใช้จ่ายถึงอายุ ${plan.input.endAge} ปี`} tone="text-emerald-300" />
                <StatCard icon={<PiggyBank size={13} />} label="คาดว่าจะมีจริง" value={plan.projectedFund} sub={`เมื่ออายุครบ ${plan.input.retireAge} ปี ตามแผนปัจจุบัน`} tone="text-cyan-300" />
                <StatCard
                  icon={<Sparkles size={13} />}
                  label={onTarget ? "เกินเป้า" : "ยังขาดอีก"}
                  value={Math.abs(plan.gap)}
                  sub={onTarget ? "แผนของคุณแข็งแรงมาก" : "ดูคำแนะนำด้านล่างเพื่อปิดส่วนต่าง"}
                  tone={onTarget ? "text-emerald-300" : "text-rose-300"}
                />
                <StatCard
                  icon={<Landmark size={13} />}
                  label="เงินออมที่ควรออมต่อเดือน"
                  value={plan.requiredMonthlySaving}
                  sub={
                    extraNeeded > 0
                      ? `มากกว่าที่ออมตอนนี้ ${numTH(extraNeeded)} บาท`
                      : "ที่ออมอยู่ตอนนี้เพียงพอแล้ว 🎉"
                  }
                  tone={extraNeeded > 0 ? "text-amber-300" : "text-emerald-300"}
                />
              </div>
            </div>

            {/* chart */}
            <div className="rt-panel p-6">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <h2 className="rt-display flex items-center gap-2 text-lg font-semibold text-slate-100">
                  <LineChart size={18} className="text-cyan-300" />
                  เส้นทางความมั่งคั่งของคุณ
                </h2>
                <button
                  onClick={copySummary}
                  className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-semibold text-slate-300 transition hover:scale-105 hover:text-cyan-300 active:scale-95"
                >
                  {copied ? <Check size={13} className="text-emerald-300" /> : <Copy size={13} />}
                  {copied ? "คัดลอกแล้ว" : "คัดลอกสรุปแผน"}
                </button>
              </div>
              <WealthChart plan={plan} />
            </div>

            {/* insights */}
            <div className="rt-panel p-6">
              <h2 className="rt-display mb-4 flex items-center gap-2 text-lg font-semibold text-slate-100">
                <Sparkles size={18} className="text-violet-300" />
                บทวิเคราะห์แผนของคุณ
              </h2>
              <ul className="space-y-3">
                {insights.map((it, i) => (
                  <motion.li
                    key={it.text}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05 * i }}
                    className="flex items-start gap-3 rounded-xl border border-white/5 bg-white/[0.03] px-4 py-3 text-sm leading-6 text-slate-300"
                  >
                    <span className="text-base">{it.icon}</span>
                    {it.text}
                  </motion.li>
                ))}
              </ul>
            </div>

            {/* year-by-year table */}
            <div className="rt-panel p-6">
              <button
                onClick={() => setShowTable((s) => !s)}
                className="flex w-full items-center justify-between text-left"
                aria-expanded={showTable}
              >
                <h2 className="rt-display flex items-center gap-2 text-lg font-semibold text-slate-100">
                  <CalendarClock size={18} className="text-pink-300" />
                  ตารางรายปี
                </h2>
                <ChevronDown size={18} className={`text-slate-400 transition-transform ${showTable ? "rotate-180" : ""}`} />
              </button>
              <AnimatePresence initial={false}>
                {showTable && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.35 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-4 max-h-[420px] overflow-y-auto rounded-xl border border-white/5">
                      <table className="w-full text-sm">
                        <thead className="sticky top-0 bg-[#0b1020]/95 backdrop-blur">
                          <tr className="text-left text-xs text-slate-400">
                            <th className="px-4 py-2.5 font-medium">อายุ</th>
                            <th className="px-4 py-2.5 font-medium">พ.ศ.</th>
                            <th className="px-4 py-2.5 font-medium">ช่วงชีวิต</th>
                            <th className="px-4 py-2.5 text-right font-medium">ถอนใช้/ปี</th>
                            <th className="px-4 py-2.5 text-right font-medium">เงินคงเหลือ</th>
                          </tr>
                        </thead>
                        <tbody>
                          {plan.timeline.map((p) => (
                            <tr
                              key={p.age}
                              className={`border-t border-white/5 ${p.age === plan.input.retireAge ? "bg-pink-400/10" : ""}`}
                            >
                              <td className="px-4 py-2 text-slate-300">{p.age}</td>
                              <td className="px-4 py-2 text-slate-500">{p.yearBE}</td>
                              <td className="px-4 py-2">
                                <span
                                  className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                                    p.phase === "save"
                                      ? "bg-cyan-400/10 text-cyan-300"
                                      : "bg-pink-400/10 text-pink-300"
                                  }`}
                                >
                                  {p.phase === "save" ? "สะสม" : "เกษียณ"}
                                </span>
                              </td>
                              <td className="px-4 py-2 text-right text-slate-400">
                                {p.withdrawal > 0 ? formatBaht(p.withdrawal) : "—"}
                              </td>
                              <td className={`px-4 py-2 text-right font-semibold ${p.expected <= 0 && p.phase === "retire" ? "text-rose-400" : "text-slate-200"}`}>
                                {formatBaht(p.expected)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <p className="px-2 text-center text-[11px] leading-5 text-slate-600">
              เครื่องมือนี้เป็นการจำลองเชิงตัวเลขเพื่อประกอบการวางแผนเท่านั้น ไม่ใช่คำแนะนำการลงทุน
              ผลตอบแทนจริงอาจผันผวนตามตลาด
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
