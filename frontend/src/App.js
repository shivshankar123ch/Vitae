import Register from './components/Register';
import Login from './components/Login';
import Registerr from './components/Registerr';
import Loginn from './components/Loginn';
import Home from './components/JobExplorerHome';
import JobDetailsPage from './components/JobDetailsPage';
// import RecForm from './components/RecForm';

import Layout from './components/Layout';
import Stu_Profile from './components/Stu_Profile';
import Profile from './components/Stu_profile_update/Profile';
import JobUpdate from './components/Recruiter_Job_update/Job_update';
import JobCreate from './components/Recruiter_Job_update/Walk_in_drive_Job_update';
import RecruiterInboxMsg from './components/Recruiter_Job_update/Recruiter_Inbox_Msg';
import RecruiterSettings from './components/Recruiter_Job_update/RecruiterSettings';
import Skill from './components/Stu_profile_update/Skill';
// import description from './components/Stu_profile_update/description';
import Editor from './components/Editor';
import Admin from './components/Admin';
import Missing from './components/Missing';
import Unauthorized from './components/Unauthorized';
import Lounge from './components/Lounge';
import LinkPage from './components/LinkPage';
import RequireAuth from './components/RequireAuth';
import { Routes, Route } from 'react-router-dom';
import Inbox from './JobInbox/Inbox';
import OtpGate from './components/OtpGate';



const ROLES = {
  'User': 2001,
  'Editor': 1984,
  'Admin': 5150
}

function App() {

  return (
    <OtpGate>
      <Routes>
        <Route path="/" element={<Layout />}>

         {/* Default page */}
        <Route index element={<LinkPage />} />
        
        {/* public routes */}
        {/* <Route path="linkpage" element={<LinkPage />} /> */}
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />

         {/* <Route path="r_login" element={<loginn />} /> */}
         <Route path="r_login" element={<Loginn />} />
        <Route path="r_register" element={<Registerr />} />
        <Route path="unauthorized" element={<Unauthorized />} />
        <Route path="Stu_Profile" element={<Stu_Profile />} />
        <Route path="Profile" element={<Profile />} />
         <Route path="Skill" element={<Skill />} />
         <Route path="description" element={<description/>} />


        {/* we want to protect these routes */}
        <Route element={<RequireAuth allowedRoles={[ROLES.User]} />}>
          <Route path="/" element={<Home />} />
          <Route path="job-details/:jobId" element={<JobDetailsPage />} />
        </Route>

        <Route element={<RequireAuth allowedRoles={[ROLES.Editor]} />}>
          <Route path="editor" element={<Editor />} />
        </Route>


        <Route element={<RequireAuth allowedRoles={[ROLES.Admin]} />}>
          <Route path="admin" element={<Admin />} />
        </Route>

        <Route element={<RequireAuth allowedRoles={[ROLES.Editor, ROLES.Admin]} />}>
          <Route path="lounge" element={<Lounge />} />
        </Route>

        {/* catch all */}
        <Route path="Home" element={<Home />} />
        
        </Route>
         
          <Route path="Job_update" element={<JobUpdate />} />
          <Route path="JobCreate" element={<JobCreate />} />

           <Route path="Recruiter_Inbox_Msg" element={< RecruiterInboxMsg/>} />
           <Route path="settings" element={<RecruiterSettings />} />
          <Route path="Job_inbox" element={<Inbox />} />
          <Route path="/otp-verify" element={null} />
          
      </Routes>
    </OtpGate>
  );
}



export default App;