import React, { useState, useMemo } from 'react';
import {
  FileCheck2,
  Search,
  Download,
  Filter,
  Calendar,
  Eye,
  X,
  FileText,
  Award,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  User,
  MapPin,
  ClipboardList,
  Inbox,
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { Subject, DISTRICTS } from '@/types';
import { formatDateTime, downloadCSV, todayStr, daysBetween, classNames } from '@/utils';

type ReleaseTab = 'list' | 'export';

const ReleaseAssessment: React.FC = () => {
  const subjects = useAppStore(s => s.subjects);
  const alerts = useAppStore(s => s.alerts);
  const studyPlans = useAppStore(s => s.studyPlans);
  const checkins = useAppStore(s => s.checkins);
  const leaves = useAppStore(s => s.leaves);
  const exportReleaseToCSV = useAppStore(s => s.exportReleaseToCSV);
  const exportReleaseListCSV = useAppStore(s => s.exportReleaseListCSV);
  const exportRecords = useAppStore(s => s.exportRecords);

  const [activeTab, setActiveTab] = useState<ReleaseTab>('list');
  const [startDate, setStartDate] = useState(() => todayStr());
  const [endDate, setEndDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 3);
    return d.toISOString().slice(0, 10);
  });
  const [filterDistrict, setFilterDistrict] = useState('');
  const [keyword, setKeyword] = useState('');
  const [viewSubject, setViewSubject] = useState<Subject | null>(null);

  const [exportTypeFilter, setExportTypeFilter] = useState<string>('');
  const [exportSearchKeyword, setExportSearchKeyword] = useState('');

  const releaseList = useMemo(() => {
    return subjects.filter(s => {
      const end = new Date(s.sentenceEnd);
      const start = new Date(startDate);
      const endD = new Date(endDate);
      if (end < start || end > endD) return false;
      if (filterDistrict && s.district !== filterDistrict) return false;
      if (keyword && !(`${s.name}${s.idCard}`.includes(keyword))) return false;
      return true;
    }).sort((a, b) => a.sentenceEnd.localeCompare(b.sentenceEnd));
  }, [subjects, startDate, endDate, filterDistrict, keyword]);

  const generateReport = (s: Subject) => {
    const subjectAlerts = alerts.filter(a => a.subjectId === s.id);
    const redCount = subjectAlerts.filter(a => a.level === 'red').length;
    const orangeCount = subjectAlerts.filter(a => a.level === 'orange').length;
    const subjectStudies = studyPlans.filter(p => p.subjectId === s.id);
    const studyPassed = subjectStudies.filter(p => p.status === 'completed').length;
    const studyTotal = subjectStudies.filter(p => p.status === 'completed' || p.status === 'failed').length;
    const studyRate = studyTotal > 0 ? Math.round((studyPassed / studyTotal) * 100) : 0;
    const subjectCheckins = checkins.filter(c => c.subjectId === s.id);
    const checkinOverdue = subjectCheckins.filter(c => c.status === 'overdue').length;
    const subjectLeaves = leaves.filter(l => l.subjectId === s.id);
    const leaveApproved = subjectLeaves.filter(l => l.firstReview.status === 'approved' && l.secondReview.status === 'approved').length;

    const violationScore = Math.min(100, redCount * 15 + orangeCount * 8 + checkinOverdue * 5);
    const studyScore = studyRate;
    const attendanceScore = subjectCheckins.length > 0
      ? Math.round(((subjectCheckins.length - checkinOverdue) / subjectCheckins.length) * 100)
      : 100;
    const totalScore = Math.round(studyScore * 0.35 + attendanceScore * 0.35 + (100 - violationScore) * 0.3);
    const level = totalScore >= 90 ? '优秀' : totalScore >= 75 ? '良好' : totalScore >= 60 ? '合格' : '待观察';
    const conclusion = totalScore >= 60
      ? `该对象在矫正期间表现${totalScore >= 90 ? '优秀' : totalScore >= 75 ? '良好' : '基本合格'}，能够遵守监管规定，${studyRate >= 80 ? '积极参加教育学习并通过考核' : '完成基本学习任务'}，按期报到。建议按期解除社区矫正。`
      : `该对象在矫正期间存在${redCount > 0 ? `${redCount}次严重越界、` : ''}${checkinOverdue > 0 ? `${checkinOverdue}次逾期报到、` : ''}等违规行为，建议加强后续帮教措施。`;

    return {
      subjectAlerts, redCount, orangeCount,
      subjectStudies, studyPassed, studyTotal, studyRate,
      subjectCheckins, checkinOverdue,
      subjectLeaves, leaveApproved,
      violationScore, studyScore, attendanceScore, totalScore, level, conclusion,
    };
  };

  const doExport = () => {
    const f: Record<string, string> = { '开始日期': startDate, '结束日期': endDate };
    if (filterDistrict) f['区县'] = filterDistrict;
    if (keyword) f['关键词'] = keyword;
    const filterDisplay = Object.entries(f).map(([k, v]) => `${k}=${v}`).join('，');
    exportReleaseListCSV(releaseList, f, filterDisplay);
  };

  const filteredExportRecords = useMemo(() => {
    return exportRecords.filter(r => {
      if (exportTypeFilter && r.type !== exportTypeFilter) return false;
      if (exportSearchKeyword && !r.fileName.toLowerCase().includes(exportSearchKeyword.toLowerCase())) return false;
      return true;
    });
  }, [exportRecords, exportTypeFilter, exportSearchKeyword]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <FileCheck2 className="w-6 h-6 text-teal-600" />
          解矫评估
        </h2>
        <div className="inline-flex bg-slate-100 rounded-lg p-1">
          <button
            className={`px-4 py-1.5 text-sm rounded-md transition-all ${
              activeTab === 'list'
                ? 'bg-white text-teal-600 font-medium shadow-sm'
                : 'text-slate-600 hover:text-slate-800'
            }`}
            onClick={() => setActiveTab('list')}
          >
            解矫名单
          </button>
          <button
            className={`px-4 py-1.5 text-sm rounded-md transition-all flex items-center gap-1.5 ${
              activeTab === 'export'
                ? 'bg-white text-teal-600 font-medium shadow-sm'
                : 'text-slate-600 hover:text-slate-800'
            }`}
            onClick={() => setActiveTab('export')}
          >
            <FileText className="w-4 h-4" />
            导出记录
          </button>
        </div>
      </div>

      {activeTab === 'list' && (
        <>
          <div className="card p-4 flex flex-wrap items-center gap-3">
            <h3 className="font-semibold text-slate-800 flex items-center gap-2 mr-auto">
              <FileCheck2 className="w-5 h-5 text-teal-500" />
              解矫名单筛选
            </h3>
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Calendar className="w-4 h-4" />
              <span>解矫日期：</span>
            </div>
            <input type="date" className="input w-auto" value={startDate} onChange={e => setStartDate(e.target.value)} />
            <span className="text-slate-400">至</span>
            <input type="date" className="input w-auto" value={endDate} onChange={e => setEndDate(e.target.value)} />
            <Filter className="w-4 h-4 text-slate-400 ml-1" />
            <select className="input w-auto" value={filterDistrict} onChange={e => setFilterDistrict(e.target.value)}>
              <option value="">全部区县</option>
              {DISTRICTS.map(d => <option key={d}>{d}</option>)}
            </select>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input className="input pl-9 w-52" placeholder="搜索姓名/身份证" value={keyword} onChange={e => setKeyword(e.target.value)} />
            </div>
            <button className="btn-primary gap-2" onClick={doExport}>
              <Download className="w-4 h-4" />
              导出 CSV（{releaseList.length}条）
            </button>
          </div>

          <div className="grid grid-cols-4 gap-4">
            {[
              { label: '时段内解矫人数', value: releaseList.length, cls: 'bg-teal-50 text-teal-700', icon: FileCheck2 },
              { label: '本月待解矫', value: releaseList.filter(r => {
                const d = new Date(r.sentenceEnd); const t = new Date();
                return d.getMonth() === t.getMonth() && d.getFullYear() === t.getFullYear();
              }).length, cls: 'bg-blue-50 text-blue-700', icon: Calendar },
              { label: '30天内即将解矫', value: releaseList.filter(r => daysBetween(todayStr(), r.sentenceEnd) <= 30 && daysBetween(todayStr(), r.sentenceEnd) >= 0).length, cls: 'bg-amber-50 text-amber-700', icon: TrendingUp },
              { label: '已超期未解矫', value: releaseList.filter(r => daysBetween(todayStr(), r.sentenceEnd) < 0 && r.status !== 'released').length, cls: 'bg-red-50 text-red-700', icon: AlertTriangle },
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

          <div className="card overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-semibold text-slate-800">解矫名单列表</h3>
              <span className="text-xs text-slate-500">共 {releaseList.length} 条记录，筛选条件：{startDate} 至 {endDate}{filterDistrict ? ` · ${filterDistrict}` : ''}{keyword ? ` · 关键词=${keyword}` : ''}</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-slate-600 text-xs">
                  <tr>
                    <th className="text-left px-5 py-3 font-medium">对象信息</th>
                    <th className="text-left px-5 py-3 font-medium">法律文书</th>
                    <th className="text-left px-5 py-3 font-medium">所属</th>
                    <th className="text-left px-5 py-3 font-medium">矫正期限</th>
                    <th className="text-left px-5 py-3 font-medium">剩余天数</th>
                    <th className="text-left px-5 py-3 font-medium">状态</th>
                    <th className="text-left px-5 py-3 font-medium w-28">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {releaseList.length === 0 ? (
                    <tr><td colSpan={7} className="text-center text-slate-400 py-16 text-sm">当前筛选条件下无解矫对象</td></tr>
                  ) : releaseList.map(s => {
                    const daysLeft = daysBetween(todayStr(), s.sentenceEnd);
                    const isExpired = daysLeft < 0;
                    return (
                      <tr key={s.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-teal-400 to-emerald-600 text-white flex items-center justify-center text-sm font-medium">
                              {s.name.slice(0, 1)}
                            </div>
                            <div>
                              <div className="font-medium text-slate-800">{s.name} <span className="text-xs text-slate-400 font-normal ml-1">{s.gender}</span></div>
                              <div className="text-xs text-slate-500 tabular-nums">{s.idCard}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="text-slate-800">{s.charge}</div>
                          <div className="text-xs text-slate-500">{s.caseNumber}</div>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="text-slate-800">{s.district}</div>
                          <div className="text-xs text-slate-500">{s.policeStation}</div>
                        </td>
                        <td className="px-5 py-3.5 text-xs tabular-nums">
                          <div className="text-slate-600">{s.sentenceStart}</div>
                          <div className="text-slate-800 font-medium">至 {s.sentenceEnd}</div>
                          <div className="text-teal-600">{s.correctionType}</div>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className={classNames(
                            'text-lg font-bold tabular-nums',
                            isExpired ? 'text-red-600' : daysLeft <= 7 ? 'text-orange-600' : daysLeft <= 30 ? 'text-amber-600' : 'text-slate-700'
                          )}>
                            {isExpired ? '已超期' : `${daysLeft}天`}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          {s.status === 'released'
                            ? <span className="tag bg-slate-100 text-slate-600">已解矫</span>
                            : isExpired
                              ? <span className="tag bg-red-100 text-red-700">超期待办</span>
                              : daysLeft <= 7
                                ? <span className="tag bg-orange-100 text-orange-700">即将解矫</span>
                                : <span className="tag bg-green-100 text-green-700">在矫中</span>}
                        </td>
                        <td className="px-5 py-3.5">
                          <button className="text-blue-600 hover:text-blue-700 text-xs flex items-center gap-1" onClick={() => setViewSubject(s)}>
                            <ClipboardList className="w-3.5 h-3.5" />评估报告
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {viewSubject && (() => {
            const rpt = generateReport(viewSubject);
            return (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => setViewSubject(null)}>
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col animate-fadeIn" onClick={e => e.stopPropagation()}>
                  <div className="flex items-center justify-between px-6 py-4 border-b bg-gradient-to-r from-teal-50 to-emerald-50">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 text-white flex items-center justify-center">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-800">社区矫正对象综合评估报告</h3>
                        <p className="text-xs text-slate-500 mt-0.5">报告自动生成时间：{formatDateTime(new Date().toISOString())}</p>
                      </div>
                    </div>
                    <button className="p-2 hover:bg-white/60 rounded-lg" onClick={() => setViewSubject(null)}><X className="w-5 h-5 text-slate-400" /></button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-6 space-y-5">
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                      <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-1.5">
                        <User className="w-4 h-4" />基本信息
                      </h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        {[
                          ['姓名', viewSubject.name],
                          ['性别', viewSubject.gender],
                          ['身份证号', viewSubject.idCard],
                          ['联系电话', viewSubject.phone],
                          ['罪名', viewSubject.charge],
                          ['矫正类型', viewSubject.correctionType],
                          ['判决文号', viewSubject.caseNumber],
                          ['所属司法所', viewSubject.policeStation],
                        ].map(([k, v], i) => (
                          <div key={i}>
                            <div className="text-xs text-slate-500 mb-1">{k}</div>
                            <div className="font-medium text-slate-800 truncate tabular-nums" title={String(v)}>{v}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-4">
                      {[
                        { label: '教育学习评分', value: rpt.studyScore, total: 100, color: 'text-blue-600', bg: 'from-blue-500 to-blue-600', icon: Award },
                        { label: '报到出勤评分', value: rpt.attendanceScore, total: 100, color: 'text-emerald-600', bg: 'from-emerald-500 to-emerald-600', icon: CheckCircle2 },
                        { label: '违规扣分', value: rpt.violationScore, total: 100, color: 'text-red-600', bg: 'from-red-500 to-red-600', icon: AlertTriangle },
                        { label: '综合评定等级', value: rpt.totalScore, total: 100, color: 'text-indigo-600', bg: 'from-indigo-500 to-purple-600', icon: TrendingUp },
                      ].map((m, i) => (
                        <div key={i} className="card p-4 relative overflow-hidden">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs text-slate-500">{m.label}</span>
                            <m.icon className={`w-4 h-4 ${m.color}`} />
                          </div>
                          <div className={`text-3xl font-bold tabular-nums ${m.color}`}>
                            {i === 2 ? '-' : ''}{m.value}<span className="text-sm text-slate-400 font-normal">/{m.total}</span>
                          </div>
                          <div className="mt-2 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div className={`h-full bg-gradient-to-r ${m.bg}`} style={{ width: `${(m.value / m.total) * 100}%` }} />
                          </div>
                          {i === 3 && (
                            <div className={`mt-2 inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                              rpt.level === '优秀' ? 'bg-indigo-100 text-indigo-700' :
                                rpt.level === '良好' ? 'bg-blue-100 text-blue-700' :
                                  rpt.level === '合格' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                            }`}>
                              {rpt.level}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 rounded-xl border border-slate-200">
                        <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-1.5">
                          <MapPin className="w-4 h-4 text-red-500" />
                          定位与违规记录
                        </h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between"><span className="text-slate-600">预警工单总数</span><b className="tabular-nums">{rpt.subjectAlerts.length} 次</b></div>
                          <div className="flex justify-between"><span className="text-red-600">🔴 红色预警（严重越界）</span><b className="tabular-nums">{rpt.redCount} 次</b></div>
                          <div className="flex justify-between"><span className="text-orange-600">🟠 橙色预警（中度越界）</span><b className="tabular-nums">{rpt.orangeCount} 次</b></div>
                          <div className="flex justify-between"><span className="text-yellow-600">🟡 黄色预警（轻微越界）</span><b className="tabular-nums">{rpt.subjectAlerts.length - rpt.redCount - rpt.orangeCount} 次</b></div>
                          <div className="flex justify-between pt-2 border-t border-slate-100"><span className="text-slate-600">请假申请</span><b className="tabular-nums">{rpt.subjectLeaves.length} 次 / 批准 {rpt.leaveApproved} 次</b></div>
                        </div>
                      </div>
                      <div className="p-4 rounded-xl border border-slate-200">
                        <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-1.5">
                          <Award className="w-4 h-4 text-indigo-500" />
                          教育学习与报到
                        </h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between"><span className="text-slate-600">学习计划总数</span><b className="tabular-nums">{rpt.subjectStudies.length} 项</b></div>
                          <div className="flex justify-between"><span className="text-green-600">✅ 考核通过</span><b className="tabular-nums">{rpt.studyPassed} 项</b></div>
                          <div className="flex justify-between"><span className="text-red-600">❌ 考核未通过（需补充）</span><b className="tabular-nums">{rpt.studyTotal - rpt.studyPassed} 项</b></div>
                          <div className="flex justify-between"><span className="text-slate-600">学习完成率</span><b className={`tabular-nums ${rpt.studyRate >= 80 ? 'text-green-600' : 'text-amber-600'}`}>{rpt.studyRate}%</b></div>
                          <div className="flex justify-between pt-2 border-t border-slate-100">
                            <span className="text-slate-600">报到情况</span>
                            <b className="tabular-nums text-slate-800">{rpt.subjectCheckins.length} 次 / 逾期 {rpt.checkinOverdue} 次</b>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className={`p-5 rounded-xl border-2 ${rpt.totalScore >= 60 ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200' : 'bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200'}`}>
                      <h4 className={`text-sm font-bold mb-2 flex items-center gap-2 ${rpt.totalScore >= 60 ? 'text-green-800' : 'text-amber-800'}`}>
                        <ClipboardList className="w-4 h-4" />
                        综合评估结论
                      </h4>
                      <p className={`text-sm leading-relaxed ${rpt.totalScore >= 60 ? 'text-green-900' : 'text-amber-900'}`}>{rpt.conclusion}</p>
                      <div className="mt-3 pt-3 border-t border-current/20 flex items-center justify-between text-xs opacity-80">
                        <span>评估总分：<b>{rpt.totalScore} 分</b>（权重：学习35% + 出勤35% + 合规30%）</span>
                        <span>评定等级：<b className="text-base">{rpt.level}</b></span>
                      </div>
                    </div>
                  </div>
                  <div className="px-6 py-4 border-t bg-slate-50/60 flex items-center justify-between">
                    <p className="text-xs text-slate-500">本报告由系统根据监管记录、考核结果自动生成，仅供参考</p>
                    <div className="flex gap-3">
                      <button className="btn-secondary" onClick={() => setViewSubject(null)}>关闭</button>
                      <button className="btn-primary gap-2" onClick={() => {
                        const csv = `姓名,${viewSubject.name}\n身份证号,${viewSubject.idCard}\n罪名,${viewSubject.charge}\n综合得分,${rpt.totalScore}\n评定等级,${rpt.level}\n评估结论,${rpt.conclusion.replace(/\n/g, ' ')}\n生成时间,${formatDateTime(new Date().toISOString())}`;
                        downloadCSV(csv, `评估报告_${viewSubject.name}`);
                      }}>
                        <Download className="w-4 h-4" />
                        导出报告
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
        </>
      )}

      {activeTab === 'export' && (
        <div className="card p-5">
          <div className="flex flex-wrap items-center gap-3 mb-5 pb-4 border-b border-slate-100">
            <h3 className="font-semibold text-slate-800 flex items-center gap-2 mr-auto">
              <FileText className="w-5 h-5 text-teal-500" />
              导出记录中心
            </h3>
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              className="input w-auto"
              value={exportTypeFilter}
              onChange={e => setExportTypeFilter(e.target.value)}
            >
              <option value="">全部类型</option>
              <option value="daily_report">监管日报</option>
              <option value="release_list">解矫名单</option>
              <option value="subject_list">在矫档案</option>
            </select>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                className="input pl-9 w-64"
                placeholder="搜索文件名"
                value={exportSearchKeyword}
                onChange={e => setExportSearchKeyword(e.target.value)}
              />
            </div>
          </div>

          {filteredExportRecords.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <Inbox className="w-16 h-16 mb-4 opacity-40" />
              <p className="text-sm">暂无导出记录</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-slate-600 text-xs">
                  <tr>
                    <th className="text-left px-5 py-3 font-medium">类型名称</th>
                    <th className="text-left px-5 py-3 font-medium">筛选条件</th>
                    <th className="text-left px-5 py-3 font-medium">生成时间</th>
                    <th className="text-left px-5 py-3 font-medium">文件名</th>
                    <th className="text-right px-5 py-3 font-medium">条数</th>
                    <th className="text-left px-5 py-3 font-medium">操作人</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredExportRecords.map(r => (
                    <tr key={r.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium ${
                          r.type === 'daily_report'
                            ? 'bg-blue-100 text-blue-700'
                            : r.type === 'release_list'
                              ? 'bg-teal-100 text-teal-700'
                              : 'bg-violet-100 text-violet-700'
                        }`}>
                          {r.typeName}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-slate-600 text-xs max-w-xs truncate" title={r.filterDisplay}>
                        {r.filterDisplay}
                      </td>
                      <td className="px-5 py-3.5 text-slate-700 tabular-nums text-xs">
                        {formatDateTime(r.exportedAt)}
                      </td>
                      <td className="px-5 py-3.5 text-slate-800 font-medium text-xs">
                        {r.fileName}
                      </td>
                      <td className="px-5 py-3.5 text-right tabular-nums text-slate-700">
                        <span className="font-medium text-teal-600">{r.recordCount}</span>
                        <span className="text-xs text-slate-400 ml-1">条</span>
                      </td>
                      <td className="px-5 py-3.5 text-slate-600 text-xs">
                        {r.operator}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ReleaseAssessment;
