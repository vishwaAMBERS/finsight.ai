import numpy as np
from sklearn.ensemble import IsolationForest
from datetime import datetime

def extract_features(transaction):
    """
    Extract numerical features from a transaction for ML model.
    We use amount and hour of day as the two features.
    """
    amount = float(transaction.get('amount', 0))
    
    # Extract hour from date
    date_str = transaction.get('date', '')
    try:
        if date_str:
            dt = datetime.fromisoformat(
                date_str.replace('Z', '+00:00')
            )
            hour = dt.hour
        else:
            hour = datetime.now().hour
    except:
        hour = datetime.now().hour
    
    # Day of week (0=Monday, 6=Sunday)
    try:
        day_of_week = dt.weekday() if date_str else datetime.now().weekday()
    except:
        day_of_week = datetime.now().weekday()
    
    return [amount, hour, day_of_week]


def detect_anomaly(new_transaction, history_transactions):
    """
    Score a new transaction against the user's history.
    Returns anomaly score between 0 and 1.
    Higher score = more suspicious.
    """
    
    # Need at least 10 transactions to build a meaningful model
    if len(history_transactions) < 10:
        return {
            'anomalyScore': 0.0,
            'isAnomaly': False,
            'reason': 'Not enough history for detection'
        }
    
    try:
        # Extract features from history
        history_features = []
        for tx in history_transactions:
            features = extract_features(tx)
            history_features.append(features)
        
        history_array = np.array(history_features)
        
        # Train Isolation Forest on user's personal history
        # contamination=0.05 means we expect 5% of transactions
        # to be anomalous
        model = IsolationForest(
            contamination=0.05,
            random_state=42,
            n_estimators=100
        )
        model.fit(history_array)
        
        # Score the new transaction
        new_features = np.array([extract_features(new_transaction)])
        
        # decision_function returns negative scores for anomalies
        raw_score = model.decision_function(new_features)[0]
        
        # Convert to 0-1 scale where 1 = most anomalous
        # Raw scores are typically between -0.5 and 0.5
        normalized_score = max(0, min(1, 0.5 - raw_score))
        
        is_anomaly = normalized_score > 0.75
        
        # Build human-readable reason
        new_amount = float(new_transaction.get('amount', 0))
        avg_amount = np.mean([float(t.get('amount', 0)) 
                              for t in history_transactions])
        
        reason = ''
        if new_amount > avg_amount * 3:
            reason = f'Amount ₹{new_amount} is much higher than your average ₹{avg_amount:.0f}'
        elif normalized_score > 0.75:
            reason = 'Unusual transaction pattern detected'
        else:
            reason = 'Transaction looks normal'
        
        return {
            'anomalyScore': round(float(normalized_score), 4),
            'isAnomaly': bool(is_anomaly),
            'reason': reason,
            'averageAmount': round(float(avg_amount), 2)
        }
        
    except Exception as e:
        print(f'Anomaly detection error: {e}')
        return {
            'anomalyScore': 0.0,
            'isAnomaly': False,
            'reason': f'Detection error: {str(e)}'
        }