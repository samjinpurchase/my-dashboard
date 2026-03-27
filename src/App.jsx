import { useState, useEffect } from "react";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from "recharts";
import { auth, loginWithGoogle, logout, ALLOWED_EMAILS, HOST_EMAILS } from "./firebase";
import { onAuthStateChanged } from "firebase/auth";

// ─── Dummy Data ───────────────────────────────────────────────────────────────
const stockAlertData = [
  { name: "알루미늄 판재", current: 120, min: 200, unit: "kg", status: "위험", category: "금속" },
  { name: "PCB 기판 A형", current: 45, min: 100, unit: "EA", status: "위험", category: "전자" },
  { name: "스테인리스 볼트 M8", current: 890, min: 500, unit: "EA", status: "정상", category: "체결" },
  { name: "절연 테이프", current: 30, min: 80, unit: "롤", status: "위험", category: "소모품" },
  { name: "구리 전선 2.5sq", current: 210, min: 150, unit: "m", status: "주의", category: "전선" },
  { name: "실리콘 가스켓", current: 55, min: 120, unit: "EA", status: "위험", category: "고무" },
  { name: "강판 2T", current: 340, min: 200, unit: "kg", status: "정상", category: "금속" },
  { name: "LED 드라이버 IC", current: 78, min: 150, unit: "EA", status: "위험", category: "전자" },
];

const forecastChartData = [
  { month: "1월", 소비량: 380, 입고량: 500, 재고: 520 },
  { month: "2월", 소비량: 420, 입고량: 300, 재고: 400 },
  { month: "3월", 소비량: 390, 입고량: 450, 재고: 460 },
  { month: "4월", 소비량: 510, 입고량: 200, 재고: 150 },
  { month: "5월", 소비량: 480, 입고량: 600, 재고: 270 },
  { month: "6월", 소비량: 440, 입고량: 400, 재고: 230 },
];

const categoryData = [
  { name: "금속", value: 34 },
  { name: "전자", value: 28 },
  { name: "체결", value: 18 },
  { name: "소모품", value: 12 },
  { name: "기타", value: 8 },
];

const bomData = [
  { id: "BOM-001", product: "컨트롤 패널 A", material: "알루미늄 판재", qty: 2.5, unit: "kg", unitPrice: 8200, supplier: "한국알미늄", lastUpdated: "2025-06-10", change: 3.2 },
  { id: "BOM-002", product: "컨트롤 패널 A", material: "PCB 기판 A형", qty: 1, unit: "EA", unitPrice: 34000, supplier: "삼성전자부품", lastUpdated: "2025-06-08", change: -1.5 },
  { id: "BOM-003", product: "배전반 B형", material: "강판 2T", qty: 5.2, unit: "kg", unitPrice: 3800, supplier: "포스코", lastUpdated: "2025-06-12", change: 0.8 },
  { id: "BOM-004", product: "배전반 B형", material: "스테인리스 볼트 M8", qty: 24, unit: "EA", unitPrice: 280, supplier: "대성볼트", lastUpdated: "2025-06-05", change: 0 },
  { id: "BOM-005", product: "모터 드라이버", material: "LED 드라이버 IC", qty: 4, unit: "EA", unitPrice: 12500, supplier: "텍사스인스트루먼트", lastUpdated: "2025-06-11", change: 8.4 },
  { id: "BOM-006", product: "모터 드라이버", material: "구리 전선 2.5sq", qty: 3.5, unit: "m", unitPrice: 2100, supplier: "대한전선", lastUpdated: "2025-06-09", change: -2.1 },
  { id: "BOM-007", product: "판넬 도어", material: "실리콘 가스켓", qty: 2, unit: "EA", unitPrice: 5600, supplier: "현대고무", lastUpdated: "2025-06-07", change: 1.2 },
  { id: "BOM-008", product: "판넬 도어", material: "절연 테이프", qty: 0.5, unit: "롤", unitPrice: 3200, supplier: "3M코리아", lastUpdated: "2025-06-06", change: 0 },
];

const priceHistoryData = [
  { month: "1월", 알루미늄: 7800, PCB: 34500, 강판: 3600 },
  { month: "2월", 알루미늄: 7900, PCB: 34200, 강판: 3650 },
  { month: "3월", 알루미늄: 8000, PCB: 34000, 강판: 3700 },
  { month: "4월", 알루미늄: 8050, PCB: 33800, 강판: 3720 },
  { month: "5월", 알루미늄: 8100, PCB: 34100, 강판: 3780 },
  { month: "6월", 알루미늄: 8200, PCB: 34000, 강판: 3800 },
];

const PIE_COLORS = ["#3b82f6", "#6366f1", "#8b5cf6", "#a78bfa", "#c4b5fd"];

// ─── Login Page ───────────────────────────────────────────────────────────────
function LoginPage({ onLogin, error }) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-lg p-10 w-full max-w-md text-center">
        <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-5">
          <span className="text-white text-2xl">⚙</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-800 mb-1">자재 관리 시스템</h1>
        <p className="text-sm text-gray-400 mb-8">MRP Dashboard — 삼진</p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-3 mb-5">
            {error}
          </div>
        )}

        <button
          onClick={onLogin}
          className="w-full flex items-center justify-center gap-3 border border-gray-200 rounded-xl px-5 py-3.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-all shadow-sm hover:shadow-md"
        >
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

// ─── Sub Components ───────────────────────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const map = {
    위험: "bg-red-100 text-red-700 border border-red-200",
    주의: "bg-amber-100 text-amber-700 border border-amber-200",
    정상: "bg-emerald-100 text-emerald-700 border border-emerald-200",
  };
  return <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${map[status]}`}>{status}</span>;
};

const StockBar = ({ current, min }) => {
  const ratio = Math.min((current / min) * 100, 100);
  const color = ratio < 60 ? "#ef4444" : ratio < 90 ? "#f59e0b" : "#10b981";
  return (
    <div className="w-full bg-gray-100 rounded-full h-1.5">
      <div className="h-1.5 rounded-full transition-all duration-500" style={{ width: `${ratio}%`, backgroundColor: color }} />
    </div>
  );
};

const UploadButton = () => (
  <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-all shadow-sm hover:shadow-md active:scale-95">
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
    </svg>
    CSV / 엑셀 업로드
  </button>
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

// ─── Page: 자재 부족 예측 툴 ──────────────────────────────────────────────────
function StockForecastPage({ isHost }) {
  const [filter, setFilter] = useState("전체");
  const categories = ["전체", "금속", "전자", "체결", "소모품", "전선", "고무"];
  const filtered = filter === "전체" ? stockAlertData : stockAlertData.filter(d => d.category === filter);
  const danger = stockAlertData.filter(d => d.status === "위험").length;
  const warning = stockAlertData.filter(d => d.status === "주의").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-800">자재 부족 예측 툴</h2>
          <p className="text-sm text-gray-400 mt-0.5">실시간 재고 현황 및 소비 예측 분석</p>
        </div>
        {isHost && <UploadButton />}
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="전체 자재 종류" value="47" sub="등록된 품목" icon="📦" color="bg-blue-50" />
        <StatCard label="위험 재고" value={danger} sub="즉시 발주 필요" icon="🚨" color="bg-red-50" />
        <StatCard label="주의 재고" value={warning} sub="모니터링 필요" icon="⚠️" color="bg-amber-50" />
        <StatCard label="정상 재고" value={stockAlertData.length - danger - warning} sub="안정 수준" icon="✅" color="bg-emerald-50" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">월별 소비량 / 입고량 / 재고 추이</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={forecastChartData}>
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
              <Pie data={categoryData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                {categoryData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: 10, border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }} formatter={(v) => `${v}%`} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-gray-50">
          <h3 className="text-sm font-semibold text-gray-700">재고 현황 목록</h3>
          <div className="flex gap-1.5 flex-wrap">
            {categories.map(c => (
              <button key={c} onClick={() => setFilter(c)} className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${filter === c ? "bg-blue-600 text-white shadow-sm" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}>{c}</button>
            ))}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-400 font-semibold uppercase tracking-wide bg-gray-50">
                <th className="px-5 py-3 text-left">자재명</th>
                <th className="px-5 py-3 text-left">카테고리</th>
                <th className="px-5 py-3 text-right">현재고</th>
                <th className="px-5 py-3 text-right">최소기준</th>
                <th className="px-5 py-3 text-left">재고율</th>
                <th className="px-5 py-3 text-center">상태</th>
              </tr>
            </thead>
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

// ─── Page: BOM 단가 원북 ──────────────────────────────────────────────────────
function BomPricePage({ isHost }) {
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("change");
  const filtered = bomData.filter(r => r.product.includes(search) || r.material.includes(search) || r.supplier.includes(search));
  const sorted = [...filtered].sort((a, b) => sortBy === "change" ? Math.abs(b.change) - Math.abs(a.change) : b.unitPrice - a.unitPrice);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-800">BOM 단가 원북</h2>
          <p className="text-sm text-gray-400 mt-0.5">제품별 자재 단가 현황 및 가격 변동 이력</p>
        </div>
        {isHost && <UploadButton />}
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="등록 BOM 항목" value="128" sub="전체 품목" icon="📋" color="bg-indigo-50" />
        <StatCard label="가격 상승 품목" value="5" sub="전월 대비" icon="📈" color="bg-red-50" />
        <StatCard label="가격 하락 품목" value="3" sub="전월 대비" icon="📉" color="bg-blue-50" />
        <StatCard label="평균 변동률" value="+2.4%" sub="이번 달" icon="💹" color="bg-amber-50" />
      </div>
      <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">주요 자재 단가 이력</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={priceHistoryData} barGap={4}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ borderRadius: 10, border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }} formatter={(v) => `₩${v.toLocaleString()}`} />
            <Legend iconType="square" iconSize={10} wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="알루미늄" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            <Bar dataKey="PCB" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
            <Bar dataKey="강판" fill="#10b981" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-gray-50 gap-4 flex-wrap">
          <h3 className="text-sm font-semibold text-gray-700">단가 목록</h3>
          <div className="flex items-center gap-3">
            <input type="text" placeholder="제품명 / 자재명 / 공급사 검색..." value={search} onChange={e => setSearch(e.target.value)} className="text-sm border border-gray-200 rounded-lg px-3 py-2 w-56 focus:outline-none focus:ring-2 focus:ring-blue-400 transition" />
            <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 transition text-gray-600">
              <option value="change">변동률 순</option>
              <option value="price">단가 순</option>
            </select>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-400 font-semibold uppercase tracking-wide bg-gray-50">
                <th className="px-5 py-3 text-left">BOM ID</th>
                <th className="px-5 py-3 text-left">제품</th>
                <th className="px-5 py-3 text-left">자재명</th>
                <th className="px-5 py-3 text-right">수량</th>
                <th className="px-5 py-3 text-right">단가 (₩)</th>
                <th className="px-5 py-3 text-left">공급사</th>
                <th className="px-5 py-3 text-center">변동률</th>
                <th className="px-5 py-3 text-center">최종 업데이트</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {sorted.map((row, i) => (
                <tr key={i} className="hover:bg-indigo-50/40 transition-colors">
                  <td className="px-5 py-3.5 font-mono text-xs text-gray-400">{row.id}</td>
                  <td className="px-5 py-3.5 font-medium text-gray-800">{row.product}</td>
                  <td className="px-5 py-3.5 text-gray-600">{row.material}</td>
                  <td className="px-5 py-3.5 text-right font-mono text-gray-700">{row.qty} {row.unit}</td>
                  <td className="px-5 py-3.5 text-right font-mono font-semibold text-gray-800">₩{row.unitPrice.toLocaleString()}</td>
                  <td className="px-5 py-3.5 text-gray-500">{row.supplier}</td>
                  <td className="px-5 py-3.5 text-center">
                    <span className={`text-xs font-bold ${row.change > 0 ? "text-red-500" : row.change < 0 ? "text-blue-500" : "text-gray-400"}`}>
                      {row.change > 0 ? "▲" : row.change < 0 ? "▼" : "–"} {Math.abs(row.change)}%
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-center text-xs text-gray-400">{row.lastUpdated}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!isHost && (
          <div className="px-5 py-3 bg-amber-50 border-t border-amber-100 text-xs text-amber-600 flex items-center gap-2">
            <span>🔒</span> 게스트 모드: 데이터 조회 및 필터링만 가능합니다.
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activePage, setActivePage] = useState("stock");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      if (u && ALLOWED_EMAILS.includes(u.email)) {
        setUser(u);
        setError("");
      } else if (u) {
        setError("접근 권한이 없는 계정입니다. 관리자에게 문의하세요.");
        auth.signOut();
        setUser(null);
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const handleLogin = async () => {
    try {
      setError("");
      await loginWithGoogle();
    } catch (e) {
      setError("로그인 중 오류가 발생했습니다. 다시 시도해주세요.");
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-gray-400 text-sm">로딩 중...</div>
    </div>
  );

  if (!user) return <LoginPage onLogin={handleLogin} error={error} />;

  const isHost = HOST_EMAILS.includes(user.email);

  const navItems = [
    { id: "stock", label: "자재 부족 예측 툴", icon: "📦", num: "01" },
    { id: "bom", label: "BOM 단가 원북", icon: "📋", num: "02" },
  ];

  return (
    <div className="flex h-screen bg-gray-50 font-sans overflow-hidden">
      <aside className="w-64 bg-white border-r border-gray-100 flex flex-col shadow-sm flex-shrink-0">
        <div className="px-5 py-5 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-sm">⚙</span>
            </div>
            <div>
              <p className="text-sm font-bold text-gray-800 leading-tight">자재 관리 시스템</p>
              <p className="text-xs text-gray-400">MRP Dashboard v1.0</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          <p className="text-xs font-semibold text-gray-300 uppercase tracking-widest px-3 py-2">메인 메뉴</p>
          {navItems.map(item => (
            <button key={item.id} onClick={() => setActivePage(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all text-left ${activePage === item.id ? "bg-blue-600 text-white shadow-md shadow-blue-200" : "text-gray-500 hover:bg-gray-50 hover:text-gray-800"}`}>
              <span className={`text-xs font-bold tabular-nums ${activePage === item.id ? "text-blue-200" : "text-gray-300"}`}>{item.num}</span>
              <span className="text-base">{item.icon}</span>
              <span className="leading-tight">{item.label}</span>
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
            <span className="text-gray-300">/</span>
            <span className="font-medium text-gray-700">{activePage === "stock" ? "자재 부족 예측 툴" : "BOM 단가 원북"}</span>
          </div>
          <div className="flex items-center gap-3">
            <img src={user.photoURL} alt="" className="w-7 h-7 rounded-full" />
            <span className="text-sm text-gray-600 font-medium">{user.displayName}</span>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6">
          {activePage === "stock" && <StockForecastPage isHost={isHost} />}
          {activePage === "bom" && <BomPricePage isHost={isHost} />}
        </main>
      </div>
    </div>
  );
}