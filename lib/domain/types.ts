export const SURF_LEVELS = {
  beginner: "Iniciante",
  intermediate: "Intermediário",
  advanced: "Avançado",
} as const;

export type SurfLevel = keyof typeof SURF_LEVELS;

export const WAVE_TYPES = {
  beach_break: "Beach break",
  point: "Point",
  reef: "Reef",
  river_mouth: "Foz de rio",
  other: "Outro",
} as const;

export type WaveType = keyof typeof WAVE_TYPES;

export const ANALYSIS_FOCUS = {
  speed: "Velocidade",
  maneuvers: "Manobras",
  consistency: "Consistência",
} as const;

export type AnalysisFocus = keyof typeof ANALYSIS_FOCUS;

export const MEDIA_TYPES = {
  video: "Vídeo",
  image: "Imagem",
  link: "Link",
} as const;

export type MediaType = keyof typeof MEDIA_TYPES;

export const MEDIA_STATUS = {
  uploading: "Enviando",
  processing: "Processando",
  ready: "Pronto",
  error: "Erro",
} as const;

export type MediaStatus = keyof typeof MEDIA_STATUS;

export const ANALYSIS_STATUS = {
  processing: "Processando",
  done: "Pronto",
  error: "Erro",
} as const;

export type AnalysisStatus = keyof typeof ANALYSIS_STATUS;

export const BOARD_STATUS = {
  draft: "Rascunho",
  processing: "Processando",
  ready: "Pronto",
  error: "Erro",
} as const;

export type BoardStatus = keyof typeof BOARD_STATUS;

export const BOARD_MATCH_VERDICT = {
  match: "match",
  partial: "partial",
  no_match: "no_match",
} as const;

export const BOARD_MATCH_VERDICT_LABELS = {
  match: "Combina",
  partial: "Parcial",
  no_match: "Não combina",
} as const;

export type BoardMatchVerdict = keyof typeof BOARD_MATCH_VERDICT;

export const MANEUVER_CONFIDENCE_LEVELS = {
  alta: "Alta confiança",
  media: "Confiança média",
  baixa: "Baixa confiança",
} as const;

export type ManeuverConfidence = keyof typeof MANEUVER_CONFIDENCE_LEVELS;

export interface Profile {
  id: string;
  display_name: string | null;
  surf_level: SurfLevel | null;
  weight_kg: number | null;
  height_cm: number | null;
  wave_type: WaveType | null;
  role: "user" | "admin";
  created_at: string;
  updated_at: string;
}

export interface ProductFeedbackListItem {
  id: string;
  user_id: string;
  rating: number;
  comment: string | null;
  page_path: string | null;
  created_at: string;
  display_name: string | null;
}

export interface CriterioScore {
  nome: string;
  nota: number;
  comentario: string;
}

export interface MelhoriaDetalhada {
  titulo: string;
  observacao: string;
  impacto: string;
  dica_pratica: string;
}

export interface PerformanceResult {
  resumo: string;
  pontos_fortes: string[];
  melhorias: string[];
  melhorias_detalhadas?: MelhoriaDetalhada[];
  prioridades_treino: [string, string, string];
  score?: number;
  criterios_score?: CriterioScore[];
  /** Presente quando a análise usou visão em foto ou frames de vídeo */
  manobra_observada?: string;
  /** Nível de confiança da IA na identificação da manobra observada */
  confianca_manobra?: ManeuverConfidence;
  /** Detalhes técnicos visíveis no frame ou nos frames do vídeo */
  detalhes_frame?: string;
}

export interface BoardSpecResult {
  shape: string;
  rails: string;
  bottom: string;
  tail: string;
  rocker: string;
}

export interface BoardSensation {
  mar_pequeno?: string;
  mar_grande?: string;
  pontos_fortes?: string[];
  pontos_fracos?: string[];
}

export interface BoardMatchResult {
  veredito: BoardMatchVerdict;
  pros: string[];
  contras: string[];
  condicoes_ideais: string[];
  distancia_da_magica?: string;
}

export interface MediaItem {
  id: string;
  user_id: string;
  type: MediaType;
  storage_path: string | null;
  external_url: string | null;
  wave_type: WaveType | null;
  focus: AnalysisFocus | null;
  status: MediaStatus;
  created_at: string;
}

export interface Analysis {
  id: string;
  user_id: string;
  media_item_id: string | null;
  board_id: string | null;
  type: "performance" | "board_match";
  result_json: PerformanceResult | BoardMatchResult | null;
  status: AnalysisStatus;
  reference_board_id: string | null;
  board_candidate_photos: string[] | null;
  advertised_measurements: Record<string, number | null> | null;
  created_at: string;
}

export interface Board {
  id: string;
  user_id: string;
  is_magic: boolean;
  name: string | null;
  length_in: number | null;
  width_in: number | null;
  thickness_in: number | null;
  volume_l: number | null;
  sensation_json: BoardSensation | null;
  spec_json: BoardSpecResult | null;
  ai_summary: string | null;
  photo_paths: string[];
  status: BoardStatus;
  created_at: string;
}

export interface ActionResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}
