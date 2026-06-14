import React, { useState, useMemo } from 'react';
import {
  GraduationCap,
  BookOpen,
  PlayCircle,
  FileQuestion,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  User,
  Search,
  Filter,
  X,
  ChevronRight,
  RefreshCw,
  Award,
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { StudyPlan, QuizQuestion, DISTRICTS } from '@/types';
import { QUIZ_QUESTIONS } from '@/utils/mockData';
import { classNames } from '@/utils';

const StudyExam: React.FC = () => {
  const studyPlans = useAppStore(s => s.studyPlans);
  const completeStudy = useAppStore(s => s.completeStudy);

  const [keyword, setKeyword] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [activePlan, setActivePlan] = useState<StudyPlan | null>(null);
  const [showExam, setShowExam] = useState(false);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [examSubmitted, setExamSubmitted] = useState(false);

  const filteredPlans = useMemo(() => {
    return studyPlans.filter(p => {
      if (keyword && !(`${p.subjectName}${p.title}`.includes(keyword))) return false;
      if (filterStatus && p.status !== filterStatus) return false;
      return true;
    }).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }, [studyPlans, keyword, filterStatus]);

  const shuffleQuestions = useMemo(() => {
    return [...QUIZ_QUESTIONS].sort(() => Math.random() - 0.5).slice(0, 5);
  }, [showExam]);

  const stats = [
    { label: '学习计划总数', value: studyPlans.length, cls: 'bg-blue-50 text-blue-700' },
    { label: '进行中', value: studyPlans.filter(p => p.status === 'in_progress').length, cls: 'bg-amber-50 text-amber-700' },
    { label: '考核通过', value: studyPlans.filter(p => p.status === 'completed').length, cls: 'bg-green-50 text-green-700' },
    { label: '需补充学习', value: studyPlans.filter(p => p.supplementary || p.status === 'failed').length, cls: 'bg-red-50 text-red-700' },
  ];

  const statusCls: Record<string, { label: string; cls: string }> = {
    not_started: { label: '未开始', cls: 'bg-slate-100 text-slate-600' },
    in_progress: { label: '学习中', cls: 'bg-blue-100 text-blue-700' },
    completed: { label: '考核通过', cls: 'bg-green-100 text-green-700' },
    failed: { label: '考核未通过', cls: 'bg-red-100 text-red-700' },
  };

  const startExam = () => {
    setAnswers({});
    setExamSubmitted(false);
    setShowExam(true);
  };

  const submitExam = () => {
    if (!activePlan) return;
    if (Object.keys(answers).length < shuffleQuestions.length) {
      alert('请完成所有题目后再提交');
      return;
    }
    const correct = shuffleQuestions.filter(q => answers[q.id] === q.answer).length;
    const score = Math.round((correct / shuffleQuestions.length) * 100);
    completeStudy(activePlan.id, score);
    setExamSubmitted(true);
  };

  const finalScore = useMemo(() => {
    if (!examSubmitted) return 0;
    return Math.round((shuffleQuestions.filter(q => answers[q.id] === q.answer).length / shuffleQuestions.length) * 100);
  }, [examSubmitted, answers, shuffleQuestions]);

  return (
    <div className="space-y-5">
      {/* 统计 */}
      <div className="grid grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <div key={i} className={`card p-4 ${s.cls}`}>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs opacity-80 mb-1">{s.label}</div>
                <div className="text-3xl font-bold tabular-nums">{s.value}</div>
              </div>
              <GraduationCap className="w-8 h-8 opacity-70" />
            </div>
          </div>
        ))}
      </div>

      {/* 操作栏 */}
      <div className="card p-4 flex flex-wrap items-center gap-3">
        <h3 className="font-semibold text-slate-800 mr-auto flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-indigo-500" />
          教育学习计划列表
        </h3>
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input className="input pl-9 w-52" placeholder="搜索姓名 / 学习内容" value={keyword} onChange={e => setKeyword(e.target.value)} />
        </div>
        <Filter className="w-4 h-4 text-slate-400 ml-1" />
        <select className="input w-auto" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="">全部状态</option>
          <option value="not_started">未开始</option>
          <option value="in_progress">学习中</option>
          <option value="completed">考核通过</option>
          <option value="failed">考核未通过</option>
        </select>
      </div>

      {/* 计划列表 */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredPlans.length === 0 ? (
          <div className="card p-16 text-center text-sm text-slate-400 col-span-full">暂无学习计划</div>
        ) : filteredPlans.map(p => {
          const today = new Date().toISOString().slice(0, 10);
          const overdue = p.status !== 'completed' && today > p.deadline;
          return (
            <div key={p.id} className={classNames(
              'card p-5 card-hover flex flex-col',
              p.supplementary && 'ring-1 ring-red-200 bg-red-50/20',
              overdue && p.status !== 'completed' && 'ring-1 ring-amber-200'
            )}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`tag ${statusCls[p.status].cls}`}>{statusCls[p.status].label}</span>
                  {p.supplementary && <span className="tag bg-red-100 text-red-700 flex items-center gap-1"><RefreshCw className="w-3 h-3" />补充学习</span>}
                  {overdue && p.status !== 'completed' && <span className="tag bg-amber-100 text-amber-700">已逾期</span>}
                  {p.status === 'completed' && p.score !== undefined && <span className="tag bg-emerald-100 text-emerald-700 flex items-center gap-1"><Award className="w-3 h-3" />{p.score}分</span>}
                  {p.status === 'failed' && p.score !== undefined && <span className="tag bg-red-100 text-red-700">{p.score}分</span>}
                </div>
              </div>
              <h4 className="font-semibold text-slate-800 text-base mb-1.5 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-indigo-500 shrink-0" />
                {p.title}
              </h4>
              <p className="text-sm text-slate-600 mb-3 leading-relaxed line-clamp-2 min-h-[40px]">{p.content}</p>
              <div className="text-xs text-slate-500 mb-4 flex flex-wrap gap-x-4 gap-y-1">
                <span className="flex items-center gap-1"><User className="w-3 h-3" />{p.subjectName}</span>
                <span className="flex items-center gap-1"><Clock className="w-3 h-3" />截止：{p.deadline}</span>
              </div>
              <div className="mt-auto pt-3 border-t border-slate-100 flex items-center justify-between">
                <button
                  className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
                  onClick={() => setActivePlan(p)}
                >
                  <ChevronRight className="w-3.5 h-3.5" />查看详情
                </button>
                <div className="flex gap-2">
                  {(p.status === 'not_started' || p.status === 'in_progress' || p.status === 'failed') && (
                    <>
                      <button
                        className="text-xs px-3 py-1.5 rounded-md bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors flex items-center gap-1"
                        onClick={() => { setActivePlan(p); }}
                      >
                        <PlayCircle className="w-3.5 h-3.5" />开始学习
                      </button>
                      <button
                        className="text-xs px-3 py-1.5 rounded-md bg-green-50 text-green-700 hover:bg-green-100 transition-colors flex items-center gap-1"
                        onClick={() => { setActivePlan(p); startExam(); }}
                      >
                        <FileQuestion className="w-3.5 h-3.5" />答题考核
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 学习/考核弹窗 */}
      {activePlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => { setActivePlan(null); setShowExam(false); }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col animate-fadeIn" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800">{activePlan.title}</h3>
                  <p className="text-xs text-slate-500">{activePlan.subjectName} · 截止 {activePlan.deadline}</p>
                </div>
                <span className={`tag ml-3 ${statusCls[activePlan.status].cls}`}>{statusCls[activePlan.status].label}</span>
              </div>
              <button className="p-2 hover:bg-slate-100 rounded-lg" onClick={() => { setActivePlan(null); setShowExam(false); }}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              {!showExam ? (
                <div className="space-y-5">
                  <div className="p-5 rounded-xl bg-gradient-to-r from-indigo-50 via-blue-50 to-purple-50 border border-indigo-100">
                    <h4 className="font-semibold text-indigo-900 mb-3 flex items-center gap-2">
                      <PlayCircle className="w-5 h-5 text-indigo-500" />
                      在线学习内容
                    </h4>
                    <div className="text-sm text-slate-700 space-y-3 leading-relaxed">
                      <p className="font-medium">【课程简介】</p>
                      <p>{activePlan.content}</p>
                      <div className="bg-white rounded-lg p-4 border border-indigo-100/80">
                        <p className="font-medium text-indigo-800 mb-2">📖 学习要点：</p>
                        <ol className="list-decimal list-inside space-y-1.5 text-slate-700">
                          <li>了解社区矫正的基本概念、适用对象和工作原则</li>
                          <li>掌握《社区矫正法》及实施办法的核心条款</li>
                          <li>明确报到、请假、学习、劳动等监管要求</li>
                          <li>树立法治观念，增强守法意识和社会责任感</li>
                          <li>熟悉违反监管规定的法律后果和处罚措施</li>
                        </ol>
                      </div>
                      <div className="bg-white rounded-lg p-4 border border-indigo-100/80">
                        <p className="font-medium text-indigo-800 mb-2">💡 案例警示：</p>
                        <p className="text-slate-700">某矫正对象张某，因多次未按规定报到且未经批准擅自离开监管区域，被给予警告处分；累计三次警告后，被依法撤销缓刑，收监执行原判刑罚。请务必严格遵守监管规定。</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium mb-1">考核要求</p>
                      <p>完成学习后请参加答题考核，共 5 道题目，<b>满分为 100 分，60 分及以上为合格</b>。考核不合格将自动生成<b>补充学习任务</b>，请重新学习后再次考核。</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-5">
                  {!examSubmitted ? (
                    shuffleQuestions.map((q, idx) => (
                      <div key={q.id} className="p-4 rounded-xl border border-slate-200 bg-white">
                        <div className="flex items-start gap-3 mb-3">
                          <span className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 font-semibold flex items-center justify-center shrink-0 text-sm">{idx + 1}</span>
                          <p className="text-slate-800 font-medium leading-relaxed pt-0.5">{q.question}</p>
                        </div>
                        <div className="pl-10 space-y-2">
                          {q.options.map((opt, oIdx) => (
                            <label
                              key={oIdx}
                              className={classNames(
                                'flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-all border',
                                answers[q.id] === oIdx
                                  ? 'border-indigo-400 bg-indigo-50 text-indigo-900'
                                  : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                              )}
                            >
                              <input
                                type="radio"
                                name={`q-${q.id}`}
                                className="w-4 h-4 accent-indigo-600"
                                checked={answers[q.id] === oIdx}
                                onChange={() => setAnswers(a => ({ ...a, [q.id]: oIdx }))}
                              />
                              <span className="text-sm">
                                <span className="font-medium text-slate-500 mr-1.5">{String.fromCharCode(65 + oIdx)}.</span>{opt}
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="space-y-4">
                      <div className={`p-6 rounded-xl text-center ${finalScore >= 60 ? 'bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200' : 'bg-gradient-to-br from-red-50 to-orange-50 border border-red-200'}`}>
                        <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-3 ${finalScore >= 60 ? 'bg-green-500' : 'bg-red-500'}`}>
                          {finalScore >= 60 ? <CheckCircle2 className="w-10 h-10 text-white" /> : <XCircle className="w-10 h-10 text-white" />}
                        </div>
                        <div className="text-5xl font-bold tabular-nums mb-2" style={{ color: finalScore >= 60 ? '#16a34a' : '#dc2626' }}>{finalScore}<span className="text-2xl text-slate-400"> / 100</span></div>
                        <div className={`font-semibold ${finalScore >= 60 ? 'text-green-700' : 'text-red-700'}`}>
                          {finalScore >= 60 ? '🎉 考核通过，学习任务完成！' : '⚠️ 考核未通过，已自动生成补充学习任务'}
                        </div>
                        <div className="text-xs text-slate-600 mt-2">
                          答对 {shuffleQuestions.filter(q => answers[q.id] === q.answer).length} / {shuffleQuestions.length} 题
                        </div>
                      </div>
                      <div className="space-y-3">
                        {shuffleQuestions.map((q, idx) => {
                          const userAns = answers[q.id];
                          const isCorrect = userAns === q.answer;
                          return (
                            <div key={q.id} className={`p-4 rounded-xl border ${isCorrect ? 'border-green-200 bg-green-50/40' : 'border-red-200 bg-red-50/40'}`}>
                              <div className="flex items-start gap-3">
                                {isCorrect
                                  ? <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                                  : <XCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />}
                                <div className="flex-1">
                                  <p className="font-medium text-slate-800 mb-2">{idx + 1}. {q.question}</p>
                                  <div className="text-sm space-y-1">
                                    <p className="text-slate-600">你的答案：<b className={isCorrect ? 'text-green-700' : 'text-red-700'}>{String.fromCharCode(65 + userAns)}. {q.options[userAns]}</b></p>
                                    {!isCorrect && <p className="text-green-700">正确答案：<b>{String.fromCharCode(65 + q.answer)}. {q.options[q.answer]}</b></p>}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="px-6 py-4 border-t bg-slate-50/60 flex items-center justify-end gap-3">
              {!showExam ? (
                <button className="btn-primary gap-2" onClick={startExam}>
                  <FileQuestion className="w-4 h-4" />开始答题考核
                </button>
              ) : !examSubmitted ? (
                <>
                  <button className="btn-secondary" onClick={() => setShowExam(false)}>返回学习</button>
                  <button className="btn-success gap-2" onClick={submitExam}>
                    <CheckCircle2 className="w-4 h-4" />提交答卷
                  </button>
                </>
              ) : (
                <button
                  className="btn-primary gap-2"
                  onClick={() => { setActivePlan(null); setShowExam(false); }}
                >
                  完成，关闭
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudyExam;
