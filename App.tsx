
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Activity,
  Users,
  Clock,
  Search,
  Bell,
  Heart,
  Upload,
  ArrowRight,
  TrendingUp,
  Brain,
  Play,
  Square,
  ShieldAlert
} from 'lucide-react';
import { Patient, UrgencyLevel, TriageStats } from './types';
import {
  SEVERITY_MAP,
  getUrgencyFromScore,
  URGENCY_COLORS,
  URGENCY_ICONS
} from './constants';
import { EcgVisualizer } from './components/EcgVisualizer';
import { analyzeEcg, generateClinicalInsight, generateSimulatedPatient } from './services/grokService';

const MOCK_NAMES = ['Robert Johnson', 'Elena Gilbert', 'Michael Chen', 'Sarah Parker', 'James Wilson', 'David Miller', 'Linda Thompson', 'Maria Garcia', 'Christopher Lee', 'Karen White'];
const MOCK_DEVICES = ['GE MAC-5500', 'Schiller Cardiovit', 'Philips PageWriter', 'Nihon Kohden'];

const INITIAL_PATIENTS: Patient[] = [
  {
    id: 'P-9842',
    name: 'Robert Johnson',
    age: 64,
    gender: 'M',
    recordingTime: '2 mins ago',
    device: 'GE MAC-5500',
    urgencyScore: 10,
    detectedConditions: ['AMI', 'STACH'],
    level: UrgencyLevel.CRITICAL,
  }
];

const App: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>(INITIAL_PATIENTS);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(INITIAL_PATIENTS[0]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSimulating, setIsSimulating] = useState(false);
  const [lastCriticalAlert, setLastCriticalAlert] = useState<string | null>(null);
  const [currentTab, setCurrentTab] = useState<'queue' | 'patients'>('queue');
  const [analysisProgress, setAnalysisProgress] = useState(0);

  // Simulation Engine: Adds a new patient every 3 seconds for high-speed triage demo
  useEffect(() => {
    let interval: number | undefined;
    if (isSimulating) {
      interval = window.setInterval(async () => {
        const dynamicPatient = await generateSimulatedPatient();

        let newPatient: Patient;
        if (dynamicPatient) {
          newPatient = {
            id: `P-${Math.floor(1000 + Math.random() * 9000)}`,
            ...dynamicPatient,
            recordingTime: 'Just now',
            level: getUrgencyFromScore(dynamicPatient.urgencyScore),
            notes: await generateClinicalInsight(dynamicPatient.detectedConditions)
          };
        } else {
          // Fallback logic
          const name = MOCK_NAMES[Math.floor(Math.random() * MOCK_NAMES.length)];
          const codes = Object.keys(SEVERITY_MAP);
          const randomCodes = [codes[Math.floor(Math.random() * codes.length)]];
          if (Math.random() > 0.6) randomCodes.push(codes[Math.floor(Math.random() * codes.length)]);
          const maxScore = Math.max(...randomCodes.map(c => SEVERITY_MAP[c]?.severity || 0));
          newPatient = {
            id: `P-${Math.floor(1000 + Math.random() * 9000)}`,
            name: `${name} (Sim)`,
            age: Math.floor(18 + Math.random() * 75),
            gender: Math.random() > 0.5 ? 'M' : 'F',
            recordingTime: 'Just now',
            device: MOCK_DEVICES[Math.floor(Math.random() * MOCK_DEVICES.length)],
            urgencyScore: maxScore,
            detectedConditions: randomCodes,
            level: getUrgencyFromScore(maxScore),
            notes: `Simulated high-speed entry. Conditions: ${randomCodes.map(c => SEVERITY_MAP[c]?.name).join(', ')}.`
          };
        }

        if (newPatient.level === UrgencyLevel.CRITICAL) {
          setLastCriticalAlert(newPatient.name);
          setTimeout(() => setLastCriticalAlert(null), 2500);
        }

        setPatients(prev => [newPatient, ...prev].slice(0, 20)); // Keep a larger buffer for 3s speed
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [isSimulating]);

  const stats: TriageStats = useMemo(() => ({
    criticalCount: patients.filter(p => p.level === UrgencyLevel.CRITICAL).length,
    urgentCount: patients.filter(p => p.level === UrgencyLevel.URGENT).length,
    monitorCount: patients.filter(p => p.level === UrgencyLevel.MONITOR).length,
    stableCount: patients.filter(p => p.level === UrgencyLevel.STABLE).length,
    avgResponseTime: "42s"
  }), [patients]);

  const sortedPatients = useMemo(() => {
    return [...patients]
      .filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.id.includes(searchQuery))
      .sort((a, b) => b.urgencyScore - a.urgencyScore);
  }, [patients, searchQuery]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setIsAnalyzing(true);
    setAnalysisProgress(0);

    // Progress Simulation (4 seconds)
    const startTime = Date.now();
    const duration = 4000;
    const progressInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(95, Math.floor((elapsed / duration) * 100));
      setAnalysisProgress(progress);
    }, 100);

    try {
      const imageDataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const analysis = await analyzeEcg(imageDataUrl);

      let maxSeverity = 0;
      analysis.detectedConditions.forEach((code: string) => {
        const sev = SEVERITY_MAP[code]?.severity || 0;
        if (sev > maxSeverity) maxSeverity = sev;
      });

      const newPatient: Patient = {
        id: `P-${Math.floor(1000 + Math.random() * 9000)}`,
        name: 'Direct ECG Upload',
        age: 58, gender: 'F', recordingTime: 'Just now', device: 'Handheld Scan',
        urgencyScore: maxSeverity,
        detectedConditions: analysis.detectedConditions,
        level: getUrgencyFromScore(maxSeverity),
        heartRate: analysis.heartRate,
        confidence: analysis.confidence,
        notes: `${analysis.primaryFinding}. Physician Recommendations: ${analysis.recommendations.join(', ')}`
      };

      // Ensure at least 4 seconds have passed for the coherent loading experience
      const remainingTime = duration - (Date.now() - startTime);
      if (remainingTime > 0) {
        await new Promise(r => setTimeout(r, remainingTime));
      }

      clearInterval(progressInterval);
      setAnalysisProgress(100);

      setPatients(prev => [newPatient, ...prev]);
      setSelectedPatient(newPatient);

      setTimeout(() => {
        setIsAnalyzing(false);
        setAnalysisProgress(0);
      }, 600);

    } catch (e: any) {
      clearInterval(progressInterval);
      setAnalysisProgress(0);
      setIsAnalyzing(false);
      alert("Analysis failed: " + (e.message || "Unknown error"));
    }
  };

  const handleTraumaTriage = () => {
    if (!selectedPatient) return;
    alert(`Initiating Immediate Trauma Triage for ${selectedPatient.name}. Alerting emergency response team.`);
  };

  const handlePhysicianConsult = async () => {
    if (!selectedPatient) return;
    alert(`Paging cardiologist on call for consultation on ${selectedPatient.name}.`);
  };

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans select-none">
      {/* Sidebar */}
      <aside className="w-16 md:w-64 border-r border-slate-800 bg-slate-900/50 flex flex-col py-6 shrink-0 transition-all">
        <div className="px-6 mb-8 flex items-center gap-3">
          <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center shadow-lg shadow-red-900/40">
            <Heart className="text-white w-5 h-5 fill-current" />
          </div>
          <span className="hidden md:block font-bold text-lg tracking-tight">CardioTriage</span>
        </div>

        <nav className="flex-1 px-3 space-y-2">
          <button
            onClick={() => setCurrentTab('queue')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-slate-100 border transition-all ${currentTab === 'queue' ? 'bg-slate-800 border-slate-700/50' : 'text-slate-400 hover:bg-slate-800 border-transparent'}`}
          >
            <Activity className="w-5 h-5" />
            <span className="hidden md:block">Active Queue</span>
          </button>
          <button
            onClick={() => setCurrentTab('patients')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-slate-400 hover:bg-slate-800 transition-all group ${currentTab === 'patients' ? 'bg-slate-800 border-slate-700/50 text-slate-100' : 'border-transparent'}`}
          >
            <Users className="w-5 h-5 group-hover:text-white" />
            <span className="hidden md:block group-hover:text-white">Patient Lists</span>
          </button>

          <div className="pt-6 pb-2 px-3">
            <p className="hidden md:block text-[10px] font-black text-slate-600 uppercase tracking-widest mb-3 px-1">Rapid Simulation (3s)</p>
            <button
              onClick={() => setIsSimulating(!isSimulating)}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl border transition-all duration-300 ${isSimulating ? 'bg-red-500/10 border-red-500 text-red-400 shadow-lg shadow-red-900/10' : 'bg-slate-800/30 border-slate-700 text-slate-400 hover:text-white'}`}
            >
              {isSimulating ? <Square className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
              <span className="hidden md:block text-sm font-bold">{isSimulating ? 'Stop Stream' : 'Start Stream'}</span>
            </button>
          </div>
        </nav>

        <div className="px-3">
          <label className={`cursor-pointer w-full flex items-center justify-center gap-2 bg-white hover:bg-slate-200 text-slate-950 font-bold px-4 py-4 rounded-xl transition-all shadow-xl shadow-white/5 active:scale-95 ${isAnalyzing ? 'opacity-50 pointer-events-none' : ''}`}>
            {isAnalyzing ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-slate-950"></div> : <Upload className="w-4 h-4" />}
            <span className="hidden md:block">{isAnalyzing ? 'Processing...' : 'Analyze ECG'}</span>
            <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} disabled={isAnalyzing} />
          </label>

          {isAnalyzing && (
            <div className="mt-4 px-1 animate-in fade-in slide-in-from-top-2">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Clinical Diagnostic Pipeline</span>
                <span className="text-[10px] font-bold text-slate-400">{analysisProgress}%</span>
              </div>
              <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden border border-slate-700/50">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all duration-300 ease-out shadow-[0_0_8px_rgba(59,130,246,0.5)]"
                  style={{ width: `${analysisProgress}%` }}
                ></div>
              </div>
              <p className="mt-2 text-[9px] text-slate-600 font-medium italic text-center">Applying cardiological morphological filters...</p>
            </div>
          )}
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden relative">
        {/* Critical Alert Banner */}
        {lastCriticalAlert && (
          <div className="absolute top-20 left-1/2 -translate-x-1/2 z-50 animate-bounce">
            <div className="bg-red-600 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 border-2 border-white/20">
              <ShieldAlert className="w-5 h-5" />
              <span className="font-black text-sm uppercase tracking-tighter">CRITICAL ADMISSION: {lastCriticalAlert}</span>
            </div>
          </div>
        )}

        <header className="h-16 border-b border-slate-800 flex items-center justify-between px-6 bg-slate-950/80 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center gap-4 bg-slate-900/50 rounded-full px-4 py-2 border border-slate-800 w-full max-w-md focus-within:border-slate-600 transition-colors">
            <Search className="w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search by ID, Diagnosis or Level..."
              className="bg-transparent border-none focus:outline-none text-sm w-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          {isSimulating && (
            <div className="flex items-center gap-2 px-4 py-1.5 bg-red-500/10 rounded-full border border-red-500/30">
              <span className="w-2 h-2 bg-red-500 rounded-full animate-ping"></span>
              <span className="text-[10px] font-black text-red-500 uppercase tracking-widest">3S High-Speed Stream</span>
            </div>
          )}
        </header>

        <div className="flex-1 flex overflow-hidden">
          {/* Animated Queue */}
          <div className="w-full md:w-[400px] border-r border-slate-800 flex flex-col shrink-0 bg-slate-950">
            <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/20">
              <h2 className="text-xs font-black uppercase tracking-widest text-slate-500">Triage Sorting: Sickest First</h2>
              <span className="text-[10px] font-bold bg-slate-800 px-2 py-0.5 rounded text-slate-400">
                {sortedPatients.length} Active
              </span>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-slate-800/30 scrollbar-thin scrollbar-thumb-slate-800">
              {sortedPatients.map((patient) => (
                <button
                  key={patient.id}
                  onClick={() => setSelectedPatient(patient)}
                  className={`w-full p-5 flex flex-col gap-3 text-left transition-all duration-700 hover:bg-slate-900/40 ${selectedPatient?.id === patient.id ? 'bg-slate-900/80 ring-1 ring-inset ring-slate-700/50 border-l-4 border-l-red-500' : 'border-l-4 border-l-transparent'}`}
                >
                  <div className="flex justify-between items-start w-full">
                    <div>
                      <h3 className="font-bold text-slate-100 flex items-center gap-2">
                        {patient.name}
                        {patient.recordingTime === 'Just now' && <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>}
                      </h3>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">ID: {patient.id} • {patient.age}y • {patient.gender}</p>
                    </div>
                    <div className={`px-2 py-1 rounded text-[10px] font-black uppercase border transition-all duration-700 ${URGENCY_COLORS[patient.level]}`}>
                      {patient.level}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {patient.detectedConditions.map(code => (
                      <span key={code} className={`text-[10px] font-bold px-2 py-0.5 rounded border transition-colors ${SEVERITY_MAP[code]?.severity >= 8 ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-slate-800 text-slate-400 border-slate-700'}`}>
                        {code}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-bold uppercase">
                      <Clock className="w-3 h-3" />
                      {patient.recordingTime}
                    </div>
                    <div className="text-[10px] font-mono font-black text-slate-300 px-2 py-0.5 bg-slate-800 rounded">
                      SEV: {patient.urgencyScore}.0
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Details & Clinical Insights */}
          <div className="flex-1 flex flex-col bg-slate-900/5 overflow-y-auto">
            {selectedPatient ? (
              <div className="p-8 max-w-5xl mx-auto w-full space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 bg-slate-900/60 p-8 rounded-3xl border border-slate-800 backdrop-blur-xl shadow-2xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-red-600/5 blur-3xl rounded-full -mr-16 -mt-16 group-hover:bg-red-600/10 transition-all"></div>
                  <div className="flex gap-6 relative z-10">
                    <div className="w-20 h-20 rounded-2xl bg-slate-800 flex items-center justify-center shrink-0 border border-slate-700 shadow-inner">
                      <Users className="w-10 h-10 text-slate-400" />
                    </div>
                    <div className="flex flex-col justify-center">
                      <h1 className="text-3xl font-black tracking-tighter mb-1">
                        {selectedPatient.name}
                      </h1>
                      <div className="flex items-center gap-4 text-xs font-black text-slate-500 uppercase tracking-widest">
                        <span>DOB: 02/05/1971</span>
                        <span>•</span>
                        <span>{selectedPatient.device}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-4 relative z-10">
                    <div className={`flex flex-col items-center justify-center p-4 rounded-2xl border min-w-[140px] shadow-lg ${URGENCY_COLORS[selectedPatient.level]}`}>
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] mb-2 opacity-80">Triage Status</span>
                      <div className="flex items-center gap-2">
                        {URGENCY_ICONS[selectedPatient.level]}
                        <span className="text-lg font-black">{selectedPatient.level}</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-slate-950 border border-slate-800 min-w-[100px] shadow-lg">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2">Severity</span>
                      <span className="text-3xl font-mono font-black text-white">{selectedPatient.urgencyScore}</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  <div className="lg:col-span-8 space-y-8">
                    <div className="bg-slate-900/60 p-6 rounded-3xl border border-slate-800 shadow-xl">
                      <div className="flex justify-between items-center mb-8 px-2">
                        <h3 className="font-black text-xs uppercase tracking-[0.3em] text-slate-500 flex items-center gap-3">
                          <Activity className="w-4 h-4 text-red-500" />
                          Diagnostic Lead II Stream
                        </h3>
                        <div className="flex gap-6">
                          <div className="text-right">
                            <p className="text-[10px] text-slate-500 font-black uppercase mb-1">Rate</p>
                            <p className="text-xl font-black text-emerald-400">{selectedPatient.heartRate || 72} <span className="text-xs font-normal">BPM</span></p>
                          </div>
                          <div className="text-right">
                            <p className="text-[10px] text-slate-500 font-black uppercase mb-1">Confidence</p>
                            <p className="text-xl font-black text-indigo-400">{((selectedPatient.confidence || 0.95) * 100).toFixed(1)}<span className="text-xs font-normal">%</span></p>
                          </div>
                        </div>
                      </div>
                      <EcgVisualizer heartRate={selectedPatient.heartRate} urgency={selectedPatient.level} />
                    </div>

                    <div className="bg-slate-900/60 p-8 rounded-3xl border border-slate-800 shadow-xl">
                      <h3 className="font-black text-xs uppercase tracking-[0.3em] text-slate-500 mb-8 flex items-center gap-3">
                        <Brain className="w-4 h-4 text-indigo-400" />
                        AI Clinical Validation
                      </h3>
                      <div className="space-y-6">
                        <div className="p-6 rounded-2xl bg-slate-950/40 border border-slate-800/60">
                          <p className="text-md text-slate-200 leading-relaxed font-medium italic">
                            "{selectedPatient.notes || "Algorithm detected ST-segment elevations consistent with Acute Myocardial Infarction. Immediate clinical intervention is advised as per the Sickest-First triage protocol. Thresholding optimized for maximum recall of Level 4 conditions."}"
                          </p>
                        </div>
                        <div className="flex items-center gap-4 px-2">
                          <div className="flex -space-x-3">
                            {[1, 2, 3, 4].map(i => <div key={i} className={`w-8 h-8 rounded-full border-2 border-slate-900 ${i === 1 ? 'bg-red-500' : 'bg-slate-700'}`}></div>)}
                          </div>
                          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Validated via PTB-XL Neural Engine</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="lg:col-span-4 space-y-6">
                    <div className="bg-slate-900/60 p-8 rounded-3xl border border-slate-800 shadow-xl">
                      <h3 className="font-black text-xs uppercase tracking-[0.3em] text-slate-500 mb-6">SCP Findings</h3>
                      <div className="space-y-3">
                        {selectedPatient.detectedConditions.map(code => (
                          <div key={code} className="flex flex-col p-4 rounded-xl bg-slate-800/40 border border-slate-700/50 hover:border-slate-500 transition-colors group">
                            <div className="flex justify-between items-center mb-1">
                              <span className="font-black text-sm group-hover:text-white transition-colors">{code}</span>
                              <span className={`text-[10px] font-black px-2 py-0.5 rounded ${SEVERITY_MAP[code]?.severity >= 8 ? 'bg-red-500/20 text-red-400' : 'bg-slate-700 text-slate-400'}`}>
                                SEV {SEVERITY_MAP[code]?.severity}.0
                              </span>
                            </div>
                            <span className="text-[10px] font-bold text-slate-500 uppercase leading-none">{SEVERITY_MAP[code]?.name || 'Diagnostic Condition'}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="pt-4 space-y-4">
                      <button
                        onClick={handleTraumaTriage}
                        className="w-full py-5 bg-red-600 hover:bg-red-700 text-white font-black rounded-2xl shadow-2xl shadow-red-900/30 flex items-center justify-center gap-3 group transition-all active:scale-95 uppercase tracking-tighter"
                      >
                        <ShieldAlert className="w-5 h-5" />
                        Immediate Trauma Triage
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                      </button>
                      <button
                        onClick={handlePhysicianConsult}
                        className="w-full py-5 bg-slate-800 hover:bg-slate-700 text-white font-black rounded-2xl border border-slate-700 text-xs uppercase tracking-widest transition-all"
                      >
                        Physician Consultation
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-500 p-12 text-center space-y-6">
                <div className="w-32 h-32 rounded-full bg-slate-900/50 flex items-center justify-center border border-slate-800 shadow-inner">
                  <Activity className="w-16 h-16 text-slate-800" />
                </div>
                <div className="max-w-sm">
                  <h3 className="text-2xl font-black text-slate-400 tracking-tighter mb-2">STANDBY FOR ADMISSION</h3>
                  <p className="text-sm font-medium text-slate-600">The high-speed triage engine is monitoring all incoming streams. Start the simulation to see real-time patient prioritization.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Real-time Dashboard Summary Overlay */}
      <div className="hidden xl:flex fixed bottom-8 left-1/2 -translate-x-1/2 bg-slate-950/80 backdrop-blur-2xl border border-slate-800 px-8 py-4 rounded-3xl shadow-2xl items-center gap-8 z-30 ring-1 ring-white/5">
        <div className="flex items-center gap-3 group">
          <div className="w-3 h-3 rounded-full bg-red-500 animate-ping group-hover:scale-125 transition-transform"></div>
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">Critical</span>
            <span className="text-xl font-black text-white leading-none">{stats.criticalCount}</span>
          </div>
        </div>
        <div className="w-[1px] h-8 bg-slate-800"></div>
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-orange-500"></div>
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">Urgent</span>
            <span className="text-xl font-black text-white leading-none">{stats.urgentCount}</span>
          </div>
        </div>
        <div className="w-[1px] h-8 bg-slate-800"></div>
        <div className="flex items-center gap-3">
          <Clock className="w-5 h-5 text-indigo-400" />
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">Mean Triage</span>
            <span className="text-xl font-black text-indigo-400 leading-none">{stats.avgResponseTime}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
