from flask import Flask, render_template, request, jsonify, redirect, url_for
import os
import json
from werkzeug.utils import secure_filename
from datetime import datetime
import uuid

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = 'flask-version/static/uploads'
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB limit
DATA_FILE = 'flask-version/data.json'

# Ensure folders exist
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

def load_data():
    if not os.path.exists(DATA_FILE):
        return {"business": {}, "bills": []}
    with open(DATA_FILE, 'r') as f:
        return json.load(f)

def save_data(data):
    with open(DATA_FILE, 'w') as f:
        json.dump(data, f, indent=4)

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/')
def index():
    data = load_data()
    return render_template('index.html', business=data['business'], bills=data['bills'])

@app.route('/settings', methods=['GET', 'POST'])
def settings():
    data = load_data()
    if request.method == 'POST':
        business = {
            "shopName": request.form.get('shopName'),
            "shopAddress": request.form.get('shopAddress'),
            "phone": request.form.get('phone'),
            "email": request.form.get('email'),
            "gstin": request.form.get('gstin'),
            "logo": data['business'].get('logo', '')
        }
        
        logo = request.files.get('logo')
        if logo and allowed_file(logo.filename):
            filename = secure_filename(logo.filename)
            filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            logo.save(filepath)
            business['logo'] = url_for('static', filename='uploads/' + filename)
            
        data['business'] = business
        save_data(data)
        return redirect(url_for('index'))
        
    return render_template('settings.html', business=data['business'])

@app.route('/create', methods=['GET', 'POST'])
def create():
    data = load_data()
    if not data['business']:
        return redirect(url_for('settings'))
        
    if request.method == 'POST':
        # Logic to save a new bill
        bill_data = request.json
        bill_data['id'] = str(uuid.uuid4())
        bill_data['createdAt'] = datetime.now().isoformat()
        data['bills'].append(bill_data)
        save_data(data)
        return jsonify({'success': True, 'id': bill_data['id']})
        
    return render_template('create.html', business=data['business'])

@app.route('/history')
def history():
    data = load_data()
    return render_template('history.html', bills=data['bills'])

@app.route('/api/upload-signature', methods=['POST'])
def upload_signature():
    if 'signature' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    
    file = request.files['signature']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
    
    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)
        return jsonify({'message': 'Upload successful', 'filepath': url_for('static', filename='uploads/' + filename)}), 200
    
    return jsonify({'error': 'File type not allowed'}), 400

if __name__ == '__main__':
    app.run(debug=True, port=5000)
