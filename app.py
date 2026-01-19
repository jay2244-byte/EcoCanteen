from flask import Flask, request, jsonify, send_from_directory
from flask_socketio import SocketIO, emit
import os
import data_manager
import ai_engine

app = Flask(__name__, static_folder='static')
socketio = SocketIO(app, cors_allowed_origins="*")

@app.route('/')
def index():
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/input')
def input_page():
    return send_from_directory(app.static_folder, 'input.html')

@app.route('/insights')
def insights_page():
    return send_from_directory(app.static_folder, 'insights.html')

@app.route('/chatbot')
def chatbot_page():
    return send_from_directory(app.static_folder, 'chatbot.html')

@app.route('/history')
def history_page():
    return send_from_directory(app.static_folder, 'history.html')

@app.route('/api/submit-data', methods=['POST'])
def submit_data():
    data = request.json
    data_manager.save_waste_data(data)
    return jsonify({"status": "success", "message": "Data saved successfully"})

@app.route('/api/insights', methods=['GET'])
def get_insights():
    data = data_manager.get_all_data()
    ai_result = ai_engine.get_ai_insights(data)
    
    # Check if ai_result is a list (old behavior backup) or dict
    if isinstance(ai_result, list):
        insights = ai_result
        metrics = {}
    else:
        insights = ai_result.get('text_insights', [])
        metrics = ai_result.get('metrics', {})

    return jsonify({
        "insights": insights,
        "metrics": metrics,
        "raw_data": data
    })

# Real-time Chat Socket Events
@socketio.on('user_message')
def handle_message(data):
    query = data.get('query')
    # Simulate AI processing delay
    response = ai_engine.handle_chat_query(query)
    emit('ai_response', {'response': response})

if __name__ == '__main__':
    data_manager.init_db()
    socketio.run(app, debug=True, port=5000)
