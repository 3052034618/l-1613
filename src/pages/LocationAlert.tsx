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
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { AlertOrder, Subject, DISTRICTS } from '@/types';
import { formatDateTime, classNames } from '@/utils';

const LocationAlert: React.FC = () => {
  const alerts = useAppStore(s => s.alerts);
  const subjects = useAppStore(s => s.subjects);
  const officers = useAppStore(s => s.officers);
  const updateSubjectLocation = useAppStore(s => s.updateSubjectLocation);
  const updateAlertStatus = useAppStore(s => s.updateAlertStatus);

  const [selectedAlert, setSelectedAlert] = useState<AlertOrder | null>(null);
  const [filterLevel, setFilterLevel] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterDistrict, setFilterDistrict] = useState('');
  const [simSubjectId, setSimSubjectId] = useState('');
  const [simDistance, setSimDistance] = useState(300);

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
    if (alert) setSelectedAlert(alert);
  };

  const stats = [
    { label: '红色预警', value: alerts.filter(a => a.level === 'red').length, cls: 'bg-red-500', text: 'text-red-700', bg: 'bg-red-50' },
    { label: '橙色预警', value: alerts.filter(a => a.level === 'orange').length, cls: 'bg-orange-500', text: 'text-orange-700', bg: 'bg-orange-50' },
    { label: '黄色预警', value: alerts.filter(a => a.level === 'yellow').length, cls: 'bg-yellow-500', text: 'text-yellow-700', bg: 'bg-yellow-50' },
    { label: '待处理', value: alerts.filter(a => a.status === 'pending').length, cls: 'bg-blue-500', text: 'text-blue-700', bg: 'bg-blue-50' },
  ];

  const levelConfig = {
    red: { label: '红色', cls: 'bg-red-100 text-red-700 border-red-200', desc: '严重越界 >500米' },
    orange: { label: '橙色', cls: 'bg-orange-100 text-orange-700 border-orange-200', desc: '中度越界 200-500米' },
    yellow: { label: '黄色', cls: 'bg-yellow-100 text-yellow-700 border-yellow-200', desc: '轻微越界 <200米' },
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
        {/* 网格 */}
        <svg className="absolute inset-0 w-full h-full opacity-40">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#cbd5e1" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
        {/* 区域标注 */}
        <div className="absolute top-4 left-4 text-xs text-slate-500 bg-white/80 backdrop-blur px-3 py-1.5 rounded-lg shadow-sm border border-slate-200">
          监管区域：{subject.district} · {subject.policeStation}
        </div>
        {/* 图例 */}
        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur rounded-lg shadow-sm border border-slate-200 p-3 text-[11px] space-y-1.5">
          <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full border-2 border-blue-400 bg-blue-400/20" />电子围栏</div>
          <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-blue-600" />当前位置</div>
          <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />工作人员</div>
          <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />越界位置</div>
        </div>
        {/* 电子围栏 */}
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
        {/* 工作人员点 */}
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
        {/* 当前位置点 */}
        <div
          className="absolute w-8 h-8 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center"
          style={{ left: Math.max(30, Math.min(570, subjectPos.x)), top: Math.max(30, Math.min(410, subjectPos.y)) }}
        >
          <div className={`absolute w-8 h-8 rounded-full ${outside ? 'bg-red-500/30 animate-ping' : 'bg-blue-500/20'}`} />
          <div className={`w-5 h-5 rounded-full ${outside ? 'bg-red-500 animate-pulse-slow' : 'bg-blue-600'} text-white flex items-center justify-center shadow-lg ring-2 ring-white z-10`}>
            <MapPin className="w-3 h-3" />
          </div>
        </div>
        {/* 信息 */}
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

  return (
    <div className="space-y-5">
      {/* 统计 */}
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
        {/* 左侧：地图 + 模拟 */}
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
              自动分配最近社矫工作人员，并发送家属通知。
            </p>
          </div>
        </div>

        {/* 右侧：工单列表 */}
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
                <option value="pending">待处理</option>
                <option value="processing">处理中</option>
                <option value="resolved">已解决</option>
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
                      <div className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                          a.level === 'red' ? 'bg-red-500 animate-pulse-slow' : a.level === 'orange' ? 'bg-orange-500' : 'bg-yellow-500'
                        }`} />
                        <span className={`tag border ${cfg.cls}`}>{cfg.label}预警</span>
                        <span className="text-sm font-medium text-slate-800">{a.subjectName}</span>
                      </div>
                      <span className={`tag ${
                        a.status === 'pending' ? 'bg-red-100 text-red-700' : a.status === 'processing' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'
                      }`}>
                        {a.status === 'pending' ? '待处理' : a.status === 'processing' ? '处理中' : '已解决'}
                      </span>
                    </div>
                    <div className="text-xs text-slate-600 mb-1">{a.description}</div>
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

      {/* 工单详情 */}
      {selectedAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => setSelectedAlert(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl animate-fadeIn max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
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
              <button className="p-2 hover:bg-white/60 rounded-lg" onClick={() => setSelectedAlert(null)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
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
            </div>
            <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-3 bg-slate-50/60">
              {selectedAlert.status !== 'resolved' && (
                <>
                  <button
                    className="btn-secondary"
                    onClick={() => { updateAlertStatus(selectedAlert.id, 'processing'); setSelectedAlert({ ...selectedAlert, status: 'processing' }); }}
                    disabled={selectedAlert.status === 'processing'}
                  >
                    <CircleDot className="w-4 h-4 mr-1.5" />
                    标记处理中
                  </button>
                  <button
                    className="btn-success"
                    onClick={() => { updateAlertStatus(selectedAlert.id, 'resolved'); setSelectedAlert({ ...selectedAlert, status: 'resolved' }); }}
                  >
                    <CheckCircle2 className="w-4 h-4 mr-1.5" />
                    确认已处置
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LocationAlert;
