
export enum UrgencyLevel {
  CRITICAL = 'CRITICAL',
  URGENT = 'URGENT',
  MONITOR = 'MONITOR',
  STABLE = 'STABLE'
}

export interface Diagnosis {
  code: string;
  name: string;
  severity: number;
}

export interface Patient {
  id: string;
  name: string;
  age: number;
  gender: 'M' | 'F' | 'O';
  recordingTime: string;
  device: string;
  urgencyScore: number;
  detectedConditions: string[];
  level: UrgencyLevel;
  waveformUrl?: string;
  notes?: string;
  heartRate?: number;
  confidence?: number;
}

export interface TriageStats {
  criticalCount: number;
  urgentCount: number;
  monitorCount: number;
  stableCount: number;
  avgResponseTime: string;
}
