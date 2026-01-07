import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

const API_URL = 'http://localhost:5000/api';

function App() {
  const [todos, setTodos] = useState([]);
  const [newTodo, setNewTodo] = useState('');
  const [priority, setPriority] = useState('moyenne');
  const [dueDate, setDueDate] = useState('');
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editingTitle, setEditingTitle] = useState('');
  
  // Auth states
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showLogin, setShowLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      verifyToken(token);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchTodos();
    }
  }, [isAuthenticated, filter]);

  const verifyToken = async (token) => {
    try {
      const response = await axios.get(`${API_URL}/auth/me`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      setCurrentUser(response.data);
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Erreur vérification token:', error);
      localStorage.removeItem('token');
      setIsAuthenticated(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${API_URL}/auth/register`, {
        username,
        email,
        password
      }, {
        headers: { 'Content-Type': 'application/json' }
      });
      alert('Inscription réussie ! Connectez-vous maintenant.');
      setShowLogin(true);
      setUsername('');
      setEmail('');
      setPassword('');
    } catch (error) {
      console.error('Erreur inscription:', error);
      alert(error.response?.data?.message || 'Erreur lors de l\'inscription');
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${API_URL}/auth/login`, {
        username,
        password
      }, {
        headers: { 'Content-Type': 'application/json' }
      });
      
      localStorage.setItem('token', response.data.token);
      setCurrentUser(response.data.user);
      setIsAuthenticated(true);
      setUsername('');
      setPassword('');
    } catch (error) {
      console.error('Erreur connexion:', error);
      alert(error.response?.data?.message || 'Erreur lors de la connexion');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
    setCurrentUser(null);
    setTodos([]);
  };

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    if (!token) return {};
    
    return {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };
  };

  const fetchTodos = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${API_URL}/todos?filter=${filter}`,
        getAuthHeaders()
      );
      setTodos(response.data);
    } catch (error) {
      console.error('Erreur lors du chargement des todos:', error);
      if (error.response?.status === 401) {
        handleLogout();
      }
    } finally {
      setLoading(false);
    }
  };

  const addTodo = async (e) => {
    e.preventDefault();
    if (!newTodo.trim()) {
      alert('Veuillez entrer une tâche');
      return;
    }

    try {
      console.log('Ajout todo avec:', { title: newTodo, priority, due_date: dueDate || null });
      
      const response = await axios.post(
        `${API_URL}/todos`,
        {
          title: newTodo,
          priority,
          due_date: dueDate || null
        },
        getAuthHeaders()
      );
      
      console.log('Todo ajouté:', response.data);
      setTodos([response.data, ...todos]);
      setNewTodo('');
      setPriority('moyenne');
      setDueDate('');
    } catch (error) {
      console.error('Erreur lors de l\'ajout du todo:', error);
      console.error('Détails:', error.response?.data);
      
      if (error.response?.status === 401) {
        alert('Session expirée. Veuillez vous reconnecter.');
        handleLogout();
      } else {
        alert(error.response?.data?.message || 'Erreur lors de l\'ajout de la tâche');
      }
    }
  };

  const toggleTodo = async (id, completed) => {
    try {
      const response = await axios.put(
        `${API_URL}/todos/${id}`,
        { completed: !completed },
        getAuthHeaders()
      );
      setTodos(todos.map(todo => (todo.id === id ? response.data : todo)));
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
      alert(error.response?.data?.message || 'Erreur lors de la mise à jour');
    }
  };

  const deleteTodo = async (id) => {
    if (!window.confirm('Voulez-vous vraiment supprimer cette tâche ?')) {
      return;
    }
    
    try {
      await axios.delete(`${API_URL}/todos/${id}`, getAuthHeaders());
      setTodos(todos.filter(todo => todo.id !== id));
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      alert(error.response?.data?.message || 'Erreur lors de la suppression');
    }
  };

  const startEditing = (todo) => {
    setEditingId(todo.id);
    setEditingTitle(todo.title);
  };

  const saveEdit = async (id) => {
    if (!editingTitle.trim()) {
      alert('Veuillez entrer un titre');
      return;
    }
    
    try {
      const response = await axios.put(
        `${API_URL}/todos/${id}`,
        { title: editingTitle },
        getAuthHeaders()
      );
      setTodos(todos.map(todo => (todo.id === id ? response.data : todo)));
      setEditingId(null);
      setEditingTitle('');
    } catch (error) {
      console.error('Erreur lors de la modification:', error);
      alert(error.response?.data?.message || 'Erreur lors de la modification');
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingTitle('');
  };

  const updatePriority = async (id, newPriority) => {
    try {
      const response = await axios.put(
        `${API_URL}/todos/${id}`,
        { priority: newPriority },
        getAuthHeaders()
      );
      setTodos(todos.map(todo => (todo.id === id ? response.data : todo)));
    } catch (error) {
      console.error('Erreur lors de la mise à jour de priorité:', error);
      alert(error.response?.data?.message || 'Erreur lors de la mise à jour');
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'haute':
        return '#ff4757';
      case 'moyenne':
        return '#ffa502';
      case 'basse':
        return '#1e90ff';
      default:
        return '#999';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (error) {
      return dateString;
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="App">
        <div className="auth-container">
          <h1>📝 TodoListttttttttttttttttt</h1>
          <div className="auth-toggle">
            <button
              className={showLogin ? 'active' : ''}
              onClick={() => setShowLogin(true)}
            >
              Connexion
            </button>
            <button
              className={!showLogin ? 'active' : ''}
              onClick={() => setShowLogin(false)}
            >
              Inscription
            </button>
          </div>

          {showLogin ? (
            <form onSubmit={handleLogin} className="auth-form">
              <input
                type="text"
                placeholder="Nom d'utilisateur"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
              <input
                type="password"
                placeholder="Mot de passe"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button type="submit">Se connecter</button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="auth-form">
              <input
                type="text"
                placeholder="Nom d'utilisateur"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <input
                type="password"
                placeholder="Mot de passe"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button type="submit">S'inscrire</button>
            </form>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="App">
      <div className="container">
        <div className="header">
          <h1>📝 Ma TodoList</h1>
          <div className="user-info">
            <span>Bienvenue, {currentUser?.username}!</span>
            <button onClick={handleLogout} className="logout-button">
              Déconnexion
            </button>
          </div>
        </div>

        <form onSubmit={addTodo} className="todo-form">
          <input
            type="text"
            value={newTodo}
            onChange={(e) => setNewTodo(e.target.value)}
            placeholder="Ajouter une nouvelle tâche..."
            className="todo-input"
          />
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className="priority-select"
          >
            <option value="basse">Priorité Basse</option>
            <option value="moyenne">Priorité Moyenne</option>
            <option value="haute">Priorité Haute</option>
          </select>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="date-input"
          />
          <button type="submit" className="add-button">
            Ajouter
          </button>
        </form>

        <div className="filters">
          <button
            className={filter === 'all' ? 'active' : ''}
            onClick={() => setFilter('all')}
          >
            Toutes ({todos.length})
          </button>
          <button
            className={filter === 'active' ? 'active' : ''}
            onClick={() => setFilter('active')}
          >
            Actives
          </button>
          <button
            className={filter === 'completed' ? 'active' : ''}
            onClick={() => setFilter('completed')}
          >
            Complétées
          </button>
        </div>

        {loading ? (
          <p className="loading">Chargement...</p>
        ) : (
          <ul className="todo-list">
            {todos.map(todo => (
              <li
                key={todo.id}
                className={`todo-item ${todo.completed ? 'completed' : ''}`}
                style={{ borderLeft: `4px solid ${getPriorityColor(todo.priority)}` }}
              >
                <input
                  type="checkbox"
                  checked={todo.completed}
                  onChange={() => toggleTodo(todo.id, todo.completed)}
                  className="checkbox"
                />

                {editingId === todo.id ? (
                  <div className="edit-container">
                    <input
                      type="text"
                      value={editingTitle}
                      onChange={(e) => setEditingTitle(e.target.value)}
                      className="edit-input"
                      autoFocus
                    />
                    <button onClick={() => saveEdit(todo.id)} className="save-button">
                      ✓
                    </button>
                    <button onClick={cancelEdit} className="cancel-button">
                      ✗
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="todo-content">
                      <span className="todo-title">{todo.title}</span>
                      <div className="todo-meta">
                        <select
                          value={todo.priority}
                          onChange={(e) => updatePriority(todo.id, e.target.value)}
                          className="priority-badge"
                          style={{ 
                            backgroundColor: getPriorityColor(todo.priority),
                            color: 'white'
                          }}
                        >
                          <option value="basse">Basse</option>
                          <option value="moyenne">Moyenne</option>
                          <option value="haute">Haute</option>
                        </select>
                        {todo.due_date && (
                          <span className="due-date">📅 {formatDate(todo.due_date)}</span>
                        )}
                      </div>
                    </div>
                    <div className="todo-actions">
                      <button
                        onClick={() => startEditing(todo)}
                        className="edit-button"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => deleteTodo(todo.id)}
                        className="delete-button"
                      >
                        🗑️
                      </button>
                    </div>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}

        {todos.length === 0 && !loading && (
          <p className="empty-message">Aucune tâche. Ajoutez-en une ! 🎉</p>
        )}
      </div>
    </div>
  );
}

export default App;