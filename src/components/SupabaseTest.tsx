'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function SupabaseTest() {
  const [status, setStatus] = useState<string>('')
  const [error, setError] = useState<string>('')

  const testConnection = async () => {
    try {
      setStatus('Testing connection...')
      setError('')
      
      // Simple connection test - just try to get session info
      const { error } = await supabase.auth.getSession()
      
      if (error) {
        setError(`Connection failed: ${error.message}`)
        setStatus('')
      } else {
        setStatus('✅ Supabase connection successful!')
      }
    } catch (err) {
      setError(`Error: ${err}`)
      setStatus('')
    }
  }

  return (
    <div className="p-4 border rounded-lg">
      <h3 className="text-lg font-semibold mb-4">Supabase Connection Test</h3>
      <button 
        onClick={testConnection}
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
      >
        Test Connection
      </button>
      
      {status && (
        <div className="mt-4 p-2 bg-green-100 text-green-800 rounded">
          {status}
        </div>
      )}
      
      {error && (
        <div className="mt-4 p-2 bg-red-100 text-red-800 rounded">
          {error}
        </div>
      )}
    </div>
  )
}
