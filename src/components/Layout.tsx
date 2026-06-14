import React from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  UserPlus,
  AlertTriangle,
  CalendarCheck,
  GraduationCap,
  FileClock,
  FileCheck2,
  BarChart3,
  Scale,
  Bell,
  RotateCcw,
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';

const navItems = [
  { path: '/', icon: LayoutDashboard, label: '首页仪表盘' },
  { path: '/intake', icon: UserPlus, label: '入矫审核' },
  { path: '/location', icon: AlertTriangle, label: '定位预警' },
  { path: '/checkin', icon: CalendarCheck, label: '报到管理' },
  { path: '/study', icon: GraduationCap, label: '学习考核' },
  { path: '/leave', icon: FileClock, label: '请假审批' },
  { path: '/release', icon: FileCheck2, label: '解矫评估' },
  { path: '/report', icon: BarChart3, label: '监管日报' },
];

const Layout: React.FC = () => {
  const location = useLocation();
  const resetAll = useAppStore(s => s.resetAll);
  const currentTitle = navItems.find(n => n.path === location.pathname)?.label || '社区矫正管理系统';

  const stats = {
    active: useAppStore(s => s.subjects.filter(x => x.status === 'active').length),
    alerts: useAppStore(s => s.alerts.filter(x => x.status !== 'resolved').length),
    leaves: useAppStore(s => s.leaves.filter(x => x.currentStage !== 'completed' || (x.firstReview.status === 'pending' || x.secondReview.status === 'pending')).length),
    overdue: useAppStore(s => s.checkins.filter(x => x.status === 'overdue').length),
  };

  return (
    <div className="min-h-screen flex bg-slate-100">
      {/* 侧边栏 */}
      <aside className="w-60 bg-[#1e3a5f] text-white flex flex-col fixed h-full z-20">
        <div className="h-16 flex items-center px-5 border-b border-white/10">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center mr-3">
            <Scale className="w-5 h-5" />
          </div>
          <div>
            <div className="font-bold text-[15px] tracking-wide">社矫监管</div>
            <div className="text-[11px] text-blue-200/80">智慧矫正平台</div>
          </div>
        </div>

        <nav className="flex-1 py-3 overflow-y-auto">
          {navItems.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                `flex items-center px-5 py-3 mx-2 my-0.5 rounded-md text-[14px] transition-all duration-150 group ${
                  isActive
                    ? 'bg-blue-500/25 text-white border-l-3 border-l-blue-400 shadow-inner'
                    : 'text-blue-100/80 hover:bg-white/5 hover:text-white border-l-3 border-l-transparent'
                }`
              }
            >
              <item.icon className="w-[18px] h-[18px] mr-3 shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t border-white/10">
          <button
            onClick={resetAll}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-md bg-white/5 hover:bg-white/10 text-blue-100 text-xs transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            重置演示数据
          </button>
        </div>
      </aside>

      {/* 主内容区 */}
      <div className="flex-1 ml-60 flex flex-col min-w-0">
        {/* 顶部栏 */}
        <header className="h-16 bg-white border-b border-slate-200 sticky top-0 z-10 flex items-center px-6 justify-between">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 text-sm">社区矫正管理系统</span>
            <span className="text-slate-300">/</span>
            <span className="text-slate-800 font-medium">{currentTitle}</span>
          </div>

          <div className="flex items-center gap-5">
            <div className="hidden md:flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5 text-slate-600">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                <span>在矫 <b className="text-slate-900">{stats.active}</b></span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-600">
                <span className="w-2 h-2 rounded-full bg-red-500"></span>
                <span>预警 <b className="text-slate-900">{stats.alerts}</b></span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-600">
                <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
                <span>待审 <b className="text-slate-900">{stats.leaves}</b></span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-600">
                <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                <span>逾期 <b className="text-slate-900">{stats.overdue}</b></span>
              </div>
            </div>

            <button className="relative p-2 rounded-lg hover:bg-slate-100 transition-colors">
              <Bell className="w-5 h-5 text-slate-600" />
              {(stats.alerts + stats.leaves) > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-medium">
                  {stats.alerts + stats.leaves}
                </span>
              )}
            </button>

            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-sm font-medium">
                管
              </div>
              <div className="hidden sm:block">
                <div className="text-sm font-medium text-slate-800 leading-tight">管理员</div>
                <div className="text-[11px] text-slate-500">矫正中心</div>
              </div>
            </div>
          </div>
        </header>

        {/* 主内容 */}
        <main className="flex-1 p-6 animate-fadeIn">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
