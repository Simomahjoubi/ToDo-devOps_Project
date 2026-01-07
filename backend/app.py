from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
import jwt
import datetime
from functools import wraps
import os

app = Flask(__name__)

# CONFIGURATION
app.config['SECRET_KEY'] = 'ma_cle_secrete_123'
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///todos.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Autoriser ton frontend
CORS(app)

db = SQLAlchemy(app)

# MODÈLES DE DONNÉES
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(255), nullable=False)
    todos = db.relationship('Todo', backref='author', lazy=True)

class Todo(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    completed = db.Column(db.Boolean, default=False)
    priority = db.Column(db.String(20), default='moyenne')
    due_date = db.Column(db.String(50), nullable=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)

# Initialisation de la base de données
with app.app_context():
    db.create_all()

# DÉCORATEUR POUR PROTÉGER LES ROUTES
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        if 'Authorization' in request.headers:
            token = request.headers['Authorization'].split(" ")[1]
        
        if not token:
            return jsonify({'message': 'Token manquant'}), 401
        
        try:
            data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=["HS256"])
            current_user = db.session.get(User, data['user_id'])
        except:
            return jsonify({'message': 'Token invalide'}), 401
        
        return f(current_user, *args, **kwargs)
    return decorated

# ROUTES AUTHENTIFICATION
@app.route('/api/auth/register', methods=['POST'])
def register():
    data = request.get_json()
    if User.query.filter_by(username=data['username']).first():
        return jsonify({'message': 'Utilisateur existe déjà'}), 400
    
    hashed_password = generate_password_hash(data['password'], method='pbkdf2:sha256')
    new_user = User(username=data['username'], email=data['email'], password=hashed_password)
    db.session.add(new_user)
    db.session.commit()
    return jsonify({'message': 'Inscription réussie'}), 201

@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.get_json()
    user = User.query.filter_by(username=data['username']).first()
    
    if not user or not check_password_hash(user.password, data['password']):
        return jsonify({'message': 'Identifiants incorrects'}), 401
    
    token = jwt.encode({
        'user_id': user.id,
        'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=24)
    }, app.config['SECRET_KEY'], algorithm="HS256")
    
    return jsonify({
        'token': token,
        'user': {'id': user.id, 'username': user.username, 'email': user.email}
    })

@app.route('/api/auth/me', methods=['GET'])
@token_required
def get_me(current_user):
    return jsonify({'id': current_user.id, 'username': current_user.username, 'email': current_user.email})

# ROUTES TODOS
@app.route('/api/todos', methods=['GET'])
@token_required
def get_todos(current_user):
    filter_type = request.args.get('filter', 'all')
    query = Todo.query.filter_by(user_id=current_user.id)
    
    if filter_type == 'active':
        query = query.filter_by(completed=False)
    elif filter_type == 'completed':
        query = query.filter_by(completed=True)
        
    todos = query.order_by(Todo.id.desc()).all()
    output = []
    for todo in todos:
        output.append({
            'id': todo.id,
            'title': todo.title,
            'completed': todo.completed,
            'priority': todo.priority,
            'due_date': todo.due_date
        })
    return jsonify(output)

@app.route('/api/todos', methods=['POST'])
@token_required
def add_todo(current_user):
    data = request.get_json()
    new_todo = Todo(
        title=data['title'],
        priority=data.get('priority', 'moyenne'),
        due_date=data.get('due_date'),
        user_id=current_user.id
    )
    db.session.add(new_todo)
    db.session.commit()
    return jsonify({'id': new_todo.id, 'title': new_todo.title, 'completed': False, 'priority': new_todo.priority, 'due_date': new_todo.due_date}), 201

@app.route('/api/todos/<int:id>', methods=['PUT'])
@token_required
def update_todo(current_user, id):
    todo = Todo.query.filter_by(id=id, user_id=current_user.id).first()
    if not todo:
        return jsonify({'message': 'Non trouvé'}), 404
    
    data = request.get_json()
    if 'completed' in data: todo.completed = data['completed']
    if 'title' in data: todo.title = data['title']
    if 'priority' in data: todo.priority = data['priority']
    
    db.session.commit()
    return jsonify({'id': todo.id, 'title': todo.title, 'completed': todo.completed, 'priority': todo.priority, 'due_date': todo.due_date})

@app.route('/api/todos/<int:id>', methods=['DELETE'])
@token_required
def delete_todo(current_user, id):
    todo = Todo.query.filter_by(id=id, user_id=current_user.id).first()
    if not todo:
        return jsonify({'message': 'Non trouvé'}), 404
    db.session.delete(todo)
    db.session.commit()
    return jsonify({'message': 'Supprimé'})

# Route de test simple pour remplacer l'ancien healthcheck
@app.route('/api/test', methods=['GET'])
def test():
    return jsonify({'status': 'ok'})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)