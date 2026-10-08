"use client";

import { useEffect, useReducer, useRef, useState } from "react";
import { LearningInput } from "@/components/learning/LearningInput";
import { AnalysisSummary } from "@/components/learning/AnalysisSummary";
import { AdditionalRequests } from "@/components/learning/AdditionalRequests";
import { GenreSelector } from "@/components/learning/GenreSelector";
import { GenerateStoryCTA } from "@/components/learning/GenerateStoryCTA";
import { StoryReader } from "@/components/story/StoryReader";
import { apiProvider } from "@/lib/generation/api-provider";
import { validateStory } from "@/lib/generation/validate-story";
import { validateAnalysis } from "@/lib/generation/validate-analysis";
import { flowReducer, initialState } from "./reducer";
import { readSession, sessionKey } from "./session";

export function LearningFlow() {
  const [state, dispatch] = useReducer(flowReducer, initialState);
  const [busy, setBusy] = useState<"analysis" | "story" | null>(null);
  const [error, setError] = useState("");
  const mainRef = useRef<HTMLElement>(null);
  const previousScreen = useRef("");
  const analysisRef = useRef(false);
  const operation = useRef(0);
  const locked = useRef(false);

  useEffect(() => {
    try { dispatch({ type: "RESTORE", state: readSession(sessionStorage.getItem(sessionKey)) }); }
    catch { dispatch({ type: "RESTORE", state: null }); }
  }, []);
  useEffect(() => {
    if (!state.ready) return;
    try { sessionStorage.setItem(sessionKey, JSON.stringify({ version: 2, state })); }
    catch { /* This flow works without browser storage. */ }
  }, [state]);
  useEffect(() => {
    if (previousScreen.current && previousScreen.current !== state.screen) {
      mainRef.current?.focus({ preventScroll: true });
      window.scrollTo({ top: 0, behavior: "instant" });
    }
    previousScreen.current = state.screen;
  }, [state.screen]);
  useEffect(() => {
    if (state.analysis && !analysisRef.current && state.screen === "setup") {
      const heading = document.getElementById("analysis-title");
      heading?.focus({ preventScroll: true });
      heading?.scrollIntoView({ block: "start", behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
    }
    analysisRef.current = !!state.analysis;
  }, [state.analysis, state.screen]);

  async function analyze() {
    if (locked.current || !state.originalContent.trim()) return;
    locked.current = true;
    const id = ++operation.current;
    setBusy("analysis"); setError("");
    try {
      const analysis = validateAnalysis(await apiProvider.analyze(state.originalContent));
      if (id === operation.current) dispatch({ type: "ANALYZED", analysis });
    } catch (cause) { setError(cause instanceof Error ? cause.message : "분석하지 못했어요. 다시 시도해주세요."); }
    finally { if (id === operation.current) { locked.current = false; setBusy(null); } }
  }
  async function generate() {
    if (locked.current || !state.analysis || !state.genre) return;
    locked.current = true;
    const id = ++operation.current;
    setBusy("story"); setError("");
    try {
      const story = validateStory(await apiProvider.createStory({
        originalContent: state.originalContent, analysis: state.analysis,
        userPriority: state.userPriority, comprehensionNeeds: state.comprehensionNeeds,
        genre: state.genre,
      }));
      if (id === operation.current) dispatch({ type: "STORY", story });
    } catch (cause) { setError(cause instanceof Error ? cause.message : "이야기를 열지 못했어요."); }
    finally { if (id === operation.current) { locked.current = false; setBusy(null); } }
  }
  function reset() {
    operation.current++; locked.current = false; analysisRef.current = false;
    setBusy(null); setError(""); dispatch({ type: "RESET" });
  }
  function backToSetup() { setError(""); dispatch({ type: "BACK_TO_SETUP" }); }
  return <div className={"app-shell" + (state.screen === "reader" ? " reading" : "")}>
    <a className="skip-link" href="#main">본문으로 건너뛰기</a>
    <header className="site-header"><div className="brand" aria-label="암기빵"><svg aria-hidden="true" viewBox="0 0 32 32"><path d="M7 26V13C0 8 7 2 12 5c3-5 10-4 12 1 7-1 10 8 3 10v10c-6 2-14 2-20 0Z" fill="currentColor" /></svg><span>암기빵</span><span className="brand-en">amgippang</span></div><span className="header-context">{state.screen === "setup" ? "작은 이야기의 시작" : "이야기 속으로"}</span><span className="prototype-tag">PROTOTYPE ↗</span></header>
    <main id="main" ref={mainRef} tabIndex={-1} aria-label={state.screen === "setup" ? "Story Setup" : "Story Reader"}>
      {!state.ready ? <p className="loading-note" role="status">이야기의 문을 열고 있어요…</p> : <>
        {error && <div className="global-error" role="alert">{error}<button className="text-button" onClick={() => setError("")}>닫기</button></div>}
        {state.screen === "setup" && <div className="story-setup"><LearningInput value={state.originalContent} onChange={(value) => { setError(""); dispatch({ type: "INPUT", value }); }} onAnalyze={analyze} busy={busy !== null} analyzed={!!state.analysis} />
          {state.analysis && <div className="setup-expansion"><AnalysisSummary analysis={state.analysis} /><AdditionalRequests userPriority={state.userPriority} comprehensionNeeds={state.comprehensionNeeds} onChange={(field, value) => dispatch({ type: "REQUEST", field, value })} disabled={busy !== null} /><GenreSelector selected={state.genre} onSelect={(genre) => dispatch({ type: "GENRE", genre })} disabled={busy !== null} /><GenerateStoryCTA selected={!!state.genre} busy={busy === "story"} onGenerate={generate} /></div>}
        </div>}
        {state.screen === "reader" && state.story && <StoryReader story={state.story} originalContent={state.originalContent} hasRequests={!!(state.userPriority.trim() || state.comprehensionNeeds.trim())} openAnnotations={state.openAnnotations} onToggle={(id) => dispatch({ type: "ANNOTATION", id })} onSetup={backToSetup} onRestart={reset} />}
      </>}
    </main><footer className="site-footer"><span>이해를 굽는 작은 이야기 공방.</span><span>STORY FIRST, UNDERSTANDING FOLLOWS.</span></footer>
  </div>;
}
