
import { useState, useRef, useEffect, useCallback } from 'react'
import './App.css'

const API_URL = 'https://input-back.onrender.com/api/nombres'

interface Registro {
  id: number
  name: string
  created_at: string
}

function App() {
  const [nombre, setNombre] = useState('')
  const [registros, setRegistros] = useState<Registro[]>([])
  const [editandoId, setEditandoId] = useState<number | null>(null)
  const [menuAbiertoId, setMenuAbiertoId] = useState<number | null>(null)
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Obtener todos los registros
  const fetchRegistros = useCallback(async () => {
    setCargando(true)
    setError(null)
    try {
      const res = await fetch(API_URL)
      if (!res.ok) throw new Error('Error al obtener los nombres')
      const data: Registro[] = await res.json()
      setRegistros(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error de conexión con el servidor')
    } finally {
      setCargando(false)
    }
  }, [])

  // Cargar registros al montar
  useEffect(() => {
    fetchRegistros()
  }, [fetchRegistros])

  // Cerrar menú al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuAbiertoId(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nombre.trim()) return

    if (/[<>]/.test(nombre)) {
      setError('¡Eyeyeyeyyy, tranquilo hacker! No se permiten los caracteres < > :v')
      return
    }

    if (/[*]/.test(nombre)) {
      setError('¡Eyeyeyeyyy, tranquilo hacker! SELECT * FROM ip; 127.0.0.1 :v')
      return
    }
    setError(null)

    try {
      if (editandoId !== null) {
        // PUT /api/nombres/:id
        const res = await fetch(`${API_URL}/${editandoId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: nombre.trim() }),
        })
        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.error || 'Error al actualizar')
        }
        setEditandoId(null)
      } else {
        // POST /api/nombres
        const res = await fetch(API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: nombre.trim() }),
        })
        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.error || 'Error al crear')
        }
      }
      setNombre('')
      await fetchRegistros()
      inputRef.current?.focus()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error inesperado')
    }
  }

  const handleEditar = (registro: Registro) => {
    setNombre(registro.name)
    setEditandoId(registro.id)
    setMenuAbiertoId(null)
    inputRef.current?.focus()
  }

  const handleEliminar = async (id: number) => {
    setMenuAbiertoId(null)
    setError(null)
    try {
      // DELETE /api/nombres/:id
      const res = await fetch(`${API_URL}/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Error al eliminar')
      }
      if (editandoId === id) {
        setEditandoId(null)
        setNombre('')
      }
      await fetchRegistros()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error inesperado')
    }
  }

  const handleCancelar = () => {
    setEditandoId(null)
    setNombre('')
    inputRef.current?.focus()
  }

  const handleInputChange = (value: string) => {
    if (value.length <= 255) {
      setNombre(value)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-start justify-center pt-16 px-4">
      <div className="w-full max-w-xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white tracking-tight">
            Registro de Nombres
          </h1>
          <p className="text-slate-400 mt-2 text-sm">
            Agrega, edita y elimina registros
          </p>
        </div>

        {/* Error banner */}
        {error && (
          <div className="mb-4 px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center justify-between">
            <p className="text-sm text-red-400">{error}</p>
            <button onClick={() => setError(null)} className="text-red-400 hover:text-red-300 ml-3 cursor-pointer">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        )}

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="mb-8">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <input
                ref={inputRef}
                type="text"
                value={nombre}
                onChange={e => handleInputChange(e.target.value)}
                placeholder="Escribe un nombre..."
                maxLength={255}
                className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 outline-none transition-all duration-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:bg-slate-800"
              />
              {editandoId !== null && (
                <button
                  type="button"
                  onClick={handleCancelar}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                  title="Cancelar edición"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              )}
            </div>
            <button
              type="submit"
              className={`px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-200 cursor-pointer ${
                editandoId !== null
                  ? 'bg-amber-500 hover:bg-amber-400 text-slate-900 shadow-lg shadow-amber-500/20'
                  : 'bg-blue-500 hover:bg-blue-400 text-white shadow-lg shadow-blue-500/20'
              }`}
            >
              {editandoId !== null ? 'Guardar' : 'Agregar'}
            </button>
          </div>
          {nombre.length > 0 && (
            <p className={`text-xs mt-2 text-right ${
              nombre.length > 240 ? 'text-amber-400' : 'text-slate-500'
            }`}>
              {nombre.length}/255
            </p>
          )}
        </form>

        {/* Tabla de registros */}
        <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl overflow-hidden backdrop-blur-sm">
          {/* Header de tabla */}
          <div className="grid grid-cols-[60px_1fr_48px] px-5 py-3 bg-slate-800/60 border-b border-slate-700/50">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">#</span>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Nombre</span>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider text-right"></span>
          </div>

          {/* Registros */}
          {cargando ? (
            <div className="px-5 py-12 text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-slate-600 border-t-blue-500"></div>
              <p className="text-slate-500 text-sm mt-3">Cargando registros...</p>
            </div>
          ) : registros.length === 0 ? (
            <div className="px-5 py-12 text-center">
              <div className="text-slate-600 mb-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <p className="text-slate-500 text-sm">No hay registros aún</p>
              <p className="text-slate-600 text-xs mt-1">Agrega un nombre para comenzar</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-700/30">
              {registros.map((registro, index) => (
                <div
                  key={registro.id}
                  className={`grid grid-cols-[60px_1fr_48px] items-center px-5 py-3.5 transition-colors duration-150 hover:bg-slate-700/20 ${
                    editandoId === registro.id ? 'bg-amber-500/5 border-l-2 border-l-amber-500' : ''
                  }`}
                >
                  <span className="text-sm font-mono text-slate-500">{index + 1}</span>
                  <span className="text-sm text-slate-200 truncate">{registro.name}</span>
                  <div className="relative flex justify-end" ref={menuAbiertoId === registro.id ? menuRef : null}>
                    <button
                      onClick={() => setMenuAbiertoId(menuAbiertoId === registro.id ? null : registro.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/50 transition-all duration-150 cursor-pointer"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                      </svg>
                    </button>

                    {/* Menú desplegable */}
                    {menuAbiertoId === registro.id && (
                      <div className="absolute right-0 top-full mt-1 w-36 bg-slate-800 border border-slate-600/50 rounded-xl shadow-xl shadow-black/30 z-50 overflow-hidden animate-in fade-in">
                        <button
                          onClick={() => handleEditar(registro)}
                          className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-700/60 hover:text-white transition-colors cursor-pointer"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                          </svg>
                          Editar
                        </button>
                        <button
                          onClick={() => handleEliminar(registro.id)}
                          className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors cursor-pointer"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          Eliminar
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Footer con conteo */}
          {registros.length > 0 && (
            <div className="px-5 py-2.5 bg-slate-800/40 border-t border-slate-700/50">
              <p className="text-xs text-slate-500">
                {registros.length} registro{registros.length !== 1 ? 's' : ''}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default App
