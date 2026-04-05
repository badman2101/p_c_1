import React, { useState, useMemo, useRef } from 'react';
import {
    Plus, Search, Edit3, Trash2, Eye, X, Filter, AlertTriangle,
    CheckCircle2, Clock, Inbox, Calendar, FileText, Printer,
    BarChart2, RefreshCw, TrendingUp
} from 'lucide-react';
import { Pagination } from '../user/page';

const INITIAL_PETITIONS = [
    { id: 'DT-001', sender: 'Nguyễn Văn A', date: '2026-04-01', subject: 'Phản ánh tiếng ồn khu dân cư', status: 'Pending', content: 'Khu vực liên tục có tiếng ồn lớn sau 10h đêm gây ảnh hưởng nghiêm trọng đến đời sống người dân.' },
    { id: 'DT-002', sender: 'Trần Thị B', date: '2026-03-24', subject: 'Tố cáo hành vi lừa đảo qua mạng', status: 'Processing', content: 'Một số đối tượng lợi dụng danh nghĩa cơ quan nhà nước để thực hiện hành vi lừa đảo.' },
    { id: 'DT-003', sender: 'Lê Hoàng C', date: '2026-03-25', subject: 'Khen ngợi lực lượng CA phường', status: 'Resolved', content: 'Tôi xin gửi lời cảm ơn chân thành tới các đồng chí đã xử lý nhanh chóng vụ trộm cắp tại địa bàn.' },
    { id: 'DT-004', sender: 'Phạm Văn D', date: '2026-03-10', subject: 'Lấn chiếm lòng lề đường', status: 'Pending', content: 'Hàng quán lấn chiếm gây ách tắc giao thông nghiêm trọng khu vực ngã tư Lý Thường Kiệt.' },
    { id: 'DT-005', sender: 'Hoàng Thị E', date: '2026-04-02', subject: 'Hỏi về thủ tục làm CCCD', status: 'Resolved', content: 'Tôi muốn hỏi thời gian cấp thẻ căn cước công dân gắn chip và hồ sơ cần chuẩn bị.' },
    { id: 'DT-006', sender: 'Vũ Minh F', date: '2026-03-28', subject: 'Phản ánh trật tự đường phố', status: 'Processing', content: 'Nhiều xe tải lưu thông ban đêm gây tiếng ồn và hỏng hóc mặt đường khu vực quận 3.' },
    { id: 'DT-007', sender: 'Đặng Thị G', date: '2026-03-15', subject: 'Khiếu nại xử phạt hành chính', status: 'Rejected', content: 'Tôi không đồng ý với quyết định xử phạt vi phạm hành chính ngày 12/03/2026.' },
];

const STATUS_CONFIG = {
    Pending:    { label: 'Chờ xử lý',    dot: 'bg-amber-500',   badge: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-700',    bar: 'bg-amber-400' },
    Processing: { label: 'Đang GQ',       dot: 'bg-blue-500',    badge: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-700',          bar: 'bg-blue-400' },
    Resolved:   { label: 'Đã giải quyết', dot: 'bg-emerald-500', badge: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-700', bar: 'bg-emerald-400' },
    Rejected:   { label: 'Từ chối',       dot: 'bg-slate-400',   badge: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600',        bar: 'bg-slate-400' },
};

const MONTH_DATA = [
    { month: 'T1', value: 8 }, { month: 'T2', value: 12 }, { month: 'T3', value: 7 },
    { month: 'T4', value: 7 }, { month: 'T5', value: 0 },  { month: 'T6', value: 0 },
    { month: 'T7', value: 0 },
];
const MAX_MONTH = Math.max(...MONTH_DATA.map(d => d.value), 1);

function checkIfOverdue(dateStr, status) {
    if (status === 'Resolved' || status === 'Rejected') return false;
    return Math.ceil(Math.abs(new Date() - new Date(dateStr)) / 86400000) > 5;
}

export default function PetitionsPage() {
    const today = new Date().toISOString().split('T')[0];
    const printRef = useRef(null);

    const [petitions, setPetitions] = useState(INITIAL_PETITIONS);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [showStats, setShowStats] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState('add');
    const [currentPetition, setCurrentPetition] = useState(null);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(5);

    const filteredPetitions = useMemo(() => {
        const q = searchQuery.toLowerCase();
        return petitions.filter(p => {
            const matchSearch = p.sender.toLowerCase().includes(q) || p.subject.toLowerCase().includes(q) || p.id.toLowerCase().includes(q);
            const matchStatus = statusFilter === 'All' || p.status === statusFilter;
            const matchFrom = !dateFrom || p.date >= dateFrom;
            const matchTo   = !dateTo   || p.date <= dateTo;
            return matchSearch && matchStatus && matchFrom && matchTo;
        }).sort((a, b) => new Date(b.date) - new Date(a.date));
    }, [petitions, searchQuery, statusFilter, dateFrom, dateTo]);

    // Reset page on filter change
    React.useEffect(() => { setCurrentPage(1); }, [searchQuery, statusFilter, dateFrom, dateTo]);

    const totalPages = Math.max(1, Math.ceil(filteredPetitions.length / pageSize));
    const paginatedPetitions = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return filteredPetitions.slice(start, start + pageSize);
    }, [filteredPetitions, currentPage, pageSize]);

    const stats = useMemo(() => {
        const s = { total: petitions.length, Pending: 0, Processing: 0, Resolved: 0, Rejected: 0, overdue: 0 };
        petitions.forEach(p => { s[p.status] = (s[p.status] || 0) + 1; if (checkIfOverdue(p.date, p.status)) s.overdue++; });
        return s;
    }, [petitions]);

    const openModal = (mode, petition = null) => {
        setModalMode(mode);
        setCurrentPetition(petition || { id: `DT-${String(petitions.length + 1).padStart(3, '0')}`, sender: '', date: today, subject: '', status: 'Pending', content: '' });
        setIsModalOpen(true);
    };
    const closeModal = () => { setIsModalOpen(false); setCurrentPetition(null); };
    const handleSave = (e) => { e.preventDefault(); if (modalMode === 'add') setPetitions([currentPetition, ...petitions]); else setPetitions(petitions.map(p => p.id === currentPetition.id ? currentPetition : p)); closeModal(); };
    const handleDelete = (id) => { if (window.confirm('Xóa đơn thư này?')) setPetitions(petitions.filter(p => p.id !== id)); };
    const hasActiveFilter = searchQuery || statusFilter !== 'All' || dateFrom || dateTo;

    const handlePrint = () => {
        const content = printRef.current.innerHTML;
        const win = window.open('', '_blank', 'width=900,height=700');
        win.document.write(`<html><head><title>Danh sách Đơn thư</title><style>body{font-family:'Times New Roman',serif;color:#1e293b;margin:20mm 15mm}h1{text-align:center;font-size:16pt;margin-bottom:4px}.subtitle{text-align:center;font-size:10pt;color:#64748b;margin-bottom:16px}.filter-info{font-size:9pt;color:#475569;margin-bottom:12px;padding:6px 10px;border:1px solid #e2e8f0;border-radius:4px;background:#f8fafc}.stats-row{display:flex;gap:8px;margin-bottom:16px}.stat-box{flex:1;border:1px solid #e2e8f0;border-radius:6px;padding:8px;text-align:center}.stat-num{font-size:18pt;font-weight:800}.stat-label{font-size:8pt;color:#64748b}table{width:100%;border-collapse:collapse;font-size:10pt}th{background:#f1f5f9;border:1px solid #cbd5e1;padding:7px 10px;font-weight:700;text-align:left}td{border:1px solid #e2e8f0;padding:6px 10px;vertical-align:top}tr:nth-child(even) td{background:#f8fafc}.overdue{color:#dc2626;font-weight:600}.footer{margin-top:20px;font-size:9pt;color:#64748b;text-align:right}</style></head><body>${content}</body></html>`);
        win.document.close();
        setTimeout(() => { win.focus(); win.print(); }, 500);
    };

    // shared input class
    const inputCls = "w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors disabled:bg-slate-50 dark:disabled:bg-slate-800/60 disabled:text-slate-400 dark:disabled:text-slate-500";

    return (
        <div className="flex flex-col gap-5 w-full pb-10">

            {/* HEADER */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                    <h1 className="text-2xl font-semibold text-slate-800 dark:text-white flex items-center gap-2">
                        <FileText size={24} className="text-blue-500" /> Quản lý Đơn Thư
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Theo dõi và xử lý các phản ánh, khiếu nại của công dân</p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                    <button onClick={() => setShowStats(v => !v)} className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-all border ${showStats ? 'bg-indigo-600 text-white border-indigo-600 shadow' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-400'}`}>
                        <BarChart2 size={17} /> Thống kê
                    </button>
                    <button onClick={handlePrint} className="flex items-center gap-2 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-500 px-4 py-2.5 rounded-lg font-medium text-sm transition-colors">
                        <Printer size={17} /> In danh sách
                    </button>
                    <button onClick={() => openModal('add')} className="flex items-center gap-2 bg-blue-600 text-white hover:bg-blue-700 px-4 py-2.5 rounded-lg font-medium text-sm shadow-sm transition-colors">
                        <Plus size={17} /> Thêm đơn thư
                    </button>
                </div>
            </div>

            {/* STAT CARDS */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                    { label: 'Tổng đơn thư',  value: stats.total,                     icon: FileText,      color: 'text-blue-600 dark:text-blue-400',    bg: 'bg-blue-50 dark:bg-blue-900/30',    border: 'border-blue-100 dark:border-blue-800' },
                    { label: 'Đang xử lý',     value: stats.Pending+stats.Processing,  icon: Clock,         color: 'text-amber-600 dark:text-amber-400',  bg: 'bg-amber-50 dark:bg-amber-900/30',  border: 'border-amber-100 dark:border-amber-800' },
                    { label: 'Quá hạn',         value: stats.overdue,                   icon: AlertTriangle, color: 'text-rose-600 dark:text-rose-400',    bg: 'bg-rose-50 dark:bg-rose-900/30',    border: 'border-rose-100 dark:border-rose-800', highlight: stats.overdue > 0 },
                    { label: 'Đã hoàn thành',  value: stats.Resolved,                  icon: CheckCircle2,  color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/30', border: 'border-emerald-100 dark:border-emerald-800' },
                ].map((s, i) => (
                    <div key={i} className={`bg-white dark:bg-slate-800/80 p-5 rounded-xl border ${s.highlight ? 'border-rose-200 dark:border-rose-700 ring-1 ring-rose-200 dark:ring-rose-700' : s.border} shadow-sm flex items-center gap-4`}>
                        <div className={`p-3 rounded-xl ${s.bg} ${s.color} flex-shrink-0`}><s.icon size={20} /></div>
                        <div>
                            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-0.5">{s.label}</p>
                            <p className={`text-2xl font-bold ${s.highlight ? 'text-rose-600 dark:text-rose-400' : 'text-slate-800 dark:text-white'}`}>{s.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* THỐNG KÊ MỞ RỘNG */}
            {showStats && (
                <div className="bg-white dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-5 grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div>
                        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-5 flex items-center gap-2">
                            <TrendingUp size={16} className="text-indigo-500" /> Đơn thư theo tháng
                        </h3>
                        <div className="flex items-end gap-3 h-36">
                            {MONTH_DATA.map((d, i) => (
                                <div key={i} className="flex flex-col items-center gap-1 flex-1">
                                    <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">{d.value > 0 ? d.value : ''}</span>
                                    <div className="w-full rounded-t-md transition-all duration-500" style={{
                                        height: `${Math.max((d.value / MAX_MONTH) * 100, d.value > 0 ? 8 : 0)}%`,
                                        backgroundColor: i === 3 ? '#3b82f6' : d.value > 0 ? '#93c5fd' : 'rgb(51 65 85 / 0.3)',
                                    }} />
                                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">{d.month}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-5 flex items-center gap-2">
                            <BarChart2 size={16} className="text-indigo-500" /> Tỉ lệ theo trạng thái
                        </h3>
                        <div className="flex flex-col gap-3">
                            {Object.entries(STATUS_CONFIG).map(([key, cfg]) => {
                                const count = stats[key] || 0;
                                const pct = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
                                return (
                                    <div key={key}>
                                        <div className="flex items-center justify-between text-xs mb-1.5">
                                            <div className="flex items-center gap-2">
                                                <span className={`h-2.5 w-2.5 rounded-full ${cfg.dot}`}></span>
                                                <span className="text-slate-600 dark:text-slate-300 font-medium">{cfg.label}</span>
                                            </div>
                                            <span className="text-slate-500 dark:text-slate-400 font-semibold">{count} đơn ({pct}%)</span>
                                        </div>
                                        <div className="h-2 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                            <div className={`h-full rounded-full transition-all duration-700 ${cfg.bar}`} style={{ width: `${pct}%` }} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            {/* BỘ LỌC */}
            <div className="bg-white dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-4">
                <div className="flex flex-col lg:flex-row gap-3 items-start lg:items-center">
                    <div className="relative flex-1 min-w-0 w-full">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
                        <input type="text" placeholder="Tìm theo tên người gửi, tiêu đề, mã đơn..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 transition-colors" />
                    </div>
                    <div className="flex flex-wrap gap-2 items-center w-full lg:w-auto">
                        <div className="relative">
                            <Filter size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                                className="pl-8 pr-8 py-2.5 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 appearance-none cursor-pointer">
                                <option value="All">Tất cả trạng thái</option>
                                <option value="Pending">Chờ xử lý</option>
                                <option value="Processing">Đang giải quyết</option>
                                <option value="Resolved">Đã giải quyết</option>
                                <option value="Rejected">Từ chối</option>
                            </select>
                        </div>
                        <div className="flex items-center gap-1.5 px-3 py-2.5 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-600 rounded-lg text-sm">
                            <Calendar size={13} className="text-slate-400 flex-shrink-0" />
                            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} title="Từ ngày"
                                className="bg-transparent outline-none text-slate-600 dark:text-slate-300 text-sm w-[120px] cursor-pointer" />
                            <span className="text-slate-300 dark:text-slate-600">—</span>
                            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} title="Đến ngày"
                                className="bg-transparent outline-none text-slate-600 dark:text-slate-300 text-sm w-[120px] cursor-pointer" />
                        </div>
                        {hasActiveFilter && (
                            <button onClick={() => { setSearchQuery(''); setStatusFilter('All'); setDateFrom(''); setDateTo(''); }}
                                className="flex items-center gap-1.5 px-3 py-2.5 text-sm text-slate-500 dark:text-slate-400 hover:text-rose-500 border border-slate-200 dark:border-slate-600 hover:border-rose-200 dark:hover:border-rose-700 bg-white dark:bg-slate-800 rounded-lg transition-colors">
                                <RefreshCw size={13} /> Xóa lọc
                            </button>
                        )}
                    </div>
                </div>
                {hasActiveFilter && (
                    <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700 flex flex-wrap items-center gap-2">
                        <span className="text-xs text-slate-400">Kết quả:</span>
                        <span className="text-xs font-bold text-blue-600 dark:text-blue-400">{filteredPetitions.length} đơn thư</span>
                        {statusFilter !== 'All' && <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-800">{STATUS_CONFIG[statusFilter]?.label}</span>}
                        {dateFrom && <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400">Từ: {dateFrom}</span>}
                        {dateTo   && <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400">Đến: {dateTo}</span>}
                    </div>
                )}
            </div>

            {/* TABLE */}
            <div className="bg-white dark:bg-slate-800/80 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col overflow-hidden">
                <div className="overflow-x-auto overflow-y-auto max-h-[480px]">
                    <table className="w-full min-w-[700px] text-left">
                        <thead className="sticky top-0 z-10">
                            <tr className="bg-slate-50 dark:bg-slate-700/80 border-b border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wide">
                                <th className="py-3.5 px-5 whitespace-nowrap w-[100px]">Mã Đơn</th>
                                <th className="py-3.5 px-5 w-[170px]">Người Gửi</th>
                                <th className="py-3.5 px-5">Tiêu Đề &amp; Nội Dung</th>
                                <th className="py-3.5 px-5 w-[150px]">Trạng Thái</th>
                                <th className="py-3.5 px-5 text-right w-[110px]">Thao Tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                            {paginatedPetitions.map(petition => {
                                const isOverdue = checkIfOverdue(petition.date, petition.status);
                                const cfg = STATUS_CONFIG[petition.status] || STATUS_CONFIG.Pending;
                                return (
                                    <tr key={petition.id} className={`transition-colors group hover:bg-slate-50/80 dark:hover:bg-slate-700/40 ${isOverdue ? 'bg-rose-50/40 dark:bg-rose-900/10' : ''}`}>
                                        <td className="py-4 px-5 whitespace-nowrap">
                                            <div className="flex items-center gap-1.5">
                                                {isOverdue && <div className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-pulse flex-shrink-0" />}
                                                <span className="text-sm font-mono font-medium text-slate-700 dark:text-slate-300">{petition.id}</span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-5">
                                            <div className="text-sm font-medium text-slate-800 dark:text-slate-100">{petition.sender}</div>
                                            <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                                                <Calendar size={11} />{petition.date}
                                            </div>
                                        </td>
                                        <td className="py-4 px-5 max-w-xs">
                                            <div className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate">{petition.subject}</div>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <span className="text-xs text-slate-400 dark:text-slate-500 truncate">{petition.content}</span>
                                                {isOverdue && <span className="text-rose-600 dark:text-rose-400 bg-rose-100 dark:bg-rose-900/40 px-1.5 py-0.5 rounded text-[10px] font-semibold flex-shrink-0">Quá hạn</span>}
                                            </div>
                                        </td>
                                        <td className="py-4 px-5">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border ${cfg.badge}`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`}></span>
                                                {cfg.label}
                                            </span>
                                        </td>
                                        <td className="py-4 px-5 text-right whitespace-nowrap">
                                            <div className="flex items-center justify-end gap-1 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => openModal('view', petition)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/40 rounded-md transition-colors" title="Xem"><Eye size={15} /></button>
                                                <button onClick={() => openModal('edit', petition)} className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/40 rounded-md transition-colors" title="Sửa"><Edit3 size={15} /></button>
                                                <button onClick={() => handleDelete(petition.id)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/40 rounded-md transition-colors" title="Xóa"><Trash2 size={15} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                            {filteredPetitions.length === 0 && (
                                <tr>
                                    <td colSpan="5" className="py-16 text-center text-slate-400 dark:text-slate-500">
                                        <Inbox size={38} className="mx-auto mb-3 text-slate-300 dark:text-slate-600" strokeWidth={1.5} />
                                        <p className="text-sm font-medium">Không tìm thấy đơn thư phù hợp</p>
                                        <p className="text-xs mt-1">Thử điều chỉnh bộ lọc hoặc từ khóa tìm kiếm</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                {filteredPetitions.length > 0 && (
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        pageSize={pageSize}
                        pageSizeOptions={[5, 10, 20]}
                        onPageChange={setCurrentPage}
                        onPageSizeChange={(s) => { setPageSize(s); setCurrentPage(1); }}
                        totalItems={filteredPetitions.length}
                    />
                )}
            </div>

            {/* NỘI DUNG IN ẨN */}
            <div ref={printRef} style={{ display: 'none' }}>
                <h1>DANH SÁCH ĐƠN THƯ CỦA CÔNG DÂN</h1>
                <p className="subtitle">Ngày in: {new Date().toLocaleDateString('vi-VN')} — Đơn vị: Cơ quan Công an</p>
                <div className="filter-info">Bộ lọc: {statusFilter !== 'All' ? STATUS_CONFIG[statusFilter]?.label : 'Tất cả'}{dateFrom ? ` | Từ: ${dateFrom}` : ''}{dateTo ? ` | Đến: ${dateTo}` : ''}{searchQuery ? ` | Từ khóa: "${searchQuery}"` : ''}</div>
                <div className="stats-row">
                    <div className="stat-box"><div className="stat-num" style={{color:'#3b82f6'}}>{stats.total}</div><div className="stat-label">Tổng đơn</div></div>
                    <div className="stat-box"><div className="stat-num" style={{color:'#f59e0b'}}>{stats.Pending+stats.Processing}</div><div className="stat-label">Đang xử lý</div></div>
                    <div className="stat-box"><div className="stat-num" style={{color:'#dc2626'}}>{stats.overdue}</div><div className="stat-label">Quá hạn</div></div>
                    <div className="stat-box"><div className="stat-num" style={{color:'#10b981'}}>{stats.Resolved}</div><div className="stat-label">Hoàn thành</div></div>
                </div>
                <table>
                    <thead><tr><th>STT</th><th>Mã đơn</th><th>Người gửi</th><th>Ngày gửi</th><th>Tiêu đề phản ánh</th><th>Trạng thái</th></tr></thead>
                    <tbody>
                        {filteredPetitions.map((p, idx) => (
                            <tr key={p.id}>
                                <td>{idx + 1}</td><td>{p.id}</td><td>{p.sender}</td><td>{p.date}</td>
                                <td>{p.subject}{checkIfOverdue(p.date, p.status) && <span className="overdue"> ⚠ Quá hạn</span>}</td>
                                <td>{STATUS_CONFIG[p.status]?.label}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                <p className="footer">Tổng: {filteredPetitions.length} đơn | In lúc {new Date().toLocaleTimeString('vi-VN')}</p>
            </div>

            {/* MODAL */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-800 rounded-xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh]">
                        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-700 flex-shrink-0">
                            <h2 className="text-base font-semibold text-slate-800 dark:text-white">
                                {modalMode === 'add' ? '➕ Thêm mới đơn thư' : modalMode === 'edit' ? '✏️ Cập nhật đơn thư' : '📋 Chi tiết đơn thư'}
                            </h2>
                            <button onClick={closeModal} className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"><X size={18} /></button>
                        </div>
                        <div className="p-5 md:p-6 overflow-y-auto flex-1">
                            {currentPetition && checkIfOverdue(currentPetition.date, currentPetition.status) && (
                                <div className="mb-5 bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-800 text-rose-700 dark:text-rose-300 px-4 py-3 rounded-lg flex items-start gap-3">
                                    <AlertTriangle size={18} className="shrink-0 mt-0.5 text-rose-500" />
                                    <div>
                                        <h4 className="text-sm font-semibold">Cảnh báo: Đơn thư quá hạn</h4>
                                        <p className="text-xs mt-1 opacity-80">Đơn thư đã vượt quá 5 ngày mà chưa được giải quyết.</p>
                                    </div>
                                </div>
                            )}
                            <form id="petitionForm" onSubmit={handleSave} className="space-y-5">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-slate-600 dark:text-slate-300">Mã đơn</label>
                                        <input type="text" value={currentPetition?.id || ''} disabled className={inputCls} />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-slate-600 dark:text-slate-300">Người gửi <span className="text-rose-500">*</span></label>
                                        <input type="text" required disabled={modalMode === 'view'} value={currentPetition?.sender || ''} onChange={e => setCurrentPetition({...currentPetition, sender: e.target.value})} className={inputCls} />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-slate-600 dark:text-slate-300">Ngày gửi <span className="text-rose-500">*</span></label>
                                        <input type="date" required disabled={modalMode === 'view'} value={currentPetition?.date || ''} onChange={e => setCurrentPetition({...currentPetition, date: e.target.value})} className={inputCls} />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-slate-600 dark:text-slate-300">Trạng thái <span className="text-rose-500">*</span></label>
                                        <select disabled={modalMode === 'view'} value={currentPetition?.status || 'Pending'} onChange={e => setCurrentPetition({...currentPetition, status: e.target.value})} className={inputCls + ' appearance-none'}>
                                            <option value="Pending">Chờ xử lý</option>
                                            <option value="Processing">Đang giải quyết</option>
                                            <option value="Resolved">Đã giải quyết</option>
                                            <option value="Rejected">Từ chối</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-slate-600 dark:text-slate-300">Tiêu đề phản ánh <span className="text-rose-500">*</span></label>
                                    <input type="text" required disabled={modalMode === 'view'} value={currentPetition?.subject || ''} onChange={e => setCurrentPetition({...currentPetition, subject: e.target.value})} className={inputCls} />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-slate-600 dark:text-slate-300">Nội dung chi tiết <span className="text-rose-500">*</span></label>
                                    <textarea required disabled={modalMode === 'view'} value={currentPetition?.content || ''} onChange={e => setCurrentPetition({...currentPetition, content: e.target.value})} className={inputCls + ' resize-none h-28'} />
                                </div>
                            </form>
                        </div>
                        <div className="p-4 md:px-6 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-3 bg-slate-50 dark:bg-slate-800/80 rounded-b-xl flex-shrink-0">
                            <button onClick={closeModal} className="px-5 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors">
                                {modalMode === 'view' ? 'Đóng' : 'Hủy bỏ'}
                            </button>
                            {modalMode !== 'view' && (
                                <button form="petitionForm" type="submit" className="px-5 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 shadow-sm transition-colors">
                                    Lưu thay đổi
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
