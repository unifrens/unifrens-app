import { createContext, useContext, useState } from 'react';

export const RewardsContext = createContext();

export const RewardsProvider = ({ children }) => {
  const [totalPendingRewards, setTotalPendingRewards] = useState(0n);

  return (
    <RewardsContext.Provider value={{ totalPendingRewards, setTotalPendingRewards }}>
      {children}
    </RewardsContext.Provider>
  );
};

export const useRewards = () => {
  const context = useContext(RewardsContext);
  if (!context) {
    throw new Error('useRewards must be used within a RewardsProvider');
  }
  return context;
}; 