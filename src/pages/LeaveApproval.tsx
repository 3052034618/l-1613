import React, { useState, useMemo } from 'react';
import {
  FileClock,
  Plus,
  Search,
  Clock,
  User,
  MapPin,
  X,
  Check,
  XCircle,
  AlertCircle,
  Eye,
  ChevronRight,
  CheckCircle2,
  Bell,
  Filter,
  Phone,
  Shield,
  ShieldAlert,
  ShieldCheck,
  MapPinned,
  Calendar,
  LogOut,
  History,
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { LeaveApplication, Subject, DISTRICTS, LeaveStage } from '@/types';
import { formatDateTime, classNames } from '@/utils';

const LeaveApproval: React.FC = () => {
  const leaves = useAppStore(s => s.leaves);
  const subjects = useAppStore(s => s.subjects);
  const submitLeave = useAppStore(s => s.submitLeave);
  const reviewLeaveFirst = useAppStore(s => s.reviewLeaveFirst);
  const reviewLeaveSecond = useAppStore(s => s.reviewLeaveSecond);
  const urgeLeave = useAppStore(s => s.urgeLeave);
  const returnFromLeave = useAppStore(s => s.returnFromLeave);
  const currentOperator = useAppStore(s => s.currentOperator);

  const [showForm, setShowForm] = useState(false);
  const [viewApp, setViewApp] = useState<LeaveApplication | null>(null);
  const [viewSubject, setViewSubject] = useState<Subject | null>(null);
  const [showReturnModal, setShowReturnModal] = useState<LeaveApplication | null>(null);
  const [returnNote, setReturnNote] = useState('');
  const [filterStage, setFilterStage] = useState('');
  const [keyword, setKeyword] = useState('');

  const [form, setForm] = useState({
    subjectId: '',
    subjectName: '',
    reason: '',
    startDate: '',
    endDate: '',
    destination: '',
    contact: '',
  });

  const activeSubjects = useMemo(() => subjects.filter(s => s.status === 'active'), [subjects]);

  const filteredLeaves = useMemo(() => {
    return leaves.filter(l => {
      if (keyword && !(`${l.subjectName}${l.reason}${l.destination}`.includes(keyword))) return false;
      if (filterStage) {
        if (filterStage === 'pending') return !['completed', 'vacation', 'returned'].includes(l.currentStage);
        if (filterStage === 'completed') return l.currentStage === 'completed';
        if (filterStage === 'first') return l.currentStage === 'first';
        if (filterStage === 'second') return l.currentStage === 'second';
        if (filterStage === 'vacation') return l.currentStage === 'vacation';
        if (filterStage === 'returned') return l.currentStage === 'returned';
      }
      return true;
    });
  }, [leaves, keyword, filterStage]);

  const stats = [
    { label: '申请总数', value: leaves.length, cls: 'bg-blue-50 text-blue-700' },
    { label: '待司法所初审', value: leaves.filter(l => l.currentStage === 'first').length, cls: 'bg-amber-50 text-amber-700' },
    { label: '待矫正中心复审', value: leaves.filter(l => l.currentStage === 'second').length, cls: 'bg-violet-50 text-violet-700' },
    { label: '休假中', value: leaves.filter(l => l.currentStage === 'vacation').length, cls: 'bg-emerald-50 text-emerald-700' },
    { label: '已销假', value: leaves.filter(l => l.currentStage === 'returned').length, cls: 'bg-slate-50 text-slate-700' },
  ];

  const doSubmit = () => {
    if (!form.subjectId || !form.reason || !form.startDate || !form.endDate || !form.destination || !form.contact) {
      alert('请填写完整信息');
      return;
    }
    submitLeave({ ...form });
    setShowForm(false);
    setForm({ subjectId: '', subjectName: '', reason: '', startDate: '', endDate: '', destination: '', contact: '' });
  };

  const doReturn = () => {
    if (!showReturnModal) return;
    returnFromLeave(showReturnModal.id, currentOperator, returnNote);
    setShowReturnModal(null);
    setReturnNote('');
  };

  const getStageLabel = (stage: LeaveStage | 'first' | 'second') => {
    return stage === 'first' ? '司法所初审' : '矫正中心复审';
  };

  const getLocationPermissionBadge = (perm: Subject['locationPermission']) => {
    switch (perm) {
      case 'normal':
        return { cls: 'bg-green-100 text-green-700 border border-green-200', label: '正常', icon: ShieldCheck };
      case 'expanded':
        return { cls: 'bg-blue-100 text-blue-700 border border-blue-200', label: '已扩展（请假）', icon: Shield };
      case 'restricted':
        return { cls: 'bg-red-100 text-red-700 border border-red-200', label: '受限', icon: ShieldAlert };
      default:
        return { cls: 'bg-slate-100 text-slate-600 border border-slate-200', label: '未知', icon: Shield };
    }
  };

  const getStatusBadge = (app: LeaveApplication) => {
    switch (app.currentStage) {
      case 'first':
        return { cls: 'bg-blue-100 text-blue-700 border border-blue-200', label: '司法所初审中' };
      case 'second':
        return { cls: 'bg-violet-100 text-violet-700 border border-violet-200', label: '矫正中心复审中' };
      case 'vacation':
        return { cls: 'bg-emerald-100 text-emerald-700 border border-emerald-200', label: '休假中' };
      case 'returned':
        return { cls: 'bg-slate-100 text-slate-700 border border-slate-200', label: '已销假' };
      case 'completed':
        if (app.firstReview.status === 'approved' && app.secondReview.status === 'approved') {
          return { cls: 'bg-green-100 text-green-700 border border-green-200', label: '审批通过' };
        }
        return { cls: 'bg-red-100 text-red-700 border border-red-200', label: '审批未通过' };
      default:
        if (app.firstReview.status === 'approved' && app.secondReview.status === 'approved') {
          return { cls: 'bg-green-100 text-green-700 border border-green-200', label: '审批通过' };
        }
        return { cls: 'bg-red-100 text-red-700 border border-red-200', label: '审批未通过' };
    }
  };

  const ReviewTimeline: React.FC<{ app: LeaveApplication; compact?: boolean }> = ({ app, compact }) => {
    type TimelineNode = {
      key: string;
      label: string;
      time?: string;
      done: boolean;
      status: 'approved' | 'rejected' | 'pending' | 'active';
      sub?: string;
      reviewer?: string;
      urged?: boolean;
      urgedCount?: number;
      comment?: string;
    };
    const nodes: TimelineNode[] = [
      {
        key: 'submit', label: '提交申请', time: app.submittedAt,
        done: true, status: 'approved',
        sub: app.subjectName,
      },
      {
        key: 'first', label: '司法所初审', time: app.firstReview.time,
        done: app.firstReview.status !== 'pending',
        status: app.firstReview.status === 'pending' ? 'pending' : app.firstReview.status,
        reviewer: app.firstReview.reviewer,
        urged: app.firstReview.urged,
        urgedCount: app.firstReview.urgedCount,
        comment: app.firstReview.comment,
      },
      {
        key: 'second', label: '矫正中心复审', time: app.secondReview.time,
        done: app.secondReview.status !== 'pending' && app.currentStage !== 'first',
        status: (app.currentStage === 'first') ? 'pending' : (app.secondReview.status === 'pending' ? 'pending' : app.secondReview.status),
        reviewer: app.secondReview.reviewer,
        urged: app.secondReview.urged,
        urgedCount: app.secondReview.urgedCount,
        comment: app.secondReview.comment,
      },
      {
        key: 'vacation', label: '休假中',
        time: app.currentStage === 'vacation' || app.currentStage === 'returned' ? app.secondReview.time : undefined,
        done: app.currentStage === 'vacation' || app.currentStage === 'returned',
        status: (app.currentStage === 'vacation') ? 'active' : (app.currentStage === 'returned' ? 'approved' : 'pending'),
      },
      {
        key: 'returned', label: '已销假',
        time: app.returnedAt,
        done: app.currentStage === 'returned',
        status: app.currentStage === 'returned' ? 'approved' : 'pending',
        sub: app.returnNote,
      },
    ];
    return (
      <div className={compact ? 'py-2' : 'py-4'}>
        <div className="flex items-start gap-2">
          {nodes.map((n, i) => {
            const isCurrent = !n.done;
            const iconCls = n.status === 'approved' ? 'bg-green-500'
              : n.status === 'rejected' ? 'bg-red-500'
              : n.status === 'active' ? 'bg-emerald-500 animate-pulse'
              : isCurrent ? 'bg-blue-500 animate-pulse'
              : 'bg-slate-300';
            return (
              <React.Fragment key={n.key}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className={`w-7 h-7 rounded-full ${iconCls} text-white flex items-center justify-center shrink-0`}>
                      {n.status === 'approved' ? <Check className="w-4 h-4" />
                        : n.status === 'rejected' ? <X className="w-4 h-4" />
                        : n.status === 'active' ? <Check className="w-4 h-4" />
                        : <Clock className="w-3.5 h-3.5" />}
                    </span>
                    <div className="text-sm font-medium text-slate-800">{n.label}</div>
                    {n.urged && (
                      <span className="tag bg-red-100 text-red-700 border border-red-200 animate-pulse flex items-center gap-1">
                        <Bell className="w-3 h-3" />催办 {n.urgedCount || 1} 次
                      </span>
                    )}
                  </div>
                  <div className="pl-9 space-y-0.5">
                    {n.reviewer && <div className="text-xs text-slate-600">审批人：{n.reviewer}</div>}
                    {n.time && <div className="text-xs text-slate-500 tabular-nums">{formatDateTime(n.time)}</div>}
                    {n.key === 'submit' && n.sub && <div className="text-xs text-slate-500">申请人：{n.sub}</div>}
                    {n.key === 'returned' && n.sub && <div className="text-xs text-slate-600 mt-1 p-2 bg-slate-50 rounded">📋 {n.sub}</div>}
                    {n.comment && <div className="text-xs text-slate-600 mt-1 p-2 bg-slate-50 rounded">💬 {n.comment}</div>}
                  </div>
                </div>
                {i < nodes.length - 1 && <ChevronRight className={`w-4 h-4 mt-1.5 shrink-0 ${n.done ? 'text-green-400' : 'text-slate-300'}`} />}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-5 gap-4">
        {stats.map((s, i) => (
          <div key={i} className={`card p-4 ${s.cls}`}>
            <div className="text-xs opacity-80 mb-1">{s.label}</div>
            <div className="text-2xl font-bold tabular-nums">{s.value}</div>
          </div>
        ))}
      </div>

      <div className="card p-4 flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[260px] relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input className="input pl-9" placeholder="搜索姓名 / 事由 / 去向" value={keyword} onChange={e => setKeyword(e.target.value)} />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400 ml-1" />
          <select className="input w-auto" value={filterStage} onChange={e => setFilterStage(e.target.value)}>
            <option value="">全部状态</option>
            <option value="pending">待审批</option>
            <option value="first">司法所初审</option>
            <option value="second">矫正中心复审</option>
            <option value="vacation">休假中</option>
            <option value="returned">已销假</option>
            <option value="completed">已完成</option>
          </select>
        </div>
        <button className="btn-primary gap-2" onClick={() => setShowForm(true)}>
          <Plus className="w-4 h-4" />
          新建请假申请
        </button>
      </div>

      <div className="space-y-3">
        {filteredLeaves.length === 0 ? (
          <div className="card p-12 text-center text-sm text-slate-400">暂无请假申请</div>
        ) : filteredLeaves.map(l => {
          const subject = subjects.find(s => s.id === l.subjectId);
          const isUrgent = (l.currentStage === 'first' && l.firstReview.urged) || (l.currentStage === 'second' && l.secondReview.urged);
          const statusBadge = getStatusBadge(l);
          const totalUrged = l.urgeHistory.length;
          return (
            <div key={l.id} className={classNames(
              'card p-5 transition-all',
              isUrgent && 'ring-2 ring-red-200 bg-red-50/20'
            )}>
              <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <h4 className="font-semibold text-slate-800 text-base">
                      {l.subjectName} 的请假申请
                    </h4>
                    <span className={`tag ${statusBadge.cls}`}>{statusBadge.label}</span>
                    {isUrgent && <span className="tag bg-red-100 text-red-700 border border-red-200 animate-pulse flex items-center gap-1"><Bell className="w-3 h-3" />超时催办中</span>}
                    {totalUrged > 0 && (
                      <span className="tag bg-orange-50 text-orange-700 border border-orange-200 flex items-center gap-1">
                        <History className="w-3 h-3" />累计催办 {totalUrged} 次
                      </span>
                    )}
                    <button className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1 ml-auto" onClick={() => setViewApp(l)}>
                      <Eye className="w-3.5 h-3.5" />查看详情
                    </button>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <div className="flex items-start gap-2">
                      <FileClock className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                      <div>
                        <div className="text-xs text-slate-500">请假事由</div>
                        <div className="text-slate-800 font-medium">{l.reason}</div>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Clock className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                      <div>
                        <div className="text-xs text-slate-500">请假时间</div>
                        <div className="text-slate-800 font-medium tabular-nums">{l.startDate} ~ {l.endDate}</div>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                      <div>
                        <div className="text-xs text-slate-500">去向</div>
                        <div className="text-slate-800 font-medium">{l.destination}</div>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Phone className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                      <div>
                        <div className="text-xs text-slate-500">联系方式</div>
                        <div className="text-slate-800 font-medium tabular-nums">{l.contact}</div>
                      </div>
                    </div>
                  </div>
                  {l.currentStage === 'returned' && l.returnedAt && (
                    <div className="mt-3 flex items-center gap-2 text-xs">
                      <LogOut className="w-3.5 h-3.5 text-slate-500" />
                      <span className="text-slate-500">销假时间：</span>
                      <span className="text-slate-700 font-medium tabular-nums">{formatDateTime(l.returnedAt)}</span>
                    </div>
                  )}
                  {subject && (
                    <div className="mt-3 flex items-center gap-3 text-xs flex-wrap">
                      <span className="text-slate-500">对象定位权限：</span>
                      {(() => {
                        const badge = getLocationPermissionBadge(subject.locationPermission);
                        const Icon = badge.icon;
                        return (
                          <span className={`tag ${badge.cls} flex items-center gap-1`}>
                            <Icon className="w-3 h-3" />{badge.label}
                          </span>
                        );
                      })()}
                      <button className="text-blue-600 hover:text-blue-700 flex items-center gap-1" onClick={() => setViewSubject(subject)}>
                        <User className="w-3 h-3" />查看对象详情
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <div className="border-t border-slate-100 pt-2 -mx-5 px-5 flex items-center justify-between flex-wrap gap-3">
                <div className="flex-1 min-w-[600px]">
                  <ReviewTimeline app={l} compact />
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {(l.currentStage === 'first' || l.currentStage === 'second') && (
                    <button
                      className="btn-secondary gap-1.5"
                      onClick={() => urgeLeave(l.id)}
                    >
                      <Bell className="w-4 h-4" />
                      {l.currentStage === 'first'
                        ? (l.firstReview.urgedCount ? `催办（${l.firstReview.urgedCount}次）` : '模拟超时催办')
                        : (l.secondReview.urgedCount ? `催办（${l.secondReview.urgedCount}次）` : '模拟超时催办')}
                    </button>
                  )}
                  {l.currentStage === 'first' && (
                    <>
                      <button
                        className="btn-danger gap-1.5"
                        onClick={() => reviewLeaveFirst(l.id, false, '李警官', '材料不全，退回补充。')}
                      >
                        <XCircle className="w-4 h-4" />初审不通过
                      </button>
                      <button
                        className="btn-success gap-1.5"
                        onClick={() => reviewLeaveFirst(l.id, true, '李警官', '情况属实，同意报送复审。')}
                      >
                        <CheckCircle2 className="w-4 h-4" />初审通过
                      </button>
                    </>
                  )}
                  {l.currentStage === 'second' && (
                    <>
                      <button
                        className="btn-danger gap-1.5"
                        onClick={() => reviewLeaveSecond(l.id, false, '张主任', '请假理由不充分，不予批准。')}
                      >
                        <XCircle className="w-4 h-4" />复审不通过
                      </button>
                      <button
                        className="btn-success gap-1.5"
                        onClick={() => reviewLeaveSecond(l.id, true, '张主任', '审批通过，请按时报到并保持联系。')}
                      >
                        <CheckCircle2 className="w-4 h-4" />复审通过
                      </button>
                    </>
                  )}
                  {l.currentStage === 'vacation' && (
                    <button
                      className="btn-primary gap-1.5"
                      onClick={() => { setShowReturnModal(l); setReturnNote(''); }}
                    >
                      <LogOut className="w-4 h-4" />销假
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl animate-fadeIn" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="font-semibold text-slate-800 flex items-center gap-2"><Plus className="w-5 h-5 text-blue-500" />新建请假申请</h3>
              <button className="p-2 hover:bg-slate-100 rounded-lg" onClick={() => setShowForm(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="label">矫正对象 <span className="text-red-500">*</span></label>
                <select className="input" value={form.subjectId} onChange={e => {
                  const s = subjects.find(x => x.id === e.target.value);
                  setForm({ ...form, subjectId: e.target.value, subjectName: s?.name || '' });
                }}>
                  <option value="">请选择矫正对象</option>
                  {activeSubjects.map(s => <option key={s.id} value={s.id}>{s.name} - {s.district} - {s.policeStation}</option>)}
                </select>
              </div>
              <div>
                <label className="label">请假事由 <span className="text-red-500">*</span></label>
                <textarea className="input min-h-[80px]" value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} placeholder="请详细说明请假原因" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">开始日期 <span className="text-red-500">*</span></label>
                  <input type="date" className="input" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} />
                </div>
                <div>
                  <label className="label">结束日期 <span className="text-red-500">*</span></label>
                  <input type="date" className="input" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">去向 <span className="text-red-500">*</span></label>
                  <input className="input" value={form.destination} onChange={e => setForm({ ...form, destination: e.target.value })} placeholder="如：河北省保定市" />
                </div>
                <div>
                  <label className="label">外出联系方式 <span className="text-red-500">*</span></label>
                  <input className="input" value={form.contact} onChange={e => setForm({ ...form, contact: e.target.value })} placeholder="手机号" maxLength={11} />
                </div>
              </div>
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 leading-relaxed">
                <AlertCircle className="w-4 h-4 inline mr-1.5 mb-0.5" />
                <b>审批流程提示：</b>请假申请需经「司法所初审 → 矫正中心复审」两级审批，每级超时 2 小时自动催办。审批通过后系统将自动更新对象的定位权限为「已扩展」并生成临时围栏。
              </div>
            </div>
            <div className="px-6 py-4 border-t flex justify-end gap-3">
              <button className="btn-secondary" onClick={() => setShowForm(false)}>取消</button>
              <button className="btn-primary" onClick={doSubmit}><FileClock className="w-4 h-4 mr-1.5" />提交申请</button>
            </div>
          </div>
        </div>
      )}

      {viewApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => setViewApp(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl animate-fadeIn max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="font-semibold text-slate-800">请假申请详情 #{viewApp.id}</h3>
              <button className="p-2 hover:bg-slate-100 rounded-lg" onClick={() => setViewApp(null)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                {[
                  ['申请人', viewApp.subjectName],
                  ['请假事由', viewApp.reason],
                  ['请假时段', `${viewApp.startDate} 至 ${viewApp.endDate}`],
                  ['去向', viewApp.destination],
                  ['联系电话', viewApp.contact],
                  ['提交时间', formatDateTime(viewApp.submittedAt)],
                ].map(([k, v], i) => (
                  <div key={i} className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                    <div className="text-xs text-slate-500 mb-1">{k}</div>
                    <div className="text-sm font-medium text-slate-800">{v}</div>
                  </div>
                ))}
              </div>
              {viewApp.currentStage === 'returned' && viewApp.returnedAt && (
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs text-slate-500 mb-1">销假时间</div>
                      <div className="text-sm font-medium text-slate-800 tabular-nums">{formatDateTime(viewApp.returnedAt)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500 mb-1">销假说明</div>
                      <div className="text-sm font-medium text-slate-800">{viewApp.returnNote || '-'}</div>
                    </div>
                  </div>
                </div>
              )}
              <div className="p-5 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-xl">
                <h4 className="text-sm font-semibold text-slate-700 mb-2">完整审批流程</h4>
                <ReviewTimeline app={viewApp} />
              </div>
              {(() => {
                const s = subjects.find(x => x.id === viewApp.subjectId);
                if (!s) return null;
                const locBadge = getLocationPermissionBadge(s.locationPermission);
                const LocIcon = locBadge.icon;
                return (
                  <div className="p-4 rounded-xl border border-slate-200 space-y-4">
                    <h4 className="text-sm font-semibold text-slate-700 mb-0">矫正对象信息</h4>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div><span className="text-xs text-slate-500">姓名：</span><b>{s.name}</b></div>
                      <div><span className="text-xs text-slate-500">司法所：</span><b>{s.policeStation}</b></div>
                      <div>
                        <span className="text-xs text-slate-500 mr-1">定位权限：</span>
                        <span className={`tag ${locBadge.cls} inline-flex items-center gap-1`}>
                          <LocIcon className="w-3 h-3" />{locBadge.label}
                        </span>
                      </div>
                    </div>
                    <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-xs text-slate-500 mr-1">权益状态：</span>
                        {s.rightsSuspended ? (
                          <span className="tag bg-red-100 text-red-700 border border-red-200 flex items-center gap-1 inline-flex">
                            <ShieldAlert className="w-3 h-3" />已暂停
                          </span>
                        ) : (
                          <span className="tag bg-green-100 text-green-700 border border-green-200 flex items-center gap-1 inline-flex">
                            <ShieldCheck className="w-3 h-3" />权益正常
                          </span>
                        )}
                        {s.rightsSuspended && s.rightsSuspendReason && (
                          <div className="mt-2 text-xs text-slate-600 p-2 bg-red-50 rounded">
                            暂停原因：{s.rightsSuspendReason}
                          </div>
                        )}
                      </div>
                    </div>
                    {s.tempFence && (
                      <div className={`pt-3 border-t border-slate-100`}>
                        <div className={`p-4 rounded-xl border ${s.tempFence.active ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200'}`}>
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <MapPinned className={`w-4 h-4 ${s.tempFence.active ? 'text-emerald-600' : 'text-slate-500'}`} />
                              <span className={`text-sm font-semibold ${s.tempFence.active ? 'text-emerald-700' : 'text-slate-700'}`}>临时围栏信息</span>
                            </div>
                            <span className={`tag ${s.tempFence.active ? 'bg-emerald-500 text-white' : 'bg-slate-400 text-white'}`}>
                              {s.tempFence.active ? '● active 激活中' : '● 已停用'}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <div>
                              <div className="text-xs text-slate-500 mb-0.5 flex items-center gap-1">
                                <MapPin className="w-3 h-3" />目的地
                              </div>
                              <div className="font-medium text-slate-800">{s.tempFence.destination}</div>
                            </div>
                            <div>
                              <div className="text-xs text-slate-500 mb-0.5 flex items-center gap-1">
                                <MapPinned className="w-3 h-3" />中心经纬度
                              </div>
                              <div className="font-medium text-slate-800 tabular-nums">
                                {s.tempFence.center.lat.toFixed(4)}, {s.tempFence.center.lng.toFixed(4)}
                              </div>
                            </div>
                            <div>
                              <div className="text-xs text-slate-500 mb-0.5 flex items-center gap-1">
                                <CircleIcon className="w-3 h-3" />围栏半径
                              </div>
                              <div className="font-medium text-slate-800 tabular-nums">{s.tempFence.radius} 米</div>
                            </div>
                            <div>
                              <div className="text-xs text-slate-500 mb-0.5 flex items-center gap-1">
                                <Calendar className="w-3 h-3" />有效日期
                              </div>
                              <div className="font-medium text-slate-800 tabular-nums">
                                {s.tempFence.startDate} ~ {s.tempFence.endDate}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
              {viewApp.urgeHistory.length > 0 && (
                <div className="p-4 rounded-xl border border-orange-200 bg-orange-50/50">
                  <div className="flex items-center gap-2 mb-3">
                    <History className="w-4 h-4 text-orange-600" />
                    <h4 className="text-sm font-semibold text-orange-700">催办历史记录</h4>
                    <span className="tag bg-orange-100 text-orange-700 border border-orange-200 ml-auto">
                      累计催办 {viewApp.urgeHistory.length} 次
                    </span>
                  </div>
                  <div className="overflow-hidden rounded-lg border border-orange-100">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-orange-100/60 text-orange-800 text-xs">
                          <th className="px-4 py-2 text-left font-medium">阶段</th>
                          <th className="px-4 py-2 text-left font-medium">催办时间</th>
                          <th className="px-4 py-2 text-center font-medium">阶段累计次数</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-orange-100">
                        {viewApp.urgeHistory.map((h, i) => (
                          <tr key={i}>
                            <td className="px-4 py-2 text-slate-700">
                              <span className={`tag ${h.stage === 'first' ? 'bg-blue-100 text-blue-700' : 'bg-violet-100 text-violet-700'}`}>
                                {getStageLabel(h.stage)}
                              </span>
                            </td>
                            <td className="px-4 py-2 text-slate-600 tabular-nums">{formatDateTime(h.time)}</td>
                            <td className="px-4 py-2 text-center">
                              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-orange-100 text-orange-700 font-semibold text-xs tabular-nums">
                                {h.count}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {viewSubject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => setViewSubject(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl animate-fadeIn" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="font-semibold text-slate-800">矫正对象详情</h3>
              <button className="p-2 hover:bg-slate-100 rounded-lg" onClick={() => setViewSubject(null)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-4 flex-wrap">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-400 to-indigo-600 text-white flex items-center justify-center text-xl font-bold shrink-0">
                  {viewSubject.name.slice(0, 1)}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-lg font-bold text-slate-800">{viewSubject.name}</h4>
                  <div className="text-xs text-slate-500 tabular-nums">{viewSubject.idCard}</div>
                </div>
                {(() => {
                  const badge = getLocationPermissionBadge(viewSubject.locationPermission);
                  const Icon = badge.icon;
                  return (
                    <span className={`tag text-sm px-3 py-1.5 ${badge.cls} flex items-center gap-1.5`}>
                      <Icon className="w-3.5 h-3.5" />定位权限：{badge.label}
                    </span>
                  );
                })()}
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100"><span className="text-xs text-slate-500">区县：</span><b>{viewSubject.district}</b></div>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100"><span className="text-xs text-slate-500">司法所：</span><b>{viewSubject.policeStation}</b></div>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100"><span className="text-xs text-slate-500">罪名：</span><b>{viewSubject.charge}</b></div>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100"><span className="text-xs text-slate-500">矫正类型：</span><b>{viewSubject.correctionType}</b></div>
              </div>
              <div className="p-4 rounded-xl border bg-slate-50 border-slate-200">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="w-4 h-4 text-slate-600" />
                  <span className="text-xs font-semibold text-slate-700">权益状态</span>
                </div>
                <div className="flex items-center gap-3">
                  {viewSubject.rightsSuspended ? (
                    <span className="tag bg-red-100 text-red-700 border border-red-200 flex items-center gap-1.5 px-3 py-1.5">
                      <ShieldAlert className="w-4 h-4" />权益已暂停
                    </span>
                  ) : (
                    <span className="tag bg-green-100 text-green-700 border border-green-200 flex items-center gap-1.5 px-3 py-1.5">
                      <ShieldCheck className="w-4 h-4" />权益正常
                    </span>
                  )}
                </div>
                {viewSubject.rightsSuspended && viewSubject.rightsSuspendReason && (
                  <div className="mt-3 p-2 bg-red-50 rounded border border-red-100 text-xs text-red-700">
                    <div className="font-medium mb-0.5">暂停原因：</div>
                    <div>{viewSubject.rightsSuspendReason}</div>
                    {viewSubject.rightsSuspendTime && (
                      <div className="mt-1 text-red-600/80 tabular-nums">暂停时间：{formatDateTime(viewSubject.rightsSuspendTime)}</div>
                    )}
                  </div>
                )}
              </div>
              {viewSubject.tempFence && (
                <div className={`p-4 rounded-xl border ${viewSubject.tempFence.active ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200'}`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <MapPinned className={`w-4 h-4 ${viewSubject.tempFence.active ? 'text-emerald-600' : 'text-slate-500'}`} />
                      <span className={`text-sm font-semibold ${viewSubject.tempFence.active ? 'text-emerald-700' : 'text-slate-700'}`}>临时围栏（请假生成）</span>
                    </div>
                    <span className={`tag ${viewSubject.tempFence.active ? 'bg-emerald-500 text-white' : 'bg-slate-400 text-white'}`}>
                      {viewSubject.tempFence.active ? '● active 激活中' : '● 已停用'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <div className="text-xs text-slate-500 mb-0.5 flex items-center gap-1">
                        <MapPin className="w-3 h-3" />目的地
                      </div>
                      <div className="font-medium text-slate-800">{viewSubject.tempFence.destination}</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500 mb-0.5 flex items-center gap-1">
                        <MapPinned className="w-3 h-3" />中心经纬度
                      </div>
                      <div className="font-medium text-slate-800 tabular-nums">
                        {viewSubject.tempFence.center.lat.toFixed(4)}, {viewSubject.tempFence.center.lng.toFixed(4)}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500 mb-0.5 flex items-center gap-1">
                        <CircleIcon className="w-3 h-3" />围栏半径
                      </div>
                      <div className="font-medium text-slate-800 tabular-nums">{viewSubject.tempFence.radius} 米</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500 mb-0.5 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />有效日期
                      </div>
                      <div className="font-medium text-slate-800 tabular-nums">
                        {viewSubject.tempFence.startDate} ~ {viewSubject.tempFence.endDate}
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div className={`p-4 rounded-xl border ${viewSubject.locationPermission === 'expanded' ? 'bg-blue-50 border-blue-200' : viewSubject.locationPermission === 'restricted' ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-slate-200'}`}>
                <div className="text-xs text-slate-600 mb-2 flex items-center gap-1.5">
                  <CheckCircle2 className={`w-4 h-4 ${viewSubject.locationPermission === 'expanded' ? 'text-blue-600' : viewSubject.locationPermission === 'restricted' ? 'text-red-600' : 'text-slate-400'}`} />
                  定位权限状态详情
                </div>
                <div className="text-sm font-medium text-slate-800 mb-1">
                  {viewSubject.locationPermission === 'expanded'
                    ? '🔵 请假审批已通过，定位权限已自动扩展至请假去向范围'
                    : viewSubject.locationPermission === 'restricted'
                    ? '🔴 定位权限受限，仅限基础监管范围活动'
                    : '🟢 当前为正常监管范围，请假审批通过后将自动更新'}
                </div>
                <div className="text-xs text-slate-500">
                  常规围栏中心：{viewSubject.fenceCenter.lat.toFixed(4)}, {viewSubject.fenceCenter.lng.toFixed(4)}
                  · 半径：{Math.round(viewSubject.fenceRadius)}m
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showReturnModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => setShowReturnModal(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-fadeIn" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                <LogOut className="w-5 h-5 text-blue-500" />销假确认
              </h3>
              <button className="p-2 hover:bg-slate-100 rounded-lg" onClick={() => setShowReturnModal(null)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <User className="w-4 h-4 text-blue-500" />
                  <span className="text-slate-600">矫正对象：</span>
                  <b className="text-slate-800">{showReturnModal.subjectName}</b>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <FileClock className="w-4 h-4 text-blue-500" />
                  <span className="text-slate-600">请假事由：</span>
                  <b className="text-slate-800">{showReturnModal.reason}</b>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="w-4 h-4 text-blue-500" />
                  <span className="text-slate-600">请假时段：</span>
                  <b className="text-slate-800 tabular-nums">{showReturnModal.startDate} ~ {showReturnModal.endDate}</b>
                </div>
              </div>
              <div>
                <label className="label">销假说明 <span className="text-slate-400 font-normal">（选填）</span></label>
                <textarea
                  className="input min-h-[90px]"
                  value={returnNote}
                  onChange={e => setReturnNote(e.target.value)}
                  placeholder="请输入销假说明，如：已按时返回，情况正常..."
                />
              </div>
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 leading-relaxed">
                <AlertCircle className="w-4 h-4 inline mr-1.5 mb-0.5" />
                <b>操作提示：</b>确认销假后，系统将自动恢复对象的定位权限为「正常」，并将临时围栏设置为停用状态。
              </div>
            </div>
            <div className="px-6 py-4 border-t flex justify-end gap-3">
              <button className="btn-secondary" onClick={() => setShowReturnModal(null)}>取消</button>
              <button className="btn-primary" onClick={doReturn}>
                <CheckCircle2 className="w-4 h-4 mr-1.5" />确认销假
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const CircleIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
  </svg>
);

export default LeaveApproval;
