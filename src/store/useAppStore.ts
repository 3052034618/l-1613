import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  Subject,
  AlertOrder,
  Officer,
  LeaveApplication,
  CheckinRecord,
  StudyPlan,
  DailyReport,
  ValidationError,
  AlertLevel,
  ReviewNode,
  ReviewStatus,
  ExportRecord,
  ExportType,
  DisposalStep,
  DESTINATION_COORDS,
} from '@/types';
import {
  generateMockSubjects,
  generateMockOfficers,
  generateMockAlerts,
  generateMockLeaves,
  generateMockCheckins,
  generateMockStudyPlans,
  generateMockReports,
  findNearestOfficer,
} from '@/utils/mockData';
import { downloadCSV, formatDateTime, todayStr } from '@/utils';

interface AppState {
  subjects: Subject[];
  officers: Officer[];
  alerts: AlertOrder[];
  leaves: LeaveApplication[];
  checkins: CheckinRecord[];
  studyPlans: StudyPlan[];
  reports: DailyReport[];
  exportRecords: ExportRecord[];
  currentOperator: string;
  validateIntake: (data: Partial<Subject>) => ValidationError[];
  createSubject: (data: Partial<Subject>) => { success: boolean; errors?: ValidationError[]; subject?: Subject };
  updateSubject: (id: string, updates: Partial<Subject>) => void;
  updateSubjectLocation: (id: string, location: { lat: number; lng: number }) => AlertOrder | null;
  updateLocationPermission: (id: string, perm: Subject['locationPermission']) => void;
  submitLeave: (data: Omit<LeaveApplication, 'id' | 'firstReview' | 'secondReview' | 'submittedAt' | 'currentStage' | 'urgeHistory'>) => LeaveApplication;
  reviewLeaveFirst: (id: string, approved: boolean, reviewer: string, comment?: string) => void;
  reviewLeaveSecond: (id: string, approved: boolean, reviewer: string, comment?: string) => void;
  urgeLeave: (id: string) => void;
  returnFromLeave: (id: string, operator: string, note?: string) => void;
  updateAlertStatus: (id: string, status: AlertOrder['status']) => void;
  _addDisposalStep: (alertId: string, step: DisposalStep) => void;
  acceptAlert: (alertId: string, operator: string) => void;
  contactSubject: (alertId: string, operator: string, note: string) => void;
  recordFamilyReply: (alertId: string, operator: string, reply: string) => void;
  onsiteDisposal: (alertId: string, operator: string, result: string) => void;
  resolveAlert: (alertId: string, operator: string, finalResult: string) => void;
  suspendRights: (subjectId: string, reason: string) => void;
  restoreRights: (subjectId: string, reason: string) => void;
  _appendRightsHistory: (subjectId: string, record: import('@/types').RightsChangeRecord) => void;
  checkIn: (subjectId: string, recordId: string) => void;
  completeStudy: (planId: string, score: number) => void;
  createSupplementaryStudy: (planId: string) => void;
  addExportRecord: (record: Omit<ExportRecord, 'id' | 'exportedAt'>) => void;
  exportSubjectsToCSV: (filters?: { district?: string; status?: string; name?: string }) => string;
  exportReleaseToCSV: (startDate: string, endDate: string, district?: string, keyword?: string) => string;
  exportReleaseListCSV: (list: Subject[], filters: Record<string, string>, filterDisplay: string) => string;
  exportReportsToCSV: (date?: string, district?: string) => string;
  exportDailyReportsCSV: (rows: DailyReport[], filters: Record<string, string>, filterDisplay: string) => string;
  resetAll: () => void;
}

const genId = (prefix: string) => `${prefix}${Date.now()}${Math.floor(Math.random() * 1000)}`;

const TYPE_NAMES: Record<ExportType, string> = {
  daily_report: '监管日报',
  release_list: '解矫名单',
  subject_list: '在矫档案',
  assessment: '评估报告',
};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      subjects: generateMockSubjects(),
      officers: generateMockOfficers(),
      alerts: [],
      leaves: [],
      checkins: [],
      studyPlans: [],
      reports: generateMockReports(),
      exportRecords: [],
      currentOperator: '系统管理员',

      validateIntake: (data) => {
        const errors: ValidationError[] = [];
        const identityFields: { key: keyof Subject; label: string }[] = [
          { key: 'name', label: '姓名（身份）' },
          { key: 'idCard', label: '身份证号（身份）' },
          { key: 'identityCaseNumber', label: '案号（身份登记）' },
          { key: 'gender', label: '性别' },
          { key: 'address', label: '住址' },
          { key: 'phone', label: '联系电话' },
          { key: 'familyName', label: '家属姓名' },
          { key: 'familyPhone', label: '家属电话' },
        ];
        const legalFields: { key: keyof Subject; label: string }[] = [
          { key: 'docName', label: '姓名（文书）' },
          { key: 'docIdCard', label: '身份证号（文书）' },
          { key: 'docCaseNumber', label: '判决文号（文书）' },
          { key: 'charge', label: '罪名' },
          { key: 'sentenceStart', label: '矫正开始日期' },
          { key: 'sentenceEnd', label: '矫正结束日期' },
          { key: 'correctionType', label: '矫正类型' },
          { key: 'district', label: '所属区县' },
          { key: 'policeStation', label: '所属司法所' },
        ];
        identityFields.forEach(({ key, label }) => {
          if (!data[key]) errors.push({ field: key as string, label, type: 'missing', message: `身份信息缺失：${label}` });
        });
        legalFields.forEach(({ key, label }) => {
          if (!data[key]) errors.push({ field: key as string, label, type: 'missing', message: `法律文书缺失：${label}` });
        });
        if (data.idCard && !/^\d{17}[\dXx]$/.test(data.idCard)) {
          errors.push({ field: 'idCard', label: '身份证号（身份）', type: 'mismatch', message: '身份证号格式不合法' });
        }
        if (data.docIdCard && !/^\d{17}[\dXx]$/.test(data.docIdCard)) {
          errors.push({ field: 'docIdCard', label: '身份证号（文书）', type: 'mismatch', message: '法律文书中身份证号格式不合法' });
        }
        if (data.phone && !/^1[3-9]\d{9}$/.test(data.phone)) {
          errors.push({ field: 'phone', label: '联系电话', type: 'mismatch', message: '电话号码格式不合法' });
        }
        if (data.familyPhone && !/^1[3-9]\d{9}$/.test(data.familyPhone)) {
          errors.push({ field: 'familyPhone', label: '家属电话', type: 'mismatch', message: '家属电话格式不合法' });
        }
        if (data.sentenceStart && data.sentenceEnd && new Date(data.sentenceStart) >= new Date(data.sentenceEnd)) {
          errors.push({ field: 'sentenceEnd', label: '矫正结束日期', type: 'mismatch', message: '矫正结束日期必须晚于开始日期' });
        }
        if (data.idCard && data.name) {
          const yearFromId = data.idCard.slice(6, 10);
          const genderFromId = parseInt(data.idCard.slice(-2, -1)) % 2 === 1 ? '男' : '女';
          if (data.gender && genderFromId !== data.gender) {
            errors.push({ field: 'gender', label: '性别', type: 'mismatch', message: `性别与身份证信息不一致（身份证第17位判断为${genderFromId}）` });
          }
          if (parseInt(yearFromId) < 1940 || parseInt(yearFromId) > 2010) {
            errors.push({ field: 'idCard', label: '身份证号', type: 'mismatch', message: `出生年份${yearFromId}不合法` });
          }
        }
        // 跨源比对 - 姓名
        if (data.name && data.docName && data.name !== data.docName) {
          errors.push({
            field: 'cross_name',
            label: '姓名比对',
            type: 'cross_check',
            message: `姓名不一致`,
            identityValue: data.name,
            legalValue: data.docName,
          });
        }
        // 跨源比对 - 身份证号
        if (data.idCard && data.docIdCard && data.idCard.replace(/\s/g, '') !== data.docIdCard.replace(/\s/g, '')) {
          errors.push({
            field: 'cross_idcard',
            label: '身份证号比对',
            type: 'cross_check',
            message: `身份证号不一致`,
            identityValue: data.idCard,
            legalValue: data.docIdCard,
          });
        }
        // 跨源比对 - 案号
        if (data.identityCaseNumber && data.docCaseNumber && data.identityCaseNumber !== data.docCaseNumber) {
          errors.push({
            field: 'cross_casenumber',
            label: '案号比对',
            type: 'cross_check',
            message: `案号不一致`,
            identityValue: data.identityCaseNumber,
            legalValue: data.docCaseNumber,
          });
        }
        return errors;
      },

      createSubject: (data) => {
        const errors = get().validateIntake(data);
        const crossCheckErrors = errors.filter(e => e.type === 'cross_check').map(e => e.message);
        const crossCheckPassed = crossCheckErrors.length === 0;
        // 只有无错误且跨源比对通过才进档案
        if (errors.length > 0) return { success: false, errors };
        const district = data.district!;
        const now = new Date().toISOString();
        const centerLat = 39.9042 + (Math.random() - 0.5) * 0.1;
        const centerLng = 116.4074 + (Math.random() - 0.5) * 0.1;
        const subject: Subject = {
          id: genId('SUB'),
          name: data.name!,
          idCard: data.idCard!,
          gender: data.gender!,
          address: data.address!,
          phone: data.phone!,
          identityCaseNumber: data.identityCaseNumber!,
          docName: data.docName!,
          docIdCard: data.docIdCard!,
          docCaseNumber: data.docCaseNumber!,
          crossCheckPassed,
          crossCheckErrors,
          caseNumber: data.docCaseNumber!,
          charge: data.charge!,
          sentenceStart: data.sentenceStart!,
          sentenceEnd: data.sentenceEnd!,
          correctionType: data.correctionType!,
          status: 'active',
          locationPermission: 'normal',
          rightsSuspended: false,
          rightsHistory: [],
          createdAt: now,
          district,
          policeStation: data.policeStation!,
          familyName: data.familyName!,
          familyPhone: data.familyPhone!,
          fenceCenter: { lat: centerLat, lng: centerLng },
          fenceRadius: 3000 + Math.random() * 2000,
          currentLocation: { lat: centerLat, lng: centerLng },
          riskLevel: 'low',
          alertHistoryCount: 0,
        } as Subject;
        set({ subjects: [subject, ...get().subjects] });
        return { success: true, subject };
      },

      updateSubject: (id, updates) => {
        set({ subjects: get().subjects.map(s => s.id === id ? { ...s, ...updates } : s) });
      },

      updateSubjectLocation: (id, location) => {
        const subject = get().subjects.find(s => s.id === id);
        if (!subject) return null;
        get().updateSubject(id, { currentLocation: location });
        const dLat = (location.lat - subject.fenceCenter.lat) * Math.PI / 180;
        const dLng = (location.lng - subject.fenceCenter.lng) * Math.PI / 180;
        const R = 6371000;
        const la1 = subject.fenceCenter.lat * Math.PI / 180;
        const la2 = location.lat * Math.PI / 180;
        const h = Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2;
        const distance = 2 * R * Math.asin(Math.sqrt(h));
        if (distance <= subject.fenceRadius) return null;
        const overDistance = distance - subject.fenceRadius;
        const level: AlertLevel = overDistance > 500 ? 'red' : overDistance > 200 ? 'orange' : 'yellow';
        const officer = findNearestOfficer(location, get().officers, subject.district);
        const now = new Date().toISOString();
        const alert: AlertOrder = {
          id: genId('ALT'),
          subjectId: subject.id,
          subjectName: subject.name,
          level,
          location,
          fenceDistance: Math.round(overDistance),
          assignedOfficer: officer,
          familyNotified: true,
          familyNotifyTime: now,
          status: 'pending',
          disposalSteps: [],
          createdAt: now,
          district: subject.district,
          description: `${subject.name}越出电子围栏${Math.round(overDistance)}米（${level === 'red' ? '红色' : level === 'orange' ? '橙色' : '黄色'}预警）`,
        };
        set({ alerts: [alert, ...get().alerts] });
        // 更新对象的预警历史计数和风险等级
        const newCount = subject.alertHistoryCount + 1;
        const newRisk: Subject['riskLevel'] = newCount > 8 ? 'high' : newCount > 3 ? 'medium' : 'low';
        get().updateSubject(id, { alertHistoryCount: newCount, riskLevel: newRisk });
        return alert;
      },

      updateLocationPermission: (id, perm) => {
        get().updateSubject(id, { locationPermission: perm });
      },

      submitLeave: (data) => {
        const now = new Date().toISOString();
        const pendingNode: ReviewNode = { status: 'pending', urgedCount: 0 };
        const destCoord = DESTINATION_COORDS[data.destination] || { lat: 39.9 + Math.random() * 0.1, lng: 116.4 + Math.random() * 0.1 };
        const leave: LeaveApplication = {
          id: genId('LEA'),
          ...data,
          destinationLat: destCoord.lat,
          destinationLng: destCoord.lng,
          firstReview: pendingNode,
          secondReview: pendingNode,
          submittedAt: now,
          currentStage: 'first',
          urgeHistory: [],
        };
        set({ leaves: [leave, ...get().leaves] });
        return leave;
      },

      reviewLeaveFirst: (id, approved, reviewer, comment) => {
        const leave = get().leaves.find(l => l.id === id);
        if (!leave) return;
        const now = new Date().toISOString();
        const firstReview: ReviewNode = {
          status: (approved ? 'approved' : 'rejected') as ReviewStatus,
          reviewer,
          time: now,
          urged: leave.firstReview.urged,
          urgedCount: leave.firstReview.urgedCount,
          urgedTime: leave.firstReview.urgedTime,
          comment,
        };
        const nextStage: LeaveApplication['currentStage'] = approved ? 'second' : 'first';
        const leaves = get().leaves.map(l => l.id === id ? { ...l, firstReview, currentStage: nextStage } : l);
        set({ leaves });
      },

      reviewLeaveSecond: (id, approved, reviewer, comment) => {
        const leave = get().leaves.find(l => l.id === id);
        if (!leave) return;
        const now = new Date().toISOString();
        const secondReview: ReviewNode = {
          status: (approved ? 'approved' : 'rejected') as ReviewStatus,
          reviewer,
          time: now,
          urged: leave.secondReview.urged,
          urgedCount: leave.secondReview.urgedCount,
          urgedTime: leave.secondReview.urgedTime,
          comment,
        };
        let nextStage: LeaveApplication['currentStage'] = leave.currentStage;
        if (approved) {
          nextStage = 'vacation';
          // 通过 → 扩展定位权限 + 创建临时围栏
          const subject = get().subjects.find(s => s.id === leave.subjectId);
          if (subject) {
            const destCoord = DESTINATION_COORDS[leave.destination] || { lat: leave.destinationLat!, lng: leave.destinationLng! };
            get().updateSubject(leave.subjectId, {
              locationPermission: 'expanded',
              tempFence: {
                destination: leave.destination,
                center: destCoord,
                radius: 3000,
                startDate: leave.startDate,
                endDate: leave.endDate,
                leaveId: leave.id,
                active: true,
              },
            });
          }
        } else {
          nextStage = 'second';
        }
        const leaves = get().leaves.map(l => l.id === id ? { ...l, secondReview, currentStage: nextStage } : l);
        set({ leaves });
      },

      urgeLeave: (id) => {
        const leave = get().leaves.find(l => l.id === id);
        if (!leave) return;
        const now = new Date().toISOString();
        const stage = leave.currentStage;
        if (stage !== 'first' && stage !== 'second') return;
        const nodeField = stage === 'first' ? 'firstReview' : 'secondReview';
        const newCount = (leave[nodeField].urgedCount || 0) + 1;
        const newLeaves = get().leaves.map(l => {
          if (l.id !== id) return l;
          return {
            ...l,
            [nodeField]: {
              ...l[nodeField],
              urged: true,
              urgedTime: now,
              urgedCount: newCount,
            } as ReviewNode,
            urgeHistory: [...l.urgeHistory, { stage, time: now, count: newCount }],
          };
        });
        set({ leaves: newLeaves });
      },

      returnFromLeave: (id, operator, note) => {
        const leave = get().leaves.find(l => l.id === id);
        if (!leave) return;
        const now = new Date().toISOString();
        // 销假 → 恢复定位权限 + 停用临时围栏
        const subject = get().subjects.find(s => s.id === leave.subjectId);
        if (subject) {
          get().updateSubject(leave.subjectId, {
            locationPermission: 'normal',
            tempFence: subject.tempFence ? { ...subject.tempFence, active: false } : undefined,
          });
        }
        set({
          leaves: get().leaves.map(l =>
            l.id === id ? { ...l, currentStage: 'returned', returnedAt: now, returnNote: note || `${operator}已确认销假` } : l
          ),
        });
      },

      updateAlertStatus: (id, status) => {
        set({ alerts: get().alerts.map(a => a.id === id ? { ...a, status } : a) });
      },

      _addDisposalStep: (alertId: string, step: DisposalStep) => {
        set({
          alerts: get().alerts.map(a =>
            a.id === alertId ? { ...a, disposalSteps: [...a.disposalSteps, step] } : a
          ),
        });
      },

      acceptAlert: (alertId, operator) => {
        const alert = get().alerts.find(a => a.id === alertId);
        if (!alert) return;
        const now = new Date().toISOString();
        const step: DisposalStep = { step: 'accept', time: now, operator, content: `${operator}已接单，正前往现场核实情况` };
        get()._addDisposalStep(alertId, step);
        set({ alerts: get().alerts.map(a => a.id === alertId ? { ...a, status: 'accepted' as const } : a) });
      },

      contactSubject: (alertId, operator, note) => {
        const alert = get().alerts.find(a => a.id === alertId);
        if (!alert) return;
        const now = new Date().toISOString();
        const step: DisposalStep = { step: 'contact_subject', time: now, operator, content: `联系对象：${note}` };
        get()._addDisposalStep(alertId, step);
        set({
          alerts: get().alerts.map(a =>
            a.id === alertId
              ? { ...a, status: 'contacted' as const, subjectContacted: true, subjectContactTime: now, subjectContactNote: note }
              : a
          ),
        });
      },

      recordFamilyReply: (alertId, operator, reply) => {
        const alert = get().alerts.find(a => a.id === alertId);
        if (!alert) return;
        const now = new Date().toISOString();
        const step: DisposalStep = { step: 'family_reply', time: now, operator, content: `家属回执：${reply}` };
        get()._addDisposalStep(alertId, step);
        set({
          alerts: get().alerts.map(a =>
            a.id === alertId
              ? { ...a, status: 'family_replied' as const, familyReply: reply, familyReplyTime: now, familyNotified: true, familyNotifyTime: a.familyNotifyTime || now }
              : a
          ),
        });
      },

      onsiteDisposal: (alertId, operator, result) => {
        const alert = get().alerts.find(a => a.id === alertId);
        if (!alert) return;
        const now = new Date().toISOString();
        const step: DisposalStep = { step: 'onsite', time: now, operator, content: `现场处置：${result}` };
        get()._addDisposalStep(alertId, step);
        set({
          alerts: get().alerts.map(a =>
            a.id === alertId ? { ...a, status: 'processing' as const, onsiteResult: result, onsiteTime: now } : a
          ),
        });
      },

      resolveAlert: (alertId, operator, finalResult) => {
        const alert = get().alerts.find(a => a.id === alertId);
        if (!alert) return;
        const now = new Date().toISOString();
        const step: DisposalStep = { step: 'resolve', time: now, operator, content: `结案：${finalResult}` };
        get()._addDisposalStep(alertId, step);
        set({
          alerts: get().alerts.map(a =>
            a.id === alertId ? { ...a, status: 'resolved' as const, finalResult, createdAt: a.createdAt } : a
          ),
        });
      },

      _appendRightsHistory: (subjectId, record) => {
        set({
          subjects: get().subjects.map(s =>
            s.id === subjectId ? { ...s, rightsHistory: [record, ...s.rightsHistory] } : s
          ),
        });
      },

      suspendRights: (subjectId, reason) => {
        const now = new Date().toISOString();
        const subject = get().subjects.find(s => s.id === subjectId);
        if (!subject || subject.rightsSuspended) return;
        get().updateSubject(subjectId, { rightsSuspended: true, rightsSuspendReason: reason, rightsSuspendTime: now });
        get()._appendRightsHistory(subjectId, {
          id: genId('RH'),
          time: now,
          type: 'suspend',
          reason,
          operator: get().currentOperator,
          result: '权益已暂停（限制外出请假、缩小活动范围、纳入重点关注）',
          before: false,
          after: true,
        });
      },

      restoreRights: (subjectId, reason) => {
        const now = new Date().toISOString();
        const subject = get().subjects.find(s => s.id === subjectId);
        if (!subject || !subject.rightsSuspended) return;
        get().updateSubject(subjectId, { rightsSuspended: false, rightsSuspendReason: undefined, rightsSuspendTime: undefined });
        get()._appendRightsHistory(subjectId, {
          id: genId('RH'),
          time: now,
          type: 'restore_manual',
          reason,
          operator: get().currentOperator,
          result: '权益已恢复正常',
          before: true,
          after: false,
        });
      },

      checkIn: (subjectId, recordId) => {
        const now = new Date().toISOString();
        const today = todayStr();
        const subject = get().subjects.find(s => s.id === subjectId);
        set({
          checkins: get().checkins.map(c =>
            c.id === recordId ? { ...c, status: 'completed', actualDate: today, rightsChangeNote: '' } : c
          ),
        });
        if (subject?.rightsSuspended) {
          get().updateSubject(subjectId, { rightsSuspended: false, rightsSuspendReason: undefined, rightsSuspendTime: undefined });
          get()._appendRightsHistory(subjectId, {
            id: genId('RH'),
            time: now,
            type: 'restore_checkin',
            reason: '完成补报到，已履行报到义务',
            operator: get().currentOperator,
            result: '权益已恢复正常',
            before: true,
            after: false,
          });
        }
      },

      completeStudy: (planId, score) => {
        set({
          studyPlans: get().studyPlans.map(p =>
            p.id === planId ? { ...p, status: score >= 60 ? 'completed' : 'failed', score } : p
          ),
        });
      },

      createSupplementaryStudy: (planId) => {
        const plan = get().studyPlans.find(p => p.id === planId);
        if (!plan) return;
        const newPlan: StudyPlan = {
          id: genId('STU'),
          subjectId: plan.subjectId,
          subjectName: plan.subjectName,
          title: '【补充学习】' + plan.title,
          content: plan.content,
          deadline: todayStr() + 7,
          status: 'not_started',
          createdAt: new Date().toISOString(),
          supplementary: true,
        };
        set({ studyPlans: [newPlan, ...get().studyPlans] });
      },

      addExportRecord: (record) => {
        const full: ExportRecord = { ...record, id: genId('EXP'), exportedAt: new Date().toISOString() };
        set({ exportRecords: [full, ...get().exportRecords] });
      },

      exportSubjectsToCSV: (filters) => {
        let list = get().subjects;
        const f: Record<string, string> = {};
        if (filters?.district) { list = list.filter(s => s.district === filters.district); f['区县'] = filters.district; }
        if (filters?.status) { list = list.filter(s => s.status === filters.status); f['状态'] = filters.status; }
        if (filters?.name) { list = list.filter(s => s.name.includes(filters.name!)); f['姓名'] = filters.name; }
        const headers = ['对象编号', '姓名', '身份证号', '性别', '罪名', '矫正类型', '区县', '司法所', '入矫日期', '解矫日期', '风险等级', '当前状态'];
        const rows = list.map(s => [s.id, s.name, s.idCard, s.gender, s.charge, s.correctionType, s.district, s.policeStation, s.sentenceStart, s.sentenceEnd, s.riskLevel === 'high' ? '高' : s.riskLevel === 'medium' ? '中' : '低', statusLabel(s.status)]);
        let csvContent = headers.join(',') + '\n';
        rows.forEach(r => { csvContent += r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',') + '\n'; });
        const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const fileName = `在矫档案_${dateStr}_${list.length}条`;
        const filterDisplay = Object.entries(f).map(([k, v]) => `${k}=${v}`).join('，') || '全部';
        downloadCSV(csvContent, fileName);
        get().addExportRecord({ type: 'subject_list', typeName: TYPE_NAMES['subject_list'], filters: f, filterDisplay, fileName: fileName + '.csv', recordCount: rows.length, operator: get().currentOperator });
        return fileName;
      },

      exportReleaseToCSV: (startDate, endDate, district, keyword) => {
        let list = get().subjects.filter(s => s.sentenceEnd >= startDate && s.sentenceEnd <= endDate);
        const f: Record<string, string> = { '开始日期': startDate, '结束日期': endDate };
        if (district) { list = list.filter(s => s.district === district); f['区县'] = district; }
        if (keyword) {
          list = list.filter(s => s.name.includes(keyword) || s.idCard.includes(keyword));
          f['关键词'] = keyword;
        }
        list = list.sort((a, b) => a.sentenceEnd.localeCompare(b.sentenceEnd));
        return get().exportReleaseListCSV(list, f, Object.entries(f).map(([k, v]) => `${k}=${v}`).join('，'));
      },

      exportReleaseListCSV: (list, filters, filterDisplay) => {
        const headers = ['对象编号', '姓名', '身份证号', '罪名', '矫正类型', '区县', '司法所', '入矫日期', '解矫日期', '剩余天数', '综合建议'];
        const rows = list.map(s => {
          const remain = Math.ceil((new Date(s.sentenceEnd).getTime() - Date.now()) / 86400000);
          const suggestion = remain <= 7 ? '尽快组织解矫评估' : remain <= 30 ? '按计划准备评估材料' : '持续监管';
          return [s.id, s.name, s.idCard, s.charge, s.correctionType, s.district, s.policeStation, s.sentenceStart, s.sentenceEnd, String(remain), suggestion];
        });
        const dateStr = todayStr().replace(/-/g, '');
        const fileName = `解矫名单_${dateStr}_${rows.length}条`;
        downloadCSV(fileName, headers, rows);
        get().addExportRecord({ type: 'release_list', typeName: TYPE_NAMES['release_list'], filters, filterDisplay, fileName: fileName + '.csv', recordCount: rows.length, operator: get().currentOperator });
        return fileName;
      },

      exportReportsToCSV: (date, district) => {
        let list = get().reports;
        const f: Record<string, string> = {};
        if (date) { list = list.filter(r => r.date === date); f['日期'] = date; }
        if (district) { list = list.filter(r => r.district === district); f['区县'] = district; }
        const filterDisplay = Object.entries(f).map(([k, v]) => `${k}=${v}`).join('，') || '近7日全部';
        return get().exportDailyReportsCSV(list, f, filterDisplay);
      },

      exportDailyReportsCSV: (rows, filters, filterDisplay) => {
        const headers = ['日期', '区县', '在矫人数', '违规率%', '教育完成率%', '逾期报到数', '预警数', '状态评估'];
        const data = rows.map(r => {
          const score = r.violationRate + r.overdueCheckinCount * 0.5 + r.alertCount;
          const assess = score < 2 ? '良好' : score < 4 ? '一般' : '重点关注';
          return [r.date, r.district, r.activeCount, r.violationRate, r.studyCompletionRate, r.overdueCheckinCount, r.alertCount, assess];
        });
        const dateStr = (filters['日期'] || todayStr()).replace(/-/g, '');
        const fileName = `监管日报_${dateStr}_${data.length}条`;
        downloadCSV(fileName, headers, data);
        get().addExportRecord({ type: 'daily_report', typeName: TYPE_NAMES['daily_report'], filters, filterDisplay, fileName: fileName + '.csv', recordCount: data.length, operator: get().currentOperator });
        return fileName;
      },

      resetAll: () => {
        const subjects = generateMockSubjects();
        const officers = generateMockOfficers();
        const alerts = generateMockAlerts(subjects, officers);
        const leaves = generateMockLeaves(subjects);
        const checkins = generateMockCheckins(subjects);
        const studyPlans = generateMockStudyPlans(subjects);
        const reports = generateMockReports();
        // 给已审批通过的请假记录挂上临时围栏
        const enhancedSubjects: Subject[] = subjects.map(s => {
          const approvedLeave = leaves.find(l => l.subjectId === s.id && ['vacation', 'returned'].includes(l.currentStage));
          if (approvedLeave) {
            const destCoord = DESTINATION_COORDS[approvedLeave.destination] || { lat: approvedLeave.destinationLat!, lng: approvedLeave.destinationLng! };
            return {
              ...s,
              locationPermission: (approvedLeave.currentStage === 'returned' ? 'normal' : 'expanded') as Subject['locationPermission'],
              tempFence: {
                destination: approvedLeave.destination,
                center: destCoord,
                radius: 3000,
                startDate: approvedLeave.startDate,
                endDate: approvedLeave.endDate,
                leaveId: approvedLeave.id,
                active: approvedLeave.currentStage === 'vacation',
              },
            };
          }
          return s;
        });
        set({
          subjects: enhancedSubjects,
          officers,
          alerts,
          leaves,
          checkins,
          studyPlans,
          reports,
          exportRecords: [],
        });
      },
    }),
    {
      name: 'sjz-app-storage-v2',
      onRehydrateStorage: () => (state) => {
        if (state && (!state.subjects || state.subjects.length === 0)) {
          state.resetAll();
        }
        if (state && !state.exportRecords) state.exportRecords = [];
      },
    }
  )
);

function statusLabel(s: string) {
  return s === 'active' ? '在矫中' : s === 'pending' ? '待入矫' : s === 'released' ? '已解矫' : s;
}
