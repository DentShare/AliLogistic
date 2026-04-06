import { Routes, Route, Navigate } from 'react-router-dom'
import { useApp } from './context/AppContext'
import Sidebar from './components/Sidebar'
import Header from './components/Header'
import ToastContainer from './components/Toast'
import GlobalModals from './components/GlobalModals'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import OilFluids from './pages/OilFluids'
import Inspections from './pages/Inspections'
import Registrations from './pages/Registrations'
import Repairs from './pages/Repairs'
import Defects from './pages/Defects'
import UnitsList from './pages/UnitsList'
import UnitProfile from './pages/UnitProfile'
import DriversHR from './pages/DriversHR'
import AuditLog from './pages/AuditLog'
import Dispatchers from './pages/Dispatchers'
import Updates from './pages/Updates'
import StatusLog from './pages/StatusLog'

export default function App() {
  const { theme, fullscreen, isAuthenticated } = useApp()

  if (!isAuthenticated) {
    return <Login />
  }

  return (
    <div className="flex min-h-screen w-full bg-navy-950" data-theme={theme}>
      {!fullscreen && <Sidebar />}
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="flex-1 p-6 overflow-auto">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/updates" element={<Updates />} />
            <Route path="/updates/log" element={<StatusLog />} />
            <Route path="/oil" element={<OilFluids />} />
            <Route path="/inspections" element={<Inspections />} />
            <Route path="/registrations" element={<Registrations />} />
            <Route path="/repairs" element={<Repairs />} />
            <Route path="/defects" element={<Defects />} />
            <Route path="/units" element={<UnitsList />} />
            <Route path="/units/:id" element={<UnitProfile />} />
            <Route path="/drivers" element={<DriversHR />} />
            <Route path="/dispatchers" element={<Dispatchers />} />
            <Route path="/audit" element={<AuditLog />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
      </div>
      <GlobalModals />
      <ToastContainer />
    </div>
  )
}
