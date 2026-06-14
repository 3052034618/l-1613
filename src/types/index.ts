export type Gender = '男' | '女';
export type SubjectStatus = 'pending' | 'active' | 'released';
export type LocationPermission = 'normal' | 'expanded' | 'restricted';
export type AlertLevel = 'red' | 'orange' | 'yellow';
export type AlertStatus = 'pending' | 'processing' | 'resolved';
export type ReviewStatus = 'pending' | 'approved' | 'rejected';
export type LeaveStage = 'first' | 'second' | 'completed';
export type CheckinStatus = 'scheduled' | 'completed' | 'overdue';
export type StudyStatus = 'not_started' | 'in_progress' | 'completed' | 'failed';

export interface Subject {
  id: string;
  name: string;
  idCard: string;
  gender: Gender;
  address: string;
  phone: string;
  caseNumber: string;
  charge: string;
  sentenceStart: string;
  sentenceEnd: string;
  correctionType: string;
  status: SubjectStatus;
  locationPermission: LocationPermission;
  createdAt: string;
  district: string;
  policeStation: string;
  familyName: string;
  familyPhone: string;
  fenceCenter: { lat: number; lng: number };
  fenceRadius: number;
  currentLocation: { lat: number; lng: number };
}

export interface ValidationError {
  field: string;
  label: string;
  type: 'missing' | 'mismatch';
  message: string;
}

export interface Officer {
  id: string;
  name: string;
  phone: string;
  station: string;
  district: string;
  location: { lat: number; lng: number };
}

export interface AlertOrder {
  id: string;
  subjectId: string;
  subjectName: string;
  level: AlertLevel;
  location: { lat: number; lng: number };
  fenceDistance: number;
  assignedOfficer: Officer;
  familyNotified: boolean;
  familyNotifyTime?: string;
  status: AlertStatus;
  createdAt: string;
  district: string;
  description: string;
}

export interface ReviewNode {
  status: ReviewStatus;
  reviewer?: string;
  time?: string;
  urged?: boolean;
  comment?: string;
}

export interface LeaveApplication {
  id: string;
  subjectId: string;
  subjectName: string;
  reason: string;
  startDate: string;
  endDate: string;
  destination: string;
  contact: string;
  firstReview: ReviewNode;
  secondReview: ReviewNode;
  submittedAt: string;
  currentStage: LeaveStage;
}

export interface CheckinRecord {
  id: string;
  subjectId: string;
  subjectName: string;
  scheduledDate: string;
  actualDate?: string;
  status: CheckinStatus;
  district: string;
  periodType: 'weekly' | 'monthly';
}

export interface StudyPlan {
  id: string;
  subjectId: string;
  subjectName: string;
  title: string;
  content: string;
  deadline: string;
  status: StudyStatus;
  score?: number;
  createdAt: string;
  supplementary?: boolean;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  answer: number;
}

export interface DailyReport {
  date: string;
  district: string;
  activeCount: number;
  violationRate: number;
  studyCompletionRate: number;
  overdueCheckinCount: number;
  alertCount: number;
}

export const DISTRICTS = ['东城区', '西城区', '朝阳区', '海淀区', '丰台区', '石景山区'];
export const POLICE_STATIONS: Record<string, string[]> = {
  '东城区': ['东华门司法所', '景山司法所', '交道口司法所'],
  '西城区': ['西长安街司法所', '新街口司法所', '月坛司法所'],
  '朝阳区': ['建外司法所', '朝外司法所', '呼家楼司法所'],
  '海淀区': ['中关村司法所', '海淀司法所', '北太平庄司法所'],
  '丰台区': ['右安门司法所', '太平桥司法所', '丰台司法所'],
  '石景山区': ['八宝山司法所', '老山司法所', '八角司法所'],
};
export const CHARGES = ['危险驾驶罪', '盗窃罪', '故意伤害罪', '寻衅滋事罪', '诈骗罪', '交通肇事罪', '聚众斗殴罪', '非法拘禁罪'];
export const CORRECTION_TYPES = ['管制', '缓刑', '假释', '暂予监外执行'];
