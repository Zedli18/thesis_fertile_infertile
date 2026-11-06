// egg-app-rn/src/lib/egg-types.ts

export type FertilityStatus = 'Fertile' | 'Infertile';

export interface CandlingInfo {
  notes?: string;
  veinDensity?: string | number;
  airCellSize?: string;
  airCellClarity?: string;
  embryoMovement?: boolean | string;
  opacity?: string;
  [key: string]: any; // Index signature for dynamic property access in ResultCard.tsx
}

export interface EggAnalysisResult {
  id: string;
  imageUri: string;
  status: FertilityStatus | string;
  prediction?: FertilityStatus | string; // Expected by ResultCard.tsx
  confidence: number; // Percentage, e.g. 97.5
  probabilityFertile?: number; // 0.0 to 1.0
  probabilityInfertile?: number; // 0.0 to 1.0
  timestamp: string; // ISO date string
  batchId?: string;
  notes?: string;
  source?: string; // Expected by ResultCard.tsx
  candling?: CandlingInfo;
}

// Aliases for cross-component compatibility
export type AnalysisResult = EggAnalysisResult;
export type EggScanResult = EggAnalysisResult;
export type EggRecord = EggAnalysisResult;

export interface Batch {
  id: string;
  name: string;
  createdAt: string;
  description?: string;
  totalEggs?: number;
  fertileCount?: number;
  infertileCount?: number;
}

export interface BatchSummary {
  batchId: string;
  batchName: string;
  totalScanned: number;
  fertileCount: number;
  infertileCount: number;
  fertilityRate: number;
  averageConfidence: number;
}

export interface AnalyticsOverview {
  totalEggsScanned: number;
  totalFertile: number;
  totalInfertile: number;
  overallFertilityRate: number;
  recentScans: EggAnalysisResult[];
}