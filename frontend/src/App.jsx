import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { DocumentProvider } from './context/DocumentContext';
import MainLayout from './layouts/MainLayout';
import Dashboard from './pages/Dashboard';
import ChatAssistant from './pages/ChatAssistant';
import MedicalSummary from './pages/MedicalSummary';
import EvidenceViewer from './pages/EvidenceViewer';

// RISK-10: DocumentProvider wraps BrowserRouter, not the other way around
function App() {
  return (
    <DocumentProvider>
      <BrowserRouter>
        <MainLayout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/chat" element={<ChatAssistant />} />
            <Route path="/summary" element={<MedicalSummary />} />
            <Route path="/evidence" element={<EvidenceViewer />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </MainLayout>
      </BrowserRouter>
    </DocumentProvider>
  );
}

export default App;
