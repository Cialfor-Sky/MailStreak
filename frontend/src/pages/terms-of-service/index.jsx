import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import Header from '../../components/ui/Header';
import LegalFooter from '../../components/ui/LegalFooter';
import api from '../../services/api';

const TermsOfService = () => {
  const [data, setData] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get('/api/v1/compliance/terms-of-service');
        setData(res?.data || null);
      } catch {
        setData(null);
      }
    };
    load();
  }, []);

  return (
    <>
      <Helmet><title>Terms of Service | MailStreak</title></Helmet>
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="pt-[60px] flex-1">
          <div className="container mx-auto px-4 py-6">
            <div className="card space-y-4">
              <h1 className="text-2xl font-bold">Terms of Service</h1>
              <p className="text-sm text-muted-foreground">Using MailStreak means you agree to these service terms.</p>
              <section>
                <h2 className="text-lg font-semibold mb-2">Acceptable Use Policy</h2>
                <p className="text-sm">{data?.acceptableUsePolicy}</p>
              </section>
              <section>
                <h2 className="text-lg font-semibold mb-2">Liability Limitations</h2>
                <p className="text-sm">{data?.liabilityLimitations}</p>
              </section>
              <section>
                <h2 className="text-lg font-semibold mb-2">User Responsibilities</h2>
                <p className="text-sm">{data?.userResponsibilities}</p>
              </section>
              <section>
                <h2 className="text-lg font-semibold mb-2">Termination Policy</h2>
                <p className="text-sm">{data?.terminationPolicy}</p>
              </section>
              <section>
                <h2 className="text-lg font-semibold mb-2">Governing Law</h2>
                <p className="text-sm">{data?.governingLaw}</p>
              </section>
            </div>
          </div>
        </main>
        <LegalFooter />
      </div>
    </>
  );
};

export default TermsOfService;
