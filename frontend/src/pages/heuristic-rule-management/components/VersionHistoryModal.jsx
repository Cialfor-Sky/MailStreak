import React from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import { cn } from '../../../utils/cn';

const VersionHistoryModal = ({ isOpen, onClose, rule, onRestore }) => {
  if (!isOpen || !rule) return null;

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date?.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getVersionStatus = (version) => {
    if (version?.version === rule?.version) {
      return { label: 'Current', color: 'success' };
    }
    return { label: 'Previous', color: 'muted' };
  };

  return (
    <div className="fixed inset-0 z-1000 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-card rounded-lg shadow-xl border border-border w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <Icon name="History" size={24} className="text-primary" />
            <div>
              <h2 className="text-xl font-semibold text-foreground">Version History</h2>
              <p className="text-sm text-muted-foreground">{rule?.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-smooth"
          >
            <Icon name="X" size={24} />
          </button>
        </div>

        <div className="px-6 py-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="space-y-4">
            {rule?.versionHistory?.map((version, index) => {
              const status = getVersionStatus(version);
              const isCurrent = version?.version === rule?.version;

              return (
                <div
                  key={index}
                  className={cn(
                    'border rounded-lg p-4 transition-smooth',
                    isCurrent ? 'border-primary bg-primary/5' : 'border-border bg-card'
                  )}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        'flex items-center justify-center w-10 h-10 rounded-full',
                        isCurrent ? 'bg-success/10' : 'bg-muted'
                      )}>
                        <Icon
                          name={isCurrent ? 'CheckCircle' : 'Clock'}
                          size={20}
                          className={isCurrent ? 'text-success' : 'text-muted-foreground'}
                        />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-semibold text-foreground font-data">
                            v{version?.version}
                          </span>
                          <span className={cn(
                            'px-2 py-0.5 rounded-full text-xs font-semibold',
                            status?.color === 'success' ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'
                          )}>
                            {status?.label}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">{formatDate(version?.date)}</p>
                      </div>
                    </div>

                    {!isCurrent && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onRestore(version)}
                        iconName="RotateCcw"
                      >
                        Restore
                      </Button>
                    )}
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-start gap-2">
                      <Icon name="User" size={16} className="text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-xs text-muted-foreground">Author</p>
                        <p className="text-sm text-foreground">{version?.author}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <Icon name="FileText" size={16} className="text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-xs text-muted-foreground">Changes</p>
                        <p className="text-sm text-foreground">{version?.changes}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-3 border-t border-border">
                      <div className="flex items-center gap-2">
                        <Icon name="Target" size={16} className="text-success" />
                        <div>
                          <p className="text-xs text-muted-foreground">Detection Rate</p>
                          <p className="text-sm font-semibold text-foreground font-data">{version?.detectionRate}%</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Icon name="Calendar" size={16} className="text-accent" />
                        <div>
                          <p className="text-xs text-muted-foreground">Released</p>
                          <p className="text-sm font-semibold text-foreground">
                            {new Date(version?.date)?.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {rule?.versionHistory?.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12">
              <Icon name="History" size={48} color="var(--color-muted-foreground)" />
              <p className="text-sm text-muted-foreground mt-3">No version history available</p>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between px-6 py-4 border-t border-border">
          <div className="flex items-start gap-2">
            <Icon name="Info" size={16} className="text-accent mt-0.5" />
            <p className="text-xs text-muted-foreground">
              Restoring a previous version will create a new version based on the selected configuration.
            </p>
          </div>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};

export default VersionHistoryModal;