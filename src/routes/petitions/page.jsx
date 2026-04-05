import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
    Plus, Search, Edit3, Trash2, Eye, X, Filter, AlertTriangle,
    CheckCircle2, Clock, Inbox, Calendar, FileText, Printer,
    BarChart2, RefreshCw, TrendingUp, User, Tag, Type, MessageSquare, ClipboardList, PenTool
} from 'lucide-react';
import { Pagination } from '../user/page';
import { complainsApi } from '../../api/complainsApi';
import { userApi } from '../../api/userApi';

const STATUS_CONFIG = {
    Pending:    { label: 'Chờ xử lý',    dot: 'bg-amber-500',   badge: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-700',    bar: 'bg-amber-400' },
    Processing: { label: 'Đang GQ',       dot: 'bg-blue-500',    badge: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-700',          bar: 'bg-blue-400' },
    Resolved:   { label: 'Đã giải quyết', dot: 'bg-emerald-500', badge: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-700', bar: 'bg-emerald-400' },
    Rejected:   { label: 'Từ chối',       dot: 'bg-slate-400',   badge: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600',        bar: 'bg-slate-400' },
};

function checkIfOverdue(deadline, status) {
    if (!deadline || status === 'Resolved' || status === 'Rejected') return false;
    return new Date(deadline) < new Date(new Date().setHours(0, 0, 0, 0));
}

export default function PetitionsPage() {
    const today = new Date().toISOString().split('T')[0];
    const printRef = useRef(null);

    const [petitions, setPetitions] = useState([]);
    const [users, setUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    
    // Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [showStats, setShowStats] = useState(false);
    
    // Manage/Edit Modal
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState('add');
    const [currentPetition, setCurrentPetition] = useState(null);
    const [isSaving, setIsSaving] = useState(false);

    // Delete Modal
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [deletingPetition, setDeletingPetition] = useState(null);

    // Toast Notification
    const [toast, setToast] = useState(null);
    const showToast = (message, type = 'success') => { setToast({ message, type }); setTimeout(() => setToast(null), 3000); };

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(5);

    const fetchData = async () => {
        try {
            setIsLoading(true);
            const [petitionsData, usersData] = await Promise.all([
                complainsApi.getComplains(),
                userApi.getUsers()
            ]);
            
            let finalUsers = [];
            if (Array.isArray(usersData)) finalUsers = usersData;
            else if (Array.isArray(usersData?.data)) finalUsers = usersData.data;
            else if (Array.isArray(usersData?.users)) finalUsers = usersData.users;
            else if (usersData?.data?.data && Array.isArray(usersData.data.data)) finalUsers = usersData.data.data;
            
            let finalPetitions = [];
            if (Array.isArray(petitionsData)) finalPetitions = petitionsData;
            else if (Array.isArray(petitionsData?.data)) finalPetitions = petitionsData.data;
            else if (Array.isArray(petitionsData?.complains)) finalPetitions = petitionsData.complains;
            else if (petitionsData?.data?.data && Array.isArray(petitionsData.data.data)) finalPetitions = petitionsData.data.data;

            setPetitions(finalPetitions);
            setUsers(finalUsers);
        } catch (error) {
            console.error('Lỗi khi tải dữ liệu:', error);
            showToast('Không thể tải dữ liệu từ máy chủ.', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const filteredPetitions = useMemo(() => {
        const q = searchQuery.toLowerCase();
        return petitions.filter(p => {
            const matchSearch = (p.title || '').toLowerCase().includes(q) || (p.id?.toString() || '').includes(q) || (p.type || '').toLowerCase().includes(q);
            const matchStatus = statusFilter === 'All' || p.status === statusFilter;
            
            const objDate = p.created_at ? p.created_at.split('T')[0] : '';
            const matchFrom = !dateFrom || objDate >= dateFrom;
            const matchTo   = !dateTo   || objDate <= dateTo;
            return matchSearch && matchStatus && matchFrom && matchTo;
        }).sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
    }, [petitions, searchQuery, statusFilter, dateFrom, dateTo]);

    // Reset page on filter change
    useEffect(() => { setCurrentPage(1); }, [searchQuery, statusFilter, dateFrom, dateTo]);

    const totalPages = Math.max(1, Math.ceil(filteredPetitions.length / pageSize));
    const paginatedPetitions = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return filteredPetitions.slice(start, start + pageSize);
    }, [filteredPetitions, currentPage, pageSize]);

    const stats = useMemo(() => {
        const s = { total: petitions.length, Pending: 0, Processing: 0, Resolved: 0, Rejected: 0, overdue: 0 };
        petitions.forEach(p => { 
            s[p.status] = (s[p.status] || 0) + 1; 
            if (checkIfOverdue(p.deadline, p.status)) s.overdue++; 
        });
        return s;
    }, [petitions]);

    const monthData = useMemo(() => {
        const currentMonth = new Date().getMonth() + 1;
        const data = [];
        for (let i = 6; i >= 0; i--) {
            let m = currentMonth - i;
            if (m <= 0) m += 12;
            data.push({ month: `T${m}`, monthNum: m, value: 0 });
        }
        petitions.forEach(p => {
            if (!p.created_at) return;
            const m = new Date(p.created_at).getMonth() + 1;
            const slot = data.find(d => d.monthNum === m);
            if (slot) slot.value++;
        });
        return data;
    }, [petitions]);
    const maxMonthValue = Math.max(...monthData.map(d => d.value), 1);

    const openModal = (mode, petition = null) => {
        setModalMode(mode);
        if (petition) {
            setCurrentPetition({ ...petition });
        } else {
            setCurrentPetition({
                title: '',
                content: '',
                type: '',
                status: 'Pending',
                assigned_to: '',
                deadline: '',
                result: '',
                created_at: today
            });
        }
        setIsModalOpen(true);
    };
    
    const closeModal = () => { setIsModalOpen(false); setCurrentPetition(null); };
    
    const handleSave = async (e) => { 
        e.preventDefault(); 
        setIsSaving(true);
        
        try {
            const payload = {
                title: currentPetition.title,
                content: currentPetition.content,
                type: currentPetition.type,
                status: currentPetition.status,
                assigned_to: currentPetition.assigned_to || null,
                deadline: currentPetition.deadline || null,
                result: currentPetition.result || '',
                created_at: currentPetition.created_at || today,
            };

            if (modalMode === 'add') { 
                await complainsApi.createComplain(payload);
                await fetchData(); // Đảm bảo reload đủ thông tin thay vì nhét mảng thủ công
                showToast('Thêm mới khiếu nại thành công!');
            } else { 
                await complainsApi.updateComplain(currentPetition.id, payload);
                await fetchData();
                showToast('Cập nhật khiếu nại thành công!');
            }
            closeModal();
        } catch (error) {
            console.error('Lỗi khi lưu đơn thư:', error);
            showToast('Có lỗi xảy ra khi lưu thông tin. Vui lòng kiểm tra lại.', 'error');
        } finally {
            setIsSaving(false);
        }
    };
    
    const handleDelete = async () => { 
        if (!deletingPetition) return;
        try {
            await complainsApi.deleteComplain(deletingPetition.id);
            setPetitions(petitions.filter(p => p.id !== deletingPetition.id)); 
            showToast('Đã xóa khiếu nại thành công!');
        } catch (error) {
            console.error('Lỗi xóa đơn thư:', error);
            showToast('Không thể xóa khiếu nại. Vui lòng thử lại.', 'error');
        } finally {
            setIsDeleteModalOpen(false);
            setDeletingPetition(null);
        }
    };
    
    const hasActiveFilter = searchQuery || statusFilter !== 'All' || dateFrom || dateTo;

    const handlePrint = () => {
        const content = printRef.current.innerHTML;
        const win = window.open('', '_blank', 'width=900,height=700');
        win.document.write(`<html><head><title>Danh sách Đơn thư</title><style>body{font-family:'Times New Roman',serif;color:#1e293b;margin:20mm 15mm}h1{text-align:center;font-size:16pt;margin-bottom:4px}.subtitle{text-align:center;font-size:10pt;color:#64748b;margin-bottom:16px}.filter-info{font-size:9pt;color:#475569;margin-bottom:12px;padding:6px 10px;border:1px solid #e2e8f0;border-radius:4px;background:#f8fafc}.stats-row{display:flex;gap:8px;margin-bottom:16px}.stat-box{flex:1;border:1px solid #e2e8f0;border-radius:6px;padding:8px;text-align:center}.stat-num{font-size:18pt;font-weight:800}.stat-label{font-size:8pt;color:#64748b}table{width:100%;border-collapse:collapse;font-size:10pt}th{background:#f1f5f9;border:1px solid #cbd5e1;padding:7px 10px;font-weight:700;text-align:left}td{border:1px solid #e2e8f0;padding:6px 10px;vertical-align:top}tr:nth-child(even) td{background:#f8fafc}.overdue{color:#dc2626;font-weight:600}.footer{margin-top:20px;font-size:9pt;color:#64748b;text-align:right}</style></head><body>${content}</body></html>`);
        win.document.close();
        setTimeout(() => { win.focus(); win.print(); }, 500);
    };

    const getUserName = (assignedToValue) => {
        if (!assignedToValue) return;
        
        let idToCheck = assignedToValue;
        if (typeof assignedToValue === 'object' && assignedToValue !== null) {
            if (assignedToValue.name) return assignedToValue.name;
            idToCheck = assignedToValue.id;
        }

        const user = users.find(u => String(u.id) === String(idToCheck));
        return user ? user.name : `ID: ${idToCheck}`;
    };

    // Beautiful Inputs config 
    const inputCls = "w-full py-2.5 bg-slate-50/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all disabled:bg-slate-100/50 dark:disabled:bg-slate-800/60 disabled:text-slate-500 disabled:cursor-not-allowed";

    return (
        <div className="flex flex-col gap-5 w-full pb-10">

            {/* HEADER */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                    <h1 className="text-2xl font-semibold text-slate-800 dark:text-white flex items-center gap-2">
                        <FileText size={24} className="text-blue-500" /> Quản lý Khiếu nại
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Theo dõi, phân công và xử lý các khiếu nại</p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                    <button onClick={() => setShowStats(v => !v)} className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-all border ${showStats ? 'bg-indigo-600 text-white border-indigo-600 shadow' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-400'}`}>
                        <BarChart2 size={17} /> Thống kê
                    </button>
                    <button onClick={handlePrint} className="flex items-center gap-2 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-500 px-4 py-2.5 rounded-lg font-medium text-sm transition-colors">
                        <Printer size={17} /> In danh sách
                    </button>
                    <button onClick={() => openModal('add')} className="flex items-center gap-2 bg-blue-600 text-white hover:bg-blue-700 px-4 py-2.5 rounded-lg font-medium text-sm shadow-sm transition-colors">
                        <Plus size={17} /> Thêm khiếu nại
                    </button>
                </div>
            </div>

            {/* STAT CARDS */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                    { label: 'Tổng khiếu nại',  value: stats.total,                     icon: FileText,      color: 'text-blue-600 dark:text-blue-400',    bg: 'bg-blue-50 dark:bg-blue-900/30',    border: 'border-blue-100 dark:border-blue-800' },
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
                            <TrendingUp size={16} className="text-indigo-500" /> Số lượng / 7 tháng gần nhất
                        </h3>
                        <div className="flex items-end gap-3 h-36">
                            {monthData.map((d, i) => (
                                <div key={i} className="flex flex-col items-center gap-1 flex-1">
                                    <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">{d.value > 0 ? d.value : ''}</span>
                                    <div className="w-full rounded-t-md transition-all duration-500" style={{
                                        height: `${Math.max((d.value / maxMonthValue) * 100, d.value > 0 ? 8 : 0)}%`,
                                        backgroundColor: i === monthData.length - 1 ? '#3b82f6' : d.value > 0 ? '#93c5fd' : 'rgb(51 65 85 / 0.3)',
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
                        <input type="text" placeholder="Tìm theo ID, tiêu đề, loại khiếu nại..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
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
                            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} title="Từ ngày (Tạo)"
                                className="bg-transparent outline-none text-slate-600 dark:text-slate-300 text-sm w-[120px] cursor-pointer" />
                            <span className="text-slate-300 dark:text-slate-600">—</span>
                            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} title="Đến ngày (Tạo)"
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
                        <span className="text-xs font-bold text-blue-600 dark:text-blue-400">{filteredPetitions.length} khiếu nại</span>
                        {statusFilter !== 'All' && <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-800">{STATUS_CONFIG[statusFilter]?.label}</span>}
                        {dateFrom && <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400">Từ: {dateFrom}</span>}
                        {dateTo   && <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400">Đến: {dateTo}</span>}
                    </div>
                )}
            </div>

            {/* TABLE */}
            {isLoading ? (
                <div className="flex flex-col items-center justify-center h-64 text-slate-500 bg-white dark:bg-slate-800/80 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                    <RefreshCw className="animate-spin mb-3 text-blue-500" size={32} />
                    <p className="text-sm font-medium">Đang tải dữ liệu...</p>
                </div>
            ) : (
                <div className="bg-white dark:bg-slate-800/80 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col overflow-hidden">
                    <div className="overflow-x-auto overflow-y-auto max-h-[480px]">
                        <table className="w-full min-w-[850px] text-left">
                            <thead className="sticky top-0 z-10">
                                <tr className="bg-slate-50 dark:bg-slate-700/80 border-b border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wide">
                                    <th className="py-3.5 px-5 whitespace-nowrap w-[100px]">ID</th>
                                    <th className="py-3.5 px-5 w-[160px]">Thông tin loại</th>
                                    <th className="py-3.5 px-5 min-w-[200px]">Tiêu Đề &amp; Nội Dung</th>
                                    <th className="py-3.5 px-5 w-[160px]">Phân công</th>
                                    <th className="py-3.5 px-5 w-[150px]">Trạng Thái</th>
                                    <th className="py-3.5 px-5 text-right w-[110px]">Thao Tác</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                {paginatedPetitions.map(petition => {
                                    const isOverdue = checkIfOverdue(petition.deadline, petition.status);
                                    const cfg = STATUS_CONFIG[petition.status] || STATUS_CONFIG.Pending;
                                    const assignedName = getUserName(petition.assigned_to);
                                    
                                    return (
                                        <tr key={petition.id} className={`transition-colors group hover:bg-slate-50/80 dark:hover:bg-slate-700/40 ${isOverdue ? 'bg-rose-50/40 dark:bg-rose-900/10' : ''}`}>
                                            <td className="py-4 px-5 whitespace-nowrap">
                                                <div className="flex items-center gap-1.5">
                                                    {isOverdue && <div className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-pulse flex-shrink-0" />}
                                                    <span className="text-sm font-mono font-medium text-slate-700 dark:text-slate-300">KN-{petition.id}</span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-5">
                                                <div className="text-sm font-medium text-slate-800 dark:text-slate-100">{petition.type || 'Chưa phân loại'}</div>
                                                <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5" title="Ngày nhận (Ngày tạo)">
                                                    <Calendar size={11} /> {petition.created_at ? petition.created_at.split('T')[0] : '---'}
                                                </div>
                                            </td>
                                            <td className="py-4 px-5 max-w-sm">
                                                <div className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate" title={petition.title}>{petition.title}</div>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <span className="text-xs text-slate-400 dark:text-slate-500 truncate" title={petition.content}>{petition.content}</span>
                                                    {isOverdue && <span className="text-rose-600 dark:text-rose-400 bg-rose-100 dark:bg-rose-900/40 px-1.5 py-0.5 rounded text-[10px] font-semibold flex-shrink-0">Quá hạn</span>}
                                                </div>
                                            </td>
                                            <td className="py-4 px-5">
                                                <div className="flex items-center gap-1.5 text-sm">
                                                    <User size={13} className="text-slate-400" />
                                                    <span className={`truncate ${assignedName ? 'text-slate-700 dark:text-slate-300' : 'text-slate-400 italic'}`}>
                                                        {assignedName || 'Chưa phân công'}
                                                    </span>
                                                </div>
                                                {petition.deadline && (
                                                    <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5" title="Hạn xử lý">
                                                        <Clock size={11} /> Hạn: {petition.deadline.split('T')[0]}
                                                    </div>
                                                )}
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
                                                    <button onClick={() => { setDeletingPetition(petition); setIsDeleteModalOpen(true); }} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/40 rounded-md transition-colors" title="Xóa"><Trash2 size={15} /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {filteredPetitions.length === 0 && (
                                    <tr>
                                        <td colSpan="6" className="py-16 text-center text-slate-400 dark:text-slate-500">
                                            <Inbox size={38} className="mx-auto mb-3 text-slate-300 dark:text-slate-600" strokeWidth={1.5} />
                                            <p className="text-sm font-medium">Không tìm thấy khiếu nại phù hợp</p>
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
            )}

            {/* NỘI DUNG IN ẨN */}
            <div ref={printRef} style={{ display: 'none' }}>
                <h1>DANH SÁCH KHIẾU NẠI CỦA CÔNG DÂN</h1>
                <p className="subtitle">Ngày in: {new Date().toLocaleDateString('vi-VN')} — Đơn vị: Cơ quan Công an</p>
                <div className="filter-info">Bộ lọc: {statusFilter !== 'All' ? STATUS_CONFIG[statusFilter]?.label : 'Tất cả'}{dateFrom ? ` | Từ: ${dateFrom}` : ''}{dateTo ? ` | Đến: ${dateTo}` : ''}{searchQuery ? ` | Từ khóa: "${searchQuery}"` : ''}</div>
                <div className="stats-row">
                    <div className="stat-box"><div className="stat-num" style={{color:'#3b82f6'}}>{stats.total}</div><div className="stat-label">Tổng đơn</div></div>
                    <div className="stat-box"><div className="stat-num" style={{color:'#f59e0b'}}>{stats.Pending+stats.Processing}</div><div className="stat-label">Đang xử lý</div></div>
                    <div className="stat-box"><div className="stat-num" style={{color:'#dc2626'}}>{stats.overdue}</div><div className="stat-label">Quá hạn</div></div>
                    <div className="stat-box"><div className="stat-num" style={{color:'#10b981'}}>{stats.Resolved}</div><div className="stat-label">Hoàn thành</div></div>
                </div>
                <table>
                    <thead><tr><th>ID</th><th>Loại</th><th>Tiêu đề</th><th>Ngày tiếp nhận</th><th>Hạn chót</th><th>Phân công</th><th>Trạng thái</th></tr></thead>
                    <tbody>
                        {filteredPetitions.map((p) => (
                            <tr key={p.id}>
                                <td>{p.id}</td>
                                <td>{p.type}</td>
                                <td>{p.title}{checkIfOverdue(p.deadline, p.status) && <span className="overdue"> ⚠ Quá hạn</span>}</td>
                                <td>{p.created_at ? p.created_at.split('T')[0] : '---'}</td>
                                <td>{p.deadline ? p.deadline.split('T')[0] : '---'}</td>
                                <td>{getUserName(p.assigned_to) || '---'}</td>
                                <td>{STATUS_CONFIG[p.status]?.label}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                <p className="footer">Tổng: {filteredPetitions.length} đơn | In lúc {new Date().toLocaleTimeString('vi-VN')}</p>
            </div>

            {/* FORM MODAL */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-[2px]" onClick={closeModal}>
                    <div className="bg-white dark:bg-slate-800 rounded-xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-700 flex-shrink-0">
                            <h2 className="text-base font-semibold text-slate-800 dark:text-white flex items-center gap-2">
                                {modalMode === 'add' ? <Plus className="text-blue-500" size={18}/> 
                                : modalMode === 'edit' ? <Edit3 className="text-amber-500" size={18}/> 
                                : <Eye className="text-slate-500" size={18}/>}
                                {modalMode === 'add' ? 'Thêm mới khiếu nại' : modalMode === 'edit' ? 'Cập nhật khiếu nại' : 'Chi tiết khiếu nại'}
                            </h2>
                            <button onClick={closeModal} className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"><X size={18} /></button>
                        </div>
                        <div className="p-5 md:p-6 overflow-y-auto flex-1 custom-scrollbar">
                            {currentPetition && checkIfOverdue(currentPetition.deadline, currentPetition.status) && (
                                <div className="mb-6 bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-800 text-rose-700 dark:text-rose-300 px-4 py-3.5 rounded-lg flex items-start gap-3 shadow-sm">
                                    <AlertTriangle size={18} className="shrink-0 mt-0.5 text-rose-500" />
                                    <div>
                                        <h4 className="text-sm font-semibold">Cảnh báo: Khiếu nại quá hạn xử lý</h4>
                                        <p className="text-xs mt-1 opacity-80">Đã vượt quá ngày hết hạn thiết lập mà hồ sơ này chưa được giải quyết xong.</p>
                                    </div>
                                </div>
                            )}
                            <form id="petitionForm" onSubmit={handleSave} className="space-y-5">
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1">Tiêu đề phản ánh <span className="text-rose-500">*</span></label>
                                    <div className="relative">
                                        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"><Type size={16} /></div>
                                        <input type="text" required disabled={modalMode === 'view'} value={currentPetition?.title || ''} onChange={e => setCurrentPetition({...currentPetition, title: e.target.value})} className={`${inputCls} pl-10`} placeholder="Nhập tiêu đề khiếu nại ngắn gọn" />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1">Ngày nhận đơn (Ngày tạo) <span className="text-rose-500">*</span></label>
                                        <div className="relative">
                                            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"><Calendar size={16} /></div>
                                            <input type="date" required disabled={modalMode === 'view'} value={currentPetition?.created_at ? currentPetition.created_at.split('T')[0] : ''} onChange={e => setCurrentPetition({...currentPetition, created_at: e.target.value})} className={`${inputCls} pl-10`} />
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1">Loại khiếu nại</label>
                                        <div className="relative">
                                            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"><Tag size={16} /></div>
                                            <input type="text" disabled={modalMode === 'view'} value={currentPetition?.type || ''} onChange={e => setCurrentPetition({...currentPetition, type: e.target.value})} className={`${inputCls} pl-10`} placeholder="VD: Gây rối trật tự, Lừa đảo..." />
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1">Hạn xử lý (Deadline)</label>
                                        <div className="relative">
                                            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"><Clock size={16} /></div>
                                            <input type="date" disabled={modalMode === 'view'} value={currentPetition?.deadline ? currentPetition.deadline.split('T')[0] : ''} onChange={e => setCurrentPetition({...currentPetition, deadline: e.target.value})} className={`${inputCls} pl-10`} />
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1">Trạng thái <span className="text-rose-500">*</span></label>
                                        <div className="relative">
                                            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"><AlertTriangle size={16} /></div>
                                            <select disabled={modalMode === 'view'} value={currentPetition?.status || 'Pending'} onChange={e => setCurrentPetition({...currentPetition, status: e.target.value})} className={`${inputCls} pl-10 appearance-none cursor-pointer`}>
                                                <option value="Pending">Chờ xử lý</option>
                                                <option value="Processing">Đang giải quyết</option>
                                                <option value="Resolved">Đã giải quyết</option>
                                                <option value="Rejected">Từ chối</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="space-y-1.5 md:col-span-2">
                                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1">Phân công người giải quyết</label>
                                        <div className="relative">
                                            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"><User size={16} /></div>
                                            <select disabled={modalMode === 'view'} value={(typeof currentPetition?.assigned_to === 'object' ? currentPetition?.assigned_to?.id : currentPetition?.assigned_to) || ''} onChange={e => setCurrentPetition({...currentPetition, assigned_to: e.target.value})} className={`${inputCls} pl-10 appearance-none cursor-pointer`}>
                                                <option value="">-- Chưa được phân công (Gửi thẳng ban chuyên trách) --</option>
                                                {users.map(u => (
                                                    <option key={u.id} value={u.id}>{u.name || `User ${u.id}`}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2 mb-1">
                                        <MessageSquare size={15} className="text-slate-400"/> Nội dung chi tiết <span className="text-rose-500">*</span>
                                    </label>
                                    <textarea required disabled={modalMode === 'view'} value={currentPetition?.content || ''} onChange={e => setCurrentPetition({...currentPetition, content: e.target.value})} className={`${inputCls} resize-none h-28 leading-relaxed`} placeholder="Mô tả chi tiết nội dung sự việc..." />
                                </div>
                                {(modalMode !== 'add' || currentPetition?.result) && (
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2 mb-1">
                                            <ClipboardList size={15} className="text-emerald-500"/> Kết quả giải quyết
                                        </label>
                                        <textarea disabled={modalMode === 'view'} value={currentPetition?.result || ''} onChange={e => setCurrentPetition({...currentPetition, result: e.target.value})} className={`${inputCls} resize-none h-24 bg-emerald-50/30 dark:bg-emerald-900/10 border-emerald-200/60 dark:border-emerald-800/50 focus:border-emerald-500 focus:ring-emerald-500/20 leading-relaxed`} placeholder="Ghi chú kết quả sau khi đã giải quyết xong..." />
                                    </div>
                                )}
                            </form>
                        </div>
                        <div className="p-4 md:px-6 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-3 bg-slate-50/80 dark:bg-slate-800/80 rounded-b-xl flex-shrink-0">
                            <button onClick={closeModal} disabled={isSaving} className="px-5 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-600 hover:text-slate-800 transition-all disabled:opacity-50 shadow-sm">
                                {modalMode === 'view' ? 'Đóng lại' : 'Hủy bỏ'}
                            </button>
                            {modalMode !== 'view' && (
                                <button form="petitionForm" type="submit" disabled={isSaving} className="px-5 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-lg shadow-sm transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2">
                                    {isSaving ? <RefreshCw size={16} className="animate-spin" /> : <PenTool size={16} />}
                                    {modalMode === 'add' ? 'Tạo khiếu nại' : 'Lưu cập nhật'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* DELETE MODAL */}
            {isDeleteModalOpen && deletingPetition && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-[2px]" onClick={() => setIsDeleteModalOpen(false)}>
                    <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
                        <div className="p-7 text-center">
                            <div className="w-16 h-16 rounded-full bg-rose-50 dark:bg-rose-900/30 flex items-center justify-center mx-auto mb-4 shadow-inner">
                                <AlertTriangle size={30} className="text-rose-500" />
                            </div>
                            <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-2">Xác nhận xóa khiếu nại</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Bạn có chắc muốn xóa vĩnh viễn hồ sơ này:</p>
                            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 mt-2 mb-2 truncate px-4 py-2 bg-slate-50 dark:bg-slate-900/50 rounded border border-slate-100 dark:border-slate-700 mx-auto max-w-[90%]">"{deletingPetition.title}"</p>
                            <p className="text-xs text-rose-500 dark:text-rose-400 mt-2 font-medium">Hành động này không thể hoàn tác!</p>
                        </div>
                        <div className="px-6 py-4 flex justify-center gap-3 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-100 dark:border-slate-700">
                            <button onClick={() => setIsDeleteModalOpen(false)} className="px-5 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-600 hover:text-slate-800 transition-all shadow-sm">Hủy bỏ</button>
                            <button onClick={handleDelete} className="px-5 py-2.5 text-sm font-medium text-white bg-rose-600 hover:bg-rose-700 active:bg-rose-800 rounded-lg shadow-sm transition-all focus:ring-4 focus:ring-rose-500/20">Xóa vĩnh viễn</button>
                        </div>
                    </div>
                </div>
            )}

            {/* TOAST NOTIFICATION */}
            {toast && (
                <div className={`fixed top-6 right-6 z-[200] flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border animate-in slide-in-from-top-4 duration-300 ${toast.type === 'error' ? 'bg-rose-50 dark:bg-rose-900/90 border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300' : 'bg-emerald-50 dark:bg-emerald-900/90 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'}`}>
                    {toast.type === 'error' ? <AlertTriangle size={18} className="flex-shrink-0" /> : <CheckCircle2 size={18} className="flex-shrink-0" />}
                    <span className="text-sm font-medium">{toast.message}</span>
                    <button onClick={() => setToast(null)} className="ml-3 p-1 rounded-md opacity-60 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/10 transition-all"><X size={15} /></button>
                </div>
            )}
        </div>
    );
}
