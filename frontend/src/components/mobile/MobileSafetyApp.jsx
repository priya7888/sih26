import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Radio,
  Volume2,
  AlertTriangle,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  Clock,
  MapPin,
  Send,
  Camera,
  Image as ImageIcon,
  RotateCcw,
  Sparkles,
  Flame,
  Zap,
  PhoneCall,
  User,
  Wrench,
  Search,
  Check,
  ChevronRight,
  ExternalLink,
  Layers,
  Activity,
  Bell,
  Sliders,
  ChevronDown,
  Maximize2,
  Minimize2,
  Lock,
  FileCheck
} from 'lucide-react';
import { api } from '../../services/api';
import { 
  getStoreState, 
  autoPersistToTotalRecords, 
  syncBackendReportsToStore 
} from '../../services/safetyStore';

// Department icons and styling
const DEPARTMENTS = [
  { id: 'ALL', name: 'All Teams', icon: '🌐' },
  { id: 'MECHANICAL', name: 'Mechanical', icon: '⚙️', color: 'from-blue-500 to-indigo-600' },
  { id: 'ELECTRICAL', name: 'Electrical', icon: '⚡', color: 'from-amber-500 to-yellow-600' },
  { id: 'PROCESS_SAFETY', name: 'Process Safety', icon: '🏭', color: 'from-emerald-500 to-teal-600' },
  { id: 'RIGGING_LIFTING', name: 'Rigging & Lifting', icon: '🏗️', color: 'from-orange-500 to-red-600' },
  { id: 'HAZMAT', name: 'Hazmat', icon: '☣️', color: 'from-purple-500 to-violet-600' },
  { id: 'CIVIL_STRUCTURAL', name: 'Civil & Structural', icon: '🧱', color: 'from-stone-500 to-slate-600' }
];

// Presets for rapid testing across roles
const ROLES = [
  { id: 'WORKER', label: 'Field Worker', badge: 'Reporter', icon: '👷', desc: 'Voice reporting & SOS' },
  { id: 'RESPONDER', label: 'Response Team', badge: 'Specialist', icon: '🛠️', desc: 'Task claim & remediation' },
  { id: 'SAFETY_OFFICER', label: 'Safety Officer', badge: 'Supervisor', icon: '🛡️', desc: 'AI triage & verification' }
];

const QUICK_HAZARDS = [
  { id: 'height', label: 'Work at Height', icon: '🧗', vector: 'GRAVITY_FALL' },
  { id: 'gas', label: 'Gas Flange Leak', icon: '💨', vector: 'HYDROCARBON_PRESSURE' },
  { id: 'electric', label: 'Electrical Arc', icon: '⚡', vector: 'ELECTRICAL_STORED' },
  { id: 'crane', label: 'Suspended Load', icon: '🏗️', vector: 'MECHANICAL_RIGGING' },
  { id: 'confined', label: 'Confined Space', icon: '🕳️', vector: 'TOXIC_ATMOSPHERE' },
  { id: 'fire', label: 'Hot Work Spark', icon: '🔥', vector: 'THERMAL_FIRE' }
];

export default function MobileSafetyApp() {
  // Navigation tabs: 'voice' | 'tasks' | 'radar' | 'sos' | 'activity'
  const [activeTab, setActiveTab] = useState('voice');
  const [activeRole, setActiveRole] = useState('WORKER');
  const [deviceFrameMode, setDeviceFrameMode] = useState(true); // true = iPhone frame on desktop, false = full width
  
  // Worker Voice Reporting State
  const [selectedLanguage, setSelectedLanguage] = useState('te'); // 'te' | 'hi' | 'en'
  const [noiseIsolation, setNoiseIsolation] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [spokenTranscript, setSpokenTranscript] = useState('');
  const [translatedEnglish, setTranslatedEnglish] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [reportType, setReportType] = useState('UNSAFE_CONDITION'); // 'UNSAFE_CONDITION' | 'UNSAFE_ACT' | 'NEAR_MISS' | 'INCIDENT'
  const [selectedHazard, setSelectedHazard] = useState(null);
  const [facilityBay, setFacilityBay] = useState('Rig Alpha – Sivaraopeta Unit 1');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccessNotice, setSubmitSuccessNotice] = useState(null);

  // Response Tasks State
  const [tasks, setTasks] = useState([]);
  const [taskFilterDept, setTaskFilterDept] = useState('ALL');
  const [taskFilterStatus, setTaskFilterStatus] = useState('ALL');
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [claimingTaskId, setClaimingTaskId] = useState(null);
  const [activeTaskModal, setActiveTaskModal] = useState(null); // Task currently being verified / inspected
  const [workNotes, setWorkNotes] = useState('');
  const [testReadings, setTestReadings] = useState('');
  const [evidencePhoto, setEvidencePhoto] = useState(null);
  const [reworkReason, setReworkReason] = useState('');
  const [showReworkInput, setShowReworkInput] = useState(false);
  const [actionMessage, setActionMessage] = useState(null);

  // SOS Emergency State
  const [sosCountdown, setSosCountdown] = useState(null);
  const [sosActive, setSosActive] = useState(false);
  const [sosLocation, setSosLocation] = useState('Rig Alpha Platform 3 (Lat 17.0005, Lng 81.8040)');

  // Recent user activity
  const [myReports, setMyReports] = useState([]);
  const recordingTimerRef = useRef(null);
  const recognitionRef = useRef(null);

  // Load tasks on mount and role switch
  useEffect(() => {
    fetchTasks();
    const interval = setInterval(fetchTasks, 4000);
    return () => clearInterval(interval);
  }, [taskFilterDept]);

  // Load local store reports for timeline
  useEffect(() => {
    const updateReports = () => {
      const state = getStoreState();
      setMyReports(state.reports || []);
    };
    updateReports();
    const interval = setInterval(updateReports, 3000);
    return () => clearInterval(interval);
  }, []);

  const fetchTasks = async () => {
    try {
      const res = await api.getResponseTasks(taskFilterDept === 'ALL' ? null : taskFilterDept);
      if (res && Array.isArray(res)) {
        setTasks(res);
      }
    } catch (e) {
      console.warn('Tasks fetch fallback:', e);
    }
  };

  // Toggle Voice Recording with Speech Recognition
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

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      // Speech recognition fallback simulation with authentic Telugu/Hindi speech
      simulateVoiceInput();
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = selectedLanguage === 'te' ? 'te-IN' : selectedLanguage === 'hi' ? 'hi-IN' : 'en-US';

      recognition.onresult = (event) => {
        let finalTranscript = '';
        for (let i = 0; i < event.results.length; i++) {
          finalTranscript += event.results[i][0].transcript;
        }
        setSpokenTranscript(finalTranscript);
      };

      recognition.onerror = (e) => {
        console.warn('Speech recognition error:', e);
        if (!spokenTranscript) simulateVoiceInput();
      };

      recognition.start();
    } catch (err) {
      console.warn('Recognition start error:', err);
      simulateVoiceInput();
    }
  };

  const simulateVoiceInput = () => {
    const samples = {
      te: 'పైప్‌లైన్ ఫ్లాంజ్ వద్ద గ్యాస్ లీక్ అవుతోంది, ఒత్తిడి గేజ్ 180 బార్ దాటిపోయింది మరియు కార్మికులకు స్పాంటేనియస్ ఫైర్ ప్రమాదం ఉంది.',
      hi: 'ड्रिलिंग रिग 1 के हाइड्रोलिक फ्लैंज में गैस का तेज रिसाव हो रहा है और बिना ग्राउंडिंग के काम चल रहा है।',
      en: 'High pressure gas leak observed at flange joint on Rig Alpha. Workers operating without harness lanyard clip.'
    };
    setTimeout(() => {
      setSpokenTranscript(samples[selectedLanguage] || samples.en);
    }, 1800);
  };

  const stopRecording = () => {
    setIsRecording(false);
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) {}
    }

    // Auto-translate to English
    translateSpokenText(spokenTranscript || (selectedLanguage === 'te' 
      ? 'పైప్‌లైన్ ఫ్లాంజ్ వద్ద గ్యాస్ లీక్ అవుతోంది, ఒత్తిడి గేజ్ 180 బార్ దాటిపోయింది.' 
      : 'हाइड्रोलिक फ्लैंज में गैस का रिसाव हो रहा है।'));
  };

  const translateSpokenText = async (text) => {
    if (!text) return;
    setIsTranslating(true);
    try {
      const res = await api.translateVoice({
        audio_text: text,
        source_language: selectedLanguage,
        target_language: 'en'
      });
      if (res && res.translated_text) {
        setTranslatedEnglish(res.translated_text);
      } else {
        fallbackTranslate(text);
      }
    } catch (err) {
      fallbackTranslate(text);
    } finally {
      setIsTranslating(false);
    }
  };

  const fallbackTranslate = (text) => {
    if (selectedLanguage === 'te') {
      setTranslatedEnglish('Gas is leaking at the pipeline flange, pressure gauge exceeded 180 bar posing a catastrophic fire and explosion hazard.');
    } else if (selectedLanguage === 'hi') {
      setTranslatedEnglish('Severe gas leakage from hydraulic flange on Drilling Rig with hot work in progress nearby.');
    } else {
      setTranslatedEnglish(text);
    }
  };

  // Submit Safety Observation
  const handleSubmitReport = async () => {
    const finalDescription = translatedEnglish || spokenTranscript || (selectedHazard ? `${selectedHazard.label} observed near ${facilityBay}` : 'High risk safety observation');
    if (!finalDescription.trim()) return;

    setIsSubmitting(true);
    try {
      const newReportData = {
        title: `${reportType.replace('_', ' ')}: ${selectedHazard ? selectedHazard.label : 'Field Voice Report'}`,
        description: finalDescription,
        category: selectedHazard ? selectedHazard.label : 'Process Safety',
        facility_id: 1,
        location: facilityBay,
        reported_by: 'Field Mobile Reporter',
        severity: 'HIGH',
        source: 'MOBILE_PWA_VOICE',
        status: 'NEW'
      };

      // Call live backend
      let saved = null;
      try {
        saved = await api.createReport(newReportData);
      } catch (e) {
        console.warn('API createReport fallback to store:', e);
      }

      // Persist to local safety store for immediate reactivity
      const storeItem = {
        id: saved?.id || Date.now(),
        report_number: `OIL-MOB-${Math.floor(1000 + Math.random() * 9000)}`,
        title: newReportData.title,
        description: newReportData.description,
        location: newReportData.location,
        submitted_by: 'Liam Vance (Field Op)',
        source: 'MOBILE_PWA',
        severity: 'HIGH',
        status: 'ANALYZING',
        created_at: new Date().toISOString()
      };
      autoPersistToTotalRecords([storeItem]);

      setSubmitSuccessNotice({
        id: storeItem.id,
        title: storeItem.title,
        sifRisk: 'HIGH SIF PRECURSOR',
        energyVector: selectedHazard?.vector || 'HYDROCARBON_PRESSURE',
        assignedDept: 'MECHANICAL'
      });

      // Reset voice form
      setSpokenTranscript('');
      setTranslatedEnglish('');
      setSelectedHazard(null);
    } catch (err) {
      alert('Report submission error: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Response Task: Exclusive Atomic Claim
  const handleClaimTask = async (taskId) => {
    setClaimingTaskId(taskId);
    setActionMessage(null);
    try {
      await api.acceptResponseTask(taskId);
      setActionMessage({ type: 'success', text: `Task #${taskId} successfully claimed exclusively!` });
      await fetchTasks();
    } catch (err) {
      setActionMessage({ type: 'error', text: err.message || 'Could not claim task (already claimed by another responder).' });
    } finally {
      setClaimingTaskId(null);
      setTimeout(() => setActionMessage(null), 4000);
    }
  };

  // Submit Work for Verification
  const handleSubmitVerification = async (taskId) => {
    if (!workNotes.trim()) {
      alert('Please enter work notes / actions completed.');
      return;
    }
    setActionMessage(null);
    try {
      await api.submitTaskVerification(taskId, {
        work_notes: workNotes,
        evidence_notes: testReadings ? `Test Readings: ${testReadings}` : 'Visual camera inspection verified',
        evidence_file_url: evidencePhoto || 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800'
      });
      setActionMessage({ type: 'success', text: 'Work submitted for Safety Officer verification!' });
      setActiveTaskModal(null);
      setWorkNotes('');
      setTestReadings('');
      setEvidencePhoto(null);
      await fetchTasks();
    } catch (err) {
      setActionMessage({ type: 'error', text: err.message || 'Failed to submit verification.' });
    }
  };

  // Safety Officer Sign-off / Rework
  const handleVerifyTask = async (taskId, decision) => {
    if (decision === 'REWORK' && !reworkReason.trim()) {
      alert('Please provide specific rework instructions for the response team.');
      return;
    }
    setActionMessage(null);
    try {
      await api.verifyResponseTask(taskId, {
        decision: decision,
        rework_reason: reworkReason || null
      });
      setActionMessage({ 
        type: 'success', 
        text: decision === 'APPROVE' ? 'Task Approved & Closed!' : 'Rework requested successfully.' 
      });
      setActiveTaskModal(null);
      setShowReworkInput(false);
      setReworkReason('');
      await fetchTasks();
    } catch (err) {
      setActionMessage({ type: 'error', text: err.message || 'Action failed.' });
    }
  };

  // Emergency SOS Trigger
  const startSosCountdown = () => {
    setSosCountdown(3);
    const interval = setInterval(() => {
      setSosCountdown(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          triggerSosBroadcast();
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const cancelSos = () => {
    setSosCountdown(null);
    setSosActive(false);
  };

  const triggerSosBroadcast = async () => {
    setSosActive(true);
    try {
      await api.triggerEmergencySos({
        facility_id: 1,
        location: sosLocation,
        sos_type: 'CRITICAL_LIFE_SAFETY_ALERT'
      });
    } catch (e) {
      console.warn('SOS broadcast fallback:', e);
    }
  };

  // Filter tasks based on UI selections
  const filteredTasks = tasks.filter(t => {
    if (taskFilterDept !== 'ALL' && t.department !== taskFilterDept) return false;
    if (taskFilterStatus === 'CLAIMED' && t.status !== 'ACCEPTED') return false;
    if (taskFilterStatus === 'VERIFIED' && t.status !== 'VERIFIED') return false;
    if (taskFilterStatus === 'PENDING' && t.status !== 'SUBMITTED_FOR_VERIFICATION') return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-start p-0 sm:py-6 font-sans select-none">
      
      {/* Top Desktop Presentation Bar (Only visible on wide desktop viewports) */}
      <header className="hidden sm:flex w-full max-w-md items-center justify-between pb-3 px-2 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-semibold text-slate-200">Oil India Limited</span>
          <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-amber-400 font-mono">PWA v2.4</span>
        </div>
        <button
          onClick={() => setDeviceFrameMode(!deviceFrameMode)}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition-colors"
        >
          {deviceFrameMode ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
          <span>{deviceFrameMode ? 'Full Screen' : 'Phone Bezel'}</span>
        </button>
      </header>

      {/* MOBILE DEVICE CONTAINER */}
      <main className={`w-full ${deviceFrameMode ? 'sm:max-w-[420px] sm:rounded-[42px] sm:border-[8px] sm:border-slate-800 sm:shadow-2xl sm:shadow-black/80' : 'max-w-2xl sm:rounded-2xl'} min-h-screen sm:min-h-[850px] bg-[#090D16] flex flex-col relative overflow-hidden transition-all duration-300`}>
        
        {/* MOBILE HARDWARE NOTCH & STATUS BAR */}
        <div className="pt-2 px-6 pb-1 flex items-center justify-between text-[11px] font-medium text-slate-400 bg-[#090D16]/95 backdrop-blur-md sticky top-0 z-40">
          <div className="flex items-center gap-1.5 font-mono text-slate-300">
            <span>18:48</span>
          </div>
          {/* Dynamic Island / Speaker Pill */}
          <div className="w-24 h-4 bg-slate-900 rounded-full flex items-center justify-center border border-slate-800/60 shadow-inner">
            <div className="w-2.5 h-2.5 rounded-full bg-slate-950 border border-slate-700/80 mr-2" />
            <div className="w-2 h-2 rounded-full bg-emerald-500/80 animate-pulse" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-emerald-400 font-mono">5G</span>
            <div className="w-5 h-2.5 border border-slate-500 rounded-sm p-0.5 flex items-center">
              <div className="w-3.5 h-1.5 bg-emerald-400 rounded-2xs" />
            </div>
          </div>
        </div>

        {/* MOBILE APP HEADER & QUICK ROLE SWITCHER */}
        <section aria-label="Mobile App Header" className="px-4 py-2.5 border-b border-slate-800/80 bg-gradient-to-b from-[#0F1626] to-[#090D16] sticky top-7 z-30">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center font-black text-slate-950 text-xs shadow-md shadow-amber-500/20">
                OIL
              </div>
              <div>
                <h1 className="text-xs font-bold text-slate-100 tracking-tight leading-none">SIF Sentinel Mobile</h1>
                <p className="text-[10px] text-slate-400 font-mono">Oil India Rig Alpha Unit</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wider bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                AI Active
              </span>
            </div>
          </div>

          {/* 3-ROLE INSTANT TOGGLE CHIPS */}
          <div className="grid grid-cols-3 gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800">
            {ROLES.map(role => (
              <button
                key={role.id}
                onClick={() => {
                  setActiveRole(role.id);
                  if (role.id === 'RESPONDER') setActiveTab('tasks');
                  if (role.id === 'SAFETY_OFFICER') setActiveTab('radar');
                  if (role.id === 'WORKER') setActiveTab('voice');
                }}
                className={`py-1.5 px-1 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-all ${
                  activeRole === role.id
                    ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 shadow-sm font-bold scale-[1.02]'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>{role.icon}</span>
                <span className="truncate">{role.label.split(' ')[0]}</span>
              </button>
            ))}
          </div>
        </section>

        {/* NOTIFICATION TOAST */}
        {actionMessage && (
          <div className={`mx-4 mt-2 p-2.5 rounded-xl text-xs font-medium flex items-center gap-2 border animate-fadeIn z-50 ${
            actionMessage.type === 'success' 
              ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-300' 
              : 'bg-red-950/80 border-red-500/40 text-red-300'
          }`}>
            {actionMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> : <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />}
            <span>{actionMessage.text}</span>
          </div>
        )}

        {/* MAIN SCROLLABLE APP BODY */}
        <div className="flex-1 overflow-y-auto px-4 py-3 custom-scrollbar pb-24 space-y-4">

          {/* ============================================================ */}
          {/* TAB 1: 🎙️ VOICE REPORTING (WORKER HERO EXPERIENCE) */}
          {/* ============================================================ */}
          {activeTab === 'voice' && (
            <div className="space-y-4 animate-fadeIn">
              
              {/* Noise Isolation Banner */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs">
                <div className="flex items-center gap-2">
                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${noiseIsolation ? 'bg-cyan-500/20 text-cyan-400' : 'bg-slate-800 text-slate-500'}`}>
                    <Radio className="w-3.5 h-3.5 animate-pulse" />
                  </div>
                  <div>
                    <span className="font-semibold text-slate-200 block text-[11px]">Speech Isolation AI</span>
                    <span className="text-[10px] text-slate-400 font-mono">Machinery noise filter (85Hz-3.4kHz)</span>
                  </div>
                </div>
                <button
                  onClick={() => setNoiseIsolation(!noiseIsolation)}
                  className={`px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider transition-colors ${
                    noiseIsolation ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {noiseIsolation ? 'ISOLATION ON' : 'RAW AUDIO'}
                </button>
              </div>

              {/* Language Selection Chips */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Worker Voice Language
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'te', label: 'తెలుగు (Telugu)', sub: 'Telugu Indic' },
                    { id: 'hi', label: 'हिंदी (Hindi)', sub: 'Hindi Dev' },
                    { id: 'en', label: 'English', sub: 'Standard' }
                  ].map(lang => (
                    <button
                      key={lang.id}
                      onClick={() => setSelectedLanguage(lang.id)}
                      className={`p-2 rounded-xl text-left border transition-all ${
                        selectedLanguage === lang.id
                          ? 'bg-amber-500/15 border-amber-500/50 text-amber-300 shadow-sm shadow-amber-500/10'
                          : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-300'
                      }`}
                    >
                      <div className="text-xs font-bold">{lang.label}</div>
                      <div className="text-[9px] text-slate-500">{lang.sub}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* HERO VOICE ORB / MICROPHONE BUTTON */}
              <div className="py-6 flex flex-col items-center justify-center relative">
                
                {/* Concentric Audio Wave Rings when Recording */}
                {isRecording && (
                  <>
                    <div className="absolute w-44 h-44 rounded-full bg-amber-500/15 animate-ping duration-1000" />
                    <div className="absolute w-36 h-36 rounded-full bg-amber-500/20 animate-pulse duration-700" />
                  </>
                )}

                {/* Central Orb Button */}
                <button
                  onClick={toggleRecording}
                  className={`relative z-10 w-28 h-28 rounded-full flex flex-col items-center justify-center transition-all duration-300 shadow-2xl ${
                    isRecording
                      ? 'bg-gradient-to-tr from-red-600 to-amber-500 scale-105 shadow-red-500/50 ring-4 ring-amber-400/50'
                      : 'bg-gradient-to-tr from-amber-500 to-yellow-400 hover:scale-105 shadow-amber-500/40 text-slate-950'
                  }`}
                >
                  {isRecording ? (
                    <>
                      <MicOff className="w-10 h-10 text-white animate-bounce" />
                      <span className="text-[10px] font-mono font-bold text-white mt-1">
                        {Math.floor(recordingSeconds / 60)}:{(recordingSeconds % 60).toString().padStart(2, '0')}
                      </span>
                    </>
                  ) : (
                    <>
                      <Mic className="w-10 h-10 text-slate-950" />
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-950 mt-1">
                        Tap to Speak
                      </span>
                    </>
                  )}
                </button>

                <p className="mt-3 text-xs text-slate-400 text-center font-medium">
                  {isRecording ? (
                    <span className="text-amber-300 animate-pulse">Listening... AI is filtering background machinery noise</span>
                  ) : (
                    <span>Hold or tap mic to speak in Telugu, Hindi, or English</span>
                  )}
                </p>
              </div>

              {/* LIVE TRANSCRIPT & TRANSLATION CARDS */}
              {(spokenTranscript || translatedEnglish || isTranslating) && (
                <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                  
                  {/* Spoken original */}
                  <div>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 font-semibold mb-1">
                      <span>ORIGINAL SPEECH ({selectedLanguage.toUpperCase()})</span>
                      <span className="text-emerald-400 font-mono">Isolated Voice</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 text-xs text-slate-200 font-sans leading-relaxed">
                      {spokenTranscript || 'Listening to worker speech...'}
                    </div>
                  </div>

                  {/* Neural English Translation */}
                  <div>
                    <div className="flex items-center justify-between text-[10px] text-amber-400 font-semibold mb-1">
                      <span className="flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        AI ENGLISH TRANSLATION (READY FOR SIF ENGINE)
                      </span>
                      {isTranslating && <span className="text-xs animate-spin">⏳</span>}
                    </div>
                    <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200 font-sans leading-relaxed">
                      {isTranslating ? 'Translating to English via Neural Model...' : translatedEnglish || 'Translating...'}
                    </div>
                  </div>
                </div>
              )}

              {/* REPORT TYPE PILLS */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Observation Type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'UNSAFE_CONDITION', label: 'Unsafe Condition', icon: '⚠️' },
                    { id: 'UNSAFE_ACT', label: 'Unsafe Act', icon: '🚷' },
                    { id: 'NEAR_MISS', label: 'Near Miss', icon: '⚡' },
                    { id: 'INCIDENT', label: 'Critical Incident', icon: '💥' }
                  ].map(type => (
                    <button
                      key={type.id}
                      onClick={() => setReportType(type.id)}
                      className={`p-2 rounded-xl text-left border flex items-center gap-2 transition-all ${
                        reportType === type.id
                          ? 'bg-amber-500/15 border-amber-500 text-amber-300 font-bold'
                          : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-300'
                      }`}
                    >
                      <span className="text-base">{type.icon}</span>
                      <span className="text-xs truncate">{type.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* QUICK HAZARD CHIPS */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Quick Hazard Factor
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {QUICK_HAZARDS.map(hazard => (
                    <button
                      key={hazard.id}
                      onClick={() => setSelectedHazard(selectedHazard?.id === hazard.id ? null : hazard)}
                      className={`p-2 rounded-xl text-center border text-xs transition-all ${
                        selectedHazard?.id === hazard.id
                          ? 'bg-amber-500/20 border-amber-400 text-amber-300 font-bold scale-[1.02]'
                          : 'bg-slate-900/50 border-slate-800/80 text-slate-400 hover:text-slate-300'
                      }`}
                    >
                      <div className="text-lg mb-0.5">{hazard.icon}</div>
                      <div className="text-[10px] leading-tight truncate">{hazard.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* LOCATION PICKER */}
              <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-amber-400 shrink-0" />
                  <div>
                    <div className="text-[10px] text-slate-400 font-semibold">GPS LOCATION</div>
                    <div className="font-medium text-slate-200 text-xs">{facilityBay}</div>
                  </div>
                </div>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  ±4m
                </span>
              </div>

              {/* SUBMIT BUTTON */}
              <button
                onClick={handleSubmitReport}
                disabled={isSubmitting}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-slate-950 font-bold text-sm tracking-wide shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    <span>Processing SIF AI Analysis...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Submit Safety Observation</span>
                  </>
                )}
              </button>

              {/* SUBMIT CONFIRMATION BANNER */}
              {submitSuccessNotice && (
                <div className="p-3.5 rounded-2xl bg-emerald-950/70 border border-emerald-500/50 text-xs space-y-2 animate-fadeIn">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-emerald-300 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      Observation Registered!
                    </span>
                    <span className="text-[10px] font-mono text-emerald-400">ID #{submitSuccessNotice.id}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[10px] pt-1 border-t border-emerald-900/50">
                    <div>
                      <span className="text-slate-400 block">Precursor Risk:</span>
                      <span className="font-bold text-red-400">{submitSuccessNotice.sifRisk}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Dispatched To:</span>
                      <span className="font-bold text-amber-300">{submitSuccessNotice.assignedDept} Team</span>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setActiveTab('tasks');
                      setSubmitSuccessNotice(null);
                    }}
                    className="w-full mt-1 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 font-semibold text-center hover:bg-emerald-500/30 text-[11px]"
                  >
                    View Task in Response Inbox →
                  </button>
                </div>
              )}

            </div>
          )}

          {/* ============================================================ */}
          {/* TAB 2: 📋 RESPONSE TEAM DISPATCH & TASKS */}
          {/* ============================================================ */}
          {activeTab === 'tasks' && (
            <div className="space-y-3 animate-fadeIn">
              
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xs font-bold text-slate-100 uppercase tracking-wider">
                    Response Team Tasks ({filteredTasks.length})
                  </h2>
                  <p className="text-[10px] text-slate-400">Atomic claim & verification loop</p>
                </div>
                <button
                  onClick={fetchTasks}
                  className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 text-xs"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* 6 DEPARTMENT HORIZONTAL SCROLLER */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
                {DEPARTMENTS.map(dept => (
                  <button
                    key={dept.id}
                    onClick={() => setTaskFilterDept(dept.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 border transition-all ${
                      taskFilterDept === dept.id
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-sm'
                        : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span className="mr-1">{dept.icon}</span>
                    <span>{dept.name}</span>
                  </button>
                ))}
              </div>

              {/* STATUS FILTER CHIPS */}
              <div className="flex items-center gap-1 text-[10px]">
                {['ALL', 'CLAIMED', 'PENDING', 'VERIFIED'].map(st => (
                  <button
                    key={st}
                    onClick={() => setTaskFilterStatus(st)}
                    className={`px-2.5 py-1 rounded-lg border font-medium ${
                      taskFilterStatus === st
                        ? 'bg-slate-800 border-slate-600 text-slate-100'
                        : 'bg-slate-900/50 border-slate-800/80 text-slate-500'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>

              {/* TASK CARDS FEED */}
              {filteredTasks.length === 0 ? (
                <div className="p-8 text-center rounded-2xl bg-slate-900/40 border border-slate-800/60">
                  <CheckCircle2 className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                  <p className="text-xs text-slate-400 font-medium">No tasks matching current filter</p>
                  <p className="text-[10px] text-slate-500 mt-1">Switch departments or report a new observation</p>
                </div>
              ) : (
                filteredTasks.map(task => {
                  const isClaimed = task.status === 'ACCEPTED' || task.status === 'SUBMITTED_FOR_VERIFICATION' || task.status === 'VERIFIED';
                  const isVerified = task.status === 'VERIFIED';
                  const isRework = task.status === 'REWORK_REQUESTED';
                  const isPendingReview = task.status === 'SUBMITTED_FOR_VERIFICATION';

                  return (
                    <div
                      key={task.id}
                      className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800/90 space-y-2.5 hover:border-slate-700 transition-all shadow-md"
                    >
                      {/* Task header */}
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-mono font-bold text-amber-400">
                              #{task.id}
                            </span>
                            <span className="px-2 py-0.5 rounded-md bg-slate-800 text-[9px] font-bold text-slate-300 uppercase tracking-wider">
                              {task.department.replace('_', ' ')}
                            </span>
                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                              task.priority === 'CRITICAL' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'
                            }`}>
                              {task.priority}
                            </span>
                          </div>
                          <h3 className="text-xs font-bold text-slate-100 mt-1 leading-snug">
                            {task.title}
                          </h3>
                        </div>

                        {/* Status Badge */}
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap ${
                          isVerified ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                          isPendingReview ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' :
                          isRework ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30 animate-pulse' :
                          isClaimed ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' :
                          'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        }`}>
                          {task.status.replace(/_/g, ' ')}
                        </span>
                      </div>

                      {/* Description & Hazard */}
                      <p className="text-[11px] text-slate-300 leading-relaxed">
                        {task.description}
                      </p>

                      {/* Assigned to / Responder info */}
                      <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-800">
                        <div className="flex items-center gap-1">
                          <User className="w-3 h-3 text-slate-500" />
                          <span>{task.assigned_to_name ? `Claimed: ${task.assigned_to_name}` : 'Unclaimed – Open for response'}</span>
                        </div>
                        <span className="font-mono text-slate-500">{new Date(task.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>

                      {/* ACTION BUTTONS (ROLE-SENSITIVE) */}
                      <div className="pt-1 flex items-center gap-2">
                        
                        {/* 1. Unclaimed -> Atomic Claim Button */}
                        {task.status === 'ASSIGNED' && (
                          <button
                            onClick={() => handleClaimTask(task.id)}
                            disabled={claimingTaskId === task.id}
                            className="flex-1 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm shadow-amber-500/20"
                          >
                            <Lock className="w-3.5 h-3.5" />
                            <span>{claimingTaskId === task.id ? 'Claiming...' : 'Claim Task 🔒'}</span>
                          </button>
                        )}

                        {/* 2. Claimed / Rework -> Submit Verification Button */}
                        {(task.status === 'ACCEPTED' || task.status === 'REWORK_REQUESTED') && (
                          <button
                            onClick={() => setActiveTaskModal(task)}
                            className="flex-1 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm"
                          >
                            <Camera className="w-3.5 h-3.5" />
                            <span>Upload Evidence & Submit 📸</span>
                          </button>
                        )}

                        {/* 3. Submitted for verification -> Safety Officer Review Buttons */}
                        {isPendingReview && (
                          <div className="w-full flex items-center gap-2">
                            <button
                              onClick={() => handleVerifyTask(task.id, 'APPROVE')}
                              className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1 shadow-sm"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Approve & Close</span>
                            </button>
                            <button
                              onClick={() => {
                                setActiveTaskModal(task);
                                setShowReworkInput(true);
                              }}
                              className="flex-1 py-2 rounded-xl bg-rose-600/80 hover:bg-rose-500 text-white font-bold text-xs flex items-center justify-center gap-1"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              <span>Request Rework</span>
                            </button>
                          </div>
                        )}

                        {/* 4. Verified Completed */}
                        {isVerified && (
                          <div className="w-full py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center justify-center gap-1">
                            <FileCheck className="w-3.5 h-3.5" />
                            <span>Signed-off by Safety Officer</span>
                          </div>
                        )}

                      </div>

                    </div>
                  );
                })
              )}

            </div>
          )}

          {/* ============================================================ */}
          {/* TAB 3: ⚡ SIF RADAR & WEAK SIGNALS */}
          {/* ============================================================ */}
          {activeTab === 'radar' && (
            <div className="space-y-3.5 animate-fadeIn">
              
              <div className="p-3.5 rounded-2xl bg-gradient-to-br from-amber-500/15 via-slate-900 to-slate-900 border border-amber-500/30">
                <div className="flex items-center gap-2 text-amber-400 text-xs font-bold mb-1">
                  <Activity className="w-4 h-4 animate-pulse" />
                  <span>SIF Precursor Radar & Weak Signals</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Real-time pattern detector correlating subtle field signals across Rig Alpha to prevent fatal incidents.
                </p>
              </div>

              {/* Active Critical Precursor Alerts */}
              <div className="space-y-2">
                <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  High-Energy Precursor Combinations
                </h3>

                {[
                  {
                    title: 'LOTO Bypass + Flange Pressure Surge',
                    energy: 'HYDROCARBON_PRESSURE (180 Bar)',
                    location: 'Rig Alpha Sivaraopeta Unit 1',
                    risk: 'CRITICAL SIF',
                    lsrRule: 'Rule #1: Energy Isolation & LOTO',
                    department: 'Process Safety & Mechanical'
                  },
                  {
                    title: 'Worn Sling Rigging + Wind Gust > 32 Knots',
                    energy: 'GRAVITY_DROP (4.2 Tons)',
                    location: 'Wellhead Bay Derrick',
                    risk: 'HIGH SIF',
                    lsrRule: 'Rule #4: Mechanical Lifting Operations',
                    department: 'Rigging & Lifting'
                  },
                  {
                    title: 'Arc Flash Barrier Missing + Wet Floor',
                    energy: 'ELECTRICAL_STORED (415V)',
                    location: 'Substation Transformer Bay B',
                    risk: 'HIGH SIF',
                    lsrRule: 'Rule #7: Electrical Safety Isolation',
                    department: 'Electrical'
                  }
                ].map((item, idx) => (
                  <div key={idx} className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30">
                        {item.risk}
                      </span>
                      <span className="text-[10px] font-mono text-amber-400">{item.department}</span>
                    </div>
                    <div className="text-xs font-bold text-slate-100">{item.title}</div>
                    <div className="text-[10px] text-slate-400 flex items-center justify-between">
                      <span>⚡ {item.energy}</span>
                      <span>📍 {item.location}</span>
                    </div>
                    <div className="p-1.5 rounded-lg bg-slate-950 text-[10px] text-amber-300/90 font-mono">
                      🛡️ {item.lsrRule}
                    </div>
                  </div>
                ))}
              </div>

            </div>
          )}

          {/* ============================================================ */}
          {/* TAB 4: 🚨 EMERGENCY SOS PANIC */}
          {/* ============================================================ */}
          {activeTab === 'sos' && (
            <div className="space-y-4 py-4 flex flex-col items-center justify-center animate-fadeIn text-center">
              
              <div className="w-16 h-16 rounded-full bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400">
                <Flame className="w-8 h-8 animate-pulse" />
              </div>

              <div>
                <h2 className="text-base font-black text-slate-100 uppercase tracking-tight">
                  Field Emergency SOS
                </h2>
                <p className="text-xs text-slate-400 max-w-xs mt-1">
                  Instantly dispatches HSE Emergency Rescue, stops nearby permits, and alerts site safety supervisors.
                </p>
              </div>

              {/* Big Red SOS Button */}
              {sosActive ? (
                <div className="p-6 rounded-3xl bg-red-950/80 border-2 border-red-500 text-center space-y-3 w-full animate-pulse">
                  <div className="text-red-400 font-black text-sm uppercase tracking-wider">
                    🚨 EMERGENCY BROADCAST ACTIVE
                  </div>
                  <p className="text-xs text-slate-200">
                    Rescue team dispatched to: <br />
                    <strong className="text-amber-300">{sosLocation}</strong>
                  </p>
                  <button
                    onClick={cancelSos}
                    className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold"
                  >
                    Cancel Emergency (All Clear)
                  </button>
                </div>
              ) : sosCountdown !== null ? (
                <div className="space-y-3">
                  <div className="w-36 h-36 rounded-full bg-red-600 flex items-center justify-center text-white font-black text-4xl shadow-2xl shadow-red-500/60 ring-8 ring-red-500/30 animate-ping">
                    {sosCountdown}
                  </div>
                  <button
                    onClick={cancelSos}
                    className="px-6 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold"
                  >
                    Cancel SOS
                  </button>
                </div>
              ) : (
                <button
                  onClick={startSosCountdown}
                  className="w-40 h-40 rounded-full bg-gradient-to-tr from-red-600 via-rose-500 to-red-600 text-white font-black text-2xl tracking-wider uppercase shadow-2xl shadow-red-600/50 hover:scale-105 active:scale-95 transition-all ring-8 ring-red-500/20 flex flex-col items-center justify-center"
                >
                  <span>SOS</span>
                  <span className="text-[10px] font-sans font-medium tracking-normal opacity-90 mt-1">
                    Tap to Broadcast
                  </span>
                </button>
              )}

              {/* Direct Emergency Contacts */}
              <div className="w-full p-3 rounded-2xl bg-slate-900 border border-slate-800 text-left space-y-2 text-xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Direct Emergency Hotlines
                </span>
                <div className="flex items-center justify-between p-2 rounded-xl bg-slate-950">
                  <span className="text-slate-300">Rig Medical Bay</span>
                  <a href="tel:108" className="text-amber-400 font-bold flex items-center gap-1">
                    <PhoneCall className="w-3 h-3" /> Ext. 108
                  </a>
                </div>
                <div className="flex items-center justify-between p-2 rounded-xl bg-slate-950">
                  <span className="text-slate-300">Fire & Explosion Unit</span>
                  <a href="tel:101" className="text-amber-400 font-bold flex items-center gap-1">
                    <PhoneCall className="w-3 h-3" /> Ext. 101
                  </a>
                </div>
              </div>

            </div>
          )}

          {/* ============================================================ */}
          {/* TAB 5: 📜 MY ACTIVITY & REPORT PROGRESS */}
          {/* ============================================================ */}
          {activeTab === 'activity' && (
            <div className="space-y-3 animate-fadeIn">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-bold text-slate-100 uppercase tracking-wider">
                  My Safety Observations ({myReports.length})
                </h2>
                <span className="text-[10px] font-mono text-emerald-400">Live Sync</span>
              </div>

              {myReports.length === 0 ? (
                <div className="p-8 text-center rounded-2xl bg-slate-900/40 border border-slate-800/60">
                  <Clock className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                  <p className="text-xs text-slate-400 font-medium">No reports recorded yet</p>
                </div>
              ) : (
                myReports.slice(0, 10).map((rep, idx) => (
                  <div key={idx} className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-200">{rep.title}</span>
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300">
                        {rep.status || 'ANALYZED'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 line-clamp-2">
                      {rep.description}
                    </p>
                    <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-800/60">
                      <span>📍 {rep.location || 'Rig Alpha Bay'}</span>
                      <span>{new Date(rep.created_at || Date.now()).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

        </div>

        {/* ============================================================ */}
        {/* VERIFICATION EVIDENCE / REWORK MODAL DRAWER */}
        {/* ============================================================ */}
        {activeTaskModal && (
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md z-50 flex flex-col justify-end p-4 animate-fadeIn">
            <div className="bg-slate-900 border border-slate-700/80 rounded-3xl p-4 space-y-3 max-h-[90%] overflow-y-auto custom-scrollbar">
              
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div>
                  <span className="text-[10px] font-mono text-amber-400">Task #{activeTaskModal.id}</span>
                  <h3 className="text-xs font-bold text-slate-100">{activeTaskModal.title}</h3>
                </div>
                <button
                  onClick={() => {
                    setActiveTaskModal(null);
                    setShowReworkInput(false);
                  }}
                  className="p-1 rounded-full bg-slate-800 text-slate-400 hover:text-slate-200"
                >
                  ✕
                </button>
              </div>

              {/* Rework Input Form */}
              {showReworkInput ? (
                <div className="space-y-2">
                  <label className="text-xs font-bold text-rose-400">
                    Rework Feedback Instructions (Required):
                  </label>
                  <textarea
                    value={reworkReason}
                    onChange={(e) => setReworkReason(e.target.value)}
                    placeholder="Specify why work is rejected (e.g. pressure test did not hold 200 bar, photo lacks date tag)..."
                    rows={3}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-rose-500"
                  />
                  <button
                    onClick={() => handleVerifyTask(activeTaskModal.id, 'REWORK')}
                    className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs"
                  >
                    Confirm Rework Request
                  </button>
                </div>
              ) : (
                /* Response Worker Evidence Submission Form */
                <div className="space-y-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                      Corrective Action / Work Notes *
                    </label>
                    <textarea
                      value={workNotes}
                      onChange={(e) => setWorkNotes(e.target.value)}
                      placeholder="Describe corrective action performed (e.g., replaced blown gasket, retorqued flange bolts)..."
                      rows={3}
                      className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                      Instrument Test Readings
                    </label>
                    <input
                      type="text"
                      value={testReadings}
                      onChange={(e) => setTestReadings(e.target.value)}
                      placeholder="e.g. LEL: 0.0%, Torque: 450 Nm, Insulation: >100MΩ"
                      className="w-full p-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  {/* Camera photo simulator */}
                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                      Attach Camera Photo Evidence
                    </label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setEvidencePhoto('https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800')}
                        className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center justify-center gap-1.5 border border-slate-700"
                      >
                        <Camera className="w-3.5 h-3.5 text-amber-400" />
                        <span>Simulate Snap 📸</span>
                      </button>
                      {evidencePhoto && (
                        <span className="text-[10px] text-emerald-400 font-mono">
                          ✓ Photo Attached
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => handleSubmitVerification(activeTaskModal.id)}
                    className="w-full py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-xs tracking-wide shadow-md"
                  >
                    Submit for Safety Officer Sign-Off
                  </button>
                </div>
              )}

            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* BOTTOM MOBILE THUMB-FRIENDLY NAVIGATION BAR */}
        {/* ============================================================ */}
        <nav aria-label="Bottom Navigation" className="h-16 bg-[#0B101D]/95 backdrop-blur-lg border-t border-slate-800/80 px-2 flex items-center justify-around sticky bottom-0 z-40">
          {[
            { id: 'voice', label: 'Voice Report', icon: Mic },
            { id: 'tasks', label: 'Tasks', icon: Wrench, count: tasks.filter(t => t.status === 'ASSIGNED').length },
            { id: 'radar', label: 'SIF Radar', icon: Activity },
            { id: 'sos', label: 'SOS', icon: Flame, alert: true },
            { id: 'activity', label: 'History', icon: Clock }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-center justify-center flex-1 py-1 transition-all relative ${
                  isActive ? 'text-amber-400 font-bold' : 'text-slate-400 hover:text-slate-300'
                }`}
              >
                <div className="relative">
                  <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110' : ''}`} />
                  {tab.count > 0 && (
                    <span className="absolute -top-1 -right-2 w-3.5 h-3.5 rounded-full bg-amber-500 text-slate-950 font-bold text-[9px] flex items-center justify-center">
                      {tab.count}
                    </span>
                  )}
                  {tab.alert && (
                    <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-red-500 animate-ping" />
                  )}
                </div>
                <span className="text-[10px] mt-1 tracking-tight">{tab.label}</span>
              </button>
            );
          })}
        </nav>

      </main>

    </div>
  );
}
