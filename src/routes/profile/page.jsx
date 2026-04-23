import { useState, useEffect } from "react";
import { useTheme } from "@/hooks/use-theme";
import { Footer } from "@/layouts/footer";
import { 
    User, Mail, Phone, MapPin, Briefcase, Calendar, 
    Shield, Key, Upload, Edit3, CheckCircle2, AlertTriangle, X
} from "lucide-react";
import avatarPlaceholder from "@/assets/avatar-placeholder.svg";
import { userApi } from "../../api/userApi";

const ROLE_CONFIG = {
    'super admin': { label: 'Super Admin', bg: 'bg-purple-50', text: 'text-purple-700', icon: Shield },
    'admin': { label: 'Admin', bg: 'bg-blue-50', text: 'text-blue-700', icon: Shield },
    'user': { label: 'Người dùng', bg: 'bg-emerald-50', text: 'text-emerald-700', icon: Shield },
};

const ProfilePage = () => {
    const { theme } = useTheme();
    const [activeTab, setActiveTab] = useState("info");
    const [isEditingMode, setIsEditingMode] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        username: "",
        phone: "",
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
    });
    const [toast, setToast] = useState(null);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        // Load user from local storage
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const user = JSON.parse(token);
                setCurrentUser(user);
                setFormData({
                    name: user.name || "",
                    email: user.email || "",
                    username: user.username || "",
                    phone: user.phone || "",
                    currentPassword: "",
                    newPassword: "",
                    confirmPassword: ""
                });
            } catch (e) {
                console.error("Failed to parse user info");
            }
        }
    }, []);

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSaveInfo = async (e) => {
        e.preventDefault();
        if (!currentUser) return;
        setIsSaving(true);
        try {
            // Remove passwords from payload if not changing it for info update
            const { currentPassword, newPassword, confirmPassword, ...updateData } = formData;
            const updatedUser = { ...currentUser, ...updateData };
            
            await userApi.updateUser(currentUser.id, updatedUser);
            
            // Update local state and local storage
            setCurrentUser(updatedUser);
            localStorage.setItem('token', JSON.stringify(updatedUser));
            
            setIsEditingMode(false);
            showToast('Lưu thông tin thành công!');
        } catch (error) {
            showToast('Không thể lưu thông tin. Vui lòng thử lại.', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const handleSavePassword = async (e) => {
        e.preventDefault();
        if (!currentUser) return;
        if (!formData.currentPassword) {
            showToast('Vui lòng nhập mật khẩu hiện tại', 'error');
            return;
        }
        if (!formData.newPassword) {
            showToast('Vui lòng nhập mật khẩu mới', 'error');
            return;
        }
        if (formData.newPassword.length < 6) {
            showToast('Mật khẩu mới phải có ít nhất 6 ký tự', 'error');
            return;
        }
        if (formData.currentPassword === formData.newPassword) {
            showToast('Mật khẩu mới không được trùng mật khẩu cũ', 'error');
            return;
        }
        if (formData.newPassword !== formData.confirmPassword) {
            showToast('Mật khẩu xác nhận không khớp', 'error');
            return;
        }
        
        setIsSaving(true);
        try {
            const userInfo = localStorage.getItem('token');
            const payload = {
                // Common backend conventions (Laravel/Express):
                user_id: JSON.parse(userInfo).id,
                password_old: formData.currentPassword,
                password: formData.newPassword,
                password_confirmation: formData.confirmPassword,
            };

            const res = await userApi.changePasssword(payload);

            // Some backends return HTTP 200 even when "failed".
            const isSuccess =
                res === true ||
                res?.success === true ||
                res?.status === true ||
                res?.ok === true;

            if (!isSuccess) {
                const message =
                    res?.message ||
                    res?.error ||
                    'Mật khẩu hiện tại không đúng hoặc không thể đổi mật khẩu.';
                throw new Error(message);
            }
            
            // Clear password fields
            setFormData(prev => ({ ...prev, currentPassword: "", newPassword: "", confirmPassword: "" }));
            showToast('Đổi mật khẩu thành công!');
        } catch (error) {
            const message =
                error?.response?.data?.message ||
                error?.response?.data?.error ||
                error?.message ||
                'Không thể đổi mật khẩu. Vui lòng thử lại.';
            showToast(message, 'error');
        } finally {
            setIsSaving(false);
        }
    };

    if (!currentUser) {
        return <div className="p-8 text-center text-slate-500 dark:text-slate-400">Đang tải hồ sơ...</div>;
    }

    const roleConfig = ROLE_CONFIG[currentUser.role] || ROLE_CONFIG['user'];

    return (
        <div className="flex flex-col gap-y-6">
            <div className="flex items-end justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Hồ sơ cá nhân</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Quản lý thông tin và cài đặt bảo mật</p>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                {/* Left Column: Profile Summary */}
                <div className="col-span-1 flex flex-col gap-y-6">
                    <div className="card shadow-sm bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 p-6 flex flex-col items-center">
                        <div className="relative group mb-4">
                            <div className="h-32 w-32 overflow-hidden rounded-full border-4 border-slate-100 dark:border-slate-800 relative shadow-md">
                                <img
                                    src={avatarPlaceholder}
                                    alt="Profile"
                                    className="h-full w-full object-cover"
                                    loading="lazy"
                                    decoding="async"
                                />
                            </div>
                            <button className="absolute bottom-0 right-0 p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg transition-colors">
                                <Upload size={16} />
                            </button>
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">{currentUser.name}</h2>
                        <span className={`flex items-center gap-x-1 text-sm font-medium mt-1 px-3 py-1 rounded-full border ${roleConfig.bg} ${roleConfig.text} border-current/20`}>
                            <roleConfig.icon size={14} /> {roleConfig.label}
                        </span>

                        <div className="w-full mt-6 flex gap-2">
                            <button 
                                onClick={() => { setActiveTab("info"); setIsEditingMode(!isEditingMode); }}
                                className={`flex-1 flex items-center justify-center gap-x-2 py-2 rounded-lg text-sm font-medium transition-colors ${
                                    isEditingMode 
                                    ? "bg-amber-100 hover:bg-amber-200 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400 dark:hover:bg-amber-900/60" 
                                    : "bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                                }`}
                            >
                                <Edit3 size={16} /> {isEditingMode ? "Hủy Sửa" : "Sửa hồ sơ"}
                            </button>
                        </div>

                        <div className="w-full h-px bg-slate-100 dark:bg-slate-800 my-6"></div>

                        <div className="w-full flex flex-col gap-y-4">
                            <div className="flex items-center gap-x-3 text-slate-600 dark:text-slate-400">
                                <Mail size={18} className="text-slate-400" />
                                <span className="text-sm font-medium truncate">{currentUser.email}</span>
                            </div>
                            <div className="flex items-center gap-x-3 text-slate-600 dark:text-slate-400">
                                <Phone size={18} className="text-slate-400" />
                                <span className="text-sm font-medium">{currentUser.phone || "Chưa cập nhật"}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Tabs */}
                <div className="col-span-1 lg:col-span-2 flex flex-col gap-y-6">
                    <div className="card shadow-sm bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 p-0 overflow-hidden">
                        
                        {/* Tab Headers */}
                        <div className="flex px-4 border-b border-slate-200 dark:border-slate-800">
                            <button 
                                onClick={() => setActiveTab("info")}
                                className={`flex items-center gap-x-2 px-4 py-4 text-sm font-medium border-b-2 transition-colors ${
                                    activeTab === "info" 
                                    ? "border-blue-600 text-blue-600 dark:border-blue-500 dark:text-blue-400" 
                                    : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                                }`}
                            >
                                <User size={18} /> Thông tin chi tiết
                            </button>
                            <button 
                                onClick={() => setActiveTab("security")}
                                className={`flex items-center gap-x-2 px-4 py-4 text-sm font-medium border-b-2 transition-colors ${
                                    activeTab === "security" 
                                    ? "border-blue-600 text-blue-600 dark:border-blue-500 dark:text-blue-400" 
                                    : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                                }`}
                            >
                                <Key size={18} /> Đổi mật khẩu
                            </button>
                        </div>

                        {/* Tab Content */}
                        <div className="p-6">
                            
                            {/* Tab 1: Info */}
                            {activeTab === "info" && (
                                <form onSubmit={handleSaveInfo} className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">Thông tin cá nhân</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="flex flex-col gap-y-2 group">
                                            <label className={`text-xs font-semibold uppercase tracking-wider mb-1 ml-1 transition-colors ${isEditingMode ? 'text-slate-500 group-focus-within:text-blue-500' : 'text-slate-400'}`}>Họ và tên</label>
                                            <div className="relative">
                                                <div className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none transition-colors ${isEditingMode ? 'text-slate-400 group-focus-within:text-blue-500' : 'text-slate-300 dark:text-slate-600'}`}>
                                                    <User size={18} />
                                                </div>
                                                <input 
                                                    type="text" 
                                                    name="name"
                                                    value={formData.name}
                                                    onChange={handleInputChange}
                                                    readOnly={!isEditingMode}
                                                    className={`w-full pl-10 pr-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl text-sm transition-all shadow-sm outline-none ${isEditingMode ? 'bg-slate-50/50 dark:bg-slate-900/50 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500' : 'bg-slate-100/50 dark:bg-slate-800/30 text-slate-500 cursor-not-allowed'}`} 
                                                />
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-y-2 group">
                                            <label className={`text-xs font-semibold uppercase tracking-wider mb-1 ml-1 transition-colors ${isEditingMode ? 'text-slate-500 group-focus-within:text-blue-500' : 'text-slate-400'}`}>Tên đăng nhập</label>
                                            <div className="relative">
                                                <div className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none transition-colors ${isEditingMode ? 'text-slate-400 group-focus-within:text-blue-500' : 'text-slate-300 dark:text-slate-600'}`}>
                                                    <Shield size={18} />
                                                </div>
                                                <input 
                                                    type="text" 
                                                    name="username"
                                                    value={formData.username}
                                                    onChange={handleInputChange}
                                                    readOnly={!isEditingMode}
                                                    className={`w-full pl-10 pr-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl text-sm transition-all shadow-sm outline-none ${isEditingMode ? 'bg-slate-50/50 dark:bg-slate-900/50 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500' : 'bg-slate-100/50 dark:bg-slate-800/30 text-slate-500 cursor-not-allowed'}`} 
                                                />
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-y-2 group">
                                            <label className={`text-xs font-semibold uppercase tracking-wider mb-1 ml-1 transition-colors ${isEditingMode ? 'text-slate-500 group-focus-within:text-blue-500' : 'text-slate-400'}`}>Email liên hệ</label>
                                            <div className="relative">
                                                <div className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none transition-colors ${isEditingMode ? 'text-slate-400 group-focus-within:text-blue-500' : 'text-slate-300 dark:text-slate-600'}`}>
                                                    <Mail size={18} />
                                                </div>
                                                <input 
                                                    type="email" 
                                                    name="email"
                                                    value={formData.email}
                                                    onChange={handleInputChange}
                                                    readOnly={!isEditingMode}
                                                    className={`w-full pl-10 pr-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl text-sm transition-all shadow-sm outline-none ${isEditingMode ? 'bg-slate-50/50 dark:bg-slate-900/50 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500' : 'bg-slate-100/50 dark:bg-slate-800/30 text-slate-500 cursor-not-allowed'}`} 
                                                />
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-y-2 group">
                                            <label className={`text-xs font-semibold uppercase tracking-wider mb-1 ml-1 transition-colors ${isEditingMode ? 'text-slate-500 group-focus-within:text-blue-500' : 'text-slate-400'}`}>Số điện thoại</label>
                                            <div className="relative">
                                                <div className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none transition-colors ${isEditingMode ? 'text-slate-400 group-focus-within:text-blue-500' : 'text-slate-300 dark:text-slate-600'}`}>
                                                    <Phone size={18} />
                                                </div>
                                                <input 
                                                    type="text" 
                                                    name="phone"
                                                    value={formData.phone}
                                                    onChange={handleInputChange}
                                                    readOnly={!isEditingMode}
                                                    className={`w-full pl-10 pr-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl text-sm transition-all shadow-sm outline-none ${isEditingMode ? 'bg-slate-50/50 dark:bg-slate-900/50 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500' : 'bg-slate-100/50 dark:bg-slate-800/30 text-slate-500 cursor-not-allowed'}`} 
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    {isEditingMode && (
                                        <div className="mt-8 flex justify-end animate-in fade-in duration-300 slide-in-from-bottom-2">
                                            <button 
                                                type="submit" 
                                                disabled={isSaving}
                                                className="relative flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 disabled:opacity-70 text-white px-8 py-3 rounded-xl font-bold uppercase tracking-wider transition-all shadow-[0_0_15px_rgba(37,99,235,0.3)] hover:shadow-[0_0_25px_rgba(37,99,235,0.5)] overflow-hidden group"
                                            >
                                                <span className="relative z-10">{isSaving ? "Đang lưu..." : "Lưu Thay Đổi"}</span>
                                                <div className="absolute top-0 -inset-full h-full w-1/2 z-0 block transform -skew-x-12 bg-white/20 group-hover:animate-[shine_1s_infinite]" />
                                            </button>
                                        </div>
                                    )}
                                </form>
                            )}

                            {/* Tab 2: Security */}
                            {activeTab === "security" && (
                                <form onSubmit={handleSavePassword} className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">Đổi mật khẩu</h3>
                                    <div className="flex flex-col gap-y-5 max-w-md">
                                        <div className="flex flex-col gap-y-2 group">
                                            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 ml-1 group-focus-within:text-blue-500 dark:group-focus-within:text-blue-400 transition-colors">Mật khẩu hiện tại</label>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
                                                    <Key size={18} />
                                                </div>
                                                <input 
                                                    type="password" 
                                                    name="currentPassword"
                                                    value={formData.currentPassword}
                                                    onChange={handleInputChange}
                                                    disabled={isSaving}
                                                    autoComplete="current-password"
                                                    placeholder="••••••••" 
                                                    className="w-full pl-10 pr-4 py-3 bg-slate-50/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all shadow-sm" 
                                                />
                                            </div>
                                        </div>

                                        <div className="h-px bg-slate-100 dark:bg-slate-800 my-2"></div>

                                        <div className="flex flex-col gap-y-2 group">
                                            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 ml-1 group-focus-within:text-emerald-500 dark:group-focus-within:text-emerald-400 transition-colors">Mật khẩu mới</label>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 dark:text-slate-500 group-focus-within:text-emerald-500 dark:group-focus-within:text-emerald-400 transition-colors">
                                                    <Key size={18} />
                                                </div>
                                                <input 
                                                    type="password" 
                                                    name="newPassword"
                                                    value={formData.newPassword}
                                                    onChange={handleInputChange}
                                                    disabled={isSaving}
                                                    autoComplete="new-password"
                                                    placeholder="••••••••" 
                                                    className="w-full pl-10 pr-4 py-3 bg-slate-50/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all shadow-sm" 
                                                />
                                            </div>
                                        </div>

                                        <div className="flex flex-col gap-y-2 group">
                                            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 ml-1 group-focus-within:text-emerald-500 dark:group-focus-within:text-emerald-400 transition-colors">Xác nhận mật khẩu mới</label>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 dark:text-slate-500 group-focus-within:text-emerald-500 dark:group-focus-within:text-emerald-400 transition-colors">
                                                    <CheckCircle2 size={18} />
                                                </div>
                                                <input 
                                                    type="password" 
                                                    name="confirmPassword"
                                                    value={formData.confirmPassword}
                                                    onChange={handleInputChange}
                                                    disabled={isSaving}
                                                    autoComplete="new-password"
                                                    placeholder="••••••••" 
                                                    className="w-full pl-10 pr-4 py-3 bg-slate-50/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all shadow-sm" 
                                                />
                                            </div>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">Mật khẩu mới phải bao gồm ít nhất 6 ký tự và không được trùng với mật khẩu cũ.</p>
                                        </div>

                                        <div className="mt-4">
                                            <button 
                                                type="submit" 
                                                disabled={isSaving}
                                                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 disabled:opacity-70 text-white px-6 py-3.5 rounded-xl font-bold uppercase tracking-wider transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:shadow-[0_0_25px_rgba(16,185,129,0.5)] overflow-hidden group relative"
                                            >
                                                <span className="relative z-10">{isSaving ? "Đang xử lý..." : "Xác Nhận Đổi Mật Khẩu"}</span>
                                                <div className="absolute top-0 -inset-full h-full w-1/2 z-0 block transform -skew-x-12 bg-white/20 group-hover:animate-[shine_1s_infinite]" />
                                            </button>
                                        </div>
                                    </div>
                                </form>
                            )}

                        </div>
                    </div>
                </div>
            </div>

            {/* ===== TOAST NOTIFICATION ===== */}
            {toast && (
                <div className={`fixed bottom-6 right-6 z-[200] flex items-center gap-3 px-5 py-3 rounded-xl shadow-lg border animate-in slide-in-from-bottom-4 duration-300 ${
                    toast.type === 'error'
                        ? 'bg-rose-50 dark:bg-rose-900/30 border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-400'
                        : 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400'
                }`}>
                    {toast.type === 'error' ? (
                        <AlertTriangle size={18} className="text-rose-500 dark:text-rose-400 flex-shrink-0" />
                    ) : (
                        <CheckCircle2 size={18} className="text-blue-500 dark:text-blue-400 flex-shrink-0" />
                    )}
                    <span className="text-sm font-medium">{toast.message}</span>
                    <button onClick={() => setToast(null)} className="ml-2 text-current opacity-50 hover:opacity-100 transition-opacity">
                        <X size={14} />
                    </button>
                </div>
            )}

            <Footer />
        </div>
    );
};

export default ProfilePage;
