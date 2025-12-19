import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LoginForm from './component/user/auth/Login';
import RegisterForm from './component/user/auth/Register';
import Dashboard from './component/user/dashboard/Dashboard';
import Profile from './component/user/profile/Profile';
import Messages from './component/user/messages/Messages';
import MyServices from './component/user/services/My_Service';
import FindServices from './component/user/services/Find_Service';
import Saved from './component/user/transactions/Saved';
import Wallet from './component/user/transactions/Wallet';
import Transaction from './component/user/transactions/Transaction';
import Feedback from './component/user/services/Feedback';
import ViewPastFeedback from './component/user/feedback/View_Past_Feedback';
import Notifications from './component/user/dashboard/Notifications';
import Admin_Dashboard from './component/admin/admin_dashboard/Admin_Dashboard';
import Announcement from './component/admin/announcement/Announcement';
import User_Report from './component/admin/reports/User_Report';
import Wallet_Log from './component/admin/wallet_log/Wallet_Log';
import AccountVerification from './component/admin/verification/AccountVerification';
import Convo from './component/user/messages/Convo';
import ForgotPassword from './component/user/auth/ForgotPassword';
import AdminMessages from "./component/admin/admin_messages/AdminMessages";
import ProviderProfile from './component/user/profile/Provider_Profile';



function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginForm />} />
        <Route path="/register" element={<RegisterForm />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/messages" element={<Messages />} />
        <Route path="/my-classes" element={<MyServices />} />
        <Route path="/find-classes" element={<FindServices />} />
        <Route path="/saved" element={<Saved />} />
        <Route path="/wallet" element={<Wallet />} />
        <Route path="/transactions" element={<Transaction />} />
        <Route path="/feedback" element={<Feedback />} />
        <Route path="/view-past-feedback" element={<ViewPastFeedback />} />
        <Route path="/rate-service" element={<Feedback />} />
        <Route path="/notification" element={<Notifications />} />
        <Route path="/admin-dashboard" element={<Admin_Dashboard />} />
        <Route path="/announcements" element={<Announcement />} />
        <Route path="/user-reports" element={<User_Report />} />
        <Route path="/wallet-logs" element={<Wallet_Log />} />
        <Route path="/account-verification" element={<AccountVerification />} />
        <Route path="/messages/chat/:userId" element={<Convo />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/admin-messages" element={<AdminMessages />} />
        <Route path="/provider-profile/:userId" element={<ProviderProfile />} />
      </Routes>
    </Router>
  );
}

export default App;
