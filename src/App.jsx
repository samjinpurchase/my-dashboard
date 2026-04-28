import { useState, useEffect } from "react";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from "recharts";
import { auth, loginWithGoogle, logout, ALLOWED_EMAILS, HOST_EMAILS } from "./firebase";
import { onAuthStateChanged } from "firebase/auth";

// ⚠️ TEMP: ?preview 쿼리로 인증 우회 (Firebase 도메인 등록 전 임시 사용)
// Firebase 2단계 인증 + Authorized domain 등록 후에는 `&& import.meta.env.DEV`를 다시 추가하세요.
const DEV_BYPASS_AUTH = new URLSearchParams(window.location.search).has("preview");

const COMPANIES = [
  { id: "indonesia", name: "인도네시아 법인", short: "ID" },
  { id: "thailand", name: "태국 법인", short: "TH" },
  { id: "china", name: "청도 법인", short: "CN" },
  { id: "cni", name: "C&I", short: "CI" },
];

const COMPANY_DATA = {
  indonesia: {
    stockData: [
      { name: "알루미늄 판재", current: 120, min: 200, unit: "kg", status: "위험", category: "금속" },
      { name: "PCB 기판 A형", current: 45, min: 100, unit: "EA", status: "위험", category: "전자" },
      { name: "스테인리스 볼트 M8", current: 890, min: 500, unit: "EA", status: "정상", category: "체결" },
      { name: "절연 테이프", current: 30, min: 80, unit: "롤", status: "위험", category: "소모품" },
      { name: "구리 전선 2.5sq", current: 210, min: 150, unit: "m", status: "주의", category: "전선" },
      { name: "실리콘 가스켓", current: 55, min: 120, unit: "EA", status: "위험", category: "고무" },
      { name: "강판 2T", current: 340, min: 200, unit: "kg", status: "정상", category: "금속" },
      { name: "LED 드라이버 IC", current: 78, min: 150, unit: "EA", status: "위험", category: "전자" },
    ],
    forecastData: [
      { month: "1월", 소비량: 380, 입고량: 500, 재고: 520 },
      { month: "2월", 소비량: 420, 입고량: 300, 재고: 400 },
      { month: "3월", 소비량: 390, 입고량: 450, 재고: 460 },
      { month: "4월", 소비량: 510, 입고량: 200, 재고: 150 },
      { month: "5월", 소비량: 480, 입고량: 600, 재고: 270 },
      { month: "6월", 소비량: 440, 입고량: 400, 재고: 230 },
    ],
    categoryData: [
      { name: "금속", value: 34 }, { name: "전자", value: 28 },
      { name: "체결", value: 18 }, { name: "소모품", value: 12 }, { name: "기타", value: 8 },
    ],
    bomData: [
      { id: "BOM-001", product: "컨트롤 패널 A", material: "알루미늄 판재", qty: 2.5, unit: "kg", unitPrice: 8200, supplier: "PT Alumindo", lastUpdated: "2025-06-10", change: 3.2 },
      { id: "BOM-002", product: "컨트롤 패널 A", material: "PCB 기판 A형", qty: 1, unit: "EA", unitPrice: 34000, supplier: "PT Samsung", lastUpdated: "2025-06-08", change: -1.5 },
      { id: "BOM-003", product: "배전반 B형", material: "강판 2T", qty: 5.2, unit: "kg", unitPrice: 3800, supplier: "PT Posco", lastUpdated: "2025-06-12", change: 0.8 },
      { id: "BOM-004", product: "배전반 B형", material: "스테인리스 볼트 M8", qty: 24, unit: "EA", unitPrice: 280, supplier: "PT Bolt", lastUpdated: "2025-06-05", change: 0 },
    ],
    priceHistory: [
      { month: "1월", 알루미늄: 7800, PCB: 34500, 강판: 3600 },
      { month: "2월", 알루미늄: 7900, PCB: 34200, 강판: 3650 },
      { month: "3월", 알루미늄: 8000, PCB: 34000, 강판: 3700 },
      { month: "4월", 알루미늄: 8050, PCB: 33800, 강판: 3720 },
      { month: "5월", 알루미늄: 8100, PCB: 34100, 강판: 3780 },
      { month: "6월", 알루미늄: 8200, PCB: 34000, 강판: 3800 },
    ],
  },
  thailand: {
    stockData: [
      { name: "고무 씰링", current: 85, min: 200, unit: "EA", status: "위험", category: "고무" },
      { name: "구리 파이프", current: 320, min: 300, unit: "m", status: "주의", category: "금속" },
      { name: "PVC 케이블", current: 150, min: 100, unit: "m", status: "정상", category: "전선" },
      { name: "나사 M10", current: 1200, min: 800, unit: "EA", status: "정상", category: "체결" },
      { name: "에폭시 수지", current: 20, min: 60, unit: "kg", status: "위험", category: "화학" },
      { name: "알루미늄 프로파일", current: 95, min: 150, unit: "EA", status: "위험", category: "금속" },
    ],
    forecastData: [
      { month: "1월", 소비량: 290, 입고량: 400, 재고: 410 },
      { month: "2월", 소비량: 310, 입고량: 250, 재고: 350 },
      { month: "3월", 소비량: 330, 입고량: 380, 재고: 400 },
      { month: "4월", 소비량: 420, 입고량: 150, 재고: 130 },
      { month: "5월", 소비량: 380, 입고량: 500, 재고: 250 },
      { month: "6월", 소비량: 360, 입고량: 350, 재고: 240 },
    ],
    categoryData: [
      { name: "금속", value: 30 }, { name: "고무", value: 25 },
      { name: "전선", value: 20 }, { name: "체결", value: 15 }, { name: "화학", value: 10 },
    ],
    bomData: [
      { id: "BOM-T01", product: "유압 실린더", material: "고무 씰링", qty: 4, unit: "EA", unitPrice: 5500, supplier: "Thai Rubber Co.", lastUpdated: "2025-06-10", change: 2.1 },
      { id: "BOM-T02", product: "유압 실린더", material: "구리 파이프", qty: 2.5, unit: "m", unitPrice: 12000, supplier: "Thai Metal", lastUpdated: "2025-06-08", change: -0.8 },
      { id: "BOM-T03", product: "배선 패널", material: "PVC 케이블", qty: 10, unit: "m", unitPrice: 3500, supplier: "Thai Electric", lastUpdated: "2025-06-11", change: 1.5 },
      { id: "BOM-T04", product: "배선 패널", material: "나사 M10", qty: 30, unit: "EA", unitPrice: 150, supplier: "Thai Bolt", lastUpdated: "2025-06-09", change: 0 },
    ],
    priceHistory: [
      { month: "1월", 고무씰링: 5200, 구리파이프: 11500, PVC: 3200 },
      { month: "2월", 고무씰링: 5300, 구리파이프: 11800, PVC: 3300 },
      { month: "3월", 고무씰링: 5350, 구리파이프: 12000, PVC: 3400 },
      { month: "4월", 고무씰링: 5400, 구리파이프: 11900, PVC: 3450 },
      { month: "5월", 고무씰링: 5450, 구리파이프: 12100, PVC: 3480 },
      { month: "6월", 고무씰링: 5500, 구리파이프: 12000, PVC: 3500 },
    ],
  },
  china: {
    stockData: [
      { name: "철판 SS400", current: 250, min: 300, unit: "kg", status: "주의", category: "금속" },
      { name: "용접봉", current: 15, min: 50, unit: "kg", status: "위험", category: "소모품" },
      { name: "그라인더 디스크", current: 80, min: 100, unit: "EA", status: "주의", category: "소모품" },
      { name: "앵글 L50", current: 420, min: 200, unit: "EA", status: "정상", category: "금속" },
      { name: "볼트 M12", current: 35, min: 200, unit: "EA", status: "위험", category: "체결" },
    ],
    forecastData: [
      { month: "1월", 소비량: 200, 입고량: 300, 재고: 350 },
      { month: "2월", 소비량: 220, 입고량: 200, 재고: 330 },
      { month: "3월", 소비량: 240, 입고량: 280, 재고: 370 },
      { month: "4월", 소비량: 300, 입고량: 100, 재고: 170 },
      { month: "5월", 소비량: 280, 입고량: 400, 재고: 290 },
      { month: "6월", 소비량: 260, 입고량: 300, 재고: 330 },
    ],
    categoryData: [
      { name: "금속", value: 45 }, { name: "소모품", value: 30 },
      { name: "체결", value: 15 }, { name: "기타", value: 10 },
    ],
    bomData: [
      { id: "BOM-C01", product: "철구조물 A", material: "철판 SS400", qty: 10, unit: "kg", unitPrice: 2500, supplier: "청도철강", lastUpdated: "2025-06-10", change: 1.5 },
      { id: "BOM-C02", product: "철구조물 A", material: "용접봉", qty: 2, unit: "kg", unitPrice: 8000, supplier: "청도소모품", lastUpdated: "2025-06-08", change: 0.5 },
      { id: "BOM-C03", product: "지지대 B", material: "앵글 L50", qty: 8, unit: "EA", unitPrice: 3200, supplier: "청도앵글", lastUpdated: "2025-06-11", change: -1.0 },
      { id: "BOM-C04", product: "지지대 B", material: "볼트 M12", qty: 20, unit: "EA", unitPrice: 200, supplier: "청도볼트", lastUpdated: "2025-06-09", change: 0 },
    ],
    priceHistory: [
      { month: "1월", 철판: 2300, 용접봉: 7500, 앵글: 3000 },
      { month: "2월", 철판: 2350, 용접봉: 7700, 앵글: 3100 },
      { month: "3월", 철판: 2400, 용접봉: 7800, 앵글: 3150 },
      { month: "4월", 철판: 2420, 용접봉: 7900, 앵글: 3180 },
      { month: "5월", 철판: 2450, 용접봉: 8000, 앵글: 3200 },
      { month: "6월", 철판: 2500, 용접봉: 8000, 앵글: 3200 },
    ],
  },
  cni: {
    stockData: [
      { name: "스테인리스 304", current: 180, min: 250, unit: "kg", status: "주의", category: "금속" },
      { name: "유압호스", current: 12, min: 40, unit: "EA", status: "위험", category: "유압" },
      { name: "오링 세트", current: 300, min: 200, unit: "SET", status: "정상", category: "고무" },
      { name: "전기케이블 4sq", current: 80, min: 150, unit: "m", status: "위험", category: "전선" },
      { name: "필터 엘리먼트", current: 5, min: 20, unit: "EA", status: "위험", category: "소모품" },
    ],
    forecastData: [
      { month: "1월", 소비량: 150, 입고량: 200, 재고: 280 },
      { month: "2월", 소비량: 170, 입고량: 150, 재고: 260 },
      { month: "3월", 소비량: 160, 입고량: 220, 재고: 320 },
      { month: "4월", 소비량: 220, 입고량: 80, 재고: 180 },
      { month: "5월", 소비량: 200, 입고량: 300, 재고: 280 },
      { month: "6월", 소비량: 180, 입고량: 250, 재고: 350 },
    ],
    categoryData: [
      { name: "금속", value: 35 }, { name: "유압", value: 25 },
      { name: "고무", value: 20 }, { name: "전선", value: 12 }, { name: "소모품", value: 8 },
    ],
    bomData: [
      { id: "BOM-CI01", product: "유압장치 A", material: "유압호스", qty: 2, unit: "EA", unitPrice: 45000, supplier: "C&I유압", lastUpdated: "2025-06-10", change: 4.2 },
      { id: "BOM-CI02", product: "유압장치 A", material: "오링 세트", qty: 1, unit: "SET", unitPrice: 12000, supplier: "C&I고무", lastUpdated: "2025-06-08", change: 0 },
      { id: "BOM-CI03", product: "제어패널 C", material: "전기케이블 4sq", qty: 15, unit: "m", unitPrice: 4500, supplier: "C&I전선", lastUpdated: "2025-06-11", change: -1.8 },
      { id: "BOM-CI04", product: "제어패널 C", material: "필터 엘리먼트", qty: 2, unit: "EA", unitPrice: 28000, supplier: "C&I필터", lastUpdated: "2025-06-09", change: 2.5 },
    ],
    priceHistory: [
      { month: "1월", 스테인리스: 18000, 유압호스: 42000, 케이블: 4200 },
      { month: "2월", 스테인리스: 18200, 유압호스: 43000, 케이블: 4300 },
      { month: "3월", 스테인리스: 18500, 유압호스: 44000, 케이블: 4350 },
      { month: "4월", 스테인리스: 18700, 유압호스: 44500, 케이블: 4400 },
      { month: "5월", 스테인리스: 19000, 유압호스: 45000, 케이블: 4450 },
      { month: "6월", 스테인리스: 19200, 유압호스: 45000, 케이블: 4500 },
    ],
  },
};

const PIE_COLORS = ["#c15f3c", "#b8896b", "#8a8578", "#c9b89c", "#d7c5a8", "#a67c5a", "#d4a574", "#7d6f5d"];

// ─── Excel format auto-detect (Samjin Material Simulation) ──────────
function inferCategory(item) {
  const n = String(item || "").toLowerCase();
  if (/switch|button|key/.test(n)) return "스위치/버튼";
  if (/sensor|accelerometer|gyro|magnet/.test(n)) return "센서";
  if (/eeprom|fram|flash|memory|sram|dram/.test(n)) return "메모리";
  if (/\bic\b|mcu|driver|detector|controller|chip|processor|regulator/.test(n)) return "IC";
  if (/connector|jack|socket|header|terminal|fpc/.test(n)) return "커넥터";
  if (/capacitor|cap\b|resistor|inductor|res\b/.test(n)) return "수동소자";
  if (/oled|lcd|display|panel/.test(n)) return "디스플레이";
  if (/led|lamp/.test(n)) return "LED";
  if (/battery|cell/.test(n)) return "배터리";
  if (/pcb|board/.test(n)) return "PCB";
  if (/cable|wire|harness/.test(n)) return "전선";
  if (/buzzer|speaker|microphone|mic\b/.test(n)) return "음향";
  if (/antenna/.test(n)) return "안테나";
  if (/crystal|oscillator|xtal/.test(n)) return "발진기";
  if (/diode|rectifier|tvs/.test(n)) return "다이오드";
  if (/transistor|fet|mosfet/.test(n)) return "트랜지스터";
  return "기타";
}

function parseSamjinSimulation(workbook, XLSX) {
  // Pick the latest weekly sheet (e.g. 26W14)
  const wpat = /^(\d{2})W(\d{2})$/;
  const sheets = workbook.SheetNames
    .filter(n => wpat.test(n))
    .map(n => { const m = n.match(wpat); return { name: n, sk: +m[1] * 100 + +m[2] }; })
    .sort((a, b) => b.sk - a.sk);
  if (sheets.length === 0) return null;

  const sheetName = sheets[0].name;
  const ws = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });

  // Locate header row
  let hi = -1;
  for (let i = 0; i < Math.min(5, rows.length); i++) {
    const row = rows[i].map(v => String(v || ""));
    if (row.some(v => /재고/.test(v) && /기준/.test(v)) &&
        row.some(v => v.trim() === "Item") &&
        row.some(v => v.trim() === "Sort")) { hi = i; break; }
  }
  if (hi === -1) return null;

  const header = rows[hi].map(v => String(v || "").replace(/\s+/g, " ").trim());
  const sub = (rows[hi + 1] || []).map(v => String(v || "").trim());
  const idxOf = (p) => header.findIndex(p);
  const C = {
    code: idxOf(h => h === "CODE"),
    item: idxOf(h => h === "Item"),
    maker: idxOf(h => h === "Maker"),
    lt: idxOf(h => /^L\/T/.test(h)),
    stock: idxOf(h => /재고/.test(h)),
    sort: idxOf(h => h === "Sort"),
    ttl: idxOf(h => /2025.*TTL/i.test(h) && !/Last Ver/i.test(h)),
  };
  if (C.item < 0 || C.stock < 0 || C.sort < 0) return null;

  // Monthly TTL columns (first 6 months)
  const m6 = [];
  for (let j = (C.ttl || 0) + 1; j < sub.length && m6.length < 6; j++) {
    if (sub[j] === "TTL") m6.push(j);
  }

  const labels = ["1월", "2월", "3월", "4월", "5월", "6월"];
  const cons = Array(6).fill(0), rcv = Array(6).fill(0), bal = Array(6).fill(0);
  const mats = [];
  const seen = new Map();

  for (let i = hi + 2; i < rows.length; i++) {
    const r = rows[i];
    const s = String(r[C.sort] || "").trim();
    if (s.startsWith("FCST")) {
      const baseName = String(r[C.item] || "").trim();
      if (!baseName) continue;
      const code = String(r[C.code] || "").trim();
      // Disambiguate duplicates by appending code suffix
      let name = baseName;
      if (seen.has(baseName)) name = `${baseName} (${code.slice(-5) || seen.get(baseName) + 1})`;
      seen.set(baseName, (seen.get(baseName) || 0) + 1);

      const stock = Number(r[C.stock]) || 0;
      const ltm = String(r[C.lt] || "").match(/(\d+)/);
      const ltWeeks = ltm ? +ltm[1] : 8;
      const ttl = Number(r[C.ttl]) || 0;
      const minStock = Math.max(0, Math.round((ttl / 52) * Math.max(ltWeeks, 4)));
      const ratio = minStock > 0 ? (stock / minStock) * 100 : 100;
      const status = minStock === 0 ? "정상" : ratio < 60 ? "위험" : ratio < 90 ? "주의" : "정상";

      mats.push({ name, category: inferCategory(baseName), current: stock, min: minStock, unit: "EA", status });
      m6.forEach((c, mi) => { cons[mi] += Number(r[c]) || 0; });
    } else if (s === "ETA (AIR)" || s === "ETA(AIR)") {
      m6.forEach((c, mi) => { rcv[mi] += Number(r[c]) || 0; });
    } else if (s === "Balance") {
      m6.forEach((c, mi) => { bal[mi] += Number(r[c]) || 0; });
    }
  }

  if (mats.length === 0) return null;

  const forecastData = labels.map((month, i) => ({
    month, 소비량: cons[i], 입고량: rcv[i], 재고: Math.max(0, bal[i]),
  }));

  const cmap = {};
  mats.forEach(m => { cmap[m.category] = (cmap[m.category] || 0) + 1; });
  const total = mats.length;
  const categoryData = Object.entries(cmap)
    .map(([name, count]) => ({ name, value: Math.round((count / total) * 100) }))
    .sort((a, b) => b.value - a.value);

  return { materials: mats, forecastData, categoryData, sourceSheet: sheetName };
}

const VENDOR_CATEGORIES = ["금속", "전자", "체결", "소모품", "전선", "고무", "화학", "유압", "기타"];

const INITIAL_VENDORS = [
  { id: "V001", name: "PT Alumindo", category: "금속", country: "인도네시아", contact: "Ahmad Rizky", email: "ahmad@alumindo.co.id", phone: "+62-21-5551234", status: "거래중", registeredAt: "2024-03-15" },
  { id: "V002", name: "PT Samsung", category: "전자", country: "인도네시아", contact: "Kim Jinsoo", email: "jinsoo@samsung.co.id", phone: "+62-21-5552345", status: "거래중", registeredAt: "2024-04-02" },
  { id: "V003", name: "Thai Rubber Co.", category: "고무", country: "태국", contact: "Somchai P.", email: "somchai@thairubber.th", phone: "+66-2-5553456", status: "거래중", registeredAt: "2024-01-20" },
  { id: "V004", name: "청도철강", category: "금속", country: "중국", contact: "왕웨이", email: "wangwei@qd-steel.cn", phone: "+86-532-5554567", status: "거래중", registeredAt: "2024-02-11" },
  { id: "V005", name: "C&I유압", category: "유압", country: "한국", contact: "이철수", email: "cs.lee@cni.co.kr", phone: "+82-2-5555678", status: "거래중", registeredAt: "2023-12-01" },
  { id: "V006", name: "Thai Electric", category: "전선", country: "태국", contact: "Nattaporn K.", email: "nk@thaielectric.th", phone: "+66-2-5556789", status: "거래 검토", registeredAt: "2025-01-08" },
];

// ─── Icons ─────────────────────────────────────────────
const Icon = ({ path, className = "w-4 h-4" }) => (
  <svg className={className} fill="none" stroke="currentColor" strokeWidth="1.6" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d={path} />
  </svg>
);
const ICONS = {
  box: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4",
  doc: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
  building: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0H5m14 0h2m-16 0H3m4-3h2m4 0h2M7 13h2m4 0h2M7 9h2m4 0h2",
  plus: "M12 4v16m8-8H4",
  close: "M6 18L18 6M6 6l12 12",
  upload: "M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12",
  chev: "M19 9l-7 7-7-7",
  menu: "M4 6h16M4 12h16M4 18h16",
  check: "M5 13l4 4L19 7",
  search: "M21 21l-4.35-4.35M17 10a7 7 0 11-14 0 7 7 0 0114 0z",
  logout: "M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1",
};

// ─── Primitives ────────────────────────────────────────
function LoginPage({ onLogin, error }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "var(--bg)" }}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-10 h-10 mx-auto mb-5 rounded-lg flex items-center justify-center" style={{ background: "var(--accent)" }}>
            <Icon path={ICONS.box} className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-[17px] font-medium text-[var(--text)] mb-1">자재 관리 시스템</h1>
          <p className="text-[12px] text-[var(--text-muted)]">MRP Dashboard · 삼진</p>
        </div>
        {error && (
          <div className="text-[12px] text-red-600 bg-red-50 border border-red-100 rounded-md px-3 py-2 mb-4">
            {error}
          </div>
        )}
        <button onClick={onLogin} className="w-full flex items-center justify-center gap-2.5 border border-[var(--border)] bg-white rounded-md px-4 py-2.5 text-[13px] font-medium text-[var(--text)] hover:bg-[var(--border-soft)] transition-colors">
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Google로 계속하기
        </button>
        <p className="text-[11px] text-[var(--text-faint)] text-center mt-5">허가된 계정만 접속할 수 있습니다.</p>
      </div>
    </div>
  );
}

const StatusBadge = ({ status }) => {
  const map = {
    위험: "text-red-700 bg-red-50 border-red-100",
    주의: "text-amber-700 bg-amber-50 border-amber-100",
    정상: "text-emerald-700 bg-emerald-50 border-emerald-100",
    "거래중": "text-emerald-700 bg-emerald-50 border-emerald-100",
    "거래 검토": "text-amber-700 bg-amber-50 border-amber-100",
    "거래 중단": "text-red-700 bg-red-50 border-red-100",
  };
  return <span className={`inline-flex text-[11px] font-medium px-1.5 py-0.5 rounded border ${map[status] || "text-gray-600 bg-gray-50 border-gray-100"}`}>{status}</span>;
};

const StockBar = ({ current, min }) => {
  const ratio = Math.min((current / min) * 100, 100);
  const color = ratio < 60 ? "#dc2626" : ratio < 90 ? "#d97706" : "#059669";
  return (
    <div className="w-full h-1 rounded-full" style={{ background: "var(--border-soft)" }}>
      <div className="h-1 rounded-full transition-all" style={{ width: `${ratio}%`, backgroundColor: color }} />
    </div>
  );
};

const UploadButton = ({ label, onUpload }) => (
  <label className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-[var(--border)] bg-white hover:bg-[var(--border-soft)] text-[12px] font-medium text-[var(--text)] rounded-md transition-colors cursor-pointer">
    <Icon path={ICONS.upload} className="w-3.5 h-3.5" />
    <span className="hidden sm:inline">{label}</span>
    <span className="sm:hidden">업로드</span>
    <input type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={onUpload} />
  </label>
);

const StatCard = ({ label, value, sub, tone = "default" }) => {
  const toneMap = {
    default: "text-[var(--text)]",
    danger: "text-red-700",
    warn: "text-amber-700",
    ok: "text-emerald-700",
  };
  return (
    <div className="bg-white border border-[var(--border)] rounded-lg px-4 py-3">
      <p className="text-[11px] text-[var(--text-muted)] font-medium">{label}</p>
      <p className={`text-[22px] font-medium leading-tight mt-1 ${toneMap[tone]}`}>{value}</p>
      {sub && <p className="text-[11px] text-[var(--text-faint)] mt-0.5">{sub}</p>}
    </div>
  );
};

const SectionHeader = ({ title, desc, children }) => (
  <div className="flex items-start sm:items-center justify-between gap-3 flex-wrap">
    <div>
      <h2 className="text-[15px] font-medium text-[var(--text)]">{title}</h2>
      {desc && <p className="text-[12px] text-[var(--text-muted)] mt-0.5">{desc}</p>}
    </div>
    {children && <div className="flex items-center gap-2 flex-wrap">{children}</div>}
  </div>
);

const Card = ({ title, children, action }) => (
  <div className="bg-white border border-[var(--border)] rounded-lg overflow-hidden">
    {(title || action) && (
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-soft)] gap-3 flex-wrap">
        {title && <h3 className="text-[12px] font-medium text-[var(--text)] uppercase tracking-wide">{title}</h3>}
        {action}
      </div>
    )}
    <div>{children}</div>
  </div>
);

const chartAxis = { tick: { fontSize: 10, fill: "#8a8578" }, axisLine: false, tickLine: false };
const chartTooltip = { contentStyle: { borderRadius: 6, border: "1px solid #e8e4da", fontSize: 11, padding: "6px 10px", background: "white" } };

// ─── Stock Forecast ─────────────────────────────────────
function StockForecastPage({ isHost, companyId }) {
  const [filter, setFilter] = useState("전체");
  const [stockData, setStockData] = useState(COMPANY_DATA[companyId].stockData);
  const [forecastData, setForecastData] = useState(COMPANY_DATA[companyId].forecastData);
  const [categoryData, setCategoryData] = useState(COMPANY_DATA[companyId].categoryData);
  const [sourceLabel, setSourceLabel] = useState("");

  useEffect(() => {
    setStockData(COMPANY_DATA[companyId].stockData);
    setForecastData(COMPANY_DATA[companyId].forecastData);
    setCategoryData(COMPANY_DATA[companyId].categoryData);
    setFilter("전체");
    setSourceLabel("");
  }, [companyId]);

  const categories = ["전체", ...new Set(stockData.map(d => d.category))];
  const filtered = filter === "전체" ? stockData : stockData.filter(d => d.category === filter);
  const danger = stockData.filter(d => d.status === "위험").length;
  const warning = stockData.filter(d => d.status === "주의").length;

  const handleUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    import("xlsx").then(XLSX => {
      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const wb = XLSX.read(evt.target.result, { type: "array" });

          // 1) Try Samjin weekly simulation format
          const samjin = parseSamjinSimulation(wb, XLSX);
          if (samjin) {
            setStockData(samjin.materials);
            setForecastData(samjin.forecastData);
            setCategoryData(samjin.categoryData);
            setSourceLabel(`${file.name} · ${samjin.sourceSheet}`);
            setFilter("전체");
            const d = samjin.materials.filter(m => m.status === "위험").length;
            const w = samjin.materials.filter(m => m.status === "주의").length;
            alert(`✅ 삼진 시뮬레이션 양식 인식\n· 시트: ${samjin.sourceSheet}\n· 자재: ${samjin.materials.length}개 (위험 ${d} · 주의 ${w})`);
            return;
          }

          // 2) Fallback: simple format
          const ws = wb.Sheets[wb.SheetNames[0]];
          const rows = XLSX.utils.sheet_to_json(ws);
          const mapped = rows.map(r => ({
            name: r["자재명"] || "", category: r["카테고리"] || "",
            current: Number(r["현재고"] || 0), unit: r["단위"] || "",
            min: Number(r["최소기준수량"] || 0),
            status: Number(r["현재고"]) / Number(r["최소기준수량"]) * 100 < 60 ? "위험" : Number(r["현재고"]) / Number(r["최소기준수량"]) * 100 < 90 ? "주의" : "정상",
          })).filter(r => r.name);
          if (mapped.length > 0) {
            setStockData(mapped);
            setSourceLabel(file.name);
            alert(`${mapped.length}개 자재 데이터 업로드 완료`);
          } else {
            alert("⚠️ 양식을 인식할 수 없습니다.\n\n지원 양식:\n• 삼진 주간 시뮬레이션 (시트명 25W18, 26W14 등)\n• 단순 양식 (자재명/카테고리/현재고/단위/최소기준수량 컬럼)");
          }
        } catch (err) {
          console.error(err);
          alert("⚠️ 파일 읽기 오류: " + err.message);
        }
      };
      reader.readAsArrayBuffer(file);
    });
    e.target.value = "";
  };

  return (
    <div className="space-y-5">
      <SectionHeader title="자재 부족 예측 툴" desc={sourceLabel ? `데이터 출처: ${sourceLabel}` : "실시간 재고 현황 및 소비 예측 분석"}>
        {isHost && <UploadButton label="재고 엑셀 업로드" onUpload={handleUpload} />}
      </SectionHeader>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="전체 자재" value={stockData.length} sub="등록 품목" />
        <StatCard label="위험 재고" value={danger} sub="즉시 발주 필요" tone="danger" />
        <StatCard label="주의 재고" value={warning} sub="모니터링 필요" tone="warn" />
        <StatCard label="정상 재고" value={stockData.length - danger - warning} sub="안정 수준" tone="ok" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <div className="lg:col-span-2">
          <Card title="월별 소비·입고·재고 추이">
            <div className="p-4">
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={forecastData}>
                  <CartesianGrid strokeDasharray="2 4" stroke="#e8e4da" vertical={false} />
                  <XAxis dataKey="month" {...chartAxis} />
                  <YAxis {...chartAxis} />
                  <Tooltip {...chartTooltip} />
                  <Legend iconType="circle" iconSize={6} wrapperStyle={{ fontSize: 10, paddingTop: 8 }} />
                  <Line type="monotone" dataKey="소비량" stroke="#dc2626" strokeWidth={1.5} dot={false} />
                  <Line type="monotone" dataKey="입고량" stroke="#c15f3c" strokeWidth={1.5} dot={false} />
                  <Line type="monotone" dataKey="재고" stroke="#059669" strokeWidth={1.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
        <Card title="카테고리별 비중">
          <div className="p-4">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={categoryData} cx="50%" cy="50%" innerRadius={42} outerRadius={70} paddingAngle={2} dataKey="value">
                  {categoryData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip {...chartTooltip} formatter={(v) => `${v}%`} />
                <Legend iconType="circle" iconSize={6} wrapperStyle={{ fontSize: 10 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <Card title="재고 현황" action={
        <div className="flex gap-1 flex-wrap">
          {categories.map(c => (
            <button key={c} onClick={() => setFilter(c)}
              className={`text-[11px] px-2 py-1 rounded-md font-medium transition-colors ${filter === c ? "bg-[var(--text)] text-white" : "text-[var(--text-muted)] hover:bg-[var(--border-soft)]"}`}>{c}</button>
          ))}
        </div>
      }>
        <div className="overflow-x-auto">
          <table className="w-full text-[12px]">
            <thead>
              <tr className="text-[10px] text-[var(--text-muted)] font-medium uppercase tracking-wide bg-[var(--border-soft)]/40 border-b border-[var(--border-soft)]">
                <th className="px-4 py-2 text-left font-medium">자재명</th>
                <th className="px-4 py-2 text-left font-medium">카테고리</th>
                <th className="px-4 py-2 text-right font-medium">현재고</th>
                <th className="px-4 py-2 text-right font-medium">최소기준</th>
                <th className="px-4 py-2 text-left font-medium w-32">재고율</th>
                <th className="px-4 py-2 text-center font-medium">상태</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row, i) => (
                <tr key={i} className="border-b border-[var(--border-soft)] last:border-0 hover:bg-[var(--border-soft)]/30">
                  <td className="px-4 py-2.5 font-medium text-[var(--text)]">{row.name}</td>
                  <td className="px-4 py-2.5 text-[var(--text-muted)]">{row.category}</td>
                  <td className="px-4 py-2.5 text-right font-mono text-[var(--text)]">{row.current.toLocaleString()} <span className="text-[var(--text-faint)]">{row.unit}</span></td>
                  <td className="px-4 py-2.5 text-right font-mono text-[var(--text-faint)]">{row.min.toLocaleString()}</td>
                  <td className="px-4 py-2.5"><StockBar current={row.current} min={row.min} /></td>
                  <td className="px-4 py-2.5 text-center"><StatusBadge status={row.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

// ─── BOM Price ──────────────────────────────────────────
function BomPricePage({ isHost, companyId }) {
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("change");
  const [bomData, setBomData] = useState(COMPANY_DATA[companyId].bomData);
  const data = COMPANY_DATA[companyId];

  useEffect(() => { setBomData(COMPANY_DATA[companyId].bomData); setSearch(""); }, [companyId]);

  const filtered = bomData.filter(r => r.product.includes(search) || r.material.includes(search) || r.supplier.includes(search));
  const sorted = [...filtered].sort((a, b) => sortBy === "change" ? Math.abs(b.change) - Math.abs(a.change) : b.unitPrice - a.unitPrice);
  const priceKeys = data.priceHistory.length > 0 ? Object.keys(data.priceHistory[0]).filter(k => k !== "month") : [];
  const barColors = ["#c15f3c", "#8a8578", "#b8896b", "#d97706", "#059669"];

  const handleUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    import("xlsx").then(XLSX => {
      const reader = new FileReader();
      reader.onload = (evt) => {
        const wb = XLSX.read(evt.target.result, { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(ws);
        const mapped = rows.map(r => ({
          id: r["BOM ID"] || "", product: r["제품명"] || "", material: r["자재명"] || "",
          qty: Number(r["수량"] || 0), unit: r["단위"] || "",
          unitPrice: Number(r["단가(원)"] || 0), supplier: r["공급사"] || "",
          lastUpdated: r["최종업데이트"] || "", change: Number(r["변동률(%)"] || 0),
        })).filter(r => r.material);
        if (mapped.length > 0) { setBomData(mapped); alert(`${mapped.length}개 BOM 데이터 업로드 완료`); }
        else alert("데이터를 읽을 수 없습니다.");
      };
      reader.readAsArrayBuffer(file);
    });
    e.target.value = "";
  };

  const avg = bomData.length ? (bomData.reduce((s, d) => s + d.change, 0) / bomData.length).toFixed(1) : 0;

  return (
    <div className="space-y-5">
      <SectionHeader title="BOM 단가 원북" desc="제품별 자재 단가 현황 및 가격 변동 이력">
        {isHost && <UploadButton label="BOM 엑셀 업로드" onUpload={handleUpload} />}
      </SectionHeader>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="등록 BOM" value={bomData.length} sub="전체 품목" />
        <StatCard label="상승 품목" value={bomData.filter(d => d.change > 0).length} sub="전월 대비" tone="danger" />
        <StatCard label="하락 품목" value={bomData.filter(d => d.change < 0).length} sub="전월 대비" tone="ok" />
        <StatCard label="평균 변동률" value={`${avg}%`} sub="이번 달" />
      </div>

      <Card title="주요 자재 단가 이력">
        <div className="p-4">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data.priceHistory} barGap={4}>
              <CartesianGrid strokeDasharray="2 4" stroke="#e8e4da" vertical={false} />
              <XAxis dataKey="month" {...chartAxis} />
              <YAxis {...chartAxis} />
              <Tooltip {...chartTooltip} formatter={(v) => `₩${v.toLocaleString()}`} />
              <Legend iconType="square" iconSize={8} wrapperStyle={{ fontSize: 10, paddingTop: 8 }} />
              {priceKeys.map((key, i) => <Bar key={key} dataKey={key} fill={barColors[i % barColors.length]} radius={[3, 3, 0, 0]} />)}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card title="단가 목록" action={
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Icon path={ICONS.search} className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-faint)]" />
            <input type="text" placeholder="제품·자재·공급사" value={search} onChange={e => setSearch(e.target.value)}
              className="text-[12px] bg-white border border-[var(--border)] rounded-md pl-8 pr-3 py-1.5 w-44 focus:outline-none focus:border-[var(--accent)]" />
          </div>
          <select value={sortBy} onChange={e => setSortBy(e.target.value)}
            className="text-[12px] bg-white border border-[var(--border)] rounded-md px-2.5 py-1.5 focus:outline-none focus:border-[var(--accent)]">
            <option value="change">변동률 순</option>
            <option value="price">단가 순</option>
          </select>
        </div>
      }>
        <div className="overflow-x-auto">
          <table className="w-full text-[12px]">
            <thead>
              <tr className="text-[10px] text-[var(--text-muted)] font-medium uppercase tracking-wide bg-[var(--border-soft)]/40 border-b border-[var(--border-soft)]">
                <th className="px-4 py-2 text-left font-medium">BOM ID</th>
                <th className="px-4 py-2 text-left font-medium">제품</th>
                <th className="px-4 py-2 text-left font-medium">자재명</th>
                <th className="px-4 py-2 text-right font-medium">수량</th>
                <th className="px-4 py-2 text-right font-medium">단가</th>
                <th className="px-4 py-2 text-left font-medium">공급사</th>
                <th className="px-4 py-2 text-center font-medium">변동률</th>
                <th className="px-4 py-2 text-center font-medium">업데이트</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((row, i) => (
                <tr key={i} className="border-b border-[var(--border-soft)] last:border-0 hover:bg-[var(--border-soft)]/30">
                  <td className="px-4 py-2.5 font-mono text-[10px] text-[var(--text-faint)]">{row.id}</td>
                  <td className="px-4 py-2.5 font-medium text-[var(--text)]">{row.product}</td>
                  <td className="px-4 py-2.5 text-[var(--text-muted)]">{row.material}</td>
                  <td className="px-4 py-2.5 text-right font-mono text-[var(--text-muted)]">{row.qty} {row.unit}</td>
                  <td className="px-4 py-2.5 text-right font-mono font-medium text-[var(--text)]">₩{row.unitPrice.toLocaleString()}</td>
                  <td className="px-4 py-2.5 text-[var(--text-muted)]">{row.supplier}</td>
                  <td className="px-4 py-2.5 text-center">
                    <span className={`text-[11px] font-medium ${row.change > 0 ? "text-red-600" : row.change < 0 ? "text-emerald-600" : "text-[var(--text-faint)]"}`}>
                      {row.change > 0 ? "▲" : row.change < 0 ? "▼" : "–"} {Math.abs(row.change)}%
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-center text-[10px] text-[var(--text-faint)]">{row.lastUpdated}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!isHost && <div className="px-4 py-2 bg-amber-50/60 border-t border-amber-100 text-[11px] text-amber-700">🔒 게스트 모드: 조회 및 필터링만 가능합니다.</div>}
      </Card>
    </div>
  );
}

// ─── Vendor ─────────────────────────────────────────────
function VendorPage({ isHost }) {
  const [vendors, setVendors] = useState(INITIAL_VENDORS);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("전체");
  const [filterStatus, setFilterStatus] = useState("전체");
  const [showModal, setShowModal] = useState(false);
  const emptyForm = { name: "", category: "금속", country: "", contact: "", email: "", phone: "", status: "거래중" };
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState("");

  const filtered = vendors.filter(v => {
    const q = search.toLowerCase();
    const matchSearch = !q || v.name.toLowerCase().includes(q) || v.contact.toLowerCase().includes(q) || v.email.toLowerCase().includes(q);
    const matchCat = filterCategory === "전체" || v.category === filterCategory;
    const matchStatus = filterStatus === "전체" || v.status === filterStatus;
    return matchSearch && matchCat && matchStatus;
  });

  const handleSubmit = () => {
    if (!form.name.trim()) { setFormError("업체명을 입력해주세요."); return; }
    if (!form.country.trim()) { setFormError("국가를 입력해주세요."); return; }
    const newId = `V${String(vendors.length + 1).padStart(3, "0")}`;
    const today = new Date().toISOString().slice(0, 10);
    setVendors(prev => [{ ...form, id: newId, registeredAt: today }, ...prev]);
    setForm(emptyForm);
    setFormError("");
    setShowModal(false);
  };

  const handleClose = () => { setShowModal(false); setFormError(""); setForm(emptyForm); };

  const active = vendors.filter(v => v.status === "거래중").length;
  const review = vendors.filter(v => v.status === "거래 검토").length;
  const stopped = vendors.filter(v => v.status === "거래 중단").length;

  return (
    <div className="space-y-5">
      <SectionHeader title="업체 관련" desc="거래 업체 등록 및 현황 관리">
        {isHost && (
          <button onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[var(--text)] hover:opacity-90 text-white text-[12px] font-medium rounded-md transition-opacity">
            <Icon path={ICONS.plus} className="w-3.5 h-3.5" />
            업체 등록
          </button>
        )}
      </SectionHeader>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="전체 업체" value={vendors.length} sub="등록 업체" />
        <StatCard label="거래중" value={active} sub="활성 거래" tone="ok" />
        <StatCard label="거래 검토" value={review} sub="검토 단계" tone="warn" />
        <StatCard label="거래 중단" value={stopped} sub="비활성" tone="danger" />
      </div>

      <Card title="업체 목록" action={
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Icon path={ICONS.search} className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-faint)]" />
            <input type="text" placeholder="업체·담당자·이메일" value={search} onChange={e => setSearch(e.target.value)}
              className="text-[12px] bg-white border border-[var(--border)] rounded-md pl-8 pr-3 py-1.5 w-44 focus:outline-none focus:border-[var(--accent)]" />
          </div>
          <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}
            className="text-[12px] bg-white border border-[var(--border)] rounded-md px-2.5 py-1.5 focus:outline-none focus:border-[var(--accent)]">
            <option value="전체">전체 카테고리</option>
            {VENDOR_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            className="text-[12px] bg-white border border-[var(--border)] rounded-md px-2.5 py-1.5 focus:outline-none focus:border-[var(--accent)]">
            <option value="전체">전체 상태</option>
            <option value="거래중">거래중</option>
            <option value="거래 검토">거래 검토</option>
            <option value="거래 중단">거래 중단</option>
          </select>
        </div>
      }>
        {/* Desktop table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-[12px]">
            <thead>
              <tr className="text-[10px] text-[var(--text-muted)] font-medium uppercase tracking-wide bg-[var(--border-soft)]/40 border-b border-[var(--border-soft)]">
                <th className="px-4 py-2 text-left font-medium">ID</th>
                <th className="px-4 py-2 text-left font-medium">업체명</th>
                <th className="px-4 py-2 text-left font-medium">카테고리</th>
                <th className="px-4 py-2 text-left font-medium">국가</th>
                <th className="px-4 py-2 text-left font-medium">담당자</th>
                <th className="px-4 py-2 text-left font-medium">이메일</th>
                <th className="px-4 py-2 text-center font-medium">상태</th>
                <th className="px-4 py-2 text-center font-medium">등록일</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={8} className="px-4 py-10 text-center text-[12px] text-[var(--text-faint)]">등록된 업체가 없습니다.</td></tr>
              )}
              {filtered.map((v) => (
                <tr key={v.id} className="border-b border-[var(--border-soft)] last:border-0 hover:bg-[var(--border-soft)]/30">
                  <td className="px-4 py-2.5 font-mono text-[10px] text-[var(--text-faint)]">{v.id}</td>
                  <td className="px-4 py-2.5 font-medium text-[var(--text)]">{v.name}</td>
                  <td className="px-4 py-2.5 text-[var(--text-muted)]">{v.category}</td>
                  <td className="px-4 py-2.5 text-[var(--text-muted)]">{v.country}</td>
                  <td className="px-4 py-2.5 text-[var(--text-muted)]">{v.contact || "—"}</td>
                  <td className="px-4 py-2.5 text-[var(--text-faint)] text-[11px]">{v.email || "—"}</td>
                  <td className="px-4 py-2.5 text-center"><StatusBadge status={v.status} /></td>
                  <td className="px-4 py-2.5 text-center text-[10px] text-[var(--text-faint)]">{v.registeredAt}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="md:hidden divide-y divide-[var(--border-soft)]">
          {filtered.length === 0 && (
            <div className="px-4 py-10 text-center text-[12px] text-[var(--text-faint)]">등록된 업체가 없습니다.</div>
          )}
          {filtered.map((v) => (
            <div key={v.id} className="px-4 py-3">
              <div className="flex items-start justify-between gap-2 mb-1">
                <div>
                  <p className="text-[13px] font-medium text-[var(--text)]">{v.name}</p>
                  <p className="text-[10px] text-[var(--text-faint)] font-mono mt-0.5">{v.id} · {v.registeredAt}</p>
                </div>
                <StatusBadge status={v.status} />
              </div>
              <div className="grid grid-cols-2 gap-x-3 gap-y-1 mt-2 text-[11px]">
                <div><span className="text-[var(--text-faint)]">카테고리 </span><span className="text-[var(--text-muted)]">{v.category}</span></div>
                <div><span className="text-[var(--text-faint)]">국가 </span><span className="text-[var(--text-muted)]">{v.country}</span></div>
                <div><span className="text-[var(--text-faint)]">담당자 </span><span className="text-[var(--text-muted)]">{v.contact || "—"}</span></div>
                <div className="truncate"><span className="text-[var(--text-faint)]">연락 </span><span className="text-[var(--text-muted)]">{v.email || v.phone || "—"}</span></div>
              </div>
            </div>
          ))}
        </div>

        {!isHost && <div className="px-4 py-2 bg-amber-50/60 border-t border-amber-100 text-[11px] text-amber-700">🔒 게스트 모드: 업체 등록은 관리자만 가능합니다.</div>}
      </Card>

      {showModal && (
        <div className="fixed inset-0 bg-black/30 flex items-end sm:items-center justify-center z-50 sm:p-4" onClick={handleClose}>
          <div className="bg-white w-full sm:max-w-md sm:rounded-lg rounded-t-xl border border-[var(--border)] shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-[var(--border-soft)]">
              <h3 className="text-[13px] font-medium text-[var(--text)]">업체 등록</h3>
              <button onClick={handleClose} className="text-[var(--text-muted)] hover:text-[var(--text)] transition-colors">
                <Icon path={ICONS.close} />
              </button>
            </div>
            <div className="px-5 py-4 space-y-3 max-h-[70vh] overflow-y-auto">
              {formError && <div className="bg-red-50 border border-red-100 text-red-700 text-[12px] rounded-md px-3 py-2">{formError}</div>}

              <Field label="업체명" required>
                <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="업체명 입력" className="input" autoFocus />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="카테고리">
                  <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className="input">
                    {VENDOR_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </Field>
                <Field label="국가" required>
                  <input type="text" value={form.country} onChange={e => setForm(f => ({ ...f, country: e.target.value }))} placeholder="예: 인도네시아" className="input" />
                </Field>
                <Field label="담당자명">
                  <input type="text" value={form.contact} onChange={e => setForm(f => ({ ...f, contact: e.target.value }))} placeholder="담당자" className="input" />
                </Field>
                <Field label="거래 상태">
                  <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} className="input">
                    <option value="거래중">거래중</option>
                    <option value="거래 검토">거래 검토</option>
                    <option value="거래 중단">거래 중단</option>
                  </select>
                </Field>
                <Field label="이메일">
                  <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="example@vendor.com" className="input" />
                </Field>
                <Field label="전화번호">
                  <input type="text" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+82-2-0000-0000" className="input" />
                </Field>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-[var(--border-soft)] bg-[var(--border-soft)]/30">
              <button onClick={handleClose} className="px-3 py-1.5 text-[12px] font-medium text-[var(--text-muted)] hover:text-[var(--text)] transition-colors">취소</button>
              <button onClick={handleSubmit} className="px-3.5 py-1.5 bg-[var(--text)] hover:opacity-90 text-white text-[12px] font-medium rounded-md transition-opacity">등록 완료</button>
            </div>
          </div>
          <style>{`.input{width:100%;font-size:12px;background:white;border:1px solid var(--border);border-radius:6px;padding:7px 10px;outline:none;color:var(--text)}.input:focus{border-color:var(--accent)}`}</style>
        </div>
      )}
    </div>
  );
}

const Field = ({ label, required, children }) => (
  <label className="block">
    <span className="block text-[11px] font-medium text-[var(--text-muted)] mb-1">{label}{required && <span className="text-[var(--accent)] ml-0.5">*</span>}</span>
    {children}
  </label>
);

// ─── App Shell ──────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activePage, setActivePage] = useState("stock");
  const [selectedCompany, setSelectedCompany] = useState("indonesia");
  const [companyOpen, setCompanyOpen] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);

  useEffect(() => {
    if (DEV_BYPASS_AUTH) {
      setUser({ email: "samjinpurchase@gmail.com", displayName: "Preview User", photoURL: "" });
      setLoading(false);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      if (u && ALLOWED_EMAILS.includes(u.email)) { setUser(u); setError(""); }
      else if (u) { setError("접근 권한이 없는 계정입니다."); auth.signOut(); setUser(null); }
      else setUser(null);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const handleLogin = async () => { try { setError(""); await loginWithGoogle(); } catch { setError("로그인 중 오류가 발생했습니다."); } };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-[12px] text-[var(--text-muted)]">로딩 중...</div>;
  if (!user) return <LoginPage onLogin={handleLogin} error={error} />;

  const isHost = DEV_BYPASS_AUTH || HOST_EMAILS.includes(user.email);
  const currentCompany = COMPANIES.find(c => c.id === selectedCompany);
  const navItems = [
    { id: "stock", label: "자재 부족 예측", num: "01" },
    { id: "bom", label: "BOM 단가 원북", num: "02" },
    { id: "vendor", label: "업체 관련", num: "03" },
  ];
  const activeLabel = navItems.find(n => n.id === activePage)?.label;

  const Sidebar = (
    <aside className="w-60 bg-white border-r border-[var(--border)] flex flex-col h-full">
      <div className="px-4 py-4 border-b border-[var(--border-soft)] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md flex items-center justify-center" style={{ background: "var(--accent)" }}>
            <Icon path={ICONS.box} className="w-3.5 h-3.5 text-white" />
          </div>
          <div>
            <p className="text-[12px] font-medium text-[var(--text)] leading-tight">자재 관리 시스템</p>
            <p className="text-[10px] text-[var(--text-faint)]">MRP · 삼진</p>
          </div>
        </div>
        <button onClick={() => setMobileNav(false)} className="lg:hidden text-[var(--text-muted)] hover:text-[var(--text)]">
          <Icon path={ICONS.close} />
        </button>
      </div>

      <div className="px-3 py-3 border-b border-[var(--border-soft)]">
        <p className="text-[10px] font-medium text-[var(--text-faint)] uppercase tracking-wide px-1 mb-1.5">법인 선택</p>
        <div className="relative" onClick={e => e.stopPropagation()}>
          <button onClick={() => setCompanyOpen(!companyOpen)}
            className="w-full flex items-center justify-between gap-2 px-2.5 py-2 bg-[var(--border-soft)]/50 hover:bg-[var(--border-soft)] border border-[var(--border)] rounded-md transition-colors">
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-mono font-medium text-[var(--text-muted)] bg-white border border-[var(--border)] px-1 py-0.5 rounded">{currentCompany.short}</span>
              <span className="text-[12px] font-medium text-[var(--text)]">{currentCompany.name}</span>
            </div>
            <Icon path={ICONS.chev} className={`w-3.5 h-3.5 text-[var(--text-muted)] transition-transform ${companyOpen ? "rotate-180" : ""}`} />
          </button>
          {companyOpen && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[var(--border)] rounded-md shadow-lg z-50 overflow-hidden">
              {COMPANIES.map(company => (
                <button key={company.id} onClick={() => { setSelectedCompany(company.id); setCompanyOpen(false); }}
                  className={`w-full flex items-center gap-2 px-2.5 py-2 text-left hover:bg-[var(--border-soft)] transition-colors ${selectedCompany === company.id ? "bg-[var(--accent-soft)]" : ""}`}>
                  <span className="text-[9px] font-mono font-medium text-[var(--text-muted)] bg-white border border-[var(--border)] px-1 py-0.5 rounded">{company.short}</span>
                  <span className={`text-[12px] ${selectedCompany === company.id ? "font-medium text-[var(--accent)]" : "text-[var(--text)]"}`}>{company.name}</span>
                  {selectedCompany === company.id && <Icon path={ICONS.check} className="w-3 h-3 text-[var(--accent)] ml-auto" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
        <p className="text-[10px] font-medium text-[var(--text-faint)] uppercase tracking-wide px-2 py-1.5">메뉴</p>
        {navItems.map(item => (
          <button key={item.id} onClick={() => { setActivePage(item.id); setMobileNav(false); }}
            className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-[12px] font-medium transition-colors text-left ${
              activePage === item.id ? "bg-[var(--accent-soft)] text-[var(--accent)]" : "text-[var(--text-muted)] hover:bg-[var(--border-soft)] hover:text-[var(--text)]"
            }`}>
            <span className={`text-[10px] font-mono ${activePage === item.id ? "text-[var(--accent)]" : "text-[var(--text-faint)]"}`}>{item.num}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="p-3 border-t border-[var(--border-soft)] space-y-2">
        <div className="flex items-center gap-2 px-1">
          {user.photoURL ? (
            <img src={user.photoURL} alt="" className="w-7 h-7 rounded-full" />
          ) : (
            <div className="w-7 h-7 rounded-full bg-[var(--accent-soft)] flex items-center justify-center text-[11px] font-medium text-[var(--accent)]">
              {user.email?.[0]?.toUpperCase()}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-medium text-[var(--text)] truncate">{user.displayName || user.email}</p>
            <p className="text-[10px] text-[var(--text-faint)]">{isHost ? "관리자" : "게스트"}</p>
          </div>
        </div>
        <button onClick={DEV_BYPASS_AUTH ? () => window.location.reload() : logout}
          className="w-full flex items-center gap-2 px-2.5 py-1.5 text-[11px] text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--border-soft)] rounded-md transition-colors">
          <Icon path={ICONS.logout} className="w-3.5 h-3.5" />
          로그아웃
        </button>
      </div>
    </aside>
  );

  return (
    <div className="flex h-[100svh] overflow-hidden" onClick={() => companyOpen && setCompanyOpen(false)}>
      {/* Desktop sidebar */}
      <div className="hidden lg:flex flex-shrink-0">{Sidebar}</div>

      {/* Mobile drawer */}
      {mobileNav && (
        <>
          <div className="lg:hidden fixed inset-0 bg-black/30 z-40" onClick={() => setMobileNav(false)} />
          <div className="lg:hidden fixed inset-y-0 left-0 z-50 w-60">{Sidebar}</div>
        </>
      )}

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-12 bg-white border-b border-[var(--border)] flex items-center justify-between px-4 sm:px-5 flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <button onClick={() => setMobileNav(true)} className="lg:hidden text-[var(--text-muted)] hover:text-[var(--text)]">
              <Icon path={ICONS.menu} className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 text-[12px] min-w-0">
              <span className="text-[10px] font-mono font-medium text-[var(--text-muted)] bg-[var(--border-soft)] px-1.5 py-0.5 rounded">{currentCompany.short}</span>
              <span className="font-medium text-[var(--text)] truncate">{currentCompany.name}</span>
              <span className="text-[var(--text-faint)] hidden sm:inline">/</span>
              <span className="text-[var(--text-muted)] hidden sm:inline truncate">{activeLabel}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {DEV_BYPASS_AUTH && <span className="text-[10px] font-medium text-[var(--accent)] bg-[var(--accent-soft)] px-1.5 py-0.5 rounded">PREVIEW</span>}
            <span className="text-[11px] text-[var(--text-muted)] hidden sm:inline truncate max-w-[180px]">{user.displayName || user.email}</span>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 sm:p-5 lg:p-6" style={{ background: "var(--bg)" }}>
          <div className="max-w-7xl mx-auto">
            {activePage === "stock" && <StockForecastPage isHost={isHost} companyId={selectedCompany} />}
            {activePage === "bom" && <BomPricePage isHost={isHost} companyId={selectedCompany} />}
            {activePage === "vendor" && <VendorPage isHost={isHost} />}
          </div>
        </main>
      </div>
    </div>
  );
}
