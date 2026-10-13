import { genreRecommendation, type AnalysisPayload } from "@/lib/schemas/analysis";
import type { StoryGenre, StoryPayload } from "@/lib/schemas/story";

export type FlowState = {
  screen: "setup" | "reader";
  originalContent: string;
  analysis: AnalysisPayload | null;
  userPriority: string;
  comprehensionNeeds: string;
  genre: StoryGenre | null;
  story: StoryPayload | null;
  openAnnotations: string[];
  ready: boolean;
};
export const initialState: FlowState = {
  screen: "setup", originalContent: "", analysis: null,
  userPriority: "", comprehensionNeeds: "", genre: null,
  story: null, openAnnotations: [], ready: false,
};
export type FlowAction =
  | { type: "INPUT"; value: string }
  | { type: "ANALYZED"; analysis: AnalysisPayload }
  | { type: "REQUEST"; field: "userPriority" | "comprehensionNeeds"; value: string }
  | { type: "GENRE"; genre: StoryGenre }
  | { type: "STORY"; story: StoryPayload }
  | { type: "ANNOTATION"; id: string }
  | { type: "BACK_TO_SETUP" }
  | { type: "RESET" }
  | { type: "RESTORE"; state: FlowState | null };

export function flowReducer(state: FlowState, action: FlowAction): FlowState {
  switch (action.type) {
    case "INPUT": return { ...state, originalContent: action.value, analysis: null, story: null, openAnnotations: [] };
    case "ANALYZED": return { ...state, analysis: action.analysis, genre: state.genre ?? genreRecommendation(action.analysis)?.genre ?? null, story: null, openAnnotations: [] };
    case "REQUEST": return { ...state, [action.field]: action.value, story: null, openAnnotations: [] };
    case "GENRE": return { ...state, genre: action.genre, story: null, openAnnotations: [] };
    case "STORY": return state.analysis && state.genre === action.story.genre ? { ...state, story: action.story, screen: "reader", openAnnotations: [] } : state;
    case "ANNOTATION": return { ...state, openAnnotations: state.openAnnotations.includes(action.id) ? state.openAnnotations.filter((id) => id !== action.id) : [...state.openAnnotations, action.id] };
    case "BACK_TO_SETUP": return { ...state, screen: "setup" };
    case "RESET": return { ...initialState, ready: true };
    case "RESTORE": return { ...(action.state ?? initialState), ready: true };
  }
}
