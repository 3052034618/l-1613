import {
  Subject,
  AlertOrder,
  Officer,
  LeaveApplication,
  CheckinRecord,
  StudyPlan,
  DailyReport,
  DISTRICTS,
  POLICE_STATIONS,
  CHARGES,
  CORRECTION_TYPES,
  QuizQuestion,
  DisposalStep,
  DESTINATION_COORDS,
} from '@/types';

const BASE_LAT = 39.9042;
const BASE_LNG = 116.4074;

const rand = (min: number, max: number) => Math.random() * (max - min) + min;
const randInt = (min: number, max: number) => Math.floor(rand(min, max + 1));
const pick = <T>(arr: T[]) => arr[randInt(0, arr.length - 1)];
const pad = (n: number) => n.toString().padStart(2, '0');
const genId = (prefix: string) => `${prefix}${Date.now()}${Math.floor(Math.random() * 1000)}`;

const SURNAMES = ['张', '王', '李', '赵', '刘', '陈', '杨', '黄', '周', '吴', '徐', '孙', '马', '朱', '胡'];
const GIVEN_NAMES = ['伟', '芳', '娜', '敏', '静', '强', '磊', '军', '洋', '勇', '艳', '杰', '娟', '涛', '明'];

export const generateName = () => pick(SURNAMES) + pick(GIVEN_NAMES) + (Math.random() > 0.5 ? pick(GIVEN_NAMES) : '');

export const generateIdCard = () => {
  const prefix = '11010' + randInt(1, 8);
  const year = randInt(1970, 2002);
  const month = pad(randInt(1, 12));
  const day = pad(randInt(1, 28));
  const suffix = randInt(1000, 9999);
  return `${prefix}${year}${month}${day}${suffix}`;
};

const generatePhone = () => '13' + randInt(100000000, 999999999);

export const generateDate = (daysFromNow: number) => {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return d.toISOString().slice(0, 10);
};

export const generateDateTime = (minutesAgo: number) => {
  const d = new Date();
  d.setMinutes(d.getMinutes() - minutesAgo);
  return d.toISOString();
};

export const generateMockSubjects = (): Subject[] => {
  const subjects: Subject[] = [];
  for (let i = 0; i < 20; i++) {
    const district = pick(DISTRICTS);
    const station = pick(POLICE_STATIONS[district]);
    const centerLat = BASE_LAT + rand(-0.05, 0.05);
    const centerLng = BASE_LNG + rand(-0.05, 0.05);
    const name = generateName();
    const idCard = generateIdCard();
    const caseNumber = `（${randInt(2023, 2025)}）京${pick(['01', '02', '03', '04'])}刑初${randInt(100, 9999)}号`;
    const alertHistory = randInt(0, 15);
    const riskLevel: Subject['riskLevel'] = alertHistory > 8 ? 'high' : alertHistory > 3 ? 'medium' : 'low';
    subjects.push({
      id: `SUB${String(i + 1).padStart(4, '0')}`,
      name,
      idCard,
      gender: Math.random() > 0.35 ? '男' : '女',
      address: `${district}${pick(['XX街道', 'XX路', 'XX胡同'])}${randInt(1, 200)}号`,
      phone: generatePhone(),
      // 文书录入字段（90%概率一致，10%概率故意不一致用于演示）
      docName: Math.random() > 0.1 ? name : pick(SURNAMES) + pick(GIVEN_NAMES),
      docIdCard: Math.random() > 0.1 ? idCard : generateIdCard(),
      docCaseNumber: Math.random() > 0.1 ? caseNumber : `（${randInt(2023, 2025)}）京${pick(['01', '02'])}刑初${randInt(100, 9999)}号`,
      crossCheckPassed: true,
      crossCheckErrors: [],
      caseNumber,
      charge: pick(CHARGES),
      sentenceStart: generateDate(-randInt(30, 300)),
      sentenceEnd: generateDate(randInt(60, 600)),
      correctionType: pick(CORRECTION_TYPES),
      status: i < 17 ? 'active' : i < 19 ? 'pending' : 'released',
      locationPermission: pick(['normal', 'normal', 'normal', 'normal', 'expanded', 'restricted'] as const),
      rightsSuspended: Math.random() > 0.85,
      rightsSuspendReason: Math.random() > 0.85 ? '多次逾期未报到' : undefined,
      rightsSuspendTime: Math.random() > 0.85 ? generateDateTime(randInt(60, 5000)) : undefined,
      createdAt: generateDateTime(randInt(1000, 50000)),
      district,
      policeStation: station,
      familyName: pick(SURNAMES) + pick(GIVEN_NAMES),
      familyPhone: generatePhone(),
      fenceCenter: { lat: centerLat, lng: centerLng },
      fenceRadius: rand(2000, 5000),
      currentLocation: {
        lat: centerLat + rand(-0.015, 0.015),
        lng: centerLng + rand(-0.015, 0.015),
      },
      riskLevel,
      alertHistoryCount: alertHistory,
    });
  }
  return subjects;
};

export const generateMockOfficers = (): Officer[] => {
  const officers: Officer[] = [];
  let id = 1;
  for (const district of DISTRICTS) {
    for (const station of POLICE_STATIONS[district]) {
      for (let i = 0; i < 2; i++) {
        officers.push({
          id: `OFF${String(id++).padStart(4, '0')}`,
          name: pick(SURNAMES) + pick(GIVEN_NAMES) + (i === 0 ? pick(GIVEN_NAMES) : ''),
          phone: generatePhone(),
          station,
          district,
          location: {
            lat: BASE_LAT + rand(-0.06, 0.06),
            lng: BASE_LNG + rand(-0.06, 0.06),
          },
        });
      }
    }
  }
  return officers;
};

const calcDistance = (a: { lat: number; lng: number }, b: { lat: number; lng: number }) => {
  const R = 6371000;
  const dLat = (b.lat - a.lat) * Math.PI / 180;
  const dLng = (b.lng - a.lng) * Math.PI / 180;
  const la1 = a.lat * Math.PI / 180;
  const la2 = b.lat * Math.PI / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
};

export const findNearestOfficer = (location: { lat: number; lng: number }, officers: Officer[], district?: string): Officer => {
  const list = district ? officers.filter(o => o.district === district) : officers;
  return list.reduce((nearest, o) =>
    calcDistance(location, o.location) < calcDistance(location, nearest.location) ? o : nearest
    , list[0]);
};

const OFFICER_NAMES = ['李警官', '王警官', '赵警官', '张警官', '刘警官', '陈警官'];

export const generateMockAlerts = (subjects: Subject[], officers: Officer[]): AlertOrder[] => {
  const alerts: AlertOrder[] = [];
  const activeSubjects = subjects.filter(s => s.status === 'active');
  for (let i = 0; i < 10; i++) {
    const subject = activeSubjects[i % activeSubjects.length];
    const outside = true;
    const distance = outside ? rand(100, 900) : 100;
    const angle = rand(0, Math.PI * 2);
    const alertLoc = {
      lat: subject.fenceCenter.lat + ((subject.fenceRadius + distance) / 111320) * Math.cos(angle),
      lng: subject.fenceCenter.lng + ((subject.fenceRadius + distance) / (111320 * Math.cos(subject.fenceCenter.lat * Math.PI / 180))) * Math.sin(angle),
    };
    const level: 'red' | 'orange' | 'yellow' = distance > 500 ? 'red' : distance > 200 ? 'orange' : 'yellow';
    const officer = findNearestOfficer(alertLoc, officers, subject.district);
    const createdAgo = randInt(5, 1200);
    const createdAt = generateDateTime(createdAgo);
    const stages: AlertOrder['status'][] = ['pending', 'accepted', 'processing', 'contacted', 'family_replied', 'resolved'];
    const stageIdx = Math.min(i, 5);
    const status = stages[stageIdx];
    const disposalSteps: DisposalStep[] = [];
    const op = pick(OFFICER_NAMES);
    if (stageIdx >= 1) disposalSteps.push({ step: 'accept', time: generateDateTime(createdAgo - randInt(1, 5)), operator: op, content: `${officer.name}已接单，正前往现场核实情况` });
    if (stageIdx >= 2) disposalSteps.push({ step: 'contact_subject', time: generateDateTime(createdAgo - randInt(10, 20)), operator: op, content: `电话联系${subject.name}，其表示正在处理私事，将立即返回` });
    if (stageIdx >= 3) disposalSteps.push({ step: 'family_reply', time: generateDateTime(createdAgo - randInt(20, 40)), operator: op, content: `家属确认已知晓情况，承诺协助督促其返回` });
    if (stageIdx >= 4) disposalSteps.push({ step: 'onsite', time: generateDateTime(createdAgo - randInt(40, 80)), operator: op, content: '现场核实完毕，已对其进行口头警告教育' });
    if (stageIdx >= 5) disposalSteps.push({ step: 'resolve', time: generateDateTime(createdAgo - randInt(80, 120)), operator: op, content: subject.name + '已返回电子围栏范围，预警解除，记入监管档案' });

    alerts.push({
      id: `ALT${String(i + 1).padStart(4, '0')}`,
      subjectId: subject.id,
      subjectName: subject.name,
      level,
      location: alertLoc,
      fenceDistance: Math.round(distance),
      assignedOfficer: officer,
      familyNotified: stageIdx >= 3,
      familyNotifyTime: stageIdx >= 3 ? generateDateTime(createdAgo - randInt(1, 10)) : undefined,
      status,
      disposalSteps,
      subjectContacted: stageIdx >= 2,
      subjectContactTime: stageIdx >= 2 ? generateDateTime(createdAgo - randInt(5, 15)) : undefined,
      subjectContactNote: stageIdx >= 2 ? '已接听电话，语气平稳' : undefined,
      familyReply: stageIdx >= 3 ? '家属已知晓，感谢告知，会督促其返回' : undefined,
      familyReplyTime: stageIdx >= 3 ? generateDateTime(createdAgo - randInt(15, 30)) : undefined,
      onsiteResult: stageIdx >= 4 ? '现场核实其位置，已进行批评教育，责令立即返回' : undefined,
      onsiteTime: stageIdx >= 4 ? generateDateTime(createdAgo - randInt(30, 60)) : undefined,
      finalResult: stageIdx >= 5 ? '已返回监管范围，予以结案，本次计入年度考核' : undefined,
      createdAt,
      district: subject.district,
      description: `${subject.name}越出电子围栏${Math.round(distance)}米（${level === 'red' ? '红色' : level === 'orange' ? '橙色' : '黄色'}预警）`,
    });
  }
  return alerts;
};

export const generateMockLeaves = (subjects: Subject[]): LeaveApplication[] => {
  const leaves: LeaveApplication[] = [];
  const activeSubjects = subjects.filter(s => s.status === 'active');
  const stages: LeaveApplication['currentStage'][] = ['first', 'second', 'completed', 'completed', 'vacation', 'returned'];
  for (let i = 0; i < 8; i++) {
    const subject = activeSubjects[i % activeSubjects.length];
    const stage = stages[i % stages.length];
    const firstApproved = stage !== 'first';
    const secondApproved = ['completed', 'vacation', 'returned'].includes(stage);
    const submittedAt = generateDateTime(randInt(60, 4320));
    const destKey = Object.keys(DESTINATION_COORDS)[i % Object.keys(DESTINATION_COORDS).length];
    const destCoord = DESTINATION_COORDS[destKey];
    const urgeHistory: LeaveApplication['urgeHistory'] = [];
    let firstUrged = false; let secondUrged = false;
    if (stage === 'first' && Math.random() > 0.4) {
      firstUrged = true;
      urgeHistory.push({ stage: 'first', time: generateDateTime(randInt(50, 120)), count: 1 });
    }
    if (stage === 'second' && Math.random() > 0.5) {
      secondUrged = true;
      urgeHistory.push({ stage: 'second', time: generateDateTime(randInt(40, 100)), count: 1 });
    }
    leaves.push({
      id: `LEA${String(i + 1).padStart(4, '0')}`,
      subjectId: subject.id,
      subjectName: subject.name,
      reason: pick(['家属生病需探望', '回老家处理事务', '外出就医', '参加婚丧嫁娶', '办理个人事务']),
      startDate: generateDate(randInt(0, 5)),
      endDate: generateDate(randInt(5, 15)),
      destination: destKey,
      destinationLat: destCoord.lat,
      destinationLng: destCoord.lng,
      contact: generatePhone(),
      firstReview: {
        status: firstApproved ? (Math.random() > 0.05 ? 'approved' : 'rejected') : 'pending',
        reviewer: firstApproved ? pick(OFFICER_NAMES) : undefined,
        time: firstApproved ? generateDateTime(randInt(50, 200)) : undefined,
        urged: firstUrged,
        urgedCount: firstUrged ? 1 : 0,
        urgedTime: firstUrged ? urgeHistory[0]?.time : undefined,
        comment: firstApproved ? (Math.random() > 0.5 ? '情况属实，同意报送。' : '材料齐全，同意。') : undefined,
      },
      secondReview: {
        status: secondApproved ? (Math.random() > 0.05 ? 'approved' : 'rejected') : stage === 'second' ? 'pending' : firstApproved ? 'pending' : 'rejected',
        reviewer: secondApproved ? pick(['张主任', '刘主任', '陈主任']) : undefined,
        time: secondApproved ? generateDateTime(randInt(30, 120)) : undefined,
        urged: secondUrged,
        urgedCount: secondUrged ? 1 : 0,
        urgedTime: secondUrged ? (urgeHistory[urgeHistory.length - 1]?.time) : undefined,
        comment: secondApproved ? (Math.random() > 0.5 ? '审批通过，请注意定位监控。' : '同意，到期按时返回。') : undefined,
      },
      submittedAt,
      currentStage: stage,
      returnedAt: stage === 'returned' ? generateDateTime(randInt(5, 50)) : undefined,
      returnNote: stage === 'returned' ? (Math.random() > 0.3 ? '已按规定时间返回，销假成功，定位权限已恢复正常。' : undefined) : undefined,
      urgeHistory,
    });
  }
  return leaves;
};

export const generateMockCheckins = (subjects: Subject[]): CheckinRecord[] => {
  const records: CheckinRecord[] = [];
  const activeSubjects = subjects.filter(s => s.status === 'active');
  for (let i = 0; i < 40; i++) {
    const subject = activeSubjects[i % activeSubjects.length];
    const daysAgo = randInt(-5, 15);
    const scheduled = generateDate(daysAgo);
    let actual: string | undefined;
    let status: CheckinRecord['status'] = 'scheduled';
    let note: string | undefined;
    if (daysAgo < -2) {
      if (Math.random() > 0.3) {
        actual = generateDate(daysAgo + randInt(0, 2));
        status = 'completed';
      } else {
        status = 'overdue';
      }
    } else if (daysAgo >= 0) {
      status = 'scheduled';
    } else {
      if (Math.random() > 0.25) {
        actual = scheduled;
        status = 'completed';
      } else {
        status = 'overdue';
      }
    }
    records.push({
      id: `CHK${String(i + 1).padStart(4, '0')}`,
      subjectId: subject.id,
      subjectName: subject.name,
      scheduledDate: scheduled,
      actualDate: actual,
      status,
      district: subject.district,
      periodType: Math.random() > 0.3 ? 'weekly' : 'monthly',
      rightsChangeNote: note,
    });
  }
  return records;
};

export const generateMockStudyPlans = (subjects: Subject[]): StudyPlan[] => {
  const plans: StudyPlan[] = [];
  const titles = [
    { title: '社区矫正法律法规学习', content: '学习《社区矫正法》及其实施办法相关条款' },
    { title: '公民道德与法治教育', content: '学习社会主义核心价值观，提升法治素养' },
    { title: '心理健康辅导课程', content: '心理调适方法与情绪管理技巧学习' },
    { title: '职业技能培训', content: '基础职业技能培训，提升再就业能力' },
    { title: '社会责任感教育', content: '公益活动参与与社会责任感培养' },
  ];
  const activeSubjects = subjects.filter(s => s.status === 'active');
  for (let i = 0; i < 30; i++) {
    const subject = activeSubjects[i % activeSubjects.length];
    const t = titles[i % titles.length];
    const score = Math.random() > 0.3 ? randInt(60, 100) : randInt(30, 59);
    const status: StudyPlan['status'] = i < 5 ? 'not_started' : i < 14 ? 'in_progress' : score >= 60 ? 'completed' : 'failed';
    plans.push({
      id: `STU${String(i + 1).padStart(4, '0')}`,
      subjectId: subject.id,
      subjectName: subject.name,
      title: t.title,
      content: t.content,
      deadline: generateDate(randInt(-20, 40)),
      status,
      score: status === 'completed' || status === 'failed' ? score : undefined,
      createdAt: generateDate(-randInt(1, 50)),
      supplementary: status === 'failed',
    });
  }
  return plans;
};

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  { id: 'Q1', question: '根据《社区矫正法》，社区矫正对象应当在判决生效之日起几日内到执行地社区矫正机构报到？', options: ['5日', '10日', '15日', '30日'], answer: 1 },
  { id: 'Q2', question: '社区矫正对象未经批准不得离开所居住的哪个行政区域？', options: ['乡、镇', '县、市、旗', '设区的市', '省、自治区'], answer: 1 },
  { id: 'Q3', question: '社区矫正对象每月参加教育学习时间不少于多少小时？', options: ['4小时', '8小时', '12小时', '16小时'], answer: 1 },
  { id: 'Q4', question: '下列哪一项不属于社区矫正的基本内容？', options: ['监督管理', '教育帮扶', '强制劳动', '适应性帮扶'], answer: 2 },
  { id: 'Q5', question: '社区矫正机构对社区矫正对象给予警告的，应当报哪一级批准？', options: ['县级司法行政部门', '市级司法行政部门', '省级司法行政部门', '司法所'], answer: 0 },
];

export const generateMockReports = (): DailyReport[] => {
  const reports: DailyReport[] = [];
  for (let d = 0; d < 7; d++) {
    const date = generateDate(-d);
    for (const district of DISTRICTS) {
      reports.push({
        date,
        district,
        activeCount: randInt(80, 200),
        violationRate: Number(rand(0.5, 5.2).toFixed(2)),
        studyCompletionRate: Number(rand(75, 98).toFixed(1)),
        overdueCheckinCount: randInt(0, 8),
        alertCount: randInt(0, 5),
      });
    }
  }
  return reports;
};

export { genId };
