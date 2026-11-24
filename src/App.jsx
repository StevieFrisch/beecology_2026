import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import Home from './pages/Home.jsx'
import Beedex from './pages/Beedex.jsx'
import BeeDetail from './pages/BeeDetail.jsx'
import ButterflyDetail from './pages/ButterflyDetail.jsx'
import FamilyDetail from './pages/FamilyDetail.jsx'
import Logs from './pages/Logs.jsx'
import LogDetail from './pages/LogDetail.jsx'
import Tutorial from './pages/Tutorial.jsx'
import Login from './pages/Login.jsx'
import Signup from './pages/Signup.jsx'
import CollectFlow from './collect/CollectFlow.jsx'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="beedex" element={<Beedex />} />
        <Route path="beedex/bee/:species" element={<BeeDetail />} />
        <Route path="beedex/butterfly/:id" element={<ButterflyDetail />} />
        <Route path="beedex/family/:name" element={<FamilyDetail />} />
        <Route path="logs" element={<Logs />} />
        <Route path="logs/:id" element={<LogDetail />} />
        <Route path="collect" element={<CollectFlow />} />
        <Route path="tutorial" element={<Tutorial />} />
        <Route path="login" element={<Login />} />
        <Route path="signup" element={<Signup />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
