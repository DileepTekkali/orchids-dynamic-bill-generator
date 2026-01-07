from flask import Flask, render_template_string, request, jsonify, redirect, url_for
import os
import json
from werkzeug.utils import secure_filename
from datetime import datetime
import uuid
import base64

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = 'static/uploads'
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024
DATA_FILE = 'data.json'

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
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# Templates as strings
INDEX_HTML = """
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>BillMaker - Dashboard</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>body { font-family: 'Plus Jakarta Sans', sans-serif; }</style>
</head>
<body class="bg-gradient-to-br from-slate-50 via-amber-50/30 to-orange-50/20 min-h-screen">
    <div class="max-w-4xl mx-auto px-4 py-8 sm:py-12">
        <div class="flex items-center justify-between mb-8">
            <div>
                <h1 class="text-3xl sm:text-4xl font-bold text-slate-800 tracking-tight">BillMaker</h1>
                <p class="text-slate-500 mt-1">Create professional invoices in seconds</p>
            </div>
            <a href="/settings" class="p-2 border border-slate-200 rounded-full hover:bg-amber-100 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-slate-600"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
            </a>
        </div>

        {% if not business %}
        <div class="bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl p-6 mb-8 text-white shadow-lg">
            <div class="flex items-start gap-4">
                <div class="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="16" height="20" x="4" y="2" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/><line x1="8" y1="6" x2="16" y2="6"/><line x1="8" y1="10" x2="16" y2="10"/></svg>
                </div>
                <div>
                    <h2 class="text-xl font-bold mb-1">Complete Your Setup</h2>
                    <p class="text-amber-100 text-sm mb-4">Add your business details to start creating professional invoices</p>
                    <a href="/settings" class="bg-white text-amber-600 px-4 py-2 rounded-lg font-semibold inline-flex items-center">
                        Setup Business
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="ml-2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                    </a>
                </div>
            </div>
        </div>
        {% else %}
        <div class="bg-white rounded-2xl shadow-lg border border-slate-100 p-6 mb-8">
            <div class="flex items-center gap-4">
                {% if business.logo %}
                <img src="{{ business.logo }}" alt="Logo" class="w-16 h-16 object-contain rounded-xl">
                {% else %}
                <div class="w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center text-white text-2xl font-bold">
                    {{ business.shopName[0] }}
                </div>
                {% endif %}
                <div>
                    <h2 class="text-xl font-bold text-slate-800">{{ business.shopName }}</h2>
                    <p class="text-slate-500 text-sm">{{ business.shopAddress }}</p>
                </div>
            </div>
        </div>
        {% endif %}

        {% if bills %}
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <div class="bg-white rounded-2xl shadow-lg border border-slate-100 p-5">
                <div class="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center mb-3 text-amber-600">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1-2-1Z"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/><path d="M12 17.5V6.5"/></svg>
                </div>
                <p class="text-2xl font-bold text-slate-800">{{ bills|length }}</p>
                <p class="text-sm text-slate-500">Total Invoices</p>
            </div>
            <div class="bg-white rounded-2xl shadow-lg border border-slate-100 p-5">
                <div class="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center mb-3 text-green-600">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>
                </div>
                <p class="text-2xl font-bold text-slate-800">₹{{ bills|sum(attribute='grandTotal')|round(2) }}</p>
                <p class="text-sm text-slate-500">Total Revenue</p>
            </div>
        </div>
        {% endif %}

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <a href="/create" class="bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl p-6 text-white shadow-lg hover:scale-[1.02] transition-transform">
                <div class="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                </div>
                <h3 class="text-xl font-bold mb-2">Create New Bill</h3>
                <p class="text-amber-100 text-sm">Generate professional invoices</p>
            </a>
            <a href="/history" class="bg-white rounded-2xl p-6 shadow-lg border border-slate-100 hover:scale-[1.02] transition-transform">
                <div class="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mb-4 text-slate-600">
                    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/></svg>
                </div>
                <h3 class="text-xl font-bold text-slate-800 mb-2">Bill History</h3>
                <p class="text-slate-500 text-sm">Manage all past invoices</p>
            </a>
        </div>
    </div>
</body>
</html>
"""

SETTINGS_HTML = """
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>BillMaker - Settings</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>body { font-family: 'Plus Jakarta Sans', sans-serif; }</style>
</head>
<body class="bg-gradient-to-br from-slate-50 via-amber-50/30 to-orange-50/20 min-h-screen">
    <div class="max-w-2xl mx-auto px-4 py-8 sm:py-12">
        <div class="flex items-center gap-4 mb-8">
            <a href="/" class="p-2 border border-slate-200 rounded-full hover:bg-white transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-slate-600"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
            </a>
            <h1 class="text-2xl font-bold text-slate-800">Business Settings</h1>
        </div>

        <div class="bg-white rounded-2xl shadow-lg border border-slate-100 p-6">
            <form action="/settings" method="POST" enctype="multipart/form-data" class="space-y-6">
                <div>
                    <label class="block text-sm font-semibold text-slate-700 mb-2">Business Logo</label>
                    <div class="flex items-center gap-4">
                        <div id="logo-preview-container" class="w-20 h-20 border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center bg-slate-50 overflow-hidden">
                            {% if business.logo %}
                            <img id="logo-preview" src="{{ business.logo }}" class="w-full h-full object-contain">
                            {% else %}
                            <svg id="logo-placeholder" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-slate-400"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
                            {% endif %}
                        </div>
                        <input type="file" name="logo" id="logo-input" accept="image/*" class="hidden" onchange="previewImage(this)">
                        <button type="button" onclick="document.getElementById('logo-input').click()" class="px-4 py-2 text-sm font-semibold text-amber-600 bg-amber-50 rounded-lg hover:bg-amber-100 transition-colors">
                            Change Logo
                        </button>
                    </div>
                </div>

                <div class="grid grid-cols-1 gap-4">
                    <div>
                        <label class="block text-sm font-semibold text-slate-700 mb-1">Shop Name</label>
                        <input type="text" name="shopName" value="{{ business.shopName or '' }}" required class="w-full px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500">
                    </div>
                    <div>
                        <label class="block text-sm font-semibold text-slate-700 mb-1">Address</label>
                        <textarea name="shopAddress" required rows="3" class="w-full px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500">{{ business.shopAddress or '' }}</textarea>
                    </div>
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-semibold text-slate-700 mb-1">Phone Number</label>
                            <input type="text" name="phone" value="{{ business.phone or '' }}" class="w-full px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500">
                        </div>
                        <div>
                            <label class="block text-sm font-semibold text-slate-700 mb-1">Email</label>
                            <input type="email" name="email" value="{{ business.email or '' }}" class="w-full px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500">
                        </div>
                    </div>
                </div>

                <button type="submit" class="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white py-3 rounded-xl font-bold shadow-lg shadow-amber-500/20 hover:shadow-amber-500/40 transition-all">
                    Save Business Details
                </button>
            </form>
        </div>
    </div>
    <script>
        function previewImage(input) {
            if (input.files && input.files[0]) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const container = document.getElementById('logo-preview-container');
                    container.innerHTML = `<img src="${e.target.result}" class="w-full h-full object-contain">`;
                };
                reader.readAsDataURL(input.files[0]);
            }
        }
    </script>
</body>
</html>
"""

CREATE_HTML = """
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>BillMaker - Create Bill</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>body { font-family: 'Plus Jakarta Sans', sans-serif; }</style>
</head>
<body class="bg-gradient-to-br from-slate-50 via-amber-50/30 to-orange-50/20 min-h-screen">
    <div class="max-w-4xl mx-auto px-4 py-8">
        <div class="flex items-center gap-4 mb-8">
            <a href="/" class="p-2 border border-slate-200 rounded-full hover:bg-white transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-slate-600"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
            </a>
            <h1 class="text-2xl font-bold text-slate-800">Create New Bill</h1>
        </div>

        <div class="space-y-6">
            <div class="bg-white rounded-2xl shadow-lg border border-slate-100 p-6">
                <h2 class="text-lg font-bold text-slate-800 mb-4">Customer Details</h2>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-semibold text-slate-700 mb-1">Customer Name</label>
                        <input type="text" id="customerName" required class="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500">
                    </div>
                    <div>
                        <label class="block text-sm font-semibold text-slate-700 mb-1">Customer Phone</label>
                        <input type="text" id="customerPhone" class="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500">
                    </div>
                </div>
            </div>

            <div class="bg-white rounded-2xl shadow-lg border border-slate-100 p-6">
                <div class="flex items-center justify-between mb-4">
                    <h2 class="text-lg font-bold text-slate-800">Items</h2>
                    <button type="button" onclick="addItem()" class="text-sm font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                        Add Item
                    </button>
                </div>
                <div class="overflow-x-auto">
                    <table class="w-full text-left">
                        <thead>
                            <tr class="text-slate-500 text-sm border-b border-slate-100">
                                <th class="pb-2 font-semibold">Description</th>
                                <th class="pb-2 font-semibold w-24">Qty</th>
                                <th class="pb-2 font-semibold w-32">Price</th>
                                <th class="pb-2 font-semibold w-32">Total</th>
                                <th class="pb-2 w-10"></th>
                            </tr>
                        </thead>
                        <tbody id="items-body"></tbody>
                    </table>
                </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div class="bg-white rounded-2xl shadow-lg border border-slate-100 p-6">
                    <h2 class="text-lg font-bold text-slate-800 mb-4">Signature</h2>
                    <div id="drop-zone" class="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center cursor-pointer hover:bg-slate-50 transition-colors">
                        <input type="file" id="signature-input" accept="image/*" class="hidden">
                        <div id="signature-empty">
                            <p class="text-sm text-slate-500">Click or drag signature</p>
                        </div>
                        <div id="signature-preview-container" class="hidden relative">
                            <img id="signature-preview" class="max-h-32 mx-auto">
                            <button type="button" onclick="removeSignature()" class="absolute -top-2 -right-2 bg-red-100 text-red-600 p-1 rounded-full">X</button>
                        </div>
                    </div>
                </div>

                <div class="bg-white rounded-2xl shadow-lg border border-slate-100 p-6 space-y-3">
                    <div class="flex justify-between text-slate-600"><span>Subtotal</span><span id="subtotal">₹0.00</span></div>
                    <div class="flex justify-between items-center text-slate-600"><span>Tax (%)</span><input type="number" id="taxRate" value="0" oninput="calculateTotals()" class="w-20 px-2 py-1 rounded border"></div>
                    <div class="flex justify-between items-center text-slate-600"><span>Discount</span><input type="number" id="discount" value="0" oninput="calculateTotals()" class="w-20 px-2 py-1 rounded border"></div>
                    <div class="border-t pt-3 flex justify-between font-bold text-xl text-slate-800"><span>Grand Total</span><span id="grandTotal" class="text-amber-600">₹0.00</span></div>
                </div>
            </div>

            <button onclick="saveBill()" class="w-full bg-amber-500 text-white py-4 rounded-2xl font-bold shadow-lg">Generate & Save Bill</button>
        </div>
    </div>
    <script>
        let items = [];
        let signatureUrl = '';

        function addItem() {
            items.push({ id: Date.now(), description: '', quantity: 1, price: 0 });
            renderItems();
        }

        function removeItem(id) {
            items = items.filter(i => i.id !== id);
            renderItems();
        }

        function updateItem(id, field, value) {
            const item = items.find(i => i.id === id);
            if (item) { item[field] = field === 'description' ? value : parseFloat(value) || 0; renderItems(); }
        }

        function renderItems() {
            const tbody = document.getElementById('items-body');
            tbody.innerHTML = items.map(item => `
                <tr class="border-b">
                    <td class="py-3"><input type="text" value="${item.description}" oninput="updateItem(${item.id}, 'description', this.value)" class="w-full bg-transparent"></td>
                    <td class="py-3"><input type="number" value="${item.quantity}" oninput="updateItem(${item.id}, 'quantity', this.value)" class="w-full bg-transparent"></td>
                    <td class="py-3"><input type="number" value="${item.price}" oninput="updateItem(${item.id}, 'price', this.value)" class="w-full bg-transparent"></td>
                    <td class="py-3 font-semibold">₹${(item.quantity * item.price).toFixed(2)}</td>
                    <td class="py-3"><button onclick="removeItem(${item.id})" class="text-red-400">X</button></td>
                </tr>
            `).join('');
            calculateTotals();
        }

        function calculateTotals() {
            const subtotal = items.reduce((sum, i) => sum + (i.quantity * i.price), 0);
            const tax = parseFloat(document.getElementById('taxRate').value) || 0;
            const discount = parseFloat(document.getElementById('discount').value) || 0;
            const total = subtotal + (subtotal * tax/100) - discount;
            document.getElementById('subtotal').textContent = '₹' + subtotal.toFixed(2);
            document.getElementById('grandTotal').textContent = '₹' + Math.max(0, total).toFixed(2);
        }

        document.getElementById('drop-zone').onclick = () => document.getElementById('signature-input').click();
        document.getElementById('signature-input').onchange = (e) => {
            if (e.target.files[0]) {
                const formData = new FormData();
                formData.append('signature', e.target.files[0]);
                fetch('/api/upload-signature', { method: 'POST', body: formData })
                .then(r => r.json()).then(data => {
                    if (data.filepath) {
                        signatureUrl = data.filepath;
                        document.getElementById('signature-preview').src = data.filepath;
                        document.getElementById('signature-empty').classList.add('hidden');
                        document.getElementById('signature-preview-container').classList.remove('hidden');
                    }
                });
            }
        };

        function removeSignature() {
            signatureUrl = '';
            document.getElementById('signature-empty').classList.remove('hidden');
            document.getElementById('signature-preview-container').classList.add('hidden');
        }

        async function saveBill() {
            const data = {
                billNumber: 'BILL-' + Date.now().toString().slice(-6),
                customerName: document.getElementById('customerName').value,
                customerPhone: document.getElementById('customerPhone').value,
                items,
                grandTotal: parseFloat(document.getElementById('grandTotal').textContent.replace('₹', '')),
                billDate: new Date().toISOString(),
                signature: signatureUrl
            };
            const res = await fetch('/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            if (res.ok) window.location.href = '/';
        }
        addItem();
    </script>
</body>
</html>
"""

HISTORY_HTML = """
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>BillMaker - History</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>body { font-family: 'Plus Jakarta Sans', sans-serif; }</style>
</head>
<body class="bg-gradient-to-br from-slate-50 via-amber-50/30 to-orange-50/20 min-h-screen">
    <div class="max-w-4xl mx-auto px-4 py-8">
        <div class="flex items-center gap-4 mb-8"><a href="/" class="p-2 border rounded-full hover:bg-white transition-colors">Back</a><h1 class="text-2xl font-bold text-slate-800">Bill History</h1></div>
        <div class="bg-white rounded-2xl shadow-lg border overflow-hidden">
            {% if bills %}
            <table class="w-full text-left">
                <tr class="bg-slate-50 text-slate-500 text-sm">
                    <th class="px-6 py-4">Bill No.</th><th class="px-6 py-4">Customer</th><th class="px-6 py-4">Date</th><th class="px-6 py-4">Total</th>
                </tr>
                {% for bill in bills|reverse %}
                <tr class="border-b">
                    <td class="px-6 py-4 font-semibold">{{ bill.billNumber }}</td>
                    <td class="px-6 py-4">{{ bill.customerName }}</td>
                    <td class="px-6 py-4">{{ bill.billDate[:10] }}</td>
                    <td class="px-6 py-4 font-bold text-amber-600">₹{{ "%.2f"|format(bill.grandTotal) }}</td>
                </tr>
                {% endfor %}
            </table>
            {% else %}
            <div class="p-12 text-center">No bills found</div>
            {% endif %}
        </div>
    </div>
</body>
</html>
"""

@app.route('/')
def index():
    data = load_data()
    return render_template_string(INDEX_HTML, business=data['business'], bills=data['bills'])

@app.route('/settings', methods=['GET', 'POST'])
def settings():
    data = load_data()
    if request.method == 'POST':
        business = {
            "shopName": request.form.get('shopName'),
            "shopAddress": request.form.get('shopAddress'),
            "logo": data['business'].get('logo', '')
        }
        logo = request.files.get('logo')
        if logo and allowed_file(logo.filename):
            filename = secure_filename(logo.filename)
            filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            logo.save(filepath)
            business['logo'] = '/static/uploads/' + filename
        data['business'] = business
        save_data(data)
        return redirect(url_for('index'))
    return render_template_string(SETTINGS_HTML, business=data['business'])

@app.route('/create', methods=['GET', 'POST'])
def create():
    data = load_data()
    if request.method == 'POST':
        bill_data = request.json
        bill_data['id'] = str(uuid.uuid4())
        data['bills'].append(bill_data)
        save_data(data)
        return jsonify({'success': True})
    return render_template_string(CREATE_HTML, business=data['business'])

@app.route('/history')
def history():
    data = load_data()
    return render_template_string(HISTORY_HTML, bills=data['bills'])

@app.route('/api/upload-signature', methods=['POST'])
def upload_signature():
    file = request.files.get('signature')
    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)
        return jsonify({'filepath': '/static/uploads/' + filename})
    return jsonify({'error': 'Invalid file'}), 400

if __name__ == '__main__':
    app.run(debug=True, port=5000)
