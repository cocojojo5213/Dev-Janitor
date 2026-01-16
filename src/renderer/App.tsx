/**
 * App Component
 * 
 * Root component for the Dev Tools Manager application.
 * Uses AppLayout to provide the main UI structure.
 * Wrapped with ErrorBoundary for global error handling.
 * 
 * Validates: Requirements 5.1, 5.6, 8.1, 8.2, 8.5
 */

import { useEffect } from 'react'
import { ConfigProvider } from 'antd'
import { AppLayout, ErrorBoundary } from './components'
import './i18n'

function App() {
  // Load saved AI config on startup and send to main process
  useEffect(() => {
    const loadAIConfig = async () => {
      const savedConfig = localStorage.getItem('aiConfig')
      if (savedConfig) {
        try {
          const config = JSON.parse(savedConfig)
          await window.electronAPI.ai.updateConfig(config)
          console.log('AI config loaded from localStorage')
        } catch (error) {
          console.error('Failed to load AI config:', error)
        }
      }
    }
    loadAIConfig()
  }, [])

  return (
    <ErrorBoundary>
      <ConfigProvider
        theme={{
          token: {
            colorPrimary: '#1677ff',
            borderRadius: 6,
          },
        }}
      >
        <AppLayout />
      </ConfigProvider>
    </ErrorBoundary>
  )
}

export default App
