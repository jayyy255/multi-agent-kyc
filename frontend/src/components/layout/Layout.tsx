import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

interface LayoutProps {
  children: (activeTab: string, setActiveTab: (tab: string) => void) => React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<string>('overview');

  return (
    <div className="app-container">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <div className="main-content">
        <Header activeTab={activeTab} />
        <main className="page-body">
          {children(activeTab, setActiveTab)}
        </main>
      </div>
    </div>
  );
};
