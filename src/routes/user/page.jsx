import React, { useEffect, useState, useMemo } from 'react';
import { userApi } from '../../api/userApi';
import {
    Users, UserPlus, Shield, Search, Edit3, Trash2, X, Eye,
    Mail, Phone, UserCheck, UserCog, Inbox, AlertTriangle,
    CheckCircle2, Loader2, ChevronDown
} from 'lucide-react';

const ROLE_CONFIG = {
    'super admin': { label: 'Super Admin', bg: 'bg-purple-50', text: 'text-purple-700', dot: 'bg-purple-500', icon: Shield },
    'admin': { label: 'Admin', bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500', icon: UserCog },
    'user': { label: 'Người dùng', bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500', icon: UserCheck },
};

function getInitials(name) {
    if (!name) return '?';
    return name
        .split(' ')
        .map(w => w[0])
        .filter(Boolean)
        .slice(-2)
        .join('')
        .toUpperCase();
}

const AVATAR_COLORS = [
    'from-blue-500 to-indigo-600',
    'from-emerald-500 to-teal-600',
    'from-amber-500 to-orange-600',
    'from-rose-500 to-pink-600',
    'from-violet-500 to-purple-600',
    'from-cyan-500 to-sky-600',
];

function getAvatarColor(id) {
    return AVATAR_COLORS[(id || 0) % AVATAR_COLORS.length];
}

export default function UserPage() {
    const [users, setUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState('All');

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState('add'); // add | edit | view
    const [currentUser, setCurrentUser] = useState(null);
    const [formErrors, setFormErrors] = useState({});
    const [isSaving, setIsSaving] = useState(false);

    // Delete confirmation
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [deletingUser, setDeletingUser] = useState(null);

    // Toast notification
    const [toast, setToast] = useState(null);

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const getUsers = async () => {
        setIsLoading(true);
        try {
            const response = await userApi.getUsers();
            setUsers(response.data);
        } catch (error) {
            showToast('Không thể tải danh sách tài khoản', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        getUsers();
    }, []);

    // Filtered users
    const filteredUsers = useMemo(() => {
        return users.filter(u => {
            const q = searchQuery.toLowerCase();
            const matchSearch =
                (u.name || '').toLowerCase().includes(q) ||
                (u.email || '').toLowerCase().includes(q) ||
                (u.username || '').toLowerCase().includes(q) ||
                (u.phone || '').toLowerCase().includes(q);
            const matchRole = roleFilter === 'All' || u.role === roleFilter;
            return matchSearch && matchRole;
        });
    }, [users, searchQuery, roleFilter]);

    // Stats
    const stats = useMemo(() => {
        const total = users.length;
        const superAdmins = users.filter(u => u.role === 'super admin').length;
        const admins = users.filter(u => u.role === 'admin').length;
        const normalUsers = users.filter(u => u.role === 'user').length;
        return { total, superAdmins, admins, normalUsers };
    }, [users]);

    // Modal handlers
    const openModal = (mode, user = null) => {
        setModalMode(mode);
        setFormErrors({});
        if (mode === 'add') {
            setCurrentUser({ name: '', email: '', username: '', phone: '', password: '', role: 'user' });
        } else {
            setCurrentUser({ ...user });
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setCurrentUser(null);
        setFormErrors({});
    };

    const validateForm = () => {
        const errors = {};
        if (!currentUser.name?.trim()) errors.name = 'Vui lòng nhập họ tên';
        if (!currentUser.email?.trim()) errors.email = 'Vui lòng nhập email';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(currentUser.email)) errors.email = 'Email không hợp lệ';
        if (!currentUser.username?.trim()) errors.username = 'Vui lòng nhập tên đăng nhập';
        if (!currentUser.phone?.trim()) errors.phone = 'Vui lòng nhập số điện thoại';
        if (modalMode === 'add' && !currentUser.password?.trim()) errors.password = 'Vui lòng nhập mật khẩu';
        if (!currentUser.role) errors.role = 'Vui lòng chọn vai trò';

        // Uniqueness checks
        const otherUsers = users.filter(u => u.id !== currentUser.id);
        if (otherUsers.some(u => u.email === currentUser.email)) errors.email = 'Email đã tồn tại';
        if (otherUsers.some(u => u.username === currentUser.username)) errors.username = 'Tên đăng nhập đã tồn tại';
        if (otherUsers.some(u => u.phone === currentUser.phone)) errors.phone = 'Số điện thoại đã tồn tại';

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSave = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        setIsSaving(true);
        try {
            if (modalMode === 'edit') {
                await userApi.updateUser(currentUser.id, currentUser);
                setUsers(users.map(u => u.id === currentUser.id ? { ...u, ...currentUser } : u));
                showToast('Cập nhật tài khoản thành công');
            } else {
                await userApi.createUser(currentUser);
                await getUsers();
                showToast('Tạo tài khoản thành công');
            }
            closeModal();
        } catch (error) {
            showToast('Có lỗi xảy ra, vui lòng thử lại', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const confirmDelete = (user) => {
        setDeletingUser(user);
        setIsDeleteModalOpen(true);
    };

    const handleDelete = async () => {
        try {
            await userApi.deleteUser(deletingUser.id);
            setUsers(users.filter(u => u.id !== deletingUser.id));
            showToast('Xóa tài khoản thành công');
        } catch (error) {
            showToast('Không thể xóa tài khoản', 'error');
        } finally {
            setIsDeleteModalOpen(false);
            setDeletingUser(null);
        }
    };

    const updateField = (field, value) => {
        setCurrentUser(prev => ({ ...prev, [field]: value }));
        if (formErrors[field]) {
            setFormErrors(prev => {
                const next = { ...prev };
                delete next[field];
                return next;
            });
        }
    };

    return (
        <div className="flex flex-col h-full gap-6 w-full max-w-[1400px] mx-auto p-4 md:p-6 pb-12 animation-fade-in text-slate-700 bg-[#f8fafc]">

            {/* ===== HEADER ===== */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-semibold text-slate-800 tracking-tight flex items-center gap-2.5">
                        <Users size={24} className="text-blue-600" />
                        Quản lý Tài khoản
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">
                        Quản lý thông tin và phân quyền người dùng trong hệ thống
                    </p>
                </div>
                <button
                    onClick={() => openModal('add')}
                    className="flex items-center gap-2 bg-blue-600 text-white hover:bg-blue-700 px-5 py-2.5 rounded-lg font-medium transition-all shadow-sm active:scale-95 hover:shadow-md"
                >
                    <UserPlus size={18} />
                    Thêm tài khoản
                </button>
            </div>

            {/* ===== STAT CARDS ===== */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Tổng tài khoản', value: stats.total, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
                    { label: 'Super Admin', value: stats.superAdmins, icon: Shield, color: 'text-purple-600', bg: 'bg-purple-50' },
                    { label: 'Admin', value: stats.admins, icon: UserCog, color: 'text-amber-600', bg: 'bg-amber-50' },
                    { label: 'Người dùng', value: stats.normalUsers, icon: UserCheck, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                ].map((stat, idx) => (
                    <div key={idx} className="bg-white p-5 rounded-xl border border-slate-200/60 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
                        <div className={`p-3 rounded-lg ${stat.bg} ${stat.color}`}>
                            <stat.icon size={20} />
                        </div>
                        <div>
                            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-0.5">{stat.label}</p>
                            <h3 className="text-xl font-semibold text-slate-800">{stat.value}</h3>
                        </div>
                    </div>
                ))}
            </div>

            {/* ===== MAIN TABLE CARD ===== */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200/60 overflow-hidden flex flex-col flex-1">

                {/* Toolbar */}
                <div className="p-4 border-b border-slate-100 flex flex-col lg:flex-row justify-between items-center gap-4">
                    <div className="relative w-full lg:w-[340px]">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Tìm theo tên, email, username..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors text-sm text-slate-700"
                        />
                    </div>
                    <div className="flex items-center gap-3 w-full lg:w-auto">
                        <div className="relative w-full lg:w-auto">
                            <Shield size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <select
                                value={roleFilter}
                                onChange={(e) => setRoleFilter(e.target.value)}
                                className="w-full lg:w-auto pl-8 pr-10 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-600 focus:outline-none focus:border-blue-500 appearance-none cursor-pointer"
                            >
                                <option value="All">Tất cả vai trò</option>
                                <option value="super admin">Super Admin</option>
                                <option value="admin">Admin</option>
                                <option value="user">Người dùng</option>
                            </select>
                            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        </div>
                        <span className="text-xs text-slate-400 whitespace-nowrap">
                            {filteredUsers.length} kết quả
                        </span>
                    </div>
                </div>

                {/* Table */}
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-3">
                        <Loader2 size={32} className="text-blue-500 animate-spin" />
                        <p className="text-sm text-slate-500">Đang tải dữ liệu...</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto relative">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-slate-50/50 border-b border-slate-100 text-slate-500 text-xs font-semibold uppercase tracking-wide">
                                    <th className="py-4 px-5 w-[60px]">ID</th>
                                    <th className="py-4 px-5 min-w-[220px]">Người dùng</th>
                                    <th className="py-4 px-5 min-w-[180px]">Liên hệ</th>
                                    <th className="py-4 px-5 w-[150px]">Tên đăng nhập</th>
                                    <th className="py-4 px-5 w-[140px]">Vai trò</th>
                                    <th className="py-4 px-5 text-right w-[120px]">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredUsers.map((user) => {
                                    const roleConfig = ROLE_CONFIG[user.role] || ROLE_CONFIG['user'];
                                    return (
                                        <tr
                                            key={user.id}
                                            className="hover:bg-slate-50/80 transition-colors group"
                                        >
                                            <td className="py-4 px-5">
                                                <span className="text-xs font-mono text-slate-400">#{user.id}</span>
                                            </td>
                                            <td className="py-4 px-5">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${getAvatarColor(user.id)} flex items-center justify-center text-white text-xs font-semibold shadow-sm flex-shrink-0`}>
                                                        {getInitials(user.name)}
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-medium text-slate-800">{user.name}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-4 px-5">
                                                <div className="flex flex-col gap-0.5">
                                                    <div className="text-sm text-slate-600 flex items-center gap-1.5">
                                                        <Mail size={13} className="text-slate-400 flex-shrink-0" />
                                                        <span className="truncate max-w-[200px]">{user.email}</span>
                                                    </div>
                                                    {user.phone && (
                                                        <div className="text-xs text-slate-500 flex items-center gap-1.5">
                                                            <Phone size={12} className="text-slate-400 flex-shrink-0" />
                                                            {user.phone}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="py-4 px-5">
                                                <code className="text-sm text-slate-600 bg-slate-50 px-2 py-0.5 rounded font-mono">{user.username}</code>
                                            </td>
                                            <td className="py-4 px-5">
                                                <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium ${roleConfig.bg} ${roleConfig.text}`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${roleConfig.dot}`}></span>
                                                    {roleConfig.label}
                                                </div>
                                            </td>
                                            <td className="py-4 px-5 text-right whitespace-nowrap">
                                                <div className="flex items-center justify-end gap-1 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => openModal('view', user)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors" title="Xem chi tiết">
                                                        <Eye size={16} />
                                                    </button>
                                                    <button onClick={() => openModal('edit', user)} className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-md transition-colors" title="Chỉnh sửa">
                                                        <Edit3 size={16} />
                                                    </button>
                                                    <button onClick={() => confirmDelete(user)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors" title="Xóa">
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {filteredUsers.length === 0 && !isLoading && (
                                    <tr>
                                        <td colSpan="6" className="px-6 py-16 text-center text-slate-500">
                                            <Inbox size={44} className="mx-auto mb-3 text-slate-300" strokeWidth={1.5} />
                                            <p className="text-sm font-medium">Không tìm thấy tài khoản nào</p>
                                            <p className="text-xs text-slate-400 mt-1">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* ===== CREATE / EDIT / VIEW MODAL ===== */}
            {isModalOpen && currentUser && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/30 backdrop-blur-sm animation-fade-in" onClick={closeModal}>
                    <div className="bg-white rounded-xl w-full max-w-2xl shadow-xl flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>

                        {/* Header */}
                        <div className="flex items-center justify-between p-5 border-b border-slate-100">
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${modalMode === 'add' ? 'bg-blue-50 text-blue-600' : modalMode === 'edit' ? 'bg-amber-50 text-amber-600' : 'bg-slate-50 text-slate-600'}`}>
                                    {modalMode === 'add' ? <UserPlus size={18} /> : modalMode === 'edit' ? <Edit3 size={18} /> : <Eye size={18} />}
                                </div>
                                <h2 className="text-lg font-semibold text-slate-800">
                                    {modalMode === 'add' ? 'Thêm tài khoản mới' : modalMode === 'edit' ? 'Chỉnh sửa tài khoản' : 'Thông tin tài khoản'}
                                </h2>
                            </div>
                            <button onClick={closeModal} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                                <X size={18} />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="p-5 md:p-6 overflow-y-auto custom-scrollbar flex-1">
                            {/* View mode: show profile card */}
                            {modalMode === 'view' && (
                                <div className="flex flex-col items-center text-center mb-6 pb-6 border-b border-slate-100">
                                    <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${getAvatarColor(currentUser.id)} flex items-center justify-center text-white text-xl font-semibold shadow-md mb-3`}>
                                        {getInitials(currentUser.name)}
                                    </div>
                                    <h3 className="text-lg font-semibold text-slate-800">{currentUser.name}</h3>
                                    <p className="text-sm text-slate-500 mt-0.5">@{currentUser.username}</p>
                                    <div className="mt-2">
                                        {(() => {
                                            const rc = ROLE_CONFIG[currentUser.role] || ROLE_CONFIG['user'];
                                            return (
                                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${rc.bg} ${rc.text}`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${rc.dot}`}></span>
                                                    {rc.label}
                                                </span>
                                            );
                                        })()}
                                    </div>
                                </div>
                            )}

                            <form id="userForm" onSubmit={handleSave} className="space-y-5">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    {/* Name */}
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-slate-600">
                                            Họ và tên <span className="text-rose-500">*</span>
                                        </label>
                                        {modalMode === 'view' ? (
                                            <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 rounded-lg text-sm text-slate-700">
                                                <Users size={15} className="text-slate-400" />
                                                {currentUser.name}
                                            </div>
                                        ) : (
                                            <>
                                                <input
                                                    type="text"
                                                    value={currentUser.name || ''}
                                                    onChange={(e) => updateField('name', e.target.value)}
                                                    placeholder="Nhập họ và tên"
                                                    className={`w-full px-4 py-2.5 bg-white border rounded-lg text-sm focus:outline-none focus:ring-1 transition-colors ${formErrors.name ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500' : 'border-slate-200 focus:border-blue-500 focus:ring-blue-500'}`}
                                                />
                                                {formErrors.name && <p className="text-xs text-rose-500 mt-1">{formErrors.name}</p>}
                                            </>
                                        )}
                                    </div>

                                    {/* Email */}
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-slate-600">
                                            Email <span className="text-rose-500">*</span>
                                        </label>
                                        {modalMode === 'view' ? (
                                            <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 rounded-lg text-sm text-slate-700">
                                                <Mail size={15} className="text-slate-400" />
                                                {currentUser.email}
                                            </div>
                                        ) : (
                                            <>
                                                <input
                                                    type="email"
                                                    value={currentUser.email || ''}
                                                    onChange={(e) => updateField('email', e.target.value)}
                                                    placeholder="example@email.com"
                                                    className={`w-full px-4 py-2.5 bg-white border rounded-lg text-sm focus:outline-none focus:ring-1 transition-colors ${formErrors.email ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500' : 'border-slate-200 focus:border-blue-500 focus:ring-blue-500'}`}
                                                />
                                                {formErrors.email && <p className="text-xs text-rose-500 mt-1">{formErrors.email}</p>}
                                            </>
                                        )}
                                    </div>

                                    {/* Username */}
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-slate-600">
                                            Tên đăng nhập <span className="text-rose-500">*</span>
                                        </label>
                                        {modalMode === 'view' ? (
                                            <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 rounded-lg text-sm text-slate-700">
                                                <UserCheck size={15} className="text-slate-400" />
                                                @{currentUser.username}
                                            </div>
                                        ) : (
                                            <>
                                                <input
                                                    type="text"
                                                    value={currentUser.username || ''}
                                                    onChange={(e) => updateField('username', e.target.value)}
                                                    placeholder="Nhập tên đăng nhập"
                                                    className={`w-full px-4 py-2.5 bg-white border rounded-lg text-sm focus:outline-none focus:ring-1 transition-colors ${formErrors.username ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500' : 'border-slate-200 focus:border-blue-500 focus:ring-blue-500'}`}
                                                />
                                                {formErrors.username && <p className="text-xs text-rose-500 mt-1">{formErrors.username}</p>}
                                            </>
                                        )}
                                    </div>

                                    {/* Phone */}
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-slate-600">
                                            Số điện thoại <span className="text-rose-500">*</span>
                                        </label>
                                        {modalMode === 'view' ? (
                                            <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 rounded-lg text-sm text-slate-700">
                                                <Phone size={15} className="text-slate-400" />
                                                {currentUser.phone}
                                            </div>
                                        ) : (
                                            <>
                                                <input
                                                    type="text"
                                                    value={currentUser.phone || ''}
                                                    onChange={(e) => updateField('phone', e.target.value)}
                                                    placeholder="0xxx-xxx-xxx"
                                                    className={`w-full px-4 py-2.5 bg-white border rounded-lg text-sm focus:outline-none focus:ring-1 transition-colors ${formErrors.phone ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500' : 'border-slate-200 focus:border-blue-500 focus:ring-blue-500'}`}
                                                />
                                                {formErrors.phone && <p className="text-xs text-rose-500 mt-1">{formErrors.phone}</p>}
                                            </>
                                        )}
                                    </div>

                                    {/* Password (only for create) */}
                                    {modalMode === 'add' && (
                                        <div className="space-y-1.5">
                                            <label className="text-sm font-medium text-slate-600">
                                                Mật khẩu <span className="text-rose-500">*</span>
                                            </label>
                                            <input
                                                type="password"
                                                value={currentUser.password || ''}
                                                onChange={(e) => updateField('password', e.target.value)}
                                                placeholder="Nhập mật khẩu"
                                                className={`w-full px-4 py-2.5 bg-white border rounded-lg text-sm focus:outline-none focus:ring-1 transition-colors ${formErrors.password ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500' : 'border-slate-200 focus:border-blue-500 focus:ring-blue-500'}`}
                                            />
                                            {formErrors.password && <p className="text-xs text-rose-500 mt-1">{formErrors.password}</p>}
                                        </div>
                                    )}

                                    {/* Role */}
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-slate-600">
                                            Vai trò <span className="text-rose-500">*</span>
                                        </label>
                                        {modalMode === 'view' ? (
                                            <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 rounded-lg text-sm text-slate-700">
                                                <Shield size={15} className="text-slate-400" />
                                                {(ROLE_CONFIG[currentUser.role] || ROLE_CONFIG['user']).label}
                                            </div>
                                        ) : (
                                            <div className="relative">
                                                <select
                                                    value={currentUser.role || 'user'}
                                                    onChange={(e) => updateField('role', e.target.value)}
                                                    className={`w-full px-4 py-2.5 bg-white border rounded-lg text-sm focus:outline-none focus:ring-1 transition-colors appearance-none cursor-pointer ${formErrors.role ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500' : 'border-slate-200 focus:border-blue-500 focus:ring-blue-500'}`}
                                                >
                                                    <option value="super admin">Super Admin</option>
                                                    <option value="admin">Admin</option>
                                                    <option value="user">Người dùng</option>
                                                </select>
                                                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                                {formErrors.role && <p className="text-xs text-rose-500 mt-1">{formErrors.role}</p>}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </form>
                        </div>

                        {/* Footer */}
                        <div className="p-4 md:px-6 md:py-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50 rounded-b-xl">
                            <button
                                onClick={closeModal}
                                className="px-5 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                            >
                                {modalMode === 'view' ? 'Đóng' : 'Hủy bỏ'}
                            </button>
                            {modalMode !== 'view' && (
                                <button
                                    form="userForm"
                                    type="submit"
                                    disabled={isSaving}
                                    className="flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 shadow-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                                >
                                    {isSaving && <Loader2 size={14} className="animate-spin" />}
                                    {modalMode === 'add' ? 'Tạo tài khoản' : 'Lưu thay đổi'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ===== DELETE CONFIRMATION MODAL ===== */}
            {isDeleteModalOpen && deletingUser && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/30 backdrop-blur-sm animation-fade-in" onClick={() => setIsDeleteModalOpen(false)}>
                    <div className="bg-white rounded-xl w-full max-w-md shadow-xl" onClick={(e) => e.stopPropagation()}>
                        <div className="p-6 text-center">
                            <div className="w-14 h-14 rounded-full bg-rose-50 flex items-center justify-center mx-auto mb-4">
                                <AlertTriangle size={28} className="text-rose-500" />
                            </div>
                            <h3 className="text-lg font-semibold text-slate-800 mb-2">Xác nhận xóa tài khoản</h3>
                            <p className="text-sm text-slate-500 mb-1">
                                Bạn có chắc chắn muốn xóa tài khoản của
                            </p>
                            <p className="text-sm font-semibold text-slate-700 mb-1">
                                {deletingUser.name}
                            </p>
                            <p className="text-xs text-slate-400">
                                Hành động này không thể hoàn tác
                            </p>
                        </div>
                        <div className="px-6 pb-5 flex justify-center gap-3">
                            <button
                                onClick={() => setIsDeleteModalOpen(false)}
                                className="px-5 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                            >
                                Hủy bỏ
                            </button>
                            <button
                                onClick={handleDelete}
                                className="px-5 py-2 text-sm font-medium text-white bg-rose-600 rounded-lg hover:bg-rose-700 transition-colors shadow-sm"
                            >
                                Xóa tài khoản
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ===== TOAST NOTIFICATION ===== */}
            {toast && (
                <div className={`fixed bottom-6 right-6 z-[200] flex items-center gap-3 px-5 py-3 rounded-xl shadow-lg border animation-slide-up ${
                    toast.type === 'error'
                        ? 'bg-rose-50 border-rose-200 text-rose-700'
                        : 'bg-emerald-50 border-emerald-200 text-emerald-700'
                }`}>
                    {toast.type === 'error' ? (
                        <AlertTriangle size={18} className="text-rose-500 flex-shrink-0" />
                    ) : (
                        <CheckCircle2 size={18} className="text-emerald-500 flex-shrink-0" />
                    )}
                    <span className="text-sm font-medium">{toast.message}</span>
                    <button onClick={() => setToast(null)} className="ml-2 text-current opacity-50 hover:opacity-100 transition-opacity">
                        <X size={14} />
                    </button>
                </div>
            )}

            {/* ===== INLINE STYLES ===== */}
            <style dangerouslySetInnerHTML={{__html: `
                .animation-fade-in { animation: fadeIn 0.3s ease-out; }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(5px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animation-slide-up { animation: slideUp 0.35s ease-out; }
                @keyframes slideUp {
                    from { opacity: 0; transform: translateY(12px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .custom-scrollbar::-webkit-scrollbar { width: 5px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
            `}} />
        </div>
    );
}