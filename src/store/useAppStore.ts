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

interface AppState {
  subjects: Subject[];
  officers: Officer[];
  alerts: AlertOrder[];
  leaves: LeaveApplication[];
  checkins: CheckinRecord[];
  studyPlans: StudyPlan[];
  reports: DailyReport[];
  validateIntake: (data: Partial<Subject>) => ValidationError[];
  createSubject: (data: Partial<Subject>) => { success: boolean; errors?: ValidationError[]; subject?: Subject };
  updateSubject: (id: string, updates: Partial<Subject>) => void;
  updateSubjectLocation: (id: string, location: { lat: number; lng: number }) => AlertOrder | null;
  updateLocationPermission: (id: string, perm: Subject['locationPermission']) => void;
  submitLeave: (data: Omit<LeaveApplication, 'id' | 'firstReview' | 'secondReview' | 'submittedAt' | 'currentStage'>) => LeaveApplication;
  reviewLeaveFirst: (id: string, approved: boolean, reviewer: string, comment?: string) => void;
  reviewLeaveSecond: (id: string, approved: boolean, reviewer: string, comment?: string) => void;
  urgeLeave: (id: string) => void;
  updateAlertStatus: (id: string, status: AlertOrder['status']) => void;
  checkIn: (subjectId: string, recordId: string) => void;
  completeStudy: (planId: string, score: number) => void;
  createSupplementaryStudy: (planId: string) => void;
  exportSubjectsToCSV: (filters?: { district?: string; status?: string }) => string;
  exportReleaseToCSV: (startDate: string, endDate: string, district?: string) => string;
  exportReportsToCSV: (date?: string, district?: string) => string;
  resetAll: () => void;
}

const genId = (prefix: string) => `${prefix}${Date.now()}${Math.floor(Math.random() * 1000)}`;

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

      validateIntake: (data) => {
        const errors: ValidationError[] = [];
        const identityFields: { key: keyof Subject; label: string }[] = [
          { key: 'name', label: '姓名' },
          { key: 'idCard', label: '身份证号' },
          { key: 'gender', label: '性别' },
          { key: 'address', label: '住址' },
          { key: 'phone', label: '联系电话' },
          { key: 'familyName', label: '家属姓名' },
          { key: 'familyPhone', label: '家属电话' },
        ];
        const legalFields: { key: keyof Subject; label: string }[] = [
          { key: 'caseNumber', label: '判决文号' },
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
          errors.push({ field: 'idCard', label: '身份证号', type: 'mismatch', message: '身份证号格式不合法' });
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
        return errors;
      },

      createSubject: (data) => {
        const errors = get().validateIntake(data);
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
          caseNumber: data.caseNumber!,
          charge: data.charge!,
          sentenceStart: data.sentenceStart!,
          sentenceEnd: data.sentenceEnd!,
          correctionType: data.correctionType!,
          status: 'active',
          locationPermission: 'normal',
          createdAt: now,
          district,
          policeStation: data.policeStation!,
          familyName: data.familyName!,
          familyPhone: data.familyPhone!,
          fenceCenter: { lat: centerLat, lng: centerLng },
          fenceRadius: 3000 + Math.random() * 2000,
          currentLocation: { lat: centerLat, lng: centerLng },
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
          createdAt: now,
          district: subject.district,
          description: `${subject.name}越出电子围栏${Math.round(overDistance)}米（${level === 'red' ? '红色' : level === 'orange' ? '橙色' : '黄色'}预警）`,
        };
        set({ alerts: [alert, ...get().alerts] });
        return alert;
      },

      updateLocationPermission: (id, perm) => {
        get().updateSubject(id, { locationPermission: perm });
      },

      submitLeave: (data) => {
        const now = new Date().toISOString();
        const pendingNode: ReviewNode = { status: 'pending' };
        const leave: LeaveApplication = {
          id: genId('LEA'),
          ...data,
          firstReview: pendingNode,
          secondReview: pendingNode,
          submittedAt: now,
          currentStage: 'first',
        };
        set({ leaves: [leave, ...get().leaves] });
        return leave;
      },

      reviewLeaveFirst: (id, approved, reviewer, comment) => {
        const leaves = get().leaves.map(l => {
          if (l.id !== id) return l;
          const now = new Date().toISOString();
          const nextStage: LeaveApplication['currentStage'] = approved ? 'second' : 'completed';
          return {
            ...l,
            firstReview: { status: (approved ? 'approved' : 'rejected') as ReviewStatus, reviewer, time: now, urged: l.firstReview.urged, comment },
            currentStage: nextStage,
            secondReview: approved ? l.secondReview : { ...l.secondReview, status: 'rejected' as ReviewStatus },
          };
        });
        const target = leaves.find(l => l.id === id);
        if (target && approved && target.secondReview.status === 'pending') {
          // 待复审
        } else if (target && target.secondReview.status === 'approved') {
          get().updateLocationPermission(target.subjectId, 'expanded');
        }
        set({ leaves });
      },

      reviewLeaveSecond: (id, approved, reviewer, comment) => {
        const leaves = get().leaves.map(l => {
          if (l.id !== id) return l;
          const now = new Date().toISOString();
          return {
            ...l,
            secondReview: { status: (approved ? 'approved' : 'rejected') as ReviewStatus, reviewer, time: now, urged: l.secondReview.urged, comment },
            currentStage: 'completed' as const,
          };
        });
        set({ leaves });
        const target = leaves.find(l => l.id === id);
        if (target && approved) {
          get().updateLocationPermission(target.subjectId, 'expanded');
        }
      },

      urgeLeave: (id) => {
        set({
          leaves: get().leaves.map(l =>
            l.id === id
              ? l.currentStage === 'first'
                ? { ...l, firstReview: { ...l.firstReview, urged: true } }
                : { ...l, secondReview: { ...l.secondReview, urged: true } }
              : l
          ),
        });
      },

      updateAlertStatus: (id, status) => {
        set({ alerts: get().alerts.map(a => a.id === id ? { ...a, status } : a) });
      },

      checkIn: (subjectId, recordId) => {
        set({
          checkins: get().checkins.map(r =>
            r.id === recordId && r.subjectId === subjectId
              ? { ...r, status: 'completed', actualDate: new Date().toISOString().slice(0, 10) }
              : r
          ),
        });
      },

      completeStudy: (planId, score) => {
        const plan = get().studyPlans.find(p => p.id === planId);
        if (!plan) return;
        if (score >= 60) {
          set({ studyPlans: get().studyPlans.map(p => p.id === planId ? { ...p, status: 'completed', score } : p) });
        } else {
          set({ studyPlans: get().studyPlans.map(p => p.id === planId ? { ...p, status: 'failed', score } : p) });
          get().createSupplementaryStudy(planId);
        }
      },

      createSupplementaryStudy: (planId) => {
        const plan = get().studyPlans.find(p => p.id === planId);
        if (!plan) return;
        const newPlan: StudyPlan = {
          id: genId('STU'),
          subjectId: plan.subjectId,
          subjectName: plan.subjectName,
          title: `[补充学习] ${plan.title}`,
          content: `原考核未通过，请重新学习以下内容：${plan.content}`,
          deadline: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
          status: 'not_started',
          createdAt: new Date().toISOString(),
          supplementary: true,
        };
        set({ studyPlans: [newPlan, ...get().studyPlans] });
      },

      exportSubjectsToCSV: (filters) => {
        let data = get().subjects;
        if (filters?.district) data = data.filter(s => s.district === filters.district);
        if (filters?.status) data = data.filter(s => s.status === filters.status);
        const headers = ['ID', '姓名', '身份证号', '性别', '所属区县', '司法所', '罪名', '判决文号', '矫正类型', '开始日期', '结束日期', '状态', '联系电话', '家属姓名', '家属电话'];
        const rows = data.map(s => [s.id, s.name, s.idCard, s.gender, s.district, s.policeStation, s.charge, s.caseNumber, s.correctionType, s.sentenceStart, s.sentenceEnd, s.status, s.phone, s.familyName, s.familyPhone]);
        return [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
      },

      exportReleaseToCSV: (startDate, endDate, district) => {
        let data = get().subjects.filter(s => {
          const d = new Date(s.sentenceEnd);
          return d >= new Date(startDate) && d <= new Date(endDate) && s.status !== 'released';
        });
        if (district) data = data.filter(s => s.district === district);
        const headers = ['ID', '姓名', '身份证号', '所属区县', '司法所', '罪名', '矫正类型', '解矫日期', '剩余天数'];
        const rows = data.map(s => {
          const daysLeft = Math.max(0, Math.ceil((new Date(s.sentenceEnd).getTime() - Date.now()) / 86400000));
          return [s.id, s.name, s.idCard, s.district, s.policeStation, s.charge, s.correctionType, s.sentenceEnd, daysLeft];
        });
        return [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
      },

      exportReportsToCSV: (date, district) => {
        let data = get().reports;
        if (date) data = data.filter(r => r.date === date);
        if (district) data = data.filter(r => r.district === district);
        const headers = ['日期', '区县', '在矫人数', '违规率(%)', '教育完成率(%)', '逾期报到数', '预警数'];
        const rows = data.map(r => [r.date, r.district, r.activeCount, r.violationRate, r.studyCompletionRate, r.overdueCheckinCount, r.alertCount]);
        return [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
      },

      resetAll: () => {
        const subjects = generateMockSubjects();
        const officers = generateMockOfficers();
        set({
          subjects,
          officers,
          alerts: generateMockAlerts(subjects, officers),
          leaves: generateMockLeaves(subjects),
          checkins: generateMockCheckins(subjects),
          studyPlans: generateMockStudyPlans(subjects),
          reports: generateMockReports(),
        });
      },
    }),
    {
      name: 'sjz-app-storage',
      onRehydrateStorage: () => (state) => {
        if (state) {
          if (state.alerts.length === 0) state.alerts = generateMockAlerts(state.subjects, state.officers);
          if (state.leaves.length === 0) state.leaves = generateMockLeaves(state.subjects);
          if (state.checkins.length === 0) state.checkins = generateMockCheckins(state.subjects);
          if (state.studyPlans.length === 0) state.studyPlans = generateMockStudyPlans(state.subjects);
        }
      },
    }
  )
);
