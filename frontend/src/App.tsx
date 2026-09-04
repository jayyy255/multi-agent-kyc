import React from 'react';
import { ApiActivityProvider } from './context/ApiActivityContext';
import { CaseProvider } from './context/CaseContext';
import { Layout } from './components/layout/Layout';
import { OverviewPage } from './pages/OverviewPage';
import { CasesPage } from './pages/CasesPage';
import { DocumentProcessingPage } from './pages/DocumentProcessingPage';
import { ValidationPage } from './pages/ValidationPage';
import { ReviewQueuePage } from './pages/ReviewQueuePage';
import { ApiActivityPage } from './pages/ApiActivityPage';
import { SystemInfoPage } from './pages/SystemInfoPage';

export const App: React.FC = () => {
  return (
    <ApiActivityProvider>
      <CaseProvider>
        <Layout>
          {(activeTab, setActiveTab) => {
            switch (activeTab) {
              case 'overview':
                return <OverviewPage setActiveTab={setActiveTab} />;
              case 'cases':
                return <CasesPage setActiveTab={setActiveTab} />;
              case 'document-processing':
                return <DocumentProcessingPage />;
              case 'validation':
                return <ValidationPage />;
              case 'review-queue':
                return <ReviewQueuePage setActiveTab={setActiveTab} />;
              case 'api-activity':
                return <ApiActivityPage />;
              case 'system-info':
                return <SystemInfoPage />;
              default:
                return <OverviewPage setActiveTab={setActiveTab} />;
            }
          }}
        </Layout>
      </CaseProvider>
    </ApiActivityProvider>
  );
};

export default App;
