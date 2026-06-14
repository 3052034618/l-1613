import React, { useState, useMemo } from 'react';
import {
  UserPlus,
  Search,
  X,
  AlertCircle,
  CheckCircle2,
  FileText,
  User,
  MapPin,
  Filter,
  Eye,
  ArrowRightLeft,
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { Subject, ValidationError, DISTRICTS, POLICE_STATIONS, CHARGES, CORRECTION_TYPES, Gender } from '@/types';
import { formatDateTime, classNames } from '@/utils';

interface FormState {
  name: string;
  idCard: string;
  identityCaseNumber: string;
  gender: Gender;
  address: string;
  phone: string;
  familyName: string;
  familyPhone: string;
  docName: string;
  docIdCard: string;
  docCaseNumber: string;
  charge: string;
  sentenceStart: string;
  sentenceEnd: string;
  correctionType: string;
  district: string;
  policeStation: string;
}

const DEFAULT_FORM: FormState = {
  name: '',
  idCard: '',
  identityCaseNumber: '',
  gender: '男',
  address: '',
  phone: '',
  familyName: '',
  familyPhone: '',
  docName: '',
  docIdCard: '',
  docCaseNumber: '',
  charge: '',
  sentenceStart: '',
  sentenceEnd: '',
  correctionType: '缓刑',
  district: DISTRICTS[0],
  policeStation: POLICE_STATIONS[DISTRICTS[0]][0],
};

const IntakeReview: React.FC = () => {
  const subjects = useAppStore(s => s.subjects);
  const createSubject = useAppStore(s => s.createSubject);
  const validateIntake = useAppStore(s => s.validateIntake);

  const [showForm, setShowForm] = useState(false);
  const [showResult, setShowResult] = useState<null | { success: boolean; errors?: ValidationError[]; subject?: Subject }>(null);
  const [viewSubject, setViewSubject] = useState<Subject | null>(null);
  const [keyword, setKeyword] = useState('');
  const [filterDistrict, setFilterDistrict] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const [form, setForm] = useState<FormState>({ ...DEFAULT_FORM });

  const updateField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm(f => {
      const next = { ...f, [key]: value };
      if (key === 'district') {
        next.policeStation = POLICE_STATIONS[value as string]?.[0] || '';
      }
      return next;
    });
  };

  const doSubmit = () => {
    const result = createSubject(form);
    setShowResult(result);
    if (result.success) {
      setTimeout(() => {
        setShowForm(false);
        setShowResult(null);
        setForm({ ...DEFAULT_FORM });
      }, 1800);
    }
  };

  const previewValidate = () => {
    const errors = validateIntake(form);
    setShowResult({ success: errors.length === 0, errors });
  };

  const filteredSubjects = useMemo(() => {
    return subjects.filter(s => {
      if (keyword && !(`${s.name}${s.idCard}${s.caseNumber}`.includes(keyword))) return false;
      if (filterDistrict && s.district !== filterDistrict) return false;
      if (filterStatus && s.status !== filterStatus) return false;
      return true;
    });
  }, [subjects, keyword, filterDistrict, filterStatus]);

  const errorFields = useMemo(() => {
    const set = new Set<string>();
    if (!showResult?.errors) return set;
    showResult.errors.forEach(e => {
      if (e.type === 'cross_check') {
        if (e.field === 'cross_name') {
          set.add('name');
          set.add('docName');
        } else if (e.field === 'cross_idcard') {
          set.add('idCard');
          set.add('docIdCard');
        } else if (e.field === 'cross_casenumber') {
          set.add('identityCaseNumber');
          set.add('docCaseNumber');
        }
      } else {
        set.add(e.field);
      }
    });
    return set;
  }, [showResult]);

  const groupedErrors = useMemo(() => {
    if (!showResult?.errors) return { missing: [] as ValidationError[], mismatch: [] as ValidationError[], cross_check: [] as ValidationError[] };
    return {
      missing: showResult.errors.filter(e => e.type === 'missing'),
      mismatch: showResult.errors.filter(e => e.type === 'mismatch'),
      cross_check: showResult.errors.filter(e => e.type === 'cross_check'),
    };
  }, [showResult]);

  const renderStatus = (status: Subject['status']) => {
    const map = {
      pending: { label: '待审核', cls: 'bg-yellow-100 text-yellow-700' },
      active: { label: '在矫中', cls: 'bg-green-100 text-green-700' },
      released: { label: '已解矫', cls: 'bg-slate-100 text-slate-600' },
    };
    const s = map[status];
    return <span className={`tag ${s.cls}`}>{s.label}</span>;
  };

  const inputCls = (field: keyof FormState) =>
    classNames(errorFields.has(field as string) ? 'input-error' : 'input');

  return (
    <div className="space-y-5">
      <div className="card p-4 flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[260px] relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            className="input pl-9"
            placeholder="搜索姓名 / 身份证号 / 判决文号"
            value={keyword}
            onChange={e => setKeyword(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400 ml-1" />
          <select className="input w-auto" value={filterDistrict} onChange={e => setFilterDistrict(e.target.value)}>
            <option value="">全部区县</option>
            {DISTRICTS.map(d => <option key={d}>{d}</option>)}
          </select>
          <select className="input w-auto" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="">全部状态</option>
            <option value="active">在矫中</option>
            <option value="pending">待审核</option>
            <option value="released">已解矫</option>
          </select>
        </div>
        <button className="btn-primary gap-2" onClick={() => { setShowForm(true); setShowResult(null); setForm({ ...DEFAULT_FORM }); }}>
          <UserPlus className="w-4 h-4" />
          新增入矫登记
        </button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {[
          { label: '档案总数', value: subjects.length, cls: 'bg-blue-50 text-blue-700' },
          { label: '在矫中', value: subjects.filter(s => s.status === 'active').length, cls: 'bg-green-50 text-green-700' },
          { label: '待审核', value: subjects.filter(s => s.status === 'pending').length, cls: 'bg-yellow-50 text-yellow-700' },
          { label: '已解矫', value: subjects.filter(s => s.status === 'released').length, cls: 'bg-slate-50 text-slate-600' },
        ].map((x, i) => (
          <div key={i} className={`card p-4 ${x.cls} bg-opacity-50`}>
            <div className="text-xs opacity-80 mb-1">{x.label}</div>
            <div className="text-2xl font-bold tabular-nums">{x.value}</div>
          </div>
        ))}
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600 text-xs">
              <tr>
                <th className="text-left px-4 py-3 font-medium">对象信息</th>
                <th className="text-left px-4 py-3 font-medium">法律文书</th>
                <th className="text-left px-4 py-3 font-medium">矫正期限</th>
                <th className="text-left px-4 py-3 font-medium">所属</th>
                <th className="text-left px-4 py-3 font-medium">比对状态</th>
                <th className="text-left px-4 py-3 font-medium">定位权限</th>
                <th className="text-left px-4 py-3 font-medium">状态</th>
                <th className="text-left px-4 py-3 font-medium">登记时间</th>
                <th className="text-left px-4 py-3 font-medium w-20">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSubjects.length === 0 ? (
                <tr><td colSpan={9} className="text-center text-slate-400 py-12 text-sm">暂无档案数据</td></tr>
              ) : filteredSubjects.map(s => (
                <tr key={s.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 text-white flex items-center justify-center text-sm font-medium">
                        {s.name.slice(0, 1)}
                      </div>
                      <div>
                        <div className="font-medium text-slate-800">{s.name} <span className="text-xs text-slate-400 font-normal ml-1">{s.gender}</span></div>
                        <div className="text-xs text-slate-500 tabular-nums">{s.idCard}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-slate-800">{s.charge}</div>
                    <div className="text-xs text-slate-500 truncate max-w-[160px]" title={s.caseNumber}>{s.caseNumber}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-xs text-slate-500">{s.sentenceStart}</div>
                    <div className="text-slate-800">至 {s.sentenceEnd}</div>
                    <div className="text-xs text-blue-600">{s.correctionType}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-slate-800">{s.district}</div>
                    <div className="text-xs text-slate-500">{s.policeStation}</div>
                  </td>
                  <td className="px-4 py-3">
                    {s.crossCheckPassed ? (
                      <span className="tag bg-emerald-100 text-emerald-700 flex items-center gap-1 w-fit">
                        <CheckCircle2 className="w-3 h-3" />比对通过
                      </span>
                    ) : (
                      <span className="tag bg-red-100 text-red-700 flex items-center gap-1 w-fit">
                        <AlertCircle className="w-3 h-3" />比对异常
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`tag ${
                      s.locationPermission === 'expanded' ? 'bg-emerald-100 text-emerald-700'
                        : s.locationPermission === 'restricted' ? 'bg-red-100 text-red-700'
                          : 'bg-slate-100 text-slate-600'
                    }`}>
                      {s.locationPermission === 'expanded' ? '已扩展（请假）'
                        : s.locationPermission === 'restricted' ? '受限'
                          : '正常范围'}
                    </span>
                  </td>
                  <td className="px-4 py-3">{renderStatus(s.status)}</td>
                  <td className="px-4 py-3 text-xs text-slate-500 tabular-nums">{formatDateTime(s.createdAt)}</td>
                  <td className="px-4 py-3">
                    <button
                      className="text-blue-600 hover:text-blue-700 text-xs flex items-center gap-1"
                      onClick={() => setViewSubject(s)}
                    >
                      <Eye className="w-3.5 h-3.5" />详情
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col animate-fadeIn">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800">社区矫正对象入矫登记（双源录入）</h3>
                  <p className="text-xs text-slate-500">请分别录入身份信息与法律文书信息，系统将自动校验一致性</p>
                </div>
              </div>
              <button className="p-2 hover:bg-slate-100 rounded-lg" onClick={() => { setShowForm(false); setShowResult(null); }}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 身份信息 */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-blue-100">
                    <User className="w-4 h-4 text-blue-600" />
                    <h4 className="font-semibold text-blue-700">身份信息</h4>
                    <span className="ml-auto text-[10px] px-2 py-0.5 rounded bg-blue-50 text-blue-600">来源：身份证件</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="label">姓名（身份）<span className="text-red-500">*</span></label>
                      <input className={inputCls('name')} value={form.name} onChange={e => updateField('name', e.target.value)} placeholder="请输入姓名" />
                    </div>
                    <div>
                      <label className="label">性别<span className="text-red-500">*</span></label>
                      <select className={inputCls('gender')} value={form.gender} onChange={e => updateField('gender', e.target.value as Gender)}>
                        <option value="男">男</option>
                        <option value="女">女</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="label">身份证号（身份）<span className="text-red-500">*</span></label>
                    <input className={inputCls('idCard')} value={form.idCard} onChange={e => updateField('idCard', e.target.value)} placeholder="18位身份证号" maxLength={18} />
                  </div>
                  <div>
                    <label className="label">案号（身份登记）</label>
                    <input className={inputCls('identityCaseNumber')} value={form.identityCaseNumber} onChange={e => updateField('identityCaseNumber', e.target.value)} placeholder="如 (2025)京01刑初1234号" />
                  </div>
                  <div>
                    <label className="label">联系电话<span className="text-red-500">*</span></label>
                    <input className={inputCls('phone')} value={form.phone} onChange={e => updateField('phone', e.target.value)} placeholder="11位手机号" maxLength={11} />
                  </div>
                  <div>
                    <label className="label">居住地址<span className="text-red-500">*</span></label>
                    <input className={inputCls('address')} value={form.address} onChange={e => updateField('address', e.target.value)} placeholder="详细地址" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="label">家属姓名<span className="text-red-500">*</span></label>
                      <input className={inputCls('familyName')} value={form.familyName} onChange={e => updateField('familyName', e.target.value)} />
                    </div>
                    <div>
                      <label className="label">家属电话<span className="text-red-500">*</span></label>
                      <input className={inputCls('familyPhone')} value={form.familyPhone} onChange={e => updateField('familyPhone', e.target.value)} maxLength={11} />
                    </div>
                  </div>
                </div>

                {/* 法律文书 */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-red-100">
                    <FileText className="w-4 h-4 text-red-500" />
                    <h4 className="font-semibold text-red-700">法律文书信息</h4>
                    <span className="ml-auto text-[10px] px-2 py-0.5 rounded bg-red-50 text-red-600">来源：判决书/文书</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="label">姓名（文书）<span className="text-red-500">*</span></label>
                      <input className={inputCls('docName')} value={form.docName} onChange={e => updateField('docName', e.target.value)} placeholder="文书中姓名" />
                    </div>
                    <div>
                      <label className="label">身份证号（文书）<span className="text-red-500">*</span></label>
                      <input className={inputCls('docIdCard')} value={form.docIdCard} onChange={e => updateField('docIdCard', e.target.value)} placeholder="文书中身份证号" maxLength={18} />
                    </div>
                  </div>
                  <div>
                    <label className="label">判决文号（文书）<span className="text-red-500">*</span></label>
                    <input className={inputCls('docCaseNumber')} value={form.docCaseNumber} onChange={e => updateField('docCaseNumber', e.target.value)} placeholder="如 (2025)京01刑初1234号" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="label">罪名<span className="text-red-500">*</span></label>
                      <select className={inputCls('charge')} value={form.charge} onChange={e => updateField('charge', e.target.value)}>
                        <option value="">请选择罪名</option>
                        {CHARGES.map(c => <option key={c}>{c}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="label">矫正类型<span className="text-red-500">*</span></label>
                      <select className={inputCls('correctionType')} value={form.correctionType} onChange={e => updateField('correctionType', e.target.value)}>
                        {CORRECTION_TYPES.map(c => <option key={c}>{c}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="label">矫正开始日期<span className="text-red-500">*</span></label>
                      <input type="date" className={inputCls('sentenceStart')} value={form.sentenceStart} onChange={e => updateField('sentenceStart', e.target.value)} />
                    </div>
                    <div>
                      <label className="label">矫正结束日期<span className="text-red-500">*</span></label>
                      <input type="date" className={inputCls('sentenceEnd')} value={form.sentenceEnd} onChange={e => updateField('sentenceEnd', e.target.value)} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="label">所属区县<span className="text-red-500">*</span></label>
                      <select className={inputCls('district')} value={form.district} onChange={e => updateField('district', e.target.value)}>
                        {DISTRICTS.map(d => <option key={d}>{d}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="label">所属司法所<span className="text-red-500">*</span></label>
                      <select className={inputCls('policeStation')} value={form.policeStation} onChange={e => updateField('policeStation', e.target.value)} disabled={!form.district}>
                        {form.district && POLICE_STATIONS[form.district]?.map(p => <option key={p}>{p}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 校验结果面板 */}
            {showResult && (
              <div className={`mx-6 mb-4 p-4 rounded-xl border animate-fadeIn ${
                showResult.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
              }`}>
                {showResult.success ? (
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-6 h-6 text-green-600 shrink-0" />
                    <div>
                      <div className="font-semibold text-green-800">校验通过，档案已创建成功！</div>
                      <div className="text-xs text-green-700 mt-0.5">矫正对象：{showResult.subject?.name}（{showResult.subject?.id}），已自动进入在矫档案列表，电子围栏已初始化。</div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <AlertCircle className="w-6 h-6 text-red-600 shrink-0" />
                      <div>
                        <div className="font-semibold text-red-800">校验未通过，请修正后重新提交</div>
                        <div className="text-xs text-red-700 mt-0.5">共发现 {showResult.errors!.length} 项问题，系统已自动退回</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {groupedErrors.missing.length > 0 && (
                        <div className="bg-white rounded-lg border border-red-100 p-3">
                          <div className="text-xs font-medium text-red-600 mb-2 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                            缺失项 ({groupedErrors.missing.length})
                          </div>
                          <ul className="space-y-1.5">
                            {groupedErrors.missing.map((e, i) => (
                              <li key={i} className="text-xs text-slate-700 pl-3 border-l-2 border-red-200">{e.message}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {groupedErrors.mismatch.length > 0 && (
                        <div className="bg-white rounded-lg border border-amber-100 p-3">
                          <div className="text-xs font-medium text-amber-600 mb-2 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                            格式/合法性校验 ({groupedErrors.mismatch.length})
                          </div>
                          <ul className="space-y-1.5">
                            {groupedErrors.mismatch.map((e, i) => (
                              <li key={i} className="text-xs text-slate-700 pl-3 border-l-2 border-amber-200">{e.message}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {groupedErrors.cross_check.length > 0 && (
                        <div className="bg-white rounded-lg border border-violet-100 p-3">
                          <div className="text-xs font-medium text-violet-600 mb-2 flex items-center gap-1">
                            <ArrowRightLeft className="w-3 h-3" />
                            跨源比对不一致 ({groupedErrors.cross_check.length})
                          </div>
                          <div className="space-y-2">
                            {groupedErrors.cross_check.map((e, i) => (
                              <div key={i} className="border border-violet-100 rounded-lg overflow-hidden">
                                <div className="bg-violet-50 px-2 py-1 text-[11px] font-medium text-violet-700 border-b border-violet-100">
                                  {e.label}
                                </div>
                                <div className="grid grid-cols-2 divide-x divide-violet-100">
                                  <div className="p-2">
                                    <div className="text-[10px] text-blue-600 mb-0.5 font-medium">身份区值</div>
                                    <div className="text-xs font-semibold text-slate-800 bg-blue-50 rounded px-1.5 py-0.5 break-all">
                                      {e.identityValue || '—'}
                                    </div>
                                  </div>
                                  <div className="p-2">
                                    <div className="text-[10px] text-red-600 mb-0.5 font-medium">文书区值</div>
                                    <div className="text-xs font-semibold text-slate-800 bg-red-50 rounded px-1.5 py-0.5 break-all">
                                      {e.legalValue || '—'}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-3">
              <button className="btn-secondary" onClick={() => { setShowForm(false); setShowResult(null); }}>取消</button>
              <button className="btn-secondary" onClick={previewValidate}>
                <AlertCircle className="w-4 h-4 mr-1.5" />
                预校验
              </button>
              <button className="btn-primary" onClick={doSubmit}>
                <CheckCircle2 className="w-4 h-4 mr-1.5" />
                提交审核
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 档案详情 */}
      {viewSubject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => setViewSubject(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col animate-fadeIn" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="font-semibold text-slate-800">矫正对象档案详情</h3>
              <button className="p-2 hover:bg-slate-100 rounded-lg" onClick={() => setViewSubject(null)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* 头部 */}
              <div className="flex items-center gap-4 pb-4 border-b border-slate-100">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-400 to-indigo-600 text-white flex items-center justify-center text-2xl font-bold">
                  {viewSubject.name.slice(0, 1)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-xl font-bold text-slate-800">{viewSubject.name}</h4>
                    {renderStatus(viewSubject.status)}
                    {viewSubject.crossCheckPassed ? (
                      <span className="tag bg-emerald-100 text-emerald-700 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />双源比对通过
                      </span>
                    ) : (
                      <span className="tag bg-red-100 text-red-700 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />双源比对异常
                      </span>
                    )}
                    <span className={`tag ${
                      viewSubject.locationPermission === 'expanded' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
                    }`}>
                      定位权限：{viewSubject.locationPermission === 'expanded' ? '已扩展' : viewSubject.locationPermission === 'restricted' ? '受限' : '正常'}
                    </span>
                  </div>
                  <div className="text-sm text-slate-500 mt-1 tabular-nums">{viewSubject.idCard} · {viewSubject.phone}</div>
                </div>
              </div>

              {/* 身份信息 Section */}
              <div className="rounded-xl border border-blue-100 overflow-hidden">
                <div className="bg-gradient-to-r from-blue-50 to-blue-50/50 px-4 py-2.5 border-b border-blue-100 flex items-center gap-2">
                  <User className="w-4 h-4 text-blue-600" />
                  <h4 className="font-semibold text-blue-700 text-sm">身份信息</h4>
                  <span className="ml-auto text-[10px] px-2 py-0.5 rounded bg-blue-100 text-blue-600">来源：身份证件</span>
                </div>
                <div className="p-4 grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                  <div><span className="text-xs text-slate-500">姓名：</span><b className="text-slate-800">{viewSubject.name}</b></div>
                  <div><span className="text-xs text-slate-500">性别：</span><b className="text-slate-800">{viewSubject.gender}</b></div>
                  <div className="col-span-2"><span className="text-xs text-slate-500">身份证号：</span><b className="text-slate-800 tabular-nums">{viewSubject.idCard}</b></div>
                  <div className="col-span-2"><span className="text-xs text-slate-500">案号（身份登记）：</span><b className="text-slate-800">{viewSubject.identityCaseNumber || '—'}</b></div>
                  <div><span className="text-xs text-slate-500">联系电话：</span><b className="text-slate-800 tabular-nums">{viewSubject.phone}</b></div>
                  <div><span className="text-xs text-slate-500">家属：</span><b className="text-slate-800">{viewSubject.familyName} / {viewSubject.familyPhone}</b></div>
                  <div className="col-span-2"><span className="text-xs text-slate-500">居住地址：</span><b className="text-slate-800">{viewSubject.address}</b></div>
                </div>
              </div>

              {/* 法律文书信息 Section */}
              <div className="rounded-xl border border-red-100 overflow-hidden">
                <div className="bg-gradient-to-r from-red-50 to-red-50/50 px-4 py-2.5 border-b border-red-100 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-red-600" />
                  <h4 className="font-semibold text-red-700 text-sm">法律文书信息</h4>
                  <span className="ml-auto text-[10px] px-2 py-0.5 rounded bg-red-100 text-red-600">来源：判决书/文书</span>
                </div>
                <div className="p-4 grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                  <div><span className="text-xs text-slate-500">姓名（文书）：</span><b className="text-slate-800">{viewSubject.docName}</b></div>
                  <div><span className="text-xs text-slate-500">身份证号（文书）：</span><b className="text-slate-800 tabular-nums">{viewSubject.docIdCard}</b></div>
                  <div className="col-span-2"><span className="text-xs text-slate-500">判决文号：</span><b className="text-slate-800">{viewSubject.docCaseNumber}</b></div>
                  <div><span className="text-xs text-slate-500">罪名：</span><b className="text-slate-800">{viewSubject.charge}</b></div>
                  <div><span className="text-xs text-slate-500">矫正类型：</span><b className="text-slate-800">{viewSubject.correctionType}</b></div>
                  <div className="col-span-2"><span className="text-xs text-slate-500">矫正期限：</span><b className="text-slate-800 tabular-nums">{viewSubject.sentenceStart} 至 {viewSubject.sentenceEnd}</b></div>
                  <div><span className="text-xs text-slate-500">所属区县：</span><b className="text-slate-800">{viewSubject.district}</b></div>
                  <div><span className="text-xs text-slate-500">所属司法所：</span><b className="text-slate-800">{viewSubject.policeStation}</b></div>
                </div>
              </div>

              {/* 双源比对结果 Section */}
              <div className={`rounded-xl border overflow-hidden ${
                viewSubject.crossCheckPassed ? 'border-emerald-100' : 'border-violet-100'
              }`}>
                <div className={`px-4 py-2.5 border-b flex items-center gap-2 ${
                  viewSubject.crossCheckPassed
                    ? 'bg-gradient-to-r from-emerald-50 to-emerald-50/50 border-emerald-100'
                    : 'bg-gradient-to-r from-violet-50 to-violet-50/50 border-violet-100'
                }`}>
                  <ArrowRightLeft className={`w-4 h-4 ${viewSubject.crossCheckPassed ? 'text-emerald-600' : 'text-violet-600'}`} />
                  <h4 className={`font-semibold text-sm ${viewSubject.crossCheckPassed ? 'text-emerald-700' : 'text-violet-700'}`}>
                    双源比对结果
                  </h4>
                  <span className={`ml-auto text-[10px] px-2 py-0.5 rounded ${
                    viewSubject.crossCheckPassed ? 'bg-emerald-100 text-emerald-700' : 'bg-violet-100 text-violet-700'
                  }`}>
                    {viewSubject.crossCheckPassed ? '✅ 全部比对通过' : '⚠ 存在比对不一致'}
                  </span>
                </div>
                <div className="p-4 space-y-3">
                  {viewSubject.crossCheckPassed ? (
                    <div className="space-y-2">
                      <div className="grid grid-cols-3 gap-3">
                        {[
                          { label: '姓名比对', identity: viewSubject.name, legal: viewSubject.docName },
                          { label: '身份证号比对', identity: viewSubject.idCard, legal: viewSubject.docIdCard },
                          { label: '案号比对', identity: viewSubject.identityCaseNumber || '—', legal: viewSubject.docCaseNumber || '—' },
                        ].map((item, i) => (
                          <div key={i} className="rounded-lg border border-emerald-100 overflow-hidden">
                            <div className="bg-emerald-50 px-2 py-1 text-[11px] font-medium text-emerald-700 flex items-center gap-1 border-b border-emerald-100">
                              <CheckCircle2 className="w-3 h-3" />{item.label}：通过
                            </div>
                            <div className="grid grid-cols-2 divide-x divide-emerald-100">
                              <div className="p-2">
                                <div className="text-[10px] text-blue-600 mb-0.5">身份值</div>
                                <div className="text-xs text-slate-700 break-all">{item.identity}</div>
                              </div>
                              <div className="p-2">
                                <div className="text-[10px] text-red-600 mb-0.5">文书值</div>
                                <div className="text-xs text-slate-700 break-all">{item.legal}</div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="text-xs text-emerald-600 flex items-center gap-1 pt-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        身份信息与法律文书信息全部比对一致，数据可信。
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {viewSubject.crossCheckErrors.length > 0 ? (
                        viewSubject.crossCheckErrors.map((errMsg, i) => {
                          const isName = errMsg.includes('姓名');
                          const isIdCard = errMsg.includes('身份证');
                          const isCaseNumber = errMsg.includes('案号');
                          const identityVal = isName ? viewSubject.name : isIdCard ? viewSubject.idCard : isCaseNumber ? viewSubject.identityCaseNumber || '—' : '';
                          const legalVal = isName ? viewSubject.docName : isIdCard ? viewSubject.docIdCard : isCaseNumber ? viewSubject.docCaseNumber || '—' : '';
                          return (
                            <div key={i} className="rounded-lg border border-violet-100 overflow-hidden">
                              <div className="bg-violet-50 px-2 py-1 text-[11px] font-medium text-violet-700 flex items-center gap-1 border-b border-violet-100">
                                <AlertCircle className="w-3 h-3" />{errMsg}
                              </div>
                              <div className="grid grid-cols-2 divide-x divide-violet-100">
                                <div className="p-2">
                                  <div className="text-[10px] text-blue-600 mb-0.5 font-medium">身份区值</div>
                                  <div className="text-xs font-semibold text-slate-800 bg-blue-50 rounded px-1.5 py-0.5 break-all">
                                    {identityVal || '—'}
                                  </div>
                                </div>
                                <div className="p-2">
                                  <div className="text-[10px] text-red-600 mb-0.5 font-medium">文书区值</div>
                                  <div className="text-xs font-semibold text-slate-800 bg-red-50 rounded px-1.5 py-0.5 break-all">
                                    {legalVal || '—'}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="text-xs text-slate-500">无详细比对错误信息</div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* 其他信息 */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="p-3 rounded-xl bg-slate-50"><span className="text-xs text-slate-500">档案编号：</span><b className="text-slate-800 tabular-nums">{viewSubject.id}</b></div>
                <div className="p-3 rounded-xl bg-slate-50"><span className="text-xs text-slate-500">登记时间：</span><b className="text-slate-800 tabular-nums">{formatDateTime(viewSubject.createdAt)}</b></div>
              </div>

              <div className="p-4 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100">
                <div className="text-xs text-blue-600 mb-2 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />电子围栏信息
                </div>
                <div className="grid grid-cols-3 gap-3 text-sm">
                  <div><span className="text-xs text-slate-500">中心纬度：</span><b className="tabular-nums">{viewSubject.fenceCenter.lat.toFixed(4)}</b></div>
                  <div><span className="text-xs text-slate-500">中心经度：</span><b className="tabular-nums">{viewSubject.fenceCenter.lng.toFixed(4)}</b></div>
                  <div><span className="text-xs text-slate-500">围栏半径：</span><b className="tabular-nums">{Math.round(viewSubject.fenceRadius)}米</b></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IntakeReview;
