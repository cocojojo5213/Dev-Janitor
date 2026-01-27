import { Suspense, lazy } from 'react';
import { useAppStore } from './store';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import './styles/index.css';

// Lazy load views for better performance
const ToolsView = lazy(() => import('./components/views/ToolsView').then(m => ({ default: m.ToolsView })));
const SettingsView = lazy(() => import('./components/views/SettingsView').then(m => ({ default: m.SettingsView })));
const PackagesView = lazy(() => import('./components/views/PackagesView').then(m => ({ default: m.PackagesView })));
const CacheView = lazy(() => import('./components/views/CacheView').then(m => ({ default: m.CacheView })));
const AiCleanupView = lazy(() => import('./components/views/AiCleanupView').then(m => ({ default: m.AiCleanupView })));
const ChatHistoryView = lazy(() => import('./components/views/ChatHistoryView').then(m => ({ default: m.ChatHistoryView })));
const ServicesView = lazy(() => import('./components/views/ServicesView').then(m => ({ default: m.ServicesView })));
const ConfigView = lazy(() => import('./components/views/ConfigView').then(m => ({ default: m.ConfigView })));
const AiCliView = lazy(() => import('./components/views/AiCliView').then(m => ({ default: m.AiCliView })));
const SecurityScanView = lazy(() => import('./components/views/SecurityScanView').then(m => ({ default: m.SecurityScanView })));

function LoadingFallback() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
      <div className="spinner" />
    </div>
  );
}

function CurrentView() {
  const currentView = useAppStore((state) => state.currentView);

  const viewComponents: Record<string, React.LazyExoticComponent<() => JSX.Element>> = {
    tools: ToolsView,
    packages: PackagesView,
    cache: CacheView,
    ai_cleanup: AiCleanupView,
    chat_history: ChatHistoryView,
    services: ServicesView,
    config: ConfigView,
    ai_cli: AiCliView,
    security_scan: SecurityScanView,
    settings: SettingsView,
  };

  const ViewComponent = viewComponents[currentView];

  return (
    <Suspense fallback={<LoadingFallback />}>
      <ViewComponent />
    </Suspense>
  );
}

function App() {
  return (
    <div className="app-container">
      <Sidebar />
      <main className="main-content">
        <Header />
        <div className="content-area">
          <CurrentView />
        </div>
      </main>
    </div>
  );
}

export default App;
