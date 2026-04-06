import React, { useState, useEffect, useMemo } from 'react';
import {
    Plus, Search, Edit3, Trash2, Eye, X, Filter, AlertTriangle,
    CheckCircle2, Clock, Inbox, Calendar, FileText, RefreshCw,
    User, MessageSquare, ClipboardList, Database, LayoutGrid, List
} from 'lucide-react';
import { Pagination } from '../user/page';
import { assignmentApi } from '../../api/assignmentApi';
import { userApi } from '../../api/userApi';

export default function AssignmentsPage() {
    const today = new Date().toISOString().split('T')[0];

    const [assignments, setAssignments] = useState([]);
    const [users, setUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    
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
    const [currentAssignment, setCurrentAssignment] = useState(null);
    const [isSaving, setIsSaving] = useState(false);

    // Delete Modal
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [deletingAssignment, setDeletingAssignment] = useState(null);

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

    const fetchAssignments = async () => {
        try {
            setIsLoading(true);
            const response = await assignmentApi.getAssignments();
            
            // Handle different possible API response structures
            let data = [];
            let total = 0;
            
            if (response?.data && Array.isArray(response.data)) {
                data = response.data;
                total = response.total || response.data.length;
            } else if (Array.isArray(response)) {
                data = response;
                total = response.length;
            } else if (response?.assignments) {
                data = response.assignments;
                total = response.total || data.length;
            }
            
            setAssignments(data);
        } catch (error) {
            console.error('Lỗi khi tải dữ liệu phân công:', error);
            showToast('Không thể tải dữ liệu phân công.', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const fetchUsers = async () => {
        try {
            const data = await userApi.getUsers();
            let finalUsers = [];
            if (Array.isArray(data)) finalUsers = data;
            else if (Array.isArray(data?.data)) finalUsers = data.data;
            else if (Array.isArray(data?.users)) finalUsers = data.users;
            setUsers(finalUsers);
        } catch (error) {
            console.error('Lỗi khi tải người dùng:', error);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    useEffect(() => {
        fetchAssignments();
    }, []);

    // Filtered and paginated assignments
    const filteredAssignments = useMemo(() => {
        const q = searchQuery.toLowerCase();
        let filtered = assignments.filter(item => {
            const matchSearch = (item.noi_dung || '').toLowerCase().includes(q) 
                || (item.dieu_tra_vien || '').toLowerCase().includes(q)
                || (item.ket_qua || '').toLowerCase().includes(q);
            
            const matchInvestigator = investigatorFilter === 'All' || item.dieu_tra_vien === investigatorFilter;
            
            let matchResult = true;
            if (resultFilter === 'Empty') matchResult = !item.ket_qua || item.ket_qua.trim() === '';
            else if (resultFilter !== 'All') matchResult = item.ket_qua === resultFilter;
            
            const itemDate = item.ngay_phan_cong ? item.ngay_phan_cong.split('T')[0] : '';
            const matchFrom = !dateFrom || itemDate >= dateFrom;
            const matchTo = !dateTo || itemDate <= dateTo;
            
            return matchSearch && matchInvestigator && matchResult && matchFrom && matchTo;
        });

        // Sort by date descending
        return filtered.sort((a, b) => new Date(b.ngay_phan_cong) - new Date(a.ngay_phan_cong));
    }, [assignments, searchQuery, investigatorFilter, resultFilter, dateFrom, dateTo]);

    // Update total items when filtered data changes
    useEffect(() => {
        setTotalItems(filteredAssignments.length);
        setCurrentPage(1);
    }, [filteredAssignments.length]);

    // Currently displayed items (paginated)
    const paginatedAssignments = useMemo(() => {
        const startIndex = (currentPage - 1) * pageSize;
        return filteredAssignments.slice(startIndex, startIndex + pageSize);
    }, [filteredAssignments, currentPage, pageSize]);

    const openModal = (mode, assignment = null) => {
        setModalMode(mode);
        if (assignment) {
            setCurrentAssignment({ ...assignment });
        } else {
            setCurrentAssignment({
                ngay_phan_cong: today,
                noi_dung: '',
                dieu_tra_vien: '',
                ket_qua: ''
            });
        }
        setIsModalOpen(true);
    };
    
    const closeModal = () => { 
        setIsModalOpen(false); 
        setCurrentAssignment(null); 
    };
    
    const handleSave = async (e) => { 
        e.preventDefault(); 
        setIsSaving(true);
        
        try {
            const payload = {
                ngay_phan_cong: currentAssignment.ngay_phan_cong,
                noi_dung: currentAssignment.noi_dung,
                dieu_tra_vien: currentAssignment.dieu_tra_vien,
                ket_qua: currentAssignment.ket_qua,
            };

            if (modalMode === 'add') { 
                await assignmentApi.createAssignment(payload);
                showToast('Thêm mới phân công thành công!');
            } else { 
                await assignmentApi.updateAssignment(currentAssignment.id, payload);
                showToast('Cập nhật phân công thành công!');
            }
            fetchAssignments();
            closeModal();
        } catch (error) {
            console.error('Lỗi khi lưu:', error);
            showToast('Có lỗi xảy ra khi lưu thông tin.', 'error');
        } finally {
            setIsSaving(false);
        }
    };
    
    const handleDelete = async () => { 
        if (!deletingAssignment) return;
        try {
            await assignmentApi.deleteAssignment(deletingAssignment.id);
            showToast('Đã xóa phân công!');
            fetchAssignments();
        } catch (error) {
            console.error('Lỗi xóa:', error);
            showToast('Không thể xóa phân công.', 'error');
        } finally {
            setIsDeleteModalOpen(false);
            setDeletingAssignment(null);
        }
    };

    const inputCls = "w-full py-2.5 px-4 bg-slate-50/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all disabled:bg-slate-100/50 dark:disabled:bg-slate-800/60 disabled:text-slate-500 disabled:cursor-not-allowed";

    const stats = useMemo(() => {
        return {
            total: assignments.length,
            today: assignments.filter(a => a.ngay_phan_cong === today).length,
            completed: assignments.filter(a => a.ket_qua && a.ket_qua.trim() !== '').length
        };
    }, [assignments, today]);

    const getInvestigatorName = (idOrName) => {
        if (!idOrName) return '---';
        const user = users.find(u => String(u.id) === String(idOrName) || u.name === idOrName);
        return user ? user.name : idOrName;
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '---';
        const [year, month, day] = dateStr.split('-');
        return `${day}/${month}/${year}`;
    };

    const renderResultBadge = (result) => {
        if (!result || result.trim() === '') return null;
        
        const colors = {
            'Khởi tố': 'bg-rose-50 text-rose-700 border-rose-100 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-800/50',
            'Không khởi tố': 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800/50',
            'Tạm đình chỉ': 'bg-slate-50 text-slate-700 border-slate-100 dark:bg-slate-900/30 dark:text-slate-400 dark:border-slate-800/50',
        };

        const icons = {
            'Khởi tố': <AlertTriangle size={12} />,
            'Không khởi tố': <CheckCircle2 size={12} />,
            'Tạm đình chỉ': <Clock size={12} />,
        };

        const colorClass = colors[result] || 'bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800/50';
        const icon = icons[result] || <FileText size={12} />;

        return (
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold border ${colorClass}`}>
                {icon} {result}
            </span>
        );
    };

    return (
        <div className="flex flex-col gap-6 w-full pb-10 animate-in fade-in duration-500">
            {/* Header section */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
                        <div className="p-2 bg-blue-600 rounded-lg text-white">
                            <FileText size={24} />
                        </div>
                        Phân công điều tra
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Quản lý và theo dõi quá trình phân công cán bộ điều tra</p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="bg-white dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm flex">
                        <button onClick={() => setViewMode('table')} className={`p-1.5 rounded-md transition-all ${viewMode === 'table' ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400 shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}>
                            <List size={18} />
                        </button>
                        <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400 shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}>
                            <LayoutGrid size={18} />
                        </button>
                    </div>
                    <button onClick={() => openModal('add')} className="flex items-center gap-2 bg-blue-600 text-white hover:bg-blue-700 px-4 py-2.5 rounded-lg font-semibold text-sm shadow-md shadow-blue-500/20 transition-all active:scale-95">
                        <Plus size={18} /> Thêm phân công
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                    { label: 'Tổng số nhiệm vụ', value: stats.total, icon: Database, color: 'blue' },
                    { label: 'Phân công hôm nay', value: stats.today, icon: Calendar, color: 'indigo' },
                    { label: 'Đã hoàn thành', value: stats.completed, icon: CheckCircle2, color: 'emerald' },
                ].map((s, i) => (
                    <div key={i} className="bg-white dark:bg-slate-800/80 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all group overflow-hidden relative">
                        <div className={`absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform duration-500 text-slate-800 dark:text-white`}>
                            <s.icon size={100} />
                        </div>
                        <div className="flex items-center gap-4 relative z-10">
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
                            placeholder="Tìm kiếm nội dung, điều tra viên..." 
                            value={searchQuery} 
                            onChange={e => setSearchQuery(e.target.value)}
                            className="w-full pl-11 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 transition-all font-medium" 
                        />
                    </div>
                    <div className="flex flex-wrap gap-2 items-center w-full lg:w-auto">
                        <div className="relative">
                            <Filter size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                            <select 
                                value={investigatorFilter} 
                                onChange={e => setInvestigatorFilter(e.target.value)}
                                className="pl-8 pr-8 py-2.5 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 rounded-xl text-sm focus:outline-none focus:border-blue-500 appearance-none cursor-pointer min-w-[150px]"
                            >
                                <option value="All">Tất cả cán bộ</option>
                                {users.map(u => <option key={u.id} value={u.name}>{u.name}</option>)}
                            </select>
                        </div>
                        <div className="relative">
                            <Filter size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                            <select 
                                value={resultFilter} 
                                onChange={e => setResultFilter(e.target.value)}
                                className="pl-8 pr-8 py-2.5 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 rounded-xl text-sm focus:outline-none focus:border-blue-500 appearance-none cursor-pointer min-w-[150px]"
                            >
                                <option value="All">Tất cả kết quả</option>
                                <option value="Empty">Đang xử lý (Trống)</option>
                                <option value="Khởi tố">Khởi tố</option>
                                <option value="Không khởi tố">Không khởi tố</option>
                                <option value="Tạm đình chỉ">Tạm đình chỉ</option>
                            </select>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-600 rounded-xl text-sm">
                            <Calendar size={16} className="text-slate-400" />
                            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="bg-transparent outline-none text-slate-600 dark:text-slate-300 text-xs w-[110px]" />
                            <span className="text-slate-300">|</span>
                            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="bg-transparent outline-none text-slate-600 dark:text-slate-300 text-xs w-[110px]" />
                        </div>
                        <button 
                            onClick={() => { setSearchQuery(''); setDateFrom(''); setDateTo(''); setInvestigatorFilter('All'); setResultFilter('All'); }}
                            className="p-2.5 text-slate-500 dark:text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl border border-slate-200 dark:border-slate-700 transition-all"
                        >
                            <RefreshCw size={18} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Content Section */}
            {isLoading ? (
                <div className="flex flex-col items-center justify-center h-64 text-slate-500 bg-white dark:bg-slate-800/80 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
                    <div className="relative">
                        <div className="w-12 h-12 border-4 border-blue-100 dark:border-slate-700 rounded-full animate-spin border-t-blue-600"></div>
                    </div>
                    <p className="mt-4 text-sm font-bold tracking-wide uppercase text-slate-400">Đang đồng bộ dữ liệu...</p>
                </div>
            ) : (
                <>
                    {viewMode === 'table' ? (
                        <div className="bg-white dark:bg-slate-800/80 rounded-2xl shadow-md border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50/80 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-widest">
                                            <th className="py-4 px-6 w-20">ID</th>
                                            <th className="py-4 px-6">Ngày ra quyết định phân công</th>
                                            <th className="py-4 px-6 min-w-[250px]">Nội dung</th>
                                            <th className="py-4 px-6">Điều tra viên</th>
                                            <th className="py-4 px-6">Kết quả</th>
                                            <th className="py-4 px-6 text-right w-32">Thao tác</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                                        {paginatedAssignments.map(item => (
                                            <tr key={item.id} className="hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-colors group">
                                                <td className="py-4 px-6">
                                                    <span className="text-xs font-mono font-bold text-slate-400 dark:text-slate-500 text-badge">#{item.id}</span>
                                                </td>
                                                <td className="py-4 px-6">
                                                    <div className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                                                        <Calendar size={14} className="text-blue-500" />
                                                        {formatDate(item.ngay_phan_cong)}
                                                    </div>
                                                </td>
                                                <td className="py-4 px-6">
                                                    <div 
                                                        onClick={() => openModal('view', item)}
                                                        className="flex flex-col gap-1.5 max-w-[450px] bg-slate-50/50 dark:bg-slate-900/30 p-3 rounded-xl border border-slate-100/50 dark:border-slate-700/30 shadow-inner cursor-pointer hover:border-blue-300 dark:hover:border-blue-700 transition-all group/content"
                                                    >
                                                        <div className="flex items-center gap-2 text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest opacity-80 group-hover/content:text-blue-500">
                                                            <MessageSquare size={10} /> Nội dung
                                                        </div>
                                                        <p className="text-sm text-slate-700 dark:text-slate-200 line-clamp-3 leading-relaxed font-semibold italic" title={item.noi_dung}>
                                                            "{item.noi_dung}"
                                                        </p>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-6">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300">
                                                            <User size={14} />
                                                        </div>
                                                        <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">{getInvestigatorName(item.dieu_tra_vien)}</span>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-6">
                                                    {renderResultBadge(item.ket_qua)}
                                                </td>
                                                <td className="py-4 px-6 text-right whitespace-nowrap">
                                                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
                                                        <button onClick={() => openModal('view', item)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/40 rounded-lg transition-colors"><Eye size={17} /></button>
                                                        <button onClick={() => openModal('edit', item)} className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/40 rounded-lg transition-colors"><Edit3 size={17} /></button>
                                                        <button onClick={() => { setDeletingAssignment(item); setIsDeleteModalOpen(true); }} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/40 rounded-lg transition-colors"><Trash2 size={17} /></button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                        {paginatedAssignments.length === 0 && (
                                            <tr>
                                                <td colSpan="6" className="py-20 text-center">
                                                    <Inbox size={48} className="mx-auto mb-4 text-slate-200 dark:text-slate-700" />
                                                    <p className="text-slate-400 font-medium tracking-tight">Không tìm thấy dữ liệu phân công phù hợp</p>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                            {paginatedAssignments.map(item => (
                                <div key={item.id} className="bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 flex flex-col gap-4 group hover:shadow-lg hover:border-blue-200 dark:hover:border-blue-900/50 transition-all relative overflow-hidden">
                                    {renderResultBadge(item.ket_qua) && (
                                        <div className="absolute top-3 right-3">
                                            {renderResultBadge(item.ket_qua)}
                                        </div>
                                    )}
                                    
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs">
                                            #{item.id}
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 flex items-center gap-1 uppercase tracking-wider">
                                                <Calendar size={12} /> {formatDate(item.ngay_phan_cong)}
                                            </span>
                                            <span className="text-sm font-bold text-slate-700 dark:text-slate-200 mt-0.5">{getInvestigatorName(item.dieu_tra_vien)}</span>
                                        </div>
                                    </div>
                                    
                                    <div 
                                        onClick={() => openModal('view', item)}
                                        className="space-y-3 flex-1 bg-gradient-to-br from-blue-50/30 to-slate-50/30 dark:from-blue-900/10 dark:to-slate-900/10 p-5 rounded-2xl border border-blue-100/30 dark:border-blue-800/20 mt-1 shadow-inner group-hover:border-blue-400/30 transition-all cursor-pointer hover:shadow-md"
                                    >
                                        <div className="flex items-center gap-2 text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest opacity-80">
                                            <MessageSquare size={12} className="animate-pulse" /> Nhiệm vụ được giao
                                        </div>
                                        <p className="text-sm text-slate-700 dark:text-slate-100 leading-relaxed line-clamp-5 font-bold italic tracking-tight">
                                            "{item.noi_dung}"
                                        </p>
                                    </div>
                                    
                                    <div className="pt-4 mt-auto border-t border-slate-100 dark:border-slate-700/50 flex justify-end gap-2">
                                        <button onClick={() => openModal('view', item)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/40 rounded-xl transition-all"><Eye size={18} /></button>
                                        <button onClick={() => openModal('edit', item)} className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/40 rounded-xl transition-all"><Edit3 size={18} /></button>
                                        <button onClick={() => { setDeletingAssignment(item); setIsDeleteModalOpen(true); }} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/40 rounded-xl transition-all"><Trash2 size={18} /></button>
                                    </div>
                                </div>
                            ))}
                            {paginatedAssignments.length === 0 && (
                                <div className="col-span-full bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 py-20 text-center">
                                    <Inbox size={48} className="mx-auto mb-4 text-slate-200 dark:text-slate-700" />
                                    <p className="text-slate-400 font-medium tracking-tight">Không tìm thấy dữ liệu phân công phù hợp</p>
                                </div>
                            )}
                        </div>
                    )}
                    
                    {totalItems > 0 && (
                        <div className="mt-4">
                            <Pagination 
                                currentPage={currentPage} 
                                totalPages={Math.ceil(totalItems / pageSize)} 
                                pageSize={pageSize} 
                                pageSizeOptions={[10, 20, 50, 100]} 
                                onPageChange={setCurrentPage} 
                                onPageSizeChange={s => { setPageSize(s); setCurrentPage(1); }} 
                                totalItems={totalItems}
                            />
                        </div>
                    )}
                </>
            )}

            {/* Modal Biểu mẫu */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-[4px] animate-in fade-in duration-300" onClick={closeModal}>
                    <div className="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden transform animate-in slide-in-from-bottom-8 duration-500" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-700 flex-shrink-0">
                            <div className="flex items-center gap-4">
                                <div className={`p-3 rounded-2xl ${modalMode === 'add' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : modalMode === 'edit' ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/30' : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300'}`}>
                                    {modalMode === 'add' ? <Plus size={20}/> : modalMode === 'edit' ? <Edit3 size={20}/> : <Eye size={20}/>}
                                </div>
                                <div>
                                    <h2 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight">
                                        {modalMode === 'add' ? 'Thêm mới phân công' : modalMode === 'edit' ? 'Chỉnh sửa phân công' : 'Chi tiết phân công'}
                                    </h2>
                                </div>
                            </div>
                            <button onClick={closeModal} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/50 rounded-xl transition-all"><X size={20} /></button>
                        </div>
                        <div className="p-6 md:p-8 overflow-y-auto flex-1 custom-scrollbar">
                            <form id="assignmentForm" onSubmit={handleSave} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest pl-1">Ngày phân công <span className="text-rose-500">*</span></label>
                                        <div className="relative">
                                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"><Calendar size={18} /></div>
                                            <input type="date" required disabled={modalMode === 'view'} value={currentAssignment?.ngay_phan_cong || ''} onChange={e => setCurrentAssignment({...currentAssignment, ngay_phan_cong: e.target.value})} className={`${inputCls} pl-12`} />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest pl-1">Điều tra viên <span className="text-rose-500">*</span></label>
                                        <div className="relative">
                                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"><User size={18} /></div>
                                            <select 
                                                required 
                                                disabled={modalMode === 'view'} 
                                                value={currentAssignment?.dieu_tra_vien || ''} 
                                                onChange={e => setCurrentAssignment({...currentAssignment, dieu_tra_vien: e.target.value})} 
                                                className={`${inputCls} pl-12 appearance-none cursor-pointer`}
                                            >
                                                <option value="" disabled>-- Chọn cán bộ thụ lý --</option>
                                                {users.map(u => <option key={u.id} value={u.name}>{u.name}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <label className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest pl-1 flex items-center gap-2">
                                        <MessageSquare size={14} className="text-blue-500"/> Nội dung nhiệm vụ <span className="text-rose-500">*</span>
                                    </label>
                                    {modalMode === 'view' ? (
                                        <div className="p-6 bg-blue-50/30 dark:bg-blue-900/10 border-2 border-blue-100 dark:border-blue-900/30 rounded-2xl shadow-inner">
                                            <p className="text-base text-slate-800 dark:text-slate-100 leading-loose font-medium italic whitespace-pre-wrap">
                                                "{currentAssignment?.noi_dung}"
                                            </p>
                                        </div>
                                    ) : (
                                        <textarea required disabled={modalMode === 'view'} value={currentAssignment?.noi_dung || ''} onChange={e => setCurrentAssignment({...currentAssignment, noi_dung: e.target.value})} className={`${inputCls} resize-none h-40 leading-relaxed p-4`} placeholder="Mô tả cụ thể nội dung công việc phân công..." />
                                    )}
                                </div>
                                <div className="space-y-3">
                                    <label className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest pl-1 flex items-center gap-2">
                                        <ClipboardList size={14} className="text-emerald-500"/> Kết quả điều tra
                                    </label>
                                    {modalMode === 'view' ? (
                                        currentAssignment?.ket_qua ? (
                                            <div className="p-5 bg-emerald-50/20 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800/40 rounded-2xl">
                                                <div className="flex items-center gap-2 mb-2">
                                                    {renderResultBadge(currentAssignment.ket_qua)}
                                                </div>
                                                <p className="text-sm text-slate-700 dark:text-slate-200 font-medium">Hồ sơ đã được xử lý với kết quả trên.</p>
                                            </div>
                                        ) : (
                                            <div className="p-5 bg-slate-50 dark:bg-slate-900/50 border border-dashed border-slate-200 dark:border-slate-700 rounded-2xl text-center">
                                                <p className="text-sm text-slate-400 font-medium italic">Chưa ghi nhận kết quả điều tra</p>
                                            </div>
                                        )
                                    ) : (
                                        <div className="relative">
                                            <select 
                                                disabled={modalMode === 'view'} 
                                                value={currentAssignment?.ket_qua || ''} 
                                                onChange={e => setCurrentAssignment({...currentAssignment, ket_qua: e.target.value})} 
                                                className={`${inputCls} appearance-none cursor-pointer bg-emerald-50/20 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-800/40`}
                                            >
                                                <option value="">-- Lựa chọn kết quả --</option>
                                                <option value="Khởi tố">Khởi tố</option>
                                                <option value="Không khởi tố">Không khởi tố</option>
                                                <option value="Tạm đình chỉ">Tạm đình chỉ</option>
                                            </select>
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                                                <Filter size={14} />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </form>
                        </div>
                        <div className="p-6 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-3 bg-slate-50/50 dark:bg-slate-800/50 flex-shrink-0">
                            <button onClick={closeModal} disabled={isSaving} className="px-6 py-2.5 text-sm font-bold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-600 transition-all shadow-sm">
                                {modalMode === 'view' ? 'Đóng lại' : 'Hủy bỏ'}
                            </button>
                            {modalMode !== 'view' && (
                                <button form="assignmentForm" type="submit" disabled={isSaving} className="px-6 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2 active:scale-95 disabled:opacity-50">
                                    {isSaving ? <RefreshCw size={18} className="animate-spin" /> : (modalMode === 'add' ? <Plus size={18} /> : <Edit3 size={18} />)}
                                    {modalMode === 'add' ? 'Lưu phân công' : 'Cập nhật ngay'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Modal */}
            {isDeleteModalOpen && deletingAssignment && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-[6px] animate-in fade-in duration-300" onClick={() => setIsDeleteModalOpen(false)}>
                    <div className="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden transform animate-in zoom-in-95 duration-400" onClick={e => e.stopPropagation()}>
                        <div className="p-8 text-center">
                            <div className="w-20 h-20 rounded-full bg-rose-50 dark:bg-rose-900/30 flex items-center justify-center mx-auto mb-6 shadow-inner ring-4 ring-rose-50/50 dark:ring-rose-900/20">
                                <AlertTriangle size={40} className="text-rose-500" />
                            </div>
                            <h3 className="text-xl font-black text-slate-800 dark:text-white mb-2 uppercase tracking-tight">Xác nhận xóa?</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                                Hành động này sẽ xóa vĩnh viễn phân công của điều tra viên <b className="text-slate-700 dark:text-slate-200">{getInvestigatorName(deletingAssignment.dieu_tra_vien)}</b>. Không thể khôi phục sau khi thực hiện.
                            </p>
                        </div>
                        <div className="p-6 pt-0 flex gap-3">
                            <button onClick={() => setIsDeleteModalOpen(false)} className="flex-1 px-5 py-3 text-sm font-bold text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 rounded-2xl transition-all">Quay lại</button>
                            <button onClick={handleDelete} className="flex-1 px-5 py-3 text-sm font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-2xl shadow-lg shadow-rose-500/20 transition-all active:scale-95">Xóa vĩnh viễn</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Toast Notification */}
            {toast && (
                <div className={`fixed top-8 right-8 z-[200] flex items-center gap-4 px-6 py-4 rounded-2xl shadow-2xl border backdrop-blur-md animate-in slide-in-from-right-8 duration-500 ${toast.type === 'error' ? 'bg-rose-50/90 border-rose-200 text-rose-800 dark:bg-rose-900/90 dark:border-rose-800 dark:text-rose-100' : 'bg-emerald-50/90 border-emerald-200 text-emerald-800 dark:bg-emerald-900/90 dark:border-emerald-800 dark:text-emerald-100'}`}>
                    <div className={`p-2 rounded-xl ${toast.type === 'error' ? 'bg-rose-500 text-white' : 'bg-emerald-500 text-white'}`}>
                        {toast.type === 'error' ? <AlertTriangle size={18} /> : <CheckCircle2 size={18} />}
                    </div>
                    <div>
                        <p className="text-sm font-black tracking-tight">{toast.message}</p>
                    </div>
                    <button onClick={() => setToast(null)} className="ml-2 text-slate-400 hover:text-slate-600 transition-colors"><X size={16} /></button>
                </div>
            )}
        </div>
    );
}
