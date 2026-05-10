import { createContext, useContext, useState } from 'react';

const DocumentContext = createContext(null);

export const DocumentProvider = ({ children }) => {
  const [documentLoaded, setDocumentLoaded] = useState(false);
  const [uploadMeta, setUploadMeta] = useState(null);
  const [chatHistory, setChatHistory] = useState([]);
  const [summary, setSummary] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);

  const addChatMessage = (message) => {
    setChatHistory(prev => [...prev, message]);
  };

  const clearAll = () => {
    setDocumentLoaded(false);
    setUploadMeta(null);
    setChatHistory([]);
    setSummary(null);
  };

  return (
    <DocumentContext.Provider value={{
      documentLoaded, setDocumentLoaded,
      uploadMeta, setUploadMeta,
      chatHistory, addChatMessage,
      summary, setSummary,
      isUploading, setIsUploading,
      uploadError, setUploadError,
      clearAll
    }}>
      {children}
    </DocumentContext.Provider>
  );
};

export const useDocument = () => {
  const ctx = useContext(DocumentContext);
  if (!ctx) throw new Error('useDocument must be used within DocumentProvider');
  return ctx;
};
