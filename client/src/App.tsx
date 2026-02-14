import { Routes, Route, Navigate } from 'react-router-dom'
import Home from './pages/Home'
import Room from './pages/Room'
import Connection from './pages/Connection'
import './App.css'

function App() {
  return (
    <div className="app">
      <Routes>
        <Route path="/" element={<Navigate to="/connection" replace />} />
        <Route path="/home" element={<Home />} />
        <Route path="/room/:roomId" element={<Room />} />
        <Route path="/connection" element={<Connection />} />
      </Routes>
    </div>
  )
}

export default App