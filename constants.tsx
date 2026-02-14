
import React from 'react';
import { Diagnosis, UrgencyLevel } from './types';
import { AlertTriangle, Activity, CheckCircle, ShieldAlert } from 'lucide-react';

export const SEVERITY_MAP: Record<string, Diagnosis> = {
  // LEVEL 4: CRITICAL (Severity 8-10)
  'AMI': { code: 'AMI', name: 'Acute Myocardial Infarction', severity: 10 },
  'IMI': { code: 'IMI', name: 'Inferior Myocardial Infarction', severity: 10 },
  'ASMI': { code: 'ASMI', name: 'Anteroseptal Myocardial Infarction', severity: 10 },
  'ALMI': { code: 'ALMI', name: 'Anterolateral Myocardial Infarction', severity: 10 },
  'ILMI': { code: 'ILMI', name: 'Inferolateral Myocardial Infarction', severity: 10 },
  'AFIB': { code: 'AFIB', name: 'Atrial Fibrillation', severity: 9 },
  'SVT': { code: 'SVT', name: 'Supraventricular Tachycardia', severity: 9 },
  'AFLT': { code: 'AFLT', name: 'Atrial Flutter', severity: 9 },
  'DIG': { code: 'DIG', name: 'Digitalis Effect (Severe)', severity: 8 },
  'LAFB': { code: 'LAFB', name: 'Left Anterior Fascicular Block', severity: 8 },
  
  // LEVEL 3: URGENT (Severity 5-7)
  'STACH': { code: 'STACH', name: 'Sinus Tachycardia', severity: 7 },
  'PVC': { code: 'PVC', name: 'Premature Ventricular Contraction', severity: 7 },
  'PAC': { code: 'PAC', name: 'Premature Atrial Contraction', severity: 7 },
  'LPRSE': { code: 'LPRSE', name: 'Low Prob. Septal Infarct', severity: 7 },
  'LVH': { code: 'LVH', name: 'Left Ventricular Hypertrophy', severity: 6 },
  'RVH': { code: 'RVH', name: 'Right Ventricular Hypertrophy', severity: 6 },
  'CRBBB': { code: 'CRBBB', name: 'Complete Right Bundle Branch Block', severity: 6 },
  'CLBBB': { code: 'CLBBB', name: 'Complete Left Bundle Branch Block', severity: 6 },
  
  // LEVEL 2: MONITOR (Severity 3-4)
  'SBRAD': { code: 'SBRAD', name: 'Sinus Bradycardia', severity: 4 },
  '1AVB': { code: '1AVB', name: 'First Degree AV Block', severity: 4 },
  'IRBBB': { code: 'IRBBB', name: 'Incomplete Right Bundle Branch Block', severity: 4 },
  'IVCD': { code: 'IVCD', name: 'Non-specific Intraventricular Conduction Delay', severity: 4 },
  'LVOLT': { code: 'LVOLT', name: 'Low Voltage QRS', severity: 3 },
  'QT': { code: 'QT', name: 'Prolonged QT Interval', severity: 3 },
  'STTC': { code: 'STTC', name: 'Non-specific ST-T Changes', severity: 3 },
  'T_INV': { code: 'T_INV', name: 'T-wave Inversion', severity: 3 },
  
  // LEVEL 1: STABLE (Severity 0-2)
  'SR': { code: 'SR', name: 'Sinus Rhythm', severity: 1 },
  'NORM': { code: 'NORM', name: 'Normal ECG', severity: 0 },
  'ABQRS': { code: 'ABQRS', name: 'Abnormal QRS Morphology', severity: 2 },
  'JPT': { code: 'JPT', name: 'Junctional Premature Beats', severity: 2 },
};

export const getUrgencyFromScore = (score: number): UrgencyLevel => {
  if (score >= 8) return UrgencyLevel.CRITICAL;
  if (score >= 5) return UrgencyLevel.URGENT;
  if (score >= 3) return UrgencyLevel.MONITOR;
  return UrgencyLevel.STABLE;
};

export const URGENCY_COLORS = {
  [UrgencyLevel.CRITICAL]: 'bg-red-500/20 text-red-400 border-red-500/50',
  [UrgencyLevel.URGENT]: 'bg-orange-500/20 text-orange-400 border-orange-500/50',
  [UrgencyLevel.MONITOR]: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50',
  [UrgencyLevel.STABLE]: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50',
};

export const URGENCY_ICONS = {
  [UrgencyLevel.CRITICAL]: <ShieldAlert className="w-5 h-5 text-red-400" />,
  [UrgencyLevel.URGENT]: <AlertTriangle className="w-5 h-5 text-orange-400" />,
  [UrgencyLevel.MONITOR]: <Activity className="w-5 h-5 text-yellow-400" />,
  [UrgencyLevel.STABLE]: <CheckCircle className="w-5 h-5 text-emerald-400" />,
};
