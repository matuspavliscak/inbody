export interface Scan {
  id: number;
  test_date: string;
  patient_id?: string;
  patient_name?: string;
  height_cm?: number;
  age?: number;
  gender?: string;
  source_file?: string;

  total_body_water?: number;
  protein?: number;
  minerals?: number;
  body_fat_mass?: number;
  weight?: number;

  smm?: number;
  bmi?: number;
  pbf?: number;

  inbody_score?: number;
  target_weight?: number;
  weight_control?: number;
  fat_control?: number;
  muscle_control?: number;

  waist_hip_ratio?: number;
  visceral_fat_level?: number;
  fat_free_mass?: number;
  basal_metabolic_rate?: number;
  obesity_degree?: number;
  smi?: number;
  recommended_calories?: number;

  segmental_lean?: string;
  segmental_fat?: string;
  impedance?: string;
  created_at?: string;
}

export interface ScanSummary {
  id: number;
  test_date: string;
  weight?: number;
  smm?: number;
  pbf?: number;
  bmi?: number;
  inbody_score?: number;
  source_file?: string;
}

export interface TrendPoint {
  test_date: string;
  weight?: number;
  smm?: number;
  pbf?: number;
  bmi?: number;
  body_fat_mass?: number;
  total_body_water?: number;
  inbody_score?: number;
  visceral_fat_level?: number;
  basal_metabolic_rate?: number;
  waist_hip_ratio?: number;
}
