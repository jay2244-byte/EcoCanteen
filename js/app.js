// Initialize the application when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize data storage or load existing data
    let wasteData = JSON.parse(localStorage.getItem('wasteData')) || [];
    
    // Initialize charts
    const mealTimeCtx = document.getElementById('mealTimeChart').getContext('2d');
    const reasonCtx = document.getElementById('reasonChart').getContext('2d');
    
    let mealTimeChart, reasonChart;
    
    // Initialize the application
    initCharts();
    updateDashboard();
    generateAISuggestions();
    
    // Form submission handler
    document.getElementById('waste-form').addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Get form data
        const wasteEntry = {
            id: Date.now(),
            date: new Date().toISOString(),
            foodItem: document.getElementById('food-item').value,
            quantity: parseFloat(document.getElementById('quantity').value),
            mealTime: document.getElementById('meal-time').value,
            reason: document.getElementById('reason').value,
            notes: document.getElementById('notes').value
        };
        
        // Add to data array
        wasteData.push(wasteEntry);
        
        // Save to localStorage
        localStorage.setItem('wasteData', JSON.stringify(wasteData));
        
        // Update UI
        updateDashboard();
        updateCharts();
        generateAISuggestions();
        
        // Reset form
        this.reset();
        
        // Show success message
        alert('Waste logged successfully!');
    });
    
    // Initialize charts
    function initCharts() {
        // Meal Time Chart
        mealTimeChart = new Chart(mealTimeCtx, {
            type: 'bar',
            data: {
                labels: ['Breakfast', 'Lunch', 'Dinner'],
                datasets: [{
                    label: 'Waste by Meal Time (kg)',
                    data: [0, 0, 0],
                    backgroundColor: [
                        'rgba(255, 99, 132, 0.7)',
                        'rgba(54, 162, 235, 0.7)',
                        'rgba(255, 206, 86, 0.7)'
                    ],
                    borderColor: [
                        'rgba(255, 99, 132, 1)',
                        'rgba(54, 162, 235, 1)',
                        'rgba(255, 206, 86, 1)'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Kilograms (kg)'
                        }
                    }
                }
            }
        });
        
        // Reason Chart
        reasonChart = new Chart(reasonCtx, {
            type: 'doughnut',
            data: {
                labels: ['Overproduction', 'Spoilage', 'Leftovers', 'Other'],
                datasets: [{
                    data: [0, 0, 0, 0],
                    backgroundColor: [
                        'rgba(75, 192, 192, 0.7)',
                        'rgba(153, 102, 255, 0.7)',
                        'rgba(255, 159, 64, 0.7)',
                        'rgba(199, 199, 199, 0.7)'
                    ],
                    borderColor: [
                        'rgba(75, 192, 192, 1)',
                        'rgba(153, 102, 255, 1)',
                        'rgba(255, 159, 64, 1)',
                        'rgba(199, 199, 199, 1)'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
        
        // Initial chart update
        updateCharts();
    }
    
    // Update charts with current data
    function updateCharts() {
        // Reset data
        const mealTimeData = [0, 0, 0]; // breakfast, lunch, dinner
        const reasonData = [0, 0, 0, 0]; // overproduction, spoilage, leftovers, other
        
        // Calculate totals
        wasteData.forEach(entry => {
            // Update meal time data
            if (entry.mealTime === 'breakfast') mealTimeData[0] += entry.quantity;
            else if (entry.mealTime === 'lunch') mealTimeData[1] += entry.quantity;
            else if (entry.mealTime === 'dinner') mealTimeData[2] += entry.quantity;
            
            // Update reason data
            if (entry.reason === 'overproduction') reasonData[0] += entry.quantity;
            else if (entry.reason === 'spoilage') reasonData[1] += entry.quantity;
            else if (entry.reason === 'leftovers') reasonData[2] += entry.quantity;
            else if (entry.reason === 'other') reasonData[3] += entry.quantity;
        });
        
        // Update charts
        mealTimeChart.data.datasets[0].data = mealTimeData;
        reasonChart.data.datasets[0].data = reasonData;
        
        mealTimeChart.update();
        reasonChart.update();
    }
    
    // Update dashboard with current data
    function updateDashboard() {
        if (wasteData.length === 0) {
            document.getElementById('today-waste').textContent = '0 kg';
            document.getElementById('weekly-avg').textContent = '0 kg';
            document.getElementById('savings').textContent = '$0';
            return;
        }
        
        // Calculate today's waste
        const today = new Date().toISOString().split('T')[0];
        const todayWaste = wasteData
            .filter(entry => entry.date.startsWith(today))
            .reduce((sum, entry) => sum + entry.quantity, 0);
        
        // Calculate weekly average (simplified)
        const weeklyTotal = wasteData.reduce((sum, entry) => sum + entry.quantity, 0);
        const weeklyAvg = weeklyTotal / 7; // Simple average
        
        // Calculate potential savings (example: $10 per kg)
        const monthlySavings = (weeklyTotal * 4 * 10).toFixed(2);
        
        // Update UI
        document.getElementById('today-waste').textContent = `${todayWaste.toFixed(1)} kg`;
        document.getElementById('weekly-avg').textContent = `${weeklyAvg.toFixed(1)} kg`;
        document.getElementById('savings').textContent = `$${monthlySavings}`;
    }
    
    // Generate AI-powered suggestions
    function generateAISuggestions() {
        const suggestionsContainer = document.getElementById('ai-suggestions');
        
        if (wasteData.length === 0) {
            suggestionsContainer.innerHTML = `
                <div class="suggestion-card">
                    <h5>No data yet</h5>
                    <p>Start logging food waste to receive personalized recommendations.</p>
                </div>
            `;
            return;
        }
        
        // Simple AI suggestions based on data analysis
        const mealTimeTotals = {
            breakfast: 0,
            lunch: 0,
            dinner: 0
        };
        
        const reasonTotals = {
            overproduction: 0,
            spoilage: 0,
            leftovers: 0,
            other: 0
        };
        
        // Calculate totals
        wasteData.forEach(entry => {
            mealTimeTotals[entry.mealTime] += entry.quantity;
            reasonTotals[entry.reason] += entry.quantity;
        });
        
        // Generate suggestions
        const suggestions = [];
        
        // Suggestion based on meal time with most waste
        const highestMealTime = Object.entries(mealTimeTotals)
            .reduce((a, b) => a[1] > b[1] ? a : b);
            
        if (highestMealTime[1] > 0) {
            suggestions.push({
                title: `Focus on ${capitalizeFirstLetter(highestMealTime[0])}`,
                content: `Most waste (${highestMealTime[1].toFixed(1)}kg) occurs during ${highestMealTime[0]}. Consider adjusting portion sizes or preparation quantities.`
            });
        }
        
        // Suggestion based on main reason for waste
        const mainReason = Object.entries(reasonTotals)
            .reduce((a, b) => a[1] > b[1] ? a : b);
            
        if (mainReason[1] > 0) {
            let reasonSuggestion = '';
            switch(mainReason[0]) {
                case 'overproduction':
                    reasonSuggestion = 'Consider implementing better demand forecasting or preparing smaller batches.';
                    break;
                case 'spoilage':
                    reasonSuggestion = 'Review food storage practices and consider using a first-in-first-out (FIFO) system.';
                    break;
                case 'leftovers':
                    reasonSuggestion = 'Offer smaller portion sizes or create a plan to repurpose leftovers.';
                    break;
                default:
                    reasonSuggestion = 'Review the reasons for waste in the logs to identify patterns.';
            }
            
            suggestions.push({
                title: `Addressing ${capitalizeFirstLetter(mainReason[0])}`,
                content: `The main reason for waste is ${mainReason[0]} (${mainReason[1].toFixed(1)}kg). ${reasonSuggestion}`
            });
        }
        
        // General tips
        suggestions.push({
            title: 'General Waste Reduction Tips',
            content: '1. Train staff on portion control.\n2. Implement a food waste tracking system.\n3. Donate excess food to local shelters when possible.\n4. Compost food waste to reduce landfill impact.'
        });
        
        // Display suggestions
        suggestionsContainer.innerHTML = suggestions.map(suggestion => `
            <div class="suggestion-card mb-3">
                <h5>${suggestion.title}</h5>
                <p class="mb-0">${suggestion.content.replace(/\n/g, '<br>')}</p>
            </div>
        `).join('');
    }
    
    // Helper function to capitalize first letter
    function capitalizeFirstLetter(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }
});
