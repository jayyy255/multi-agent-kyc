import React, { createContext, useContext, useEffect, useState } from 'react';
import { subscribeToApiActivity } from '../api/client';
import { ApiActivityItem } from '../types/activity';

interface ApiActivityContextType {
  activities: ApiActivityItem[];
  clearActivities: () => void;
  latestActivity: ApiActivityItem | null;
}

const ApiActivityContext = createContext<ApiActivityContextType | undefined>(undefined);

export const ApiActivityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activities, setActivities] = useState<ApiActivityItem[]>([]);

  useEffect(() => {
    const unsubscribe = subscribeToApiActivity((item) => {
      setActivities((prev) => [item, ...prev.slice(0, 49)]); // Keep last 50 activities
    });
    return () => unsubscribe();
  }, []);

  const clearActivities = () => setActivities([]);

  return (
    <ApiActivityContext.Provider
      value={{
        activities,
        clearActivities,
        latestActivity: activities[0] || null,
      }}
    >
      {children}
    </ApiActivityContext.Provider>
  );
};

export const useApiActivity = () => {
  const context = useContext(ApiActivityContext);
  if (!context) {
    throw new Error('useApiActivity must be used within an ApiActivityProvider');
  }
  return context;
};
