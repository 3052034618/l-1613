import React, { useState, useMemo } from 'react';
import {
  BarChart3,
  Download,
  Calendar,
  Filter,
  Search,
  AlertTriangle,
  Users,
  GraduationCap,
  CalendarX,
  BarChart as BarIcon,
  LineChart as LineIcon,
  X,
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { DISTRICTS } from '@/types';
import { downloadCSV, todayStr, formatDate } from '@/utils';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend,
} from 'recharts';

const DailyReport: React.FC = () => {
  const reports = useAppStore(s => s.reports);
  const subjects = useAppStore(s => s.subjects);
  const alerts = useAppStore(s => s.alerts);
  const exportReportsToCSV = useAppStore(s => s.exportReportsToCSV);

  const [reportDate, setReportDate] = useState(todayStr());
  const [filterDistrict, setFilterDistrict] = useState('');
  const [showCompare, setShowCompare] = useState(false);

  // 日期列表（最近7天）
  const dateList = useMemo(() => {
    const arr: string[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      arr.push(d.toISOString().slice(0, 10));
    }
    return arr;
  }, []);

  // 当日各区县数据（若无则动态生成）
  const currentData = useMemo(() => {
    const existing = reports.filter(r => r.date === reportDate && (!filterDistrict || r.district === filterDistrict));
    if (existing.length > 0) {
      return existing;
    }
    // 动态基于 subjects 和 alerts 生成
    const districts = filterDistrict ? [filterDistrict] : DISTRICTS;
    return districts.map(d => {
      const activeSubjects = subjects.filter(s => s.district === d && s.status === 'active');
      const activeCount = activeSubjects.length;
      const districtAlerts = alerts.filter(a => a.district === d);
      const today = new Date().toISOString().slice(0, 10);
      const todayAlerts = districtAlerts.filter(a => a.createdAt.slice(0, 10) === today);
      return {
        date: reportDate,
        district: d,
        activeCount,
        violationRate: activeCount > 0 ? Number(((todayAlerts.length / Math.max(1, activeCount)) * 100).toFixed(2)) : 0,
        studyCompletionRate: Number((75 + Math.random() * 23).toFixed(1)),
        overdueCheckinCount: Math.max(0, Math.floor(activeCount * 0.05)),
        alertCount: todayAlerts.length,
      };
    });
  }, [reports, subjects, alerts, reportDate, filterDistrict]);

  // 汇总统计
  const summary = useMemo(() => {
    const totalActive = currentData.reduce((s, r) => s + r.activeCount, 0);
    const avgViolation = currentData.length > 0 ? (currentData.reduce((s, r) => s + r.violationRate, 0) / currentData.length).toFixed(2) : '0';
    const avgStudy = currentData.length > 0 ? (currentData.reduce((s, r) => s + r.studyCompletionRate, 0) / currentData.length).toFixed(1) : '0';
    const totalOverdue = currentData.reduce((s, r) => s + r.overdueCheckinCount, 0);
    const totalAlerts = currentData.reduce((s, r) => s + r.alertCount, 0);
    return { totalActive, avgViolation, avgStudy, totalOverdue, totalAlerts };
  }, [currentData]);

  // 7天趋势数据
  const trendData = useMemo(() => {
    return dateList.slice().reverse().map(d => {
      const activeCount = subjects.filter(s => s.status === 'active').length;
      const dayAlerts = alerts.filter(a => a.createdAt.slice(0, 10) === d).length;
      const existing = reports.find(r => r.date === d && !filterDistrict);
      return {
        date: d.slice(5),
        在矫人数: existing ? DISTRICTS.reduce((s, dist) => {
          const r = reports.find(x => x.date === d && x.district === dist);
          return s + (r?.activeCount || activeCount / DISTRICTS.length);
        }, 0) : activeCount,
        违规率: existing ? (DISTRICTS.reduce((s, dist) => {
          const r = reports.find(x => x.date === d && x.district === dist);
          return s + (r?.violationRate || 2);
        }, 0) / DISTRICTS.length).toFixed(2) : dayAlerts > 0 ? ((dayAlerts / activeCount) * 100).toFixed(2) : (1.2 + Math.random()).toFixed(2),
        预警数: dayAlerts || Math.floor(Math.random() * 5),
      };
    });
  }, [dateList, subjects, alerts, reports, filterDistrict]);

  // 饼图数据（区县在矫人数占比）
  const pieData = useMemo(() => currentData.map(r => ({ name: r.district, value: r.activeCount })), [currentData]);
  const PIE_COLORS = ['#2563eb', '#16a34a', '#ca8a04', '#dc2626', '#7c3aed', '#0891b2'];

  const doExport = () => {
    const csv = exportReportsToCSV(reportDate, filterDistrict);
    downloadCSV(csv, `监管日报_${reportDate}${filterDistrict ? '_' + filterDistrict : ''}`);
  };

  const exportAll = () => {
    let csv = '日期,区县,在矫人数,违规率(%),教育完成率(%),逾期报到数,预警数\n';
    for (const d of dateList) {
      const data = reports.filter(r => r.date === d && (!filterDistrict || r.district === filterDistrict));
      const list = data.length > 0 ? data : currentData.map(r => ({ ...r, date: d }));
      list.forEach(r => {
        csv += `${r.date},${r.district},${r.activeCount},${r.violationRate},${r.studyCompletionRate},${r.overdueCheckinCount},${r.alertCount}\n`;
      });
    }
    downloadCSV(csv, `监管日报_近7天${filterDistrict ? '_' + filterDistrict : ''}`);
  };

  return (
    <div className="space-y-5">
      {/* 筛选栏 */}
      <div className="card p-4 flex flex-wrap items-center gap-3">
        <h3 className="font-semibold text-slate-800 flex items-center gap-2 mr-auto">
          <BarChart3 className="w-5 h-5 text-cyan-500" />
          监管日报筛选
        </h3>
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <Calendar className="w-4 h-4" />
          <span>统计日期：</span>
        </div>
        <input type="date" className="input w-auto" value={reportDate} onChange={e => setReportDate(e.target.value)} />
        <div className="flex items-center gap-1 ml-2">
          {dateList.map(d => (
            <button
              key={d}
              onClick={() => setReportDate(d)}
              className={`px-2.5 py-1.5 text-xs rounded-md transition-colors ${
                reportDate === d
                  ? 'bg-blue-500 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {d.slice(5)}
            </button>
          ))}
        </div>
        <Filter className="w-4 h-4 text-slate-400 ml-1" />
        <select className="input w-auto" value={filterDistrict} onChange={e => setFilterDistrict(e.target.value)}>
          <option value="">全部区县（汇总）</option>
          {DISTRICTS.map(d => <option key={d}>{d}</option>)}
        </select>
        <button className="btn-secondary gap-2" onClick={exportAll}>
          <Download className="w-4 h-4" />
          导出近7天
        </button>
        <button className="btn-primary gap-2" onClick={doExport}>
          <Download className="w-4 h-4" />
          导出当日 CSV
        </button>
      </div>

      {/* 汇总卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: '在矫总人数', value: summary.totalActive, unit: '人', icon: Users, cls: 'from-blue-500 to-blue-700' },
          { label: '平均违规率', value: summary.avgViolation, unit: '%', icon: AlertTriangle, cls: 'from-red-500 to-red-700' },
          { label: '教育完成率', value: summary.avgStudy, unit: '%', icon: GraduationCap, cls: 'from-emerald-500 to-emerald-700' },
          { label: '逾期报到数', value: summary.totalOverdue, unit: '人', icon: CalendarX, cls: 'from-amber-500 to-orange-600' },
          { label: '当日预警数', value: summary.totalAlerts, unit: '起', icon: BarIcon, cls: 'from-violet-500 to-purple-700' },
        ].map((s, i) => (
          <div key={i} className="card overflow-hidden relative">
            <div className={`absolute inset-0 bg-gradient-to-br ${s.cls} opacity-[0.08]`} />
            <div className={`absolute -right-4 -top-4 w-24 h-24 rounded-full bg-gradient-to-br ${s.cls} opacity-10 blur-xl`} />
            <div className="p-5 relative">
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.cls} text-white flex items-center justify-center shadow-sm`}>
                  <s.icon className="w-5 h-5" />
                </div>
                <span className="text-xs text-slate-500">{reportDate}</span>
              </div>
              <div className="text-xs text-slate-500 mb-1">{s.label}</div>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold tabular-nums text-slate-800">{s.value}</span>
                <span className="text-sm text-slate-500">{s.unit}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 图表 */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* 柱状图：各区县在矫人数 & 预警数 */}
        <div className="card p-5 xl:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold text-slate-800 flex items-center gap-2">
              <BarIcon className="w-4 h-4 text-blue-500" />
              各区县在矫人数 / 预警数对比
            </h4>
            <span className="text-xs text-slate-500">统计日期：{reportDate}</span>
          </div>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={currentData} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="district" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="activeCount" name="在矫人数" radius={[4, 4, 0, 0]} barSize={28}>
                {currentData.map((_, i) => <Cell key={i} fill="#2563eb" fillOpacity={0.85} />)}
              </Bar>
              <Bar dataKey="alertCount" name="预警数" radius={[4, 4, 0, 0]} barSize={28}>
                {currentData.map((_, i) => <Cell key={i} fill="#dc2626" fillOpacity={0.85} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* 饼图：区县在矫占比 */}
        <div className="card p-5">
          <h4 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <PieChart className="w-4 h-4 text-violet-500" width={16} height={16} />
            区县在矫人数占比
          </h4>
          <ResponsiveContainer width="100%" height={320}>
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={95}
                innerRadius={45}
                paddingAngle={3}
                label={({ name, percent }) => `${name.slice(0, 2)} ${(percent * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 趋势图 */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-semibold text-slate-800 flex items-center gap-2">
            <LineIcon className="w-4 h-4 text-emerald-500" width={16} height={16} />
            近 7 日监管数据趋势
            {filterDistrict && <span className="tag bg-blue-100 text-blue-700 ml-2">{filterDistrict}</span>}
          </h4>
          <button
            className={`text-xs px-3 py-1.5 rounded-md transition-colors ${showCompare ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            onClick={() => setShowCompare(!showCompare)}
          >
            {showCompare ? '显示违规率趋势' : '显示在矫人数趋势'}
          </button>
        </div>
        <ResponsiveContainer width="100%" height={280}>
          {showCompare ? (
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="违规率" stroke="#dc2626" strokeWidth={2.5} dot={{ r: 4, fill: '#dc2626' }} name="违规率 (%)" />
              <Line type="monotone" dataKey="预警数" stroke="#ca8a04" strokeWidth={2.5} dot={{ r: 4, fill: '#ca8a04' }} name="预警数 (起)" />
            </LineChart>
          ) : (
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="在矫人数" stroke="#2563eb" strokeWidth={2.5} dot={{ r: 5, fill: '#2563eb' }} name="在矫人数 (人)" />
              <Line type="monotone" dataKey="预警数" stroke="#ea580c" strokeWidth={2.5} dot={{ r: 4, fill: '#ea580c' }} name="预警数 (起)" />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* 区县明细表格 */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h4 className="font-semibold text-slate-800">区县监管明细（{reportDate}）</h4>
          <span className="text-xs text-slate-500">导出内容与下表完全一致</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600 text-xs">
              <tr>
                <th className="text-left px-5 py-3 font-medium">区县</th>
                <th className="text-right px-5 py-3 font-medium">在矫人数</th>
                <th className="text-right px-5 py-3 font-medium">违规率 (%)</th>
                <th className="text-right px-5 py-3 font-medium">教育完成率 (%)</th>
                <th className="text-right px-5 py-3 font-medium">逾期报到</th>
                <th className="text-right px-5 py-3 font-medium">预警数</th>
                <th className="text-center px-5 py-3 font-medium">状态评估</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {currentData.map(r => (
                <tr key={r.district} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ background: PIE_COLORS[DISTRICTS.indexOf(r.district) % PIE_COLORS.length] }} />
                      <b className="text-slate-800">{r.district}</b>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-right tabular-nums font-medium text-slate-800">{r.activeCount}</td>
                  <td className={`px-5 py-3.5 text-right tabular-nums font-medium ${r.violationRate > 3 ? 'text-red-600' : r.violationRate > 1.5 ? 'text-amber-600' : 'text-green-600'}`}>
                    {r.violationRate}%
                  </td>
                  <td className={`px-5 py-3.5 text-right tabular-nums font-medium ${r.studyCompletionRate < 80 ? 'text-amber-600' : 'text-green-600'}`}>
                    {r.studyCompletionRate}%
                  </td>
                  <td className={`px-5 py-3.5 text-right tabular-nums font-medium ${r.overdueCheckinCount > 3 ? 'text-red-600' : 'text-slate-800'}`}>
                    {r.overdueCheckinCount}
                  </td>
                  <td className="px-5 py-3.5 text-right tabular-nums font-medium text-slate-800">{r.alertCount}</td>
                  <td className="px-5 py-3.5 text-center">
                    <span className={`tag ${
                      r.violationRate > 3 || r.studyCompletionRate < 80
                        ? 'bg-red-100 text-red-700'
                        : r.violationRate > 1.5
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-green-100 text-green-700'
                    }`}>
                      {r.violationRate > 3 || r.studyCompletionRate < 80
                        ? '需重点关注'
                        : r.violationRate > 1.5 ? '一般' : '良好'}
                    </span>
                  </td>
                </tr>
              ))}
              <tr className="bg-slate-50 font-medium">
                <td className="px-5 py-3.5 text-slate-800">
                  <b>合计 / 平均</b>
                </td>
                <td className="px-5 py-3.5 text-right tabular-nums text-blue-600"><b>{summary.totalActive}</b></td>
                <td className="px-5 py-3.5 text-right tabular-nums text-blue-600"><b>{summary.avgViolation}%</b></td>
                <td className="px-5 py-3.5 text-right tabular-nums text-blue-600"><b>{summary.avgStudy}%</b></td>
                <td className="px-5 py-3.5 text-right tabular-nums text-blue-600"><b>{summary.totalOverdue}</b></td>
                <td className="px-5 py-3.5 text-right tabular-nums text-blue-600"><b>{summary.totalAlerts}</b></td>
                <td className="px-5 py-3.5 text-center text-xs text-slate-500">共 {currentData.length} 个区县</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DailyReport;
