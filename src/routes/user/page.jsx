import React, { useEffect, useState, useMemo } from 'react';
import { userApi } from '../../api/userApi';
import { donviApi } from '../../api/donviApi';
import {
    Users, UserPlus, Shield, Search, Edit3, Trash2, X, Eye,
    Mail, Phone, UserCheck, UserCog, Inbox, AlertTriangle,
    CheckCircle2, Loader2, ChevronDown, ChevronLeft, ChevronRight, Building
} from 'lucide-react';

const ROLE_CONFIG = {
    'super admin': { label: 'Super Admin', bg: 'bg-purple-50 dark:bg-purple-900/40', text: 'text-purple-700 dark:text-purple-300', dot: 'bg-purple-500', icon: Shield },
    'admin':       { label: 'Admin',       bg: 'bg-blue-50 dark:bg-blue-900/40',     text: 'text-blue-700 dark:text-blue-300',     dot: 'bg-blue-500',   icon: UserCog },
    'user':        { label: 'Người dùng',  bg: 'bg-emerald-50 dark:bg-emerald-900/40', text: 'text-emerald-700 dark:text-emerald-300', dot: 'bg-emerald-500', icon: UserCheck },
};

const AVATAR_COLORS = [
    'from-blue-500 to-indigo-600', 'from-emerald-500 to-teal-600',
    'from-amber-500 to-orange-600', 'from-rose-500 to-pink-600',
    'from-violet-500 to-purple-600', 'from-cyan-500 to-sky-600',
];

const PAGE_SIZE_OPTIONS = [5, 10, 20];

function getInitials(name) {
    if (!name) return '?';
    return name.split(' ').map(w => w[0]).filter(Boolean).slice(-2).join('').toUpperCase();
}
function getAvatarColor(id) { return AVATAR_COLORS[(id || 0) % AVATAR_COLORS.length]; }

// Shared input class for dark mode
const inputCls = (hasError) =>
    `w-full px-4 py-2.5 bg-white dark:bg-slate-800 border rounded-lg text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 transition-colors placeholder:text-slate-400 dark:placeholder:text-slate-500 ${hasError ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500' : 'border-slate-200 dark:border-slate-600 focus:border-blue-500 focus:ring-blue-500'}`;

// Reusable Pagination Component
export function Pagination({ currentPage, totalPages, pageSize, pageSizeOptions, onPageChange, onPageSizeChange, totalItems }) {
    const pages = [];
    const delta = 1;
    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= currentPage - delta && i <= currentPage + delta)) {
            pages.push(i);
        } else if (pages[pages.length - 1] !== '...') {
            pages.push('...');
        }
    }

    return (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-3 border-t border-slate-100 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/60 text-xs text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-2">
                <span>Hiển thị</span>
                <select
                    value={pageSize}
                    onChange={e => onPageSizeChange(Number(e.target.value))}
                    className="px-2 py-1 border border-slate-200 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs focus:outline-none"
                >
                    {pageSizeOptions.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <span>/ <b className="text-slate-700 dark:text-slate-300">{totalItems}</b> mục</span>
            </div>
            <div className="flex items-center gap-1">
                <button disabled={currentPage === 1} onClick={() => onPageChange(currentPage - 1)}
                    className="p-1.5 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                    <ChevronLeft size={14} />
                </button>
                {pages.map((p, i) =>
                    p === '...'
                        ? <span key={`ellipsis-${i}`} className="px-1.5">...</span>
                        : <button key={p} onClick={() => onPageChange(p)}
                            className={`min-w-[28px] h-7 rounded-md text-xs font-medium transition-colors ${currentPage === p ? 'bg-blue-600 text-white' : 'hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>
                            {p}
                          </button>
                )}
                <button disabled={currentPage === totalPages} onClick={() => onPageChange(currentPage + 1)}
                    className="p-1.5 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                    <ChevronRight size={14} />
                </button>
            </div>
        </div>
    );
}

export default function UserPage() {
    const [users, setUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState('All');
    
    // Đơn vị
    const [donviList, setDonviList] = useState([]);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    // Modal
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState('add');
    const [currentUser, setCurrentUser] = useState(null);
    const [formErrors, setFormErrors] = useState({});
    const [isSaving, setIsSaving] = useState(false);

    // Delete
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [deletingUser, setDeletingUser] = useState(null);

    // Toast
    const [toast, setToast] = useState(null);
    const showToast = (message, type = 'success') => { setToast({ message, type }); setTimeout(() => setToast(null), 3000); };

    const getUsers = async () => {
        setIsLoading(true);
        try { const res = await userApi.getUsers(); setUsers(res.data); }
        catch { showToast('Không thể tải danh sách tài khoản', 'error'); }
        finally { setIsLoading(false); }
    };
    const getDonviList = async () => {
        try {
            const res = await donviApi.getDonvi();
            // Xử lý res có thể là mảng hoặc có data
            setDonviList(Array.isArray(res) ? res : res.data || []);
        } catch (error) {
            console.error("Không thể tải danh sách đơn vị", error);
        }
    };
    useEffect(() => { getUsers(); getDonviList(); }, []);

    // Reset page on filter change
    useEffect(() => { setCurrentPage(1); }, [searchQuery, roleFilter]);

    const filteredUsers = useMemo(() => {
        const q = searchQuery.toLowerCase();
        return users.filter(u => {
            const matchSearch = (u.name||'').toLowerCase().includes(q) || (u.email||'').toLowerCase().includes(q) || (u.username||'').toLowerCase().includes(q) || (u.phone||'').toLowerCase().includes(q);
            return matchSearch && (roleFilter === 'All' || u.role === roleFilter);
        });
    }, [users, searchQuery, roleFilter]);

    // Paginated
    const totalPages = Math.max(1, Math.ceil(filteredUsers.length / pageSize));
    const paginatedUsers = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return filteredUsers.slice(start, start + pageSize);
    }, [filteredUsers, currentPage, pageSize]);

    const stats = useMemo(() => ({
        total: users.length,
        superAdmins: users.filter(u => u.role === 'super admin').length,
        admins: users.filter(u => u.role === 'admin').length,
        normalUsers: users.filter(u => u.role === 'user').length,
    }), [users]);

    const openModal = (mode, user = null) => {
        setModalMode(mode); setFormErrors({});
        setCurrentUser(mode === 'add' ? { name: '', email: '', username: '', phone: '', password: '', role: 'user', don_vi: '' } : { ...user });
        setIsModalOpen(true);
    };
    const closeModal = () => { setIsModalOpen(false); setCurrentUser(null); setFormErrors({}); };

    const validateForm = () => {
        const errors = {};
        if (!currentUser.name?.trim()) errors.name = 'Vui lòng nhập họ tên';
        if (!currentUser.email?.trim()) errors.email = 'Vui lòng nhập email';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(currentUser.email)) errors.email = 'Email không hợp lệ';
        if (!currentUser.username?.trim()) errors.username = 'Vui lòng nhập tên đăng nhập';
        if (!currentUser.phone?.trim()) errors.phone = 'Vui lòng nhập số điện thoại';
        if (modalMode === 'add' && !currentUser.password?.trim()) errors.password = 'Vui lòng nhập mật khẩu';
        if (!currentUser.role) errors.role = 'Vui lòng chọn vai trò';
        if (!currentUser.don_vi) errors.don_vi = 'Vui lòng chọn đơn vị';
        const others = users.filter(u => u.id !== currentUser.id);
        if (others.some(u => u.email === currentUser.email)) errors.email = 'Email đã tồn tại';
        if (others.some(u => u.username === currentUser.username)) errors.username = 'Tên đăng nhập đã tồn tại';
        if (others.some(u => u.phone === currentUser.phone)) errors.phone = 'Số điện thoại đã tồn tại';
        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSave = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;
        setIsSaving(true);
        try {
            if (modalMode === 'edit') { await userApi.updateUser(currentUser.id, currentUser); setUsers(users.map(u => u.id === currentUser.id ? { ...u, ...currentUser } : u)); showToast('Cập nhật tài khoản thành công'); }
            else { await userApi.createUser(currentUser); await getUsers(); showToast('Tạo tài khoản thành công'); }
            closeModal();
        } catch { showToast('Có lỗi xảy ra, vui lòng thử lại', 'error'); }
        finally { setIsSaving(false); }
    };

    const handleDelete = async () => {
        try { await userApi.deleteUser(deletingUser.id); setUsers(users.filter(u => u.id !== deletingUser.id)); showToast('Xóa tài khoản thành công'); }
        catch { showToast('Không thể xóa tài khoản', 'error'); }
        finally { setIsDeleteModalOpen(false); setDeletingUser(null); }
    };

    const updateField = (field, value) => {
        setCurrentUser(prev => ({ ...prev, [field]: value }));
        if (formErrors[field]) setFormErrors(prev => { const n = {...prev}; delete n[field]; return n; });
    };

    return (
        <div className="flex flex-col gap-6 w-full pb-10">

            {/* HEADER */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-semibold text-slate-800 dark:text-white flex items-center gap-2.5">
                        <Users size={24} className="text-blue-600 dark:text-blue-400" /> Quản lý Tài khoản
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Quản lý thông tin và phân quyền người dùng trong hệ thống</p>
                </div>
                <button onClick={() => openModal('add')} className="flex items-center gap-2 bg-blue-600 text-white hover:bg-blue-700 px-5 py-2.5 rounded-lg font-medium text-sm shadow-sm transition-all active:scale-95">
                    <UserPlus size={18} /> Thêm tài khoản
                </button>
            </div>

            {/* STAT CARDS */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                    { label: 'Tổng tài khoản', value: stats.total,       icon: Users,     color: 'text-blue-600 dark:text-blue-400',     bg: 'bg-blue-50 dark:bg-blue-900/30',     border: 'border-blue-100 dark:border-blue-800' },
                    { label: 'Super Admin',     value: stats.superAdmins, icon: Shield,    color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-900/30', border: 'border-purple-100 dark:border-purple-800' },
                    { label: 'Admin',           value: stats.admins,      icon: UserCog,   color: 'text-amber-600 dark:text-amber-400',   bg: 'bg-amber-50 dark:bg-amber-900/30',   border: 'border-amber-100 dark:border-amber-800' },
                    { label: 'Người dùng',      value: stats.normalUsers, icon: UserCheck, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/30', border: 'border-emerald-100 dark:border-emerald-800' },
                ].map((s, i) => (
                    <div key={i} className={`bg-white dark:bg-slate-800/80 p-5 rounded-xl border ${s.border} shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow`}>
                        <div className={`p-3 rounded-xl ${s.bg} ${s.color} flex-shrink-0`}><s.icon size={20} /></div>
                        <div>
                            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-0.5">{s.label}</p>
                            <p className="text-2xl font-bold text-slate-800 dark:text-white">{s.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* TABLE CARD */}
            <div className="bg-white dark:bg-slate-800/80 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col">

                {/* Toolbar */}
                <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex flex-col lg:flex-row justify-between items-center gap-3">
                    <div className="relative w-full lg:w-[340px]">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
                        <input type="text" placeholder="Tìm theo tên, email, username..." value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm text-slate-700 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-colors" />
                    </div>
                    <div className="flex items-center gap-3 w-full lg:w-auto">
                        <div className="relative">
                            <Shield size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                            <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)}
                                className="pl-8 pr-8 py-2.5 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 appearance-none cursor-pointer">
                                <option value="All">Tất cả vai trò</option>
                                <option value="super admin">Super Admin</option>
                                <option value="admin">Admin</option>
                                <option value="user">Người dùng</option>
                            </select>
                        </div>
                        <span className="text-xs text-slate-400 dark:text-slate-500 whitespace-nowrap">{filteredUsers.length} kết quả</span>
                    </div>
                </div>

                {/* Table */}
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-3">
                        <Loader2 size={32} className="text-blue-500 animate-spin" />
                        <p className="text-sm text-slate-500 dark:text-slate-400">Đang tải dữ liệu...</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[700px] text-left">
                            <thead>
                                <tr className="bg-slate-50 dark:bg-slate-700/80 border-b border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wide">
                                    <th className="py-3.5 px-5 w-[60px]">ID</th>
                                    <th className="py-3.5 px-5 min-w-[200px]">Người dùng</th>
                                    <th className="py-3.5 px-5 min-w-[180px]">Liên hệ</th>
                                    <th className="py-3.5 px-5 w-[150px]">Tên đăng nhập</th>
                                    <th className="py-3.5 px-5 min-w-[160px]">Đơn vị</th>
                                    <th className="py-3.5 px-5 w-[140px]">Vai trò</th>
                                    <th className="py-3.5 px-5 text-right w-[120px]">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                {paginatedUsers.map(user => {
                                    const rc = ROLE_CONFIG[user.role] || ROLE_CONFIG['user'];
                                    return (
                                        <tr key={user.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-700/40 transition-colors group">
                                            <td className="py-4 px-5"><span className="text-xs font-mono text-slate-400 dark:text-slate-500">#{user.id}</span></td>
                                            <td className="py-4 px-5">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${getAvatarColor(user.id)} flex items-center justify-center text-white text-xs font-semibold shadow-sm flex-shrink-0`}>
                                                        {getInitials(user.name)}
                                                    </div>
                                                    <div className="text-sm font-medium text-slate-800 dark:text-slate-100">{user.name}</div>
                                                </div>
                                            </td>
                                            <td className="py-4 px-5">
                                                <div className="flex flex-col gap-0.5">
                                                    <div className="text-sm text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                                                        <Mail size={13} className="text-slate-400 flex-shrink-0" />
                                                        <span className="truncate max-w-[200px]">{user.email}</span>
                                                    </div>
                                                    {user.phone && (
                                                        <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                                                            <Phone size={12} className="text-slate-400 flex-shrink-0" />{user.phone}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="py-4 px-5">
                                                <code className="text-sm text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-700/60 px-2 py-0.5 rounded font-mono border border-slate-100 dark:border-slate-600">{user.username}</code>
                                            </td>
                                            <td className="py-4 px-5">
                                                <div className="flex items-center gap-1.5 text-sm text-slate-700 dark:text-slate-200">
                                                    <Building size={14} className="text-slate-400 flex-shrink-0" />
                                                    <span className="truncate max-w-[160px]" title={donviList.find(d => d.id == user.don_vi)?.ten_don_vi || donviList.find(d => d.id == user.don_vi)?.name || 'Chưa phân bổ'}>
                                                        {donviList.find(d => d.id == user.don_vi)?.ten_don_vi || donviList.find(d => d.id == user.don_vi)?.name || <span className="text-slate-400 italic text-xs">Chưa phân bổ</span>}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-5">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border border-transparent ${rc.bg} ${rc.text}`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${rc.dot}`}></span>
                                                    {rc.label}
                                                </span>
                                            </td>
                                            <td className="py-4 px-5 text-right whitespace-nowrap">
                                                <div className="flex items-center justify-end gap-1 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => openModal('view', user)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/40 rounded-md transition-colors" title="Xem"><Eye size={15} /></button>
                                                    <button onClick={() => openModal('edit', user)} className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/40 rounded-md transition-colors" title="Sửa"><Edit3 size={15} /></button>
                                                    {/* <button disabled className="p-1.5 text-slate-400 opacity-50 cursor-not-allowed rounded-md transition-colors" title="Vô hiệu hóa"><Trash2 size={15} /></button> */}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {filteredUsers.length === 0 && (
                                    <tr><td colSpan="6" className="py-16 text-center text-slate-400 dark:text-slate-500">
                                        <Inbox size={40} className="mx-auto mb-3 text-slate-300 dark:text-slate-600" strokeWidth={1.5} />
                                        <p className="text-sm font-medium">Không tìm thấy tài khoản nào</p>
                                        <p className="text-xs mt-1">Thử thay đổi bộ lọc hoặc từ khóa</p>
                                    </td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination */}
                {!isLoading && filteredUsers.length > 0 && (
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        pageSize={pageSize}
                        pageSizeOptions={PAGE_SIZE_OPTIONS}
                        onPageChange={setCurrentPage}
                        onPageSizeChange={(s) => { setPageSize(s); setCurrentPage(1); }}
                        totalItems={filteredUsers.length}
                    />
                )}
            </div>

            {/* CREATE/EDIT/VIEW MODAL */}
            {isModalOpen && currentUser && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm" onClick={closeModal}>
                    <div className="bg-white dark:bg-slate-800 rounded-xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-700 flex-shrink-0">
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${modalMode === 'add' ? 'bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400' : modalMode === 'edit' ? 'bg-amber-50 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400' : 'bg-slate-50 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>
                                    {modalMode === 'add' ? <UserPlus size={18} /> : modalMode === 'edit' ? <Edit3 size={18} /> : <Eye size={18} />}
                                </div>
                                <h2 className="text-base font-semibold text-slate-800 dark:text-white">
                                    {modalMode === 'add' ? 'Thêm tài khoản mới' : modalMode === 'edit' ? 'Chỉnh sửa tài khoản' : 'Thông tin tài khoản'}
                                </h2>
                            </div>
                            <button onClick={closeModal} className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"><X size={18} /></button>
                        </div>

                        <div className="p-5 md:p-6 overflow-y-auto flex-1">
                            {modalMode === 'view' && (
                                <div className="flex flex-col items-center text-center mb-6 pb-6 border-b border-slate-100 dark:border-slate-700">
                                    <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${getAvatarColor(currentUser.id)} flex items-center justify-center text-white text-xl font-semibold shadow-md mb-3`}>
                                        {getInitials(currentUser.name)}
                                    </div>
                                    <h3 className="text-lg font-semibold text-slate-800 dark:text-white">{currentUser.name}</h3>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">@{currentUser.username}</p>
                                    <div className="mt-2">{(() => { const rc = ROLE_CONFIG[currentUser.role] || ROLE_CONFIG['user']; return (
                                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${rc.bg} ${rc.text}`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${rc.dot}`}></span>{rc.label}
                                        </span>
                                    ); })()}</div>
                                </div>
                            )}
                            <form id="userForm" onSubmit={handleSave} className="space-y-5">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    {[
                                        { field: 'name', label: 'Họ và tên', type: 'text', icon: Users, placeholder: 'Nhập họ và tên', required: true },
                                        { field: 'email', label: 'Email', type: 'email', icon: Mail, placeholder: 'example@email.com', required: true },
                                        { field: 'username', label: 'Tên đăng nhập', type: 'text', icon: UserCheck, placeholder: 'Nhập tên đăng nhập', required: true },
                                        { field: 'phone', label: 'Số điện thoại', type: 'text', icon: Phone, placeholder: '0xxx-xxx-xxx', required: true },
                                    ].map(({ field, label, type, icon: Icon, placeholder, required }) => (
                                        <div key={field} className="space-y-1.5">
                                            <label className="text-sm font-medium text-slate-600 dark:text-slate-300">{label}{required && <span className="text-rose-500 ml-0.5">*</span>}</label>
                                            {modalMode === 'view' ? (
                                                <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 dark:bg-slate-700/60 rounded-lg text-sm text-slate-700 dark:text-slate-200">
                                                    <Icon size={15} className="text-slate-400" />{field === 'username' ? `@${currentUser[field]}` : currentUser[field]}
                                                </div>
                                            ) : (
                                                <>
                                                    <input type={type} value={currentUser[field] || ''} onChange={e => updateField(field, e.target.value)} placeholder={placeholder} className={inputCls(!!formErrors[field])} />
                                                    {formErrors[field] && <p className="text-xs text-rose-500">{formErrors[field]}</p>}
                                                </>
                                            )}
                                        </div>
                                    ))}

                                    {modalMode === 'add' && (
                                        <div className="space-y-1.5">
                                            <label className="text-sm font-medium text-slate-600 dark:text-slate-300">Mật khẩu <span className="text-rose-500">*</span></label>
                                            <input type="password" value={currentUser.password || ''} onChange={e => updateField('password', e.target.value)} placeholder="Nhập mật khẩu" className={inputCls(!!formErrors.password)} />
                                            {formErrors.password && <p className="text-xs text-rose-500">{formErrors.password}</p>}
                                        </div>
                                    )}

                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-slate-600 dark:text-slate-300">Vai trò <span className="text-rose-500">*</span></label>
                                        {modalMode === 'view' ? (
                                            <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 dark:bg-slate-700/60 rounded-lg text-sm text-slate-700 dark:text-slate-200">
                                                <Shield size={15} className="text-slate-400" />{(ROLE_CONFIG[currentUser.role] || ROLE_CONFIG['user']).label}
                                            </div>
                                        ) : (
                                            <div className="relative">
                                                <select value={currentUser.role || 'user'} onChange={e => updateField('role', e.target.value)} className={inputCls(!!formErrors.role) + ' appearance-none cursor-pointer'}>
                                                    <option value="super admin">Super Admin</option>
                                                    <option value="admin">Admin</option>
                                                    <option value="user">Người dùng</option>
                                                </select>
                                                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                                {formErrors.role && <p className="text-xs text-rose-500 mt-1.5">{formErrors.role}</p>}
                                            </div>
                                        )}
                                    </div>

                                    <div className="space-y-1.5 break-inside-avoid">
                                        <label className="text-sm font-medium text-slate-600 dark:text-slate-300">Đơn vị <span className="text-rose-500">*</span></label>
                                        {modalMode === 'view' ? (
                                            <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 dark:bg-slate-700/60 rounded-lg text-sm text-slate-700 dark:text-slate-200">
                                                <Building size={15} className="text-slate-400" />
                                                {donviList.find(d => d.id === currentUser.don_vi)?.ten_don_vi || 
                                                 donviList.find(d => d.id === currentUser.don_vi)?.name || 
                                                 'Chưa có đơn vị'}
                                            </div>
                                        ) : (
                                            <div className="relative">
                                                <select value={currentUser.don_vi || ''} onChange={e => updateField('don_vi', e.target.value === '' ? '' : Number(e.target.value))} className={inputCls(!!formErrors.don_vi) + ' appearance-none cursor-pointer'}>
                                                    <option value="" disabled hidden>Chọn đơn vị</option>
                                                    {donviList.map(dv => (
                                                        <option key={dv.id} value={dv.id}>{dv.ten_don_vi || dv.name}</option>
                                                    ))}
                                                </select>
                                                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                                {formErrors.don_vi && <p className="text-xs text-rose-500 mt-1.5">{formErrors.don_vi}</p>}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </form>
                        </div>

                        <div className="p-4 md:px-6 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-3 bg-slate-50 dark:bg-slate-800/80 rounded-b-xl flex-shrink-0">
                            <button onClick={closeModal} className="px-5 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors">
                                {modalMode === 'view' ? 'Đóng' : 'Hủy bỏ'}
                            </button>
                            {modalMode !== 'view' && (
                                <button form="userForm" type="submit" disabled={isSaving} className="flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 shadow-sm disabled:opacity-60 disabled:cursor-not-allowed transition-colors">
                                    {isSaving && <Loader2 size={14} className="animate-spin" />}
                                    {modalMode === 'add' ? 'Tạo tài khoản' : 'Lưu thay đổi'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* DELETE MODAL */}
            {isDeleteModalOpen && deletingUser && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsDeleteModalOpen(false)}>
                    <div className="bg-white dark:bg-slate-800 rounded-xl w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
                        <div className="p-6 text-center">
                            <div className="w-14 h-14 rounded-full bg-rose-50 dark:bg-rose-900/30 flex items-center justify-center mx-auto mb-4">
                                <AlertTriangle size={28} className="text-rose-500" />
                            </div>
                            <h3 className="text-base font-semibold text-slate-800 dark:text-white mb-2">Xác nhận xóa tài khoản</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Bạn có chắc muốn xóa tài khoản của</p>
                            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 mt-1 mb-1">{deletingUser.name}</p>
                            <p className="text-xs text-slate-400 dark:text-slate-500">Hành động này không thể hoàn tác</p>
                        </div>
                        <div className="px-6 pb-5 flex justify-center gap-3">
                            <button onClick={() => setIsDeleteModalOpen(false)} className="px-5 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors">Hủy bỏ</button>
                            <button onClick={handleDelete} className="px-5 py-2 text-sm font-medium text-white bg-rose-600 rounded-lg hover:bg-rose-700 shadow-sm transition-colors">Xóa tài khoản</button>
                        </div>
                    </div>
                </div>
            )}

            {/* TOAST */}
            {toast && (
                <div className={`fixed bottom-6 right-6 z-[200] flex items-center gap-3 px-5 py-3 rounded-xl shadow-lg border animate-in slide-in-from-bottom-4 duration-300 ${toast.type === 'error' ? 'bg-rose-50 dark:bg-rose-900/30 border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300' : 'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'}`}>
                    {toast.type === 'error' ? <AlertTriangle size={18} className="flex-shrink-0" /> : <CheckCircle2 size={18} className="flex-shrink-0" />}
                    <span className="text-sm font-medium">{toast.message}</span>
                    <button onClick={() => setToast(null)} className="ml-2 opacity-50 hover:opacity-100 transition-opacity"><X size={14} /></button>
                </div>
            )}
        </div>
    );
}