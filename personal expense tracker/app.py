import os
from datetime import datetime
from flask import Flask, render_template, request, jsonify
from models import db, Expense

app = Flask(__name__)

# Base directory for database persistence
basedir = os.path.abspath(os.path.dirname(__file__))
app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{os.path.join(basedir, "expenses.db")}'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db.init_app(app)

# Ensure database tables exist
with app.app_context():
    db.create_all()


@app.route('/')
def index():
    """Serve the main application dashboard."""
    return render_template('index.html')


@app.route('/api/expenses', methods=['GET'])
def get_expenses():
    """
    Retrieve all expenses.
    Ordered by ID descending (newest first).
    """
    expenses = Expense.query.order_by(Expense.id.desc()).all()
    return jsonify([expense.to_dict() for expense in expenses]), 200


@app.route('/api/expenses', methods=['POST'])
def add_expense():
    """
    Create a new expense.
    Required payload fields: title, amount, category
    Optional field: date (defaults to today YYYY-MM-DD)
    """
    data = request.get_json(silent=True)
    if not data:
        return jsonify({'error': 'Invalid request: JSON body required'}), 400

    title = data.get('title')
    amount = data.get('amount')
    category = data.get('category')
    date_val = data.get('date')

    # Validation
    if not title or not isinstance(title, str) or not title.strip():
        return jsonify({'error': 'Expense title is required and cannot be empty.'}), 400

    if amount is None:
        return jsonify({'error': 'Expense amount is required.'}), 400

    try:
        amount_float = float(amount)
        if amount_float <= 0:
            return jsonify({'error': 'Expense amount must be greater than zero.'}), 400
    except (ValueError, TypeError):
        return jsonify({'error': 'Expense amount must be a valid number.'}), 400

    if not category or not isinstance(category, str) or not category.strip():
        return jsonify({'error': 'Expense category is required.'}), 400

    if not date_val or not isinstance(date_val, str) or not date_val.strip():
        date_val = datetime.now().strftime("%Y-%m-%d")

    new_expense = Expense(
        title=title.strip(),
        amount=amount_float,
        category=category.strip(),
        date=date_val.strip()
    )

    try:
        db.session.add(new_expense)
        db.session.commit()
        return jsonify(new_expense.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to save expense: {str(e)}'}), 500


@app.route('/api/expenses/<int:expense_id>', methods=['DELETE'])
def delete_expense(expense_id):
    """
    Delete an expense using its unique ID.
    """
    expense = db.session.get(Expense, expense_id)
    if not expense:
        return jsonify({'error': f'Expense with ID {expense_id} not found.'}), 404

    try:
        db.session.delete(expense)
        db.session.commit()
        return jsonify({
            'message': 'Expense deleted successfully.',
            'id': expense_id
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to delete expense: {str(e)}'}), 500


if __name__ == '__main__':
    # Run development server
    app.run(debug=True, host='127.0.0.1', port=5000)
