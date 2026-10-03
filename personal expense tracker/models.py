from datetime import datetime
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

class Expense(db.Model):
    __tablename__ = 'expense'

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(120), nullable=False)
    amount = db.Column(db.Float, nullable=False)
    category = db.Column(db.String(50), nullable=False)
    date = db.Column(db.String(20), nullable=False, default=lambda: datetime.now().strftime("%Y-%m-%d"))

    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'amount': round(float(self.amount), 2),
            'category': self.category,
            'date': self.date
        }

    def __repr__(self):
        return f'<Expense {self.id}: {self.title} - ${self.amount}>'
