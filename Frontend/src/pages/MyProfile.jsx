import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { motion } from 'framer-motion';
import {
  User,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Globe,
  DollarSign,
  Award,
  BookOpen,
  Briefcase,
  CreditCard,
  Users,
  Heart,
  Flag,
  TrendingUp,
  CheckCircle,
  Clock,
  Calendar as CalendarIcon,
  Building,
  AtSign,
  Smartphone,
  Home,
  FileText,
  Shield,
  Eye,
  Edit2,
  Save,
  X
} from 'lucide-react';

const MyProfile = () => {
  const { user, updateEmployee, getAttendance, fetchTimeOffRequests } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const [stats, setStats] = useState({
    attendanceRate: 0,
    leaveBalance: 0,
    recentActivity: []
  });

  const [formData, setFormData] = useState({
    personalEmail: '',
    gender: '',
    maritalStatus: '',
    residingAddress: '',
    nationality: '',
    bankDetails: '',
    about: '',
    certifications: '',
    grade: '',
    location: ''
  });

  // Sync formData when user loads
  useEffect(() => {
    if (user) {
      setFormData({
        personalEmail: user.personalEmail || '',
        gender: user.gender || '',
        maritalStatus: user.maritalStatus || '',
        residingAddress: user.residingAddress || '',
        nationality: user.nationality || '',
        bankDetails: user.bankDetails || '',
        about: user.about || '',
        certifications: user.certifications || '',
        grade: user.grade || 'Employee',
        location: user.location || 'Mumbai, India'
      });
    }
  }, [user]);

  useEffect(() => {
    const loadStats = async () => {
      if (!user) return;
      try {
        const now = new Date();
        const attendance = await getAttendance(user.id, now.getFullYear(), now.getMonth() + 1);
        const presentDays = (attendance || []).filter(a => a.status === 'present').length;
        const totalWorkDays = 22;
        const rate = Math.min(100, Math.round((presentDays / totalWorkDays) * 100));

        const requests = await fetchTimeOffRequests();
        const myRequests = (requests || []).filter(r => r.userId === user.id);
        const usedDays = myRequests
          .filter(r => r.status === 'approved')
          .reduce((sum, r) => sum + r.days, 0);
        const balance = Math.max(0, 24 - usedDays);

        const activity = [];
        if (attendance && attendance.length > 0) {
          const last = attendance[attendance.length - 1];
          activity.push({
            icon: <Clock className="w-4 h-4 text-green-600" />,
            bg: 'bg-green-100',
            title: `Shift ${last.status === 'present' ? 'Started' : 'Status'}`,
            time: `${last.date} • ${last.checkIn || 'N/A'}`
          });
        }
        myRequests.slice(0, 2).forEach(r => {
          activity.push({
            icon: <Calendar className="w-4 h-4 text-blue-600" />,
            bg: 'bg-blue-100',
            title: `${r.type.toUpperCase()} Leave ${r.status}`,
            time: `${r.startDate} to ${r.endDate}`
          });
        });

        setStats({
          attendanceRate: rate || 0,
          leaveBalance: balance,
          recentActivity: activity
        });
      } catch (err) {
        console.error("Failed to load profile stats", err);
      }
    };
    loadStats();
  }, [user, getAttendance, fetchTimeOffRequests]);

  const calculateSalaryComponents = (salary) => {
    if (!salary) return { basic: 0, hra: 0, standardAllowance: 0, performanceBonus: 0, leaveTravel: 0, fixedAllowance: 0, pf: 0, professionalTax: 0 };
    const basic = salary * 0.5;
    const hra = basic * 0.5;
    const standardAllowance = 4167;
    const performanceBonus = salary * 0.0833;
    const leaveTravel = salary * 0.05333;
    const pf = salary * 0.12;
    const professionalTax = 200;

    const totalComponents = basic + hra + standardAllowance + performanceBonus + leaveTravel;
    const fixedAllowance = salary - totalComponents;

    return {
      basic: Math.round(basic),
      hra: Math.round(hra),
      standardAllowance,
      performanceBonus: Math.round(performanceBonus),
      leaveTravel: Math.round(leaveTravel),
      fixedAllowance: Math.round(fixedAllowance),
      pf: Math.round(pf),
      professionalTax
    };
  };

  const salaryComponents = calculateSalaryComponents(user?.salary || 0);

  const handleSave = async () => {
    await updateEmployee(user.id, formData);
    setIsEditing(false);
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <Sidebar />
      <Header />

      <main className="lg:ml-64 pt-16 p-4 md:p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header Card */}
          <div className="bg-gradient-to-r from-blue-700 to-indigo-800 rounded-3xl p-8 text-white mb-8 shadow-2xl overflow-hidden relative">
            <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -mr-48 -mt-48 blur-3xl"></div>

            <div className="flex flex-col md:flex-row justify-between items-center gap-8 relative z-10">
              <div className="flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
                <div className="relative group">
                  <div className="w-24 h-24 md:w-32 md:h-32 bg-white/20 rounded-3xl flex items-center justify-center backdrop-blur-xl border-2 border-white/30 shadow-2xl overflow-hidden">
                    {user.profilePicture ? (
                      <img src={user.profilePicture} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-12 h-12 md:w-16 md:h-16 text-white" />
                    )}
                  </div>
                </div>
                <div>
                  <h1 className="text-3xl md:text-5xl font-black tracking-tight">{user.firstName} {user.lastName}</h1>
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mt-3 text-blue-100">
                    <span className="bg-white/20 px-4 py-1.5 rounded-xl text-xs font-bold backdrop-blur-md border border-white/20">
                      {user.loginId}
                    </span>
                    <span className="flex items-center gap-1.5 text-sm font-semibold">
                      <Briefcase className="w-4 h-4" />
                      {formData.grade}
                    </span>
                    <span className="flex items-center gap-1.5 text-sm font-semibold">
                      <MapPin className="w-4 h-4" />
                      {formData.location}
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="flex items-center gap-2 px-8 py-3 bg-white text-blue-800 font-black rounded-2xl transition-all shadow-xl hover:shadow-2xl hover:-translate-y-0.5 active:scale-95"
              >
                {isEditing ? <X className="w-5 h-5" /> : <Edit2 className="w-5 h-5" />}
                {isEditing ? 'Cancel' : 'Edit Profile'}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Stats */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 text-center">
                <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-2">Attendance</p>
                <div className="relative w-32 h-32 mx-auto">
                  <svg className="w-full h-full" viewBox="0 0 36 36">
                    <path className="text-gray-100" strokeWidth="3" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                    <path className="text-green-500" strokeWidth="3" strokeDasharray={`${stats.attendanceRate}, 100`} strokeLinecap="round" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl font-black text-gray-800">{stats.attendanceRate}%</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 bg-blue-50 rounded-2xl">
                    <CalendarIcon className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">Leave Balance</p>
                    <p className="text-xl font-black text-gray-800">{stats.leaveBalance} Days</p>
                  </div>
                </div>
                <div className="w-full bg-gray-50 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${(stats.leaveBalance / 24) * 100}%` }}></div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-indigo-600 to-blue-700 rounded-3xl p-6 shadow-xl text-white">
                <h4 className="font-bold mb-2 flex items-center gap-2">
                  <Award className="w-5 h-5" />
                  Achievements
                </h4>
                <p className="text-sm text-blue-100 leading-relaxed italic">
                  "You've maintained a perfect attendance record for the last 2 weeks! Keep it up."
                </p>
              </div>
            </div>

            {/* Main Details */}
            <div className="lg:col-span-3 space-y-6">
              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-8 py-6 border-b border-gray-50 flex justify-between items-center">
                  <h3 className="font-black text-gray-800 flex items-center gap-3">
                    <User className="w-6 h-6 text-blue-600" />
                    Personal & Career
                  </h3>
                </div>
                <div className="p-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                      <ProfileField label="Employee Grade" value={formData.grade} isEditing={isEditing}
                        onChange={(val) => setFormData({ ...formData, grade: val })} />
                      <ProfileField label="Primary Location" value={formData.location} isEditing={isEditing}
                        onChange={(val) => setFormData({ ...formData, location: val })} />
                      <ProfileField label="Official Email" value={user.email} />
                      <ProfileField label="Personal Email" value={formData.personalEmail} isEditing={isEditing}
                        onChange={(val) => setFormData({ ...formData, personalEmail: val })} type="email" />
                    </div>
                    <div className="space-y-6">
                      <ProfileField label="Gender" value={formData.gender} isEditing={isEditing}
                        onChange={(val) => setFormData({ ...formData, gender: val })} type="select"
                        options={['male', 'female', 'other']} />
                      <ProfileField label="Marital Status" value={formData.maritalStatus} isEditing={isEditing}
                        onChange={(val) => setFormData({ ...formData, maritalStatus: val })} type="select"
                        options={['single', 'married', 'divorced']} />
                      <ProfileField label="Nationality" value={formData.nationality} isEditing={isEditing}
                        onChange={(val) => setFormData({ ...formData, nationality: val })} />
                      <ProfileField label="Joining Date" value={user.joiningDate} />
                    </div>
                    <div className="md:col-span-2">
                      <ProfileField label="Permanent Address" value={formData.residingAddress} isEditing={isEditing}
                        onChange={(val) => setFormData({ ...formData, residingAddress: val })} type="textarea" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Salary & Finance */}
              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-8 py-6 border-b border-gray-50">
                  <h3 className="font-black text-gray-800 flex items-center gap-3">
                    <DollarSign className="w-6 h-6 text-blue-600" />
                    Financial Breakdown
                  </h3>
                </div>
                <div className="p-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4">
                    <SalaryItem label="Basic Pay (50%)" value={salaryComponents.basic} />
                    <SalaryItem label="House Rent Allowance" value={salaryComponents.hra} />
                    <SalaryItem label="Standard Allowances" value={salaryComponents.standardAllowance} />
                    <SalaryItem label="Provident Fund (PF)" value={salaryComponents.pf} isDeduction />

                    <div className="md:col-span-2 mt-4 p-6 bg-blue-50 rounded-3xl flex justify-between items-center border border-blue-100">
                      <div>
                        <p className="text-blue-800 font-black text-xl">Estimated Net Salary</p>
                        <p className="text-blue-600 text-sm font-bold">Monthly Take-home after deductions</p>
                      </div>
                      <p className="text-4xl font-black text-blue-700">₹{(user.salary - salaryComponents.pf - salaryComponents.professionalTax).toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bio Section */}
              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
                <h3 className="font-black text-gray-800 flex items-center gap-3 mb-6">
                  <FileText className="w-6 h-6 text-blue-600" />
                  Bio & Professional Summary
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">About Me</label>
                    {isEditing ? (
                      <textarea value={formData.about} onChange={(e) => setFormData({ ...formData, about: e.target.value })} className="w-full p-4 border-2 border-gray-100 rounded-2xl focus:border-blue-500 outline-none transition-all" rows={4} />
                    ) : (
                      <p className="text-gray-600 leading-relaxed">{formData.about || "No bio added yet. Tell us about yourself!"}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Certifications</label>
                    {isEditing ? (
                      <textarea value={formData.certifications} onChange={(e) => setFormData({ ...formData, certifications: e.target.value })} className="w-full p-4 border-2 border-gray-100 rounded-2xl focus:border-blue-500 outline-none transition-all" rows={4} />
                    ) : (
                      <p className="text-gray-600 leading-relaxed font-medium">{formData.certifications || "List your certifications here."}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Floating Save Button */}
        {isEditing && (
          <motion.div initial={{ y: 100 }} animate={{ y: 0 }} className="fixed bottom-10 right-10 z-50">
            <button onClick={handleSave} className="flex items-center gap-3 px-10 py-5 bg-blue-600 text-white font-black rounded-3xl shadow-2xl hover:bg-blue-700 hover:scale-105 active:scale-95 transition-all">
              <Save className="w-6 h-6" />
              Save Changes
            </button>
          </motion.div>
        )}
      </main>
    </div>
  );
};

const ProfileField = ({ label, value, isEditing, onChange, type = 'text', options = [] }) => (
  <div className="space-y-1.5">
    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{label}</label>
    {isEditing ? (
      type === 'select' ? (
        <select value={value} onChange={(e) => onChange(e.target.value)} className="w-full px-4 py-2.5 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-blue-500 outline-none transition-all capitalize">
          <option value="">Select</option>
          {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
      ) : type === 'textarea' ? (
        <textarea value={value} onChange={(e) => onChange(e.target.value)} className="w-full px-4 py-2.5 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-blue-500 outline-none transition-all" rows={2} />
      ) : (
        <input type={type} value={value} onChange={(e) => onChange(e.target.value)} className="w-full px-4 py-2.5 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-blue-500 outline-none transition-all" />
      )
    ) : (
      <p className="text-gray-800 font-bold capitalize">{value || '—'}</p>
    )}
  </div>
);

const SalaryItem = ({ label, value, isDeduction = false }) => (
  <div className="flex justify-between items-center py-3 border-b border-gray-50">
    <span className="text-sm text-gray-500 font-bold">{label}</span>
    <span className={`font-black ${isDeduction ? 'text-red-500' : 'text-gray-800'}`}>
      {isDeduction ? '-' : ''}₹{value.toLocaleString()}
    </span>
  </div>
);

export default MyProfile;