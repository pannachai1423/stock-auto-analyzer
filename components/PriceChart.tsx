"use client";

import { useEffect, useRef } from "react";
import { createChart, ColorType, IChartApi } from "lightweight-charts";
import type { StockAnalysis } from "@/lib/types";

type PriceChartProps = {
  analysis: StockAnalysis;
};

export function PriceChart({ analysis }: PriceChartProps) {
  const priceRef = useRef<HTMLDivElement | null>(null);
  const rsiRef = useRef<HTMLDivElement | null>(null);
  const macdRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!priceRef.current || !rsiRef.current || !macdRef.current) return;

    const charts: IChartApi[] = [];
    const common = {
      layout: { background: { type: ColorType.Solid, color: "#0d181d" }, textColor: "#a9bcc2" },
      grid: { vertLines: { color: "#17282f" }, horzLines: { color: "#17282f" } },
      rightPriceScale: { borderColor: "#24363d" },
      timeScale: { borderColor: "#24363d", timeVisible: false }
    };

    const priceChart = createChart(priceRef.current, { ...common, height: 430, autoSize: true });
    charts.push(priceChart);
    const candleSeries = priceChart.addCandlestickSeries({
      upColor: "#78d64b",
      downColor: "#f05252",
      borderVisible: false,
      wickUpColor: "#78d64b",
      wickDownColor: "#f05252"
    });
    candleSeries.setData(
      analysis.candles.map((candle) => ({
        time: candle.date,
        open: candle.open,
        high: candle.high,
        low: candle.low,
        close: candle.close
      }))
    );

    const volumeSeries = priceChart.addHistogramSeries({
      priceFormat: { type: "volume" },
      priceScaleId: "",
      color: "#44c7d8"
    });
    volumeSeries.priceScale().applyOptions({ scaleMargins: { top: 0.8, bottom: 0 } });
    volumeSeries.setData(
      analysis.candles.map((candle) => ({
        time: candle.date,
        value: candle.volume,
        color: candle.close >= candle.open ? "rgba(120,214,75,.34)" : "rgba(240,82,82,.34)"
      }))
    );

    addLine(priceChart, analysis.overlays.ema20, "#44c7d8", "EMA 20");
    addLine(priceChart, analysis.overlays.ema50, "#f5c542", "EMA 50");
    addLine(priceChart, analysis.overlays.ema200, "#b48cff", "EMA 200");

    for (const level of analysis.supportResistance.support) {
      candleSeries.createPriceLine({ price: level.price, color: "#78d64b", lineWidth: 1, lineStyle: 2, axisLabelVisible: true, title: level.label });
    }
    for (const level of analysis.supportResistance.resistance) {
      candleSeries.createPriceLine({ price: level.price, color: "#f05252", lineWidth: 1, lineStyle: 2, axisLabelVisible: true, title: level.label });
    }

    const rsiChart = createChart(rsiRef.current, { ...common, height: 170, autoSize: true });
    charts.push(rsiChart);
    addLine(rsiChart, analysis.overlays.rsi14, "#f5c542", "RSI 14");
    const rsi70 = rsiChart.addLineSeries({ color: "rgba(240,82,82,.55)", lineWidth: 1, lineStyle: 2 });
    rsi70.setData(analysis.candles.map((candle) => ({ time: candle.date, value: 70 })));
    const rsi30 = rsiChart.addLineSeries({ color: "rgba(120,214,75,.55)", lineWidth: 1, lineStyle: 2 });
    rsi30.setData(analysis.candles.map((candle) => ({ time: candle.date, value: 30 })));

    const macdChart = createChart(macdRef.current, { ...common, height: 190, autoSize: true });
    charts.push(macdChart);
    const histogram = macdChart.addHistogramSeries({ color: "#44c7d8" });
    histogram.setData(analysis.overlays.macdHistogram.map((point) => ({ time: point.time, value: point.value, color: point.value >= 0 ? "rgba(120,214,75,.65)" : "rgba(240,82,82,.65)" })));
    addLine(macdChart, analysis.overlays.macd, "#44c7d8", "MACD");
    addLine(macdChart, analysis.overlays.macdSignal, "#f5c542", "Signal");

    charts.forEach((chart) => chart.timeScale().fitContent());
    return () => charts.forEach((chart) => chart.remove());
  }, [analysis]);

  return (
    <section className="rounded-lg border border-line bg-panel p-3 shadow-glow">
      <div className="flex flex-wrap items-center justify-between gap-2 px-1 pb-3">
        <div>
          <h2 className="text-base font-semibold text-slate-100">Candlestick + Technical Panels</h2>
          <p className="text-xs text-slate-400">EMA 20/50/200, Volume, Support/Resistance, RSI, MACD</p>
        </div>
        <div className="flex gap-3 text-xs text-slate-300">
          <span className="text-lime">Support</span>
          <span className="text-danger">Resistance</span>
          <span className="text-cyan">EMA20</span>
        </div>
      </div>
      <div ref={priceRef} className="h-[430px] w-full" />
      <div className="mt-3 grid gap-3 lg:grid-cols-2">
        <div>
          <div className="mb-1 text-xs uppercase tracking-wide text-slate-400">RSI 14</div>
          <div ref={rsiRef} className="h-[170px] w-full" />
        </div>
        <div>
          <div className="mb-1 text-xs uppercase tracking-wide text-slate-400">MACD</div>
          <div ref={macdRef} className="h-[190px] w-full" />
        </div>
      </div>
    </section>
  );
}

function addLine(chart: IChartApi, data: { time: string; value: number }[], color: string, title: string) {
  const series = chart.addLineSeries({ color, lineWidth: 2, title });
  series.setData(data);
  return series;
}
