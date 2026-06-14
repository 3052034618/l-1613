import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  AlertTriangle,
  FileClock,
  CalendarX,
  UserPlus,
  Radar,
  CalendarCheck,
  GraduationCap,
  FileClock as LeaveIcon,
  FileCheck2,
  BarChart3,
  TrendingUp,
  TrendingDown,
  ArrowRight,
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { DISTRICTS } from '@/types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const subjects = useAppStore(s => s.subjects);
  const alerts = useAppStore(s => s.alerts);
  const leaves = useAppStore(s => s.leaves);
  const checkins = useAppStore(s => s.checkins);
  const reports = useAppStore(s => s.reports);
  const studyPlans = useAppStore(s => s.studyPlans);

  const activeCount = subjects.filter(s => s.status === 'active').length;
  const todayPending = alerts.filter(a => a.status === 'pending').length;
  const todayProcessing = alerts.filter(a => a.status === 'processing').length;
  const pendingLeaves = leaves.filter(l => l.currentStage !== 'completed').length;
  const overdueCheckins = checkins.filter(c => c.status === 'overdue').length;
  const completedStudy = studyPlans.filter(s => s.status === 'completed').length;
  const totalStudy = studyPlans.filter(s => s.status !== 'not_started').length;
  const studyRate = totalStudy > 0 ? Math.round((completedStudy / totalStudy) * 100) : 0;

  const districtStats = DISTRICTS.map(d => ({
    name: d,
    在矫: subjects.filter(s => s.district === d && s.status === 'active').length,
    预警: alerts.filter(a => a.district === d && a.status !== 'resolved').length,
  }));

  const latestAlerts = alerts.slice(0, 5);
  const latestLeaves = leaves.filter(l => l.currentStage !== 'completed').slice(0, 4);

  const statCards = [
    { label: '在矫对象总数', value: activeCount, delta: '+3', up: true, color: 'from-blue-500 to-blue-700', icon: Users },
    { label: '今日预警工单', value: todayPending + todayProcessing, delta: todayPending > 0 ? `${todayPending}待处理` : '0', up: false, color: 'from-red-500 to-red-700', icon: AlertTriangle },
    { label: '待审批请假', value: pendingLeaves, delta: pendingLeaves > 0 ? '需及时处理' : '全部完成', up: true, color: 'from-amber-500 to-orange-600', icon: FileClock },
    { label: '逾期未报到', value: overdueCheckins, delta: overdueCheckins > 0 ? '需催告' : '合规', up: false, color: 'from-violet-500 to-purple-700', icon: CalendarX },
  ];

  const quickEntries = [
    { path: '/intake', icon: UserPlus, label: '入矫审核', desc: '身份与文书校验', color: 'bg-blue-50 text-blue-600 border-blue-100' },
    { path: '/location', icon: Radar, label: '定位预警', desc: '电子围栏监控', color: 'bg-red-50 text-red-600 border-red-100' },
    { path: '/checkin', icon: CalendarCheck, label: '报到管理', desc: '定期报到校验', color: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
    { path: '/study', icon: GraduationCap, label: '学习考核', desc: '教育学习计划', color: 'bg-indigo-50 text-indigo-600 border-indigo-100' },
    { path: '/leave', icon: LeaveIcon, label: '请假审批', desc: '两级审批流转', color: 'bg-amber-50 text-amber-600 border-amber-100' },
    { path: '/release', icon: FileCheck2, label: '解矫评估', desc: '综合评估报告', color: 'bg-teal-50 text-teal-600 border-teal-100' },
    { path: '/report', icon: BarChart3, label: '监管日报', desc: '统计数据导出', color: 'bg-cyan-50 text-cyan-600 border-cyan-100' },
    { path: '/', icon: Users, label: '对象总览', desc: `${activeCount}人在矫中`, color: 'bg-slate-50 text-slate-600 border-slate-200' },
  ];

  const COLORS = ['#2563eb', '#dc2626'];

  return (
    <div className="space-y-6">
      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {statCards.map((c, i) => (
          <div
            key={i}
            className="relative overflow-hidden rounded-xl text-white p-5 animate-fadeIn"
            style={{
              background: `linear-gradient(135deg, var(--tw-gradient-stops))`,
              animationDelay: `${i * 60}ms`,
            }}
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${c.color} opacity-100`}></div>
            <div className="relative z-10">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-white/80 text-[13px] mb-1">{c.label}</div>
                  <div className="text-3xl font-bold tabular-nums tracking-tight">{c.value}</div>
                  <div className="flex items-center mt-2 text-xs text-white/80">
                    {c.up ? <TrendingUp className="w-3.5 h-3.5 mr-1" /> : <TrendingDown className="w-3.5 h-3.5 mr-1" />}
                    <span>{c.delta}</span>
                  </div>
                </div>
                <div className="w-11 h-11 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
                  <c.icon className="w-6 h-6" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 快捷入口 */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-slate-800">功能入口</h3>
          <span className="text-xs text-slate-500">教育学习完成率 <b className="text-blue-600">{studyRate}%</b></span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-4 gap-4">
          {quickEntries.map((q, i) => (
            <button
              key={q.path}
              onClick={() => navigate(q.path)}
              className={`flex items-center gap-4 p-4 rounded-xl border card-hover text-left animate-fadeIn ${q.color}`}
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <div className="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center shrink-0">
                <q.icon className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-slate-800 mb-0.5">{q.label}</div>
                <div className="text-[12px] text-slate-500 truncate">{q.desc}</div>
              </div>
              <ArrowRight className="w-4 h-4 opacity-40 shrink-0" />
            </button>
          ))}
        </div>
      </div>

      {/* 下方两个并排 */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* 区县在矫人数柱状图 */}
        <div className="card p-5 xl:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-slate-800">各区县在矫/预警统计</h3>
            <button
              onClick={() => navigate('/report')}
              className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              查看日报 <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={districtStats} barGap={2}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }}
              />
              <Bar dataKey="在矫" radius={[4, 4, 0, 0]} barSize={22}>
                {districtStats.map((_, idx) => (
                  <Cell key={idx} fill={COLORS[0]} fillOpacity={0.85} />
                ))}
              </Bar>
              <Bar dataKey="预警" radius={[4, 4, 0, 0]} barSize={22}>
                {districtStats.map((_, idx) => (
                  <Cell key={idx} fill={COLORS[1]} fillOpacity={0.85} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* 最新预警工单 */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-slate-800">最新预警</h3>
            <button
              onClick={() => navigate('/location')}
              className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              全部 <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="space-y-3">
            {latestAlerts.length === 0 ? (
              <div className="text-center text-sm text-slate-400 py-8">暂无预警</div>
            ) : (
              latestAlerts.map(a => (
                <div key={a.id} className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer" onClick={() => navigate('/location')}>
                  <span
                    className={`mt-0.5 w-2.5 h-2.5 rounded-full shrink-0 ${
                      a.level === 'red' ? 'bg-red-500 animate-pulse-slow' : a.level === 'orange' ? 'bg-orange-500' : 'bg-yellow-500'
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-slate-800 truncate">{a.subjectName} - {a.description}</div>
                    <div className="text-[12px] text-slate-500 mt-0.5">
                      分配: {a.assignedOfficer.name} | {a.createdAt.slice(11, 16)}
                    </div>
                  </div>
                  <span className={`tag ${
                    a.status === 'pending' ? 'bg-red-100 text-red-700' : a.status === 'processing' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'
                  }`}>
                    {a.status === 'pending' ? '待处理' : a.status === 'processing' ? '处理中' : '已解决'}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* 待审批请假 + 日报 */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-slate-800">待审批请假</h3>
            <button
              onClick={() => navigate('/leave')}
              className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              进入审批 <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="space-y-2.5">
            {latestLeaves.length === 0 ? (
              <div className="text-center text-sm text-slate-400 py-6">暂无待审批请假</div>
            ) : (
              latestLeaves.map(l => (
                <div key={l.id} className="flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:border-blue-200 hover:bg-blue-50/30 transition-colors">
                  <div>
                    <div className="text-sm font-medium text-slate-800">{l.subjectName} - {l.reason}</div>
                    <div className="text-[12px] text-slate-500 mt-0.5">
                      {l.startDate} ~ {l.endDate} · 前往{l.destination}
                    </div>
                  </div>
                  <span className={`tag ${
                    l.currentStage === 'first' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {l.currentStage === 'first' ? '司法所初审' : '矫正中心复审'}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-slate-800">今日监管概览</h3>
            <span className="text-xs text-slate-500">{reports[0]?.date || new Date().toISOString().slice(0, 10)}</span>
          </div>
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="p-4 rounded-xl bg-blue-50 border border-blue-100">
              <div className="text-xs text-blue-600 mb-1">在矫总人数</div>
              <div className="text-2xl font-bold text-blue-700 tabular-nums">
                {reports.filter(r => r.date === reports[0]?.date).reduce((s, r) => s + r.activeCount, 0) || activeCount}
              </div>
            </div>
            <div className="p-4 rounded-xl bg-red-50 border border-red-100">
              <div className="text-xs text-red-600 mb-1">平均违规率</div>
              <div className="text-2xl font-bold text-red-700 tabular-nums">
                {reports.filter(r => r.date === reports[0]?.date).length > 0
                  ? (reports.filter(r => r.date === reports[0]?.date).reduce((s, r) => s + r.violationRate, 0) / DISTRICTS.length).toFixed(2)
                  : '1.82'}%
              </div>
            </div>
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100">
              <div className="text-xs text-emerald-600 mb-1">教育完成率</div>
              <div className="text-2xl font-bold text-emerald-700 tabular-nums">
                {reports.filter(r => r.date === reports[0]?.date).length > 0
                  ? (reports.filter(r => r.date === reports[0]?.date).reduce((s, r) => s + r.studyCompletionRate, 0) / DISTRICTS.length).toFixed(1)
                  : studyRate}%
              </div>
            </div>
          </div>
          <div className="text-xs text-slate-500 leading-relaxed p-3 bg-slate-50 rounded-lg">
            系统将于每日凌晨 00:00 自动生成监管日报，支持按日期、区县筛选并导出 CSV 文件。
            解矫前将根据监管记录、考核结果自动生成综合评估报告。
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
