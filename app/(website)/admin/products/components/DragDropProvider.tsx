'use client';

import React, { createContext, useContext } from 'react';

interface DragDropContextType {
  // We'll use basic HTML5 drag and drop functionality
}

const DragDropContext = createContext<DragDropContextType | null>(null);

export function DragDropProvider({ children }: { children: React.ReactNode }) {
  return (
    <DragDropContext.Provider value={{}}>
      {children}
    </DragDropContext.Provider>
  );
}

export function useDragDrop() {
  const context = useContext(DragDropContext);
  if (!context) {
    throw new Error('useDragDrop must be used within a DragDropProvider');
  }
  return context;
}