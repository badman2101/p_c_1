import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "@/hooks/use-theme";
import { Bell, ChevronsLeft, Moon, Search, Sun, User, LogOut, Settings, MessageSquare, FileText } from "lucide-react";
import profileImg from "@/assets/profile-image.jpg";
import PropTypes from "prop-types";

export const Header = ({ collapsed, setCollapsed }) => {
    const { theme, setTheme } = useTheme();
    const navigate = useNavigate();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [user, setUser] = useState(null);
    const modalRef = useRef(null);

    const toggleModal = () => {
        setIsModalOpen(!isModalOpen);
    };

    const handleClickOutside = (event) => {
        if (modalRef.current && !modalRef.current.contains(event.target)) {
            setIsModalOpen(false);
        }
    };

    useEffect(() => {
        document.addEventListener("mousedown", handleClickOutside);
        
        const token = localStorage.getItem('token');
        if (token) {
            try {
                setUser(JSON.parse(token));
            } catch (e) {
                console.error("Lỗi get user info", e);
            }
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const HandleLogout = () => {
        localStorage.removeItem('token');
        window.location.href = '/login';
    }

    return (
        <header className="relative z-10 flex h-[64px] items-center justify-between bg-white px-6 shadow-sm border-b border-slate-200 transition-colors dark:border-slate-800 dark:bg-[#0f172a]">
            <div className="flex items-center gap-x-4">
                <button
                    className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-500 hover:bg-blue-50 hover:text-blue-600 transition-all dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-blue-900/50 dark:hover:text-blue-400"
                    onClick={() => setCollapsed(!collapsed)}
                >
                    <ChevronsLeft className={`transition-transform duration-300 ${collapsed ? "rotate-180" : ""}`} size={20} />
                </button>
                {/* <div className="hidden items-center gap-x-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 transition-all focus-within:border-blue-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-100 dark:border-slate-700 dark:bg-slate-800/50 dark:focus-within:border-blue-500 dark:focus-within:bg-slate-800 dark:focus-within:ring-blue-900/50 md:flex md:w-80">
                    <Search size={18} className="text-slate-400" />
                    <input
                        type="text"
                        placeholder="Tìm kiếm hồ sơ, vụ án..."
                        className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400 dark:text-slate-50"
                    />
                </div> */}
            </div>
            
            <div className="relative flex items-center gap-x-3">
                <button
                    className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-slate-100 transition-colors dark:hover:bg-slate-800"
                    onClick={() => setTheme(theme === "light" ? "dark" : "light")}
                >
                    <Sun size={20} className="text-slate-500 dark:hidden" />
                    <Moon size={20} className="hidden text-slate-400 dark:block" />
                </button>
                
                <div className="flex items-center gap-x-1 sm:gap-x-2">
                    {/* Tin nhắn nội bộ */}
                    {/* <button 
                        className="relative flex h-10 w-10 items-center justify-center rounded-full hover:bg-slate-100 transition-colors dark:hover:bg-slate-800"
                        title="Tin nhắn nội bộ"
                    >
                        <MessageSquare size={19} className="text-slate-500 dark:text-slate-400" />
                        <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-blue-500 text-[10px] font-bold text-white ring-2 ring-white dark:ring-[#0f172a]">
                            3
                        </span>
                    </button> */}

                    {/* Đơn thư (quá hạn hoặc cần xử lý) */}
                    {/* <button 
                        onClick={() => navigate('/don_thu')}
                        className="relative flex h-10 w-10 items-center justify-center rounded-full hover:bg-slate-100 transition-colors dark:hover:bg-slate-800"
                        title="Đơn thư quá hạn"
                    >
                        <FileText size={19} className="text-slate-500 dark:text-slate-400" />
                        <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white ring-2 ring-white dark:ring-[#0f172a] animate-pulse">
                            2
                        </span>
                    </button> */}

                    {/* Thông báo chung */}
                    {/* <button 
                        className="relative flex h-10 w-10 items-center justify-center rounded-full hover:bg-slate-100 transition-colors dark:hover:bg-slate-800"
                        title="Thông báo hệ thống"
                    >
                        <Bell size={19} className="text-slate-500 dark:text-slate-400" />
                        <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-white ring-2 ring-white dark:ring-[#0f172a]">
                            5
                        </span>
                    </button> */}
                </div>

                <div className="h-6 w-[1px] bg-slate-200 dark:bg-slate-700 mx-1"></div>
                
                <div className="relative flex items-center gap-x-3" ref={modalRef}>
                    <div className="hidden flex-col items-end md:flex">
                        <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{user?.name || "Người dùng"}</span>
                        <span className="text-xs text-slate-500 dark:text-slate-400 capitalize">{user?.role === 'super admin' ? 'Super Admin' : user?.role === 'admin' ? 'Admin' : 'Người dùng'}</span>
                    </div>
                    <button
                        className="h-10 w-10 overflow-hidden rounded-full border-2 border-slate-200 hover:border-blue-500 transition-colors dark:border-slate-700 dark:hover:border-blue-500"
                        onClick={toggleModal}
                    >
                        <img
                            src={profileImg}
                            alt="Profile"
                            className="h-full w-full object-cover"
                        />
                    </button>
                    
                    {isModalOpen && (
                        <div className="absolute right-0 top-12 mt-2 w-56 rounded-xl border border-slate-100 bg-white p-2 shadow-xl dark:border-slate-800 dark:bg-slate-900 animate-in fade-in slide-in-from-top-2 duration-200 z-50">
                            <div className="px-2 py-2 mb-2 border-b border-slate-100 dark:border-slate-800">
                                <p className="text-sm font-semibold text-slate-900 dark:text-white">{user?.name || "Người dùng"}</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">{user?.email || "Chưa cập nhật email"}</p>
                            </div>
                            <button onClick={() => { setIsModalOpen(false); navigate('/ho_so'); }} className="flex w-full items-center gap-x-2 rounded-lg px-2 py-2 text-sm text-slate-700 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white">
                                <User size={16} />
                                Hồ sơ cá nhân
                            </button>
                            {/* <button className="flex w-full items-center gap-x-2 rounded-lg px-2 py-2 text-sm text-slate-700 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white">
                                <Settings size={16} />
                                Cài đặt hệ thống
                            </button> */}
                            <div className="my-1 h-[1px] w-full bg-slate-100 dark:bg-slate-800"></div>
                            <button onClick={HandleLogout} className="flex w-full items-center gap-x-2 rounded-lg px-2 py-2 text-sm text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30">
                                <LogOut size={16} />
                                Đăng xuất
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};

Header.propTypes = {
    collapsed: PropTypes.bool,
    setCollapsed: PropTypes.func,
};
