from flask import Flask, request, jsonify
from flask_cors import CORS
from anomaly import detect_anomaly
import os

app = Flask(__name__)
CORS(app)

@app.route('/', methods=['GET'])
def health():
    return jsonify({
        'status': 'ok',
        'service': 'FinSight AI ML Service',
        'port': 8000
    })

@app.route('/analyze', methods=['POST'])
def analyze():
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        new_transaction = data.get('newTransaction')
        history = data.get('history', [])
        
        if not new_transaction:
            return jsonify({'error': 'newTransaction is required'}), 400
        
        print(f"Analyzing transaction: {new_transaction.get('description')}")
        print(f"History size: {len(history)} transactions")
        
        result = detect_anomaly(new_transaction, history)
        
        print(f"Result: score={result['anomalyScore']}, "
              f"isAnomaly={result['isAnomaly']}")
        
        return jsonify(result)
        
    except Exception as e:
        print(f'Error in /analyze: {e}')
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    print('🚀 ML Service starting on port 8000')
    app.run(host='0.0.0.0', port=8000, debug=True)