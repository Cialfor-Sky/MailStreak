import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import { cn } from '../../../utils/cn';

const EmailDetailsExpanded = ({ email }) => {
  const [showFullEmail, setShowFullEmail] = useState(false);
  const [showAttachments, setShowAttachments] = useState(false);

  const getSeverityConfig = (riskScore) => {
    if (riskScore >= 80) return { bg: 'bg-error/10', text: 'text-error', border: 'border-error/40', icon: 'AlertOctagon' };
    if (riskScore >= 50) return { bg: 'bg-warning/10', text: 'text-warning', border: 'border-warning/40', icon: 'AlertTriangle' };
    if (riskScore >= 20) return { bg: 'bg-accent/10', text: 'text-accent', border: 'border-accent/40', icon: 'Info' };
    return { bg: 'bg-success/10', text: 'text-success', border: 'border-success/40', icon: 'CheckCircle' };
  };

  const severityConfig = getSeverityConfig(email?.riskScore);

  const handleExportAnalysis = () => {
    const blob = new Blob([JSON.stringify(email, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `email-analysis-${email?.id || 'record'}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="py-6 space-y-6 animate-dropdown-open">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className={cn(
          'p-4 rounded-md border',
          severityConfig?.bg,
          severityConfig?.border
        )}>
          <div className="flex items-center gap-2 mb-2">
            <Icon name="Brain" size={18} className={severityConfig?.text} />
            <h4 className="text-sm font-semibold text-foreground">ML Confidence</h4>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground font-caption">Model</span>
              <span className="text-xs text-foreground font-medium">{email?.mlModel}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground font-caption">Confidence</span>
              <span className={cn('text-lg font-bold font-data', severityConfig?.text)}>
                {email?.mlConfidence}%
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
              <div
                className={cn('h-full transition-all duration-500', severityConfig?.text?.replace('text-', 'bg-'))}
                style={{ width: `${email?.mlConfidence}%` }}
              />
            </div>
          </div>
        </div>

        <div className={cn(
          'p-4 rounded-md border',
          severityConfig?.bg,
          severityConfig?.border
        )}>
          <div className="flex items-center gap-2 mb-2">
            <Icon name="Shield" size={18} className={severityConfig?.text} />
            <h4 className="text-sm font-semibold text-foreground">Heuristic Rules</h4>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-muted-foreground font-caption">Triggered</span>
              <span className={cn('text-lg font-bold font-data', severityConfig?.text)}>
                {email?.heuristicRules?.length}
              </span>
            </div>
            <div className="space-y-1.5">
              {email?.heuristicRules?.map((rule, index) => (
                <div key={index} className="flex items-start gap-2">
                  <Icon name="CheckCircle2" size={14} className={cn('mt-0.5', severityConfig?.text)} />
                  <span className="text-xs text-foreground font-caption">{rule}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className={cn(
          'p-4 rounded-md border',
          severityConfig?.bg,
          severityConfig?.border
        )}>
          <div className="flex items-center gap-2 mb-2">
            <Icon name={severityConfig?.icon} size={18} className={severityConfig?.text} />
            <h4 className="text-sm font-semibold text-foreground">Risk Assessment</h4>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground font-caption">Classification</span>
              <span className={cn(
                'px-2 py-1 rounded text-xs font-medium capitalize',
                severityConfig?.bg,
                severityConfig?.text
              )}>
                {email?.classification}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground font-caption">Risk Score</span>
              <span className={cn('text-lg font-bold font-data', severityConfig?.text)}>
                {email?.riskScore}/100
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
              <div
                className={cn('h-full transition-all duration-500', severityConfig?.text?.replace('text-', 'bg-'))}
                style={{ width: `${email?.riskScore}%` }}
              />
            </div>
          </div>
        </div>
      </div>
      {/* AI Explainability & Incident Forensic Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* OpenAI Insights Panel */}
        <div className="card bg-muted/30 border-primary/20">
          <div className="flex items-center gap-2 mb-4">
            <Icon name="Sparkles" size={20} className="text-primary" />
            <h4 className="text-base font-semibold text-foreground">AI Incident Reasoning</h4>
          </div>
          
          {email?.explainability ? (
            <div className="space-y-4">
              <div className="p-3 bg-primary/5 rounded-md border border-primary/10">
                <p className="text-sm font-medium text-foreground italic">"{email.explainability.summary}"</p>
              </div>
              
              <div className="space-y-3">
                <h5 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Suspicious Indicators</h5>
                <div className="flex flex-wrap gap-2">
                  {email.explainability.suspicious_indicators?.map((indicator, i) => (
                    <span key={i} className="px-2 py-1 rounded-full bg-error/10 border border-error/20 text-error text-[10px] font-mono">
                      {indicator}
                    </span>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <h5 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Malicious Intent Markers</h5>
                <div className="grid grid-cols-2 gap-2">
                  {email.explainability.malicious_intent_markers?.map((marker, i) => (
                    <div key={i} className="flex items-center gap-2 p-2 bg-muted/50 rounded border border-border">
                      <Icon name="Target" size={12} className="text-accent" />
                      <span className="text-xs text-foreground font-medium">{marker}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-3 bg-muted rounded-md">
                <h5 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Header Anomaly Analysis</h5>
                <p className="text-xs text-foreground leading-relaxed">{email.explainability.header_anomaly_analysis}</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Icon name="Lock" size={32} className="text-muted-foreground/30 mb-2" />
              <p className="text-sm text-muted-foreground font-caption">Explainability data unavailable for this record.</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Requires active AI scanning layer.</p>
            </div>
          )}
        </div>

        {/* Confidence & Reasoning Panel */}
        <div className="card bg-muted/30">
          <div className="flex items-center gap-2 mb-4">
            <Icon name="Activity" size={20} className="text-primary" />
            <h4 className="text-base font-semibold text-foreground">Confidence Breakdown</h4>
          </div>

          {email?.explainability ? (
            <div className="space-y-6">
              <div className="space-y-4">
                {[
                  { label: 'Language Patterns', value: email.explainability.confidence_breakdown?.language_factor },
                  { label: 'Intent Consistency', value: email.explainability.confidence_breakdown?.intent_factor },
                  { label: 'Infrastructure Rep', value: email.explainability.confidence_breakdown?.consistency_factor }
                ].map(factor => (
                  <div key={factor.label}>
                    <div className="flex justify-between mb-1">
                      <span className="text-xs text-muted-foreground font-caption">{factor.label}</span>
                      <span className="text-xs font-bold text-foreground">{factor.value}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-muted rounded-full">
                      <div className="bg-primary h-full rounded-full" style={{ width: `${factor.value}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-4 bg-background rounded-lg border border-border">
                <h5 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-2">
                  <Icon name="FileSearch" size={14} className="text-accent" />
                  Technical Reasoning
                </h5>
                <p className="text-xs text-foreground leading-relaxed font-mono whitespace-pre-wrap">
                  {email.explainability.reasoning}
                </p>
              </div>
            </div>
          ) : (
             <div className="space-y-4 animate-pulse">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-4 bg-muted/50 rounded w-full"></div>
                ))}
                <div className="h-20 bg-muted/50 rounded w-full"></div>
             </div>
          )}
        </div>
      </div>

      {/* Cross-Verification Panel */}
      <div className="card bg-muted/20 border-dashed border-border">
        <h4 className="text-sm font-bold text-foreground mb-4 uppercase tracking-widest flex items-center gap-2">
          <Icon name="GitCompare" size={16} className="text-primary" />
          Cross-Service Verdict Verification
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-3 text-center">
            <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">ML Model Ensemble</p>
            <p className={cn("text-lg font-bold font-data", severityConfig.text)}>{email?.classification?.toUpperCase()}</p>
            <p className="text-[10px] text-muted-foreground mt-1">Weight: 60%</p>
          </div>
          <div className="p-3 text-center border-x border-border">
            <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Heuristic Engine</p>
            <p className="text-lg font-bold font-data text-foreground">
              {email?.heuristicRules?.length > 0 ? 'FLAGGED' : 'CLEAN'}
            </p>
            <p className="text-[10px] text-muted-foreground mt-1">Weight: 40%</p>
          </div>
          <div className="p-3 text-center">
            <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">OpenAI Semantic Proxy</p>
            <p className={cn("text-lg font-bold font-data", email?.explainability ? severityConfig.text : 'text-muted-foreground')}>
              {email?.explainability ? email.classification.toUpperCase() : 'N/A'}
            </p>
            <p className="text-[10px] text-muted-foreground mt-1">Audit Mode: Full</p>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
        <button
          className="flex items-center gap-2 px-4 py-2 rounded-md bg-muted hover:bg-muted/80 text-foreground transition-smooth"
          onClick={() => setShowFullEmail(true)}
        >
          <Icon name="Eye" size={16} />
          <span className="text-sm font-medium">View Full Email</span>
        </button>
        <button
          className="flex items-center gap-2 px-4 py-2 rounded-md bg-muted hover:bg-muted/80 text-foreground transition-smooth"
          onClick={() => setShowAttachments(true)}
        >
          <Icon name="FileText" size={16} />
          <span className="text-sm font-medium">View Attachments</span>
        </button>
        <button
          className="flex items-center gap-2 px-4 py-2 rounded-md bg-primary hover:bg-primary/90 text-primary-foreground transition-smooth"
          onClick={handleExportAnalysis}
        >
          <Icon name="Download" size={16} />
          <span className="text-sm font-medium">Export Analysis</span>
        </button>
      </div>

      {showFullEmail && (
        <div className="fixed inset-0 bg-black/50 z-150 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-card border border-border rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-base font-semibold">Full Email</h4>
              <button onClick={() => setShowFullEmail(false)} className="text-muted-foreground hover:text-foreground">
                <Icon name="X" size={16} />
              </button>
            </div>
            <div className="space-y-2 text-sm">
              <div><span className="text-muted-foreground">Sender:</span> {email?.sender || '-'}</div>
              <div><span className="text-muted-foreground">Subject:</span> {email?.subject || '-'}</div>
              <div className="rounded border border-border p-3 bg-muted/30 whitespace-pre-wrap max-h-[360px] overflow-auto">
                {email?.content || 'No content available.'}
              </div>
            </div>
          </div>
        </div>
      )}

      {showAttachments && (
        <div className="fixed inset-0 bg-black/50 z-150 flex items-center justify-center p-4">
          <div className="w-full max-w-xl bg-card border border-border rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-base font-semibold">Attachments</h4>
              <button onClick={() => setShowAttachments(false)} className="text-muted-foreground hover:text-foreground">
                <Icon name="X" size={16} />
              </button>
            </div>
            {email?.attachments > 0 ? (
              <div className="text-sm text-foreground">Detected attachments: {email.attachments}</div>
            ) : (
              <div className="text-sm text-muted-foreground">No attachments detected for this email.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default EmailDetailsExpanded;
