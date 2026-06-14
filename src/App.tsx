import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from '@/components/Layout';
import Home from '@/pages/Home';
import IntakeReview from '@/pages/IntakeReview';
import LocationAlert from '@/pages/LocationAlert';
import CheckinMgmt from '@/pages/CheckinMgmt';
import StudyExam from '@/pages/StudyExam';
import LeaveApproval from '@/pages/LeaveApproval';
import ReleaseAssessment from '@/pages/ReleaseAssessment';
import DailyReport from '@/pages/DailyReport';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="/intake" element={<IntakeReview />} />
          <Route path="/location" element={<LocationAlert />} />
          <Route path="/checkin" element={<CheckinMgmt />} />
          <Route path="/study" element={<StudyExam />} />
          <Route path="/leave" element={<LeaveApproval />} />
          <Route path="/release" element={<ReleaseAssessment />} />
          <Route path="/report" element={<DailyReport />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
