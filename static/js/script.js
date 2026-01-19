document.addEventListener('DOMContentLoaded', () => {
    console.log('Food Waste Advisor Loaded');

    // Handle Data Submission
    const dataForm = document.getElementById('waste-form');
    if (dataForm) {
        dataForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = {
                date: document.getElementById('date').value,
                meal_type: document.getElementById('meal_type').value,
                food_item: document.getElementById('food_item').value,
                produced_kg: document.getElementById('produced_kg').value,
                leftover_kg: document.getElementById('leftover_kg').value,
                reason: document.getElementById('reason').value,
                diversion_type: document.getElementById('diversion_type').value,
                recorded_by: document.getElementById('recorded_by').value
            };

            const response = await fetch('/api/submit-data', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const result = await response.json();
            if (result.status === 'success') {
                alert('Success: Food waste data recorded!');
                dataForm.reset();
            }
        });
    }

    // Handle History Loading
    const historyTable = document.getElementById('history-body');
    if (historyTable) {
        loadHistory();
    }

    // Handle Insights Loading
    const insightsContainer = document.getElementById('insights-content');
    if (insightsContainer) {
        loadInsights();
    }

    // Handle Dashboard Stats Loading
    const mealsSavedEl = document.getElementById('meals-saved');
    if (mealsSavedEl) {
        loadDashboardStats();
    }

    // Real-time Chatbot (Socket.io)
    if (document.getElementById('chat-container')) {
        const socket = io();
        const status = document.getElementById('chat-status');
        const chatInput = document.getElementById('chat-input');
        const chatBtn = document.getElementById('send-chat');

        socket.on('connect', () => {
            if (status) {
                status.innerText = '● Online';
                status.style.color = '#2e7d32';
            }
        });

        socket.on('disconnect', () => {
            if (status) {
                status.innerText = '● Offline';
                status.style.color = '#c62828';
            }
        });

        socket.on('ai_response', (data) => {
            appendMessage('ai', data.response);
        });

        const sendMessageSocket = () => {
            const query = chatInput.value.trim();
            if (!query) return;
            appendMessage('user', query);
            chatInput.value = '';
            socket.emit('user_message', { query });
        };

        if (chatBtn) {
            chatBtn.addEventListener('click', sendMessageSocket);
            chatInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') sendMessageSocket();
            });
        }
    }
});

async function loadInsights() {
    const response = await fetch('/api/insights');
    const data = await response.json();

    // Check if we are on insights page or dashboard
    const insightsContent = document.getElementById('insights-content');
    if (insightsContent) {
        const insightsHtml = `
            <div class="card">
                <h3>AI-Generated Insights & Leftover Actions</h3>
                <ul>
                    ${data.insights.map(i => `<li>${i}</li>`).join('')}
                </ul>
            </div>
        `;
        insightsContent.innerHTML = insightsHtml;
    }
}

async function loadHistory() {
    try {
        const response = await fetch('/api/insights');
        const data = await response.json();
        const historyBody = document.getElementById('history-body');

        if (!historyBody) return;

        if (data.raw_data && data.raw_data.length > 0) {
            // Create a copy before reversing to avoid mutation issues
            const displayData = [...data.raw_data].reverse();

            historyBody.innerHTML = displayData.map((row, index) => {
                // Calculate original index for receipt download
                const originalIndex = data.raw_data.length - 1 - index;
                return `
                    <tr>
                        <td>${row.date}</td>
                        <td>${row.meal_type}</td>
                        <td>${row.food_item}</td>
                        <td>${row.leftover_kg} kg</td>
                        <td>${row.recorded_by || 'N/A'}</td>
                        <td><button class="download-btn" onclick="downloadReceipt(${originalIndex})">Receipt</button></td>
                    </tr>
                `;
            }).join('');
        } else {
            historyBody.innerHTML = '<tr><td colspan="6" style="text-align:center;">No records found. Resetting with new data.</td></tr>';
        }
    } catch (error) {
        console.error('Error loading history:', error);
        if (document.getElementById('history-body')) {
            document.getElementById('history-body').innerHTML = '<tr><td colspan="6" style="text-align:center; color:red;">Failed to load history.</td></tr>';
        }
    }
}

async function loadDashboardStats() {
    try {
        const response = await fetch('/api/insights');
        const data = await response.json();

        if (data.metrics) {
            const mealsSaved = document.getElementById('meals-saved');
            const co2Saved = document.getElementById('co2-saved');

            if (mealsSaved) mealsSaved.innerText = data.metrics.meals_saved || 0;
            if (co2Saved) co2Saved.innerText = (data.metrics.co2_saved || 0).toFixed(1);
        }
    } catch (e) {
        console.error("Error loading dashboard stats", e);
    }
}

async function downloadReceipt(index) {
    const response = await fetch('/api/insights');
    const data = await response.json();
    const item = data.raw_data[index];

    const receiptText = `
-----------------------------------------
      ECOCANTEEN WASTE LOG RECEIPT
-----------------------------------------
Date: ${item.date}
Meal Type: ${item.meal_type}
Food Item: ${item.food_item}
-----------------------------------------
Production Amount: ${item.produced_kg} kg
Leftover Amount:   ${item.leftover_kg} kg
Waste Percentage:  ${((item.leftover_kg / item.produced_kg) * 100).toFixed(1)}%
Reason: ${item.reason || 'N/A'}
Logged By: ${item.recorded_by || 'N/A'}
-----------------------------------------
AI RECOMMENDATION:
Check the AI Insights dashboard for repurposing logic!
-----------------------------------------
    `;

    const blob = new Blob([receiptText], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Receipt_${item.date}_${item.food_item}.txt`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
}

function appendMessage(sender, text) {
    const chatBox = document.getElementById('chat-container');
    if (!chatBox) return;
    const div = document.createElement('div');
    div.classList.add('message', `${sender}-message`);
    div.innerText = text;
    chatBox.appendChild(div);
    chatBox.scrollTop = chatBox.scrollHeight;
}
