import unittest
from app import app, db

class TodoTestCase(unittest.TestCase):
    def setUp(self):
        # Configuration de l'app pour les tests
        app.config['TESTING'] = True
        app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:' 
        self.client = app.test_client()
        with app.app_context():
            db.create_all()

    def test_health_check(self):
        """Vérifie que l'endpoint de test répond 200"""
        # CORRECTION : On utilise la route définie dans ton app.py
        response = self.client.get('/api/test')
        self.assertEqual(response.status_code, 200)
        # On vérifie que le JSON contient bien 'ok' comme dans ton app.py
        self.assertIn('ok', response.get_data(as_text=True))

    def test_api_unauthorized(self):
        """Vérifie que l'accès aux todos sans token est refusé (401)"""
        response = self.client.get('/api/todos')
        self.assertEqual(response.status_code, 401)

if __name__ == '__main__':
    unittest.main()