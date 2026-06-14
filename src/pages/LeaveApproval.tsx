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
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { LeaveApplication, Subject, DISTRICTS } from '@/types';
import { formatDateTime, classNames } from '@/utils';

const LeaveApproval: React.FC = () => {
  const leaves = useAppStore(s => s.leaves);
  const subjects = useAppStore(s => s.subjects);
  const submitLeave = useAppStore(s => s.submitLeave);
  const reviewLeaveFirst = useAppStore(s => s.reviewLeaveFirst);
  const reviewLeaveSecond = useAppStore(s => s.reviewLeaveSecond);
  const urgeLeave = useAppStore(s => s.urgeLeave);

  const [showForm, setShowForm] = useState(false);
  const [viewApp, setViewApp] = useState<LeaveApplication | null>(null);
  const [viewSubject, setViewSubject] = useState<Subject | null>(null);
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
        if (filterStage === 'pending') return l.currentStage !== 'completed';
        if (filterStage === 'completed') return l.currentStage === 'completed';
        if (filterStage === 'first') return l.currentStage === 'first';
        if (filterStage === 'second') return l.currentStage === 'second';
      }
      return true;
    });
  }, [leaves, keyword, filterStage]);

  const stats = [
    { label: '申请总数', value: leaves.length, cls: 'bg-blue-50 text-blue-700' },
    { label: '待司法所初审', value: leaves.filter(l => l.currentStage === 'first').length, cls: 'bg-amber-50 text-amber-700' },
    { label: '待矫正中心复审', value: leaves.filter(l => l.currentStage === 'second').length, cls: 'bg-violet-50 text-violet-700' },
    { label: '已完成审批', value: leaves.filter(l => l.currentStage === 'completed').length, cls: 'bg-green-50 text-green-700' },
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

  const ReviewTimeline: React.FC<{ app: LeaveApplication; compact?: boolean }> = ({ app, compact }) => {
    type TimelineNode = {
      key: string;
      label: string;
      time?: string;
      done: boolean;
      status: 'approved' | 'rejected' | 'pending';
      sub?: string;
      reviewer?: string;
      urged?: boolean;
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
        status: app.firstReview.status,
        reviewer: app.firstReview.reviewer,
        urged: app.firstReview.urged,
        comment: app.firstReview.comment,
      },
      {
        key: 'second', label: '矫正中心复审', time: app.secondReview.time,
        done: app.secondReview.status !== 'pending' && app.currentStage !== 'first',
        status: app.secondReview.status,
        reviewer: app.secondReview.reviewer,
        urged: app.secondReview.urged,
        comment: app.secondReview.comment,
      },
    ];
    const finalApproved = app.firstReview.status === 'approved' && app.secondReview.status === 'approved';
    const finalRejected = app.firstReview.status === 'rejected' || app.secondReview.status === 'rejected';
    if (app.currentStage === 'completed' && (finalApproved || finalRejected)) {
      nodes.push({
        key: 'done', label: finalApproved ? '审批通过（已更新定位权限）' : '审批未通过',
        done: true, status: finalApproved ? 'approved' : 'rejected',
        time: app.secondReview.time,
      });
    }
    return (
      <div className={compact ? 'py-2' : 'py-4'}>
        <div className="flex items-start gap-2">
          {nodes.map((n, i) => {
            const isCurrent = !n.done;
            const iconCls = n.status === 'approved' ? 'bg-green-500' : n.status === 'rejected' ? 'bg-red-500' : isCurrent ? 'bg-blue-500 animate-pulse' : 'bg-slate-300';
            return (
              <React.Fragment key={n.key}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`w-7 h-7 rounded-full ${iconCls} text-white flex items-center justify-center shrink-0`}>
                      {n.status === 'approved' ? <Check className="w-4 h-4" />
                        : n.status === 'rejected' ? <X className="w-4 h-4" />
                          : <Clock className="w-3.5 h-3.5" />}
                    </span>
                    <div className="text-sm font-medium text-slate-800">{n.label}</div>
                    {n.urged && <span className="tag bg-red-100 text-red-700 animate-pulse">超时·已催办</span>}
                  </div>
                  <div className="pl-9 space-y-0.5">
                    {n.reviewer && <div className="text-xs text-slate-600">审批人：{n.reviewer}</div>}
                    {n.time && <div className="text-xs text-slate-500 tabular-nums">{formatDateTime(n.time)}</div>}
                    {n.sub && <div className="text-xs text-slate-500">申请人：{n.sub}</div>}
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
      {/* 统计 */}
      <div className="grid grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <div key={i} className={`card p-4 ${s.cls}`}>
            <div className="text-xs opacity-80 mb-1">{s.label}</div>
            <div className="text-2xl font-bold tabular-nums">{s.value}</div>
          </div>
        ))}
      </div>

      {/* 操作栏 */}
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
            <option value="completed">已完成</option>
          </select>
        </div>
        <button className="btn-primary gap-2" onClick={() => setShowForm(true)}>
          <Plus className="w-4 h-4" />
          新建请假申请
        </button>
      </div>

      {/* 列表 */}
      <div className="space-y-3">
        {filteredLeaves.length === 0 ? (
          <div className="card p-12 text-center text-sm text-slate-400">暂无请假申请</div>
        ) : filteredLeaves.map(l => {
          const subject = subjects.find(s => s.id === l.subjectId);
          const isUrgent = (l.currentStage === 'first' && l.firstReview.urged) || (l.currentStage === 'second' && l.secondReview.urged);
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
                      {isUrgent && <span className="ml-2 tag bg-red-100 text-red-700 animate-pulse flex items-center gap-1"><Bell className="w-3 h-3" />超时催办中</span>}
                    </h4>
                    <span className={`tag ${
                      l.currentStage === 'first' ? 'bg-blue-100 text-blue-700'
                        : l.currentStage === 'second' ? 'bg-violet-100 text-violet-700'
                          : (l.firstReview.status === 'approved' && l.secondReview.status === 'approved') ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                    }`}>
                      {l.currentStage === 'first' ? '司法所初审中'
                        : l.currentStage === 'second' ? '矫正中心复审中'
                          : (l.firstReview.status === 'approved' && l.secondReview.status === 'approved') ? '审批通过'
                            : '审批未通过'}
                    </span>
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
                  {subject && (
                    <div className="mt-3 flex items-center gap-3 text-xs">
                      <span className="text-slate-500">申请对象定位权限：</span>
                      <span className={`tag ${
                        subject.locationPermission === 'expanded' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {subject.locationPermission === 'expanded' ? '已扩展（请假审批通过）'
                          : subject.locationPermission === 'restricted' ? '受限' : '正常范围'}
                      </span>
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
                <div className="flex items-center gap-2">
                  {(l.currentStage === 'first' || l.currentStage === 'second') && (
                    <button
                      className="btn-secondary gap-1.5"
                      onClick={() => urgeLeave(l.id)}
                      disabled={l.currentStage === 'first' ? l.firstReview.urged : l.secondReview.urged}
                    >
                      <Bell className="w-4 h-4" />
                      {(l.currentStage === 'first' ? l.firstReview.urged : l.secondReview.urged) ? '已催办' : '模拟超时催办'}
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
                        <CheckCircle2 className="w-4 h-4" />复审通过（更新权限）
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 新建请假 */}
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
                <b>审批流程提示：</b>请假申请需经「司法所初审 → 矫正中心复审」两级审批，每级超时 2 小时自动催办。审批通过后系统将自动更新对象的定位权限为「已扩展」。
              </div>
            </div>
            <div className="px-6 py-4 border-t flex justify-end gap-3">
              <button className="btn-secondary" onClick={() => setShowForm(false)}>取消</button>
              <button className="btn-primary" onClick={doSubmit}><FileClock className="w-4 h-4 mr-1.5" />提交申请</button>
            </div>
          </div>
        </div>
      )}

      {/* 详情 */}
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
                  <div key={i} className="p-3 bg-slate-50 rounded-lg">
                    <div className="text-xs text-slate-500 mb-1">{k}</div>
                    <div className="text-sm font-medium text-slate-800">{v}</div>
                  </div>
                ))}
              </div>
              <div className="p-5 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-xl">
                <h4 className="text-sm font-semibold text-slate-700 mb-2">完整审批流程</h4>
                <ReviewTimeline app={viewApp} />
              </div>
              {(() => {
                const s = subjects.find(x => x.id === viewApp.subjectId);
                if (!s) return null;
                return (
                  <div className="p-4 rounded-xl border">
                    <h4 className="text-sm font-semibold text-slate-700 mb-3">矫正对象信息</h4>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div><span className="text-xs text-slate-500">姓名：</span><b>{s.name}</b></div>
                      <div><span className="text-xs text-slate-500">司法所：</span><b>{s.policeStation}</b></div>
                      <div><span className="text-xs text-slate-500">当前定位权限：</span>
                        <b className={s.locationPermission === 'expanded' ? 'text-emerald-600' : 'text-slate-700'}>
                          {s.locationPermission === 'expanded' ? '✅ 已扩展（请假）' : s.locationPermission === 'restricted' ? '⚠ 受限' : '正常范围'}
                        </b>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* 对象详情 */}
      {viewSubject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => setViewSubject(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl animate-fadeIn" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="font-semibold text-slate-800">矫正对象详情</h3>
              <button className="p-2 hover:bg-slate-100 rounded-lg" onClick={() => setViewSubject(null)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-400 to-indigo-600 text-white flex items-center justify-center text-xl font-bold">
                  {viewSubject.name.slice(0, 1)}
                </div>
                <div>
                  <h4 className="text-lg font-bold text-slate-800">{viewSubject.name}</h4>
                  <div className="text-xs text-slate-500 tabular-nums">{viewSubject.idCard}</div>
                </div>
                <div className="ml-auto">
                  <div className={`tag text-sm px-3 py-1 ${
                    viewSubject.locationPermission === 'expanded' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600'
                  }`}>
                    定位权限：{viewSubject.locationPermission === 'expanded' ? '已扩展' : viewSubject.locationPermission === 'restricted' ? '受限' : '正常'}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="p-3 bg-slate-50 rounded-lg"><span className="text-xs text-slate-500">区县：</span><b>{viewSubject.district}</b></div>
                <div className="p-3 bg-slate-50 rounded-lg"><span className="text-xs text-slate-500">司法所：</span><b>{viewSubject.policeStation}</b></div>
                <div className="p-3 bg-slate-50 rounded-lg"><span className="text-xs text-slate-500">罪名：</span><b>{viewSubject.charge}</b></div>
                <div className="p-3 bg-slate-50 rounded-lg"><span className="text-xs text-slate-500">矫正类型：</span><b>{viewSubject.correctionType}</b></div>
              </div>
              <div className={`p-4 rounded-xl border ${viewSubject.locationPermission === 'expanded' ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200'}`}>
                <div className="text-xs text-slate-600 mb-2 flex items-center gap-1.5">
                  <CheckCircle2 className={`w-4 h-4 ${viewSubject.locationPermission === 'expanded' ? 'text-emerald-600' : 'text-slate-400'}`} />
                  定位权限状态
                </div>
                <div className="text-sm font-medium text-slate-800 mb-1">
                  {viewSubject.locationPermission === 'expanded'
                    ? '✅ 请假审批已通过，定位权限已自动扩展至请假去向范围'
                    : '⚠ 当前为正常监管范围，请假审批通过后将自动更新'}
                </div>
                <div className="text-xs text-slate-500">
                  围栏中心：{viewSubject.fenceCenter.lat.toFixed(4)}, {viewSubject.fenceCenter.lng.toFixed(4)}
                  · 半径：{Math.round(viewSubject.fenceRadius)}m
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeaveApproval;
