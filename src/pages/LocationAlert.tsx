import React, { useState, useMemo, useEffect } from 'react';
import {
  Radar,
  MapPin,
  AlertTriangle,
  User,
  Phone,
  Clock,
  X,
  CheckCircle2,
  CircleDot,
  Shield,
  Send,
  Search,
  ShieldCheck,
  UserRound,
  ChevronRight,
  Eye,
  FileText,
  AlertCircle,
  Filter,
  Gauge,
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { AlertOrder, Subject, DISTRICTS, DisposalStep } from '@/types';
import { formatDateTime, classNames } from '@/utils';

const STATUS_LABELS: Record<AlertOrder['status'], string> = {
  pending: '待派单',
  accepted: '已接单',
  processing: '处置中',
  contacted: '已联系对象',
  family_replied: '家属已回执',
  resolved: '已结案',
};

const STATUS_COLORS: Record<AlertOrder['status'], string> = {
  pending: 'bg-red-100 text-red-700 border-red-200',
  accepted: 'bg-blue-100 text-blue-700 border-blue-200',
  processing: 'bg-violet-100 text-violet-700 border-violet-200',
  contacted: 'bg-cyan-100 text-cyan-700 border-cyan-200',
  family_replied: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  resolved: 'bg-slate-100 text-slate-600 border-slate-200',
};

const RISK_LEVEL_CONFIG = {
  high: { label: '高风险', cls: 'bg-red-100 text-red-700 border-red-200', dot: 'bg-red-500' },
  medium: { label: '中风险', cls: 'bg-orange-100 text-orange-700 border-orange-200', dot: 'bg-orange-500' },
  low: { label: '低风险', cls: 'bg-green-100 text-green-700 border-green-200', dot: 'bg-green-500' },
};

const STEP_ICON: Record<DisposalStep['step'], React.ReactNode> = {
  accept: <ShieldCheck className="w-3.5 h-3.5" />,
  contact_subject: <Phone className="w-3.5 h-3.5" />,
  family_reply: <UserRound className="w-3.5 h-3.5" />,
  onsite: <MapPin className="w-3.5 h-3.5" />,
  resolve: <CheckCircle2 className="w-3.5 h-3.5" />,
};

const STEP_LABEL: Record<DisposalStep['step'], string> = {
  accept: '接单',
  contact_subject: '联系对象',
  family_reply: '家属回执',
  onsite: '现场处置',
  resolve: '结案',
};

const STEP_COLOR: Record<DisposalStep['step'], string> = {
  accept: 'bg-blue-500',
  contact_subject: 'bg-cyan-500',
  family_reply: 'bg-emerald-500',
  onsite: 'bg-violet-500',
  resolve: 'bg-slate-600',
};

const FLOW_STEPS: { step: DisposalStep['step']; label: string; from: AlertOrder['status']; to: AlertOrder['status'] }[] = [
  { step: 'accept', label: '接单', from: 'pending', to: 'accepted' },
  { step: 'contact_subject', label: '联系对象', from: 'accepted', to: 'contacted' },
  { step: 'family_reply', label: '家属回执', from: 'contacted', to: 'family_replied' },
  { step: 'onsite', label: '现场处置', from: 'family_replied', to: 'processing' },
  { step: 'resolve', label: '结案', from: 'processing', to: 'resolved' },
];

const LocationAlert: React.FC = () => {
  const alerts = useAppStore(s => s.alerts);
  const subjects = useAppStore(s => s.subjects);
  const officers = useAppStore(s => s.officers);
  const currentOperator = useAppStore(s => s.currentOperator);
  const updateSubjectLocation = useAppStore(s => s.updateSubjectLocation);
  const acceptAlert = useAppStore(s => s.acceptAlert);
  const contactSubject = useAppStore(s => s.contactSubject);
  const recordFamilyReply = useAppStore(s => s.recordFamilyReply);
  const onsiteDisposal = useAppStore(s => s.onsiteDisposal);
  const resolveAlert = useAppStore(s => s.resolveAlert);

  const [selectedAlert, setSelectedAlert] = useState<AlertOrder | null>(null);
  const [viewSubject, setViewSubject] = useState<Subject | null>(null);
  const [filterLevel, setFilterLevel] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterDistrict, setFilterDistrict] = useState('');
  const [simSubjectId, setSimSubjectId] = useState('');
  const [simDistance, setSimDistance] = useState(300);

  const [showContactForm, setShowContactForm] = useState(false);
  const [contactNote, setContactNote] = useState('对象承诺立即返回，态度良好，已告知违规后果。');
  const [showFamilyForm, setShowFamilyForm] = useState(false);
  const [familyReply, setFamilyReply] = useState('家属已知晓并承诺协助督促对象立即返回监管区域。');
  const [showOnsiteForm, setShowOnsiteForm] = useState(false);
  const [onsiteResult, setOnsiteResult] = useState('现场核实完毕，已对对象进行口头警告教育，责令立即返回。');
  const [showResolveForm, setShowResolveForm] = useState(false);
  const [finalResult, setFinalResult] = useState('对象已返回电子围栏范围，预警解除，本次违规记入监管档案。');

  const activeSubjects = useMemo(() => subjects.filter(s => s.status === 'active'), [subjects]);
  useEffect(() => { if (activeSubjects.length && !simSubjectId) setSimSubjectId(activeSubjects[0].id); }, [activeSubjects, simSubjectId]);

  const filteredAlerts = useMemo(() => {
    return alerts.filter(a => {
      if (filterLevel && a.level !== filterLevel) return false;
      if (filterStatus && a.status !== filterStatus) return false;
      if (filterDistrict && a.district !== filterDistrict) return false;
      return true;
    });
  }, [alerts, filterLevel, filterStatus, filterDistrict]);

  const doSimulateReport = () => {
    const subject = subjects.find(s => s.id === simSubjectId);
    if (!subject) return;
    const angle = Math.random() * Math.PI * 2;
    const factor = simDistance < 1000 ? 0.0015 : 0.006;
    const loc = {
      lat: subject.fenceCenter.lat + Math.cos(angle) * (simDistance / 111320 + factor),
      lng: subject.fenceCenter.lng + Math.sin(angle) * (simDistance / (111320 * Math.cos(subject.fenceCenter.lat * Math.PI / 180)) + factor),
    };
    const alert = updateSubjectLocation(simSubjectId, loc);
    if (alert) {
      setTimeout(() => {
        const fresh = useAppStore.getState().alerts.find(a => a.id === alert.id);
        setSelectedAlert(fresh || alert);
      }, 50);
    }
  };

  const stats = [
    { label: '红色预警', value: alerts.filter(a => a.level === 'red').length, cls: 'bg-red-500', text: 'text-red-700', bg: 'bg-red-50' },
    { label: '橙色预警', value: alerts.filter(a => a.level === 'orange').length, cls: 'bg-orange-500', text: 'text-orange-700', bg: 'bg-orange-50' },
    { label: '黄色预警', value: alerts.filter(a => a.level === 'yellow').length, cls: 'bg-yellow-500', text: 'text-yellow-700', bg: 'bg-yellow-50' },
    { label: '待派单', value: alerts.filter(a => a.status === 'pending').length, cls: 'bg-blue-500', text: 'text-blue-700', bg: 'bg-blue-50' },
  ];

  const levelConfig = {
    red: { label: '红色', cls: 'bg-red-100 text-red-700 border-red-200', desc: '严重越界 >500米' },
    orange: { label: '橙色', cls: 'bg-orange-100 text-orange-700 border-orange-200', desc: '中度越界 200-500米' },
    yellow: { label: '黄色', cls: 'bg-yellow-100 text-yellow-700 border-yellow-200', desc: '轻微越界 <200米' },
  };

  const getCurrentFlowStep = (status: AlertOrder['status']) => {
    const idx = FLOW_STEPS.findIndex(f => f.from === status);
    return idx >= 0 ? idx : (status === 'resolved' ? 5 : 0);
  };

  const refreshSelected = (alertId: string) => {
    setTimeout(() => {
      const fresh = useAppStore.getState().alerts.find(a => a.id === alertId);
      if (fresh) setSelectedAlert(fresh);
    }, 50);
  };

  const handleAccept = () => {
    if (!selectedAlert) return;
    acceptAlert(selectedAlert.id, currentOperator);
    refreshSelected(selectedAlert.id);
  };

  const handleContact = () => {
    if (!selectedAlert || !contactNote.trim()) return;
    contactSubject(selectedAlert.id, currentOperator, contactNote.trim());
    setShowContactForm(false);
    refreshSelected(selectedAlert.id);
  };

  const handleFamilyReply = () => {
    if (!selectedAlert || !familyReply.trim()) return;
    recordFamilyReply(selectedAlert.id, currentOperator, familyReply.trim());
    setShowFamilyForm(false);
    refreshSelected(selectedAlert.id);
  };

  const handleOnsite = () => {
    if (!selectedAlert || !onsiteResult.trim()) return;
    onsiteDisposal(selectedAlert.id, currentOperator, onsiteResult.trim());
    setShowOnsiteForm(false);
    refreshSelected(selectedAlert.id);
  };

  const handleResolve = () => {
    if (!selectedAlert || !finalResult.trim()) return;
    resolveAlert(selectedAlert.id, currentOperator, finalResult.trim());
    setShowResolveForm(false);
    refreshSelected(selectedAlert.id);
  };

  const renderMap = () => {
    const subject = subjects.find(s => s.id === simSubjectId) || activeSubjects[0];
    if (!subject) return null;
    const scale = 100;
    const cx = 300;
    const cy = 220;
    const subjectPos = {
      x: cx + (subject.currentLocation.lng - subject.fenceCenter.lng) * 111320 * scale / subject.fenceRadius,
      y: cy - (subject.currentLocation.lat - subject.fenceCenter.lat) * 111320 * scale / subject.fenceRadius,
    };
    const officerPoints = officers.filter(o => o.district === subject.district).map(o => ({
      ...o,
      x: cx + (o.location.lng - subject.fenceCenter.lng) * 111320 * scale / subject.fenceRadius,
      y: cy - (o.location.lat - subject.fenceCenter.lat) * 111320 * scale / subject.fenceRadius,
    }));
    const dLat = (subject.currentLocation.lat - subject.fenceCenter.lat) * Math.PI / 180;
    const dLng = (subject.currentLocation.lng - subject.fenceCenter.lng) * Math.PI / 180;
    const R = 6371000;
    const la1 = subject.fenceCenter.lat * Math.PI / 180;
    const la2 = subject.currentLocation.lat * Math.PI / 180;
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2;
    const distance = Math.round(2 * R * Math.asin(Math.sqrt(h)));
    const outside = distance > subject.fenceRadius;

    return (
      <div className="relative h-[440px] rounded-xl bg-gradient-to-br from-slate-100 via-blue-50 to-slate-100 overflow-hidden border border-slate-200">
        <svg className="absolute inset-0 w-full h-full opacity-40">
          <defs>
            <pattern id="grid-loc" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#cbd5e1" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid-loc)" />
        </svg>
        <div className="absolute top-4 left-4 text-xs text-slate-500 bg-white/80 backdrop-blur px-3 py-1.5 rounded-lg shadow-sm border border-slate-200">
          监管区域：{subject.district} · {subject.policeStation}
        </div>
        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur rounded-lg shadow-sm border border-slate-200 p-3 text-[11px] space-y-1.5">
          <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full border-2 border-blue-400 bg-blue-400/20" />电子围栏</div>
          <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-blue-600" />当前位置</div>
          <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />工作人员</div>
          <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />越界位置</div>
        </div>
        <div
          className="absolute rounded-full border-2 border-blue-400 bg-blue-400/10"
          style={{
            width: `${Math.min(500, subject.fenceRadius * scale * 2 / 1000 + 80)}px`,
            height: `${Math.min(500, subject.fenceRadius * scale * 2 / 1000 + 80)}px`,
            left: cx - Math.min(250, subject.fenceRadius * scale / 1000 + 40),
            top: cy - Math.min(250, subject.fenceRadius * scale / 1000 + 40),
            boxShadow: '0 0 30px rgba(59,130,246,0.2) inset',
          }}
        />
        <div
          className="absolute rounded-full border border-dashed border-blue-400/60"
          style={{
            width: 10,
            height: 10,
            left: cx - 5,
            top: cy - 5,
          }}
        />
        {officerPoints.slice(0, 4).map((o, i) => (
          <div
            key={o.id}
            className="absolute w-6 h-6 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center"
            style={{ left: Math.max(30, Math.min(570, o.x)), top: Math.max(30, Math.min(410, o.y)) }}
            title={`${o.name} · ${o.station}`}
          >
            <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg ring-2 ring-white">
              <User className="w-3 h-3" />
            </div>
            <span className="absolute top-6 text-[10px] text-slate-600 whitespace-nowrap bg-white/80 px-1 rounded">{o.name}</span>
          </div>
        ))}
        <div
          className="absolute w-8 h-8 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center"
          style={{ left: Math.max(30, Math.min(570, subjectPos.x)), top: Math.max(30, Math.min(410, subjectPos.y)) }}
        >
          <div className={`absolute w-8 h-8 rounded-full ${outside ? 'bg-red-500/30 animate-ping' : 'bg-blue-500/20'}`} />
          <div className={`w-5 h-5 rounded-full ${outside ? 'bg-red-500 animate-pulse-slow' : 'bg-blue-600'} text-white flex items-center justify-center shadow-lg ring-2 ring-white z-10`}>
            <MapPin className="w-3 h-3" />
          </div>
        </div>
        <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between gap-4">
          <div className="bg-white/95 backdrop-blur rounded-lg shadow-sm border border-slate-200 p-3 text-xs flex-1">
            <div className="flex items-center gap-2 text-slate-800 font-medium mb-1">
              <MapPin className="w-3.5 h-3.5 text-blue-600" />
              {subject.name} 当前位置
            </div>
            <div className="text-slate-500">
              距围栏中心 <b className={outside ? 'text-red-600' : 'text-slate-800'}>{distance}</b> 米 /
              围栏半径 <b className="text-slate-800">{Math.round(subject.fenceRadius)}</b> 米
            </div>
            <div className={`mt-1 ${outside ? 'text-red-600 font-medium' : 'text-green-600'}`}>
              {outside ? `⚠ 已越界 ${distance - Math.round(subject.fenceRadius)} 米` : '✓ 在电子围栏范围内'}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderFlowBar = (alert: AlertOrder) => {
    const currentIdx = getCurrentFlowStep(alert.status);
    return (
      <div className="p-4 rounded-xl bg-gradient-to-r from-slate-50 to-blue-50 border border-slate-200">
        <div className="text-xs text-slate-500 mb-3 flex items-center gap-1.5">
          <Gauge className="w-3.5 h-3.5" />处置流程状态
        </div>
        <div className="flex items-center gap-1">
          {FLOW_STEPS.map((flow, i) => {
            const done = i < currentIdx || alert.status === 'resolved';
            const isCurrent = i === currentIdx && alert.status !== 'resolved';
            return (
              <React.Fragment key={flow.step}>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col items-center gap-1.5">
                    <div className={classNames(
                      'w-8 h-8 rounded-full flex items-center justify-center text-white shadow-sm transition-all',
                      done ? STEP_COLOR[flow.step] : isCurrent ? `${STEP_COLOR[flow.step]} animate-pulse ring-4 ring-opacity-30` : 'bg-slate-300',
                      isCurrent && 'ring-offset-1 ' + STEP_COLOR[flow.step].replace('bg-', 'ring-')
                    )}>
                      {STEP_ICON[flow.step]}
                    </div>
                    <div className={classNames(
                      'text-[11px] font-medium whitespace-nowrap',
                      done || isCurrent ? 'text-slate-800' : 'text-slate-400'
                    )}>
                      {flow.label}
                    </div>
                  </div>
                </div>
                {i < FLOW_STEPS.length - 1 && (
                  <div className={classNames(
                    'w-4 h-0.5 rounded-full shrink-0 mb-5',
                    i < currentIdx || alert.status === 'resolved' ? 'bg-emerald-400' : 'bg-slate-200'
                  )} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    );
  };

  const renderTimeline = (steps: DisposalStep[]) => {
    return (
      <div className="space-y-4 pl-1">
        {steps.length === 0 ? (
          <div className="text-center text-sm text-slate-400 py-6">暂无处置记录</div>
        ) : (
          <div className="relative">
            <div className="absolute left-3.5 top-2 bottom-2 w-0.5 bg-gradient-to-b from-blue-200 via-cyan-200 to-slate-200" />
            <div className="space-y-4">
              {steps.map((s, i) => (
                <div key={i} className="relative pl-10">
                  <div className={classNames(
                    'absolute left-0 w-7 h-7 rounded-full text-white flex items-center justify-center shadow-sm ring-2 ring-white',
                    STEP_COLOR[s.step]
                  )}>
                    {STEP_ICON[s.step]}
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="flex items-center justify-between mb-1.5 flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-slate-800">{STEP_LABEL[s.step]}</span>
                        <span className="tag bg-white text-slate-600 border border-slate-200 py-0">
                          <User className="w-3 h-3 inline mr-1 -mt-0.5" />{s.operator}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-500 tabular-nums flex items-center gap-1">
                        <Clock className="w-3 h-3" />{formatDateTime(s.time)}
                      </span>
                    </div>
                    <div className="text-sm text-slate-700 leading-relaxed">{s.content}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const getNextAction = (alert: AlertOrder) => {
    switch (alert.status) {
      case 'pending': return { key: 'accept', label: '接单', btnCls: 'btn-primary', icon: <ShieldCheck className="w-4 h-4 mr-1.5" /> };
      case 'accepted': return { key: 'contact', label: '联系对象', btnCls: 'btn-info', icon: <Phone className="w-4 h-4 mr-1.5" /> };
      case 'contacted': return { key: 'family', label: '家属回执', btnCls: 'btn-success', icon: <UserRound className="w-4 h-4 mr-1.5" /> };
      case 'family_replied': return { key: 'onsite', label: '现场处置', btnCls: 'btn-warn', icon: <MapPin className="w-4 h-4 mr-1.5" /> };
      case 'processing': return { key: 'resolve', label: '结案', btnCls: 'btn-success', icon: <CheckCircle2 className="w-4 h-4 mr-1.5" /> };
      default: return null;
    }
  };

  const getAlertSubject = (alert: AlertOrder) => subjects.find(s => s.id === alert.subjectId);
  const getAlertHistory = (subject: Subject) => alerts.filter(a => a.subjectId === subject.id);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <div key={i} className={`card p-4 ${s.bg} border-transparent`}>
            <div className="flex items-center justify-between">
              <div>
                <div className={`text-xs mb-1 ${s.text}`}>{s.label}</div>
                <div className={`text-3xl font-bold tabular-nums ${s.text}`}>{s.value}</div>
              </div>
              <div className={`w-10 h-10 rounded-xl ${s.cls} opacity-90 flex items-center justify-center shadow-sm`}>
                <AlertTriangle className="w-5 h-5 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-5">
        <div className="xl:col-span-3 space-y-5">
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                <Radar className="w-5 h-5 text-red-500" />
                实时位置监控面板
              </h3>
            </div>
            {renderMap()}
          </div>

          <div className="card p-5">
            <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <Send className="w-5 h-5 text-blue-500" />
              模拟设备位置上报（演示用）
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              <div>
                <label className="label">选择矫正对象</label>
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <select className="input pl-9" value={simSubjectId} onChange={e => setSimSubjectId(e.target.value)}>
                    {activeSubjects.map(s => <option key={s.id} value={s.id}>{s.name} - {s.district}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="label">模拟越界距离（米）</label>
                <input type="number" className="input" value={simDistance} onChange={e => setSimDistance(parseInt(e.target.value) || 0)} min={0} step={50} />
                <div className="flex gap-1 mt-1.5">
                  {[100, 300, 600, 1000].map(d => (
                    <button
                      key={d}
                      className={`flex-1 text-[11px] py-1 rounded-md border transition-colors ${
                        simDistance === d ? 'bg-blue-500 text-white border-blue-500' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                      onClick={() => setSimDistance(d)}
                    >{d}m</button>
                  ))}
                </div>
              </div>
              <div className="md:col-span-2 flex gap-3">
                <button className="btn-primary flex-1" onClick={doSimulateReport}>
                  <Send className="w-4 h-4 mr-1.5" />
                  上报位置并检测围栏
                </button>
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-4 leading-relaxed p-3 bg-slate-50 rounded-lg">
              💡 提示：设置距离大于围栏半径（约2000-5000米）时，会触发越界预警。系统自动根据越界距离生成红/橙/黄三级预警工单，
              自动分配最近社矫工作人员，并发送家属通知。处置流程：接单 → 联系对象 → 家属回执 → 现场处置 → 结案。
            </p>
          </div>
        </div>

        <div className="xl:col-span-2">
          <div className="card p-5 h-full flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-800">预警工单列表</h3>
              <span className="text-xs text-slate-500">共 {filteredAlerts.length} 条</span>
            </div>
            <div className="grid grid-cols-3 gap-2 mb-4">
              <select className="input text-xs" value={filterLevel} onChange={e => setFilterLevel(e.target.value)}>
                <option value="">全部等级</option>
                <option value="red">红色</option>
                <option value="orange">橙色</option>
                <option value="yellow">黄色</option>
              </select>
              <select className="input text-xs" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                <option value="">全部状态</option>
                <option value="pending">待派单</option>
                <option value="accepted">已接单</option>
                <option value="contacted">已联系对象</option>
                <option value="family_replied">家属已回执</option>
                <option value="processing">处置中</option>
                <option value="resolved">已结案</option>
              </select>
              <select className="input text-xs" value={filterDistrict} onChange={e => setFilterDistrict(e.target.value)}>
                <option value="">全部区县</option>
                {DISTRICTS.map(d => <option key={d}>{d}</option>)}
              </select>
            </div>
            <div className="space-y-2.5 overflow-y-auto flex-1 pr-1">
              {filteredAlerts.length === 0 ? (
                <div className="text-center text-sm text-slate-400 py-16">暂无预警工单</div>
              ) : filteredAlerts.map(a => {
                const cfg = levelConfig[a.level];
                const subject = getAlertSubject(a);
                return (
                  <button
                    key={a.id}
                    className={classNames(
                      'w-full text-left p-3.5 rounded-xl border transition-all group',
                      selectedAlert?.id === a.id ? 'border-blue-400 bg-blue-50/50 shadow-sm' : 'border-slate-100 bg-white hover:border-slate-200 hover:shadow-sm'
                    )}
                    onClick={() => setSelectedAlert(a)}
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                          a.level === 'red' ? 'bg-red-500 animate-pulse-slow' : a.level === 'orange' ? 'bg-orange-500' : 'bg-yellow-500'
                        }`} />
                        <span className={`tag border ${cfg.cls}`}>{cfg.label}预警</span>
                        <span className="text-sm font-medium text-slate-800">{a.subjectName}</span>
                      </div>
                      <span className={`tag border ${STATUS_COLORS[a.status]}`}>
                        {STATUS_LABELS[a.status]}
                      </span>
                    </div>
                    <div className="text-xs text-slate-600 mb-1.5">{a.description}</div>
                    {subject && (
                      <div className={`mb-2 inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded border ${RISK_LEVEL_CONFIG[subject.riskLevel].cls}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${RISK_LEVEL_CONFIG[subject.riskLevel].dot}`} />
                        {RISK_LEVEL_CONFIG[subject.riskLevel].label} · 累计预警 {subject.alertHistoryCount} 次
                      </div>
                    )}
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1"><User className="w-3 h-3" />{a.assignedOfficer.name}</span>
                        <span className="flex items-center gap-1"><Shield className="w-3 h-3" />{a.district}</span>
                      </div>
                      <span className="flex items-center gap-1 tabular-nums">
                        <Clock className="w-3 h-3" />
                        {formatDateTime(a.createdAt).slice(5)}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {selectedAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => setSelectedAlert(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl animate-fadeIn max-h-[92vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className={`px-6 py-4 border-b flex items-center justify-between ${
              selectedAlert.level === 'red' ? 'bg-gradient-to-r from-red-50 to-transparent'
                : selectedAlert.level === 'orange' ? 'bg-gradient-to-r from-orange-50 to-transparent'
                  : 'bg-gradient-to-r from-yellow-50 to-transparent'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  selectedAlert.level === 'red' ? 'bg-red-500' : selectedAlert.level === 'orange' ? 'bg-orange-500' : 'bg-yellow-500'
                }`}>
                  <AlertTriangle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800">
                    {levelConfig[selectedAlert.level].label}预警工单
                    <span className="ml-2 text-xs font-normal text-slate-500">#{selectedAlert.id}</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">{levelConfig[selectedAlert.level].desc} · {selectedAlert.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`tag border ${STATUS_COLORS[selectedAlert.status]}`}>
                  {STATUS_LABELS[selectedAlert.status]}
                </span>
                <button className="p-2 hover:bg-white/60 rounded-lg" onClick={() => setSelectedAlert(null)}>
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {renderFlowBar(selectedAlert)}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-50">
                  <div className="text-xs text-slate-500 mb-2">越界位置信息</div>
                  <div className="text-sm space-y-1">
                    <div>纬度：<b className="tabular-nums">{selectedAlert.location.lat.toFixed(6)}</b></div>
                    <div>经度：<b className="tabular-nums">{selectedAlert.location.lng.toFixed(6)}</b></div>
                    <div>越界距离：<b className="text-red-600 tabular-nums">{selectedAlert.fenceDistance} 米</b></div>
                    <div>发生时间：<b className="tabular-nums">{formatDateTime(selectedAlert.createdAt)}</b></div>
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-blue-50 border border-blue-100">
                  <div className="text-xs text-blue-600 mb-2 flex items-center gap-1"><User className="w-3 h-3" />自动分配 · 最近工作人员</div>
                  <div className="text-sm space-y-1">
                    <div className="font-medium text-slate-800 text-base">{selectedAlert.assignedOfficer.name}</div>
                    <div className="flex items-center gap-1 text-slate-600"><Phone className="w-3.5 h-3.5" /><span className="tabular-nums">{selectedAlert.assignedOfficer.phone}</span></div>
                    <div className="text-slate-600">{selectedAlert.assignedOfficer.station}</div>
                    <div className="text-xs text-blue-600 pt-1">所属：{selectedAlert.assignedOfficer.district}</div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  className="btn-secondary flex-1 text-sm"
                  onClick={() => {
                    const s = getAlertSubject(selectedAlert);
                    if (s) setViewSubject(s);
                  }}
                >
                  <Eye className="w-4 h-4 mr-1.5" />
                  查看对象详情
                </button>
              </div>

              <div className={`p-4 rounded-xl border ${selectedAlert.familyNotified ? 'bg-green-50 border-green-200' : 'bg-slate-50 border-slate-200'}`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs text-slate-600 flex items-center gap-1"><CircleDot className="w-3.5 h-3.5" />家属通知记录</div>
                  <span className={`tag ${selectedAlert.familyNotified ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                    {selectedAlert.familyNotified ? '已通知' : '未通知'}
                  </span>
                </div>
                {selectedAlert.familyNotified ? (
                  <div className="text-sm space-y-1">
                    <div className="flex items-center gap-2 text-slate-700">
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                      <span>SMS 通知发送成功</span>
                    </div>
                    <div className="text-xs text-slate-500 pl-6">发送时间：{selectedAlert.familyNotifyTime ? formatDateTime(selectedAlert.familyNotifyTime) : '-'}</div>
                    <div className="text-xs text-slate-500 pl-6">通知内容：【社矫监管】您的家属{selectedAlert.subjectName}已越出电子围栏{selectedAlert.fenceDistance}米，请及时联系。</div>
                  </div>
                ) : (
                  <div className="text-sm text-slate-500">等待系统自动发送...</div>
                )}
              </div>

              <div className="p-4 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-600" />处置流程时间线
                  </div>
                  <span className="text-xs text-slate-500">共 {selectedAlert.disposalSteps.length} 步</span>
                </div>
                {renderTimeline(selectedAlert.disposalSteps)}
              </div>
            </div>
            <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-3 bg-slate-50/60">
              {(() => {
                const next = getNextAction(selectedAlert);
                if (!next) {
                  return <span className="text-sm text-slate-500 flex items-center gap-1"><CheckCircle2 className="w-4 h-4 text-green-600" />该预警工单已结案</span>;
                }
                return (
                  <>
                    <button
                      className={next.btnCls}
                      onClick={() => {
                        if (next.key === 'accept') handleAccept();
                        if (next.key === 'contact') setShowContactForm(true);
                        if (next.key === 'family') setShowFamilyForm(true);
                        if (next.key === 'onsite') setShowOnsiteForm(true);
                        if (next.key === 'resolve') setShowResolveForm(true);
                      }}
                    >
                      {next.icon}
                      {next.label}
                    </button>
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {selectedAlert && showContactForm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setShowContactForm(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg animate-fadeIn" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b bg-cyan-50/60">
              <h3 className="font-semibold text-slate-800 flex items-center gap-2"><Phone className="w-5 h-5 text-cyan-600" />联系对象情况登记</h3>
              <button className="p-2 hover:bg-white/60 rounded-lg" onClick={() => setShowContactForm(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="p-3 rounded-lg bg-cyan-50 border border-cyan-100 text-xs text-cyan-800">
                <AlertCircle className="w-3.5 h-3.5 inline mr-1.5 mb-0.5" />
                当前操作：<b>{currentOperator}</b> 正在登记与 <b>{selectedAlert.subjectName}</b> 的联系情况
              </div>
              <div>
                <label className="label">联系情况说明 <span className="text-red-500">*</span></label>
                <textarea
                  className="input min-h-[120px]"
                  value={contactNote}
                  onChange={e => setContactNote(e.target.value)}
                  placeholder="请详细记录与对象联系的内容、对象态度、承诺返回情况等"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                {['对象承诺立即返回，态度良好。', '对象称在附近办事，半小时内返回。', '对象电话未接通，已短信告知。', '对象情绪激动，需进一步劝导。'].map(t => (
                  <button
                    key={t}
                    type="button"
                    className="text-left text-xs p-2 rounded-lg border border-slate-200 hover:border-cyan-300 hover:bg-cyan-50 transition-colors text-slate-700"
                    onClick={() => setContactNote(t)}
                  >{t}</button>
                ))}
              </div>
            </div>
            <div className="px-6 py-4 border-t flex justify-end gap-3 bg-slate-50/60">
              <button className="btn-secondary" onClick={() => setShowContactForm(false)}>取消</button>
              <button className="btn-info" onClick={handleContact} disabled={!contactNote.trim()}>
                <Phone className="w-4 h-4 mr-1.5" />确认提交
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedAlert && showFamilyForm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setShowFamilyForm(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg animate-fadeIn" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b bg-emerald-50/60">
              <h3 className="font-semibold text-slate-800 flex items-center gap-2"><UserRound className="w-5 h-5 text-emerald-600" />家属回执登记</h3>
              <button className="p-2 hover:bg-white/60 rounded-lg" onClick={() => setShowFamilyForm(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-100 text-xs text-emerald-800">
                <AlertCircle className="w-3.5 h-3.5 inline mr-1.5 mb-0.5" />
                当前操作：<b>{currentOperator}</b> 正在登记 <b>{selectedAlert.subjectName}</b> 家属的回执情况
              </div>
              <div>
                <label className="label">家属回执内容 <span className="text-red-500">*</span></label>
                <textarea
                  className="input min-h-[120px]"
                  value={familyReply}
                  onChange={e => setFamilyReply(e.target.value)}
                  placeholder="请记录家属反馈内容、是否知晓情况、是否承诺协助督促等"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                {['家属已知晓，承诺协助督促返回。', '家属表示会立即联系并劝其返回。', '家属感谢告知，会密切配合。', '家属称无法联系到本人。'].map(t => (
                  <button
                    key={t}
                    type="button"
                    className="text-left text-xs p-2 rounded-lg border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 transition-colors text-slate-700"
                    onClick={() => setFamilyReply(t)}
                  >{t}</button>
                ))}
              </div>
            </div>
            <div className="px-6 py-4 border-t flex justify-end gap-3 bg-slate-50/60">
              <button className="btn-secondary" onClick={() => setShowFamilyForm(false)}>取消</button>
              <button className="btn-success" onClick={handleFamilyReply} disabled={!familyReply.trim()}>
                <UserRound className="w-4 h-4 mr-1.5" />确认回执
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedAlert && showOnsiteForm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setShowOnsiteForm(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg animate-fadeIn" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b bg-violet-50/60">
              <h3 className="font-semibold text-slate-800 flex items-center gap-2"><MapPin className="w-5 h-5 text-violet-600" />现场处置登记</h3>
              <button className="p-2 hover:bg-white/60 rounded-lg" onClick={() => setShowOnsiteForm(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="p-3 rounded-lg bg-violet-50 border border-violet-100 text-xs text-violet-800">
                <AlertCircle className="w-3.5 h-3.5 inline mr-1.5 mb-0.5" />
                当前操作：<b>{currentOperator}</b> 正在登记 <b>{selectedAlert.subjectName}</b> 的现场处置结果
              </div>
              <div>
                <label className="label">现场处置结果 <span className="text-red-500">*</span></label>
                <textarea
                  className="input min-h-[120px]"
                  value={onsiteResult}
                  onChange={e => setOnsiteResult(e.target.value)}
                  placeholder="请详细记录现场核实情况、采取的处置措施、教育情况等"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                {['现场核实，已口头警告教育，责令返回。', '已找到对象，陪同返回监管区域。', '对象已自行返回，进行书面训诫。', '情节较严重，启动进一步调查程序。'].map(t => (
                  <button
                    key={t}
                    type="button"
                    className="text-left text-xs p-2 rounded-lg border border-slate-200 hover:border-violet-300 hover:bg-violet-50 transition-colors text-slate-700"
                    onClick={() => setOnsiteResult(t)}
                  >{t}</button>
                ))}
              </div>
            </div>
            <div className="px-6 py-4 border-t flex justify-end gap-3 bg-slate-50/60">
              <button className="btn-secondary" onClick={() => setShowOnsiteForm(false)}>取消</button>
              <button className="btn-warn" onClick={handleOnsite} disabled={!onsiteResult.trim()}>
                <MapPin className="w-4 h-4 mr-1.5" />确认处置
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedAlert && showResolveForm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setShowResolveForm(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg animate-fadeIn" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b bg-slate-100/60">
              <h3 className="font-semibold text-slate-800 flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-slate-700" />结案登记</h3>
              <button className="p-2 hover:bg-white/60 rounded-lg" onClick={() => setShowResolveForm(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800">
                <AlertCircle className="w-3.5 h-3.5 inline mr-1.5 mb-0.5" />
                结案确认：结案后本预警工单将归档，相关处置记录将记入对象监管档案。
              </div>
              <div>
                <label className="label">最终结案说明 <span className="text-red-500">*</span></label>
                <textarea
                  className="input min-h-[120px]"
                  value={finalResult}
                  onChange={e => setFinalResult(e.target.value)}
                  placeholder="请说明最终处置结果、对象当前状态、是否记入档案等"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                {['对象已返回，预警解除，记入监管档案。', '对象已返回，给予警告处理。', '已完成全部处置流程，正常结案。', '移交后续处理，本次预警结案。'].map(t => (
                  <button
                    key={t}
                    type="button"
                    className="text-left text-xs p-2 rounded-lg border border-slate-200 hover:border-slate-400 hover:bg-slate-100 transition-colors text-slate-700"
                    onClick={() => setFinalResult(t)}
                  >{t}</button>
                ))}
              </div>
            </div>
            <div className="px-6 py-4 border-t flex justify-end gap-3 bg-slate-50/60">
              <button className="btn-secondary" onClick={() => setShowResolveForm(false)}>取消</button>
              <button className="btn-success" onClick={handleResolve} disabled={!finalResult.trim()}>
                <CheckCircle2 className="w-4 h-4 mr-1.5" />确认结案
              </button>
            </div>
          </div>
        </div>
      )}

      {viewSubject && (() => {
        const subject = viewSubject;
        const alertHistory = getAlertHistory(subject);
        const riskCfg = RISK_LEVEL_CONFIG[subject.riskLevel];
        return (
          <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => setViewSubject(null)}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl animate-fadeIn max-h-[92vh] flex flex-col" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between px-6 py-4 border-b bg-gradient-to-r from-blue-50 to-transparent">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center text-lg font-bold shadow-sm">
                    {subject.name.slice(0, 1)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-800 text-lg">{subject.name} <span className="text-xs font-normal text-slate-500 ml-1">· 矫正对象详情</span></h3>
                    <p className="text-xs text-slate-500 mt-0.5 tabular-nums">编号：{subject.id}</p>
                  </div>
                </div>
                <button className="p-2 hover:bg-white/60 rounded-lg" onClick={() => setViewSubject(null)}><X className="w-5 h-5 text-slate-400" /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-6 space-y-5">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className={`tag border ${riskCfg.cls} text-sm px-3 py-1`}>
                    <span className={`w-2 h-2 rounded-full inline mr-1.5 ${riskCfg.dot}`} />
                    {riskCfg.label}
                  </span>
                  <span className="tag bg-blue-50 text-blue-700 border border-blue-200 text-sm px-3 py-1">
                    累计预警 <b className="ml-1 tabular-nums">{subject.alertHistoryCount}</b> 次
                  </span>
                  <span className={`tag text-sm px-3 py-1 border ${subject.rightsSuspended ? 'bg-red-50 text-red-700 border-red-200' : 'bg-green-50 text-green-700 border-green-200'}`}>
                    权益状态：{subject.rightsSuspended ? '已限制' : '正常'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {[
                    ['姓名', subject.name],
                    ['身份证号', subject.idCard],
                    ['性别', subject.gender],
                    ['所属区县', subject.district],
                    ['司法所', subject.policeStation],
                    ['罪名', subject.charge],
                    ['矫正类型', subject.correctionType],
                    ['矫正期限', `${subject.sentenceStart} ~ ${subject.sentenceEnd}`],
                  ].map(([k, v], i) => (
                    <div key={i} className="p-3 bg-slate-50 rounded-lg">
                      <div className="text-xs text-slate-500 mb-1">{k}</div>
                      <div className="text-sm font-medium text-slate-800 truncate">{v}</div>
                    </div>
                  ))}
                </div>

                <div className={`p-4 rounded-xl border ${subject.tempFence?.active ? 'bg-emerald-50 border-emerald-200' : 'bg-blue-50 border-blue-200'}`}>
                  <div className="text-xs text-slate-600 mb-3 flex items-center gap-1.5 font-medium">
                    <MapPin className="w-4 h-4 text-blue-600" />
                    {subject.tempFence?.active ? '当前临时围栏信息（请假期间）' : '当前电子围栏信息'}
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {subject.tempFence?.active ? (
                      <>
                        <div><span className="text-xs text-slate-500">请假去向：</span><b className="text-emerald-700">{subject.tempFence.destination}</b></div>
                        <div><span className="text-xs text-slate-500">有效期：</span><b>{subject.tempFence.startDate} ~ {subject.tempFence.endDate}</b></div>
                        <div><span className="text-xs text-slate-500">临时围栏中心：</span><b className="tabular-nums">{subject.tempFence.center.lat.toFixed(4)}, {subject.tempFence.center.lng.toFixed(4)}</b></div>
                        <div><span className="text-xs text-slate-500">围栏半径：</span><b>{subject.tempFence.radius} 米</b></div>
                      </>
                    ) : (
                      <>
                        <div><span className="text-xs text-slate-500">围栏中心：</span><b className="tabular-nums">{subject.fenceCenter.lat.toFixed(4)}, {subject.fenceCenter.lng.toFixed(4)}</b></div>
                        <div><span className="text-xs text-slate-500">围栏半径：</span><b>{Math.round(subject.fenceRadius)} 米</b></div>
                        <div><span className="text-xs text-slate-500">定位权限：</span><b>
                          {subject.locationPermission === 'normal' ? '正常范围' : subject.locationPermission === 'expanded' ? '已扩展（请假）' : '受限'}
                        </b></div>
                        <div><span className="text-xs text-slate-500">当前状态：</span><b>
                          {subject.status === 'active' ? '在矫中' : subject.status === 'pending' ? '待入矫' : '已解矫'}
                        </b></div>
                      </>
                    )}
                  </div>
                </div>

                {subject.rightsSuspended && (
                  <div className="p-4 rounded-xl bg-red-50 border border-red-200">
                    <div className="text-xs text-red-600 mb-2 flex items-center gap-1.5 font-medium">
                      <AlertCircle className="w-4 h-4" />权益限制信息
                    </div>
                    <div className="text-sm space-y-1 text-red-800">
                      <div>限制原因：{subject.rightsSuspendReason || '未说明'}</div>
                      {subject.rightsSuspendTime && <div className="text-xs text-red-600 tabular-nums">限制时间：{formatDateTime(subject.rightsSuspendTime)}</div>}
                    </div>
                  </div>
                )}

                <div className="p-4 rounded-xl border border-slate-200">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-orange-500" />预警历史记录
                    </div>
                    <span className="text-xs text-slate-500">共 {alertHistory.length} 条记录</span>
                  </div>
                  {alertHistory.length === 0 ? (
                    <div className="text-center text-sm text-slate-400 py-8">暂无预警历史记录</div>
                  ) : (
                    <div className="overflow-x-auto -mx-4 px-4">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-xs text-slate-500 border-b border-slate-200">
                            <th className="text-left font-medium py-2 pr-4 whitespace-nowrap">预警时间</th>
                            <th className="text-left font-medium py-2 pr-4 whitespace-nowrap">预警级别</th>
                            <th className="text-left font-medium py-2 pr-4 whitespace-nowrap">当前状态</th>
                            <th className="text-left font-medium py-2 whitespace-nowrap">处置结果</th>
                          </tr>
                        </thead>
                        <tbody>
                          {alertHistory.slice(0, 10).map(a => {
                            const lvlCfg = levelConfig[a.level];
                            return (
                              <tr key={a.id} className="border-b border-slate-100 last:border-0">
                                <td className="py-2.5 pr-4 text-xs text-slate-600 tabular-nums whitespace-nowrap">{formatDateTime(a.createdAt).slice(5)}</td>
                                <td className="py-2.5 pr-4">
                                  <span className={`tag border ${lvlCfg.cls} text-[11px]`}>{lvlCfg.label}</span>
                                </td>
                                <td className="py-2.5 pr-4">
                                  <span className={`tag border ${STATUS_COLORS[a.status]} text-[11px]`}>{STATUS_LABELS[a.status]}</span>
                                </td>
                                <td className="py-2.5 text-xs text-slate-700 max-w-[200px] truncate">
                                  {a.finalResult || (a.disposalSteps.length > 0 ? a.disposalSteps[a.disposalSteps.length - 1].content : '处置中')}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                      {alertHistory.length > 10 && (
                        <div className="text-xs text-center text-slate-400 mt-3 pt-3 border-t border-slate-100">仅显示最近 10 条，共 {alertHistory.length} 条预警记录</div>
                      )}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <div className="text-xs text-slate-500 mb-1">家属姓名</div>
                    <div className="text-sm font-medium text-slate-800">{subject.familyName}</div>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <div className="text-xs text-slate-500 mb-1">家属联系电话</div>
                    <div className="text-sm font-medium text-slate-800 tabular-nums flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />{subject.familyPhone}
                    </div>
                  </div>
                </div>
              </div>
              <div className="px-6 py-4 border-t flex justify-end bg-slate-50/60">
                <button className="btn-primary" onClick={() => setViewSubject(null)}>关闭</button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default LocationAlert;
