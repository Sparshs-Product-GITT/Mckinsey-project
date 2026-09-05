'use client';

import React from 'react';
import type { Phase1Result, Phase2Solution, RootCause, ExhibitAnalysis, StrategicPillar, RiskMitigation, KeyCalculation } from '@/types/case';
import SectionCard from './SectionCard';
import DriverTree from './DriverTree';
import ExhibitInsight from './ExhibitInsight';

/** Safely coerce a value into an array — handles strings, nulls, undefined */
function safeArray<T = string>(val: unknown): T[] {
  if (Array.isArray(val)) return val as T[];
  if (typeof val === 'string' && val.trim()) return [val] as unknown as T[];
  return [];
}

interface CaseOutputProps {
  phase1: Phase1Result;
  solution: Phase2Solution;
}

const CONFIDENCE_STYLES = {
  high: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
  medium: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
  low: 'bg-red-500/15 text-red-400 border-red-500/20',
};

const TIMEFRAME_STYLES: Record<string, string> = {
  'short-term (0-6mo)': 'bg-blue-500/15 text-blue-400',
  'medium-term (6-18mo)': 'bg-purple-500/15 text-purple-400',
  'long-term (18mo+)': 'bg-gray-500/15 text-gray-400',
};

export default function CaseOutput({ phase1, solution }: CaseOutputProps) {
  return (
    <div className="space-y-4">
      {/* 1. Case Brief Summary */}
      <SectionCard
        id="section-brief"
        icon="📋"
        title="Case Brief Summary"
        subtitle={`${phase1.client_name} · ${phase1.industry}`}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InfoBlock label="Client" value={phase1.client_name} />
            <InfoBlock label="Industry" value={phase1.industry} />
            <InfoBlock label="Geography" value={phase1.geography} />
            <InfoBlock label="Case Type" value={phase1.case_type} highlight />
          </div>

          <div>
            <p className="text-xs font-mono text-[#c9a84c] uppercase tracking-wider mb-2">Core Objective</p>
            <p className="text-[#b8c4d6] leading-relaxed">{phase1.core_objective}</p>
          </div>

          <div>
            <p className="text-xs font-mono text-[#c9a84c] uppercase tracking-wider mb-2">Key Facts</p>
            <ul className="space-y-1.5">
              {safeArray(phase1.key_facts).map((fact, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-[#b8c4d6]">
                  <span className="text-[#c9a84c] mt-0.5 flex-shrink-0">▸</span>
                  <span>{fact}</span>
                </li>
              ))}
            </ul>
          </div>

          {solution.case_summary && (
            <div className="px-4 py-3 bg-[#c9a84c]/5 border border-[#c9a84c]/10 rounded-lg">
              <p className="text-xs font-mono text-[#c9a84c] uppercase tracking-wider mb-1">Executive Summary</p>
              <p className="text-[#b8c4d6] leading-relaxed">{solution.case_summary}</p>
            </div>
          )}
        </div>
      </SectionCard>

      {/* 2. Framework & Approach */}
      <SectionCard
        id="section-framework"
        icon="🏗️"
        title="Framework & Approach"
        subtitle={solution.framework_selected?.name}
        accentColor="#3b82f6"
      >
        <div className="space-y-4">
          <div>
            <p className="text-xs font-mono text-blue-400 uppercase tracking-wider mb-2">Selected Framework</p>
            <p className="text-lg text-white font-semibold">{solution.framework_selected?.name}</p>
            <p className="text-sm text-[#b8c4d6] mt-1">{solution.framework_selected?.why_chosen}</p>
          </div>

          {solution.case_type_rationale && (
            <div>
              <p className="text-xs font-mono text-blue-400 uppercase tracking-wider mb-2">Case Type Rationale</p>
              <p className="text-sm text-[#b8c4d6]">{solution.case_type_rationale}</p>
            </div>
          )}

          {safeArray(solution.framework_selected?.alternatives_considered).length > 0 && (
            <div>
              <p className="text-xs font-mono text-[#8896ab] uppercase tracking-wider mb-2">Alternatives Considered</p>
              <div className="flex flex-wrap gap-2">
                {safeArray(solution.framework_selected?.alternatives_considered).map((alt, i) => (
                  <span key={i} className="px-2.5 py-1 bg-white/[0.03] border border-white/[0.06] rounded-md text-xs text-[#8896ab]">
                    {alt}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </SectionCard>

      {/* 3. Driver Tree */}
      {solution.driver_tree && (
        <SectionCard
          id="section-driver-tree"
          icon="🌳"
          title="Driver Tree"
          subtitle="MECE breakdown of key metric"
          accentColor="#8b5cf6"
        >
          <DriverTree tree={solution.driver_tree} />
        </SectionCard>
      )}

      {/* 4. Root Cause Analysis */}
      <SectionCard
        id="section-root-cause"
        icon="🔍"
        title="Root Cause Analysis"
        accentColor="#ef4444"
      >
        <div className="space-y-5">
          {/* Primary causes */}
          <div>
            <p className="text-xs font-mono text-red-400 uppercase tracking-wider mb-3">Primary Causes</p>
            <div className="space-y-3">
              {safeArray<RootCause>(solution.root_cause_analysis?.primary_causes).map((cause, i) => (
                <div key={i} className="bg-white/[0.02] border border-white/[0.06] rounded-lg p-4">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <p className="text-white font-medium">{typeof cause === 'string' ? cause : cause.cause}</p>
                    {typeof cause !== 'string' && cause.confidence && (
                      <span className={`flex-shrink-0 px-2 py-0.5 rounded text-xs font-mono border ${CONFIDENCE_STYLES[cause.confidence as keyof typeof CONFIDENCE_STYLES] || CONFIDENCE_STYLES.medium}`}>
                        {cause.confidence}
                      </span>
                    )}
                  </div>
                  {typeof cause !== 'string' && cause.evidence_from_case && (
                    <p className="text-sm text-[#8896ab] mb-1">
                      <span className="text-[#c9a84c]">Evidence:</span> {cause.evidence_from_case}
                    </p>
                  )}
                  {typeof cause !== 'string' && cause.driver_tree_node && (
                    <p className="text-xs text-[#8896ab] font-mono">
                      Driver Tree Node: {cause.driver_tree_node}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Secondary causes */}
          {safeArray(solution.root_cause_analysis?.secondary_causes).length > 0 && (
            <div>
              <p className="text-xs font-mono text-amber-400 uppercase tracking-wider mb-2">Secondary Factors</p>
              <ul className="space-y-1">
                {safeArray(solution.root_cause_analysis?.secondary_causes).map((cause, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-[#b8c4d6]">
                    <span className="text-amber-400 mt-0.5">‣</span>
                    <span>{cause}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Ruled out */}
          {safeArray(solution.root_cause_analysis?.ruled_out).length > 0 && (
            <div>
              <p className="text-xs font-mono text-[#8896ab] uppercase tracking-wider mb-2">Ruled Out</p>
              <ul className="space-y-1">
                {safeArray(solution.root_cause_analysis?.ruled_out).map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-[#8896ab]/70">
                    <span className="mt-0.5">✗</span>
                    <span className="line-through decoration-1">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </SectionCard>

      {/* 5. Exhibit Analysis */}
      {safeArray<ExhibitAnalysis>(solution.exhibit_analysis).length > 0 && (
        <SectionCard
          id="section-exhibits"
          icon="📊"
          title="Exhibit Analysis"
          subtitle={`${safeArray<ExhibitAnalysis>(solution.exhibit_analysis).length} exhibit${safeArray<ExhibitAnalysis>(solution.exhibit_analysis).length > 1 ? 's' : ''} analyzed`}
          accentColor="#06b6d4"
        >
          <div className="space-y-4">
            {safeArray<ExhibitAnalysis>(solution.exhibit_analysis).map((exhibit, i) => (
              <ExhibitInsight key={i} exhibit={exhibit} />
            ))}
          </div>
        </SectionCard>
      )}

      {/* 6. Strategic Recommendations */}
      <SectionCard
        id="section-recommendations"
        icon="🎯"
        title="Strategic Recommendations"
        subtitle={solution.solution?.headline_recommendation}
      >
        <div className="space-y-5">
          {/* Headline */}
          <div className="px-4 py-3 bg-[#c9a84c]/5 border border-[#c9a84c]/10 rounded-lg">
            <p className="text-white font-medium">{solution.solution?.headline_recommendation}</p>
          </div>

          {/* Pillars */}
          {safeArray<StrategicPillar>(solution.solution?.strategic_pillars).map((pillar, i) => (
            <div key={i} className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-5">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <h5 className="text-white font-semibold">{pillar.pillar_name}</h5>
                  <p className="text-sm text-[#b8c4d6] mt-1">{pillar.description}</p>
                </div>
                {pillar.timeframe && (
                  <span className={`flex-shrink-0 px-2.5 py-1 rounded-md text-xs font-mono ${TIMEFRAME_STYLES[pillar.timeframe] || 'bg-gray-500/15 text-gray-400'}`}>
                    {pillar.timeframe}
                  </span>
                )}
              </div>

              {/* Actions */}
              <div className="mb-3">
                <p className="text-xs font-mono text-[#c9a84c] uppercase tracking-wider mb-2">Specific Actions</p>
                <ul className="space-y-1">
                  {safeArray(pillar.specific_actions).map((action: string, j: number) => (
                    <li key={j} className="flex items-start gap-2 text-sm text-[#b8c4d6]">
                      <span className="text-[#c9a84c] mt-0.5">→</span>
                      <span>{action}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Example */}
              {pillar.example && (
                <div className="px-3 py-2 bg-blue-500/5 border border-blue-500/10 rounded-lg mb-2">
                  <p className="text-xs text-blue-400 font-mono mb-1">Real-world Example</p>
                  <p className="text-sm text-[#b8c4d6]">{pillar.example}</p>
                </div>
              )}

              {/* Impact */}
              {pillar.expected_impact && (
                <p className="text-sm text-emerald-400">
                  <span className="font-mono text-xs">Impact:</span> {pillar.expected_impact}
                </p>
              )}
            </div>
          ))}
        </div>
      </SectionCard>

      {/* 7. Quick Wins */}
      {safeArray(solution.solution?.quick_wins).length > 0 && (
        <SectionCard
          id="section-quick-wins"
          icon="⚡"
          title="Quick Wins"
          subtitle="High impact, low effort actions"
          accentColor="#10b981"
        >
          <div className="space-y-2">
            {safeArray(solution.solution?.quick_wins).map((win, i) => (
              <div key={i} className="flex items-start gap-3 px-4 py-3 bg-emerald-500/5 border border-emerald-500/10 rounded-lg">
                <span className="text-emerald-400 mt-0.5 flex-shrink-0">✓</span>
                <span className="text-[#b8c4d6]">{win}</span>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* 8. Risks & Mitigations */}
      {safeArray(solution.solution?.risks_and_mitigations).length > 0 && (
        <SectionCard
          id="section-risks"
          icon="⚠️"
          title="Risks & Mitigations"
          accentColor="#f59e0b"
        >
          <div className="space-y-3">
            {safeArray<RiskMitigation>(solution.solution?.risks_and_mitigations).map((rm, i) => (
              <div key={i} className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="px-4 py-3 bg-red-500/5 border border-red-500/10 rounded-lg">
                  <p className="text-xs font-mono text-red-400 mb-1">Risk</p>
                  <p className="text-sm text-[#b8c4d6]">{typeof rm === 'string' ? rm : rm.risk}</p>
                </div>
                {typeof rm !== 'string' && rm.mitigation && (
                  <div className="px-4 py-3 bg-emerald-500/5 border border-emerald-500/10 rounded-lg">
                    <p className="text-xs font-mono text-emerald-400 mb-1">Mitigation</p>
                    <p className="text-sm text-[#b8c4d6]">{rm.mitigation}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* 9. Quantitative Summary */}
      {safeArray(solution.quantitative_summary?.key_calculations).length > 0 && (
        <SectionCard
          id="section-quant"
          icon="🔢"
          title="Quantitative Summary"
          accentColor="#8b5cf6"
        >
          <div className="space-y-4">
            {safeArray<KeyCalculation>(solution.quantitative_summary?.key_calculations).map((calc, i) => (
              <div key={i} className="bg-white/[0.02] border border-white/[0.06] rounded-lg p-4">
                <p className="text-white font-medium mb-2">{typeof calc === 'string' ? calc : calc.label}</p>
                {typeof calc !== 'string' && (
                  <div className="font-mono text-sm space-y-1">
                    <p className="text-[#8896ab]">
                      <span className="text-purple-400">Formula:</span> {calc.formula}
                    </p>
                    <p className="text-[#8896ab]">
                      <span className="text-blue-400">Working:</span> {calc.working}
                    </p>
                    <p className="text-[#c9a84c] text-lg mt-2">= {calc.answer}</p>
                  </div>
                )}
              </div>
            ))}

            {safeArray(solution.quantitative_summary?.sanity_checks).length > 0 && (
              <div>
                <p className="text-xs font-mono text-emerald-400 uppercase tracking-wider mb-2">Sanity Checks</p>
                <ul className="space-y-1">
                  {safeArray(solution.quantitative_summary?.sanity_checks).map((check, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-[#b8c4d6]">
                      <span className="text-emerald-400 mt-0.5">✓</span>
                      <span>{check}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </SectionCard>
      )}

      {/* 10. Closing / Next Steps */}
      <SectionCard
        id="section-closing"
        icon="🏁"
        title="Closing Recommendation"
        subtitle="Next steps & open questions"
        accentColor="#c9a84c"
      >
        <div className="space-y-5">
          {/* Three key points */}
          <div className="px-5 py-4 bg-gradient-to-br from-[#c9a84c]/10 to-[#c9a84c]/5 border border-[#c9a84c]/15 rounded-xl">
            <p className="text-xs font-mono text-[#c9a84c] uppercase tracking-wider mb-3">Key Takeaways</p>
            <ol className="space-y-2">
              {safeArray(solution.closing_recommendation?.three_key_points).map((point, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-[#c9a84c]/20 flex items-center justify-center flex-shrink-0 text-xs text-[#c9a84c] font-bold">
                    {i + 1}
                  </span>
                  <span className="text-white">{point}</span>
                </li>
              ))}
            </ol>
          </div>

          {/* Next steps */}
          {safeArray(solution.closing_recommendation?.next_steps).length > 0 && (
            <div>
              <p className="text-xs font-mono text-blue-400 uppercase tracking-wider mb-2">Immediate Next Steps</p>
              <ul className="space-y-1.5">
                {safeArray(solution.closing_recommendation?.next_steps).map((step, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-[#b8c4d6]">
                    <span className="text-blue-400 mt-0.5">→</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Open questions */}
          {safeArray(solution.closing_recommendation?.open_questions).length > 0 && (
            <div>
              <p className="text-xs font-mono text-[#8896ab] uppercase tracking-wider mb-2">Open Questions for Further Investigation</p>
              <ul className="space-y-1.5">
                {safeArray(solution.closing_recommendation?.open_questions).map((q, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-[#8896ab]">
                    <span className="mt-0.5">?</span>
                    <span>{q}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </SectionCard>
    </div>
  );
}

// Helper component
function InfoBlock({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div>
      <p className="text-xs font-mono text-[#8896ab] uppercase tracking-wider mb-1">{label}</p>
      <p className={`text-sm ${highlight ? 'text-[#c9a84c] font-medium capitalize' : 'text-white'}`}>
        {value}
      </p>
    </div>
  );
}
