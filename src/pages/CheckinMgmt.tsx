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
  X,
  Eye,
  ShieldAlert,
  ShieldCheck,
  Gauge,
  History,
  MapPin,
  Unlock,
  AlertCircle,
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { Subject, DISTRICTS } from '@/types';
import { formatDate, formatDateTime, classNames, todayStr } from '@/utils';

const CheckinMgmt: React.FC = () => {
  const checkins = useAppStore(s => s.checkins);
  const subjects = useAppStore(s => s.subjects);
  const checkIn = useAppStore(s => s.checkIn);
  const suspendRights = useAppStore(s => s.suspendRights);
  const restoreRights = useAppStore(s => s.restoreRights);

  const [filterDistrict, setFilterDistrict] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [keyword, setKeyword] = useState('');
  const [viewSubject, setViewSubject] = useState<Subject | null>(null);
  const [suspendDialog, setSuspendDialog] = useState<{ subjectId: string; subjectName: string } | null>(null);
  const [restoreDialog, setRestoreDialog] = useState<{ subjectId: string; subjectName: string } | null>(null);
  const [suspendReason, setSuspendReason] = useState('逾期未报到，经催告仍未履行报到义务');
  const [restoreReason, setRestoreReason] = useState('完成补报到，已履行报到义务');

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

  const riskLevelTag = (level: Subject['riskLevel']) => {
    const map = {
      high: { label: '高风险', cls: 'bg-red-100 text-red-700 border border-red-200' },
      medium: { label: '中风险', cls: 'bg-amber-100 text-amber-700 border border-amber-200' },
      low: { label: '低风险', cls: 'bg-green-100 text-green-700 border border-green-200' },
    };
    return <span className={`tag ${map[level].cls}`}>{map[level].label}</span>;
  };

  const handleSuspendConfirm = () => {
    if (!suspendDialog) return;
    suspendRights(suspendDialog.subjectId, suspendReason);
    setSuspendDialog(null);
    setSuspendReason('逾期未报到，经催告仍未履行报到义务');
  };

  const handleRestoreConfirm = () => {
    if (!restoreDialog) return;
    restoreRights(restoreDialog.subjectId, restoreReason);
    setRestoreDialog(null);
    setRestoreReason('完成补报到，已履行报到义务');
  };

  const handleCheckInWithRestore = (subjectId: string, recordId: string, subject: Subject | undefined) => {
    checkIn(subjectId, recordId);
  };

  const SubjectDetailModal: React.FC = () => {
    if (!viewSubject) return null;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => setViewSubject(null)}>
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl animate-fadeIn max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-between px-6 py-4 border-b">
            <h3 className="font-semibold text-slate-800 flex items-center gap-2">
              <User className="w-5 h-5 text-blue-500" />
              矫正对象详情
            </h3>
            <button className="p-2 hover:bg-slate-100 rounded-lg" onClick={() => setViewSubject(null)}>
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-6 space-y-5">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center text-xl font-bold shadow-lg">
                {viewSubject.name.slice(0, 1)}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-lg font-bold text-slate-800">{viewSubject.name}</h4>
                <div className="text-xs text-slate-500 tabular-nums mt-0.5">{viewSubject.idCard}</div>
              </div>
              <div className="flex flex-col gap-1.5 items-end">
                {riskLevelTag(viewSubject.riskLevel)}
              </div>
            </div>

            <div className={`p-4 rounded-xl border-2 ${
              viewSubject.rightsSuspended
                ? 'bg-red-50 border-red-200'
                : 'bg-emerald-50 border-emerald-200'
            }`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  {viewSubject.rightsSuspended ? (
                    <ShieldAlert className="w-5 h-5 text-red-600" />
                  ) : (
                    <ShieldCheck className="w-5 h-5 text-emerald-600" />
                  )}
                  <span className={`text-sm font-bold ${
                    viewSubject.rightsSuspended ? 'text-red-700' : 'text-emerald-700'
                  }`}>
                    权益状态
                  </span>
                </div>
                <span className={`tag text-sm px-3 py-1 font-medium ${
                  viewSubject.rightsSuspended
                    ? 'bg-red-500 text-white'
                    : 'bg-emerald-500 text-white'
                }`}>
                  {viewSubject.rightsSuspended ? '权益已暂停' : '正常'}
                </span>
              </div>
              {viewSubject.rightsSuspended ? (
                <div className="space-y-2">
                  <div className="flex items-start gap-2 text-sm">
                    <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                    <div>
                      <div className="text-xs text-red-500">暂停原因</div>
                      <div className="text-red-800 font-medium">{viewSubject.rightsSuspendReason}</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 text-sm">
                    <Clock className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                    <div>
                      <div className="text-xs text-red-500">暂停时间</div>
                      <div className="text-red-800 font-medium tabular-nums">
                        {viewSubject.rightsSuspendTime ? formatDateTime(viewSubject.rightsSuspendTime) : '-'}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-emerald-700">
                  ✅ 矫正对象权益状态正常，各项监管权益有效
                </div>
              )}
              {viewSubject.rightsSuspended && (
                <button
                  className="mt-4 w-full btn-success gap-2 justify-center"
                  onClick={() => {
                    setRestoreDialog({ subjectId: viewSubject.id, subjectName: viewSubject.name });
                    setViewSubject(null);
                  }}
                >
                  <Unlock className="w-4 h-4" />
                  解除限制
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                <div className="flex items-center gap-1.5 mb-1">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-xs text-slate-500">性别</span>
                </div>
                <div className="text-sm font-medium text-slate-800">{viewSubject.gender}</div>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                <div className="flex items-center gap-1.5 mb-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-xs text-slate-500">所属区县</span>
                </div>
                <div className="text-sm font-medium text-slate-800">{viewSubject.district}</div>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                <div className="flex items-center gap-1.5 mb-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-xs text-slate-500">司法所</span>
                </div>
                <div className="text-sm font-medium text-slate-800">{viewSubject.policeStation}</div>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                <div className="flex items-center gap-1.5 mb-1">
                  <Gauge className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-xs text-slate-500">罪名 / 矫正类型</span>
                </div>
                <div className="text-sm font-medium text-slate-800">{viewSubject.charge} · {viewSubject.correctionType}</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg border border-amber-100">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Gauge className="w-4 h-4 text-amber-500" />
                  <span className="text-xs text-amber-600 font-medium">当前风险等级</span>
                </div>
                <div>{riskLevelTag(viewSubject.riskLevel)}</div>
              </div>
              <div className="p-3 bg-gradient-to-br from-violet-50 to-purple-50 rounded-lg border border-violet-100">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <History className="w-4 h-4 text-violet-500" />
                  <span className="text-xs text-violet-600 font-medium">预警历史次数</span>
                </div>
                <div className="text-2xl font-bold text-violet-700 tabular-nums">
                  {viewSubject.alertHistoryCount}
                  <span className="text-sm font-normal ml-1">次</span>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60">
              <div className="flex items-center gap-1.5 mb-3">
                <MapPin className="w-4 h-4 text-blue-500" />
                <span className="text-sm font-semibold text-slate-700">电子围栏信息</span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <div className="text-xs text-slate-500 mb-0.5">基本围栏中心</div>
                  <div className="text-slate-800 font-medium tabular-nums">
                    {viewSubject.fenceCenter.lat.toFixed(4)}, {viewSubject.fenceCenter.lng.toFixed(4)}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-500 mb-0.5">基本围栏半径</div>
                  <div className="text-slate-800 font-medium tabular-nums">{Math.round(viewSubject.fenceRadius)} 米</div>
                </div>
              </div>
              {viewSubject.tempFence && viewSubject.tempFence.active && (
                <div className="mt-3 pt-3 border-t border-slate-200">
                  <div className="flex items-center gap-1.5 mb-2">
                    <span className="tag bg-emerald-100 text-emerald-700 text-xs">临时围栏（请假）</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <div className="text-xs text-slate-500 mb-0.5">去向</div>
                      <div className="text-slate-800 font-medium">{viewSubject.tempFence.destination}</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500 mb-0.5">有效期</div>
                      <div className="text-slate-800 font-medium tabular-nums">
                        {viewSubject.tempFence.startDate} ~ {viewSubject.tempFence.endDate}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg text-xs text-blue-800 leading-relaxed">
              <b>矫正期限：</b>
              <span className="tabular-nums">{viewSubject.sentenceStart}</span> 至
              <span className="tabular-nums"> {viewSubject.sentenceEnd}</span>
              <span className="ml-2">·</span>
              <span className="ml-2">联系电话：<b className="tabular-nums">{viewSubject.phone}</b></span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const SuspendDialog: React.FC = () => {
    if (!suspendDialog) return null;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => setSuspendDialog(null)}>
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-fadeIn" onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-between px-6 py-4 border-b">
            <h3 className="font-semibold text-slate-800 flex items-center gap-2">
              <Ban className="w-5 h-5 text-orange-500" />
              暂停权益确认
            </h3>
            <button className="p-2 hover:bg-slate-100 rounded-lg" onClick={() => setSuspendDialog(null)}>
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>
          <div className="p-6 space-y-4">
            <div className="p-4 bg-orange-50 border border-orange-200 rounded-xl">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-orange-500 mt-0.5 shrink-0" />
                <div className="text-sm text-orange-800 leading-relaxed">
                  <div className="font-semibold mb-1">操作警告</div>
                  <div>即将对矫正对象 <b className="text-orange-900">{suspendDialog.subjectName}</b> 执行权益暂停操作。</div>
                  <div className="mt-2 text-xs text-orange-700 space-y-0.5">
                    <div>• 暂停外出请假审批权限</div>
                    <div>• 限制活动范围为基本监管区域</div>
                    <div>• 自动标记为重点关注对象</div>
                  </div>
                </div>
              </div>
            </div>
            <div>
              <label className="label">暂停原因</label>
              <textarea
                className="input min-h-[90px]"
                value={suspendReason}
                onChange={e => setSuspendReason(e.target.value)}
                placeholder="请输入暂停原因"
              />
            </div>
          </div>
          <div className="px-6 py-4 border-t flex justify-end gap-3">
            <button className="btn-secondary" onClick={() => setSuspendDialog(null)}>取消</button>
            <button className="btn-danger gap-2" onClick={handleSuspendConfirm}>
              <Ban className="w-4 h-4" />
              确认暂停权益
            </button>
          </div>
        </div>
      </div>
    );
  };

  const RestoreDialog: React.FC = () => {
    if (!restoreDialog) return null;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => setRestoreDialog(null)}>
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-fadeIn" onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-between px-6 py-4 border-b">
            <h3 className="font-semibold text-slate-800 flex items-center gap-2">
              <Unlock className="w-5 h-5 text-emerald-500" />
              解除权益限制确认
            </h3>
            <button className="p-2 hover:bg-slate-100 rounded-lg" onClick={() => setRestoreDialog(null)}>
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>
          <div className="p-6 space-y-4">
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
              <div className="flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-500 mt-0.5 shrink-0" />
                <div className="text-sm text-emerald-800 leading-relaxed">
                  <div className="font-semibold mb-1">恢复权益</div>
                  <div>即将解除矫正对象 <b className="text-emerald-900">{restoreDialog.subjectName}</b> 的权益限制，恢复其各项监管权益。</div>
                </div>
              </div>
            </div>
            <div>
              <label className="label">恢复理由</label>
              <textarea
                className="input min-h-[90px]"
                value={restoreReason}
                onChange={e => setRestoreReason(e.target.value)}
                placeholder="请输入恢复理由"
              />
            </div>
          </div>
          <div className="px-6 py-4 border-t flex justify-end gap-3">
            <button className="btn-secondary" onClick={() => setRestoreDialog(null)}>取消</button>
            <button className="btn-success gap-2" onClick={handleRestoreConfirm}>
              <Unlock className="w-4 h-4" />
              确认解除限制
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-5">
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
                const isRightsSuspended = subject?.rightsSuspended;
                return (
                  <div key={r.id} className={classNames(
                    'p-4 rounded-xl border flex flex-wrap items-center justify-between gap-3',
                    isRightsSuspended
                      ? 'bg-red-50/60 border-red-200'
                      : 'bg-red-50/40 border-red-100'
                  )}>
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className={classNames(
                        'w-10 h-10 rounded-lg flex items-center justify-center shrink-0',
                        isRightsSuspended ? 'bg-red-200 text-red-700' : 'bg-red-100 text-red-600'
                      )}>
                        <AlertTriangle className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-slate-800">{r.subjectName}</span>
                          {statusTag(r.status)}
                          <span className="tag bg-red-200 text-red-800">逾期 {daysLate} 天</span>
                          {isRightsSuspended && (
                            <span className="tag bg-red-500 text-white flex items-center gap-1">
                              <ShieldAlert className="w-3 h-3" />
                              权益限制
                            </span>
                          )}
                          <span className="text-xs text-slate-500">{r.district} · {r.periodType === 'weekly' ? '周报到' : '月报'}</span>
                          <button
                            className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1 ml-auto"
                            onClick={() => subject && setViewSubject(subject)}
                          >
                            <Eye className="w-3.5 h-3.5" />查看详情
                          </button>
                        </div>
                        <div className="text-xs text-slate-600 mt-1 flex flex-wrap gap-4">
                          <span>应报到日期：<b className="text-slate-800 tabular-nums">{r.scheduledDate}</b></span>
                          {subject && <span>联系电话：<b className="tabular-nums">{subject.phone}</b></span>}
                          {subject && <span>家属：<b>{subject.familyName}</b> <span className="tabular-nums">{subject.familyPhone}</span></span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        className="btn-secondary gap-1.5 text-xs"
                        onClick={() => handleCheckInWithRestore(r.subjectId, r.id, subject)}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />补报到
                      </button>
                      {!isRightsSuspended && (
                        <button
                          className="btn-danger gap-1.5 text-xs"
                          onClick={() => alert(`已向【${r.subjectName}】发送催告短信：您已逾期${daysLate}天未报到，请立即前往司法所报到。`)}
                        >
                          <Bell className="w-3.5 h-3.5" />发送催告
                        </button>
                      )}
                      {!isRightsSuspended ? (
                        <button
                          className="bg-orange-500 text-white inline-flex items-center gap-1.5 justify-center rounded-md px-3 py-2 text-xs font-medium hover:bg-orange-600 active:scale-[0.98] transition-all"
                          onClick={() => setSuspendDialog({ subjectId: r.subjectId, subjectName: r.subjectName })}
                        >
                          <Ban className="w-3.5 h-3.5" />暂停权益
                        </button>
                      ) : (
                        <button
                          className="btn-success gap-1.5 text-xs"
                          onClick={() => setRestoreDialog({ subjectId: r.subjectId, subjectName: r.subjectName })}
                        >
                          <Unlock className="w-3.5 h-3.5" />解除限制
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

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
                <th className="text-left px-4 py-3 font-medium">权益</th>
                <th className="text-left px-4 py-3 font-medium w-40">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr><td colSpan={8} className="text-center text-slate-400 py-10">暂无记录</td></tr>
              ) : filtered.map(r => {
                const subject = subjects.find(s => s.id === r.subjectId);
                const isSuspended = subject?.rightsSuspended;
                return (
                  <tr key={r.id} className={classNames(
                    'hover:bg-slate-50/60 transition-colors',
                    isSuspended && 'bg-red-50/20'
                  )}>
                    <td className="px-4 py-3 font-medium text-slate-800">{r.subjectName}</td>
                    <td className="px-4 py-3 text-slate-600">{r.district}</td>
                    <td className="px-4 py-3">{r.periodType === 'weekly' ? '周报到' : '月报到'}</td>
                    <td className="px-4 py-3 tabular-nums text-slate-700">{r.scheduledDate}</td>
                    <td className="px-4 py-3 tabular-nums text-slate-700">{r.actualDate || '-'}</td>
                    <td className="px-4 py-3">{statusTag(r.status)}</td>
                    <td className="px-4 py-3">
                      {isSuspended ? (
                        <span className="tag bg-red-100 text-red-700 flex items-center gap-1 w-fit">
                          <ShieldAlert className="w-3 h-3" />权益暂停
                        </span>
                      ) : (
                        <span className="tag bg-green-100 text-green-700 flex items-center gap-1 w-fit">
                          <ShieldCheck className="w-3 h-3" />正常
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {r.status !== 'completed' && (
                          <button
                            className="text-blue-600 text-xs flex items-center gap-1 hover:text-blue-700"
                            onClick={() => handleCheckInWithRestore(r.subjectId, r.id, subject)}
                          >
                            <PlayCircle className="w-3.5 h-3.5" />报到
                          </button>
                        )}
                        {subject && (
                          <button
                            className="text-slate-600 text-xs flex items-center gap-1 hover:text-slate-700"
                            onClick={() => setViewSubject(subject)}
                          >
                            <Eye className="w-3.5 h-3.5" />详情
                          </button>
                        )}
                        {r.status === 'overdue' && isSuspended && (
                          <button
                            className="text-emerald-600 text-xs flex items-center gap-1 hover:text-emerald-700"
                            onClick={() => setRestoreDialog({ subjectId: r.subjectId, subjectName: r.subjectName })}
                          >
                            <Unlock className="w-3.5 h-3.5" />解限
                          </button>
                        )}
                        {r.status === 'overdue' && !isSuspended && (
                          <button
                            className="text-orange-600 text-xs flex items-center gap-1 hover:text-orange-700"
                            onClick={() => setSuspendDialog({ subjectId: r.subjectId, subjectName: r.subjectName })}
                          >
                            <Ban className="w-3.5 h-3.5" />暂停
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <SubjectDetailModal />
      <SuspendDialog />
      <RestoreDialog />
    </div>
  );
};

export default CheckinMgmt;
