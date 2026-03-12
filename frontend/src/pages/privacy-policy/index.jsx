import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import Header from '../../components/ui/Header';
import LegalFooter from '../../components/ui/LegalFooter';
import api from '../../services/api';

const PrivacyPolicy = () => {
  const [data, setData] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get('/api/v1/compliance/privacy-policy');
        setData(res?.data || null);
      } catch {
        setData(null);
      }
    };
    load();
  }, []);

  return (
    <>
      <Helmet><title>Privacy Policy | MailStreak</title></Helmet>
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="pt-[60px] flex-1">
          <div className="container mx-auto px-4 py-6">
            <div className="card space-y-4">
              <h1 className="text-2xl font-bold">Privacy Policy</h1>
              <p className="text-sm text-muted-foreground">This policy explains what data MailStreak processes and why.</p>

              <section>
                <h2 className="text-lg font-semibold mb-2">Data Collected</h2>
                <ul className="text-sm text-foreground list-disc pl-5">
                  {(data?.dataCollected || []).map((item) => <li key={item}>{item}</li>)}
                </ul>
              </section>

              <section>
                <h2 className="text-lg font-semibold mb-2">Purpose of Processing</h2>
                <ul className="text-sm text-foreground list-disc pl-5">
                  {(data?.processingPurpose || []).map((item) => <li key={item}>{item}</li>)}
                </ul>
              </section>

              <section className="text-sm">
                <h2 className="text-lg font-semibold mb-2">Retention</h2>
                <p>Default retention period: <span className="font-semibold">{data?.retentionDaysDefault ?? 90} days</span>.</p>
              </section>

              <section>
                <h2 className="text-lg font-semibold mb-2">Third-Party Integrations</h2>
                <ul className="text-sm text-foreground list-disc pl-5">
                  {(data?.thirdParties || []).map((item) => <li key={item}>{item}</li>)}
                </ul>
              </section>
            </div>
          </div>
        </main>
        <LegalFooter />
      </div>
    </>
  );
};

export default PrivacyPolicy;
