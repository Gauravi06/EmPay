import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, Mail, Phone, Calendar, MapPin, Globe, DollarSign, Award,
  BookOpen, Briefcase, CreditCard, Users, Heart, Flag, TrendingUp,
  CheckCircle, Clock, Building, AtSign, Smartphone, Home, FileText, 
  Shield, Eye, Edit2, Save, X, Camera, Star, Target, Key, Lock
} from 'lucide-react';
import toast from 'react-hot-toast';

const MyProfile = () => {
  const { user, updateEmployee, getAttendance, fetchTimeOffRequests, updatePassword } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
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
        const myRequests = (requests || []).filter(r => r.user_id === user.id);
        const usedDays = myRequests
          .filter(r => r.status === 'approved')
          .reduce((sum, r) => sum + r.days, 0);
        const balance = Math.max(0, 24 - usedDays);

        const activity = [];
        if (attendance && attendance.length > 0) {
          const last = attendance[attendance.length - 1];
          activity.push({
            icon: <Clock className="w-4 h-4 text-indigo-600" />,
            bg: 'bg-indigo-50',
            title: `Shift ${last.status === 'present' ? 'Recorded' : 'Status'}`,
            time: `${last.date} • ${last.check_in || 'N/A'}`
          });
        }
        myRequests.slice(0, 2).forEach(r => {
          activity.push({
            icon: <Calendar className="w-4 h-4 text-purple-600" />,
            bg: 'bg-purple-50',
            title: `${r.type.toUpperCase()} Leave ${r.status}`,
            time: `${r.start_date} to ${r.end_date}`
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
    try {
      await updateEmployee(user.id, formData);
      toast.success('Profile updated successfully!');
      setIsEditing(false);
    } catch (e) {
      toast.error('Failed to update profile');
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("New passwords do not match!");
      return;
    }
    if (passwordData.newPassword.length < 8) {
      toast.error("New password must be at least 8 characters!");
      return;
    }
    try {
      const res = await updatePassword(user.loginId, passwordData.oldPassword, passwordData.newPassword);
      if (res.success) {
        toast.success("Password updated successfully!");
        setIsChangingPassword(false);
        setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        toast.error(res.message || "Failed to update password");
      }
    } catch (err) {
      toast.error(err.message || "Something went wrong");
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 1024 * 1024) {
        toast.error("Image size too large. Please use an image under 1MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result;
        try {
          await updateEmployee(user.id, { profile_picture: base64String });
          toast.success("Profile picture updated!");
        } catch (err) {
          toast.error("Failed to update picture");
        }
      };
      reader.readAsDataURL(file);
    }
  };

  if (!user) return null;

  const circumference = 2 * Math.PI * 52;
  const dashOffset = circumference - (stats.attendanceRate / 100) * circumference;

  return (
    <div className="min-h-screen bg-[#F4F6FB] font-sans text-slate-900">
      <Sidebar />
      <div style={{ flex: 1, marginLeft: 240 }}>
        <Header />
        <main style={{ paddingTop: 84, paddingLeft: 32, paddingRight: 32, paddingBottom: 40 }}>
          
          {/* Hero Section — Ultra Premium */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative mb-8 rounded-[2.5rem] overflow-hidden shadow-2xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 p-10 md:p-14"
          >
            {/* Abstract Background Accents */}
            <div className="absolute top-[-100px] right-[-100px] w-[400px] h-[400px] bg-white/5 blur-[100px] rounded-full pointer-events-none" />
            <div className="absolute bottom-[-50px] left-[100px] w-[200px] h-[200px] bg-white/5 blur-[80px] rounded-full pointer-events-none" />

            <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">
              {/* Profile Avatar with Upload */}
              <div className="relative">
                <div className="w-36 h-36 md:w-48 md:h-48 rounded-[2.5rem] bg-white/10 backdrop-blur-2xl border-2 border-white/20 p-2 shadow-2xl group overflow-hidden">
                  <div className="w-full h-full rounded-[2.2rem] overflow-hidden bg-indigo-500/20 flex items-center justify-center">
                    {user.profilePicture || user.profile_picture ? (
                      <img src={user.profilePicture || user.profile_picture} alt="Profile" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                    ) : (
                      <User className="w-20 h-20 text-white/80" />
                    )}
                  </div>
                  <input type="file" id="profile-upload" className="hidden" accept="image/*" onChange={handleImageUpload} />
                  <label htmlFor="profile-upload" className="absolute bottom-3 right-3 p-3 bg-white text-indigo-600 rounded-2xl shadow-xl hover:scale-110 transition-transform cursor-pointer">
                    <Camera className="w-5 h-5" />
                  </label>
                </div>
              </div>

              {/* Identity & Core Info */}
              <div className="flex-1 text-center md:text-left text-white">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-[10px] font-black uppercase tracking-[0.2em] mb-4">
                  {user.role?.replace('_', ' ') || 'Team Member'}
                </div>
                <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-4 leading-tight">
                  {user.firstName} {user.lastName}
                </h1>
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-6 text-indigo-100/70">
                  <span className="flex items-center gap-2 text-sm font-bold"><Shield className="w-4 h-4" /> {user.loginId}</span>
                  <span className="flex items-center gap-2 text-sm font-bold"><Briefcase className="w-4 h-4" /> {formData.grade}</span>
                  <span className="flex items-center gap-2 text-sm font-bold"><MapPin className="w-4 h-4" /> {formData.location}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-4">
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className={`flex items-center justify-center gap-3 px-10 py-4 rounded-[1.8rem] font-black transition-all shadow-xl active:scale-95 min-w-[200px] ${
                    isEditing ? 'bg-rose-500 text-white hover:bg-rose-600' : 'bg-white text-indigo-900 hover:bg-indigo-50'
                  }`}
                >
                  {isEditing ? <X className="w-5 h-5" /> : <Edit2 className="w-5 h-5" />}
                  {isEditing ? 'Cancel' : 'Edit Profile'}
                </button>
                <button
                  onClick={() => setIsChangingPassword(true)}
                  className="flex items-center justify-center gap-3 px-10 py-4 bg-white/10 text-white border border-white/20 rounded-[1.8rem] font-black transition-all hover:bg-white/20 active:scale-95 min-w-[200px] backdrop-blur-md"
                >
                  <Key className="w-5 h-5" /> Security
                </button>
              </div>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            
            {/* Left Column — Stats & Insights */}
            <div className="lg:col-span-1 space-y-8">
              
              {/* Attendance Ring — Integrated from shared code */}
              <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100 text-center">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Attendance Overview</h3>
                <div className="relative w-36 h-36 mx-auto mb-4">
                  <svg width="144" height="144" viewBox="0 0 120 120" className="w-full h-full">
                    <circle cx="60" cy="60" r="52" fill="none" stroke="#F1F5F9" strokeWidth="10" />
                    <circle cx="60" cy="60" r="52" fill="none" stroke="#7C3AED" strokeWidth="10"
                      strokeDasharray={circumference} strokeDashoffset={dashOffset}
                      strokeLinecap="round" transform="rotate(-90 60 60)"
                      className="transition-all duration-1000 ease-out" />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-black text-slate-800 leading-none">{stats.attendanceRate}%</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase mt-1">Monthly</span>
                  </div>
                </div>
              </div>

              {/* Leave Balance — Premium Bar */}
              <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100">
                <div className="flex items-center gap-4 mb-6">
                  <div className="p-3 bg-purple-50 rounded-2xl text-purple-600"><Calendar className="w-5 h-5" /></div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Leave Balance</p>
                    <p className="text-xl font-black text-slate-800">{stats.leaveBalance} Days</p>
                  </div>
                </div>
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${(stats.leaveBalance / 24) * 100}%` }}
                    className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full" 
                  />
                </div>
              </div>

              {/* Achievements — From shared code */}
              <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-[2rem] p-8 text-white relative overflow-hidden shadow-lg shadow-indigo-200">
                <div className="absolute -top-6 -right-6 w-24 h-24 bg-white/10 blur-2xl rounded-full" />
                <div className="flex items-center gap-3 mb-4">
                  <Award className="w-6 h-6 text-amber-300" />
                  <span className="text-sm font-black uppercase tracking-wider">Achievements</span>
                </div>
                <p className="text-sm font-medium leading-relaxed opacity-90 italic">
                  "You've maintained a perfect attendance record for the last 2 weeks! Keep it up."
                </p>
              </div>

              {/* Recent Activity */}
              <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100">
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider mb-6">Recent Activity</h3>
                <div className="space-y-6">
                  {stats.recentActivity.map((act, i) => (
                    <div key={i} className="flex gap-4">
                      <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center flex-shrink-0 text-indigo-600 border border-slate-100">
                        {act.icon}
                      </div>
                      <div>
                        <p className="text-xs font-black text-slate-800">{act.title}</p>
                        <p className="text-[10px] font-bold text-slate-400 mt-0.5">{act.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column — Main Details */}
            <div className="lg:col-span-3 space-y-8">
              
              {/* Personal & Career Details */}
              <div className="bg-white rounded-[2.5rem] p-10 shadow-sm border border-slate-100">
                <div className="flex items-center gap-3 mb-10 pb-6 border-b border-slate-50">
                  <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600"><User className="w-6 h-6" /></div>
                  <h2 className="text-2xl font-black text-slate-800 tracking-tight">Personal & Career</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                  <ProfileField label="Employee Grade" value={formData.grade} isEditing={isEditing} onChange={v => setFormData({...formData, grade: v})} icon={<Star/>} />
                  <ProfileField label="Work Location" value={formData.location} isEditing={isEditing} onChange={v => setFormData({...formData, location: v})} icon={<MapPin/>} />
                  <ProfileField label="Official Email" value={user.email} icon={<Mail/>} />
                  <ProfileField label="Personal Email" value={formData.personalEmail} isEditing={isEditing} onChange={v => setFormData({...formData, personalEmail: v})} type="email" icon={<AtSign/>} />
                  <ProfileField label="Gender" value={formData.gender} isEditing={isEditing} onChange={v => setFormData({...formData, gender: v})} type="select" options={['male', 'female', 'other']} icon={<User/>} />
                  <ProfileField label="Marital Status" value={formData.maritalStatus} isEditing={isEditing} onChange={v => setFormData({...formData, maritalStatus: v})} type="select" options={['single', 'married', 'divorced']} icon={<Heart/>} />
                  <ProfileField label="Nationality" value={formData.nationality} isEditing={isEditing} onChange={v => setFormData({...formData, nationality: v})} icon={<Globe/>} />
                  <ProfileField label="Joining Date" value={user.joiningDate || user.joining_date} icon={<Calendar/>} />
                  <div className="md:col-span-2">
                    <ProfileField label="Permanent Address" value={formData.residingAddress} isEditing={isEditing} onChange={v => setFormData({...formData, residingAddress: v})} type="textarea" icon={<Home/>} />
                  </div>
                </div>
              </div>

              {/* Financial Breakdown Card */}
              <div className="bg-white rounded-[2.5rem] p-10 shadow-sm border border-slate-100">
                <div className="flex items-center gap-3 mb-10 pb-6 border-b border-slate-50">
                  <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600"><DollarSign className="w-6 h-6" /></div>
                  <h2 className="text-2xl font-black text-slate-800 tracking-tight">Financial Breakdown</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-2">
                  <SalaryItem label="Basic Pay (50%)" value={salaryComponents.basic} />
                  <SalaryItem label="House Rent Allowance" value={salaryComponents.hra} />
                  <SalaryItem label="Performance Bonus" value={salaryComponents.performanceBonus} />
                  <SalaryItem label="Provident Fund (PF)" value={salaryComponents.pf} isDeduction />
                </div>
                
                <div className="mt-10 p-10 bg-gradient-to-br from-indigo-600 to-purple-800 rounded-[2rem] flex flex-col md:flex-row justify-between items-center relative overflow-hidden shadow-xl">
                  <div className="absolute inset-0 bg-white/5 pointer-events-none" />
                  <div>
                    <h4 className="text-white font-black text-xl mb-1">Estimated Net Salary</h4>
                    <p className="text-indigo-100/60 text-sm font-medium">Monthly take-home after standard deductions</p>
                  </div>
                  <div className="text-5xl font-black text-white tracking-tighter mt-4 md:mt-0">
                    ₹{(user.salary - salaryComponents.pf - salaryComponents.professionalTax).toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Bio & Professional Summary */}
              <div className="bg-white rounded-[2.5rem] p-10 shadow-sm border border-slate-100">
                <div className="flex items-center gap-3 mb-10 pb-6 border-b border-slate-50">
                  <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600"><FileText className="w-6 h-6" /></div>
                  <h2 className="text-2xl font-black text-slate-800 tracking-tight">Professional Summary</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">About Me</h4>
                    {isEditing ? (
                      <textarea value={formData.about} onChange={e => setFormData({...formData, about: e.target.value})} className="w-full p-6 bg-slate-50 border-2 border-slate-100 rounded-3xl focus:border-indigo-500 outline-none transition-all text-sm font-bold text-slate-700" rows={5} />
                    ) : (
                      <p className="text-slate-600 text-sm leading-relaxed font-medium">{formData.about || "No professional summary added yet."}</p>
                    )}
                  </div>
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Certifications</h4>
                    {isEditing ? (
                      <textarea value={formData.certifications} onChange={e => setFormData({...formData, certifications: e.target.value})} className="w-full p-6 bg-slate-50 border-2 border-slate-100 rounded-3xl focus:border-indigo-500 outline-none transition-all text-sm font-bold text-slate-700" rows={5} placeholder="e.g. AWS Certified, PMP, CFA..." />
                    ) : (
                      <div className="flex flex-wrap gap-3">
                        {formData.certifications ? formData.certifications.split(',').map((c, i) => (
                          <span key={i} className="bg-indigo-50 text-indigo-700 px-4 py-2 rounded-2xl text-xs font-black border border-indigo-100 shadow-sm">{c.trim()}</span>
                        )) : <p className="text-slate-400 text-sm font-medium">No certifications listed.</p>}
                      </div>
                    )}
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Floating Action Bar */}
          <AnimatePresence>
            {isEditing && (
              <motion.div initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }} className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100]">
                <div className="flex items-center gap-4 p-3 bg-white/80 backdrop-blur-2xl border border-white/40 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.2)]">
                  <button onClick={() => setIsEditing(false)} className="px-8 py-3 text-slate-500 font-black hover:text-slate-800 transition-colors">Discard</button>
                  <button onClick={handleSave} className="flex items-center gap-3 px-12 py-4 bg-indigo-600 text-white font-black rounded-[1.8rem] shadow-xl hover:bg-indigo-700 active:scale-95 transition-all">
                    <Save className="w-5 h-5" /> Save Profile
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Password Change Modal */}
          <AnimatePresence>
            {isChangingPassword && (
              <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsChangingPassword(false)} className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm" />
                <motion.div initial={{ scale: 0.9, opacity: 0, y: 30 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 30 }} className="relative bg-white rounded-[3rem] p-12 shadow-2xl w-full max-w-lg border border-slate-100">
                  <div className="flex justify-between items-center mb-10">
                    <div>
                      <h3 className="text-3xl font-black text-slate-800 tracking-tight">Security</h3>
                      <p className="text-slate-400 font-bold mt-1 uppercase tracking-widest text-[10px]">Update Password</p>
                    </div>
                    <button onClick={() => setIsChangingPassword(false)} className="p-4 bg-slate-50 text-slate-400 rounded-3xl hover:text-rose-500 transition-colors">
                      <X className="w-7 h-7" />
                    </button>
                  </div>
                  <form onSubmit={handlePasswordChange} className="space-y-8">
                    <ModalInput label="Current Password" value={passwordData.oldPassword} onChange={v => setPasswordData({...passwordData, oldPassword: v})} icon={<Lock/>} />
                    <ModalInput label="New Password" value={passwordData.newPassword} onChange={v => setPasswordData({...passwordData, newPassword: v})} icon={<Key/>} />
                    <ModalInput label="Confirm New Password" value={passwordData.confirmPassword} onChange={v => setPasswordData({...passwordData, confirmPassword: v})} icon={<Shield/>} />
                    <button type="submit" className="w-full py-6 bg-slate-900 text-white font-black rounded-[2rem] shadow-2xl hover:bg-black transition-all active:scale-95 mt-4 text-lg">Update Now</button>
                  </form>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

        </main>
      </div>
    </div>
  );
};

const ProfileField = ({ label, value, isEditing, onChange, type = 'text', options = [], icon }) => (
  <div className="space-y-2">
    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{label}</label>
    {isEditing ? (
      <div className="relative group">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-400 group-focus-within:text-indigo-600 transition-colors">
          {icon && React.cloneElement(icon, { size: 16 })}
        </div>
        {type === 'select' ? (
          <select value={value} onChange={e => onChange(e.target.value)} className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-500 focus:bg-white outline-none transition-all font-bold text-slate-700 capitalize cursor-pointer">
            <option value="">Select</option>
            {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        ) : type === 'textarea' ? (
          <textarea value={value} onChange={e => onChange(e.target.value)} className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-500 focus:bg-white outline-none transition-all font-bold text-slate-700 min-h-[100px]" rows={2} />
        ) : (
          <input type={type} value={value} onChange={e => onChange(e.target.value)} className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-500 focus:bg-white outline-none transition-all font-bold text-slate-700" />
        )}
      </div>
    ) : (
      <div className="flex items-center gap-4 p-4 bg-slate-50/50 rounded-2xl border border-slate-100 group hover:border-indigo-100 transition-all">
        <div className="text-slate-400 group-hover:text-indigo-500 transition-colors">{icon && React.cloneElement(icon, { size: 16 })}</div>
        <span className="text-sm font-black text-slate-800 capitalize">{value || '—'}</span>
      </div>
    )}
  </div>
);

const SalaryItem = ({ label, value, isDeduction = false }) => (
  <div className="flex justify-between items-center py-4 border-b border-slate-50 hover:bg-slate-50/50 transition-colors px-2 rounded-xl">
    <span className="text-sm font-bold text-slate-500">{label}</span>
    <span className={`text-base font-black ${isDeduction ? 'text-rose-500' : 'text-slate-800'}`}>
      {isDeduction ? '-' : ''}₹{value.toLocaleString()}
    </span>
  </div>
);

const ModalInput = ({ label, value, onChange, icon }) => (
  <div className="space-y-2">
    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{label}</label>
    <div className="relative">
      <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400">{React.cloneElement(icon, { size: 20 })}</div>
      <input 
        type="password" 
        value={value} 
        onChange={e => onChange(e.target.value)} 
        className="w-full pl-14 pr-6 py-5 bg-slate-50 border-2 border-slate-100 rounded-3xl focus:border-indigo-500 focus:bg-white outline-none transition-all font-black text-slate-700 text-lg" 
        placeholder="••••••••"
      />
    </div>
  </div>
);

export default MyProfile;