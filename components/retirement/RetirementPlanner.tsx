"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  Check,
  ChevronDown,
  Copy,
  PiggyBank,
  RotateCcw,
  Sun,
  TrendingUp,
  User
} from "lucide-react";
import {
  DEFAULT_PLAN,
  buildPlan,
  formatBaht,
  formatBahtCompact,
  type PlanInput
} from "@/lib/retirement/engine";
import {
  ASSET_CLASSES,
  DEFAULT_ALLOCATION,
  MODEL_PORTFOLIOS,
  summarizePortfolio,
  type Allocation
} from "@/lib/retirement/assets";
import { SliderField, useAnimatedNumber } from "./fields";
import ReadinessGauge from "./ReadinessGauge";
import WealthChart from "./WealthChart";

const STORAGE_KEY = "rt-plan-v2";

type ReturnMode = "manual" | "portfolio";

const PRESETS: { label: string; plan: PlanInput }[] = [
  {
    label: "เริ่มทำงาน",
    plan: { ...DEFAULT_PLAN, currentAge: 25, retireAge: 60, currentSavings: 100_000, monthlySaving: 8_000, monthlyExpense: 25_000 }
  },
  {
    label: "วัยสร้างตัว",
    plan: { ...DEFAULT_PLAN, currentAge: 35, retireAge: 60, currentSavings: 1_200_000, monthlySaving: 20_000, monthlyExpense: 35_000 }
  },
  {
    label: "ใกล้เกษียณ",
    plan: { ...DEFAULT_PLAN, currentAge: 50, retireAge: 60, currentSavings: 5_000_000, monthlySaving: 30_000, monthlyExpense: 40_000, preReturnPct: 5 }
  }
];

const numTH = (v: number) => new Intl.NumberFormat("th-TH").format(Math.round(v));

const INK = "text-[#3b362e]";
const SOFT = "text-[#8a8378]";
const FAINT = "text-[#b3aa9b]";

function Stat({
  label,
  value,
  sub,
  tone = "text-[#3b362e]"
}: {
  label: string;
  value: number;
  sub?: string;
  tone?: string;
}) {
  const animated = useAnimatedNumber(value);
  return (
    <div>
      <p className={`text-xs ${SOFT}`}>{label}</p>
      <p className={`rt-display mt-1 text-[25px] font-medium leading-tight ${tone}`}>
        {formatBaht(animated)}
      </p>
      {sub && <p className={`mt-0.5 text-[11px] leading-4 ${FAINT}`}>{sub}</p>}
    </div>
  );
}

function Section({
  icon,
  chipBg,
  title,
  children
}: {
  icon: React.ReactNode;
  chipBg: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h3 className={`mb-4 flex items-center gap-2.5 text-sm font-semibold ${INK}`}>
        <span
          className="flex h-8 w-8 items-center justify-center rounded-xl"
          style={{ background: chipBg }}
        >
          {icon}
        </span>
        {title}
      </h3>
      <div className="space-y-5">{children}</div>
    </section>
  );
}

export default function RetirementPlanner() {
  const [input, setInput] = useState<PlanInput>(DEFAULT_PLAN);
  const [mode, setMode] = useState<ReturnMode>("manual");
  const [alloc, setAlloc] = useState<Allocation>(DEFAULT_ALLOCATION);
  const [showTable, setShowTable] = useState(false);
  const [copied, setCopied] = useState(false);

  // restore the last plan once on the client
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        if (saved.input) setInput({ ...DEFAULT_PLAN, ...saved.input });
        if (saved.mode === "portfolio" || saved.mode === "manual") setMode(saved.mode);
        if (saved.alloc) setAlloc({ ...DEFAULT_ALLOCATION, ...saved.alloc });
      }
    } catch {
      /* corrupt storage — keep defaults */
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ input, mode, alloc }));
    } catch {
      /* private mode — skip persistence */
    }
  }, [input, mode, alloc]);

  const portfolio = useMemo(() => summarizePortfolio(alloc), [alloc]);

  // In portfolio mode the pre-retirement return and the scenario band
  // come from the chosen asset mix instead of the manual slider.
  const effectiveInput = useMemo<PlanInput>(
    () =>
      mode === "portfolio"
        ? { ...input, preReturnPct: portfolio.expectedReturnPct, spreadPct: portfolio.spreadPct }
        : input,
    [input, mode, portfolio]
  );

  const plan = useMemo(() => buildPlan(effectiveInput), [effectiveInput]);
  const set = (patch: Partial<PlanInput>) => setInput((p) => ({ ...p, ...patch }));
  const setAllocFor = (id: string, v: number) => setAlloc((a) => ({ ...a, [id]: v }));

  const onTarget = plan.gap >= 0;
  const extraNeeded = Math.max(0, plan.requiredMonthlySaving - plan.input.monthlySaving);

  const verdictLine = onTarget
    ? `แผนของคุณไปได้สวย — คาดว่าจะมีเกินเป้า ${formatBahtCompact(plan.gap)}`
    : `อีกนิดเดียว — ยังขาดอีก ${formatBahtCompact(-plan.gap)} สำหรับชีวิตเกษียณที่วางไว้`;

  const insights = useMemo(() => {
    const list: string[] = [];
    const c = plan.input;
    list.push(
      `เหลือเวลาออมอีก ${plan.yearsToRetire} ปี และต้องมีเงินใช้หลังเกษียณนาน ${plan.retirementYears} ปี`
    );
    list.push(
      `ค่าใช้จ่าย ${numTH(c.monthlyExpense)} บาทต่อเดือนในวันนี้ จะกลายเป็นราว ${numTH(plan.monthlyExpenseAtRetire)} บาทต่อเดือน ณ วันเกษียณ เมื่อคิดเงินเฟ้อ ${c.inflationPct}% ต่อปี`
    );
    if (mode === "portfolio") {
      const heavy = ASSET_CLASSES.filter((a) => (alloc[a.id] || 0) > 0)
        .sort((a, b) => (alloc[b.id] || 0) - (alloc[a.id] || 0))
        .slice(0, 2)
        .map((a) => a.name)
        .join("และ");
      list.push(
        `พอร์ตของคุณ (เน้น${heavy}) คาดหวังผลตอบแทนราว ${portfolio.expectedReturnPct.toFixed(1)}% ต่อปี ความผันผวนระดับ${portfolio.riskLabel} — กราฟจึงจำลองช่วงดี/แย่ที่ ±${portfolio.spreadPct.toFixed(1)}%`
      );
    }
    if (onTarget) {
      list.push(
        `แผนปัจจุบันเกินเป้า ${formatBahtCompact(plan.gap)} และคาดว่าจะมีเงินเหลือ ณ อายุ ${c.endAge} ราว ${formatBahtCompact(plan.endBalance)}`
      );
    } else {
      list.push(
        `หากเพิ่มเงินออมเป็น ${numTH(plan.requiredMonthlySaving)} บาทต่อเดือน (เพิ่มจากปัจจุบัน ${numTH(extraNeeded)} บาท) จะถึงเป้าหมายพอดี`
      );
    }
    if (plan.depletionAge !== null) {
      list.push(
        `ตามแผนปัจจุบัน เงินจะหมดเมื่ออายุ ${plan.depletionAge} ปี ก่อนสิ้นสุดแผนที่อายุ ${c.endAge}`
      );
    }
    if (!onTarget && c.retireAge < 65) {
      list.push(
        `อีกทางเลือกคือเลื่อนอายุเกษียณออกไป 2–3 ปี ซึ่งช่วยทั้งเพิ่มเวลาออมและลดจำนวนปีที่ต้องถอนใช้`
      );
    }
    return list;
  }, [plan, onTarget, extraNeeded, mode, alloc, portfolio]);

  const copySummary = async () => {
    const c = plan.input;
    const text = [
      `สรุปแผนเกษียณ (พ.ศ. ${new Date().getFullYear() + 543})`,
      `อายุ ${c.currentAge} — เกษียณ ${c.retireAge} — วางแผนถึง ${c.endAge}`,
      `เงินก้อนที่ต้องมี ณ วันเกษียณ: ${formatBaht(plan.requiredFund)}`,
      `คาดว่าจะมี: ${formatBaht(plan.projectedFund)} (${Math.round(plan.readinessPct)}% ของเป้า)`,
      onTarget
        ? `เกินเป้า ${formatBaht(plan.gap)}`
        : `ขาดอีก ${formatBaht(-plan.gap)} — ควรออม ${numTH(plan.requiredMonthlySaving)} บาทต่อเดือน`,
      ...(mode === "portfolio"
        ? [
            `พอร์ตลงทุน (คาดหวัง ~${portfolio.expectedReturnPct.toFixed(1)}%/ปี): ` +
              ASSET_CLASSES.filter((a) => (alloc[a.id] || 0) > 0)
                .map((a) => `${a.name} ${alloc[a.id]}%`)
                .join(", ")
          ]
        : [])
    ].join("\n");
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable */
    }
  };

  const pillBtn =
    "rounded-full border border-[#e7dfd0] bg-white px-4 py-1.5 text-xs font-medium text-[#6f675c] shadow-sm transition hover:border-[#a9c4b1] hover:text-[#557f63] active:scale-95";

  return (
    <div className="rt-root fixed inset-0 z-[70] overflow-y-auto">
      <div className="relative mx-auto w-[min(1200px,93vw)] pb-24 pt-9">
        {/* header */}
        <motion.header
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="mb-8 flex flex-wrap items-end justify-between gap-5"
        >
          <div>
            <Link
              href="/"
              className={`mb-4 inline-flex items-center gap-1.5 text-xs ${SOFT} transition hover:text-[#557f63]`}
            >
              <ArrowLeft size={13} /> กลับหน้าหลัก
            </Link>
            <h1 className={`rt-display text-[34px] font-medium leading-tight sm:text-[40px] ${INK}`}>
              วางแผนเกษียณ<span className="text-[#87a892]">.</span>
            </h1>
            <p className={`mt-2 max-w-xl text-sm leading-6 ${SOFT}`}>
              เลื่อนตัวปรับด้านซ้าย แล้วดูอนาคตการเงินของคุณเปลี่ยนตามแบบเรียลไทม์ —
              ง่ายๆ ไม่ต้องเก่งเลขก็วางแผนได้
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className={`mr-1 text-[11px] ${FAINT}`}>ลองตัวอย่าง</span>
            {PRESETS.map((p) => (
              <button key={p.label} onClick={() => setInput(p.plan)} className={pillBtn}>
                {p.label}
              </button>
            ))}
            <button
              onClick={() => setInput(DEFAULT_PLAN)}
              aria-label="ล้างค่ากลับเป็นเริ่มต้น"
              className={pillBtn}
            >
              <RotateCcw size={13} />
            </button>
          </div>
        </motion.header>

        <div className="grid gap-5 lg:grid-cols-[370px,1fr]">
          {/* ── input column ─────────────────────────────── */}
          <motion.aside
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.07 }}
            className="rt-panel h-fit space-y-8 p-6 sm:p-7 lg:sticky lg:top-6"
          >
            <Section icon={<User size={15} color="#7c937f" />} chipBg="#eef1ea" title="ข้อมูลของคุณ">
              <SliderField label="อายุปัจจุบัน" value={input.currentAge} min={18} max={70} step={1} unit="ปี" onChange={(v) => set({ currentAge: v })} />
              <SliderField label="อายุที่จะเกษียณ" value={input.retireAge} min={40} max={75} step={1} unit="ปี" onChange={(v) => set({ retireAge: v })} />
              <SliderField
                label="วางแผนถึงอายุ"
                hint="อายุคาดเฉลี่ยของคนไทยอยู่ราว 80 ปี เผื่อถึง 85–90 จะอุ่นใจกว่า"
                value={input.endAge}
                min={70}
                max={100}
                step={1}
                unit="ปี"
                onChange={(v) => set({ endAge: v })}
              />
            </Section>

            <Section icon={<PiggyBank size={15} color="#7c937f" />} chipBg="#eef1ea" title="เงินออมและการลงทุน">
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

            <Section icon={<TrendingUp size={15} color="#7c937f" />} chipBg="#eef1ea" title="ผลตอบแทนก่อนเกษียณ">
              {/* mode switch: type a number vs. build a real asset mix */}
              <div className="flex rounded-full bg-[#f1ede3] p-1">
                {(
                  [
                    ["manual", "กรอกตัวเลขเอง"],
                    ["portfolio", "จัดพอร์ตลงทุน"]
                  ] as [ReturnMode, string][]
                ).map(([m, label]) => (
                  <button
                    key={m}
                    onClick={() => setMode(m)}
                    className={`flex-1 rounded-full px-3 py-1.5 text-xs font-medium transition ${
                      mode === m ? "bg-white text-[#3b362e] shadow-sm" : "text-[#8a8378]"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {mode === "manual" ? (
                <SliderField
                  label="ผลตอบแทนที่คาดหวัง"
                  hint="พอร์ตเติบโต เช่น กองทุนหุ้น 6–8% ต่อปี"
                  value={input.preReturnPct}
                  min={0}
                  max={15}
                  step={0.5}
                  unit="%/ปี"
                  onChange={(v) => set({ preReturnPct: v })}
                />
              ) : (
                <>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className={`mr-0.5 text-[11px] ${FAINT}`}>พอร์ตแนะนำ</span>
                    {MODEL_PORTFOLIOS.map((m) => (
                      <button
                        key={m.label}
                        onClick={() => setAlloc({ ...m.alloc })}
                        className={pillBtn}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>

                  {ASSET_CLASSES.map((a) => (
                    <SliderField
                      key={a.id}
                      label={a.name}
                      hint={`${a.examples} · คาดหวัง ~${a.expectedReturnPct}% ต่อปี`}
                      value={alloc[a.id] || 0}
                      min={0}
                      max={100}
                      step={5}
                      unit="%"
                      onChange={(v) => setAllocFor(a.id, v)}
                    />
                  ))}

                  <div className="rounded-2xl bg-[#eef1ea] px-4 py-3">
                    <p className="flex items-baseline justify-between text-xs text-[#6f675c]">
                      <span>ผลตอบแทนคาดหวังของพอร์ต</span>
                      <span className="rt-display text-base text-[#557f63]">
                        ~{portfolio.expectedReturnPct.toFixed(1)}% ต่อปี
                      </span>
                    </p>
                    <p className={`mt-1 text-[11px] leading-4 ${SOFT}`}>
                      รวม {portfolio.totalPct}%
                      {portfolio.totalPct !== 100 && " (ระบบเทียบสัดส่วนเป็น 100% ให้อัตโนมัติ)"}
                      {" · "}ความผันผวนระดับ{portfolio.riskLabel}
                    </p>
                  </div>
                </>
              )}

              <SliderField label="ผลตอบแทนหลังเกษียณ" hint="พอร์ตปลอดภัยขึ้น เช่น ตราสารหนี้ 3–5% ต่อปี" value={input.postReturnPct} min={0} max={12} step={0.5} unit="%/ปี" onChange={(v) => set({ postReturnPct: v })} />
              <SliderField label="อัตราเงินเฟ้อ" value={input.inflationPct} min={0} max={8} step={0.5} unit="%/ปี" onChange={(v) => set({ inflationPct: v })} />
            </Section>

            <Section icon={<Sun size={15} color="#7c937f" />} chipBg="#eef1ea" title="ชีวิตหลังเกษียณ">
              <SliderField label="ค่าใช้จ่ายที่อยากมี" hint="คิดเป็นมูลค่าเงินวันนี้ ระบบจะปรับเงินเฟ้อให้เอง" value={input.monthlyExpense} min={5_000} max={300_000} step={1_000} unit="บาท/เดือน" format={numTH} onChange={(v) => set({ monthlyExpense: v })} />
              <SliderField label="บำนาญ/รายได้อื่น" hint="เช่น ประกันสังคม กบข. ค่าเช่า — มูลค่าเงินวันนี้" value={input.monthlyPension} min={0} max={100_000} step={500} unit="บาท/เดือน" format={numTH} onChange={(v) => set({ monthlyPension: v })} />
            </Section>
          </motion.aside>

          {/* ── results column ───────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.14 }}
            className="space-y-5"
          >
            {/* overview */}
            <div className="rt-panel p-6 sm:p-7">
              <p className={`rt-display text-xl leading-snug ${INK}`}>{verdictLine}</p>
              <div className="mt-6 grid items-center gap-8 sm:grid-cols-[auto,1fr]">
                <ReadinessGauge readinessPct={plan.readinessPct} />
                <div className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
                  <Stat
                    label="เงินก้อนที่ต้องมี ณ วันเกษียณ"
                    value={plan.requiredFund}
                    sub={`สำหรับใช้จ่ายถึงอายุ ${plan.input.endAge} ปี`}
                  />
                  <Stat
                    label="คาดว่าจะมีจริง"
                    value={plan.projectedFund}
                    sub={`เมื่ออายุครบ ${plan.input.retireAge} ปี ตามแผนปัจจุบัน`}
                  />
                  <Stat
                    label={onTarget ? "เกินเป้า" : "ยังขาดอีก"}
                    value={Math.abs(plan.gap)}
                    tone={onTarget ? "text-[#557f63]" : "text-[#b0644c]"}
                  />
                  <Stat
                    label="เงินออมที่ควรออมต่อเดือน"
                    value={plan.requiredMonthlySaving}
                    sub={
                      extraNeeded > 0
                        ? `มากกว่าที่ออมตอนนี้ ${numTH(extraNeeded)} บาท`
                        : "ที่ออมอยู่ตอนนี้เพียงพอแล้ว"
                    }
                    tone={extraNeeded > 0 ? "text-[#8d7a4d]" : "text-[#557f63]"}
                  />
                </div>
              </div>
            </div>

            {/* chart */}
            <div className="rt-panel p-6 sm:p-7">
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <h2 className={`rt-display text-lg ${INK}`}>เส้นทางความมั่งคั่งของคุณ</h2>
                <button onClick={copySummary} className={`${pillBtn} flex items-center gap-1.5`}>
                  {copied ? <Check size={12} className="text-[#557f63]" /> : <Copy size={12} />}
                  {copied ? "คัดลอกแล้ว" : "คัดลอกสรุปแผน"}
                </button>
              </div>
              <WealthChart plan={plan} />
            </div>

            {/* insights */}
            <div className="rt-panel p-6 sm:p-7">
              <h2 className={`rt-display mb-2 text-lg ${INK}`}>สิ่งที่แผนนี้กำลังบอกคุณ</h2>
              <ol>
                {insights.map((text, i) => (
                  <motion.li
                    key={text}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 * i }}
                    className="flex items-baseline gap-3.5 border-b border-[#f3eee4] py-3.5 text-sm leading-6 text-[#5c554a] last:border-0 last:pb-1"
                  >
                    <span className="rt-display flex h-6 w-6 shrink-0 translate-y-1 items-center justify-center rounded-full bg-[#eef1ea] text-[11px] text-[#6f8f7c]">
                      {i + 1}
                    </span>
                    {text}
                  </motion.li>
                ))}
              </ol>
            </div>

            {/* year-by-year table */}
            <div className="rt-panel p-6 sm:p-7">
              <button
                onClick={() => setShowTable((s) => !s)}
                className="flex w-full items-center justify-between text-left"
                aria-expanded={showTable}
              >
                <h2 className={`rt-display text-lg ${INK}`}>ตารางรายปี</h2>
                <ChevronDown
                  size={17}
                  className={`${FAINT} transition-transform ${showTable ? "rotate-180" : ""}`}
                />
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
                    <div className="mt-5 max-h-[420px] overflow-y-auto">
                      <table className="w-full text-sm">
                        <thead className="sticky top-0 bg-white">
                          <tr className={`text-left text-[11px] ${FAINT}`}>
                            <th className="py-2.5 pr-4 font-medium">อายุ</th>
                            <th className="py-2.5 pr-4 font-medium">พ.ศ.</th>
                            <th className="py-2.5 pr-4 font-medium">ช่วงชีวิต</th>
                            <th className="py-2.5 pr-4 text-right font-medium">ถอนใช้/ปี</th>
                            <th className="py-2.5 text-right font-medium">เงินคงเหลือ</th>
                          </tr>
                        </thead>
                        <tbody>
                          {plan.timeline.map((p) => (
                            <tr key={p.age} className="border-t border-[#f3eee4]">
                              <td className="py-2 pr-4 text-[#5c554a]">{p.age}</td>
                              <td className={`py-2 pr-4 ${FAINT}`}>{p.yearBE}</td>
                              <td className="py-2 pr-4">
                                <span className={`inline-flex items-center gap-2 text-[12px] ${SOFT}`}>
                                  <i
                                    className={`h-1.5 w-1.5 rounded-full ${
                                      p.phase === "save" ? "bg-[#a9c4b1]" : "bg-[#a9b8c9]"
                                    }`}
                                  />
                                  {p.phase === "save" ? "สะสม" : "เกษียณ"}
                                </span>
                              </td>
                              <td className={`py-2 pr-4 text-right ${FAINT}`}>
                                {p.withdrawal > 0 ? formatBaht(p.withdrawal) : "—"}
                              </td>
                              <td
                                className={`py-2 text-right font-medium ${
                                  p.expected <= 0 && p.phase === "retire"
                                    ? "text-[#b0644c]"
                                    : "text-[#3b362e]"
                                }`}
                              >
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

            <p className={`px-2 pt-1 text-center text-[11px] leading-5 ${FAINT}`}>
              เครื่องมือนี้เป็นการจำลองเชิงตัวเลขเพื่อประกอบการวางแผนเท่านั้น ไม่ใช่คำแนะนำการลงทุน
              ผลตอบแทนจริงอาจผันผวนตามตลาด
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
