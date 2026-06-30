import React, { useState, useEffect } from 'react';
import './App.css';

export default function App() {
  // --- STATE ---
  const [user, setUser] = useState(null); // Logged in user: { id, name, email, phone, type }
  const [activeTab, setActiveTab] = useState('calendario'); // 'calendario' | 'mural' | 'aovivo'
  const [roleView, setRoleView] = useState('senior'); // 'senior' | 'tutor'
  const [activities, setActivities] = useState([]);
  const [myEnrollments, setMyEnrollments] = useState([]); // List of activity IDs enrolled
  
  // Calendar Navigation
  const [currentMonth, setCurrentMonth] = useState('Junho'); // 'Junho' | 'Julho'
  const [selectedDay, setSelectedDay] = useState(10); // Selected day of current month

  // Forms
  const [isLoginTab, setIsLoginTab] = useState(true);
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [registerForm, setRegisterForm] = useState({ name: '', email: '', phone: '', password: '', confirmPassword: '', type: 'senior' });
  const [newActivityForm, setNewActivityForm] = useState({ name: '', date: '2026-06-10', time: '14:00', numParticipants: 10 });
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Password recovery modal state
  const [showRecoverModal, setShowRecoverModal] = useState(false);
  const [recoverEmail, setRecoverEmail] = useState('');

  // Modals & Context
  const [modalType, setModalType] = useState(null); // 'confirm' | 'cancelar' | 'novaSessao' | 'sucesso' | null
  const [currentActivityContext, setCurrentActivityContext] = useState(null);
  const [toast, setToast] = useState(null);

  // Live session mock interactions
  const [isLiveConnected, setIsLiveConnected] = useState(false);
  const [liveMic, setLiveMic] = useState(true);
  const [liveCam, setLiveCam] = useState(true);
  const [requestedWord, setRequestedWord] = useState(false);
  const [moderatorGrantedWord, setModeratorGrantedWord] = useState(false);

  // Toast Helper
  const showToast = (message, isError = false) => {
    setToast({ message, isError });
    setTimeout(() => setToast(null), 3500);
  };

  // Load activities from Spring Boot
  const loadActivities = async () => {
    try {
      const res = await fetch('/vivamais/activities');
      if (res.ok) {
        const data = await res.json();
        setActivities(data);
      }
    } catch (err) {
      console.error("Erro ao carregar atividades do backend:", err);
      showToast("Não foi possível conectar com o servidor.", true);
    }
  };

  useEffect(() => {
    loadActivities();
  }, []);

  // --- AUTHENTICATION HANDLERS ---
  const handleLogin = async (e) => {
    e.preventDefault();
    if (!loginForm.email || !loginForm.password) {
      showToast("Preencha todos os campos.", true);
      return;
    }
    try {
      const res = await fetch('/vivamais/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginForm.email, password: loginForm.password })
      });
      if (res.ok) {
        const loggedUser = await res.json();
        setUser(loggedUser);
        setRoleView(loggedUser.type); // Sync role view initially
        showToast(`Bem-vindo, ${loggedUser.name}! 👋`);
        setActiveTab('calendario');
      } else {
        showToast("E-mail ou senha incorretos.", true);
      }
    } catch (err) {
      showToast("Erro ao realizar login.", true);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    const { name, email, phone, password, confirmPassword, type } = registerForm;
    if (!name || !email || !phone || !password) {
      showToast("Preencha todos os campos obrigatórios.", true);
      return;
    }
    if (password.length < 6) {
      showToast("A senha deve ter pelo menos 6 caracteres.", true);
      return;
    }
    if (password !== confirmPassword) {
      showToast("As senhas não coincidem.", true);
      return;
    }

    try {
      const res = await fetch('/vivamais/newuser', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone, password, type })
      });

      if (res.ok) {
        showToast("Cadastro realizado com sucesso! 🌱");
        setIsLoginTab(true);
        setLoginForm({ email, password });
      } else {
        showToast("Este e-mail já está cadastrado.", true);
      }
    } catch (err) {
      showToast("Erro ao registrar usuário.", true);
    }
  };

  const handleLogout = () => {
    setUser(null);
    setMyEnrollments([]);
    showToast("Você saiu da plataforma.");
  };

  const handleRecoverPassword = (e) => {
    e.preventDefault();
    if (!recoverEmail) {
      showToast("Por favor, preencha o e-mail.", true);
      return;
    }
    setShowRecoverModal(false);
    setRecoverEmail('');
    showToast("🔑 E-mail de recuperação enviado!");
  };

  // --- ACTIVITY HANDLERS (Moderators only) ---
  const handleSaveActivity = async (e) => {
    e.preventDefault();
    const { name, date, time, numParticipants } = newActivityForm;
    if (!name || !date || !time) {
      showToast("Preencha todos os campos da atividade.", true);
      return;
    }

    const activityData = {
      id: isEditing ? editingId : 0,
      name,
      date,
      time,
      numParticipants: parseInt(numParticipants, 10),
      participants: []
    };

    try {
      let res;
      if (isEditing) {
        res = await fetch(`/vivamais/activities/${editingId}`, {
          method: 'PUT',
          headers: { 
            'Content-Type': 'application/json',
            'X-User-Id': user.id.toString()
          },
          body: JSON.stringify(activityData)
        });
      } else {
        res = await fetch('/vivamais/activities', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'X-User-Id': user.id.toString()
          },
          body: JSON.stringify(activityData)
        });
      }

      if (res.ok) {
        showToast(isEditing ? "Atividade atualizada! ✏️" : "Atividade criada com sucesso! 🚀");
        setModalType(null);
        setIsEditing(false);
        setEditingId(null);
        setNewActivityForm({ name: '', date: '2026-06-10', time: '14:00', numParticipants: 10 });
        loadActivities();
      } else {
        const errorText = await res.text();
        showToast(errorText || "Operação não autorizada.", true);
      }
    } catch (err) {
      showToast("Erro ao salvar atividade.", true);
    }
  };

  // Populate Demo activities (helper for testing frontend with backend JSON)
  const populateDemoActivities = async () => {
    const demoActivities = [
      { name: "Yoga para o Bem-Estar", date: "2026-06-02", time: "14:00", numParticipants: 10 },
      { name: "Exercícios de Memória", date: "2026-06-04", time: "16:30", numParticipants: 8 },
      { name: "Alongamento Leve", date: "2026-06-08", time: "14:00", numParticipants: 12 },
      { name: "Yoga para o Bem-Estar", date: "2026-06-10", time: "14:00", numParticipants: 10 },
      { name: "Exercícios de Memória", date: "2026-06-10", time: "16:30", numParticipants: 8 },
      { name: "Roda de Conversa", date: "2026-06-10", time: "18:00", numParticipants: 10 },
      { name: "Pilates para Todos", date: "2026-06-11", time: "15:00", numParticipants: 15 },
      { name: "Exercícios de Equilíbrio", date: "2026-06-15", time: "14:00", numParticipants: 10 },
      { name: "Exercícios de Memória", date: "2026-06-17", time: "16:30", numParticipants: 8 },
      { name: "Alongamento Matinal", date: "2026-06-22", time: "14:00", numParticipants: 12 },
      { name: "Pilates para Todos", date: "2026-06-25", time: "15:00", numParticipants: 15 },
      { name: "Exercícios de Equilíbrio", date: "2026-06-29", time: "14:00", numParticipants: 10 },
    ];

    try {
      showToast("Iniciando carregamento de demonstração...");
      for (const act of demoActivities) {
        await fetch('/vivamais/activities', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'X-User-Id': user.id.toString()
          },
          body: JSON.stringify({ ...act, id: 0 })
        });
      }
      showToast("Dados de demonstração carregados! 🎉");
      loadActivities();
    } catch (err) {
      showToast("Erro ao carregar dados de demonstração.", true);
    }
  };

  // --- SENIOR ENROLLMENT HANDLERS (Simulated in React State) ---
  const handleEnrollClick = (activity) => {
    setCurrentActivityContext(activity);
    setModalType('confirm');
  };

  const confirmEnrollment = () => {
    if (currentActivityContext) {
      setMyEnrollments([...myEnrollments, currentActivityContext.id]);
      setModalType('sucesso');
      showToast(`Inscrição confirmada na atividade: ${currentActivityContext.name}!`);
    }
  };

  const handleCancelClick = (activity) => {
    setCurrentActivityContext(activity);
    setModalType('cancelar');
  };

  const confirmCancellation = () => {
    if (currentActivityContext) {
      setMyEnrollments(myEnrollments.filter(id => id !== currentActivityContext.id));
      setModalType(null);
      showToast(`Inscrição cancelada para: ${currentActivityContext.name}.`);
    }
  };

  // --- CALENDAR RENDER HELPERS ---
  const handleDaySelect = (day) => {
    setSelectedDay(day);
  };

  const getDaysInMonth = () => {
    // June 2026 has 30 days and starts on Monday (1 empty slot for Sunday)
    // July 2026 has 31 days and starts on Wednesday (3 empty slots: Sun, Mon, Tue)
    if (currentMonth === 'Junho') {
      return { total: 30, emptyStart: 1, yearMonth: '2026-06' };
    } else {
      return { total: 31, emptyStart: 3, yearMonth: '2026-07' };
    }
  };

  const monthDetails = getDaysInMonth();
  const calendarCells = [];
  // Fill empty leading days
  for (let i = 0; i < monthDetails.emptyStart; i++) {
    calendarCells.push({ dayNum: null, dateStr: '' });
  }
  // Fill month days
  for (let d = 1; d <= monthDetails.total; d++) {
    const dayStr = d < 10 ? `0${d}` : `${d}`;
    const dateStr = `${monthDetails.yearMonth}-${dayStr}`;
    calendarCells.push({ dayNum: d, dateStr });
  }

  // Filter activities for active day view
  const currentSelectedDateStr = `${monthDetails.yearMonth}-${selectedDay < 10 ? '0' + selectedDay : selectedDay}`;
  const dayActivities = activities.filter(act => act.date === currentSelectedDateStr);

  // Filter activities for My Activities tab
  const myEnrolledActivities = activities.filter(act => myEnrollments.includes(act.id));

  // Determine password strength in register
  const checkPasswordStrength = (val) => {
    if (!val) return { label: '', color: 'transparent', width: '0%' };
    let score = 0;
    if (val.length >= 6) score++;
    if (val.length >= 10) score++;
    if (/[A-Z]/.test(val) && /[a-z]/.test(val)) score++;
    if (/[0-9]/.test(val)) score++;

    const strengths = [
      { label: 'Muito fraca', color: '#e74c3c', width: '25%' },
      { label: 'Fraca', color: '#e8803a', width: '50%' },
      { label: 'Boa', color: '#f5c842', width: '75%' },
      { label: 'Forte', color: '#2d7a4f', width: '100%' }
    ];
    return strengths[score - 1] || strengths[0];
  };
  const pwStrength = checkPasswordStrength(registerForm.password);

  // Check if live activity is running right now (June 10th has "Roda de Conversa" at 18:00 or active activities)
  const liveActivityNow = activities.find(act => myEnrollments.includes(act.id) && act.date === '2026-06-10');

  return (
    <div id="root">
      {/* --- HEADER NAV --- */}
      {user && (
        <nav>
          <div className="nav-logo">Viva<span>Mais</span></div>
          <div className="nav-tabs">
            <button 
              className={`nav-tab ${activeTab === 'calendario' ? 'active' : ''}`}
              onClick={() => setActiveTab('calendario')}
            >
              📅 Calendário
            </button>
            <button 
              className={`nav-tab ${activeTab === 'mural' ? 'active' : ''}`}
              onClick={() => setActiveTab('mural')}
            >
              🏅 Minhas Atividades
            </button>
            <button 
              className={`nav-tab ${activeTab === 'aovivo' ? 'active' : ''}`}
              onClick={() => setActiveTab('aovivo')}
            >
              🔴 Ao Vivo
            </button>
          </div>
          <div className="nav-user">
            {user.type === 'mod' && (
              <div className="nav-role-toggle">
                <button 
                  className={`nav-role-btn ${roleView === 'senior' ? 'active' : ''}`}
                  onClick={() => setRoleView('senior')}
                >
                  Participante
                </button>
                <button 
                  className={`nav-role-btn ${roleView === 'tutor' ? 'active' : ''}`}
                  onClick={() => setRoleView('tutor')}
                >
                  Tutor
                </button>
              </div>
            )}
            <div className="avatar">{user.name.charAt(0).toUpperCase()}</div>
            <span style={{ marginRight: '10px' }}>{user.name}</span>
            <button 
              onClick={handleLogout}
              className="btn-secondary" 
              style={{ padding: '6px 12px', fontSize: '14px', borderRadius: '50px' }}
            >
              Sair
            </button>
          </div>
        </nav>
      )}

      {/* --- TOAST ALERT --- */}
      {toast && (
        <div className={`toast ${toast.isError ? 'erro-toast' : ''}`}>
          {toast.message}
        </div>
      )}

      {/* --- UNAUTHENTICATED: LOGIN & REGISTER PANEL --- */}
      {!user ? (
        <main className="login-container">
          <div className="card">
            <div className="tab-toggle">
              <button 
                className={`tab-btn ${isLoginTab ? 'active' : ''}`} 
                onClick={() => setIsLoginTab(true)}
              >
                Entrar
              </button>
              <button 
                className={`tab-btn ${!isLoginTab ? 'active' : ''}`} 
                onClick={() => setIsLoginTab(false)}
              >
                Cadastrar
              </button>
            </div>

            {isLoginTab ? (
              /* --- LOGIN FORM --- */
              <form onSubmit={handleLogin}>
                <div style={{ fontFamily: 'Lora, serif', fontSize: '28px', fontWeight: 600, marginBottom: '6px' }}>
                  Bem-vindo de volta! 👋
                </div>
                <div style={{ fontSize: '16px', color: 'var(--texto-suave)', marginBottom: '32px' }}>
                  Entre com seu e-mail e senha para continuar.
                </div>

                <div className="form-group">
                  <label htmlFor="login-email">E-mail</label>
                  <input 
                    type="email" 
                    id="login-email" 
                    placeholder="seu@email.com"
                    value={loginForm.email}
                    onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="login-senha">Senha</label>
                  <input 
                    type="password" 
                    id="login-senha" 
                    placeholder="Sua senha"
                    value={loginForm.password}
                    onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                    required
                  />
                </div>

                <span className="link-esqueci" onClick={() => setShowRecoverModal(true)}>
                  Esqueci minha senha
                </span>

                <button type="submit" className="btn-principal">Entrar</button>
                <div className="divider">ou</div>
                <button 
                  type="button" 
                  className="btn-secondary" 
                  style={{ width: '100%', borderRadius: '14px', padding: '14px', fontSize: '17px' }}
                  onClick={() => setIsLoginTab(false)}
                >
                  Criar uma conta gratuita
                </button>
              </form>
            ) : (
              /* --- REGISTRATION FORM --- */
              <form onSubmit={handleRegister}>
                <div style={{ fontFamily: 'Lora, serif', fontSize: '28px', fontWeight: 600, marginBottom: '6px' }}>
                  Criar conta 🌱
                </div>
                <div style={{ fontSize: '16px', color: 'var(--texto-suave)', marginBottom: '32px' }}>
                  Preencha os dados abaixo para começar.
                </div>

                <div className="form-group">
                  <label htmlFor="cad-nome">Nome completo</label>
                  <input 
                    type="text" 
                    id="cad-nome" 
                    placeholder="Seu nome"
                    value={registerForm.name}
                    onChange={(e) => setRegisterForm({ ...registerForm, name: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="cad-email">E-mail</label>
                  <input 
                    type="email" 
                    id="cad-email" 
                    placeholder="seu@email.com"
                    value={registerForm.email}
                    onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="cad-phone">Telefone</label>
                  <input 
                    type="tel" 
                    id="cad-phone" 
                    placeholder="(51) 99999-9999"
                    value={registerForm.phone}
                    onChange={(e) => setRegisterForm({ ...registerForm, phone: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="cad-tipo">Tipo de Usuário</label>
                  <select 
                    id="cad-tipo"
                    value={registerForm.type}
                    onChange={(e) => setRegisterForm({ ...registerForm, type: e.target.value })}
                  >
                    <option value="senior">Participante Sênior (65+)</option>
                    <option value="mod">Tutor / Mediador Comunitário</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="cad-senha">Senha</label>
                  <input 
                    type="password" 
                    id="cad-senha" 
                    placeholder="Crie uma senha"
                    value={registerForm.password}
                    onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                    required
                  />
                  {registerForm.password && (
                    <>
                      <div className="senha-forca">
                        <div className="forca-barra" style={{ background: pwStrength.width !== '0%' ? pwStrength.color : 'var(--cinza-borda)' }}></div>
                        <div className="forca-barra" style={{ background: ['50%', '75%', '100%'].includes(pwStrength.width) ? pwStrength.color : 'var(--cinza-borda)' }}></div>
                        <div className="forca-barra" style={{ background: ['75%', '100%'].includes(pwStrength.width) ? pwStrength.color : 'var(--cinza-borda)' }}></div>
                        <div className="forca-barra" style={{ background: pwStrength.width === '100%' ? pwStrength.color : 'var(--cinza-borda)' }}></div>
                      </div>
                      <div className="forca-label" style={{ color: pwStrength.color }}>
                        Força da senha: {pwStrength.label}
                      </div>
                    </>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="cad-confirmar">Confirmar senha</label>
                  <input 
                    type="password" 
                    id="cad-confirmar" 
                    placeholder="Repita a senha"
                    value={registerForm.confirmPassword}
                    onChange={(e) => setRegisterForm({ ...registerForm, confirmPassword: e.target.value })}
                    required
                  />
                </div>

                <button type="submit" className="btn-principal">Criar conta</button>
                <div className="divider">ou</div>
                <button 
                  type="button" 
                  className="btn-secondary" 
                  style={{ width: '100%', borderRadius: '14px', padding: '14px', fontSize: '17px' }}
                  onClick={() => setIsLoginTab(true)}
                >
                  Já tenho uma conta
                </button>
              </form>
            )}
          </div>
        </main>
      ) : (
        /* --- AUTHENTICATED AREA --- */
        <main className="page">
          
          {/* --- TAB 1: CALENDAR VIEW --- */}
          {activeTab === 'calendario' && (
            <div>
              <div className="page-title">Calendário de Atividades</div>
              <div className="page-subtitle">Escolha o mês e clique em um dia para verificar as sessões disponíveis.</div>

              {/* View Tutor Info Banner */}
              {roleView === 'tutor' && (
                <div className="info-banner">
                  <span>🎓</span>
                  <div>
                    <strong>Modo Tutor Ativo:</strong> Você pode agendar novas atividades ou gerenciar sessões existentes clicando nos dias.
                    <button 
                      onClick={populateDemoActivities} 
                      className="btn-secondary" 
                      style={{ marginLeft: '20px', padding: '6px 12px', fontSize: '13px', borderRadius: '8px' }}
                    >
                      Preencher Atividades de Demonstração
                    </button>
                  </div>
                </div>
              )}

              {/* Calendar Navigator */}
              <div className="calendar-header">
                <button className="cal-nav-btn" onClick={() => setCurrentMonth(currentMonth === 'Junho' ? 'Julho' : 'Junho')}>
                  ‹
                </button>
                <div className="cal-month">{currentMonth} de 2026</div>
                <button className="cal-nav-btn" onClick={() => setCurrentMonth(currentMonth === 'Junho' ? 'Julho' : 'Junho')}>
                  ›
                </button>
              </div>

              {/* Calendar Grid */}
              <div className="calendar-grid">
                <div className="cal-day-header">Dom</div>
                <div className="cal-day-header">Seg</div>
                <div className="cal-day-header">Ter</div>
                <div className="cal-day-header">Qua</div>
                <div className="cal-day-header">Qui</div>
                <div className="cal-day-header">Sex</div>
                <div className="cal-day-header">Sáb</div>

                {calendarCells.map((cell, idx) => {
                  if (cell.dayNum === null) {
                    return <div key={`empty-${idx}`} className="cal-day empty"></div>;
                  }

                  const cellDateStr = cell.dateStr;
                  const dayEvents = activities.filter(a => a.date === cellDateStr);
                  const isSelected = selectedDay === cell.dayNum;
                  const isToday = currentMonth === 'Junho' && cell.dayNum === 10;

                  return (
                    <div 
                      key={`day-${cell.dayNum}`} 
                      className={`cal-day ${isToday ? 'today' : ''} ${dayEvents.length > 0 ? 'has-event' : ''} ${isSelected ? 'selected' : ''}`}
                      onClick={() => handleDaySelect(cell.dayNum)}
                    >
                      <div className="day-num">{cell.dayNum}</div>
                      {dayEvents.slice(0, 2).map((evt, eIdx) => (
                        <div 
                          key={eIdx} 
                          className={`event-dot ${myEnrollments.includes(evt.id) ? 'verde' : ''}`}
                          title={evt.name}
                        >
                          {evt.name}
                        </div>
                      ))}
                      {dayEvents.length > 2 && (
                        <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--texto-suave)', marginTop: '4px' }}>
                          + {dayEvents.length - 2} mais
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Sessions Details Panel for Selected Day */}
              <div className="sessions-panel">
                <h3>Atividades para o dia {selectedDay} de {currentMonth}</h3>
                
                {dayActivities.length === 0 ? (
                  <p style={{ color: 'var(--texto-suave)', fontSize: '16px' }}>Nenhuma atividade agendada para este dia.</p>
                ) : (
                  dayActivities.map(act => {
                    const isEnrolled = myEnrollments.includes(act.id);
                    const spotsRemaining = Math.max(0, act.numParticipants - (isEnrolled ? 1 : 0));
                    const isFull = spotsRemaining === 0;

                    return (
                      <div key={act.id} className="session-card">
                        <div className="session-time">{act.time}</div>
                        <div className="session-info">
                          <h4>{act.name}</h4>
                          <p>Duração sugerida: 45 min · Plataforma VivaMais</p>
                        </div>
                        <div className={`session-spots ${isFull ? 'lotado' : spotsRemaining <= 3 ? 'quase' : ''}`}>
                          {spotsRemaining} / {act.numParticipants}
                          <small>vagas restantes</small>
                        </div>
                        {roleView === 'senior' ? (
                          isEnrolled ? (
                            <button 
                              className="btn-secondary" 
                              style={{ color: '#e74c3c', borderColor: '#f5c6c0', borderRadius: '16px', padding: '18px 32px' }}
                              onClick={() => handleCancelClick(act)}
                            >
                              Inscrito (Cancelar)
                            </button>
                          ) : (
                            <button 
                              className="btn-inscrever"
                              onClick={() => handleEnrollClick(act)}
                              disabled={isFull}
                            >
                              {isFull ? 'Lotado' : 'Inscrever-se'}
                            </button>
                          )
                        ) : (
                          <button 
                            className="btn-secondary"
                            style={{ borderRadius: '16px', padding: '18px 32px' }}
                            onClick={() => {
                              setIsEditing(true);
                              setEditingId(act.id);
                              setNewActivityForm({
                                name: act.name,
                                date: act.date,
                                time: act.time,
                                numParticipants: act.numParticipants
                              });
                              setModalType('novaSessao');
                            }}
                          >
                            Editar Sessão ✏️
                          </button>
                        )}
                      </div>
                    );
                  })
                )}

                {roleView === 'tutor' && (
                  <button 
                    className="add-session-btn"
                    onClick={() => {
                      setIsEditing(false);
                      setEditingId(null);
                      // Set default date as selected day
                      const dayStr = selectedDay < 10 ? `0${selectedDay}` : `${selectedDay}`;
                      const dateStr = `${monthDetails.yearMonth}-${dayStr}`;
                      setNewActivityForm({ name: '', date: dateStr, time: '14:00', numParticipants: 10 });
                      setModalType('novaSessao');
                    }}
                  >
                    ➕ Adicionar Nova Sessão para {selectedDay} de {currentMonth}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* --- TAB 2: MY ACTIVITIES MURAL --- */}
          {activeTab === 'mural' && (
            <div>
              <div className="page-title">Minhas Atividades Inscritas</div>
              <div className="page-subtitle">Aqui você visualiza todas as atividades em que se cadastrou.</div>

              {myEnrolledActivities.length === 0 ? (
                <div className="mural-empty">
                  <div className="icon">🌱</div>
                  <h3>Você ainda não se inscreveu em nenhuma atividade.</h3>
                  <p>Vá até a aba do Calendário para escolher uma aula e começar!</p>
                </div>
              ) : (
                <div className="mural-grid">
                  {myEnrolledActivities.map(act => {
                    const isToday = act.date === '2026-06-10'; // Simulated today
                    
                    return (
                      <div key={act.id} className={`mural-card ${isToday ? 'hoje' : ''}`}>
                        <div className="card-stripe"></div>
                        <div className="card-body">
                          <div className={`mural-badge ${isToday ? 'badge-hoje' : 'badge-agendada'}`}>
                            {isToday ? '🔴 Acontece Hoje' : '🗓️ Agendada'}
                          </div>
                          <h3>{act.name}</h3>

                          <div className="card-info-grid">
                            <div className="info-block">
                              <span className="lbl">Data</span>
                              <span className="val">{act.date.split('-')[2]}/{act.date.split('-')[1]}</span>
                            </div>
                            <div className="info-block destaque">
                              <span className="lbl">Horário</span>
                              <span className="val">{act.time}</span>
                            </div>
                          </div>
                        </div>

                        <div className="card-tutor">
                          <div className="tutor-avatar">👤</div>
                          <span>Facilitador: Professor VivaMais</span>
                        </div>

                        <div className="card-actions">
                          <button className="btn-cancelar" onClick={() => handleCancelClick(act)}>
                            Desistir
                          </button>
                          {isToday ? (
                            <button className="btn-entrar" onClick={() => setActiveTab('aovivo')}>
                              Entrar na Aula 📹
                            </button>
                          ) : (
                            <button className="btn-entrar" style={{ opacity: 0.5, cursor: 'not-allowed' }} disabled>
                              Aguardar dia
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* --- TAB 3: AO VIVO / VIDEO CALL --- */}
          {activeTab === 'aovivo' && (
            <div>
              <div className="page-title">Sala de Transmissão Ao Vivo</div>
              <div className="page-subtitle">Participe dos encontros e interaja com os colegas da comunidade.</div>

              {!isLiveConnected ? (
                /* Offline State / Entrance */
                <div className="live-offline">
                  <div className="icon">📹</div>
                  {liveActivityNow ? (
                    <>
                      <h2>Aula em andamento: {liveActivityNow.name}</h2>
                      <p>O facilitador já iniciou o encontro ao vivo. Venha fazer parte!</p>
                      <button 
                        className="btn-principal" 
                        style={{ maxWidth: '300px', display: 'inline-block' }}
                        onClick={() => setIsLiveConnected(true)}
                      >
                        Entrar na Sala de Vídeo
                      </button>
                    </>
                  ) : (
                    <>
                      <h2>Nenhuma aula ao vivo no momento</h2>
                      <p>Para testar este recurso, certifique-se de se inscrever em uma aula agendada para hoje (ex. 10 de Junho no calendário).</p>
                      <button 
                        className="btn-secondary" 
                        style={{ padding: '16px 36px', borderRadius: '14px' }}
                        onClick={() => setActiveTab('calendario')}
                      >
                        Ver Calendário
                      </button>
                    </>
                  )}
                </div>
              ) : (
                /* Connected Mock Meeting Screen */
                <div>
                  <div 
                    style={{ 
                      background: '#1a1a1a', 
                      borderRadius: 'var(--radius-lg)', 
                      padding: '30px', 
                      color: 'white', 
                      textAlign: 'center', 
                      boxShadow: 'var(--sombra-forte)',
                      marginBottom: '32px',
                      position: 'relative'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', alignItems: 'center' }}>
                      <span className="live-badge">
                        <span className="live-dot"></span> Transmissão VivaMais
                      </span>
                      <span style={{ fontSize: '15px', opacity: 0.8 }}>Conexão Estável via Jitsi Meet SDK</span>
                    </div>

                    {/* Camera simulation layout */}
                    <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr', gap: '20px', minHeight: '380px' }}>
                      <div 
                        style={{ 
                          background: '#333', 
                          borderRadius: '16px', 
                          display: 'flex', 
                          flexDirection: 'column',
                          alignItems: 'center', 
                          justifyContent: 'center',
                          position: 'relative',
                          border: moderatorGrantedWord ? '4px solid var(--amarelo)' : 'none'
                        }}
                      >
                        <span style={{ fontSize: '72px' }}>🧘</span>
                        <div style={{ fontSize: '22px', fontWeight: 'bold', marginTop: '10px' }}>
                          Espaço de Vídeo Principal (Professor)
                        </div>
                        {moderatorGrantedWord && (
                          <div 
                            style={{ 
                              position: 'absolute', 
                              top: '15px', 
                              right: '15px', 
                              background: 'var(--amarelo)', 
                              color: 'var(--texto)',
                              padding: '8px 16px',
                              borderRadius: '8px',
                              fontWeight: 800,
                              fontSize: '14px'
                            }}
                          >
                            🎤 Você está com a palavra!
                          </div>
                        )}
                        <div style={{ position: 'absolute', bottom: '15px', left: '15px', background: 'rgba(0,0,0,0.6)', padding: '6px 12px', borderRadius: '8px', fontSize: '14px' }}>
                          Aula ao vivo: {liveActivityNow?.name}
                        </div>
                      </div>

                      {/* Side list of participants */}
                      <div style={{ background: '#222', borderRadius: '16px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', textAlign: 'left' }}>
                        <div style={{ fontWeight: 800, fontSize: '15px', borderBottom: '1px solid #444', paddingBottom: '8px' }}>Colegas (4)</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
                          <span style={{ fontSize: '18px' }}>👵</span> Ana Maria (Áudio 🟢)
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
                          <span style={{ fontSize: '18px' }}>👴</span> Seu José (Áudio 🔴)
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
                          <span style={{ fontSize: '18px' }}>👵</span> Maria Aparecida (Você)
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
                          <span style={{ fontSize: '18px' }}>👨</span> Facilitador (Tutor)
                        </div>
                      </div>
                    </div>

                    {/* Bottom toolbar for video control */}
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '15px', marginTop: '30px' }}>
                      <button 
                        onClick={() => setLiveMic(!liveMic)}
                        className="btn-principal" 
                        style={{ width: 'auto', background: liveMic ? 'var(--verde)' : '#c0392b', padding: '12px 24px', borderRadius: '12px', fontSize: '16px' }}
                      >
                        {liveMic ? '🎙️ Silenciar Microfone' : '🎙️ Ativar Microfone'}
                      </button>
                      <button 
                        onClick={() => setLiveCam(!liveCam)}
                        className="btn-principal" 
                        style={{ width: 'auto', background: liveCam ? 'var(--verde)' : '#c0392b', padding: '12px 24px', borderRadius: '12px', fontSize: '16px' }}
                      >
                        {liveCam ? '📹 Desligar Câmera' : '📹 Ligar Câmera'}
                      </button>

                      {roleView === 'senior' ? (
                        <button 
                          onClick={() => {
                            if (!requestedWord) {
                              setRequestedWord(true);
                              showToast("Você pediu a palavra. Aguarde aprovação do tutor.");
                              setTimeout(() => {
                                setModeratorGrantedWord(true);
                                showToast("🎤 O tutor liberou seu microfone para falar!");
                              }, 4000);
                            } else {
                              setRequestedWord(false);
                              setModeratorGrantedWord(false);
                            }
                          }}
                          className="btn-principal" 
                          style={{ width: 'auto', background: requestedWord ? 'var(--amarelo)' : 'rgba(255,255,255,0.2)', color: requestedWord ? 'var(--texto)' : 'white', padding: '12px 24px', borderRadius: '12px', fontSize: '16px' }}
                        >
                          {requestedWord ? '✋ Pedido Enviado' : '✋ Pedir a Palavra'}
                        </button>
                      ) : (
                        <button 
                          className="btn-principal" 
                          style={{ width: 'auto', background: 'var(--amarelo)', color: 'var(--texto)', padding: '12px 24px', borderRadius: '12px', fontSize: '16px' }}
                          onClick={() => {
                            setModeratorGrantedWord(!moderatorGrantedWord);
                            showToast(moderatorGrantedWord ? "Palavra recolhida." : "Você deu a palavra para o aluno.");
                          }}
                        >
                          📢 {moderatorGrantedWord ? "Silenciar Aluno" : "Dar a Palavra ao Aluno"}
                        </button>
                      )}

                      <button 
                        className="btn-secondary" 
                        style={{ background: '#c0392b', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '12px', fontSize: '16px' }}
                        onClick={() => {
                          setIsLiveConnected(false);
                          setRequestedWord(false);
                          setModeratorGrantedWord(false);
                          showToast("Você se desconectou da sala de vídeo.");
                        }}
                      >
                        🔴 Sair da Aula
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

        </main>
      )}

      {/* --- FOOTER --- */}
      <footer>
        &copy; 2026 VivaMais · Plataforma de inclusão digital para pessoas 65+ · Instituto de Informática UFRGS
      </footer>

      {/* --- MODAL: RECUPERAR SENHA --- */}
      {showRecoverModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-icon">🔑</div>
            <h2>Recuperar senha</h2>
            <p>Informe seu e-mail e enviaremos um link de segurança para você criar uma nova senha.</p>
            <form onSubmit={handleRecoverPassword}>
              <div className="form-group">
                <label htmlFor="rec-email">E-mail</label>
                <input 
                  type="email" 
                  id="rec-email" 
                  placeholder="seu@email.com" 
                  value={recoverEmail}
                  onChange={(e) => setRecoverEmail(e.target.value)}
                  required 
                />
              </div>
              <div className="modal-actions" style={{ flexDirection: 'column' }}>
                <button type="submit" className="btn-principal">Enviar link de recuperação</button>
                <button type="button" className="btn-secondary" onClick={() => setShowRecoverModal(false)}>Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL: CONFIRMAR INSCRIÇÃO --- */}
      {modalType === 'confirm' && currentActivityContext && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-icon">🌱</div>
            <h2>Confirmar inscrição?</h2>
            <p>Você gostaria de se inscrever na aula <strong>{currentActivityContext.name}</strong> marcada para às <strong>{currentActivityContext.time}</strong>?</p>
            <div className="modal-actions">
              <button className="btn-confirm" onClick={confirmEnrollment}>Confirmar</button>
              <button className="btn-secondary" onClick={() => setModalType(null)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL: SUCESSO INSCRIÇÃO --- */}
      {modalType === 'sucesso' && (
        <div className="modal-overlay">
          <div className="modal sucesso">
            <div className="modal-icon">🎉</div>
            <h2>Inscrição Realizada!</h2>
            <p>Sua vaga está garantida! Lembramos você no dia do evento. A aula ficará disponível na sua aba de "Minhas Atividades".</p>
            <div className="modal-actions">
              <button className="btn-confirm" onClick={() => setModalType(null)}>Entendi</button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL: CANCELAR INSCRIÇÃO --- */}
      {modalType === 'cancelar' && currentActivityContext && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-icon">⚠️</div>
            <h2>Deseja desistir da atividade?</h2>
            <p>Tem certeza que deseja cancelar sua inscrição em <strong>{currentActivityContext.name}</strong>? Você poderá se reinscrever mais tarde se houver vagas.</p>
            <div className="modal-actions">
              <button className="btn-confirm" style={{ background: '#c0392b' }} onClick={confirmCancellation}>Confirmar Desistência</button>
              <button className="btn-secondary" onClick={() => setModalType(null)}>Manter Inscrição</button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL: TUTOR NOVA/EDITAR SESSÃO --- */}
      {modalType === 'novaSessao' && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: '520px', textAlign: 'left' }}>
            <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>
              {isEditing ? "✏️ Editar Sessão" : "➕ Nova Sessão"}
            </h2>
            <form onSubmit={handleSaveActivity}>
              <div className="form-group">
                <label>Nome da Atividade</label>
                <input 
                  type="text" 
                  placeholder="Ex: Yoga para o Bem-Estar"
                  value={newActivityForm.name}
                  onChange={(e) => setNewActivityForm({ ...newActivityForm, name: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label>Data</label>
                  <input 
                    type="date"
                    value={newActivityForm.date}
                    onChange={(e) => setNewActivityForm({ ...newActivityForm, date: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Horário</label>
                  <input 
                    type="time"
                    value={newActivityForm.time}
                    onChange={(e) => setNewActivityForm({ ...newActivityForm, time: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Número Máximo de Participantes</label>
                <input 
                  type="number" 
                  min="2" 
                  max="100"
                  value={newActivityForm.numParticipants}
                  onChange={(e) => setNewActivityForm({ ...newActivityForm, numParticipants: e.target.value })}
                  required
                />
              </div>

              <div className="modal-actions" style={{ marginTop: '24px' }}>
                <button type="submit" className="btn-confirm">Salvar Atividade</button>
                <button type="button" className="btn-secondary" onClick={() => setModalType(null)}>Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
