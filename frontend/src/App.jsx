import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { DocumentProvider } from './context/DocumentContext';
import { ThemeProvider } from './context/ThemeContext';
import MainLayout from './layouts/MainLayout';
import Dashboard from './pages/Dashboard';
import ChatAssistant from './pages/ChatAssistant';
import MedicalSummary from './pages/MedicalSummary';
import EvidenceViewer from './pages/EvidenceViewer';
import Analytics from './pages/Analytics';
import VoiceAssistantPage from './pages/VoiceAssistant';

function App() {
  return (
    <ThemeProvider>
      <DocumentProvider>
        <BrowserRouter>
          <MainLayout>
            <Routes>
              <Route path="/"         element={<Dashboard />} />
              <Route path="/chat"     element={<ChatAssistant />} />
              <Route path="/voice"    element={<VoiceAssistantPage />} />
              <Route path="/summary"  element={<MedicalSummary />} />
              <Route path="/evidence" element={<EvidenceViewer />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="*"         element={<Navigate to="/" replace />} />
            </Routes>
          </MainLayout>
        </BrowserRouter>
      </DocumentProvider>
    </ThemeProvider>
  );
}

export default App;
