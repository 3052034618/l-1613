import React, { useState, useMemo } from 'react';
import {
  CalendarCheck,
  Calendar,
  Clock,
  User,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Bell,
  Search,
  Filter,
  Ban,
  PlayCircle,
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { DISTRICTS } from '@/types';
import { formatDate, classNames, todayStr } from '@/utils';

const CheckinMgmt: React.FC = () => {
  const checkins = useAppStore(s => s.checkins);
  const subjects = useAppStore(s => s.subjects);
  const checkIn = useAppStore(s => s.checkIn);

  const [filterDistrict, setFilterDistrict] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [keyword, setKeyword] = useState('');

  const filtered = useMemo(() => {
    return checkins.filter(c => {
      if (keyword && !c.subjectName.includes(keyword)) return false;
      if (filterDistrict && c.district !== filterDistrict) return false;
      if (filterStatus && c.status !== filterStatus) return false;
      return true;
    }).sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate));
  }, [checkins, keyword, filterDistrict, filterStatus]);

  const overdueList = useMemo(() => filtered.filter(c => c.status === 'overdue'), [filtered]);
  const todayList = useMemo(() => filtered.filter(c => c.scheduledDate === todayStr() && c.status !== 'completed'), [filtered]);
  const completedCount = checkins.filter(c => c.status === 'completed').length;
  const overdueCount = checkins.filter(c => c.status === 'overdue').length;
  const scheduledCount = checkins.filter(c => c.status === 'scheduled').length;

  // 日历视图（当月）
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startWeekday = firstDay.getDay();
  const calendarDays: (number | null)[] = [];
  for (let i = 0; i < startWeekday; i++) calendarDays.push(null);
  for (let d = 1; d <= daysInMonth; d++) calendarDays.push(d);
  while (calendarDays.length % 7 !== 0) calendarDays.push(null);

  const dateToStr = (d: number) => {
    if (!d) return '';
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  };

  const getDayStatus = (d: number) => {
    const s = dateToStr(d);
    const records = checkins.filter(c => c.scheduledDate === s);
    if (records.length === 0) return null;
    if (records.some(r => r.status === 'overdue')) return 'overdue';
    if (records.some(r => r.status === 'scheduled')) return 'scheduled';
    return 'completed';
  };

  const statusTag = (s: string) => {
    const map: Record<string, { label: string; cls: string }> = {
      scheduled: { label: '待报到', cls: 'bg-blue-100 text-blue-700' },
      completed: { label: '已报到', cls: 'bg-green-100 text-green-700' },
      overdue: { label: '逾期未报到', cls: 'bg-red-100 text-red-700' },
    };
    return <span className={`tag ${map[s].cls}`}>{map[s].label}</span>;
  };

  const pauseRights = (id: string, name: string) => {
    alert(`已对【${name}】执行权益暂停操作：\n\n• 暂停外出请假权限\n• 限制定位范围为基本区域\n• 已发送短信催告通知`);
  };

  return (
    <div className="space-y-5">
      {/* 统计 */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: '本月已报到', value: completedCount, cls: 'bg-green-50 text-green-700', icon: CheckCircle2 },
          { label: '今日待报到', value: todayList.length, cls: 'bg-blue-50 text-blue-700', icon: CalendarCheck },
          { label: '逾期未报到', value: overdueCount, cls: 'bg-red-50 text-red-700', icon: AlertTriangle },
          { label: '未来待报到', value: scheduledCount, cls: 'bg-slate-50 text-slate-700', icon: Calendar },
        ].map((s, i) => (
          <div key={i} className={`card p-4 ${s.cls}`}>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs opacity-80 mb-1">{s.label}</div>
                <div className="text-3xl font-bold tabular-nums">{s.value}</div>
              </div>
              <s.icon className="w-8 h-8 opacity-70" />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* 日历 */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-800 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-500" />
              {year} 年 {month + 1} 月报到日历
            </h3>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-xs text-slate-500 mb-2">
            {['日', '一', '二', '三', '四', '五', '六'].map(d => <div key={d} className="py-1">{d}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-1 text-sm">
            {calendarDays.map((d, i) => {
              const isToday = d === today.getDate();
              const st = d ? getDayStatus(d) : null;
              const dotCls = st === 'overdue' ? 'bg-red-500' : st === 'scheduled' ? 'bg-blue-500' : st === 'completed' ? 'bg-green-500' : '';
              return (
                <div
                  key={i}
                  className={classNames(
                    'relative aspect-square rounded-lg flex items-center justify-center transition-colors',
                    d ? 'hover:bg-slate-50 cursor-pointer' : '',
                    isToday && 'ring-2 ring-blue-500 ring-offset-1',
                    st === 'overdue' && d && !isToday && 'bg-red-50',
                    st === 'scheduled' && d && !isToday && 'bg-blue-50',
                    st === 'completed' && d && !isToday && 'bg-green-50'
                  )}
                >
                  {d && <span className={isToday ? 'font-bold text-blue-600' : 'text-slate-700'}>{d}</span>}
                  {dotCls && <span className={`absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full ${dotCls}`} />}
                </div>
              );
            })}
          </div>
          <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap gap-3 text-xs text-slate-600">
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-green-500" />已完成</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-500" />待报到</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-500" />逾期</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full ring-2 ring-blue-500" />今日</span>
          </div>
        </div>

        {/* 逾期催告任务 */}
        <div className="card p-5 xl:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-800 flex items-center gap-2">
              <Bell className="w-5 h-5 text-red-500" />
              逾期催告任务列表
            </h3>
            <span className="text-xs text-slate-500">共 {overdueList.length} 条逾期</span>
          </div>
          {overdueList.length === 0 ? (
            <div className="text-center text-sm text-slate-400 py-12 flex flex-col items-center gap-3">
              <CheckCircle2 className="w-12 h-12 text-green-400" />
              <div>暂无逾期报到对象，本月报到管理合规</div>
            </div>
          ) : (
            <div className="space-y-2.5">
              {overdueList.map(r => {
                const subject = subjects.find(s => s.id === r.subjectId);
                const daysLate = Math.abs(Math.ceil((new Date(todayStr()).getTime() - new Date(r.scheduledDate).getTime()) / 86400000));
                return (
                  <div key={r.id} className="p-4 rounded-xl bg-red-50/40 border border-red-100 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="w-10 h-10 rounded-lg bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                        <AlertTriangle className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-slate-800">{r.subjectName}</span>
                          {statusTag(r.status)}
                          <span className="tag bg-red-200 text-red-800">逾期 {daysLate} 天</span>
                          <span className="text-xs text-slate-500">{r.district} · {r.periodType === 'weekly' ? '周报到' : '月报'}</span>
                        </div>
                        <div className="text-xs text-slate-600 mt-1 flex flex-wrap gap-4">
                          <span>应报到日期：<b className="text-slate-800 tabular-nums">{r.scheduledDate}</b></span>
                          {subject && <span>联系电话：<b className="tabular-nums">{subject.phone}</b></span>}
                          {subject && <span>家属：<b>{subject.familyName}</b> <span className="tabular-nums">{subject.familyPhone}</span></span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button className="btn-secondary gap-1.5 text-xs" onClick={() => checkIn(r.subjectId, r.id)}>
                        <CheckCircle2 className="w-3.5 h-3.5" />补报到
                      </button>
                      <button className="btn-danger gap-1.5 text-xs" onClick={() => alert(`已向【${r.subjectName}】发送催告短信：您已逾期${daysLate}天未报到，请立即前往司法所报到。`)}>
                        <Bell className="w-3.5 h-3.5" />发送催告
                      </button>
                      <button className="bg-orange-500 text-white inline-flex items-center gap-1.5 justify-center rounded-md px-3 py-2 text-xs font-medium hover:bg-orange-600 active:scale-[0.98] transition-all"
                        onClick={() => pauseRights(r.subjectId, r.subjectName)}>
                        <Ban className="w-3.5 h-3.5" />暂停权益
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* 全部记录 */}
      <div className="card p-5">
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <h3 className="font-semibold text-slate-800 mr-auto">全部报到记录</h3>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input className="input pl-9 w-48" placeholder="搜索姓名" value={keyword} onChange={e => setKeyword(e.target.value)} />
          </div>
          <Filter className="w-4 h-4 text-slate-400 ml-1" />
          <select className="input w-auto" value={filterDistrict} onChange={e => setFilterDistrict(e.target.value)}>
            <option value="">全部区县</option>
            {DISTRICTS.map(d => <option key={d}>{d}</option>)}
          </select>
          <select className="input w-auto" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="">全部状态</option>
            <option value="scheduled">待报到</option>
            <option value="completed">已报到</option>
            <option value="overdue">逾期未报到</option>
          </select>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600 text-xs">
              <tr>
                <th className="text-left px-4 py-3 font-medium">姓名</th>
                <th className="text-left px-4 py-3 font-medium">所属区县</th>
                <th className="text-left px-4 py-3 font-medium">周期类型</th>
                <th className="text-left px-4 py-3 font-medium">应报到日期</th>
                <th className="text-left px-4 py-3 font-medium">实际报到</th>
                <th className="text-left px-4 py-3 font-medium">状态</th>
                <th className="text-left px-4 py-3 font-medium w-24">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="text-center text-slate-400 py-10">暂无记录</td></tr>
              ) : filtered.map(r => (
                <tr key={r.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-4 py-3 font-medium text-slate-800">{r.subjectName}</td>
                  <td className="px-4 py-3 text-slate-600">{r.district}</td>
                  <td className="px-4 py-3">{r.periodType === 'weekly' ? '周报到' : '月报到'}</td>
                  <td className="px-4 py-3 tabular-nums text-slate-700">{r.scheduledDate}</td>
                  <td className="px-4 py-3 tabular-nums text-slate-700">{r.actualDate || '-'}</td>
                  <td className="px-4 py-3">{statusTag(r.status)}</td>
                  <td className="px-4 py-3">
                    {r.status !== 'completed' && (
                      <button className="text-blue-600 text-xs flex items-center gap-1 hover:text-blue-700"
                        onClick={() => checkIn(r.subjectId, r.id)}>
                        <PlayCircle className="w-3.5 h-3.5" />报到
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CheckinMgmt;
