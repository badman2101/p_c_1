import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
    Plus, Search, Edit3, Trash2, Eye, X, Filter,
    CheckCircle2, Clock, Inbox, Calendar, FileText, RefreshCw,
    User, UserCheck, MessageSquare, ClipboardList, Database, LayoutGrid, List, AlertTriangle, Users, BookOpen
} from 'lucide-react';

import { Pagination } from '../user/page';
import { vuanApi } from '../../api/vuanApi';
import { userApi } from '../../api/userApi';
import { donviApi } from '../../api/donviApi';

export default function VuanPage() {
    const today = new Date().toISOString().split('T')[0];

    const [cases, setCases] = useState([]);
    const [users, setUsers] = useState([]);
    const [donviList, setDonviList] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState(null);
    
    // Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [investigatorFilter, setInvestigatorFilter] = useState('All');
    const [resultFilter, setResultFilter] = useState('All');
    const [viewMode, setViewMode] = useState('table'); // 'table' or 'grid'
    
    // Modal
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState('add');
    const [currentCase, setCurrentCase] = useState(null);
    const [isSaving, setIsSaving] = useState(false);

    // Delete Modal
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [deletingCase, setDeletingCase] = useState(null);

    // Toast
    const [toast, setToast] = useState(null);
    const showToast = (message, type = 'success') => { 
        setToast({ message, type }); 
        setTimeout(() => setToast(null), 3000); 
    };

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [totalItems, setTotalItems] = useState(0);

    const fetchCases = async (loggedInUser) => {
        try {
            setIsLoading(true);
            const response = await vuanApi.getVuans();
            let data = [];
            if (response?.data && Array.isArray(response.data)) data = response.data;
            else if (Array.isArray(response)) data = response;
            else if (response?.vuans) data = response.vuans;

            // Phân quyền: user thường chỉ xem vụ án được giao cho mình
            const user = loggedInUser ?? currentUser;
            if (user && user.role !== 'admin' && user.role !== 'super_admin') {
                data = data.filter(item => {
                    const thuLyId = typeof item.can_bo_thu_ly === 'object' && item.can_bo_thu_ly !== null
                        ? item.can_bo_thu_ly.id
                        : item.can_bo_thu_ly;
                    const huongDanId = typeof item.can_bo_huong_dan === 'object' && item.can_bo_huong_dan !== null
                        ? item.can_bo_huong_dan.id
                        : item.can_bo_huong_dan;
                    return String(thuLyId) === String(user.id) || String(huongDanId) === String(user.id);
                });
            }

            setCases(data);
        } catch (error) {
            console.error('Lỗi khi tải dữ liệu vụ án:', error);
            showToast('Không thể tải dữ liệu vụ án.', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const fetchUsersAndDonvi = async () => {
        try {
            // Lấy thông tin user đang đăng nhập từ localStorage
            const token = localStorage.getItem('token');
            let loggedInUser = null;
            if (token) {
                try {
                    loggedInUser = JSON.parse(token);
                    setCurrentUser(loggedInUser);
                } catch (e) {
                    console.error('Lỗi parse token', e);
                }
            }

            const [userData, donviData] = await Promise.all([
                userApi.getUsers(),
                donviApi.getDonvi()
            ]);
            let finalUsers = [];
            if (Array.isArray(userData)) finalUsers = userData;
            else if (Array.isArray(userData?.data)) finalUsers = userData.data;
            else if (Array.isArray(userData?.users)) finalUsers = userData.users;
            setUsers(finalUsers);

            let finalDonvi = [];
            if (Array.isArray(donviData)) finalDonvi = donviData;
            else if (Array.isArray(donviData?.data)) finalDonvi = donviData.data;
            setDonviList(finalDonvi);

            // Fetch cases sau khi có thông tin user để áp dụng phân quyền đúng
            await fetchCases(loggedInUser);
        } catch (error) {
            console.error('Lỗi khi tải người dùng/đơn vị:', error);
        }
    };

    useEffect(() => {
        fetchUsersAndDonvi();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Filtered and paginated cases
    const filteredCases = useMemo(() => {
        const q = searchQuery.toLowerCase();
        let filtered = cases.filter(item => {
            const matchSearch = item.id?.toString().includes(q) || 
                                (item.noi_dung && item.noi_dung.toLowerCase().includes(q)) ||
                                (item.thong_tin_bi_can && item.thong_tin_bi_can.toLowerCase().includes(q));
            
            let matchInvestigator = true;
            if (investigatorFilter !== 'All') {
                const isInvestigatorMatch = String(item.can_bo_thu_ly) === String(investigatorFilter);
                const isGuideMatch = String(item.can_bo_huong_dan) === String(investigatorFilter);
                matchInvestigator = isInvestigatorMatch || isGuideMatch;
            }
            
            let matchResult = true;
            if (resultFilter !== 'All') matchResult = item.ket_qua === resultFilter;
            
            const itemDate = item.ngay_khoi_to ? item.ngay_khoi_to.split('T')[0].split(' ')[0] : '';
            const matchFrom = !dateFrom || itemDate >= dateFrom;
            const matchTo = !dateTo || itemDate <= dateTo;
            
            return matchSearch && matchInvestigator && matchResult && matchFrom && matchTo;
        });

        return filtered.sort((a, b) => new Date(b.ngay_khoi_to || 0) - new Date(a.ngay_khoi_to || 0));
    }, [cases, searchQuery, investigatorFilter, resultFilter, dateFrom, dateTo]);

    useEffect(() => {
        setCurrentPage(1);
    }, [filteredCases.length]);

    const totalPages = Math.max(1, Math.ceil(filteredCases.length / pageSize));

    const handleResetFilters = () => {
        setSearchQuery('');
        setDateFrom('');
        setDateTo('');
        setInvestigatorFilter('All');
        setResultFilter('All');
    };
    
    const hasActiveFilter = searchQuery !== '' || investigatorFilter !== 'All' || resultFilter !== 'All' || dateFrom !== '' || dateTo !== '';

    const paginatedCases = useMemo(() => {
        const startIndex = (currentPage - 1) * pageSize;
        return filteredCases.slice(startIndex, startIndex + pageSize);
    }, [filteredCases, currentPage, pageSize]);

    const openModal = (mode, caseItem = null) => {
        setModalMode(mode);
        if (caseItem) {
            setCurrentCase({ ...caseItem });
        } else {
            // Nếu là user thường, tự động đặt can_bo_thu_ly là chính user đang đăng nhập
            const defaultAssignee = currentUser && currentUser.role !== 'admin' && currentUser.role !== 'super_admin'
                ? currentUser.id
                : '';
            setCurrentCase({
                ngay_khoi_to: today,
                noi_dung: '',
                so_luong_bi_can: '',
                thong_tin_bi_can: '',
                bien_phap_ngan_chan: '',
                can_bo_thu_ly: defaultAssignee,
                can_bo_huong_dan: '',
                ket_qua: '',
                kho_khan: ''
            });
        }
        setIsModalOpen(true);
    };
    
    const closeModal = () => { 
        setIsModalOpen(false); 
        setCurrentCase(null); 
    };
    
    const handleSave = async (e) => { 
        e.preventDefault(); 
        setIsSaving(true);
        
        try {
            const payload = {
                ngay_khoi_to: currentCase.ngay_khoi_to,
                noi_dung: currentCase.noi_dung,
                so_luong_bi_can: currentCase.so_luong_bi_can,
                thong_tin_bi_can: currentCase.thong_tin_bi_can,
                bien_phap_ngan_chan: currentCase.bien_phap_ngan_chan || '',
                can_bo_thu_ly: currentCase.can_bo_thu_ly ? String(currentCase.can_bo_thu_ly) : null,
                can_bo_huong_dan: currentCase.can_bo_huong_dan,
                ket_qua: currentCase.ket_qua,
                kho_khan: currentCase.kho_khan,
            };

            if (modalMode === 'add') { 
                await vuanApi.createVuan(payload);
                showToast('Thêm vụ án thành công!');
            } else {
                await vuanApi.updateVuan(currentCase.id, payload);
                showToast('Cập nhật vụ án thành công!');
            }
            fetchCases();
            closeModal();
        } catch (error) {
            console.error('Lỗi lưu:', error);
            showToast('Đã xảy ra lỗi khi lưu thông tin.', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        try {
            await vuanApi.deleteVuan(deletingCase.id);
            showToast('Đã xóa vụ án!');
            fetchCases();
        } catch (error) {
            console.error('Lỗi xóa:', error);
            showToast('Không thể xóa vụ án.', 'error');
        } finally {
            setIsDeleteModalOpen(false);
            setDeletingCase(null);
        }
    };

    const inputCls = "w-full py-2.5 px-4 bg-slate-50/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all disabled:bg-slate-100/50 dark:disabled:bg-slate-800/60 disabled:text-slate-500 disabled:cursor-not-allowed";

    const statsConfig = useMemo(() => [
        { label: 'Tổng Vụ Án', value: cases.length, icon: Database, color: 'blue' },
        { label: 'Đã ra Khởi tố', value: cases.filter(c => c.ket_qua === 'Khởi tố').length, icon: CheckCircle2, color: 'emerald' },
        { label: 'Mới nhận hôm nay', value: cases.filter(c => c.ngay_khoi_to && c.ngay_khoi_to.includes(today)).length, icon: Clock, color: 'amber' },
        { label: 'Chờ xử lý', value: cases.filter(c => !c.ket_qua || c.ket_qua.trim() === '').length, icon: Inbox, color: 'slate' },
    ], [cases, today]);

    const getInvestigatorName = (idOrName) => {
        if (!idOrName) return '---';
        const user = users.find(u => String(u.id) === String(idOrName) || u.name === idOrName);
        if (!user) return idOrName;
        
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

    const renderResultBadge = (result) => {
        if (!result || result.trim() === '') return null;
        
        const colors = {
            'Khởi tố': 'bg-rose-50 text-rose-700 border-rose-100 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-800/50',
            'Không khởi tố': 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800/50',
            'Đình chỉ': 'bg-slate-50 text-slate-700 border-slate-100 dark:bg-slate-900/30 dark:text-slate-400 dark:border-slate-800/50',
            'Tạm đình chỉ': 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800/50',
            'Chuyển cơ quan khác': 'bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800/50',
        };

        const defaultColor = 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-600';
        return (
            <span className={`inline-flex items-center px-2.5 py-1 text-xs font-bold rounded-lg border ${colors[result] || defaultColor}`}>
                {result}
            </span>
        );
    };

    // User Selection Options
    const userOptions = users.map(user => {
        let userName = user.name;
        if (user.don_vi) {
            const donvi = donviList.find(d => String(d.id) === String(user.don_vi));
            if (donvi) {
                userName += ` - ${donvi.ten_don_vi || donvi.name}`;
            }
        }
        return { value: user.id, label: userName };
    });



    return (
        <div className="flex flex-col gap-6 w-full pb-10">
            {/* Header & Stats */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-800 dark:text-white capitalize tracking-tight flex items-center gap-2">
                        Quản lý Vụ án
                    </h1>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
                        Quản lý chi tiết hồ sơ các vụ án đang xử lý
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={() => fetchCases()} className="p-2 text-slate-500 hover:text-blue-600 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:shadow-sm transition-all focus:ring-2 focus:ring-blue-100">
                        <RefreshCw size={18} className={isLoading ? "animate-spin" : ""} />
                    </button>
                    <div className="flex items-center gap-1 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-1 shadow-sm">
                        <button onClick={() => setViewMode('table')} className={`p-1.5 rounded-lg transition-all ${viewMode === 'table' ? 'bg-blue-50 dark:bg-blue-900/40 text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}><List size={18} /></button>
                        <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-blue-50 dark:bg-blue-900/40 text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}><LayoutGrid size={18} /></button>
                    </div>
                    <button onClick={() => openModal('add')} className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl shadow-sm shadow-blue-500/30 flex items-center gap-2 font-semibold text-sm transition-all">
                        <Plus size={18} /> Thêm vụ án
                    </button>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {statsConfig.map((s, idx) => (
                    <div key={idx} className="bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-4 overflow-hidden relative group hover:shadow-md transition-all">
                        <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-xl bg-${s.color}-50 dark:bg-${s.color}-900/30 text-${s.color}-600 dark:text-${s.color}-400`}>
                                <s.icon size={24} />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{s.label}</p>
                                <p className="text-2xl font-black text-slate-800 dark:text-white mt-1">{s.value}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Filters and Search */}
            <div className="bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-4">
                <div className="flex flex-col lg:flex-row gap-4 items-center">
                    <div className="relative flex-1 w-full">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input 
                            type="text" 
                            placeholder="Tìm kiếm id, nội dung, thông tin bị can..." 
                            value={searchQuery} 
                            onChange={e => setSearchQuery(e.target.value)}
                            className="w-full pl-11 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 transition-all font-medium" 
                        />
                    </div>
                    <div className="flex flex-wrap gap-2 items-center w-full lg:w-auto">
                        {(!currentUser || currentUser.role === 'admin' || currentUser.role === 'super_admin') && (
                            <div className="relative">
                                <Filter size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                <select 
                                    value={investigatorFilter} 
                                    onChange={e => setInvestigatorFilter(e.target.value)}
                                    className="pl-8 pr-8 py-2.5 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 rounded-xl text-sm focus:outline-none focus:border-blue-500 appearance-none cursor-pointer min-w-[150px]"
                                >
                                    <option value="All">Tất cả cán bộ</option>
                                    {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                                </select>
                            </div>
                        )}
                        <div className="relative">
                            <Filter size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                            <select 
                                value={resultFilter} 
                                onChange={e => setResultFilter(e.target.value)}
                                className="pl-8 pr-8 py-2.5 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 rounded-xl text-sm focus:outline-none focus:border-blue-500 appearance-none cursor-pointer min-w-[150px]"
                            >
                                <option value="All">Tất cả kết quả</option>
                                <option value="Khởi tố">Khởi tố</option>
                                <option value="Không khởi tố">Không khởi tố</option>
                                <option value="Đình chỉ">Đình chỉ</option>
                                <option value="Tạm đình chỉ">Tạm đình chỉ</option>
                                <option value="Chuyển cơ quan khác">Chuyển cơ quan khác</option>
                            </select>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-600 rounded-xl text-sm">
                            <Calendar size={16} className="text-slate-400" />
                            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="bg-transparent outline-none text-slate-600 dark:text-slate-300 text-xs w-[110px]" />
                            <span className="text-slate-300">|</span>
                            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="bg-transparent outline-none text-slate-600 dark:text-slate-300 text-xs w-[110px]" />
                        </div>
                        <button 
                            onClick={handleResetFilters}
                            className="p-2.5 text-slate-500 dark:text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl border border-slate-200 dark:border-slate-700 transition-all"
                            title="Xóa bộ lọc"
                        >
                            <RefreshCw size={18} />
                        </button>
                    </div>
                </div>
            </div>

            {/* List & Pagination */}
            {isLoading ? (
                <div className="flex flex-col items-center justify-center h-64 text-slate-500 bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                    <RefreshCw className="animate-spin mb-4 text-blue-500" size={36} />
                    <p className="text-sm font-semibold tracking-tight">Đang tải dữ liệu vụ án...</p>
                </div>
            ) : (
                <div className="flex flex-col gap-6">
                    {viewMode === 'table' ? (
                        <div className="bg-white dark:bg-slate-800/80 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[1300px] text-left">
                                    <thead>
                                        <tr className="bg-slate-50 dark:bg-slate-700/80 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 text-[11px] font-black uppercase tracking-wider">
                                            <th className="py-4 px-6 w-16 text-center">ID</th>
                                            <th className="py-4 px-6 w-32">Ngày Khởi Tố</th>
                                            <th className="py-4 px-6 w-80">Nội Dung</th>
                                            <th className="py-4 px-6 w-48">Thông Tin Bị Can</th>
                                            <th className="py-4 px-6 w-48">Ngăn Chặn</th>
                                            <th className="py-4 px-6 w-48">Khó Khăn</th>
                                            <th className="py-4 px-6">Phụ Trách</th>
                                            <th className="py-4 px-6 w-36">Kết Quả</th>
                                            <th className="py-4 px-6 text-right w-24">Thao Tác</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                        {paginatedCases.map(item => (
                                            <tr key={item.id} className="hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-colors group">
                                                <td className="py-4 px-6 text-center">
                                                    <span className="text-xs font-mono font-bold text-slate-400 dark:text-slate-500">#{item.id}</span>
                                                </td>
                                                <td className="py-4 px-6">
                                                    <div className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-200">
                                                        <Calendar size={14} className="text-blue-500" />
                                                        {formatDate(item.ngay_khoi_to)}
                                                    </div>
                                                </td>
                                                <td className="py-4 px-6">
                                                    <div 
                                                        onClick={() => openModal('view', item)}
                                                        className="flex flex-col gap-1.5 max-w-[320px] bg-slate-50/50 dark:bg-slate-900/30 p-3 rounded-xl border border-slate-100/50 dark:border-slate-700/30 shadow-inner cursor-pointer hover:border-blue-300 dark:hover:border-blue-700 transition-all group/content"
                                                    >
                                                        <div className="flex items-center gap-2 text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest opacity-80 group-hover/content:text-blue-500">
                                                            <MessageSquare size={10} /> Nội dung vụ án
                                                        </div>
                                                        <p className="text-sm text-slate-700 dark:text-slate-200 line-clamp-2 leading-relaxed font-semibold italic" title={item.noi_dung}>
                                                            "{item.noi_dung || 'Chưa nội dung...'}"
                                                        </p>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-6">
                                                    <div className="flex flex-col gap-1">
                                                        <div className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5"><Users size={12}/> {item.so_luong_bi_can || 0} Đối tượng</div>
                                                        <div className="text-sm font-semibold text-slate-800 dark:text-slate-100 line-clamp-1">{item.thong_tin_bi_can || 'Trống'}</div>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-6">
                                                    <div className="text-sm text-slate-700 dark:text-slate-200 line-clamp-2" title={item.bien_phap_ngan_chan}>
                                                        {item.bien_phap_ngan_chan || '--'}
                                                    </div>
                                                </td>
                                                <td className="py-4 px-6">
                                                    <div className="text-sm text-slate-700 dark:text-slate-200 line-clamp-2" title={item.kho_khan}>
                                                        {item.kho_khan || '--'}
                                                    </div>
                                                </td>
                                                <td className="py-4 px-6">
                                                    <div className="flex flex-col gap-2">
                                                        <div className="flex items-center gap-2" title="Cán bộ thụ lý">
                                                            <div className="w-6 h-6 rounded-full bg-blue-50 dark:bg-blue-900/40 flex items-center justify-center text-blue-600 dark:text-blue-400 flex-shrink-0">
                                                                <User size={12} />
                                                            </div>
                                                            <span className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">{getInvestigatorName(item.can_bo_thu_ly) || 'Chưa phân công'}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2" title="Người hướng dẫn">
                                                            <div className="w-6 h-6 rounded-full bg-emerald-50 dark:bg-emerald-900/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400 flex-shrink-0">
                                                                <UserCheck size={12} />
                                                            </div>
                                                            <span className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">{getInvestigatorName(item.can_bo_huong_dan) || 'Chưa HD'}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-6">
                                                    {renderResultBadge(item.ket_qua)}
                                                </td>
                                                <td className="py-4 px-6 text-right whitespace-nowrap">
                                                    <div className="flex items-center justify-end gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-all duration-300 transform md:translate-x-2 md:group-hover:translate-x-0">
                                                        <button onClick={() => openModal('view', item)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/40 rounded-lg transition-colors"><Eye size={17} /></button>
                                                        <button onClick={() => openModal('edit', item)} className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/40 rounded-lg transition-colors"><Edit3 size={17} /></button>
                                                        {(!currentUser || currentUser.role === 'admin' || currentUser.role === 'super_admin') && (
                                                            <button onClick={() => { setDeletingCase(item); setIsDeleteModalOpen(true); }} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/40 rounded-lg transition-colors"><Trash2 size={17} /></button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                        {paginatedCases.length === 0 && (
                                            <tr>
                                                <td colSpan="7" className="py-20 text-center">
                                                    <Inbox size={48} className="mx-auto mb-4 text-slate-200 dark:text-slate-700" />
                                                    <p className="text-slate-400 font-medium tracking-tight">Không tìm thấy dữ liệu vụ án phù hợp</p>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                            {paginatedCases.map(item => (
                                <div key={item.id} className="bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 flex flex-col gap-4 group hover:shadow-lg hover:border-blue-200 dark:hover:border-blue-900/50 transition-all relative overflow-hidden">
                                    {renderResultBadge(item.ket_qua) && (
                                        <div className="absolute top-4 right-4">
                                            {renderResultBadge(item.ket_qua)}
                                        </div>
                                    )}
                                    
                                    <div className="flex items-center gap-3 pr-24">
                                        <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs flex-shrink-0">
                                            #{item.id}
                                        </div>
                                        <div className="flex flex-col gap-0.5 min-w-0">
                                            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 flex items-center gap-1 uppercase tracking-wider">
                                                <Calendar size={12} /> Khởi tố: {formatDate(item.ngay_khoi_to)}
                                            </span>
                                            <span className="text-sm font-bold text-slate-700 dark:text-slate-200 truncate" title={`Phân công: ${getInvestigatorName(item.can_bo_thu_ly)}`}>
                                                <User size={13} className="inline mr-1 text-blue-500" />{getInvestigatorName(item.can_bo_thu_ly)}
                                            </span>
                                        </div>
                                    </div>
                                    
                                    <div 
                                        onClick={() => openModal('view', item)}
                                        className="space-y-3 flex-1 bg-gradient-to-br from-blue-50/30 to-slate-50/30 dark:from-blue-900/10 dark:to-slate-900/10 p-5 rounded-2xl border border-blue-100/30 dark:border-blue-800/20 mt-1 shadow-inner group-hover:border-blue-400/30 transition-all cursor-pointer hover:shadow-md"
                                    >
                                        <div className="flex items-center gap-2 text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest opacity-80">
                                            <BookOpen size={12} className="animate-pulse" /> Nội dung vụ án
                                        </div>
                                        <p className="text-sm text-slate-700 dark:text-slate-100 leading-relaxed line-clamp-3 font-bold italic tracking-tight">
                                            "{item.noi_dung}"
                                        </p>
                                    </div>
                                    
                                    {(item.bien_phap_ngan_chan || item.kho_khan) && (
                                        <div className="flex flex-col gap-2 mt-2">
                                            {item.bien_phap_ngan_chan && (
                                                <div className="text-[11px] text-violet-600 dark:text-violet-400 bg-violet-50/50 dark:bg-violet-900/20 p-2 rounded-lg border border-violet-100/50 dark:border-violet-800/30">
                                                    <span className="font-bold uppercase tracking-wider block mb-0.5">Biện pháp ngăn chặn:</span>
                                                    <span className="line-clamp-2" title={item.bien_phap_ngan_chan}>{item.bien_phap_ngan_chan}</span>
                                                </div>
                                            )}
                                            {item.kho_khan && (
                                                <div className="text-[11px] text-amber-600 dark:text-amber-400 bg-amber-50/50 dark:bg-amber-900/20 p-2 rounded-lg border border-amber-100/50 dark:border-amber-800/30">
                                                    <span className="font-bold uppercase tracking-wider block mb-0.5">Khó khăn:</span>
                                                    <span className="line-clamp-2" title={item.kho_khan}>{item.kho_khan}</span>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                    
                                    <div className="pt-4 mt-auto border-t border-slate-100 dark:border-slate-700/50 flex justify-between items-center gap-2">
                                        <div className="text-xs font-bold text-slate-400">
                                            <span className="text-rose-500 mr-1">{item.so_luong_bi_can || 0}</span> Bị can
                                        </div>
                                        <div className="flex justify-end gap-1">
                                            <button onClick={() => openModal('view', item)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/40 rounded-xl transition-all"><Eye size={18} /></button>
                                            <button onClick={() => openModal('edit', item)} className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/40 rounded-xl transition-all"><Edit3 size={18} /></button>
                                            {(!currentUser || currentUser.role === 'admin' || currentUser.role === 'super_admin') && (
                                                <button onClick={() => { setDeletingCase(item); setIsDeleteModalOpen(true); }} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/40 rounded-xl transition-all"><Trash2 size={18} /></button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {paginatedCases.length === 0 && (
                                <div className="col-span-full bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 py-20 text-center">
                                    <Inbox size={48} className="mx-auto mb-4 text-slate-200 dark:text-slate-700" />
                                    <p className="text-slate-400 font-medium tracking-tight">Không tìm thấy dữ liệu phân công phù hợp</p>
                                </div>
                            )}
                        </div>
                    )}
                    
                    {filteredCases.length > 0 && (
                        <Pagination 
                            currentPage={currentPage} 
                            totalPages={totalPages} 
                            pageSize={pageSize} 
                            pageSizeOptions={[5, 10, 20]} 
                            onPageChange={setCurrentPage} 
                            onPageSizeChange={s => { setPageSize(s); setCurrentPage(1); }} 
                            totalItems={filteredCases.length}
                        />
                    )}
                </div>
            )}

            {/* Modal Biểu mẫu (Thêm/Sửa/Xem chi tiết) */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-[4px] animate-in fade-in duration-300" onClick={closeModal}>
                    <div className="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden transform animate-in slide-in-from-bottom-8 duration-500" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-700 flex-shrink-0">
                            <div className="flex items-center gap-4">
                                <div className={`p-3 rounded-2xl ${modalMode === 'add' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : modalMode === 'edit' ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/30' : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300'}`}>
                                    {modalMode === 'add' ? <Plus size={20}/> : modalMode === 'edit' ? <Edit3 size={20}/> : <Eye size={20}/>}
                                </div>
                                <div>
                                    <h2 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight">
                                        {modalMode === 'add' ? 'Thêm mới vụ án' : modalMode === 'edit' ? 'Cập nhật vụ án' : 'Chi tiết vụ án'}
                                    </h2>
                                </div>
                            </div>
                            <button onClick={closeModal} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/50 rounded-xl transition-all"><X size={20} /></button>
                        </div>
                        <div className="p-6 md:p-8 overflow-y-auto flex-1 custom-scrollbar">
                            <form id="caseForm" onSubmit={handleSave} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest pl-1">Ngày khởi tố <span className="text-rose-500">*</span></label>
                                        <div className="relative">
                                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"><Calendar size={18} /></div>
                                            <input type="date" required disabled={modalMode === 'view'} value={currentCase?.ngay_khoi_to ? currentCase.ngay_khoi_to.split('T')[0].split(' ')[0] : ''} onChange={e => setCurrentCase({...currentCase, ngay_khoi_to: e.target.value})} className={`${inputCls} pl-12`} />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest pl-1">Kết quả</label>
                                        <select 
                                            disabled={modalMode === 'view'} 
                                            value={currentCase?.ket_qua || ''} 
                                            onChange={e => setCurrentCase({...currentCase, ket_qua: e.target.value})} 
                                            className={`${inputCls} appearance-none cursor-pointer font-semibold bg-blue-50/50 dark:bg-blue-900/10 focus:border-blue-500 focus:ring-blue-500/20`}
                                        >
                                            <option value="">-- Chọn kết quả --</option>
                                            <option value="Khởi tố">Khởi tố</option>
                                            <option value="Không khởi tố">Không khởi tố</option>
                                            <option value="Đình chỉ">Đình chỉ</option>
                                            <option value="Tạm đình chỉ">Tạm đình chỉ</option>
                                            <option value="Chuyển cơ quan khác">Chuyển cơ quan khác</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest pl-1">Cán bộ thụ lý</label>
                                        <div className="relative">
                                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"><User size={18} /></div>
                                            {currentUser && currentUser.role !== 'admin' && currentUser.role !== 'super_admin' ? (
                                                <input
                                                    type="text"
                                                    disabled
                                                    value={users.find(u => String(u.id) === String(currentUser.id))?.name || currentUser.name || `User ${currentUser.id}`}
                                                    className={`${inputCls} pl-12`}
                                                />
                                            ) : (
                                                <select
                                                    disabled={modalMode === 'view'}
                                                    value={String(typeof currentCase?.can_bo_thu_ly === 'object' ? currentCase?.can_bo_thu_ly?.id ?? '' : currentCase?.can_bo_thu_ly ?? '')}
                                                    onChange={e => setCurrentCase({...currentCase, can_bo_thu_ly: e.target.value})}
                                                    className={`${inputCls} pl-12 appearance-none cursor-pointer`}
                                                >
                                                    <option value="">-- Chọn cán bộ thụ lý --</option>
                                                    {users.map(u => (
                                                        <option key={u.id} value={u.id}>
                                                            {u.name}{donviList.find(d => String(d.id) === String(u.don_vi)) ? ` - ${donviList.find(d => String(d.id) === String(u.don_vi))?.ten_don_vi || donviList.find(d => String(d.id) === String(u.don_vi))?.name}` : ''}
                                                        </option>
                                                    ))}
                                                </select>
                                            )}
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest pl-1">Người hướng dẫn</label>
                                        <div className="relative">
                                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"><UserCheck size={18} /></div>
                                            <select
                                                disabled={modalMode === 'view'}
                                                value={String(typeof currentCase?.can_bo_huong_dan === 'object' ? currentCase?.can_bo_huong_dan?.id ?? '' : currentCase?.can_bo_huong_dan ?? '')}
                                                onChange={e => setCurrentCase({...currentCase, can_bo_huong_dan: e.target.value})}
                                                className={`${inputCls} pl-12 appearance-none cursor-pointer`}
                                            >
                                                <option value="">-- Chọn người hướng dẫn --</option>
                                                {users.map(u => (
                                                    <option key={u.id} value={u.id}>
                                                        {u.name}{donviList.find(d => String(d.id) === String(u.don_vi)) ? ` - ${donviList.find(d => String(d.id) === String(u.don_vi))?.ten_don_vi || donviList.find(d => String(d.id) === String(u.don_vi))?.name}` : ''}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                    <div className="space-y-2 md:col-span-2">
                                        <label className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest pl-1 flex items-center gap-2">
                                            <MessageSquare size={14} className="text-blue-500"/> Nội dung vụ án <span className="text-rose-500">*</span>
                                        </label>
                                        {modalMode === 'view' ? (
                                            <div className="p-6 bg-blue-50/30 dark:bg-blue-900/10 border-2 border-blue-100 dark:border-blue-900/30 rounded-2xl shadow-inner">
                                                <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700 dark:text-slate-300 font-medium">
                                                    {currentCase?.noi_dung || '--'}
                                                </p>
                                            </div>
                                        ) : (
                                            <textarea required value={currentCase?.noi_dung || ''} onChange={e => setCurrentCase({...currentCase, noi_dung: e.target.value})} className={`${inputCls} resize-none h-28 leading-relaxed font-medium rounded-2xl bg-blue-50/30 dark:bg-blue-900/10 border-blue-200/60 dark:border-blue-800/50`} placeholder="Mô tả nội dung vụ án..." />
                                        )}
                                    </div>
                                    
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest pl-1">
                                            Số lượng bị can
                                        </label>
                                        <div className="relative">
                                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"><Users size={18} /></div>
                                            <input type="number" min="0" disabled={modalMode === 'view'} value={currentCase?.so_luong_bi_can || ''} onChange={e => setCurrentCase({...currentCase, so_luong_bi_can: e.target.value})} className={`${inputCls} pl-12 font-bold`} placeholder="Số lượng..." />
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-2 md:col-span-2">
                                        <label className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest pl-1 flex items-center gap-2">
                                            Thông tin bị can
                                        </label>
                                        {modalMode === 'view' ? (
                                            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl">
                                                <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                                                    {currentCase?.thong_tin_bi_can || '--'}
                                                </p>
                                            </div>
                                        ) : (
                                            <textarea disabled={modalMode === 'view'} value={currentCase?.thong_tin_bi_can || ''} onChange={e => setCurrentCase({...currentCase, thong_tin_bi_can: e.target.value})} className={`${inputCls} resize-none h-24`} placeholder="Tên, tuổi, địa chỉ, quê quán..." />
                                        )}
                                    </div>
                                    <div className="space-y-2 md:col-span-2">
                                        <label className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest pl-1 flex items-center gap-2">
                                            <ClipboardList size={14} className="text-violet-500"/> Biện pháp ngăn chặn ngay sau thông tin bị can
                                        </label>
                                        {modalMode === 'view' ? (
                                            <div className="p-4 bg-violet-50/50 dark:bg-violet-900/20 border border-violet-100/60 dark:border-violet-800/30 rounded-xl">
                                                <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                                                    {currentCase?.bien_phap_ngan_chan || '--'}
                                                </p>
                                            </div>
                                        ) : (
                                            <textarea disabled={modalMode === 'view'} value={currentCase?.bien_phap_ngan_chan || ''} onChange={e => setCurrentCase({...currentCase, bien_phap_ngan_chan: e.target.value})} className={`${inputCls} resize-none h-24 bg-violet-50/30 dark:bg-violet-900/10 border-violet-200/60 dark:border-violet-800/50 focus:border-violet-500 focus:ring-violet-500/20`} placeholder="Mô tả biện pháp ngăn chặn được áp dụng..." />
                                        )}
                                    </div>
                                    <div className="space-y-2 md:col-span-2">
                                        <label className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest pl-1 flex items-center gap-2">
                                            <AlertTriangle size={14} className="text-amber-500"/> Khó khăn vướng mắc
                                        </label>
                                        {modalMode === 'view' ? (
                                            <div className="p-4 bg-amber-50/50 dark:bg-amber-900/20 border-2 border-amber-100/50 dark:border-amber-800/30 rounded-xl">
                                                <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                                                    {currentCase?.kho_khan || '--'}
                                                </p>
                                            </div>
                                        ) : (
                                            <textarea disabled={modalMode === 'view'} value={currentCase?.kho_khan || ''} onChange={e => setCurrentCase({...currentCase, kho_khan: e.target.value})} className={`${inputCls} resize-none h-20 bg-amber-50/30 dark:bg-amber-900/10 border-amber-200/60 dark:border-amber-800/50 focus:border-amber-500 focus:ring-amber-500/20`} placeholder="Ghi chú các khó khăn..." />
                                        )}
                                    </div>
                                </div>
                            </form>
                        </div>
                        {/* Footer Modal */}
                        <div className="p-6 md:px-8 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-3 bg-slate-50/80 dark:bg-slate-800/80 mt-auto">
                            <button onClick={closeModal} disabled={isSaving} className="px-6 py-2.5 text-sm font-bold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-600 hover:text-slate-800 transition-all disabled:opacity-50 shadow-sm">{modalMode === 'view' ? 'Đóng lại' : 'Hủy bỏ'}</button>
                            {modalMode !== 'view' && (
                                <button form="caseForm" type="submit" disabled={isSaving} className="px-6 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-xl shadow-sm shadow-blue-500/30 transition-all flex items-center gap-2">
                                    {isSaving ? <RefreshCw size={18} className="animate-spin" /> : <Edit3 size={18} />}
                                    {modalMode === 'add' ? 'Lưu vụ án' : 'Cập nhật'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Xóa */}
            {isDeleteModalOpen && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-[2px] animate-in fade-in" onClick={() => !isSaving && setIsDeleteModalOpen(false)}>
                    <div className="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-sm shadow-2xl p-6 md:p-8 text-center" onClick={e => e.stopPropagation()}>
                        <div className="w-16 h-16 bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-full flex items-center justify-center mx-auto mb-5 shadow-inner">
                            <Trash2 size={28} />
                        </div>
                        <h3 className="text-xl font-black text-slate-800 dark:text-white mb-2">Xác nhận xóa</h3>
                        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-8">
                            Bạn có chắc chắn muốn xóa vụ án <strong className="text-rose-600 dark:text-rose-400">#{deletingCase?.id}</strong>? Hành động này không thể hoàn tác.
                        </p>
                        <div className="flex gap-3">
                            <button onClick={() => setIsDeleteModalOpen(false)} disabled={isSaving} className="flex-1 py-3 text-sm font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-xl transition-all">Hủy</button>
                            <button onClick={handleDelete} disabled={isSaving} className="flex-1 py-3 text-sm font-bold text-white bg-rose-600 hover:bg-rose-700 active:bg-rose-800 rounded-xl shadow-sm shadow-rose-500/30 transition-all flex justify-center items-center gap-2">
                                {isSaving ? <RefreshCw size={18} className="animate-spin" /> : 'Xóa ngay'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2">
                {toast && (
                    <div className={`px-4 py-3 rounded-2xl shadow-xl flex items-center gap-3 animate-in slide-in-from-right-8 fade-in text-sm font-semibold border ${toast.type === 'error' ? 'bg-rose-50 border-rose-200 text-rose-700 dark:bg-rose-900/80 dark:border-rose-700 dark:text-rose-100' : 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-900/80 dark:border-emerald-700 dark:text-emerald-100'}`}>
                        {toast.type === 'error' ? <AlertTriangle size={18} /> : <CheckCircle2 size={18} />}
                        {toast.message}
                    </div>
                )}
            </div>
        </div>
    );
}
