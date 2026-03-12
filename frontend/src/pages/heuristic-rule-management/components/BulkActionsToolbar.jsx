import React from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const BulkActionsToolbar = ({
  selectedCount,
  onEnableSelected,
  onDisableSelected,
  onExport,
  onClearSelection
}) => {
  return (
    <div className="card mb-6 bg-primary/5 border-primary/20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
            <Icon name="CheckSquare" size={20} className="text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">
              {selectedCount} {selectedCount === 1 ? 'rule' : 'rules'} selected
            </p>
            <p className="text-xs text-muted-foreground">Choose an action to apply to selected rules</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="success"
            size="sm"
            onClick={onEnableSelected}
            iconName="Power"
          >
            Enable
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onDisableSelected}
            iconName="PowerOff"
          >
            Disable
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onExport}
            iconName="Download"
          >
            Export
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearSelection}
            iconName="X"
          >
            Clear
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BulkActionsToolbar;