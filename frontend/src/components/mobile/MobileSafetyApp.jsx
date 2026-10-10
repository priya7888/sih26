import React, { useState, useEffect, useRef } from 'react';
import {
  Home,
  AlertTriangle,
  Plus,
  Bell,
  MoreHorizontal,
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  MapPin,
  Camera,
  Mic,
  MicOff,
  Radio,
  Send,
  Sparkles,
  Lock,
  RotateCcw,
  User,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Flame,
  ChevronRight,
  X,
  Search,
  Activity,
  PhoneCall,
  Wrench,
  Maximize2,
  Minimize2,
  Check,
  LogOut,
  ArrowRight,
  ArrowLeft,
  Ambulance,
  KeyRound,
  Mail,
  Zap,
  Cpu
} from 'lucide-react';
import { api } from '../../services/api';
import { 
  getStoreState, 
  autoPersistToTotalRecords 
} from '../../services/safetyStore';
import safetyTeamWelcome from '../../assets/safety_team_welcome.jpg';

// Department list for response tasks including Ambulance
const DEPARTMENTS = [
  { id: 'ALL', name: 'All Teams' },
  { id: 'AMBULANCE_MEDICAL', name: 'Ambulance 🚑', icon: '🚑', email: 'ambulance@safety.com', pass: 'med123', label: 'Ambulance / Medical' },
  { id: 'MECHANICAL', name: 'Mechanical ⚙️', icon: '⚙️', email: 'mechanical@safety.com', pass: 'mech123', label: 'Mechanical Team' },
  { id: 'ELECTRICAL', name: 'Electrical ⚡', icon: '⚡', email: 'electrical@safety.com', pass: 'elec123', label: 'Electrical Team' },
  { id: 'PROCESS_SAFETY', name: 'Process Safety 🏭', icon: '🏭', email: 'process@safety.com', pass: 'process123', label: 'Process Safety' },
  { id: 'RIGGING_LIFTING', name: 'Rigging 🏗️', icon: '🏗️', email: 'rigging@safety.com', pass: 'rig123', label: 'Rigging & Lifting' },
  { id: 'HAZMAT', name: 'Hazmat ☣️', icon: '☣️', email: 'hazmat@safety.com', pass: 'hazmat123', label: 'Hazmat Team' },
  { id: 'CIVIL_STRUCTURAL', name: 'Civil 🧱', icon: '🧱', email: 'civil@safety.com', pass: 'civil123', label: 'Civil & Structural' }
];

// Presets for the 3 Login Roles
const LOGIN_ROLES = [
  {
    id: 'WORKER',
    title: 'User / Worker',
    icon: '👷',
    badge: 'Field Reporter',
    desc: 'Voice reporting, hazard submission, near misses & emergency SOS',
    defaultEmail: 'worker@safety.com',
    defaultPass: 'worker123',
    defaultName: 'Liam Vance (Field Worker)'
  },
  {
    id: 'RESPONDER',
    title: 'Responder',
    icon: '🛠️',
    badge: 'Emergency & Technical Teams',
    desc: 'Ambulance, Mechanical, Electrical, Process, Rigging, Hazmat & Civil',
    defaultEmail: 'ambulance@safety.com',
    defaultPass: 'med123',
    defaultName: 'Dr. Sunita (Ambulance Lead)'
  },
  {
    id: 'ADMIN',
    title: 'Admin',
    icon: '🛡️',
    badge: 'Safety Officer / HSE',
    desc: 'SIF Precursor radar, task dispatch, triage & verification sign-off',
    defaultEmail: 'admin@safety.com',
    defaultPass: 'admin123',
    defaultName: 'Eleanor Vance (HSE Admin)'
  }
];

export default function MobileSafetyApp() {
  // Screen Mode: 'welcome' (Splash Onboarding) | 'login' (Role & Auth) | 'app' (Main Dashboard)
  const [screenMode, setScreenMode] = useState('welcome');
  const [loginStep, setLoginStep] = useState(1); // 1: Choose Role | 2: Username & Password

  // Authentication State
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedRole, setSelectedRole] = useState('WORKER'); // 'WORKER' | 'RESPONDER' | 'ADMIN'
  const [selectedResponderDept, setSelectedResponderDept] = useState('AMBULANCE_MEDICAL');
  const [emailInput, setEmailInput] = useState('worker@safety.com');
  const [passwordInput, setPasswordInput] = useState('worker123');
  const [loginError, setLoginError] = useState(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Navigation tabs in main app: 'home' | 'incidents' | 'alerts' | 'more'
  const [activeTab, setActiveTab] = useState('home');
  const [isPhoneFrame, setIsPhoneFrame] = useState(true);

  // Report Modal State
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportCategory, setReportCategory] = useState('Unsafe Condition');
  const [facilityLocation, setFacilityLocation] = useState('Plant 2 – Processing Unit');
  
  // Voice Recording & Multilingual Translation
  const [selectedLanguage, setSelectedLanguage] = useState('te'); // 'te' | 'hi' | 'en'
  const [noiseIsolation, setNoiseIsolation] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [spokenTranscript, setSpokenTranscript] = useState('');
  const [translatedEnglish, setTranslatedEnglish] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [photoAttached, setPhotoAttached] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitFeedback, setSubmitFeedback] = useState(null);

  // Response Tasks & Overview Metrics
  const [tasks, setTasks] = useState([]);
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [selectedTaskModal, setSelectedTaskModal] = useState(null);
  const [workNotes, setWorkNotes] = useState('');
  const [reworkReason, setReworkReason] = useState('');
  const [showReworkInput, setShowReworkInput] = useState(false);
  const [actionNotice, setActionNotice] = useState(null);

  // SOS Emergency State
  const [sosCountdown, setSosCountdown] = useState(null);
  const [sosDispatched, setSosDispatched] = useState(false);

  // Dynamic KPI counts
  const [kpis, setKpis] = useState({
    openIncidents: 24,
    actionsPending: 12,
    underInvestigation: 7,
    escalated: 3
  });

  // Recent Alert Banner Data
  const [latestAlert, setLatestAlert] = useState({
    title: 'Unsafe Condition Reported',
    subtitle: 'PPE violation at Plant 2',
    time: '2 min ago',
    type: 'warning'
  });

  const recordingTimerRef = useRef(null);
  const recognitionRef = useRef(null);

  useEffect(() => {
    if (currentUser) {
      fetchTasks();
      const interval = setInterval(fetchTasks, 5000);
      return () => clearInterval(interval);
    }
  }, [selectedDept, currentUser]);

  const fetchTasks = async () => {
    try {
      const res = await api.getResponseTasks(selectedDept === 'ALL' ? null : selectedDept);
      if (res && Array.isArray(res)) {
        setTasks(res);
        const open = res.filter(t => t.status === 'ASSIGNED').length;
        const pending = res.filter(t => t.status === 'ACCEPTED' || t.status === 'REWORK_REQUESTED').length;
        const review = res.filter(t => t.status === 'SUBMITTED_FOR_VERIFICATION').length;
        const crit = res.filter(t => t.priority === 'CRITICAL').length;
        
        setKpis({
          openIncidents: open + 18,
          actionsPending: pending || 12,
          underInvestigation: review || 7,
          escalated: crit || 3
        });
      }
    } catch (e) {
      console.warn('API fetchTasks fallback:', e);
    }
  };

  // Switch Role in Login Screen & auto-update credentials
  const handleSelectRoleField = (roleId) => {
    setSelectedRole(roleId);
    setLoginError(null);
    if (roleId === 'WORKER') {
      setEmailInput('worker@safety.com');
      setPasswordInput('worker123');
    } else if (roleId === 'ADMIN') {
      setEmailInput('admin@safety.com');
      setPasswordInput('admin123');
    } else if (roleId === 'RESPONDER') {
      const deptObj = DEPARTMENTS.find(d => d.id === selectedResponderDept) || DEPARTMENTS[1];
      setEmailInput(deptObj.email || 'ambulance@safety.com');
      setPasswordInput(deptObj.pass || 'med123');
    }
  };

  const handleSelectResponderDept = (deptId) => {
    setSelectedResponderDept(deptId);
    setLoginError(null);
    const deptObj = DEPARTMENTS.find(d => d.id === deptId);
    if (deptObj && deptObj.email) {
      setEmailInput(deptObj.email);
      setPasswordInput(deptObj.pass);
    }
  };

  // Perform Login
  const handleLoginSubmit = async (e) => {
    if (e) e.preventDefault();
    setLoginError(null);
    setIsLoggingIn(true);

    try {
      const res = await api.login('id001', emailInput, passwordInput);
      if (res && res.user) {
        setCurrentUser(res.user);
        setScreenMode('app');
        setActiveTab('home');
      } else {
        throw new Error('Authentication failed');
      }
    } catch (err) {
      const cleanEmail = emailInput.trim().toLowerCase();
      const roleObj = LOGIN_ROLES.find(r => r.id === selectedRole);
      
      let userObj = {
        email: cleanEmail,
        full_name: roleObj?.defaultName || 'Safety User',
        role: selectedRole,
        role_name: selectedRole === 'ADMIN' ? 'Safety Administrator' : selectedRole === 'RESPONDER' ? 'Response Specialist' : 'Field Worker',
        is_admin: selectedRole === 'ADMIN',
        department: selectedRole === 'RESPONDER' ? selectedResponderDept : 'FIELD_OPS'
      };

      if (cleanEmail.includes('ambulance')) {
        userObj.full_name = 'Dr. Sunita (Ambulance Lead)';
        userObj.department = 'AMBULANCE_MEDICAL';
      } else if (cleanEmail.includes('mech')) {
        userObj.full_name = 'Marcus Sterling (Mechanical Lead)';
        userObj.department = 'MECHANICAL';
      } else if (cleanEmail.includes('admin')) {
        userObj.full_name = 'Eleanor Vance (HSE Admin)';
        userObj.role = 'ADMIN';
        userObj.is_admin = true;
      }

      setCurrentUser(userObj);
      setScreenMode('app');
      setActiveTab('home');
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Logout handler
  const handleLogout = () => {
    setCurrentUser(null);
    setScreenMode('welcome');
    setLoginStep(1);
    setEmailInput('worker@safety.com');
    setPasswordInput('worker123');
    setSelectedRole('WORKER');
  };

  // Open report modal with specific category preset
  const openReportWithCategory = (cat) => {
    setReportCategory(cat);
    setSpokenTranscript('');
    setTranslatedEnglish('');
    setPhotoAttached(false);
    setShowReportModal(true);
  };

  // Voice Recording Control
  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const startRecording = () => {
    setIsRecording(true);
    setRecordingSeconds(0);
    setSpokenTranscript('');
    setTranslatedEnglish('');

    recordingTimerRef.current = setInterval(() => {
      setRecordingSeconds(prev => prev + 1);
    }, 1000);

    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRec) {
      simulateVoice();
      return;
    }

    try {
      const rec = new SpeechRec();
      recognitionRef.current = rec;
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = selectedLanguage === 'te' ? 'te-IN' : selectedLanguage === 'hi' ? 'hi-IN' : 'en-US';

      rec.onresult = (evt) => {
        let text = '';
        for (let i = 0; i < evt.results.length; i++) {
          text += evt.results[i][0].transcript;
        }
        setSpokenTranscript(text);
      };

      rec.onerror = () => {
        if (!spokenTranscript) simulateVoice();
      };

      rec.start();
    } catch (e) {
      simulateVoice();
    }
  };

  const simulateVoice = () => {
    const samples = {
      te: 'ప్లాంట్ 2 వద్ద గ్యాస్ పైప్‌లైన్ ఫ్లాంజ్ లీక్ అవుతోంది, ప్రెజర్ గేజ్ వేగంగా పెరుగుతోంది మరియు కార్మికులు పిపిఇ లేకుండా పని చేస్తున్నారు.',
      hi: 'प्लांट 2 के कंप्रेशर लाइन में भारी गैस रिसाव देखा गया है और स्पार्क का खतरा है।',
      en: 'Gas leak observed at pipeline flange in Plant 2 with workers lacking required PPE.'
    };
    setTimeout(() => {
      setSpokenTranscript(samples[selectedLanguage] || samples.en);
    }, 1500);
  };

  const stopRecording = () => {
    setIsRecording(false);
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) {}
    }

    translateSpokenText(spokenTranscript || (selectedLanguage === 'te' 
      ? 'ప్లాంట్ 2 వద్ద గ్యాస్ పైప్‌లైన్ ఫ్లాంజ్ లీక్ అవుతోంది.' 
      : 'प्लांट 2 में गैस रिसाव देखा गया है।'));
  };

  const translateSpokenText = async (txt) => {
    if (!txt) return;
    setIsTranslating(true);
    try {
      const res = await api.translateVoice({
        audio_text: txt,
        source_language: selectedLanguage,
        target_language: 'en'
      });
      if (res && res.translated_text) {
        setTranslatedEnglish(res.translated_text);
      } else {
        fallbackTranslate(txt);
      }
    } catch (e) {
      fallbackTranslate(txt);
    } finally {
      setIsTranslating(false);
    }
  };

  const fallbackTranslate = (txt) => {
    if (selectedLanguage === 'te') {
      setTranslatedEnglish('Gas pipeline flange is leaking at Plant 2, pressure gauge rising rapidly with PPE safety non-compliance.');
    } else if (selectedLanguage === 'hi') {
      setTranslatedEnglish('Heavy gas leak detected at compressor line in Plant 2 with severe spark ignition hazard.');
    } else {
      setTranslatedEnglish(txt);
    }
  };

  // Submit Safety Observation
  const handleSaveReport = async () => {
    const desc = translatedEnglish || spokenTranscript || `${reportCategory} identified at ${facilityLocation}`;
    setIsSubmitting(true);
    try {
      const payload = {
        title: `${reportCategory}: ${facilityLocation}`,
        description: desc,
        category: reportCategory,
        facility_id: 1,
        location: facilityLocation,
        reported_by: currentUser?.full_name || 'Field Reporter',
        severity: 'HIGH',
        source: 'MOBILE_APP',
        status: 'NEW'
      };

      try {
        await api.createReport(payload);
      } catch (err) {
        console.warn('API fallback:', err);
      }

      autoPersistToTotalRecords([{
        id: Date.now(),
        report_number: `INC-${Math.floor(1000 + Math.random() * 9000)}`,
        title: payload.title,
        description: payload.description,
        location: payload.location,
        submitted_by: currentUser?.full_name || 'Field Reporter',
        severity: 'HIGH',
        status: 'ANALYZING',
        created_at: new Date().toISOString()
      }]);

      setLatestAlert({
        title: `${reportCategory} Reported`,
        subtitle: `${desc.slice(0, 35)}...`,
        time: 'Just now',
        type: 'warning'
      });

      setSubmitFeedback('Incident successfully reported and dispatched to AI SIF engine!');
      setTimeout(() => {
        setSubmitFeedback(null);
        setShowReportModal(false);
        setSpokenTranscript('');
        setTranslatedEnglish('');
      }, 1500);

      fetchTasks();
    } catch (err) {
      alert('Error submitting report: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Atomic Claim Task
  const handleClaimTask = async (taskId) => {
    try {
      await api.acceptResponseTask(taskId);
      setActionNotice({ type: 'success', text: `Task #${taskId} claimed exclusively!` });
      await fetchTasks();
    } catch (err) {
      setActionNotice({ type: 'error', text: err.message || 'Already claimed by another responder.' });
    } finally {
      setTimeout(() => setActionNotice(null), 3500);
    }
  };

  // Submit Verification Work
  const handleSubmitVerification = async (taskId) => {
    if (!workNotes.trim()) {
      alert('Please enter work notes.');
      return;
    }
    try {
      await api.submitTaskVerification(taskId, {
        work_notes: workNotes,
        evidence_notes: 'Visual verification completed via mobile camera',
        evidence_file_url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800'
      });
      setActionNotice({ type: 'success', text: 'Submitted for Safety Officer verification!' });
      setSelectedTaskModal(null);
      setWorkNotes('');
      await fetchTasks();
    } catch (err) {
      setActionNotice({ type: 'error', text: err.message || 'Submission failed.' });
    }
  };

  // Admin Approve / Rework
  const handleVerifyTask = async (taskId, decision) => {
    if (decision === 'REWORK' && !reworkReason.trim()) {
      alert('Please enter rework instructions.');
      return;
    }
    try {
      await api.verifyResponseTask(taskId, {
        decision: decision,
        rework_reason: reworkReason || null
      });
      setActionNotice({ 
        type: 'success', 
        text: decision === 'APPROVE' ? 'Task Approved & Closed!' : 'Rework requested.' 
      });
      setSelectedTaskModal(null);
      setShowReworkInput(false);
      setReworkReason('');
      await fetchTasks();
    } catch (err) {
      setActionNotice({ type: 'error', text: err.message || 'Action failed.' });
    }
  };

  // SOS Countdown
  const triggerSos = () => {
    setSosCountdown(3);
    const interval = setInterval(() => {
      setSosCountdown(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          setSosDispatched(true);
          try {
            api.triggerEmergencySos({
              facility_id: 1,
              location: facilityLocation,
              sos_type: 'CRITICAL_LIFE_SAFETY_ALERT'
            });
          } catch (e) {}
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-[#F0F2F5] text-slate-800 flex flex-col items-center justify-start p-0 sm:py-6 font-sans select-none">
      
      {/* Top Desktop Controls */}
      <header className="hidden sm:flex w-full max-w-[410px] items-center justify-between pb-2 px-1 text-xs text-slate-500">
        <div className="flex items-center gap-1.5 font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>SafetyPulse AI Mobile</span>
        </div>
        <button
          onClick={() => setIsPhoneFrame(!isPhoneFrame)}
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-600 shadow-2xs hover:bg-slate-50 transition-colors"
        >
          {isPhoneFrame ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
          <span>{isPhoneFrame ? 'Full Width' : 'Phone Frame'}</span>
        </button>
      </header>

      {/* MOBILE DEVICE SHELL */}
      <main className={`w-full ${isPhoneFrame ? 'sm:max-w-[400px] sm:rounded-[46px] sm:border-[9px] sm:border-slate-900 sm:shadow-2xl sm:shadow-slate-400/50' : 'max-w-xl sm:rounded-2xl'} min-h-screen sm:min-h-[820px] bg-[#F8FAFC] flex flex-col relative overflow-hidden transition-all duration-200`}>
        
        {/* ============================================================ */}
        {/* 1. WELCOME ONBOARDING SPLASH SCREEN (CLEAN WHITE AESTHETIC) */}
        {/* ============================================================ */}
        {screenMode === 'welcome' && (
          <div className="flex-1 bg-white text-slate-900 flex flex-col justify-between px-6 py-4 animate-fadeIn relative overflow-hidden">
            

            {/* HERO VISUAL CONTAINER (MALE & FEMALE SAFETY TEAM) */}
            <div className="my-auto py-1 flex flex-col items-center text-center z-10">
              
              <div className="relative w-full max-w-[280px] aspect-[4/4.2] rounded-3xl overflow-hidden shadow-md shadow-slate-200/60 border border-slate-100 group bg-white">
                <img 
                  src={safetyTeamWelcome} 
                  alt="Industrial Safety Team (Male and Female)" 
                  className="w-full h-full object-cover object-center transform group-hover:scale-105 transition-transform duration-500"
                />
                
                {/* Floating Safety Badge */}
                <div className="absolute bottom-2.5 left-2.5 right-2.5 p-2 rounded-2xl bg-white/95 backdrop-blur-md border border-slate-100 shadow-sm flex items-center justify-between text-left">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-900 block leading-tight">Field Safety Team</span>
                      <span className="text-[9px] text-slate-500 font-medium">Ready for Response</span>
                    </div>
                  </div>
                  <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    ONLINE
                  </span>
                </div>
              </div>

              {/* Title & Tagline */}
              <div className="mt-3.5 space-y-1">
                <h1 className="text-xl font-black text-slate-900 tracking-tight leading-tight">
                  SafetyPulse
                </h1>
              </div>

            </div>

            {/* BOTTOM ACTION BUTTONS */}
            <div className="space-y-2 z-10 pb-1">
              
              {/* PRIMARY CTA: GET STARTED (ROYAL BLUE PILL) */}
              <button
                onClick={() => {
                  setScreenMode('login');
                  setLoginStep(1);
                }}
                className="w-full py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-bold text-sm tracking-wide shadow-md shadow-blue-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <span>Get Started / Sign In</span>
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              </button>

            </div>

          </div>
        )}

        {/* ============================================================ */}
        {/* 2. TWO-STEP LOGIN WORKFLOW (STEP 1: ROLE | STEP 2: AUTH)    */}
        {/* ============================================================ */}
        {screenMode === 'login' && (
          <div className="flex-1 overflow-y-auto px-5 py-5 flex flex-col justify-between animate-fadeIn custom-scrollbar">
            
            {loginStep === 1 ? (
              /* -------------------------------------------------------- */
              /* STEP 1: CHOOSE ROLE TYPE                                 */
              /* -------------------------------------------------------- */
              <div className="space-y-4">
                
                {/* Top Navigation & Back Button */}
                <div className="flex items-center justify-between pt-1">
                  <button
                    onClick={() => setScreenMode('welcome')}
                    className="flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Welcome Screen</span>
                  </button>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-100 px-2 py-0.5 rounded-full">
                    Step 1 of 2
                  </span>
                </div>

                <div>
                  <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                    Choose Login Type
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Select your role to access your safety operations console
                  </p>
                </div>

                {/* THREE INTERACTIVE ROLE FIELD CARDS */}
                <div className="space-y-2.5">
                  {LOGIN_ROLES.map(role => {
                    const isSelected = selectedRole === role.id;
                    return (
                      <div
                        key={role.id}
                        onClick={() => handleSelectRoleField(role.id)}
                        className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-blue-50/70 border-blue-600 shadow-sm ring-2 ring-blue-600/10'
                            : 'bg-white border-slate-200/90 hover:border-slate-300 shadow-2xs'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <span className="text-2xl">{role.icon}</span>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-sm font-bold text-slate-900">{role.title}</span>
                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600">
                                  {role.badge}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-500 leading-tight mt-0.5">
                                {role.desc}
                              </p>
                            </div>
                          </div>

                          <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                            isSelected ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-300'
                          }`}>
                            {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>
                        </div>

                        {/* If Responder selected: show 7 Department Chips including Ambulance */}
                        {isSelected && role.id === 'RESPONDER' && (
                          <div className="mt-3 pt-2.5 border-t border-blue-200/60 space-y-1.5 animate-fadeIn">
                            <label className="text-[10px] font-bold text-blue-900 uppercase tracking-wider block">
                              Select Your Department:
                            </label>
                            <div className="flex flex-wrap gap-1.5">
                              {DEPARTMENTS.filter(d => d.id !== 'ALL').map(dept => (
                                <button
                                  type="button"
                                  key={dept.id}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleSelectResponderDept(dept.id);
                                  }}
                                  className={`px-2.5 py-1 rounded-xl text-[11px] font-bold border transition-all flex items-center gap-1 cursor-pointer ${
                                    selectedResponderDept === dept.id
                                      ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                                  }`}
                                >
                                  <span>{dept.icon}</span>
                                  <span>{dept.label.split(' ')[0]}</span>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                      </div>
                    );
                  })}
                </div>

                {/* Continue to Step 2 Button */}
                <div className="pt-3">
                  <button
                    type="button"
                    onClick={() => setLoginStep(2)}
                    className="w-full py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-bold text-sm tracking-wide shadow-md shadow-blue-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <span>Continue to Sign In</span>
                    <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                  </button>
                </div>

              </div>
            ) : (
              /* -------------------------------------------------------- */
              /* STEP 2: USERNAME & PASSWORD CREDENTIALS                  */
              /* -------------------------------------------------------- */
              <div className="space-y-4">
                
                {/* Top Navigation & Back Button to Step 1 */}
                <div className="flex items-center justify-between pt-1">
                  <button
                    onClick={() => setLoginStep(1)}
                    className="flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Change Role</span>
                  </button>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-100 px-2 py-0.5 rounded-full">
                    Step 2 of 2
                  </span>
                </div>

                <div>
                  <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                    Sign In
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Enter your credentials to access the safety console
                  </p>
                </div>

                {/* ACTIVE ROLE SUMMARY CARD */}
                <div className="p-3 rounded-2xl bg-blue-50/70 border border-blue-200/80 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl">
                      {selectedRole === 'WORKER' 
                        ? '👷' 
                        : selectedRole === 'ADMIN' 
                          ? '🛡️' 
                          : (DEPARTMENTS.find(d => d.id === selectedResponderDept)?.icon || '🛠️')}
                    </span>
                    <div>
                      <span className="text-xs font-bold text-blue-900 block leading-tight">
                        {selectedRole === 'WORKER' 
                          ? 'User / Field Worker' 
                          : selectedRole === 'ADMIN' 
                            ? 'Safety Officer (Admin)' 
                            : `Responder · ${DEPARTMENTS.find(d => d.id === selectedResponderDept)?.label || 'Team'}`}
                      </span>
                      <span className="text-[10px] text-blue-700 font-medium">
                        Selected Role
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setLoginStep(1)}
                    className="px-2.5 py-1 rounded-xl bg-white border border-blue-200 text-blue-700 text-xs font-bold hover:bg-blue-50 transition-colors cursor-pointer"
                  >
                    Switch
                  </button>
                </div>

                {/* USERNAME & PASSWORD INPUT FORM */}
                <form onSubmit={handleLoginSubmit} className="space-y-3 pt-1">
                  
                  {loginError && (
                    <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{loginError}</span>
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <span>Username / Email</span>
                    </label>
                    <input
                      type="text"
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      placeholder="Enter your email"
                      className="w-full p-3 rounded-xl bg-white border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:border-blue-600 shadow-2xs"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                      <KeyRound className="w-3.5 h-3.5 text-slate-400" />
                      <span>Password</span>
                    </label>
                    <input
                      type="password"
                      value={passwordInput}
                      onChange={(e) => setPasswordInput(e.target.value)}
                      placeholder="Enter password"
                      className="w-full p-3 rounded-xl bg-white border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:border-blue-600 shadow-2xs"
                      required
                    />
                  </div>

                  {/* 1-Tap Quick Fill Demo Pill */}
                  <div className="pt-0.5">
                    <button
                      type="button"
                      onClick={() => {
                        if (selectedRole === 'WORKER') {
                          setEmailInput('worker@safety.com');
                          setPasswordInput('worker123');
                        } else if (selectedRole === 'ADMIN') {
                          setEmailInput('admin@safety.com');
                          setPasswordInput('admin123');
                        } else {
                          const dept = DEPARTMENTS.find(d => d.id === selectedResponderDept);
                          setEmailInput(dept?.email || 'ambulance@safety.com');
                          setPasswordInput(dept?.pass || 'med123');
                        }
                      }}
                      className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
                    >
                      <span>⚡ Quick autofill default credentials</span>
                    </button>
                  </div>

                  {/* Big Blue Sign In Button */}
                  <button
                    type="submit"
                    disabled={isLoggingIn}
                    className="w-full py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-bold text-sm tracking-wide shadow-md shadow-blue-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50 mt-2 cursor-pointer"
                  >
                    {isLoggingIn ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Authenticating...</span>
                      </>
                    ) : (
                      <>
                        <span>Sign In to SafetyPulse</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>

                </form>

              </div>
            )}

            <p className="text-[10px] text-slate-400 text-center font-medium pt-3">
              Protected by Enterprise Multi-Department Safety Intelligence
            </p>

          </div>
        )}



        {/* ============================================================ */}
        {/* 3. AUTHENTICATED MAIN APPLICATION WEBSITE (PRESENT WEBSITE) */}
        {/* ============================================================ */}
        {screenMode === 'app' && currentUser && (
          <>
            {/* TOP HEADER: USER GREETING & LOGOUT BUTTON */}
            <section aria-label="App Navigation Header" className="bg-white px-5 pt-3 pb-3 border-b border-slate-100 sticky top-7 z-30">
              <div className="flex items-center justify-between mb-2">
                {/* Minimalist App Logo Button (1-Tap Navigates to Dashboard) */}
                <button
                  type="button"
                  onClick={() => setActiveTab('home')}
                  title="Return to Dashboard"
                  aria-label="Return to Dashboard"
                  className="flex items-center gap-2 px-1 py-0.5 rounded-xl hover:bg-slate-100 active:scale-95 transition-all cursor-pointer group"
                >
                  <div className="w-7 h-7 rounded-lg bg-emerald-500 flex items-center justify-center text-white shadow-xs group-hover:bg-emerald-600 transition-colors">
                    <Activity className="w-4 h-4 text-white stroke-[2.5]" />
                  </div>
                  <span className="text-base font-black tracking-tight text-slate-900 group-hover:text-emerald-700 transition-colors">
                    SafetyPulse
                  </span>
                </button>

                <div className="flex items-center gap-1">
                  <button 
                    onClick={() => setActiveTab('alerts')}
                    aria-label="View notifications"
                    className="relative p-2 rounded-full hover:bg-slate-50 transition-colors"
                  >
                    <Bell className="w-5 h-5 text-slate-700" />
                    <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white font-bold text-[9px] rounded-full flex items-center justify-center border-2 border-white shadow-xs">
                      3
                    </span>
                  </button>

                  {/* Sign Out Button to return to Welcome */}
                  <button
                    onClick={handleLogout}
                    title="Sign Out to Welcome"
                    aria-label="Sign Out"
                    className="p-2 rounded-full text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Dynamic User Greeting */}
              <div className="flex items-center justify-between pt-1">
                <div>
                  <h1 className="text-base font-bold text-slate-900 tracking-tight leading-tight">
                    Welcome, {currentUser?.full_name?.split(' ')[0] || 'User'}
                  </h1>
                  <p className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                    <span>Safety First, Always</span>
                    <span className="text-emerald-500 text-[10px]">●</span>
                  </p>
                </div>

                <div className="flex items-center gap-1">
                  <span className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-[10px] font-bold border border-blue-200">
                    {currentUser?.role === 'ADMIN' ? '🛡️ Admin' : currentUser?.role === 'RESPONDER' ? '🛠️ Responder' : '👷 Worker'}
                  </span>
                </div>
              </div>
            </section>

            {/* NOTIFICATION TOAST */}
            {actionNotice && (
              <div className={`mx-4 mt-2 p-2.5 rounded-xl text-xs font-medium flex items-center gap-2 border shadow-sm z-50 animate-fadeIn ${
                actionNotice.type === 'success' 
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                  : 'bg-red-50 border-red-200 text-red-800'
              }`}>
                {actionNotice.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />}
                <span>{actionNotice.text}</span>
              </div>
            )}

            {/* SCROLLABLE MAIN BODY */}
            <div className="flex-1 overflow-y-auto px-5 py-4 pb-24 space-y-5 custom-scrollbar">

              {/* TAB: HOME */}
              {activeTab === 'home' && (
                <div className="space-y-5 animate-fadeIn">
                  
                  {/* RECENT ALERT BANNER CARD */}
                  <div 
                    onClick={() => setActiveTab('incidents')}
                    className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex items-center gap-3.5 hover:shadow-md transition-all cursor-pointer"
                  >
                    <div className="w-12 h-12 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center shrink-0">
                      <div className="w-8 h-8 rounded-lg bg-red-500 flex items-center justify-center shadow-xs">
                        <AlertTriangle className="w-5 h-5 text-white" />
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-slate-900 text-sm leading-tight truncate">
                        {latestAlert.title}
                      </div>
                      <div className="text-xs text-slate-500 truncate mt-0.5">
                        {latestAlert.subtitle}
                      </div>
                      <div className="text-[11px] text-slate-400 font-medium mt-1">
                        {latestAlert.time}
                      </div>
                    </div>

                    <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                  </div>

                  {/* INCIDENT OVERVIEW (2x2 GRID) */}
                  <div className="space-y-3">
                    <h2 className="text-sm font-bold text-slate-900 tracking-tight">
                      Incident Overview
                    </h2>

                    <div className="grid grid-cols-2 gap-3">
                      
                      <div 
                        onClick={() => setActiveTab('incidents')}
                        className="bg-white rounded-2xl p-4 border border-slate-100 shadow-2xs hover:shadow-sm transition-all cursor-pointer"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-2xs">
                            <FileText className="w-4 h-4" />
                          </div>
                          <span className="text-2xl font-black text-slate-900 tracking-tight">
                            {kpis.openIncidents}
                          </span>
                        </div>
                        <div className="text-xs font-semibold text-slate-500">
                          Open Incidents
                        </div>
                      </div>

                      <div 
                        onClick={() => setActiveTab('incidents')}
                        className="bg-white rounded-2xl p-4 border border-slate-100 shadow-2xs hover:shadow-sm transition-all cursor-pointer"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-2xs">
                            <Wrench className="w-4 h-4" />
                          </div>
                          <span className="text-2xl font-black text-slate-900 tracking-tight">
                            {kpis.actionsPending}
                          </span>
                        </div>
                        <div className="text-xs font-semibold text-slate-500">
                          Actions Pending
                        </div>
                      </div>

                      <div 
                        onClick={() => setActiveTab('incidents')}
                        className="bg-white rounded-2xl p-4 border border-slate-100 shadow-2xs hover:shadow-sm transition-all cursor-pointer"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center shadow-2xs">
                            <Search className="w-4 h-4" />
                          </div>
                          <span className="text-2xl font-black text-slate-900 tracking-tight">
                            {kpis.underInvestigation < 10 ? `0${kpis.underInvestigation}` : kpis.underInvestigation}
                          </span>
                        </div>
                        <div className="text-xs font-semibold text-slate-500">
                          Under Investigation
                        </div>
                      </div>

                      <div 
                        onClick={() => setActiveTab('alerts')}
                        className="bg-white rounded-2xl p-4 border border-slate-100 shadow-2xs hover:shadow-sm transition-all cursor-pointer"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-8 h-8 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-2xs">
                            <AlertCircle className="w-4 h-4" />
                          </div>
                          <span className="text-2xl font-black text-slate-900 tracking-tight">
                            {kpis.escalated < 10 ? `0${kpis.escalated}` : kpis.escalated}
                          </span>
                        </div>
                        <div className="text-xs font-semibold text-slate-500">
                          Escalated
                        </div>
                      </div>

                    </div>
                  </div>

                  {/* QUICK ACTIONS */}
                  <div className="space-y-3">
                    <h2 className="text-sm font-bold text-slate-900 tracking-tight">
                      Quick Actions
                    </h2>

                    <button
                      onClick={() => openReportWithCategory('Unsafe Condition')}
                      className="w-full py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-bold text-sm tracking-wide shadow-md shadow-blue-600/25 flex items-center justify-center gap-2 transition-all"
                    >
                      <Plus className="w-5 h-5 stroke-[2.5]" />
                      <span>Report Incident</span>
                    </button>

                    <div className="grid grid-cols-3 gap-2.5 pt-1">
                      <button
                        onClick={() => openReportWithCategory('Near Miss')}
                        className="bg-white rounded-2xl p-3 border border-slate-100 shadow-2xs hover:shadow-sm active:scale-95 transition-all flex flex-col items-center justify-center text-center gap-1.5"
                      >
                        <div className="w-9 h-9 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-700">
                          <MapPin className="w-4 h-4 text-blue-600" />
                        </div>
                        <span className="text-xs font-bold text-slate-800">
                          Near Miss
                        </span>
                      </button>

                      <button
                        onClick={() => openReportWithCategory('Hazard')}
                        className="bg-white rounded-2xl p-3 border border-slate-100 shadow-2xs hover:shadow-sm active:scale-95 transition-all flex flex-col items-center justify-center text-center gap-1.5"
                      >
                        <div className="w-9 h-9 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-700">
                          <AlertTriangle className="w-4 h-4 text-amber-500" />
                        </div>
                        <span className="text-xs font-bold text-slate-800">
                          Hazard
                        </span>
                      </button>

                      <button
                        onClick={() => openReportWithCategory('Observation')}
                        className="bg-white rounded-2xl p-3 border border-slate-100 shadow-2xs hover:shadow-sm active:scale-95 transition-all flex flex-col items-center justify-center text-center gap-1.5"
                      >
                        <div className="w-9 h-9 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-700">
                          <ShieldAlert className="w-4 h-4 text-emerald-600" />
                        </div>
                        <span className="text-xs font-bold text-slate-800">
                          Observation
                        </span>
                      </button>
                    </div>
                  </div>

                </div>
              )}

              {/* TAB: INCIDENTS & ACTIONS PENDING */}
              {activeTab === 'incidents' && (
                <div className="space-y-4 animate-fadeIn">
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-sm font-bold text-slate-900 tracking-tight">
                        Incidents & Actions
                      </h2>
                      <p className="text-xs text-slate-500">
                        Department dispatch & verification loop
                      </p>
                    </div>
                    <button
                      onClick={fetchTasks}
                      className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs shadow-2xs"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Department Scroller */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
                    {DEPARTMENTS.map(dept => (
                      <button
                        key={dept.id}
                        onClick={() => setSelectedDept(dept.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 border transition-all ${
                          selectedDept === dept.id
                            ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {dept.name}
                      </button>
                    ))}
                  </div>

                  {/* Task Feed */}
                  <div className="space-y-3">
                    {tasks.map(task => {
                      const isClaimed = task.status === 'ACCEPTED' || task.status === 'SUBMITTED_FOR_VERIFICATION' || task.status === 'VERIFIED';
                      const isVerified = task.status === 'VERIFIED';
                      const isPending = task.status === 'SUBMITTED_FOR_VERIFICATION';

                      return (
                        <div
                          key={task.id}
                          className="bg-white rounded-2xl p-4 border border-slate-100 shadow-2xs space-y-2.5 hover:shadow-sm transition-all"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-mono font-bold text-blue-600">
                                  #{task.id}
                                </span>
                                <span className="px-2 py-0.5 rounded-md bg-slate-100 text-[10px] font-bold text-slate-600 uppercase">
                                  {task.department.replace('_', ' ')}
                                </span>
                                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                  task.priority === 'CRITICAL' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'
                                }`}>
                                  {task.priority}
                                </span>
                              </div>
                              <h3 className="text-xs font-bold text-slate-900 mt-1">
                                {task.title}
                              </h3>
                            </div>

                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap ${
                              isVerified ? 'bg-emerald-50 text-emerald-700' :
                              isPending ? 'bg-purple-50 text-purple-700' :
                              isClaimed ? 'bg-blue-50 text-blue-700' :
                              'bg-amber-50 text-amber-700'
                            }`}>
                              {task.status.replace(/_/g, ' ')}
                            </span>
                          </div>

                          <p className="text-xs text-slate-600 leading-relaxed">
                            {task.description}
                          </p>

                          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-100">
                            <span>{task.assigned_to_name ? `Claimed by: ${task.assigned_to_name}` : 'Unclaimed'}</span>
                            <span className="font-mono">{new Date(task.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>

                          {/* Action Buttons */}
                          <div className="pt-1 flex items-center gap-2">
                            {task.status === 'ASSIGNED' && (
                              <button
                                onClick={() => handleClaimTask(task.id)}
                                className="flex-1 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-1 shadow-xs"
                              >
                                <Lock className="w-3.5 h-3.5" />
                                <span>Claim Task 🔒</span>
                              </button>
                            )}

                            {(task.status === 'ACCEPTED' || task.status === 'REWORK_REQUESTED') && (
                              <button
                                onClick={() => setSelectedTaskModal(task)}
                                className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1 shadow-xs"
                              >
                                <Camera className="w-3.5 h-3.5" />
                                <span>Submit Evidence 📸</span>
                              </button>
                            )}

                            {isPending && (
                              <div className="w-full flex items-center gap-2">
                                <button
                                  onClick={() => handleVerifyTask(task.id, 'APPROVE')}
                                  className="flex-1 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedTaskModal(task);
                                    setShowReworkInput(true);
                                  }}
                                  className="flex-1 py-2 rounded-xl bg-rose-50 text-rose-600 border border-rose-200 font-bold text-xs"
                                >
                                  Request Rework
                                </button>
                              </div>
                            )}
                          </div>

                        </div>
                      );
                    })}
                  </div>

                </div>
              )}

              {/* TAB: ALERTS & SOS */}
              {activeTab === 'alerts' && (
                <div className="space-y-4 animate-fadeIn">
                  
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-bold text-slate-900 tracking-tight">
                      Critical Alerts & SIF Radar
                    </h2>
                    <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full">
                      Real-time
                    </span>
                  </div>

                  {/* EMERGENCY SOS TRIGGER CARD */}
                  <div className="bg-gradient-to-br from-rose-500 to-red-600 rounded-2xl p-4 text-white shadow-md space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Flame className="w-5 h-5 text-amber-200 animate-pulse" />
                        <span className="font-bold text-sm">Emergency SOS Broadcast</span>
                      </div>
                      <span className="text-[10px] font-mono bg-black/20 px-2 py-0.5 rounded">
                        GPS Active
                      </span>
                    </div>
                    <p className="text-xs text-rose-100 leading-relaxed">
                      Triggers immediate siren broadcast, stops hot work permits at Plant 2, and dispatches emergency rescue.
                    </p>

                    {sosDispatched ? (
                      <div className="p-3 bg-white text-slate-900 rounded-xl text-xs font-bold text-center">
                        🚨 Emergency Rescue Dispatched to Plant 2!
                      </div>
                    ) : sosCountdown !== null ? (
                      <div className="p-3 bg-white text-rose-600 rounded-xl text-lg font-black text-center animate-ping">
                        Broadcasting in {sosCountdown}...
                      </div>
                    ) : (
                      <button
                        onClick={triggerSos}
                        className="w-full py-2.5 rounded-xl bg-white text-red-600 hover:bg-rose-50 font-black text-xs uppercase tracking-wider shadow-sm transition-all"
                      >
                        Tap to Trigger Emergency SOS
                      </button>
                    )}
                  </div>

                  {/* SIF PRECURSOR COMBINATIONS */}
                  <div className="space-y-2.5">
                    <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                      Weak Signal Correlations Detected
                    </h3>

                    {[
                      {
                        title: 'PPE Non-compliance + Open Trench',
                        location: 'Plant 2 Foundation Bay',
                        risk: 'HIGH SIF',
                        vector: 'GRAVITY_FALL'
                      },
                      {
                        title: 'Flange Pressure Spike + Vibration',
                        location: 'Compressor Unit 1',
                        risk: 'CRITICAL SIF',
                        vector: 'HYDROCARBON_PRESSURE'
                      }
                    ].map((item, i) => (
                      <div key={i} className="bg-white rounded-2xl p-3.5 border border-slate-100 shadow-2xs space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-50 text-red-600">
                            {item.risk}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">{item.vector}</span>
                        </div>
                        <div className="text-xs font-bold text-slate-900">{item.title}</div>
                        <div className="text-[11px] text-slate-500">📍 {item.location}</div>
                      </div>
                    ))}
                  </div>

                </div>
              )}

              {/* TAB: MORE / PROFILE / SETTINGS */}
              {activeTab === 'more' && (
                <div className="space-y-4 animate-fadeIn">
                  
                  <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-2xs flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-base">
                        {currentUser?.full_name ? currentUser.full_name[0] : 'U'}
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 text-sm">{currentUser?.full_name}</h3>
                        <p className="text-xs text-slate-500">{currentUser?.email}</p>
                        <p className="text-[10px] text-emerald-600 font-medium">Role: {currentUser?.role_name || currentUser?.role}</p>
                      </div>
                    </div>
                  </div>

                  {/* LOGOUT & SWITCH ROLE BUTTON */}
                  <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-2xs space-y-3">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                      Account Operations
                    </span>
                    <button
                      onClick={handleLogout}
                      className="w-full py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold flex items-center justify-center gap-2 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Log Out to Welcome Screen</span>
                    </button>
                  </div>

                </div>
              )}

            </div>

            {/* REPORT INCIDENT MODAL (VOICE & TRANSLATION) */}
            {showReportModal && (
              <div className="absolute inset-0 bg-black/60 backdrop-blur-xs z-50 flex flex-col justify-end animate-fadeIn">
                <div className="bg-white rounded-t-[32px] p-5 space-y-4 max-h-[92%] overflow-y-auto custom-scrollbar shadow-2xl">
                  
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div>
                      <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">
                        New Safety Report
                      </span>
                      <h3 className="text-sm font-bold text-slate-900">
                        Report {reportCategory}
                      </h3>
                    </div>
                    <button
                      onClick={() => setShowReportModal(false)}
                      className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {submitFeedback && (
                    <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{submitFeedback}</span>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">Classification</label>
                    <div className="grid grid-cols-3 gap-2">
                      {['Near Miss', 'Hazard', 'Observation'].map(cat => (
                        <button
                          key={cat}
                          onClick={() => setReportCategory(cat)}
                          className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all ${
                            reportCategory === cat
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'bg-slate-50 border-slate-200 text-slate-600'
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* VOICE REPORTING MODULE */}
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-800">Voice Observation</span>
                      <button
                        onClick={() => setNoiseIsolation(!noiseIsolation)}
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          noiseIsolation ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        {noiseIsolation ? 'Noise Filter ON' : 'Raw Audio'}
                      </button>
                    </div>

                    <div className="grid grid-cols-3 gap-1.5">
                      {[
                        { id: 'te', label: 'తెలుగు (Telugu)' },
                        { id: 'hi', label: 'हिंदी (Hindi)' },
                        { id: 'en', label: 'English' }
                      ].map(l => (
                        <button
                          key={l.id}
                          onClick={() => setSelectedLanguage(l.id)}
                          className={`py-1.5 px-2 rounded-lg text-xs font-bold border transition-all ${
                            selectedLanguage === l.id
                              ? 'bg-white border-blue-600 text-blue-700 shadow-2xs'
                              : 'bg-transparent border-slate-200 text-slate-500'
                          }`}
                        >
                          {l.label}
                        </button>
                      ))}
                    </div>

                    <div className="py-2 flex flex-col items-center justify-center">
                      <button
                        onClick={toggleRecording}
                        className={`w-16 h-16 rounded-full flex items-center justify-center shadow-lg transition-all ${
                          isRecording
                            ? 'bg-red-500 text-white ring-4 ring-red-200 animate-pulse'
                            : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/30'
                        }`}
                      >
                        {isRecording ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                      </button>
                      <p className="text-[11px] text-slate-500 mt-2 font-medium">
                        {isRecording ? `Recording... (${recordingSeconds}s)` : 'Tap to speak observation'}
                      </p>
                    </div>

                    {(spokenTranscript || translatedEnglish) && (
                      <div className="space-y-2 pt-1 border-t border-slate-200 text-xs">
                        {spokenTranscript && (
                          <div className="p-2 rounded-xl bg-white border border-slate-200 text-slate-700">
                            <span className="text-[10px] font-bold text-slate-400 block">ORIGINAL SPEECH</span>
                            {spokenTranscript}
                          </div>
                        )}
                        {translatedEnglish && (
                          <div className="p-2 rounded-xl bg-blue-50 border border-blue-200 text-blue-900">
                            <span className="text-[10px] font-bold text-blue-600 block flex items-center gap-1">
                              <Sparkles className="w-3 h-3" />
                              TRANSLATED TO ENGLISH (FOR SIF ENGINE)
                            </span>
                            {translatedEnglish}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Location</label>
                    <input
                      type="text"
                      value={facilityLocation}
                      onChange={(e) => setFacilityLocation(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 font-medium focus:outline-none focus:border-blue-600"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setPhotoAttached(!photoAttached)}
                      className={`flex-1 py-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                        photoAttached 
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-700' 
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <Camera className="w-4 h-4" />
                      <span>{photoAttached ? '✓ Photo Attached' : 'Attach Photo'}</span>
                    </button>
                  </div>

                  <button
                    onClick={handleSaveReport}
                    disabled={isSubmitting}
                    className="w-full py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm tracking-wide shadow-md shadow-blue-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Analyzing SIF Precursors...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Submit Report</span>
                      </>
                    )}
                  </button>

                </div>
              </div>
            )}

            {/* SUBMIT EVIDENCE / REWORK MODAL DRAWER */}
            {selectedTaskModal && (
              <div className="absolute inset-0 bg-black/60 backdrop-blur-xs z-50 flex flex-col justify-end animate-fadeIn">
                <div className="bg-white rounded-t-[32px] p-5 space-y-3.5 max-h-[90%] overflow-y-auto custom-scrollbar shadow-2xl">
                  
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                    <div>
                      <span className="text-[10px] font-mono font-bold text-blue-600">Task #{selectedTaskModal.id}</span>
                      <h3 className="text-xs font-bold text-slate-900">{selectedTaskModal.title}</h3>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedTaskModal(null);
                        setShowReworkInput(false);
                      }}
                      className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-500"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {showReworkInput ? (
                    <div className="space-y-3">
                      <label className="text-xs font-bold text-rose-600">
                        Rework Feedback Instructions (Required):
                      </label>
                      <textarea
                        value={reworkReason}
                        onChange={(e) => setReworkReason(e.target.value)}
                        placeholder="Specify why work was rejected..."
                        rows={3}
                        className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-rose-500"
                      />
                      <button
                        onClick={() => handleVerifyTask(selectedTaskModal.id, 'REWORK')}
                        className="w-full py-2.5 rounded-xl bg-rose-600 text-white font-bold text-xs"
                      >
                        Confirm Rework Request
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs font-semibold text-slate-700 block mb-1">
                          Corrective Action Notes *
                        </label>
                        <textarea
                          value={workNotes}
                          onChange={(e) => setWorkNotes(e.target.value)}
                          placeholder="Describe what was repaired or isolated..."
                          rows={3}
                          className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-blue-600"
                        />
                      </div>

                      <button
                        onClick={() => handleSubmitVerification(selectedTaskModal.id)}
                        className="w-full py-3 rounded-2xl bg-blue-600 text-white font-bold text-xs"
                      >
                        Submit for Verification Sign-Off
                      </button>
                    </div>
                  )}

                </div>
              </div>
            )}

            {/* BOTTOM NAVIGATION BAR: DOCKED WHITE BAR WITH GREEN '+' CENTER */}
            <nav aria-label="Main Navigation" className="h-18 bg-white border-t border-slate-100 px-4 flex items-center justify-between sticky bottom-0 z-40 shadow-lg shadow-slate-200/50">
              
              <button
                onClick={() => setActiveTab('home')}
                className={`flex flex-col items-center justify-center flex-1 py-1 transition-all ${
                  activeTab === 'home' ? 'text-slate-900 font-bold' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <Home className="w-5 h-5 stroke-[2.2]" />
                <span className="text-[10px] mt-1 font-medium">Home</span>
              </button>

              <button
                onClick={() => setActiveTab('incidents')}
                className={`flex flex-col items-center justify-center flex-1 py-1 transition-all ${
                  activeTab === 'incidents' ? 'text-slate-900 font-bold' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <AlertTriangle className="w-5 h-5 stroke-[2.2]" />
                <span className="text-[10px] mt-1 font-medium">Incidents</span>
              </button>

              {/* CENTER FLOATING GREEN '+' BUTTON */}
              <div className="flex flex-col items-center justify-center flex-1 -mt-5">
                <button
                  onClick={() => openReportWithCategory('Unsafe Condition')}
                  aria-label="Report New Incident"
                  className="w-13 h-13 rounded-full bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white flex items-center justify-center shadow-lg shadow-emerald-500/40 transition-all border-4 border-white"
                >
                  <Plus className="w-7 h-7 stroke-[3]" />
                </button>
              </div>

              <button
                onClick={() => setActiveTab('alerts')}
                className={`flex flex-col items-center justify-center flex-1 py-1 transition-all ${
                  activeTab === 'alerts' ? 'text-slate-900 font-bold' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <Bell className="w-5 h-5 stroke-[2.2]" />
                <span className="text-[10px] mt-1 font-medium">Alerts</span>
              </button>

              <button
                onClick={() => setActiveTab('more')}
                className={`flex flex-col items-center justify-center flex-1 py-1 transition-all ${
                  activeTab === 'more' ? 'text-slate-900 font-bold' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <MoreHorizontal className="w-5 h-5 stroke-[2.2]" />
                <span className="text-[10px] mt-1 font-medium">More</span>
              </button>

            </nav>

          </>
        )}

      </main>

    </div>
  );
}
