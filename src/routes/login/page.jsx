import React, { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { notification } from 'antd'
import { loginApi } from '../../api/loginApi'
import { useNavigate } from 'react-router-dom'
import { Shield, Fingerprint, Lock, Mail, ChevronRight } from 'lucide-react'
import bgImage from '../../assets/login-bg.png'

function LoginPage() {
  const { register, handleSubmit, formState: { isSubmitting } } = useForm()
  const navigate = useNavigate()

  useEffect(() => {
    // Check if user is already logged in
    if (localStorage.getItem('token') || sessionStorage.getItem('token')) {
      navigate('/') // Redirect to home page if session exists
    }
  }, [navigate])

  const onSubmit = async data => {
    try {
      const response = await loginApi.login(data)
      if (response.status_code === 200 && response.info.role !== "user") {
        notification.success({
          message: 'Đăng nhập thành công',
          description: 'Chào mừng đồng chí quay trở lại hệ thống.',
          placement: 'topRight'
        })
        // Save user information to localStorage or sessionStorage
        localStorage.setItem('token', JSON.stringify(response.info))
        navigate('/') // Redirect to home page
      } else {
        notification.error({
          message: 'Đăng nhập thất bại',
          description: 'Tài khoản hoặc mật khẩu không chính xác.',
          placement: 'topRight'
        })
      }
    } catch (error) {
      notification.error({
        message: 'Lỗi hệ thống',
        description: 'Mất kết nối tới máy chủ. Vui lòng thử lại sau.',
        placement: 'topRight'
      })
    }
  }

  return (
    <div className="min-h-screen w-full relative flex items-center justify-center overflow-hidden bg-slate-950 font-sans">
      {/* Background Image with Overlay */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat transition-all duration-1000 scale-105 animate-pulse-slow"
        style={{ backgroundImage: `url(${bgImage})` }}
      >
        <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-[2px]"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-950/50 to-slate-950"></div>
      </div>

      {/* Animated Scanline Effect */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-20 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.5)_50%)] bg-[length:100%_4px]"></div>

      {/* Glowing Orbs */}
      <div className="absolute top-1/4 left-1/4 w-[30rem] h-[30rem] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-[30rem] h-[30rem] bg-cyan-600/20 rounded-full blur-[100px] pointer-events-none"></div>

      {/* Main Login Card */}
      <div className="relative z-10 w-full max-w-md px-6 animate-fade-in-up">
        <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-700/50 rounded-3xl shadow-2xl overflow-hidden relative">
          
          {/* Top colored accent bar */}
          <div className="h-1.5 w-full bg-gradient-to-r from-blue-600 via-cyan-400 to-blue-600 animate-gradient-x"></div>
          
          <div className="p-8 sm:p-10">
            <div className="flex flex-col items-center justify-center mb-10 text-center">
              <div className="w-20 h-20 bg-blue-950/80 border border-cyan-500/30 rounded-2xl flex items-center justify-center mb-6 shadow-[0_0_25px_rgba(6,182,212,0.4)] relative group overflow-hidden">
                <div className="absolute inset-0 bg-cyan-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <Shield className="w-10 h-10 text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-widest uppercase mb-2 text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400">
                Hệ Thống
              </h1>
              {/* <div className="flex items-center gap-3">
                <div className="h-[1px] w-8 bg-cyan-500/50"></div>
                <h2 className="text-xs sm:text-sm font-semibold text-cyan-400 tracking-[0.2em] uppercase">
                  Cục Cảnh Sát Điều Tra
                </h2>
                <div className="h-[1px] w-8 bg-cyan-500/50"></div>
              </div> */}
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div>
                <label className="block text-[10px] sm:text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2 ml-1" htmlFor="email">
                  Tài khoản 
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none transition-colors duration-300 group-focus-within:text-cyan-400 text-slate-500">
                    <Mail className="w-5 h-5" />
                  </div>
                  <input
                    id="email"
                    type="email"
                    className="block w-full pl-12 pr-4 py-3.5 bg-slate-950/50 border border-slate-700 text-slate-200 rounded-xl focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all duration-300 placeholder-slate-600 sm:text-sm shadow-inner"
                    placeholder="name@gmail.com"
                    {...register('email', { required: true })}
                  />
                  {/* Subtle input glow */}
                  <div className="absolute inset-0 -z-10 bg-cyan-500/0 rounded-xl blur-md group-focus-within:bg-cyan-500/10 transition-colors duration-500"></div>
                </div>
              </div>

              <div>
                <label className="block text-[10px] sm:text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2 ml-1" htmlFor="password">
                  Mật khẩu
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none transition-colors duration-300 group-focus-within:text-cyan-400 text-slate-500">
                    <Lock className="w-5 h-5" />
                  </div>
                  <input
                    id="password"
                    type="password"
                    className="block w-full pl-12 pr-12 py-3.5 bg-slate-950/50 border border-slate-700 text-slate-200 rounded-xl focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all duration-300 placeholder-slate-600 sm:text-sm shadow-inner"
                    placeholder="••••••••"
                    {...register('password', { required: true })}
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-cyan-500/50 group-focus-within:text-cyan-400 transition-colors duration-300">
                    <Fingerprint className="w-5 h-5" />
                  </div>
                  {/* Subtle input glow */}
                  <div className="absolute inset-0 -z-10 bg-cyan-500/0 rounded-xl blur-md group-focus-within:bg-cyan-500/10 transition-colors duration-500"></div>
                </div>
              </div>

              <div className="pt-6">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full flex justify-center items-center py-4 px-4 rounded-xl text-sm font-bold uppercase tracking-[0.15em] text-white bg-blue-600 hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 focus:ring-offset-slate-900 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed group relative overflow-hidden shadow-[0_0_20px_rgba(37,99,235,0.4)] hover:shadow-[0_0_30px_rgba(6,182,212,0.6)]"
                >
                  {/* Gradient background for button */}
                  <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-blue-700 via-blue-600 to-cyan-600 opacity-80"></div>
                  
                  <span className="relative z-10 flex items-center drop-shadow-[0_2px_2px_rgba(0,0,0,0.5)]">
                    {isSubmitting ? 'ĐANG KẾT NỐI...' : 'Đăng nhập'}
                    {!isSubmitting && <ChevronRight className="ml-2 w-5 h-5 group-hover:translate-x-1.5 transition-transform duration-300" />}
                  </span>
                  
                  {/* Button shine effect */}
                  <div className="absolute top-0 -inset-full h-full w-1/2 z-0 block transform -skew-x-12 bg-white/20 group-hover:animate-shine" />
                </button>
              </div>
            </form>

            {/* <div className="mt-10 pt-6 border-t border-slate-700/50 text-center relative">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 px-2 bg-slate-900/60 backdrop-blur-sm">
                <div className="w-2 h-2 rounded-full bg-cyan-500/50 animate-pulse"></div>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed uppercase tracking-wider">
                Hệ thống mạng lưới nội bộ an ninh. <br className="hidden sm:block"/>
                <span className="text-slate-400">Ghi log mọi điểm truy cập.</span>
              </p>
            </div> */}
          </div>
        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes shine {
          0% { left: -100%; }
          20% { left: 200%; }
          100% { left: 200%; }
        }
        .animate-shine {
          animation: shine 3s infinite;
        }
        @keyframes fade-in-up {
          0% { opacity: 0; transform: translateY(20px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @keyframes gradient-x {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .animate-gradient-x {
          background-size: 200% 200%;
          animation: gradient-x 4s ease infinite;
        }
        .animate-pulse-slow {
          animation: pulse-slow 8s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        @keyframes pulse-slow {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.85; }
        }
      `}} />
    </div>
  )
}

export default LoginPage