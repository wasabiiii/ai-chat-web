import React, { createContext, useContext, useState, useCallback } from 'react';
import { modelList } from '@utils/constants';
import { SELECTED_MODEL_LOCAL_KEY } from '@utils/constants';

interface ModelContextType {
  selectedModel: string;
  setSelectedModel: (model: string) => void;
}

const ModelContext = createContext<ModelContextType | undefined>(undefined);

export const ModelProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedModel, setSelectedModel] = useState(() => {
    // 从 localStorage 中读取保存的模型
    const savedModel = localStorage.getItem(SELECTED_MODEL_LOCAL_KEY);
    return savedModel || modelList[0].value;
  });

  const handleModelChange = useCallback((model: string) => {
    setSelectedModel(model);
    // 保存到 localStorage
    localStorage.setItem(SELECTED_MODEL_LOCAL_KEY, model);
  }, []);

  return (
    <ModelContext.Provider value={{ selectedModel, setSelectedModel: handleModelChange }}>
      {children}
    </ModelContext.Provider>
  );
};

export const useModel = () => {
  const context = useContext(ModelContext);
  if (!context) {
    throw new Error('useModel must be used within a ModelProvider');
  }
  return context;
};
