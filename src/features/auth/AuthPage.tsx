import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Mail, Lock, User, ArrowRight, Eye, EyeOff, BookOpen, CheckCircle, AlertCircle } from 'lucide-react';

export const AuthPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsSubmitting(true);

    try {
      if (activeTab === 'login') {
        const { error } = await signIn(email, password);
        if (error) {
          setErrorMsg(error.message || 'Error al iniciar sesión. Verifique sus credenciales.');
        } else {
          // Redirect based on role or let state router handle it
          navigate('/');
        }
      } else {
        const { error } = await signUp(email, password, fullName);
        if (error) {
          setErrorMsg(error.message || 'Error al registrarse. Intente con otro correo.');
        } else {
          setSuccessMsg('Registro de tesista completado. Ya puede iniciar sesión en la plataforma.');
          setActiveTab('login');
        }
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Ocurrió un error inesperado';
      setErrorMsg(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#151311] text-[#e7e1de] flex flex-col justify-center items-center p-4 sm:p-6 lg:p-12 font-sans selection:bg-[#c05c3d] selection:text-[#faf8f5]">
      <div className="w-full max-w-6xl mx-auto flex flex-col justify-center">
        {/* Header Editorial Central */}
        <header className="text-center mb-8 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-[#2c2a27] text-[#dcc1b9] text-xs font-semibold uppercase tracking-wider mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-[#c05c3d]"></span>
            <span>Registro Oficial · Convocatoria Doctoral 2026-II</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl text-[#e7e1de] tracking-tight">
            Acceso Institucional y Registro
          </h1>
          <p className="font-serif text-base sm:text-lg text-[#dcc1b9] mt-2 italic">
            Plataforma de Seguimiento Académico y Evaluación de Posgrado (MAGIC)
          </p>
        </header>

        {/* Dos Columnas: Pergamino Claro Izquierda + Dark Editorial Derecha */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Columna Izquierda: Tarjeta Pergamino Claro */}
          <section className="lg:col-span-6 bg-[#faf8f5] text-[#1e1c1a] rounded-xl p-6 sm:p-8 lg:p-10 shadow-2xl flex flex-col justify-between border border-[#e3dcd1]">
            <div>
              {/* Pestañas Institucionales */}
              <div className="flex items-center gap-6 border-b border-[#e5dfd5] pb-3 mb-6">
                <button
                  type="button"
                  onClick={() => { setActiveTab('login'); setErrorMsg(null); }}
                  className={`font-semibold text-sm pb-2 border-b-2 transition-all ${
                    activeTab === 'login'
                      ? 'border-[#c05c3d] text-[#c05c3d]'
                      : 'border-transparent text-[#7a746e] hover:text-[#1e1c1a]'
                  }`}
                >
                  Iniciar Sesión
                </button>
                <button
                  type="button"
                  onClick={() => { setActiveTab('register'); setErrorMsg(null); }}
                  className={`font-semibold text-sm pb-2 border-b-2 transition-all ${
                    activeTab === 'register'
                      ? 'border-[#c05c3d] text-[#c05c3d]'
                      : 'border-transparent text-[#7a746e] hover:text-[#1e1c1a]'
                  }`}
                >
                  Registro de Tesista
                </button>
              </div>

              {errorMsg && (
                <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded text-red-800 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {successMsg && (
                <div className="mb-4 p-3 bg-emerald-100 border border-emerald-300 rounded text-emerald-800 text-xs flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>{successMsg}</span>
                </div>
              )}

              {/* Formulario */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {activeTab === 'register' && (
                  <div className="space-y-1">
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#4a453e]" htmlFor="fullname">
                      Nombre Completo del Tesista
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8c8278] w-4 h-4" />
                      <input
                        id="fullname"
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Lic. / Mtro. Nombre y Apellidos"
                        className="w-full pl-10 pr-3 py-2.5 bg-[#f0eae1] rounded text-[#1e1c1a] text-sm placeholder-[#9c9389] focus:outline-none focus:bg-white border border-[#ded6ca] transition-colors"
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#4a453e]" htmlFor="email">
                    Correo Institucional (@universidad.edu)
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8c8278] w-4 h-4" />
                    <input
                      id="email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="investigador@universidad.edu"
                      className="w-full pl-10 pr-3 py-2.5 bg-[#f0eae1] rounded text-[#1e1c1a] text-sm placeholder-[#9c9389] focus:outline-none focus:bg-white border border-[#ded6ca] transition-colors"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#4a453e]" htmlFor="password">
                    Contraseña
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8c8278] w-4 h-4" />
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full pl-10 pr-10 py-2.5 bg-[#f0eae1] rounded text-[#1e1c1a] text-sm placeholder-[#9c9389] focus:outline-none focus:bg-white border border-[#ded6ca] transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8c8278] hover:text-[#1e1c1a]"
                      aria-label="Ver contraseña"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full mt-6 py-3 px-4 bg-[#c05c3d] text-white font-semibold text-sm rounded hover:bg-[#ab5034] active:scale-[0.99] transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer disabled:opacity-50"
                >
                  <span>{isSubmitting ? 'Procesando...' : activeTab === 'login' ? 'Ingresar a la Plataforma' : 'Registrar Candidatura'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            </div>

            {/* Footer institucional */}
            <div className="pt-4 mt-6 border-t border-[#ded6ca] flex items-center justify-between text-xs text-[#6b6257]">
              <span>Sistema de Posgrados e Investigación</span>
              <span className="font-semibold text-[#8a523b]">Sede Central</span>
            </div>
          </section>

          {/* Columna Derecha: Tarjeta Estética Académica & Monografía */}
          <section className="lg:col-span-6 bg-[#211f1d] rounded-xl p-6 sm:p-8 lg:p-10 flex flex-col justify-between shadow-2xl border border-[#2c2a27]">
            {/* Visual banner */}
            <div className="relative w-full h-48 sm:h-56 rounded-lg overflow-hidden bg-[#100e0c] flex items-center justify-center">
              <div className="absolute inset-0 bg-gradient-to-t from-[#211f1d] via-transparent to-transparent z-10"></div>
              <div className="text-center p-6 z-20">
                <BookOpen className="w-12 h-12 text-[#c05c3d] mx-auto mb-2 opacity-80" />
                <span className="font-serif text-lg text-[#faf8f5] italic block">
                  Sala de Archivo y Monografías
                </span>
                <span className="text-xs uppercase tracking-widest text-[#a48b84]">
                  Claustro de Investigación Doctoral
                </span>
              </div>
            </div>

            {/* Cita Editorial */}
            <div className="my-6 bg-[#1d1b19] p-5 rounded-lg border border-[#2c2a27]">
              <blockquote className="font-serif text-base sm:text-lg text-[#e7e1de] leading-snug italic">
                «La investigación formativa es un proceso de diálogo riguroso, deliberación sistemática y crecimiento del juicio reflexivo.»
              </blockquote>
              <cite className="block text-xs text-[#c05c3d] mt-2 not-italic font-semibold tracking-wide">
                — Comisión General de Posgrados e Investigación
              </cite>
            </div>

            {/* Indicadores de Comunidad */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-[#2c2a27] rounded flex flex-col border border-[#373432]">
                <span className="text-[11px] uppercase tracking-wider text-[#8cb89f] font-semibold">
                  Tesistas en cohorte
                </span>
                <span className="font-serif text-2xl font-bold text-[#faf8f5] mt-1">15</span>
                <span className="text-xs text-[#a48b84]">proyectos activos</span>
              </div>
              <div className="p-4 bg-[#2c2a27] rounded flex flex-col border border-[#373432]">
                <span className="text-[11px] uppercase tracking-wider text-[#dfbe76] font-semibold">
                  Cumplimiento
                </span>
                <span className="font-serif text-2xl font-bold text-[#faf8f5] mt-1">98.4%</span>
                <span className="text-xs text-[#a48b84]">Comité Tutorial</span>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
