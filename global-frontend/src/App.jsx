import { useContext } from 'react';
import { AuthContext } from './context/AuthContext';

function App() {
  // Pull the global state and functions from your Context
  const { user, login, logout } = useContext(AuthContext);

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>Platform Global State Test</h1>

      <div style={{ margin: '2rem 0', padding: '1rem', border: '2px solid black' }}>
        {/* Dynamically render the UI based on the global user state */}
        <h2>Current Status: {user ? `Logged in as ${user.role}` : 'Not Logged In'}</h2>
      </div>

      <div style={{ display: 'flex', gap: '1rem' }}>
        <button onClick={() => login({ role: 'retailer', token: 'dummy_token_123' })}>
          Simulate Retailer Login
        </button>
        <button onClick={() => login({ role: 'manufacturer', token: 'dummy_token_456' })}>
          Simulate Manufacturer Login
        </button>
        <button onClick={logout}>
          Logout
        </button>
      </div>
    </div>
  )
}

export default App;