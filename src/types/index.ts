export type Gender = '男' | '女';
export type SubjectStatus = 'pending' | 'active' | 'released';
export type LocationPermission = 'normal' | 'expanded' | 'restricted';
export type AlertLevel = 'red' | 'orange' | 'yellow';
export type AlertStatus = 'pending' | 'accepted' | 'processing' | 'contacted' | 'family_replied' | 'resolved';
export type ReviewStatus = 'pending' | 'approved' | 'rejected';
export type LeaveStage = 'first' | 'second' | 'completed' | 'vacation' | 'returned';
export type CheckinStatus = 'scheduled' | 'completed' | 'overdue';
export type StudyStatus = 'not_started' | 'in_progress' | 'completed' | 'failed';
export type ExportType = 'daily_report' | 'release_list' | 'subject_list' | 'assessment';

export interface Subject {
  id: string;
  name: string;
  idCard: string;
  gender: Gender;
  address: string;
  phone: string;
  // 法律文书中录入的信息（用于比对）
  docName: string;
  docIdCard: string;
  docCaseNumber: string;
  // 比对结果
  crossCheckPassed: boolean;
  crossCheckErrors: string[];
  caseNumber: string;
  charge: string;
  sentenceStart: string;
  sentenceEnd: string;
  correctionType: string;
  status: SubjectStatus;
  locationPermission: LocationPermission;
  rightsSuspended: boolean;
  rightsSuspendReason?: string;
  rightsSuspendTime?: string;
  createdAt: string;
  district: string;
  policeStation: string;
  familyName: string;
  familyPhone: string;
  fenceCenter: { lat: number; lng: number };
  fenceRadius: number;
  // 临时围栏（请假时生成）
  tempFence?: {
    destination: string;
    center: { lat: number; lng: number };
    radius: number;
    startDate: string;
    endDate: string;
    leaveId: string;
    active: boolean;
  };
  currentLocation: { lat: number; lng: number };
  // 当前风险等级
  riskLevel: 'high' | 'medium' | 'low';
  alertHistoryCount: number;
}

export interface ValidationError {
  field: string;
  label: string;
  type: 'missing' | 'mismatch' | 'cross_check';
  message: string;
  identityValue?: string;
  legalValue?: string;
}

export interface Officer {
  id: string;
  name: string;
  phone: string;
  station: string;
  district: string;
  location: { lat: number; lng: number };
}

export interface DisposalStep {
  step: 'accept' | 'contact_subject' | 'family_reply' | 'onsite' | 'resolve';
  time: string;
  operator: string;
  content: string;
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
  disposalSteps: DisposalStep[];
  subjectContacted?: boolean;
  subjectContactTime?: string;
  subjectContactNote?: string;
  familyReply?: string;
  familyReplyTime?: string;
  onsiteResult?: string;
  onsiteTime?: string;
  finalResult?: string;
  createdAt: string;
  district: string;
  description: string;
}

export interface ReviewNode {
  status: ReviewStatus;
  reviewer?: string;
  time?: string;
  urged?: boolean;
  urgedTime?: string;
  urgedCount?: number;
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
  destinationLat?: number;
  destinationLng?: number;
  contact: string;
  firstReview: ReviewNode;
  secondReview: ReviewNode;
  submittedAt: string;
  currentStage: LeaveStage;
  returnedAt?: string;
  returnNote?: string;
  urgeHistory: { stage: LeaveStage; time: string; count: number }[];
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
  rightsChangeNote?: string;
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

export interface DailyReport {
  date: string;
  district: string;
  activeCount: number;
  violationRate: number;
  studyCompletionRate: number;
  overdueCheckinCount: number;
  alertCount: number;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  answer: number;
}

export interface ExportRecord {
  id: string;
  type: ExportType;
  typeName: string;
  filters: Record<string, string>;
  filterDisplay: string;
  fileName: string;
  recordCount: number;
  exportedAt: string;
  operator: string;
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
export const DESTINATION_COORDS: Record<string, { lat: number; lng: number }> = {
  '河北省保定市': { lat: 38.8671, lng: 115.4646 },
  '山东省济南市': { lat: 36.6512, lng: 117.1201 },
  '河南省郑州市': { lat: 34.7466, lng: 113.6254 },
  '天津市': { lat: 39.3434, lng: 117.3616 },
  '江苏省南京市': { lat: 32.0603, lng: 118.7969 },
  '河北省石家庄市': { lat: 38.0428, lng: 114.5149 },
  '山西省太原市': { lat: 37.8706, lng: 112.5489 },
  '辽宁省沈阳市': { lat: 41.8057, lng: 123.4315 },
};
