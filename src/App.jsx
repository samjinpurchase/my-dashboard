import { useState, useEffect } from "react";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from "recharts";
import { auth, loginWithGoogle, logout, ALLOWED_EMAILS, HOST_EMAILS } from "./firebase";
import { onAuthStateChanged } from "firebase/auth";

const COMPANIES = [
  { id: "indonesia", name: "인도네시아 법인", flag: "🇮🇩" },
  { id: "thailand", name: "태국 법인", flag: "🇹🇭" },
  { id: "china", name: "청도 법인", flag: "🇨🇳" },
  { id: "cni", name: "C&I", flag: "🏭" },
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

const PIE_COLORS = ["#3b82f6", "#6366f1", "#8b5cf6", "#a78bfa", "#c4b5fd"];

function LoginPage({ onLogin, error }) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-lg p-10 w-full max-w-md text-center">
        <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-5">
          <span className="text-white text-2xl">⚙</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-800 mb-1">자재 관리 시스템</h1>
        <p className="text-sm text-gray-400 mb-8">MRP Dashboard — 삼진</p>
        {error && <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-3 mb-5">{error}</div>}
        <button onClick={onLogin} className="w-full flex items-center justify-center gap-3 border border-gray-200 rounded-xl px-5 py-3.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-all shadow-sm hover:shadow-md">
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Google 계정으로 로그인
        </button>
        <p className="text-xs text-gray-400 mt-5">허가된 계정만 접속할 수 있습니다.</p>
      </div>
    </div>
  );
}

const StatusBadge = ({ status }) => {
  const map = { 위험: "bg-red-100 text-red-700 border border-red-200", 주의: "bg-amber-100 text-amber-700 border border-amber-200", 정상: "bg-emerald-100 text-emerald-700 border border-emerald-200" };
  return <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${map[status]}`}>{status}</span>;
};

const StockBar = ({ current, min }) => {
  const ratio = Math.min((current / min) * 100, 100);
  const color = ratio < 60 ? "#ef4444" : ratio < 90 ? "#f59e0b" : "#10b981";
  return <div className="w-full bg-gray-100 rounded-full h-1.5"><div className="h-1.5 rounded-full" style={{ width: `${ratio}%`, backgroundColor: color }} /></div>;
};

const UploadButton = ({ label, onUpload }) => (
  <label className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-all shadow-sm cursor-pointer">
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
    {label}
    <input type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={onUpload} />
  </label>
);

const StatCard = ({ label, value, sub, icon, color }) => (
  <div className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-4 shadow-sm">
    <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl ${color}`}>{icon}</div>
    <div>
      <p className="text-xs text-gray-400 font-medium">{label}</p>
      <p className="text-2xl font-bold text-gray-800 leading-tight">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  </div>
);

function StockForecastPage({ isHost, companyId }) {
  const [filter, setFilter] = useState("전체");
  const [stockData, setStockData] = useState(COMPANY_DATA[companyId].stockData);
  const data = COMPANY_DATA[companyId];

  useEffect(() => { setStockData(COMPANY_DATA[companyId].stockData); setFilter("전체"); }, [companyId]);

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
        const wb = XLSX.read(evt.target.result, { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(ws);
        const mapped = rows.map(r => ({
          name: r["자재명"] || "", category: r["카테고리"] || "",
          current: Number(r["현재고"] || 0), unit: r["단위"] || "",
          min: Number(r["최소기준수량"] || 0),
          status: Number(r["현재고"]) / Number(r["최소기준수량"]) * 100 < 60 ? "위험" : Number(r["현재고"]) / Number(r["최소기준수량"]) * 100 < 90 ? "주의" : "정상",
        })).filter(r => r.name);
        if (mapped.length > 0) { setStockData(mapped); alert(`✅ ${mapped.length}개 자재 데이터 업로드 완료!`); }
        else alert("⚠️ 데이터를 읽을 수 없습니다. 양식을 확인해주세요.");
      };
      reader.readAsArrayBuffer(file);
    });
    e.target.value = "";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h2 className="text-xl font-bold text-gray-800">자재 부족 예측 툴</h2><p className="text-sm text-gray-400 mt-0.5">실시간 재고 현황 및 소비 예측 분석</p></div>
        {isHost && <UploadButton label="재고 엑셀 업로드" onUpload={handleUpload} />}
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="전체 자재 종류" value={stockData.length} sub="등록된 품목" icon="📦" color="bg-blue-50" />
        <StatCard label="위험 재고" value={danger} sub="즉시 발주 필요" icon="🚨" color="bg-red-50" />
        <StatCard label="주의 재고" value={warning} sub="모니터링 필요" icon="⚠️" color="bg-amber-50" />
        <StatCard label="정상 재고" value={stockData.length - danger - warning} sub="안정 수준" icon="✅" color="bg-emerald-50" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">월별 소비량 / 입고량 / 재고 추이</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={data.forecastData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 10, border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="소비량" stroke="#ef4444" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="입고량" stroke="#3b82f6" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="재고" stroke="#10b981" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">카테고리별 비중</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={data.categoryData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                {data.categoryData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: 10, border: "none" }} formatter={(v) => `${v}%`} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-gray-50 flex-wrap gap-2">
          <h3 className="text-sm font-semibold text-gray-700">재고 현황 목록</h3>
          <div className="flex gap-1.5 flex-wrap">
            {categories.map(c => <button key={c} onClick={() => setFilter(c)} className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${filter === c ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}>{c}</button>)}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-xs text-gray-400 font-semibold uppercase bg-gray-50">
              <th className="px-5 py-3 text-left">자재명</th><th className="px-5 py-3 text-left">카테고리</th>
              <th className="px-5 py-3 text-right">현재고</th><th className="px-5 py-3 text-right">최소기준</th>
              <th className="px-5 py-3 text-left">재고율</th><th className="px-5 py-3 text-center">상태</th>
            </tr></thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((row, i) => (
                <tr key={i} className="hover:bg-blue-50/40 transition-colors">
                  <td className="px-5 py-3.5 font-medium text-gray-800">{row.name}</td>
                  <td className="px-5 py-3.5 text-gray-500">{row.category}</td>
                  <td className="px-5 py-3.5 text-right font-mono text-gray-700">{row.current.toLocaleString()} {row.unit}</td>
                  <td className="px-5 py-3.5 text-right font-mono text-gray-400">{row.min.toLocaleString()} {row.unit}</td>
                  <td className="px-5 py-3.5 w-36"><StockBar current={row.current} min={row.min} /></td>
                  <td className="px-5 py-3.5 text-center"><StatusBadge status={row.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function BomPricePage({ isHost, companyId }) {
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("change");
  const [bomData, setBomData] = useState(COMPANY_DATA[companyId].bomData);
  const data = COMPANY_DATA[companyId];

  useEffect(() => { setBomData(COMPANY_DATA[companyId].bomData); setSearch(""); }, [companyId]);

  const filtered = bomData.filter(r => r.product.includes(search) || r.material.includes(search) || r.supplier.includes(search));
  const sorted = [...filtered].sort((a, b) => sortBy === "change" ? Math.abs(b.change) - Math.abs(a.change) : b.unitPrice - a.unitPrice);
  const priceKeys = data.priceHistory.length > 0 ? Object.keys(data.priceHistory[0]).filter(k => k !== "month") : [];
  const barColors = ["#3b82f6", "#8b5cf6", "#10b981", "#f59e0b", "#ef4444"];

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
        if (mapped.length > 0) { setBomData(mapped); alert(`✅ ${mapped.length}개 BOM 데이터 업로드 완료!`); }
        else alert("⚠️ 데이터를 읽을 수 없습니다. 양식을 확인해주세요.");
      };
      reader.readAsArrayBuffer(file);
    });
    e.target.value = "";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h2 className="text-xl font-bold text-gray-800">BOM 단가 원북</h2><p className="text-sm text-gray-400 mt-0.5">제품별 자재 단가 현황 및 가격 변동 이력</p></div>
        {isHost && <UploadButton label="BOM 엑셀 업로드" onUpload={handleUpload} />}
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="등록 BOM 항목" value={bomData.length} sub="전체 품목" icon="📋" color="bg-indigo-50" />
        <StatCard label="가격 상승 품목" value={bomData.filter(d => d.change > 0).length} sub="전월 대비" icon="📈" color="bg-red-50" />
        <StatCard label="가격 하락 품목" value={bomData.filter(d => d.change < 0).length} sub="전월 대비" icon="📉" color="bg-blue-50" />
        <StatCard label="평균 변동률" value={`${bomData.length ? (bomData.reduce((s,d)=>s+d.change,0)/bomData.length).toFixed(1) : 0}%`} sub="이번 달" icon="💹" color="bg-amber-50" />
      </div>
      <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">주요 자재 단가 이력</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={data.priceHistory} barGap={4}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ borderRadius: 10, border: "none" }} formatter={(v) => `₩${v.toLocaleString()}`} />
            <Legend iconType="square" iconSize={10} wrapperStyle={{ fontSize: 11 }} />
            {priceKeys.map((key, i) => <Bar key={key} dataKey={key} fill={barColors[i % barColors.length]} radius={[4,4,0,0]} />)}
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-gray-50 gap-4 flex-wrap">
          <h3 className="text-sm font-semibold text-gray-700">단가 목록</h3>
          <div className="flex items-center gap-3">
            <input type="text" placeholder="제품명 / 자재명 / 공급사..." value={search} onChange={e => setSearch(e.target.value)} className="text-sm border border-gray-200 rounded-lg px-3 py-2 w-52 focus:outline-none focus:ring-2 focus:ring-blue-400" />
            <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-600">
              <option value="change">변동률 순</option>
              <option value="price">단가 순</option>
            </select>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-xs text-gray-400 font-semibold uppercase bg-gray-50">
              <th className="px-5 py-3 text-left">BOM ID</th><th className="px-5 py-3 text-left">제품</th>
              <th className="px-5 py-3 text-left">자재명</th><th className="px-5 py-3 text-right">수량</th>
              <th className="px-5 py-3 text-right">단가 (₩)</th><th className="px-5 py-3 text-left">공급사</th>
              <th className="px-5 py-3 text-center">변동률</th><th className="px-5 py-3 text-center">최종 업데이트</th>
            </tr></thead>
            <tbody className="divide-y divide-gray-50">
              {sorted.map((row, i) => (
                <tr key={i} className="hover:bg-indigo-50/40 transition-colors">
                  <td className="px-5 py-3.5 font-mono text-xs text-gray-400">{row.id}</td>
                  <td className="px-5 py-3.5 font-medium text-gray-800">{row.product}</td>
                  <td className="px-5 py-3.5 text-gray-600">{row.material}</td>
                  <td className="px-5 py-3.5 text-right font-mono text-gray-700">{row.qty} {row.unit}</td>
                  <td className="px-5 py-3.5 text-right font-mono font-semibold text-gray-800">₩{row.unitPrice.toLocaleString()}</td>
                  <td className="px-5 py-3.5 text-gray-500">{row.supplier}</td>
                  <td className="px-5 py-3.5 text-center"><span className={`text-xs font-bold ${row.change > 0 ? "text-red-500" : row.change < 0 ? "text-blue-500" : "text-gray-400"}`}>{row.change > 0 ? "▲" : row.change < 0 ? "▼" : "–"} {Math.abs(row.change)}%</span></td>
                  <td className="px-5 py-3.5 text-center text-xs text-gray-400">{row.lastUpdated}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!isHost && <div className="px-5 py-3 bg-amber-50 border-t border-amber-100 text-xs text-amber-600 flex items-center gap-2"><span>🔒</span> 게스트 모드: 데이터 조회 및 필터링만 가능합니다.</div>}
      </div>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activePage, setActivePage] = useState("stock");
  const [selectedCompany, setSelectedCompany] = useState("indonesia");
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      if (u && ALLOWED_EMAILS.includes(u.email)) { setUser(u); setError(""); }
      else if (u) { setError("접근 권한이 없는 계정입니다."); auth.signOut(); setUser(null); }
      else setUser(null);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const handleLogin = async () => { try { setError(""); await loginWithGoogle(); } catch { setError("로그인 중 오류가 발생했습니다."); } };

  if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="text-gray-400 text-sm">로딩 중...</div></div>;
  if (!user) return <LoginPage onLogin={handleLogin} error={error} />;

  const isHost = HOST_EMAILS.includes(user.email);
  const currentCompany = COMPANIES.find(c => c.id === selectedCompany);
  const navItems = [
    { id: "stock", label: "자재 부족 예측 툴", icon: "📦", num: "01" },
    { id: "bom", label: "BOM 단가 원북", icon: "📋", num: "02" },
  ];

  return (
    <div className="flex h-screen bg-gray-50 font-sans overflow-hidden" onClick={() => dropdownOpen && setDropdownOpen(false)}>
      <aside className="w-64 bg-white border-r border-gray-100 flex flex-col shadow-sm flex-shrink-0">
        <div className="px-5 py-5 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center"><span className="text-white text-sm">⚙</span></div>
            <div><p className="text-sm font-bold text-gray-800 leading-tight">자재 관리 시스템</p><p className="text-xs text-gray-400">MRP Dashboard v1.0</p></div>
          </div>
        </div>

        <div className="px-3 py-3 border-b border-gray-100">
          <p className="text-xs font-semibold text-gray-300 uppercase tracking-widest px-2 mb-2">법인 선택</p>
          <div className="relative" onClick={e => e.stopPropagation()}>
            <button onClick={() => setDropdownOpen(!dropdownOpen)} className="w-full flex items-center justify-between gap-2 px-3 py-2.5 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl transition-all">
              <div className="flex items-center gap-2">
                <span className="text-xl">{currentCompany.flag}</span>
                <p className="text-xs font-bold text-blue-800">{currentCompany.name}</p>
              </div>
              <svg className={`w-4 h-4 text-blue-500 transition-transform ${dropdownOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </button>
            {dropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden">
                {COMPANIES.map(company => (
                  <button key={company.id} onClick={() => { setSelectedCompany(company.id); setDropdownOpen(false); setActivePage("stock"); }}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors ${selectedCompany === company.id ? "bg-blue-50" : ""}`}>
                    <span className="text-xl">{company.flag}</span>
                    <p className={`text-sm font-semibold ${selectedCompany === company.id ? "text-blue-700" : "text-gray-700"}`}>{company.name}</p>
                    {selectedCompany === company.id && <svg className="w-4 h-4 text-blue-500 ml-auto" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          <p className="text-xs font-semibold text-gray-300 uppercase tracking-widest px-3 py-2">메인 메뉴</p>
          {navItems.map(item => (
            <button key={item.id} onClick={() => setActivePage(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all text-left ${activePage === item.id ? "bg-blue-600 text-white shadow-md shadow-blue-200" : "text-gray-500 hover:bg-gray-50 hover:text-gray-800"}`}>
              <span className={`text-xs font-bold ${activePage === item.id ? "text-blue-200" : "text-gray-300"}`}>{item.num}</span>
              <span className="text-base">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-100 space-y-3">
          <div className={`rounded-xl p-3 text-xs ${isHost ? "bg-blue-50 text-blue-700" : "bg-gray-50 text-gray-500"}`}>
            <p className="font-semibold">{isHost ? "🔑 관리자 (호스트)" : "👤 팀원 (게스트)"}</p>
            <p className="mt-0.5 opacity-70 truncate">{user.email}</p>
          </div>
          <button onClick={logout} className="w-full text-xs text-gray-400 hover:text-red-500 transition-colors py-1">로그아웃</button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-14 bg-white border-b border-gray-100 flex items-center justify-between px-6 flex-shrink-0">
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <span className="text-lg">{currentCompany.flag}</span>
            <span className="font-semibold text-gray-600">{currentCompany.name}</span>
            <span className="text-gray-300">/</span>
            <span className="font-medium text-gray-700">{activePage === "stock" ? "자재 부족 예측 툴" : "BOM 단가 원북"}</span>
          </div>
          <div className="flex items-center gap-3">
            <img src={user.photoURL} alt="" className="w-7 h-7 rounded-full" />
            <span className="text-sm text-gray-600 font-medium">{user.displayName}</span>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6">
          {activePage === "stock" && <StockForecastPage isHost={isHost} companyId={selectedCompany} />}
          {activePage === "bom" && <BomPricePage isHost={isHost} companyId={selectedCompany} />}
        </main>
      </div>
    </div>
  );
}
