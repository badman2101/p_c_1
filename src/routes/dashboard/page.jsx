import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";
import { useTheme } from "@/hooks/use-theme";
import { incidentsData, recentPetitionsData, activeCasesData } from "@/constants";
import { Footer } from "@/layouts/footer";
import { ShieldAlert, Mail, Users, Siren, TrendingUp, AlertCircle, FileText, ChevronRight } from "lucide-react";

const DashboardPage = () => {
    const { theme } = useTheme();

    return (
        <div className="flex flex-col gap-y-6">
            <div className="flex items-end justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Tổng quan nghiệp vụ</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Báo cáo tình hình an ninh trật tự và xử lý đơn thư</p>
                </div>
            </div>

            {/* Top Stat Cards */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                <div className="card border-l-4 border-l-blue-600 dark:border-l-blue-500 shadow-sm border-transparent dark:border-transparent bg-white dark:bg-[#0f172a]">
                    <div className="card-header justify-between">
                        <div>
                            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Tổng số vụ án xử lý</p>
                            <p className="text-3xl font-bold text-slate-900 dark:text-white mt-1">1,250</p>
                        </div>
                        <div className="rounded-xl bg-blue-50 p-3 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400">
                            <ShieldAlert size={24} />
                        </div>
                    </div>
                    <div className="mt-4 flex items-center text-sm font-medium text-emerald-600 dark:text-emerald-400">
                        <TrendingUp size={16} className="mr-1" />
                        <span>+12.5% so với tháng trước</span>
                    </div>
                </div>

                <div className="card border-l-4 border-l-rose-500 shadow-sm border-transparent dark:border-transparent bg-white dark:bg-[#0f172a]">
                    <div className="card-header justify-between">
                        <div>
                            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Đơn thư chờ xử lý</p>
                            <p className="text-3xl font-bold text-slate-900 dark:text-white mt-1">45</p>
                        </div>
                        <div className="rounded-xl bg-rose-50 p-3 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400">
                            <Mail size={24} />
                        </div>
                    </div>
                    <div className="mt-4 flex items-center text-sm font-medium text-emerald-600 dark:text-emerald-400">
                        <TrendingUp size={16} className="mr-1 rotate-180 text-rose-600" />
                        <span className="text-rose-600">-5 theo tuần</span>
                    </div>
                </div>

                <div className="card border-l-4 border-l-amber-500 shadow-sm border-transparent dark:border-transparent bg-white dark:bg-[#0f172a]">
                    <div className="card-header justify-between">
                        <div>
                            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Cán bộ thường trực</p>
                            <p className="text-3xl font-bold text-slate-900 dark:text-white mt-1">204</p>
                        </div>
                        <div className="rounded-xl bg-amber-50 p-3 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
                            <Users size={24} />
                        </div>
                    </div>
                    <div className="mt-4 flex items-center text-sm font-medium text-slate-500">
                        <span>Trực ban và chuyên án</span>
                    </div>
                </div>

                <div className="card border-l-4 border-l-emerald-500 shadow-sm border-transparent dark:border-transparent bg-white dark:bg-[#0f172a]">
                    <div className="card-header justify-between">
                        <div>
                            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Nhiệm vụ tuần tra</p>
                            <p className="text-3xl font-bold text-slate-900 dark:text-white mt-1">32</p>
                        </div>
                        <div className="rounded-xl bg-emerald-50 p-3 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                            <Siren size={24} />
                        </div>
                    </div>
                    <div className="mt-4 flex items-center text-sm font-medium text-slate-500">
                        <span>Cập nhật 10 phút trước</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-7">
                {/* Chart */}
                <div className="card col-span-1 lg:col-span-5 h-[450px] shadow-sm bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800">
                    <div className="card-header justify-between items-center mb-4">
                        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Thống kê số lượng vụ việc/tháng</h2>
                    </div>
                    <div className="flex-1 w-full h-full pb-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={incidentsData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorIncidents" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#2563eb" stopOpacity={0.4}/>
                                        <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === "light" ? "#e2e8f0" : "#1e293b"} />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tickMargin={10} stroke={theme === "light" ? "#64748b" : "#94a3b8"} fontSize={12} />
                                <YAxis axisLine={false} tickLine={false} tickMargin={10} stroke={theme === "light" ? "#64748b" : "#94a3b8"} fontSize={12} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', backgroundColor: theme === "dark" ? "#0f172a" : "#fff"  }}
                                    itemStyle={{ color: '#2563eb', fontWeight: '500' }}
                                />
                                <Area type="monotone" dataKey="total" name="Số vụ việc" stroke="#2563eb" strokeWidth={3} fillOpacity={1} fill="url(#colorIncidents)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Right side Panel */}
                <div className="card col-span-1 lg:col-span-2 flex flex-col h-[450px] shadow-sm bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800">
                    <div className="card-header justify-between items-center mb-4">
                        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Đơn thư mới tiếp nhận</h2>
                        <button className="text-blue-600 hover:text-blue-700 dark:text-blue-400 text-sm font-medium transition-colors">Xem tất cả</button>
                    </div>
                    <div className="flex-1 overflow-y-auto pr-2 space-y-4 [scrollbar-width:_thin]">
                        {recentPetitionsData.map((petition) => (
                            <div key={petition.id} className="flex items-start gap-x-3 rounded-lg border border-slate-100 p-3 hover:bg-slate-50 transition-colors dark:border-slate-800 dark:hover:bg-slate-800/50">
                                <div className="mt-1 h-10 w-10 shrink-0 overflow-hidden rounded-full bg-slate-200">
                                    <img src={petition.image} alt={petition.name} className="h-full w-full object-cover" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-semibold text-slate-900 dark:text-white">{petition.name}</p>
                                    <p className="text-xs text-slate-500 line-clamp-1">{petition.total}</p>
                                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-1 font-medium flex items-center">
                                        <AlertCircle size={12} className="mr-1"/> Mới
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Bottom table for active cases */}
            <div className="card overflow-hidden shadow-sm bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 p-0">
                <div className="card-header justify-between items-center bg-slate-50/50 dark:bg-slate-800/40 p-4 border-b border-slate-200 dark:border-slate-800">
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Trọng án & Chuyên án đang điều tra</h2>
                    <button className="flex items-center text-sm font-medium text-slate-600 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 transition-colors">
                        Danh sách chi tiết <ChevronRight size={16} className="ml-1" />
                    </button>
                </div>
                <div className="overflow-x-auto [scrollbar-width:_thin]">
                    <table className="w-full text-left border-collapse min-w-[800px]">
                        <thead>
                            <tr className="border-b border-slate-200 bg-slate-50 text-sm font-semibold text-slate-600 dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-400">
                                <th className="py-4 px-6 whitespace-nowrap">Mã Vụ Án</th>
                                <th className="py-4 px-6 whitespace-nowrap">Tên Vụ Án / Chuyên Án</th>
                                <th className="py-4 px-6 whitespace-nowrap">Mức Độ</th>
                                <th className="py-4 px-6 whitespace-nowrap">Tiến Độ / Trạng Thái</th>
                                <th className="py-4 px-6 whitespace-nowrap text-right">Đánh Giá</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-sm">
                            {activeCasesData.map((caseItem, idx) => (
                                <tr key={idx} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors">
                                    <td className="py-4 px-6 font-medium text-slate-900 dark:text-white">
                                        <div className="flex items-center whitespace-nowrap">
                                            <FileText size={16} className="mr-2 text-blue-500" />
                                            {caseItem.number}
                                        </div>
                                    </td>
                                    <td className="py-4 px-6">
                                        <p className="font-semibold text-slate-900 dark:text-white">{caseItem.name}</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-1 max-w-[300px]">{caseItem.description}</p>
                                    </td>
                                    <td className="py-4 px-6">
                                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap
                                            ${caseItem.price === 'Cao' ? 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-400' : 
                                              'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-400'}`}>
                                            {caseItem.price}
                                        </span>
                                    </td>
                                    <td className="py-4 px-6 font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap">
                                        {caseItem.status}
                                    </td>
                                    <td className="py-4 px-6 text-right font-medium text-slate-900 dark:text-white whitespace-nowrap">
                                        {caseItem.rating}/5.0
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <Footer />
        </div>
    );
};

export default DashboardPage;
