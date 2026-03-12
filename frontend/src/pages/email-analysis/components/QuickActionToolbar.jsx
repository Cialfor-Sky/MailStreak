import React from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import { cn } from '../../../utils/cn';

const QuickActionToolbar = ({ selectedCount, onBulkAction, onSearch, searchQuery }) => {
  return (
    <div className="card">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex-1 w-full md:w-auto">
          <div className="relative">
            <Icon
              name="Search"
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearch(e?.target?.value)}
              placeholder="Search emails by sender, subject, or content..."
              className="w-full pl-10 pr-4 py-2.5 rounded-md bg-muted border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-smooth"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          {selectedCount > 0 && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-primary/10 text-primary animate-dropdown-open">
              <Icon name="CheckSquare" size={16} />
              <span className="text-sm font-medium font-data">{selectedCount} selected</span>
            </div>
          )}

          <Button
            variant="outline"
            size="sm"
            iconName="Archive"
            onClick={() => onBulkAction('quarantine')}
            disabled={selectedCount === 0}
            className={cn(
              'whitespace-nowrap',
              selectedCount === 0 && 'opacity-50 cursor-not-allowed'
            )}
          >
            Quarantine
          </Button>

          <Button
            variant="outline"
            size="sm"
            iconName="ShieldCheck"
            onClick={() => onBulkAction('whitelist')}
            disabled={selectedCount === 0}
            className={cn(
              'whitespace-nowrap',
              selectedCount === 0 && 'opacity-50 cursor-not-allowed'
            )}
          >
            Whitelist
          </Button>

          <Button
            variant="outline"
            size="sm"
            iconName="Download"
            onClick={() => onBulkAction('export')}
            disabled={selectedCount === 0}
            className={cn(
              'whitespace-nowrap',
              selectedCount === 0 && 'opacity-50 cursor-not-allowed'
            )}
          >
            Export
          </Button>
        </div>
      </div>
    </div>
  );
};

export default QuickActionToolbar;