import React, { useState, useEffect } from 'react';
import { Check, X, Calendar, Users, LogOut, Eye, BarChart3, PieChart } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart as RePieChart, Pie, Cell } from 'recharts';

// CONFIGURAZIONE - Modifica questi valori
const DATES = ['20 Dic', '21 Dic', '22 Dic', '23 Dic', '24 Dic'];
const TIME_SLOTS = ['Mattino', 'Pranzo', 'Pomeriggio', 'Sera'];
const PEOPLE = [
  'Mario Rossi', 'Luigi Bianchi', 'Anna Verdi', 'Paolo Neri',
  'Giulia Romano', 'Marco Ferrari', 'Sara Colombo', 'Andrea Ricci',
  'Francesca Marino', 'Roberto Greco', 'Test'
];

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

const AvailabilityTracker = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [availabilities, setAvailabilities] = useState({});
  const [showSuccess, setShowSuccess] = useState(false);
  const [testView, setTestView] = useState('summary'); // 'summary', 'details', 'charts'

  const [lastUpdate, setLastUpdate] = useState(Date.now());
  const [isLoading, setIsLoading] = useState(false);

  // Carica dati salvati - CONDIVISO TRA TUTTI
  useEffect(() => {
    const loadData = async () => {
      if (isLoading) return; // Evita chiamate multiple simultanee
      
      setIsLoading(true);
      try {
        const result = await window.storage.get('availabilities_shared', true);
        if (result && result.value) {
          const parsed = JSON.parse(result.value);
          setAvailabilities(parsed);
        }
      } catch (error) {
        console.log('Caricamento dati:', error.message);
        // Mantieni i dati attuali in caso di errore
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();

    // Ricarica dati ogni 5 secondi (più lento per evitare rate limiting)
    const interval = setInterval(() => {
      if (!isLoading) {
        loadData();
      }
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);

  // Salva dati - CONDIVISO TRA TUTTI con retry logic
  const saveData = async (newAvailabilities) => {
    let retries = 3;
    while (retries > 0) {
      try {
        await window.storage.set('availabilities_shared', JSON.stringify(newAvailabilities), true);
        setLastUpdate(Date.now());
        return; // Successo
      } catch (error) {
        console.error('Tentativo salvataggio fallito:', error);
        retries--;
        if (retries > 0) {
          // Aspetta un po' prima di riprovare
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }
    // Se arriviamo qui, tutti i tentativi sono falliti
    console.error('Impossibile salvare i dati dopo 3 tentativi');
  };

  const getAvailability = (person, date, slot) => {
    return availabilities[person]?.[date]?.[slot] || null;
  };

  const countAvailabilities = (date, slot) => {
    return PEOPLE.filter(p => p !== 'Test' && getAvailability(p, date, slot) === true).length;
  };

  const toggleAvailability = async (date, slot) => {
    if (!currentUser || currentUser === 'Test' || isLoading) return;

    const current = getAvailability(currentUser, date, slot);
    const newValue = current === true ? false : current === false ? null : true;

    const newAvailabilities = {
      ...availabilities,
      [currentUser]: {
        ...availabilities[currentUser],
        [date]: {
          ...availabilities[currentUser]?.[date],
          [slot]: newValue
        }
      }
    };

    // Aggiorna subito localmente per feedback immediato
    setAvailabilities(newAvailabilities);
    
    // Salva nel cloud
    await saveData(newAvailabilities);
    
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 2000);
  };

  const getCellStyle = (value, isReadOnly = false) => {
    if (isReadOnly) {
      if (value === true) return 'bg-green-200 text-green-800';
      if (value === false) return 'bg-red-200 text-red-800';
      return 'bg-gray-100 text-gray-400';
    }
    if (value === true) return 'bg-green-500 hover:bg-green-600 text-white cursor-pointer';
    if (value === false) return 'bg-red-500 hover:bg-red-600 text-white cursor-pointer';
    return 'bg-gray-100 hover:bg-gray-200 text-gray-400 cursor-pointer';
  };

  const getSummaryStyle = (count, total) => {
    const percentage = (count / total) * 100;
    if (percentage >= 70) return 'bg-green-100 text-green-800 border-green-300';
    if (percentage >= 40) return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    return 'bg-red-100 text-red-800 border-red-300';
  };

  const getCellIcon = (value) => {
    if (value === true) return <Check className="w-5 h-5" />;
    if (value === false) return <X className="w-5 h-5" />;
    return <span className="text-sm">-</span>;
  };

  const handleLogin = (person) => {
    setCurrentUser(person);
  };

  const handleLogout = () => {
    setCurrentUser(null);
  };

  // Prepara dati per grafici
  const getChartData = () => {
    const totalPeople = PEOPLE.filter(p => p !== 'Test').length;
    
    // Dati per grafico a barre per data
    const barData = DATES.map(date => {
      const dataPoint = { name: date };
      TIME_SLOTS.forEach(slot => {
        dataPoint[slot] = countAvailabilities(date, slot);
      });
      return dataPoint;
    });

    // Dati per grafico a linee (trend nel tempo)
    const lineData = DATES.map(date => {
      const total = TIME_SLOTS.reduce((sum, slot) => sum + countAvailabilities(date, slot), 0);
      return {
        name: date,
        disponibili: total,
        media: total / TIME_SLOTS.length
      };
    });

    // Dati per grafico a torta (distribuzione per fascia oraria)
    const pieData = TIME_SLOTS.map(slot => {
      const total = DATES.reduce((sum, date) => sum + countAvailabilities(date, slot), 0);
      return {
        name: slot,
        value: total
      };
    });

    return { barData, lineData, pieData };
  };

  // Schermata di Login
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-2xl p-8 max-w-md w-full">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-full mb-4">
              <Calendar className="w-8 h-8 text-indigo-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              Gestione Disponibilità
            </h1>
            <p className="text-gray-600">
              Seleziona il tuo nome per continuare
            </p>
          </div>

          <div className="space-y-3">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Seleziona Nome e Cognome:
            </label>
            {PEOPLE.map(person => (
              <button
                key={person}
                onClick={() => handleLogin(person)}
                className="w-full p-4 text-left bg-gray-50 hover:bg-indigo-50 border-2 border-gray-200 hover:border-indigo-500 rounded-lg transition-all duration-200 flex items-center gap-3 group"
              >
                {person === 'Test' ? (
                  <Eye className="w-5 h-5 text-gray-400 group-hover:text-indigo-600" />
                ) : (
                  <Users className="w-5 h-5 text-gray-400 group-hover:text-indigo-600" />
                )}
                <span className="font-medium text-gray-700 group-hover:text-indigo-700">
                  {person}
                </span>
              </button>
            ))}
          </div>

          <div className="mt-6 p-4 bg-blue-50 border-l-4 border-blue-500 rounded">
            <p className="text-sm text-blue-700">
              <strong>Nota:</strong> Seleziona "Test" per vedere riepilogo e statistiche complete
            </p>
          </div>
          
          <div className="mt-4 p-4 bg-green-50 border-l-4 border-green-500 rounded">
            <p className="text-sm text-green-700">
              <strong>✓ Sistema Real-Time:</strong> Tutte le modifiche sono visibili a tutti in tempo reale!
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Schermata principale (dopo login)
  const isTestUser = currentUser === 'Test';
  const totalPeople = PEOPLE.filter(p => p !== 'Test').length;

  if (isTestUser) {
    const { barData, lineData, pieData } = getChartData();

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center gap-2">
                  <Eye className="w-8 h-8 text-indigo-600" />
                  Visualizzazione Amministratore
                </h1>
                <p className="text-gray-600">
                  Riepilogo e statistiche di tutte le disponibilità
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Esci
              </button>
            </div>
          </div>

          {/* View Toggle */}
          <div className="bg-white rounded-lg shadow-lg p-4 mb-6">
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setTestView('summary')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                  testView === 'summary'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Users className="w-4 h-4" />
                Riepilogo
              </button>
              <button
                onClick={() => setTestView('charts')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                  testView === 'charts'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <BarChart3 className="w-4 h-4" />
                Grafici
              </button>
              <button
                onClick={() => setTestView('details')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                  testView === 'details'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Eye className="w-4 h-4" />
                Dettagli Persone
              </button>
            </div>
          </div>

          {/* Summary View */}
          {testView === 'summary' && (
            <div className="bg-white rounded-lg shadow-lg p-6 overflow-x-auto">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Riepilogo Disponibilità
              </h2>
              <p className="text-sm text-gray-600 mb-4">
                Numero di persone disponibili su {totalPeople} totali
              </p>
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="border-2 border-gray-300 bg-indigo-100 p-3 text-left font-semibold">
                      Data / Orario
                    </th>
                    {TIME_SLOTS.map(slot => (
                      <th key={slot} className="border-2 border-gray-300 bg-indigo-100 p-3 text-center font-semibold">
                        {slot}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {DATES.map(date => (
                    <tr key={date}>
                      <td className="border-2 border-gray-300 bg-gray-50 p-3 font-medium">
                        {date}
                      </td>
                      {TIME_SLOTS.map(slot => {
                        const count = countAvailabilities(date, slot);
                        const percentage = Math.round((count / totalPeople) * 100);
                        return (
                          <td key={`${date}-${slot}`} className={`border-2 p-4 text-center ${getSummaryStyle(count, totalPeople)}`}>
                            <div className="font-bold text-2xl">{count}</div>
                            <div className="text-xs">su {totalPeople}</div>
                            <div className="text-xs font-semibold mt-1">({percentage}%)</div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
              
              <div className="mt-6 grid grid-cols-3 gap-4">
                <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-3 h-3 bg-green-500 rounded"></div>
                    <span className="text-sm font-semibold text-green-800">Alta disponibilità</span>
                  </div>
                  <p className="text-xs text-green-700">≥ 70% delle persone</p>
                </div>
                <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-3 h-3 bg-yellow-500 rounded"></div>
                    <span className="text-sm font-semibold text-yellow-800">Media disponibilità</span>
                  </div>
                  <p className="text-xs text-yellow-700">40% - 69% delle persone</p>
                </div>
                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-3 h-3 bg-red-500 rounded"></div>
                    <span className="text-sm font-semibold text-red-800">Bassa disponibilità</span>
                  </div>
                  <p className="text-xs text-red-700">{'<'} 40% delle persone</p>
                </div>
              </div>
            </div>
          )}

          {/* Charts View */}
          {testView === 'charts' && (
            <div className="space-y-6">
              {/* Bar Chart */}
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">
                  Disponibilità per Data e Fascia Oraria
                </h2>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={barData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    {TIME_SLOTS.map((slot, index) => (
                      <Bar key={slot} dataKey={slot} fill={COLORS[index]} />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Line Chart */}
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">
                  Trend Disponibilità nel Tempo
                </h2>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={lineData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="disponibili" stroke="#10b981" strokeWidth={2} name="Totale Disponibili" />
                    <Line type="monotone" dataKey="media" stroke="#3b82f6" strokeWidth={2} strokeDasharray="5 5" name="Media per Slot" />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Pie Chart */}
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">
                  Distribuzione Disponibilità per Fascia Oraria
                </h2>
                <ResponsiveContainer width="100%" height={300}>
                  <RePieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </RePieChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Details View */}
          {testView === 'details' && (
            <div className="bg-white rounded-lg shadow-lg p-6 overflow-x-auto">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Dettaglio per Persona
              </h2>
              
              {PEOPLE.filter(p => p !== 'Test').map(person => (
                <div key={person} className="mb-8">
                  <h3 className="text-lg font-semibold text-gray-700 mb-3 bg-indigo-50 p-3 rounded-lg">
                    {person}
                  </h3>
                  <table className="w-full border-collapse mb-4">
                    <thead>
                      <tr>
                        <th className="border-2 border-gray-300 bg-gray-100 p-2 text-left font-semibold text-sm">
                          Data / Orario
                        </th>
                        {TIME_SLOTS.map(slot => (
                          <th key={slot} className="border-2 border-gray-300 bg-gray-100 p-2 text-center font-semibold text-sm">
                            {slot}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {DATES.map(date => (
                        <tr key={date}>
                          <td className="border-2 border-gray-300 bg-gray-50 p-2 font-medium text-sm">
                            {date}
                          </td>
                          {TIME_SLOTS.map(slot => {
                            const value = getAvailability(person, date, slot);
                            return (
                              <td key={`${date}-${slot}`} className="border-2 border-gray-300 p-0">
                                <div className={`w-full h-full p-3 flex items-center justify-center ${getCellStyle(value, true)}`}>
                                  {getCellIcon(value)}
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // User View (Non-Test)
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center gap-2">
                <Calendar className="w-8 h-8 text-indigo-600" />
                Le Tue Disponibilità
              </h1>
              <p className="text-gray-600">
                Bentornato/a {currentUser}
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Esci
            </button>
          </div>
        </div>

        {/* Success Message */}
        {showSuccess && (
          <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-6 rounded-lg">
            ✓ Disponibilità salvata con successo!
          </div>
        )}

        {/* Availability Grid */}
        <div className="bg-white rounded-lg shadow-lg p-6 overflow-x-auto">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Le Tue Disponibilità
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            Clicca sulle celle per indicare: ✓ Disponibile → ✗ Non disponibile → - Non indicato
          </p>
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="border-2 border-gray-300 bg-indigo-100 p-3 text-left font-semibold">
                  Data / Orario
                </th>
                {TIME_SLOTS.map(slot => (
                  <th key={slot} className="border-2 border-gray-300 bg-indigo-100 p-3 text-center font-semibold">
                    {slot}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {DATES.map(date => (
                <tr key={date}>
                  <td className="border-2 border-gray-300 bg-gray-50 p-3 font-medium">
                    {date}
                  </td>
                  {TIME_SLOTS.map(slot => {
                    const value = getAvailability(currentUser, date, slot);
                    return (
                      <td key={`${date}-${slot}`} className="border-2 border-gray-300 p-0">
                        <button
                          onClick={() => toggleAvailability(date, slot)}
                          className={`w-full h-full p-4 transition-colors flex items-center justify-center ${getCellStyle(value)}`}
                        >
                          {getCellIcon(value)}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mt-6 rounded-lg">
          <h3 className="font-semibold text-blue-800 mb-2">Come funziona:</h3>
          <ul className="text-blue-700 text-sm space-y-1">
            <li>• Clicca sulle celle per indicare la tua disponibilità</li>
            <li>• Le modifiche vengono salvate automaticamente e sono visibili a tutti</li>
            <li>• La pagina si sincronizza automaticamente ogni 5 secondi</li>
            <li>• Puoi uscire e tornare in qualsiasi momento per modificare</li>
            <li>• Verde = Disponibile, Rosso = Non disponibile, Grigio = Non indicato</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AvailabilityTracker;