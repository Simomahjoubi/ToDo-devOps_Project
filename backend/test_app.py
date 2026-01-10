import unittest
from app import app, db

class TodoTestCase(unittest.TestCase):
    def setUp(self):
        # Configuration de l'app pour les tests
        app.config['TESTING'] = True
        app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:' # Base de données en mémoire
        self.client = app.test_client()
        with app.app_context():
            db.create_all()

    def test_health_check(self):
        """Vérifie que l'endpoint de santé répond 200"""
        response = self.client.get('/health')
        self.assertEqual(response.status_code, 200)
        self.assertIn('healthy', response.get_data(as_text=True))

    def test_api_unauthorized(self):
        """Vérifie que l'accès aux todos sans token est refusé (401)"""
        response = self.client.get('/api/todos')
        self.assertEqual(response.status_code, 401)

if __name__ == '__main__':
    unittest.main()