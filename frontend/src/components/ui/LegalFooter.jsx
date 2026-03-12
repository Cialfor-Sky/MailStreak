import React from 'react';
import { Link } from 'react-router-dom';

const LegalFooter = () => {
  return (
    <footer className="border-t border-border bg-card/70">
      <div className="container mx-auto px-4 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
        <p className="text-xs text-muted-foreground">MailStreak SaaS Platform</p>
        <div className="flex items-center gap-4 text-xs">
          <Link to="/privacy-policy" className="text-primary hover:underline">Privacy Policy</Link>
          <Link to="/terms-of-service" className="text-primary hover:underline">Terms of Service</Link>
        </div>
      </div>
    </footer>
  );
};

export default LegalFooter;
