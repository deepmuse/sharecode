import { Routes, Route } from 'react-router-dom'
import CreatePage from './pages/CreatePage'
import ClaimPage from './pages/ClaimPage'
import ManagePage from './pages/ManagePage'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'

export default function App() {
  return (
    <div className="min-h-dvh bg-background">
      <div className="fixed top-3 right-3 z-40">
        <LanguageSwitcher />
      </div>
      <Routes>
        <Route path="/" element={<CreatePage />} />
        <Route path="/s/:shareId" element={<ClaimPage />} />
        <Route path="/manage/:shareId" element={<ManagePage />} />
      </Routes>
    </div>
  )
}