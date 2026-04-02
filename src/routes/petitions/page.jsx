import React, { useState, useMemo } from 'react';
import { Plus, Search, Edit3, Trash2, Eye, X, Mail, Filter, AlertTriangle, CheckCircle2, Clock, Inbox, Calendar, FileText } from 'lucide-react';

export default function PetitionsPage() {
    const today = new Date().toISOString().split('T')[0];
    
    // Giả lập dữ liệu có đơn quá hạn (ngày cũ hơn 5 ngày và chưa Resolved)
    const [petitions, setPetitions] = useState([
        { id: 'DT-001', sender: 'Nguyễn Văn A', date: '2026-04-01', subject: 'Phản ánh tiếng ồn khu dân cư', status: 'Pending', content: 'Khu vực liên tục có tiếng ồn lớn sau 10h đêm.' },
        { id: 'DT-002', sender: 'Trần Thị B', date: '2026-03-24', subject: 'Tố cáo hành vi lừa đảo qua mạng', status: 'Processing', content: 'Một số đối tượng lợi dụng danh nghĩa...' }, // Quá hạn
        { id: 'DT-003', sender: 'Lê Hoàng C', date: '2026-03-25', subject: 'Khen ngợi lực lượng CA phường', status: 'Resolved', content: 'Tôi xin gửi lời cảm ơn tới các đồng chí...' },
        { id: 'DT-004', sender: 'Phạm Văn D', date: '2026-03-10', subject: 'Lấn chiếm lòng lề đường', status: 'Pending', content: 'Hàng quán lấn chiếm gây ách tắc...' }, // Quá hạn
        { id: 'DT-005', sender: 'Hoàng Thị E', date: '2026-04-02', subject: 'Hỏi về thủ tục làm CCCD', status: 'Resolved', content: 'Tôi muốn hỏi thời gian cấp thẻ...' },
    ]);

    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('All'); 
    const [alertFilter, setAlertFilter] = useState('All'); 

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState('add'); 
    const [currentPetition, setCurrentPetition] = useState(null);

    const checkIfOverdue = (dateStr, status) => {
        if (status === 'Resolved' || status === 'Rejected') return false;
        const submitDate = new Date(dateStr);
        const currentDate = new Date();
        const diffTime = Math.abs(currentDate - submitDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays > 5; 
    };

    const filteredPetitions = useMemo(() => {
        return petitions.filter(p => {
            const matchSearch = p.sender.toLowerCase().includes(searchQuery.toLowerCase()) || p.subject.toLowerCase().includes(searchQuery.toLowerCase());
            const matchStatus = statusFilter === 'All' ? true : p.status === statusFilter;
            const isOverdue = checkIfOverdue(p.date, p.status);
            const matchAlert = alertFilter === 'All' ? true : (alertFilter === 'Overdue' ? isOverdue : !isOverdue);
            
            return matchSearch && matchStatus && matchAlert;
        }).sort((a, b) => new Date(b.date) - new Date(a.date)); 
    }, [petitions, searchQuery, statusFilter, alertFilter]);

    const stats = useMemo(() => {
        let total = petitions.length;
        let pending = 0;
        let resolved = 0;
        let overdue = 0;
        
        petitions.forEach(p => {
            if (p.status === 'Pending' || p.status === 'Processing') pending++;
            if (p.status === 'Resolved') resolved++;
            if (checkIfOverdue(p.date, p.status)) overdue++;
        });

        return { total, pending, resolved, overdue };
    }, [petitions]);

    const openModal = (mode, petition = null) => {
        setModalMode(mode);
        setCurrentPetition(petition || { id: `DT-00${petitions.length + 1}`, sender: '', date: today, subject: '', status: 'Pending', content: '' });
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setCurrentPetition(null);
    };

    const handleSave = (e) => {
        e.preventDefault();
        if (modalMode === 'add') {
            setPetitions([currentPetition, ...petitions]);
        } else if (modalMode === 'edit') {
            setPetitions(petitions.map(p => p.id === currentPetition.id ? currentPetition : p));
        }
        closeModal();
    };

    const handleDelete = (id) => {
        if(window.confirm('Bạn có chắc chắn muốn xóa đơn thư này?')) {
            setPetitions(petitions.filter(p => p.id !== id));
        }
    };

    const getStatusTheme = (status) => {
        switch(status) {
            case 'Pending': return { bg: 'bg-amber-50', text: 'text-amber-600', dot: 'bg-amber-500', label: 'Chờ xử lý' };
            case 'Processing': return { bg: 'bg-blue-50', text: 'text-blue-600', dot: 'bg-blue-500', label: 'Đang GQ' };
            case 'Resolved': return { bg: 'bg-emerald-50', text: 'text-emerald-600', dot: 'bg-emerald-500', label: 'Đã giải quyết' };
            case 'Rejected': return { bg: 'bg-slate-100', text: 'text-slate-600', dot: 'bg-slate-400', label: 'Từ chối' };
            default: return { bg: 'bg-slate-50', text: 'text-slate-500', dot: 'bg-slate-400', label: status };
        }
    };

    return (
        <div className="flex flex-col h-full gap-6 w-full max-w-[1400px] mx-auto p-4 md:p-6 pb-12 animation-fade-in text-slate-700 bg-[#f8fafc]">
            {/* Header Area (Softer, harmonious) */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-semibold text-slate-800 tracking-tight flex items-center gap-2">
                        <FileText size={24} className="text-blue-600" />
                        Quản lý Đơn Thư
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">
                        Theo dõi và xử lý các phản ánh, khiếu nại của công dân
                    </p>
                </div>
                <button 
                    onClick={() => openModal('add')}
                    className="flex items-center gap-2 bg-blue-600 text-white hover:bg-blue-700 px-5 py-2.5 rounded-lg font-medium transition-colors shadow-sm active:scale-95"
                >
                    <Plus size={18} />
                    Thêm đơn thư mới
                </button>
            </div>

            {/* Stat Cards (Clean & Minimalist) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Tổng số đơn', value: stats.total, icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50' },
                    { label: 'Đang xử lý', value: stats.pending, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
                    { label: 'Quá hạn', value: stats.overdue, icon: AlertTriangle, color: 'text-rose-600', bg: 'bg-rose-50', highlight: stats.overdue > 0 },
                    { label: 'Hoàn thành', value: stats.resolved, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' }
                ].map((stat, idx) => (
                    <div key={idx} className={`bg-white p-5 rounded-xl border ${stat.highlight ? 'border-rose-200' : 'border-slate-200/60'} shadow-sm flex items-center gap-4`}>
                        <div className={`p-3 rounded-lg ${stat.bg} ${stat.color}`}>
                            <stat.icon size={20} />
                        </div>
                        <div>
                            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-0.5">{stat.label}</p>
                            <h3 className={`text-xl font-semibold ${stat.highlight ? 'text-rose-600' : 'text-slate-800'}`}>{stat.value}</h3>
                        </div>
                    </div>
                ))}
            </div>

            {/* Main Content Area (Clean Table) */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200/60 overflow-hidden flex flex-col flex-1">
                
                {/* Toolbar */}
                <div className="p-4 border-b border-slate-100 flex flex-col lg:flex-row justify-between items-center gap-4">
                    <div className="relative w-full lg:w-[320px]">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input 
                            type="text" 
                            placeholder="Tìm kiếm..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors text-sm text-slate-700"
                        />
                    </div>

                    <div className="flex items-center gap-3 w-full lg:w-auto">
                        <div className="relative w-full lg:w-auto">
                            <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <select 
                                value={statusFilter} 
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="w-full lg:w-auto pl-8 pr-8 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-600 focus:outline-none focus:border-blue-500 appearance-none cursor-pointer"
                            >
                                <option value="All">Tất cả tình trạng</option>
                                <option value="Pending">Chờ xử lý</option>
                                <option value="Processing">Đang GQ</option>
                                <option value="Resolved">Đã giải quyết</option>
                                <option value="Rejected">Từ chối</option>
                            </select>
                        </div>
                        
                        <div className="relative w-full lg:w-auto">
                            <AlertTriangle size={14} className={`absolute left-3 top-1/2 -translate-y-1/2 ${alertFilter === 'Overdue' ? 'text-rose-500' : 'text-slate-400'}`} />
                            <select 
                                value={alertFilter} 
                                onChange={(e) => setAlertFilter(e.target.value)}
                                className={`w-full lg:w-auto pl-8 pr-8 py-2 border rounded-lg text-sm focus:outline-none appearance-none cursor-pointer transition-colors ${alertFilter === 'Overdue' ? 'bg-rose-50 border-rose-200 text-rose-700 focus:border-rose-500' : 'bg-white border-slate-200 text-slate-600 focus:border-blue-500'}`}
                            >
                                <option value="All">Mọi cảnh báo</option>
                                <option value="Overdue">Chỉ đơn quá hạn</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto relative">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100 text-slate-500 text-xs font-semibold uppercase tracking-wide">
                                <th className="py-4 px-5 whitespace-nowrap w-[100px]">Mã Đơn</th>
                                <th className="py-4 px-5 w-[180px]">Người Gửi</th>
                                <th className="py-4 px-5 min-w-[280px]">Tiêu Đề & Nội Dung</th>
                                <th className="py-4 px-5 whitespace-nowrap w-[140px]">Tình Trạng</th>
                                <th className="py-4 px-5 text-right w-[120px]">Thao Tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredPetitions.map((petition) => {
                                const isOverdue = checkIfOverdue(petition.date, petition.status);
                                const theme = getStatusTheme(petition.status);
                                
                                return (
                                    <tr 
                                        key={petition.id} 
                                        className={`hover:bg-slate-50/80 transition-colors group ${isOverdue ? 'bg-rose-50/30' : ''}`}
                                    >
                                        <td className="py-4 px-5 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                {isOverdue && <div className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-pulse flex-shrink-0" title="Quá hạn xử lý"></div>}
                                                <span className="text-sm font-medium text-slate-700">{petition.id}</span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-5">
                                            <div className="text-sm font-medium text-slate-800">{petition.sender}</div>
                                            <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                                                <Calendar size={12} /> {petition.date}
                                            </div>
                                        </td>
                                        <td className="py-4 px-5 pr-8">
                                            <div className="text-sm font-medium text-slate-800 mb-0.5 line-clamp-1" title={petition.subject}>{petition.subject}</div>
                                            <div className="flex items-center gap-x-3 text-xs">
                                                <span className="text-slate-500 line-clamp-1">{petition.content}</span>
                                                {isOverdue && <span className="text-rose-600 bg-rose-100/50 px-1.5 py-0.5 rounded text-[10px] font-medium border border-rose-100 flex-shrink-0">Quá hạn</span>}
                                            </div>
                                        </td>
                                        <td className="py-4 px-5">
                                            <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium ${theme.bg} ${theme.text}`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${theme.dot}`}></span>
                                                {theme.label}
                                            </div>
                                        </td>
                                        <td className="py-4 px-5 text-right whitespace-nowrap">
                                            <div className="flex items-center justify-end gap-1 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => openModal('view', petition)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors" title="Xem chi tiết">
                                                    <Eye size={16} />
                                                </button>
                                                <button onClick={() => openModal('edit', petition)} className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-md transition-colors" title="Chỉnh sửa">
                                                    <Edit3 size={16} />
                                                </button>
                                                <button onClick={() => handleDelete(petition.id)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors" title="Xóa">
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                            {filteredPetitions.length === 0 && (
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center text-slate-500">
                                        <Inbox size={40} className="mx-auto mb-3 text-slate-300" strokeWidth={1.5} />
                                        <p className="text-sm font-medium">Không tìm thấy đơn thư nào</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Simplistic, harmonious Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/30 backdrop-blur-sm animation-fade-in">
                    <div className="bg-white rounded-xl w-full max-w-2xl shadow-xl flex flex-col max-h-[90vh]">
                        
                        {/* Header */}
                        <div className="flex items-center justify-between p-5 border-b border-slate-100">
                            <h2 className="text-lg font-semibold text-slate-800">
                                {modalMode === 'add' ? 'Thêm mới đơn thư' : modalMode === 'edit' ? 'Cập nhật đơn thư' : 'Chi tiết đơn thư'}
                            </h2>
                            <button onClick={closeModal} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                                <X size={18} />
                            </button>
                        </div>
                        
                        {/* Body */}
                        <div className="p-5 md:p-6 overflow-y-auto custom-scrollbar flex-1">
                            {currentPetition && checkIfOverdue(currentPetition.date, currentPetition.status) && (
                                <div className="mb-5 bg-rose-50 border border-rose-100 text-rose-700 px-4 py-3 rounded-lg flex items-start gap-3">
                                    <AlertTriangle size={18} className="shrink-0 mt-0.5 text-rose-500" />
                                    <div>
                                        <h4 className="text-sm font-medium text-rose-800">Cảnh báo Quá hạn</h4>
                                        <p className="text-xs text-rose-600 mt-1">Đơn thư chưa được xử lý điểm và đã vượt khoảng thời gian 5 ngày.</p>
                                    </div>
                                </div>
                            )}

                            <form id="petitionForm" onSubmit={handleSave} className="space-y-5">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-slate-600">Mã đơn nhận</label>
                                        <input 
                                            type="text" value={currentPetition?.id || ''} disabled 
                                            className="w-full px-4 py-2.5 bg-slate-50 text-slate-500 border border-slate-200 rounded-lg text-sm"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-slate-600">Người gửi <span className="text-rose-500">*</span></label>
                                        <input 
                                            type="text" required disabled={modalMode === 'view'}
                                            value={currentPetition?.sender || ''} onChange={(e) => setCurrentPetition({...currentPetition, sender: e.target.value})}
                                            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors disabled:bg-slate-50"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-slate-600">Ngày gửi <span className="text-rose-500">*</span></label>
                                        <input 
                                            type="date" required disabled={modalMode === 'view'}
                                            value={currentPetition?.date || ''} onChange={(e) => setCurrentPetition({...currentPetition, date: e.target.value})}
                                            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors disabled:bg-slate-50"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-slate-600">Tình trạng <span className="text-rose-500">*</span></label>
                                        <select 
                                            disabled={modalMode === 'view'}
                                            value={currentPetition?.status || 'Pending'} onChange={(e) => setCurrentPetition({...currentPetition, status: e.target.value})}
                                            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors appearance-none disabled:bg-slate-50"
                                        >
                                            <option value="Pending">Chờ xử lý</option>
                                            <option value="Processing">Đang giải quyết</option>
                                            <option value="Resolved">Đã giải quyết</option>
                                            <option value="Rejected">Từ chối</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-slate-600">Tiêu đề phản ánh <span className="text-rose-500">*</span></label>
                                    <input 
                                        type="text" required disabled={modalMode === 'view'}
                                        value={currentPetition?.subject || ''} onChange={(e) => setCurrentPetition({...currentPetition, subject: e.target.value})}
                                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors disabled:bg-slate-50"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-slate-600">Nội dung chi tiết <span className="text-rose-500">*</span></label>
                                    <textarea 
                                        required disabled={modalMode === 'view'}
                                        value={currentPetition?.content || ''} onChange={(e) => setCurrentPetition({...currentPetition, content: e.target.value})}
                                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors disabled:bg-slate-50 resize-none h-32"
                                    ></textarea>
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
                                    form="petitionForm" type="submit"
                                    className="px-5 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 shadow-sm transition-colors"
                                >
                                    Lưu thay đổi
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
            
            <style dangerouslySetInnerHTML={{__html: `
                .animation-fade-in { animation: fadeIn 0.3s ease-out; }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(5px); }
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
