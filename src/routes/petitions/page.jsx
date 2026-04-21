import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
    Plus, Search, Edit3, Trash2, Eye, X, Filter, AlertTriangle,
    CheckCircle2, Clock, Inbox, Calendar, FileText, Printer,
    BarChart2, RefreshCw, TrendingUp, User, UserCheck, Tag, Type, MessageSquare, ClipboardList, PenTool, Database, Globe
} from 'lucide-react';
import { Pagination } from '../user/page';
import { donthuApi } from '../../api/donthuApi';
import { userApi } from '../../api/userApi';
import { donviApi } from '../../api/donviApi';

// Cấu hình hiển thị cho các trạng thái đơn thư (màu sắc, nhãn)
const STATUS_CONFIG = {
    'Chờ xử lý': { label: 'Chờ xử lý', dot: 'bg-amber-500', badge: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-700', bar: 'bg-amber-400' },
    'Đang xử lý': { label: 'Đang xử lý', dot: 'bg-blue-500', badge: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-700', bar: 'bg-blue-400' },
    'Đã giải quyết': { label: 'Đã giải quyết', dot: 'bg-emerald-500', badge: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-700', bar: 'bg-emerald-400' },
    'Từ chối': { label: 'Từ chối', dot: 'bg-slate-400', badge: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600', bar: 'bg-slate-400' },
};

// Hàm kiểm tra xem đơn thư có bị quá hạn xử lý hay không
function checkIfOverdue(han_xu_ly, status) {
    if (!han_xu_ly || status === 'Đã giải quyết' || status === 'Từ chối') return false;
    return new Date(han_xu_ly) < new Date(new Date().setHours(0, 0, 0, 0));
}

export default function PetitionsPage() {
    // Khởi tạo các state cho dữ liệu, bộ lọc, modal và phân trang
    const today = new Date().toISOString().split('T')[0];
    const printRef = useRef(null);

    const [petitions, setPetitions] = useState([]);
    const [users, setUsers] = useState([]);
    const [donviList, setDonviList] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    
    // Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [assigneeFilter, setAssigneeFilter] = useState('All'); // NEW
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [showStats, setShowStats] = useState(false);
    
    // Modal
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState('add');
    const [currentPetition, setCurrentPetition] = useState(null);
    const [isSaving, setIsSaving] = useState(false);

    // Delete Modal
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [deletingPetition, setDeletingPetition] = useState(null);

    // Toast
    const [toast, setToast] = useState(null);
    const showToast = (message, type = 'success') => { setToast({ message, type }); setTimeout(() => setToast(null), 3000); };

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(5);

    const [currentUser, setCurrentUser] = useState(null);

    // Hàm lấy dữ liệu đơn thư và danh sách người dùng từ API
    const fetchData = async () => {
        try {
            setIsLoading(true);
            
            const token = localStorage.getItem('token');
            let loggedInUser = null;
            if (token) {
                try {
                    loggedInUser = JSON.parse(token);
                    setCurrentUser(loggedInUser);
                } catch (e) {
                    console.error("Lỗi parse token", e);
                }
            }

            const [petitionsData, usersData, donviData] = await Promise.all([
                donthuApi.getDonThus(),
                userApi.getUsers(),
                donviApi.getDonvi()
            ]);
            
            let finalDonvi = [];
            if (Array.isArray(donviData)) finalDonvi = donviData;
            else if (Array.isArray(donviData?.data)) finalDonvi = donviData.data;
            setDonviList(finalDonvi);
            
            let finalUsers = [];
            if (Array.isArray(usersData)) finalUsers = usersData;
            else if (Array.isArray(usersData?.data)) finalUsers = usersData.data;
            else if (Array.isArray(usersData?.users)) finalUsers = usersData.users;
            else if (usersData?.data?.data && Array.isArray(usersData.data.data)) finalUsers = usersData.data.data;
            
            let finalPetitions = [];
            if (Array.isArray(petitionsData)) finalPetitions = petitionsData;
            else if (Array.isArray(petitionsData?.data)) finalPetitions = petitionsData.data;
            else if (Array.isArray(petitionsData?.donthus)) finalPetitions = petitionsData.donthus;
            else if (petitionsData?.data?.data && Array.isArray(petitionsData.data.data)) finalPetitions = petitionsData.data.data;

            // Phân quyền
            if (loggedInUser && loggedInUser.role === 'user') {
                finalPetitions = finalPetitions.filter(p => {
                    const assignedId = typeof p.can_bo_thu_ly === 'object' && p.can_bo_thu_ly !== null ? p.can_bo_thu_ly.id : p.can_bo_thu_ly;
                    return String(assignedId) === String(loggedInUser.id);
                });
            }

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

    // Logic lọc danh sách đơn thư dựa trên từ khóa tìm kiếm, trạng thái, người thụ lý và ngày tháng
    const filteredPetitions = useMemo(() => {
        const q = searchQuery.toLowerCase();
        return petitions.filter(p => {
            const matchSearch = (p.information_nguoiguidon || '').toLowerCase().includes(q) 
                || (p.id?.toString() || '').includes(q) 
                || (p.tieu_de || '').toLowerCase().includes(q)
                || (p.phan_loai || '').toLowerCase().includes(q)
                || (p.noi_dung_don || '').toLowerCase().includes(q);
            const matchStatus = statusFilter === 'All' || p.trang_thai === statusFilter;
            
            let pAssignedId = p.can_bo_thu_ly;
            if (typeof pAssignedId === 'object' && pAssignedId !== null) pAssignedId = String(pAssignedId.id || '');
            else pAssignedId = String(pAssignedId || '');
            const matchAssignee = assigneeFilter === 'All' || pAssignedId === assigneeFilter;
            
            const objDate = p.ngay_tiep_nhan ? p.ngay_tiep_nhan.split('T')[0] : '';
            const matchFrom = !dateFrom || objDate >= dateFrom;
            const matchTo   = !dateTo   || objDate <= dateTo;
            return matchSearch && matchStatus && matchAssignee && matchFrom && matchTo;
        }).sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
    }, [petitions, searchQuery, statusFilter, assigneeFilter, dateFrom, dateTo]);

    useEffect(() => { setCurrentPage(1); }, [searchQuery, statusFilter, assigneeFilter, dateFrom, dateTo]);

    const totalPages = Math.max(1, Math.ceil(filteredPetitions.length / pageSize));
    const paginatedPetitions = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return filteredPetitions.slice(start, start + pageSize);
    }, [filteredPetitions, currentPage, pageSize]);

    // Tính toán số liệu thống kê tổng quát (tổng đơn, đang xử lý, quá hạn, hoàn thành)
    const stats = useMemo(() => {
        const s = { total: petitions.length, 'Chờ xử lý': 0, 'Đang xử lý': 0, 'Đã giải quyết': 0, 'Từ chối': 0, overdue: 0 };
        petitions.forEach(p => { 
            const statusStr = p.trang_thai || 'Chờ xử lý';
            s[statusStr] = (s[statusStr] || 0) + 1; 
            if (checkIfOverdue(p.han_xu_ly, statusStr)) s.overdue++; 
        });
        return s;
    }, [petitions]);

    // Chuẩn bị dữ liệu cho biểu đồ thống kê theo tháng
    const monthData = useMemo(() => {
        const currentMonth = new Date().getMonth() + 1;
        const data = [];
        for (let i = 6; i >= 0; i--) {
            let m = currentMonth - i;
            if (m <= 0) m += 12;
            data.push({ month: `T${m}`, monthNum: m, value: 0 });
        }
        petitions.forEach(p => {
            if (!p.ngay_tiep_nhan) return;
            const m = new Date(p.ngay_tiep_nhan).getMonth() + 1;
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
            // Nếu là user thường, tự động đặt can_bo_thu_ly là chính user đang đăng nhập
            const defaultAssignee = currentUser && currentUser.role === 'user' ? currentUser.id : '';
            setCurrentPetition({
                tieu_de: '',
                phan_loai: 'Khiếu nại',
                nguon_tin: '',
                information_nguoiguidon: '',
                noi_dung_don: '',
                can_bo_thu_ly: defaultAssignee,
                ket_qua_xu_ly: '',
                kho_khan: '',
                ngay_tiep_nhan: today,
                han_xu_ly: '',
                trang_thai: 'Chờ xử lý',
                can_bo_huong_dan: ''
            });
        }
        setIsModalOpen(true);
    };
    
    const closeModal = () => { setIsModalOpen(false); setCurrentPetition(null); };
    
    // Xử lý lưu đơn thư (thêm mới hoặc cập nhật thông tin)
    const handleSave = async (e) => { 
        e.preventDefault(); 

        setIsSaving(true);
        
        try {
            const payload = {
                tieu_de: currentPetition.tieu_de,
                phan_loai: currentPetition.phan_loai,
                nguon_tin: currentPetition.nguon_tin,
                information_nguoiguidon: currentPetition.information_nguoiguidon,
                noi_dung_don: currentPetition.noi_dung_don,
                can_bo_thu_ly: currentPetition.can_bo_thu_ly ? String(currentPetition.can_bo_thu_ly) : null,
                ket_qua_xu_ly: currentPetition.ket_qua_xu_ly || '',
                kho_khan: currentPetition.kho_khan || '',
                ngay_tiep_nhan: currentPetition.ngay_tiep_nhan || today,
                trang_thai: currentPetition.trang_thai || 'Chờ xử lý',
                can_bo_huong_dan: currentPetition.can_bo_huong_dan || null,
            };

            if (modalMode === 'add') { 
                await donthuApi.createDonThu(payload);
                await fetchData(); 
                showToast('Thêm mới đơn thư thành công!');
            } else { 
                await donthuApi.updateDonThu(currentPetition.id, payload);
                await fetchData();
                showToast('Cập nhật đơn thư thành công!');
            }
            closeModal();
        } catch (error) {
            console.error('Lỗi khi lưu:', error);
            showToast('Có lỗi xảy ra khi lưu thông tin.', 'error');
        } finally {
            setIsSaving(false);
        }
    };
    
    // Xử lý xóa đơn thư
    const handleDelete = async () => { 
        if (!deletingPetition) return;
        try {
            await donthuApi.deleteDonThu(deletingPetition.id);
            setPetitions(petitions.filter(p => p.id !== deletingPetition.id)); 
            showToast('Đã xóa đơn thư!');
        } catch (error) {
            console.error('Lỗi xóa:', error);
            showToast('Không thể xóa. Thử lại sau.', 'error');
        } finally {
            setIsDeleteModalOpen(false);
            setDeletingPetition(null);
        }
    };
    
    const hasActiveFilter = searchQuery || statusFilter !== 'All' || assigneeFilter !== 'All' || dateFrom || dateTo;

    // Logic in danh sách đơn thư ra bản cứng
    const handlePrint = () => {
        const content = printRef.current.innerHTML;
        const win = window.open('', '_blank', 'width=900,height=700');
        win.document.write(`<html><head><title>Danh sách Đơn thư</title><style>body{font-family:'Times New Roman',serif;color:#1e293b;margin:20mm 15mm}h1{text-align:center;font-size:16pt;margin-bottom:4px}.subtitle{text-align:center;font-size:10pt;color:#64748b;margin-bottom:16px}.filter-info{font-size:9pt;color:#475569;margin-bottom:12px;padding:6px 10px;border:1px solid #e2e8f0;border-radius:4px;background:#f8fafc}.stats-row{display:flex;gap:8px;margin-bottom:16px}.stat-box{flex:1;border:1px solid #e2e8f0;border-radius:6px;padding:8px;text-align:center}.stat-num{font-size:18pt;font-weight:800}.stat-label{font-size:8pt;color:#64748b}table{width:100%;border-collapse:collapse;font-size:10pt}th{background:#f1f5f9;border:1px solid #cbd5e1;padding:7px 10px;font-weight:700;text-align:left}td{border:1px solid #e2e8f0;padding:6px 10px;vertical-align:top}tr:nth-child(even) td{background:#f8fafc}.overdue{color:#dc2626;font-weight:600}.footer{margin-top:20px;font-size:9pt;color:#64748b;text-align:right}</style></head><body>${content}</body></html>`);
        win.document.close();
        setTimeout(() => { win.focus(); win.print(); }, 500);
    };

    const getUserName = (assignedToValue) => {
        if (!assignedToValue) return null;
        let idToCheck = assignedToValue;
        if (typeof assignedToValue === 'object' && assignedToValue !== null) {
            idToCheck = assignedToValue.id;
        }
        const user = users.find(u => String(u.id) === String(idToCheck));
        if (!user) return `ID: ${idToCheck}`;
        
        let userName = user.name;
        if (user.don_vi) {
            const donvi = donviList.find(d => String(d.id) === String(user.don_vi));
            if (donvi) {
                userName += ` - ${donvi.ten_don_vi || donvi.name}`;
            }
        }
        return userName;
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '---';
        if (dateStr.includes('/')) return dateStr;
        try {
            const dStr = dateStr.replace(' ', 'T');
            const dateObj = new Date(dStr);
            if (!isNaN(dateObj.getTime())) {
                const day = String(dateObj.getDate()).padStart(2, '0');
                const month = String(dateObj.getMonth() + 1).padStart(2, '0');
                const year = dateObj.getFullYear();
                return `${day}/${month}/${year}`;
            }
        } catch(e) {}
        const cleanDate = dateStr.split('T')[0].split(' ')[0];
        const parts = cleanDate.split('-');
        if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
        return dateStr;
    };

    const inputCls = "w-full py-2.5 bg-slate-50/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all disabled:bg-slate-100/50 dark:disabled:bg-slate-800/60 disabled:text-slate-500 disabled:cursor-not-allowed";

    return (
        <div className="flex flex-col gap-5 w-full pb-10">
            {/* Phần tiêu đề và các nút thao tác chính (Thống kê, In, Thêm mới) */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                    <h1 className="text-2xl font-semibold text-slate-800 dark:text-white flex items-center gap-2">
                        <FileText size={24} className="text-blue-500" /> Quản lý Đơn thư
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Theo dõi, phân công và xử lý các loại đơn thư từ người dân</p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                    <button onClick={() => setShowStats(v => !v)} className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-all border ${showStats ? 'bg-indigo-600 text-white border-indigo-600 shadow' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-400'}`}>
                        <BarChart2 size={17} /> Thống kê
                    </button>
                    {/* <button onClick={handlePrint} className="flex items-center gap-2 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-500 px-4 py-2.5 rounded-lg font-medium text-sm transition-colors">
                        <Printer size={17} /> In danh sách
                    </button> */}
                    <button onClick={() => openModal('add')} className="flex items-center gap-2 bg-blue-600 text-white hover:bg-blue-700 px-4 py-2.5 rounded-lg font-medium text-sm shadow-sm transition-colors">
                        <Plus size={17} /> Tiếp nhận đơn mới
                    </button>
                </div>
            </div>

            {/* Hàng thẻ thống kê tóm tắt nhanh */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                    { label: 'Tổng đơn thư',  value: stats.total,                     icon: Database,      color: 'text-blue-600 dark:text-blue-400',    bg: 'bg-blue-50 dark:bg-blue-900/30',    border: 'border-blue-100 dark:border-blue-800' },
                    { label: 'Đang xử lý',     value: stats['Chờ xử lý']+stats['Đang xử lý'],  icon: Clock,         color: 'text-amber-600 dark:text-amber-400',  bg: 'bg-amber-50 dark:bg-amber-900/30',  border: 'border-amber-100 dark:border-amber-800' },
                    { label: 'Cần chú ý',      value: stats.overdue,                   icon: AlertTriangle, color: 'text-rose-600 dark:text-rose-400',    bg: 'bg-rose-50 dark:bg-rose-900/30',    border: 'border-rose-100 dark:border-rose-800', highlight: stats.overdue > 0 },
                    { label: 'Đã hoàn thành',  value: stats['Đã giải quyết'],                  icon: CheckCircle2,  color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/30', border: 'border-emerald-100 dark:border-emerald-800' },
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

            {/* Phần hiển thị chi tiết biểu đồ và tỉ lệ trạng thái (nếu bật chế độ thống kê) */}
            {showStats && (
                <div className="bg-white dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-5 grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div>
                        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-5 flex items-center gap-2">
                            <TrendingUp size={16} className="text-indigo-500" /> Tiếp nhận / 7 tháng
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
                            <BarChart2 size={16} className="text-indigo-500" /> Trạng thái hồ sơ
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

            {/* Thanh công cụ tìm kiếm và lọc dữ liệu nâng cao */}
            <div className="bg-white dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-4">
                <div className="flex flex-col xl:flex-row gap-3 items-start xl:items-center">
                    <div className="relative flex-1 min-w-0 w-full">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
                        <input type="text" placeholder="Tìm theo ID, tiêu đề, người gửi, nội dung, loại..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 transition-colors" />
                    </div>
                    <div className="flex flex-wrap gap-2 items-center w-full xl:w-auto">
                        <div className="relative">
                            <Filter size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                                className="pl-8 pr-8 py-2.5 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 appearance-none cursor-pointer">
                                <option value="All">Tất cả trạng thái</option>
                                {Object.values(STATUS_CONFIG).map(s => <option key={s.label} value={s.label}>{s.label}</option>)}
                            </select>
                        </div>
                        
                        {(!currentUser || currentUser.role !== 'user') && (
                            <div className="relative">
                                <User size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                <select value={assigneeFilter} onChange={e => setAssigneeFilter(e.target.value)}
                                    className="pl-8 pr-8 py-2.5 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 appearance-none cursor-pointer">
                                    <option value="All">Tất cả cán bộ</option>
                                    <option value="">Chưa phân công</option>
                                    {users.map(u => <option key={u.id} value={String(u.id)}>{u.name || `User ${u.id}`}</option>)}
                                </select>
                            </div>
                        )}

                        <div className="flex items-center gap-1.5 px-3 py-2.5 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-600 rounded-lg text-sm">
                            <Calendar size={13} className="text-slate-400 flex-shrink-0" />
                            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} title="Từ ngày tiếp nhận"
                                className="bg-transparent outline-none text-slate-600 dark:text-slate-300 text-sm w-[120px] cursor-pointer" />
                            <span className="text-slate-300 dark:text-slate-600">—</span>
                            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} title="Đến ngày tiếp nhận"
                                className="bg-transparent outline-none text-slate-600 dark:text-slate-300 text-sm w-[120px] cursor-pointer" />
                        </div>
                        {hasActiveFilter && (
                            <button onClick={() => { setSearchQuery(''); setStatusFilter('All'); setAssigneeFilter('All'); setDateFrom(''); setDateTo(''); }}
                                className="flex items-center gap-1.5 px-3 py-2.5 text-sm text-slate-500 dark:text-slate-400 hover:text-rose-500 border border-slate-200 dark:border-slate-600 hover:border-rose-200 dark:hover:border-rose-700 bg-white dark:bg-slate-800 rounded-lg transition-colors">
                                <RefreshCw size={13} /> Xóa lọc
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {isLoading ? (
                <div className="flex flex-col items-center justify-center h-64 text-slate-500 bg-white dark:bg-slate-800/80 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                    <RefreshCw className="animate-spin mb-3 text-blue-500" size={32} />
                    <p className="text-sm font-medium">Đang tải dữ liệu...</p>
                </div>
            ) : (
                <div className="bg-white dark:bg-slate-800/80 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col overflow-hidden">
                    {/* Bảng hiển thị danh sách đơn thư đã qua bộ lọc và phân trang */}
                    <div className="overflow-x-auto overflow-y-auto max-h-[480px]">
                        <table className="w-full min-w-[1050px] text-left">
                            <thead className="sticky top-0 z-10">
                                <tr className="bg-slate-50 dark:bg-slate-700/80 border-b border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wide">
                                    <th className="py-3.5 px-5 whitespace-nowrap">Mã Đơn</th>
                                    <th className="py-3.5 px-5 w-[140px]">Thông tin loại</th>
                                    <th className="py-3.5 px-5 min-w-[160px]">Người gửi & Nguồn</th>
                                    <th className="py-3.5 px-5 min-w-[220px]">Tiêu đề & Nội Dung</th>
                                    <th className="py-3.5 px-5 w-[140px]">Phân công</th>
                                    <th className="py-3.5 px-5 w-[160px]">Trạng Thái & Kết quả</th>
                                    <th className="py-3.5 px-5 text-right w-[110px]">Thao Tác</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                {paginatedPetitions.map(petition => {
                                    const isOverdue = checkIfOverdue(petition.han_xu_ly, petition.trang_thai);
                                    const cfg = STATUS_CONFIG[petition.trang_thai] || STATUS_CONFIG['Chờ xử lý'];
                                    const assignedName = getUserName(petition.can_bo_thu_ly);
                                    const instructorName = getUserName(petition.can_bo_huong_dan);
                                    const isMovedToSource = petition.ket_qua_xu_ly === 'Đưa vào nguồn tin';
                                    
                                    return (
                                        <tr key={petition.id} className={`transition-colors group hover:bg-slate-50/80 dark:hover:bg-slate-700/40 ${isOverdue && !isMovedToSource ? 'bg-rose-50/40 dark:bg-rose-900/10' : ''} ${isMovedToSource ? 'opacity-60 bg-slate-100/50 dark:bg-slate-800/50 line-through grayscale' : ''}`}>
                                            <td className="py-4 px-5 whitespace-nowrap">
                                                <div className="flex items-center gap-1.5">
                                                    {isOverdue && <div className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-pulse flex-shrink-0" />}
                                                    <span className="text-sm font-mono font-medium text-slate-700 dark:text-slate-300">DT-{petition.id}</span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-5">
                                                <div className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate">{petition.phan_loai || 'Chưa rõ'}</div>
                                                <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5" title="Ngày tiếp nhận">
                                                    <Calendar size={11} /> Nhận: {formatDate(petition.ngay_tiep_nhan)}
                                                </div>
                                                {petition.han_xu_ly && (
                                                    <div className={`text-xs flex items-center gap-1 mt-0.5 ${isOverdue ? 'text-rose-500 font-semibold' : 'text-amber-600 dark:text-amber-500'}`} title="Hạn xử lý">
                                                        <Clock size={11} /> Hạn: {formatDate(petition.han_xu_ly)}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="py-4 px-5">
                                                <div className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate" title={petition.information_nguoiguidon}>{petition.information_nguoiguidon}</div>
                                                <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5" title="Nguồn tin">
                                                    <Globe size={11} /> {petition.nguon_tin || 'Trực tiếp'}
                                                </div>
                                            </td>
                                            <td className="py-4 px-5">
                                                <div 
                                                    onClick={() => openModal('view', petition)}
                                                    className="flex flex-col gap-1.5 max-w-[280px] bg-slate-50/50 dark:bg-slate-900/30 p-2.5 rounded-lg border border-slate-100/50 dark:border-slate-700/30 shadow-inner cursor-pointer hover:border-blue-300 dark:hover:border-blue-700 transition-all group/content"
                                                >
                                                    <div className="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-0.5 line-clamp-1 group-hover/content:text-blue-600 dark:group-hover/content:text-blue-400 transition-colors" title={petition.tieu_de}>
                                                        {petition.tieu_de || '---'}
                                                    </div>
                                                    <div className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 italic" title={petition.noi_dung_don}>
                                                        "{petition.noi_dung_don}"
                                                    </div>
                                                    {isOverdue && <span className="mt-1 w-max text-rose-600 dark:text-rose-400 bg-rose-100 dark:bg-rose-900/40 px-1.5 py-0.5 rounded text-[10px] font-semibold inline-block">Quá hạn xử lý</span>}
                                                </div>
                                            </td>
                                            <td className="py-4 px-5">
                                                <div className="flex flex-col gap-1.5">
                                                    <div className="flex items-center gap-1.5 text-sm" title="Người phân công">
                                                        <User size={13} className="text-blue-500 flex-shrink-0" />
                                                        <span className={`truncate ${assignedName ? 'text-slate-700 dark:text-slate-300' : 'text-slate-400 italic'}`}>
                                                            {assignedName || 'Chưa phân công'}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5 text-sm" title="Người hướng dẫn">
                                                        <UserCheck size={13} className="text-emerald-500 flex-shrink-0" />
                                                        <span className={`truncate ${instructorName ? 'text-slate-700 dark:text-slate-300' : 'text-slate-400 italic'}`}>
                                                            {instructorName || 'Chưa HD'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-4 px-5">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border ${cfg.badge} mb-1.5`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`}></span>
                                                    {cfg.label}
                                                </span>
                                                {petition.ket_qua_xu_ly && (
                                                    <div className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 bg-slate-50 dark:bg-slate-900/50 p-1.5 rounded border border-slate-100 dark:border-slate-700 mb-1" title={petition.ket_qua_xu_ly}>
                                                        <span className="font-semibold text-slate-600 dark:text-slate-300">KQ: </span>{petition.ket_qua_xu_ly}
                                                    </div>
                                                )}
                                                {petition.kho_khan && (
                                                    <div className="text-xs text-amber-600 dark:text-amber-400 line-clamp-2 bg-amber-50/50 dark:bg-amber-900/20 p-1.5 rounded border border-amber-100/50 dark:border-amber-800/30" title={petition.kho_khan}>
                                                        <span className="font-semibold">KK: </span>{petition.kho_khan}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="py-4 px-5 text-right whitespace-nowrap">
                                                <div className="flex items-center justify-end gap-1 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => openModal('view', petition)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/40 rounded-md transition-colors" title="Xem"><Eye size={15} /></button>
                                                    {!isMovedToSource && (
                                                        <>
                                                            <button onClick={() => openModal('edit', petition)} className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/40 rounded-md transition-colors" title="Sửa"><Edit3 size={15} /></button>
                                                            {(!currentUser || currentUser.role !== 'user') && (
                                                                <button onClick={() => { setDeletingPetition(petition); setIsDeleteModalOpen(true); }} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/40 rounded-md transition-colors" title="Xóa"><Trash2 size={15} /></button>
                                                            )}
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {filteredPetitions.length === 0 && (
                                    <tr>
                                        <td colSpan="7" className="py-16 text-center text-slate-400 dark:text-slate-500">
                                            <Inbox size={38} className="mx-auto mb-3 text-slate-300 dark:text-slate-600" strokeWidth={1.5} />
                                            <p className="text-sm font-medium">Không tìm thấy đơn thư</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    {filteredPetitions.length > 0 && (
                        <Pagination 
                            currentPage={currentPage} totalPages={totalPages} pageSize={pageSize} pageSizeOptions={[5, 10, 20]} 
                            onPageChange={setCurrentPage} onPageSizeChange={s => { setPageSize(s); setCurrentPage(1); }} 
                            totalItems={filteredPetitions.length}
                        />
                    )}
                </div>
            )}

            <div ref={printRef} style={{ display: 'none' }}>
                <h1>DANH SÁCH ĐƠN THƯ</h1>
                <p className="subtitle">Ngày in: {new Date().toLocaleDateString('vi-VN')} — Hệ thống quản lý</p>
                <div className="filter-info">Bộ lọc: {statusFilter}{dateFrom ? ` | Từ: ${dateFrom}` : ''}{dateTo ? ` | Đến: ${dateTo}` : ''}</div>
                <table>
                    <thead><tr><th>Mã</th><th>Tiêu đề</th><th>Phân loại</th><th>Người gửi</th><th>Nội dung</th><th>Kết quả xử lý</th><th>Khó khăn</th><th>Tiếp nhận</th><th>Hạn XL</th><th>Trạng thái</th></tr></thead>
                    <tbody>
                        {filteredPetitions.map(p => (
                            <tr key={p.id}>
                                <td>DT-{p.id}</td><td>{p.tieu_de}</td><td>{p.phan_loai}</td><td>{p.information_nguoiguidon}</td><td>{p.noi_dung_don}</td><td>{p.ket_qua_xu_ly}</td><td>{p.kho_khan}</td>
                                <td>{formatDate(p.ngay_tiep_nhan)}</td><td>{formatDate(p.han_xu_ly)}</td><td>{p.trang_thai}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Modal Biểu mẫu (Thêm/Sửa/Xem chi tiết) */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-[2px]" onClick={closeModal}>
                    <div className="bg-white dark:bg-slate-800 rounded-xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-700 flex-shrink-0">
                            <h2 className="text-base font-semibold text-slate-800 dark:text-white flex items-center gap-2">
                                {modalMode === 'add' ? <Plus className="text-blue-500" size={18}/> : modalMode === 'edit' ? <Edit3 className="text-amber-500" size={18}/> : <Eye className="text-slate-500" size={18}/>}
                                {modalMode === 'add' ? 'Tiếp nhận đơn' : modalMode === 'edit' ? 'Cập nhật đơn' : 'Chi tiết đơn'}
                            </h2>
                            <button onClick={closeModal} className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"><X size={18} /></button>
                        </div>
                        <div className="p-5 md:p-6 overflow-y-auto flex-1 custom-scrollbar">
                            <form id="petitionForm" onSubmit={handleSave} className="space-y-5">
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1">Tiêu đề đơn thư <span className="text-rose-500">*</span></label>
                                    <div className="relative">
                                        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"><Type size={16} /></div>
                                        <input type="text" required disabled={modalMode === 'view'} value={currentPetition?.tieu_de || ''} onChange={e => setCurrentPetition({...currentPetition, tieu_de: e.target.value})} className={`${inputCls} pl-10`} placeholder="Tiêu đề tóm tắt vụ việc..." />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div className="space-y-1.5 md:col-span-2">
                                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1">Ngày tiếp nhận <span className="text-rose-500">*</span></label>
                                        <div className="relative">
                                            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"><Calendar size={16} /></div>
                                            <input type="date" required disabled={modalMode === 'view'} value={currentPetition?.ngay_tiep_nhan ? currentPetition.ngay_tiep_nhan.split('T')[0].split(' ')[0] : ''} onChange={e => { setCurrentPetition({...currentPetition, ngay_tiep_nhan: e.target.value}); }} className={`${inputCls} pl-10`} />
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1">Phân loại <span className="text-rose-500">*</span></label>
                                        <div className="relative">
                                            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"><Tag size={16} /></div>
                                            <select disabled={modalMode === 'view'} value={currentPetition?.phan_loai || 'Khiếu nại'} onChange={e => setCurrentPetition({...currentPetition, phan_loai: e.target.value})} className={`${inputCls} pl-10 appearance-none cursor-pointer`}>
                                                <option value="Khiếu nại">Khiếu nại</option>
                                                <option value="Tố cáo">Tố cáo</option>
                                                <option value="Kiến nghị">Kiến nghị</option>
                                                <option value="Phản ánh">Phản ánh</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1">Nguồn tin</label>
                                        <div className="relative">
                                            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"><Globe size={16} /></div>
                                            <input type="text" disabled={modalMode === 'view'} value={currentPetition?.nguon_tin || ''} onChange={e => setCurrentPetition({...currentPetition, nguon_tin: e.target.value})} className={`${inputCls} pl-10`} placeholder="Trực tiếp, Bưu điện, Cổng TTĐT..." />
                                        </div>
                                    </div>
                                    <div className="space-y-1.5 md:col-span-2">
                                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1">Thông tin người gửi <span className="text-rose-500">*</span></label>
                                        <div className="relative">
                                            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"><User size={16} /></div>
                                            <input type="text" required disabled={modalMode === 'view'} value={currentPetition?.information_nguoiguidon || ''} onChange={e => setCurrentPetition({...currentPetition, information_nguoiguidon: e.target.value})} className={`${inputCls} pl-10`} placeholder="Họ tên, SĐT, Địa chỉ người gửi đơn..." />
                                        </div>
                                    </div>
                                    <div className="space-y-1.5 md:col-span-1">
                                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1">Cán bộ thụ lý</label>
                                        <div className="relative">
                                            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"><User size={16} /></div>
                                            {currentUser && currentUser.role === 'user' ? (
                                                <input
                                                    type="text"
                                                    disabled
                                                    value={users.find(u => String(u.id) === String(currentUser.id))?.name || currentUser.name || `User ${currentUser.id}`}
                                                    className={`${inputCls} pl-10`}
                                                />
                                            ) : (
                                                <select disabled={modalMode === 'view'} value={(typeof currentPetition?.can_bo_thu_ly === 'object' ? currentPetition?.can_bo_thu_ly?.id : currentPetition?.can_bo_thu_ly) || ''} onChange={e => setCurrentPetition({...currentPetition, can_bo_thu_ly: e.target.value})} className={`${inputCls} pl-10 appearance-none cursor-pointer`}>
                                                    <option value="">-- Chưa được phân công --</option>
                                                    {users.map(u => <option key={u.id} value={u.id}>{u.name || `User ${u.id}`}</option>)}
                                                </select>
                                            )}
                                        </div>
                                    </div>
                                    <div className="space-y-1.5 md:col-span-1">
                                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1">Người hướng dẫn</label>
                                        <div className="relative">
                                            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"><User size={16} /></div>
                                            <select disabled={modalMode === 'view'} value={(typeof currentPetition?.can_bo_huong_dan === 'object' ? currentPetition?.can_bo_huong_dan?.id : currentPetition?.can_bo_huong_dan) || ''} onChange={e => setCurrentPetition({...currentPetition, can_bo_huong_dan: e.target.value})} className={`${inputCls} pl-10 appearance-none cursor-pointer`}>
                                                <option value="">-- Chưa có hướng dẫn --</option>
                                                {users.map(u => <option key={u.id} value={u.id}>{u.name || `User ${u.id}`}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                    <div className="space-y-1.5 md:col-span-2">
                                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1">Trạng thái <span className="text-rose-500">*</span></label>
                                        <div className="relative">
                                            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"><AlertTriangle size={16} /></div>
                                            <select disabled={modalMode === 'view'} value={currentPetition?.trang_thai || 'Chờ xử lý'} onChange={e => setCurrentPetition({...currentPetition, trang_thai: e.target.value})} className={`${inputCls} pl-10 appearance-none cursor-pointer w-full md:w-1/2`}>
                                                {Object.values(STATUS_CONFIG).map(s => <option key={s.label} value={s.label}>{s.label}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2 mb-1">
                                        <MessageSquare size={15} className="text-slate-400"/> Nội dung chi tiết <span className="text-rose-500">*</span>
                                    </label>
                                    <textarea required disabled={modalMode === 'view'} value={currentPetition?.noi_dung_don || ''} onChange={e => setCurrentPetition({...currentPetition, noi_dung_don: e.target.value})} className={`${inputCls} resize-none h-24 leading-relaxed`} placeholder="Nội dung chính..." />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2 mb-1">
                                        <ClipboardList size={15} className="text-emerald-500"/> Kết quả xử lý
                                    </label>
                                    <select 
                                        disabled={modalMode === 'view'} 
                                        value={currentPetition?.ket_qua_xu_ly || ''} 
                                        onChange={e => setCurrentPetition({...currentPetition, ket_qua_xu_ly: e.target.value})} 
                                        className={`${inputCls} appearance-none cursor-pointer bg-emerald-50/30 dark:bg-emerald-900/10 border-emerald-200/60 dark:border-emerald-800/50 focus:border-emerald-500 focus:ring-emerald-500/20`}
                                    >
                                        <option value="">-- Chọn kết quả --</option>
                                        <option value="Thông báo trả lời">Thông báo trả lời</option>
                                        <option value="Đưa vào nguồn tin">Đưa vào nguồn tin</option>
                                        <option value="chuyển đơn vị khác">chuyển đơn vị khác</option>
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2 mb-1">
                                        <AlertTriangle size={15} className="text-amber-500"/> Khó khăn
                                    </label>
                                    <textarea 
                                        disabled={modalMode === 'view'} 
                                        value={currentPetition?.kho_khan || ''} 
                                        onChange={e => setCurrentPetition({...currentPetition, kho_khan: e.target.value})} 
                                        className={`${inputCls} resize-none h-20 bg-amber-50/30 dark:bg-amber-900/10 border-amber-200/60 dark:border-amber-800/50 focus:border-amber-500 focus:ring-amber-500/20`} 
                                        placeholder="Những khó khăn, vướng mắc trong quá trình xử lý..." 
                                    />
                                </div>
                            </form>
                        </div>
                        <div className="p-4 md:px-6 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-3 bg-slate-50/80 dark:bg-slate-800/80 rounded-b-xl flex-shrink-0">
                            <button onClick={closeModal} disabled={isSaving} className="px-5 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-600 hover:text-slate-800 transition-all disabled:opacity-50 shadow-sm">{modalMode === 'view' ? 'Đóng lại' : 'Hủy bỏ'}</button>
                            {modalMode !== 'view' && (
                                <button form="petitionForm" type="submit" disabled={isSaving} className="px-5 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-lg shadow-sm transition-all flex items-center gap-2">
                                    {isSaving ? <RefreshCw size={16} className="animate-spin" /> : <PenTool size={16} />}
                                    {modalMode === 'add' ? 'Lưu đơn' : 'Cập nhật'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Xác nhận xóa */}
            {isDeleteModalOpen && deletingPetition && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-[2px]" onClick={() => setIsDeleteModalOpen(false)}>
                    <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
                        <div className="p-7 text-center">
                            <div className="w-16 h-16 rounded-full bg-rose-50 dark:bg-rose-900/30 flex items-center justify-center mx-auto mb-4 shadow-inner">
                                <AlertTriangle size={30} className="text-rose-500" />
                            </div>
                            <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-2">Xác nhận xóa đơn thư</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Hành động này không thể hoàn tác.</p>
                        </div>
                        <div className="px-6 py-4 flex justify-center gap-3 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-100 dark:border-slate-700">
                            <button onClick={() => setIsDeleteModalOpen(false)} className="px-5 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg">Hủy</button>
                            <button onClick={handleDelete} className="px-5 py-2.5 text-sm font-medium text-white bg-rose-600 hover:bg-rose-700 rounded-lg cursor-pointer">Xóa</button>
                        </div>
                    </div>
                </div>
            )}

            {toast && (
                <div className={`fixed top-6 right-6 z-[200] flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-lg border animate-in slide-in-from-top-4 duration-300 ${toast.type === 'error' ? 'bg-rose-50 border-rose-200 text-rose-700' : 'bg-emerald-50 border-emerald-200 text-emerald-700'}`}>
                    {toast.type === 'error' ? <AlertTriangle size={18} /> : <CheckCircle2 size={18} />}
                    <span className="text-sm font-medium">{toast.message}</span>
                </div>
            )}
        </div>
    );
}
