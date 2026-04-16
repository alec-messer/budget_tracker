import os
import json
import firebase_admin
from firebase_admin import credentials, firestore
from flask import Flask, render_template, request, jsonify

def init_firestore():
    if not firebase_admin._apps:
        cred_json = json.loads(os.environ['GOOGLE_APPLICATION_CREDENTIALS_JSON'])
        cred = credentials.Certificate(cred_json)
        firebase_admin.initialize_app(cred)

    return firestore.client()

db = init_firestore()
app = Flask(__name__)


# -------------------------
# HELPERS
# -------------------------
def get_state():
    doc = db.collection('meta').document('current').get()
    return doc.to_dict() if doc.exists else {
        'balance': 0,
        'savings': 0,
        'monthly_pay': 0
    }


# -------------------------
# ROUTES
# -------------------------
@app.route('/')
def index():
    state = get_state()

    transactions = db.collection('transactions') \
        .order_by('timestamp', direction=firestore.Query.DESCENDING) \
        .stream()

    tx_list = []
    for t in transactions:
        data = t.to_dict()
        tx_list.append(data)

    return render_template(
        'index.html',
        state=state,
        transactions=tx_list
    )


@app.route('/add_transaction', methods=['POST'])
def add_transaction():
    data = request.get_json()

    amount = float(data['amount'])
    name = data['name']
    ttype = data['type']

    state = get_state()

    if ttype == 'out':
        state['balance'] -= amount
    else:
        state['balance'] += amount

    db.collection('meta').document('current').set(state)

    db.collection('transactions').add({
        'name': name,
        'amount': amount,
        'type': ttype,
        'timestamp': firestore.SERVER_TIMESTAMP
    })

    return jsonify({
        'success': True,
        'balance': state['balance']
    })


@app.route('/new_month', methods=['POST'])
def new_month():
    data = request.get_json()

    pay = float(data['pay'])
    balance = float(data['balance'])
    savings = float(data.get('savings', 0))

    # NEW RULE:
    # after payday, balance = pay + remaining balance
    new_balance = pay + balance

    state = {
        'monthly_pay': pay,
        'balance': new_balance,
        'savings': savings
    }

    db.collection('meta').document('current').set(state)

    # clear transactions
    docs = db.collection('transactions').stream()
    for d in docs:
        d.reference.delete()

    return jsonify({
        'success': True,
        'new_balance': new_balance
    })
