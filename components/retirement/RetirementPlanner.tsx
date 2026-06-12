"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Check, ChevronDown, Copy, RotateCcw } from "lucide-react";
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

function Stat({
  label,
  value,
  sub,
  tone = "text-stone-100"
}: {
  label: string;
  value: number;
  sub?: string;
  tone?: string;
}) {
  const animated = useAnimatedNumber(value);
  return (
    <div>
      <p className="text-[11px] tracking-wide text-stone-500">{label}</p>
      <p className={`rt-display mt-1 text-[26px] font-medium leading-tight ${tone}`}>
        {formatBaht(animated)}
      </p>
      {sub && <p className="mt-0.5 text-[11px] leading-4 text-stone-600">{sub}</p>}
    </div>
  );
}

function Section({ no, title, children }: { no: string; title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="mb-4 flex items-baseline gap-2.5 border-b border-white/5 pb-2.5">
        <span className="rt-display text-xs text-[#debc7c]">{no}</span>
        <span className="text-[13px] font-medium text-stone-300">{title}</span>
      </h3>
      <div className="space-y-5">{children}</div>
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

  const verdictLine = onTarget
    ? `แผนของคุณแข็งแรง — คาดว่าจะมีเกินเป้า ${formatBahtCompact(plan.gap)}`
    : `ยังขาดอีก ${formatBahtCompact(-plan.gap)} สำหรับชีวิตเกษียณที่วางไว้`;

  const insights = useMemo(() => {
    const list: string[] = [];
    const c = plan.input;
    list.push(
      `เหลือเวลาออมอีก ${plan.yearsToRetire} ปี และต้องมีเงินใช้หลังเกษียณนาน ${plan.retirementYears} ปี`
    );
    list.push(
      `ค่าใช้จ่าย ${numTH(c.monthlyExpense)} บาทต่อเดือนในวันนี้ จะกลายเป็นราว ${numTH(plan.monthlyExpenseAtRetire)} บาทต่อเดือน ณ วันเกษียณ เมื่อคิดเงินเฟ้อ ${c.inflationPct}% ต่อปี`
    );
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
  }, [plan, onTarget, extraNeeded]);

  const copySummary = async () => {
    const c = plan.input;
    const text = [
      `สรุปแผนเกษียณ (พ.ศ. ${new Date().getFullYear() + 543})`,
      `อายุ ${c.currentAge} — เกษียณ ${c.retireAge} — วางแผนถึง ${c.endAge}`,
      `เงินก้อนที่ต้องมี ณ วันเกษียณ: ${formatBaht(plan.requiredFund)}`,
      `คาดว่าจะมี: ${formatBaht(plan.projectedFund)} (${Math.round(plan.readinessPct)}% ของเป้า)`,
      onTarget
        ? `เกินเป้า ${formatBaht(plan.gap)}`
        : `ขาดอีก ${formatBaht(-plan.gap)} — ควรออม ${numTH(plan.requiredMonthlySaving)} บาทต่อเดือน`
    ].join("\n");
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable */
    }
  };

  const quietBtn =
    "rounded-full border border-white/10 px-4 py-1.5 text-xs text-stone-400 transition hover:border-white/25 hover:text-stone-100";

  return (
    <div className="rt-root fixed inset-0 z-[70] overflow-y-auto">
      {/* quiet backdrop: single warm light source + film grain */}
      <div aria-hidden className="pointer-events-none fixed inset-0">
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(900px 480px at 24% -8%, rgba(222,188,124,0.07), transparent 65%), radial-gradient(1100px 600px at 88% 112%, rgba(157,191,169,0.05), transparent 60%)"
          }}
        />
        <div className="rt-grain absolute inset-0" />
      </div>

      <div className="relative mx-auto w-[min(1200px,93vw)] pb-24 pt-10">
        {/* header */}
        <motion.header
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-10 flex flex-wrap items-end justify-between gap-6"
        >
          <div>
            <Link
              href="/"
              className="mb-5 inline-flex items-center gap-1.5 text-xs text-stone-500 transition hover:text-stone-200"
            >
              <ArrowLeft size={13} /> กลับหน้าหลัก
            </Link>
            <p className="text-[11px] tracking-[0.35em] text-[#debc7c]">RETIREMENT PLANNING</p>
            <h1 className="rt-display mt-2 text-[40px] font-medium leading-tight text-stone-100 sm:text-5xl">
              วางแผนเกษียณ
            </h1>
            <p className="mt-3 max-w-xl text-sm font-light leading-6 text-stone-400">
              จำลองเส้นทางการเงินทั้งชีวิตของคุณ ปรับตัวเลขด้านซ้าย
              แล้วดูภาพอนาคตเปลี่ยนตามทันที
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {PRESETS.map((p) => (
              <button key={p.label} onClick={() => setInput(p.plan)} className={quietBtn}>
                {p.label}
              </button>
            ))}
            <button
              onClick={() => setInput(DEFAULT_PLAN)}
              aria-label="ล้างค่ากลับเป็นเริ่มต้น"
              className={quietBtn}
            >
              <RotateCcw size={13} />
            </button>
          </div>
        </motion.header>

        <div className="grid gap-5 lg:grid-cols-[370px,1fr]">
          {/* ── input column ─────────────────────────────── */}
          <motion.aside
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.08 }}
            className="rt-panel h-fit space-y-8 p-7 lg:sticky lg:top-6"
          >
            <Section no="01" title="ข้อมูลของคุณ">
              <SliderField label="อายุปัจจุบัน" value={input.currentAge} min={18} max={70} step={1} unit="ปี" onChange={(v) => set({ currentAge: v })} />
              <SliderField label="อายุที่จะเกษียณ" value={input.retireAge} min={40} max={75} step={1} unit="ปี" onChange={(v) => set({ retireAge: v })} />
              <SliderField
                label="วางแผนถึงอายุ"
                hint="อายุคาดเฉลี่ยของคนไทยอยู่ราว 80 ปี เผื่อถึง 85–90 จะปลอดภัยกว่า"
                value={input.endAge}
                min={70}
                max={100}
                step={1}
                unit="ปี"
                onChange={(v) => set({ endAge: v })}
              />
            </Section>

            <Section no="02" title="เงินออมและการลงทุน">
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

            <Section no="03" title="สมมติฐานผลตอบแทน">
              <SliderField label="ผลตอบแทนก่อนเกษียณ" hint="พอร์ตเติบโต เช่น กองทุนหุ้น 6–8% ต่อปี" value={input.preReturnPct} min={0} max={15} step={0.5} unit="%/ปี" onChange={(v) => set({ preReturnPct: v })} />
              <SliderField label="ผลตอบแทนหลังเกษียณ" hint="พอร์ตปลอดภัยขึ้น เช่น ตราสารหนี้ 3–5% ต่อปี" value={input.postReturnPct} min={0} max={12} step={0.5} unit="%/ปี" onChange={(v) => set({ postReturnPct: v })} />
              <SliderField label="อัตราเงินเฟ้อ" value={input.inflationPct} min={0} max={8} step={0.5} unit="%/ปี" onChange={(v) => set({ inflationPct: v })} />
            </Section>

            <Section no="04" title="ชีวิตหลังเกษียณ">
              <SliderField label="ค่าใช้จ่ายที่อยากมี" hint="คิดเป็นมูลค่าเงินวันนี้ ระบบจะปรับเงินเฟ้อให้เอง" value={input.monthlyExpense} min={5_000} max={300_000} step={1_000} unit="บาท/เดือน" format={numTH} onChange={(v) => set({ monthlyExpense: v })} />
              <SliderField label="บำนาญ/รายได้อื่น" hint="เช่น ประกันสังคม กบข. ค่าเช่า — มูลค่าเงินวันนี้" value={input.monthlyPension} min={0} max={100_000} step={500} unit="บาท/เดือน" format={numTH} onChange={(v) => set({ monthlyPension: v })} />
            </Section>
          </motion.aside>

          {/* ── results column ───────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.16 }}
            className="space-y-5"
          >
            {/* overview */}
            <div className="rt-panel p-7">
              <p className="rt-display text-xl leading-snug text-stone-200">{verdictLine}</p>
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
                    tone={onTarget ? "text-[#9dbfa9]" : "text-[#cf8d7a]"}
                  />
                  <Stat
                    label="เงินออมที่ควรออมต่อเดือน"
                    value={plan.requiredMonthlySaving}
                    sub={
                      extraNeeded > 0
                        ? `มากกว่าที่ออมตอนนี้ ${numTH(extraNeeded)} บาท`
                        : "ที่ออมอยู่ตอนนี้เพียงพอแล้ว"
                    }
                    tone={extraNeeded > 0 ? "text-[#e9cd92]" : "text-[#9dbfa9]"}
                  />
                </div>
              </div>
            </div>

            {/* chart */}
            <div className="rt-panel p-7">
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <h2 className="rt-display text-lg text-stone-100">เส้นทางความมั่งคั่งของคุณ</h2>
                <button onClick={copySummary} className={`${quietBtn} flex items-center gap-1.5`}>
                  {copied ? <Check size={12} className="text-[#9dbfa9]" /> : <Copy size={12} />}
                  {copied ? "คัดลอกแล้ว" : "คัดลอกสรุปแผน"}
                </button>
              </div>
              <WealthChart plan={plan} />
            </div>

            {/* insights */}
            <div className="rt-panel p-7">
              <h2 className="rt-display mb-2 text-lg text-stone-100">บทวิเคราะห์แผนของคุณ</h2>
              <ol>
                {insights.map((text, i) => (
                  <motion.li
                    key={text}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 * i }}
                    className="flex items-baseline gap-4 border-b border-white/5 py-3.5 text-sm font-light leading-6 text-stone-300 last:border-0 last:pb-0"
                  >
                    <span className="rt-display shrink-0 text-xs text-[#debc7c]">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    {text}
                  </motion.li>
                ))}
              </ol>
            </div>

            {/* year-by-year table */}
            <div className="rt-panel p-7">
              <button
                onClick={() => setShowTable((s) => !s)}
                className="flex w-full items-center justify-between text-left"
                aria-expanded={showTable}
              >
                <h2 className="rt-display text-lg text-stone-100">ตารางรายปี</h2>
                <ChevronDown
                  size={17}
                  className={`text-stone-500 transition-transform ${showTable ? "rotate-180" : ""}`}
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
                        <thead className="sticky top-0 bg-[#111110]">
                          <tr className="text-left text-[11px] text-stone-500">
                            <th className="py-2.5 pr-4 font-normal">อายุ</th>
                            <th className="py-2.5 pr-4 font-normal">พ.ศ.</th>
                            <th className="py-2.5 pr-4 font-normal">ช่วงชีวิต</th>
                            <th className="py-2.5 pr-4 text-right font-normal">ถอนใช้/ปี</th>
                            <th className="py-2.5 text-right font-normal">เงินคงเหลือ</th>
                          </tr>
                        </thead>
                        <tbody>
                          {plan.timeline.map((p) => (
                            <tr key={p.age} className="border-t border-white/5">
                              <td className="py-2 pr-4 text-stone-300">{p.age}</td>
                              <td className="py-2 pr-4 text-stone-600">{p.yearBE}</td>
                              <td className="py-2 pr-4">
                                <span className="inline-flex items-center gap-2 text-[12px] text-stone-400">
                                  <i
                                    className={`h-1.5 w-1.5 rounded-full ${
                                      p.phase === "save" ? "bg-[#debc7c]" : "bg-[#9dbfa9]"
                                    }`}
                                  />
                                  {p.phase === "save" ? "สะสม" : "เกษียณ"}
                                </span>
                              </td>
                              <td className="py-2 pr-4 text-right font-light text-stone-500">
                                {p.withdrawal > 0 ? formatBaht(p.withdrawal) : "—"}
                              </td>
                              <td
                                className={`py-2 text-right ${
                                  p.expected <= 0 && p.phase === "retire"
                                    ? "text-[#cf8d7a]"
                                    : "text-stone-200"
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

            <p className="px-2 pt-2 text-center text-[11px] font-light leading-5 text-stone-600">
              เครื่องมือนี้เป็นการจำลองเชิงตัวเลขเพื่อประกอบการวางแผนเท่านั้น ไม่ใช่คำแนะนำการลงทุน
              ผลตอบแทนจริงอาจผันผวนตามตลาด
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
