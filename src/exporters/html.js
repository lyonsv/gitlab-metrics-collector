import fs from 'fs/promises';

const HTML_TEMPLATE = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>GitLab Metrics Visualization</title>
    <script src="https://cdn.plot.ly/plotly-2.27.0.min.js"></script>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background-color: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        h1 {
            color: #2f2f2f;
            margin-bottom: 20px;
            text-align: center;
            font-size: 24px;
        }
        .controls {
            margin: 20px 0;
            padding: 15px;
            background-color: #f8f9fa;
            border-radius: 4px;
        }
        .view-controls {
            margin-bottom: 15px;
            display: flex;
            gap: 10px;
        }
        .user-toggles {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            margin-top: 10px;
        }
        .button {
            padding: 8px 16px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
            transition: all 0.2s;
        }
        .view-button {
            background-color: #e9ecef;
            color: #495057;
        }
        .view-button.active {
            background-color: #228be6;
            color: white;
        }
        .user-toggle {
            background-color: #e9ecef;
            color: #495057;
            padding: 4px 12px;
            border-radius: 15px;
        }
        .user-toggle.active {
            background-color: #228be6;
            color: white;
        }
        .team-average-toggle {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-top: 10px;
            padding: 8px;
            background-color: #fff;
            border-radius: 4px;
            font-size: 14px;
        }
        .team-average-toggle input[type="checkbox"] {
            width: 18px;
            height: 18px;
            cursor: pointer;
        }
        .team-average-toggle label {
            cursor: pointer;
            user-select: none;
        }
        .chart-container {
            margin-top: 20px;
            padding: 15px;
            border: 1px solid #e0e0e0;
            border-radius: 4px;
            min-height: 600px;
        }
        .metrics-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin: 20px 0;
        }
        .metric-card {
            background-color: #f8f9fa;
            padding: 15px;
            border-radius: 4px;
            text-align: center;
        }
        .metric-value {
            font-size: 24px;
            font-weight: bold;
            color: #228be6;
        }
        .metric-label {
            font-size: 14px;
            color: #495057;
            margin-top: 5px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>GitLab Merge Request Metrics</h1>
        <div class="controls">
            <div class="view-controls">
                <button class="button view-button active" data-view="individual">Individual View</button>
                <button class="button view-button" data-view="team">Team Average</button>
                <button class="button view-button" data-view="all">View All</button>
            </div>
            <div class="user-toggles">
                <!-- User toggle buttons will be inserted here -->
            </div>
            <div class="team-average-toggle" style="display: none;">
                <input type="checkbox" id="teamAverageCheckbox">
                <label for="teamAverageCheckbox">Show Team Average Overlay</label>
            </div>
        </div>
        <div class="metrics-grid">
            <!-- Metrics cards will be inserted here -->
        </div>
        <div id="chart" class="chart-container"></div>
    </div>
    <script>
        // Chart data
        const data = <!-- DATA -->;
        let currentView = 'individual';
        let selectedUsers = new Set([data.series[0]?.name]); // Start with first user selected
        let showTeamAverage = false; // Team average overlay toggle state
        
        // Colors for the traces
        const colors = ['#228be6', '#40c057', '#fab005', '#fd7e14', '#e64980', '#7950f2', '#15aabf'];
        
        // Initialize the controls
        function initializeControls() {
            // Create user toggle buttons
            const userToggles = document.querySelector('.user-toggles');
            data.series.forEach((s, i) => {
                const button = document.createElement('button');
                button.className = 'button user-toggle' + (selectedUsers.has(s.name) ? ' active' : '');
                button.setAttribute('data-user', s.name);
                button.style.borderColor = colors[i % colors.length];
                button.textContent = s.name;
                button.onclick = () => toggleUser(s.name);
                userToggles.appendChild(button);
            });

            // Add view button listeners
            document.querySelectorAll('.view-button').forEach(button => {
                button.onclick = () => switchView(button.dataset.view);
            });

            // Add team average toggle listener
            const teamAverageCheckbox = document.getElementById('teamAverageCheckbox');
            teamAverageCheckbox.onchange = (e) => {
                showTeamAverage = e.target.checked;
                updateChart();
            };
        }

        function toggleUser(username) {
            if (currentView !== 'individual') return;
            
            const button = document.querySelector(\`[data-user="\${username}"]\`);
            if (selectedUsers.has(username)) {
                if (selectedUsers.size > 1) { // Prevent deselecting all users
                    selectedUsers.delete(username);
                    button.classList.remove('active');
                }
            } else {
                selectedUsers.add(username);
                button.classList.add('active');
            }
            updateChart();
        }

        function switchView(view) {
            currentView = view;
            
            // Update view buttons
            document.querySelectorAll('.view-button').forEach(btn => {
                btn.classList.toggle('active', btn.dataset.view === view);
            });

            // Show/hide user toggles based on view
            document.querySelector('.user-toggles').style.display = 
                view === 'individual' ? 'flex' : 'none';

            // Show/hide team average toggle (only in individual view)
            document.querySelector('.team-average-toggle').style.display = 
                view === 'individual' ? 'flex' : 'none';

            updateMetrics();
            updateChart();
        }

        function calculateMetrics() {
            const metrics = {
                total: 0,
                average: 0,
                max: 0,
                maxMonth: '',
                activeUsers: 0
            };

            if (currentView === 'team') {
                // Calculate team-wide metrics
                const monthlyTotals = {};
                data.series.forEach(s => {
                    s.data.forEach(d => {
                        monthlyTotals[d.month] = (monthlyTotals[d.month] || 0) + d.count;
                    });
                });

                const totals = Object.values(monthlyTotals);
                metrics.total = totals.reduce((a, b) => a + b, 0);
                metrics.average = (metrics.total / (totals.length * data.series.length)).toFixed(1);
                metrics.max = Math.max(...totals);
                metrics.maxMonth = Object.entries(monthlyTotals)
                    .find(([_, count]) => count === metrics.max)[0];
                metrics.activeUsers = data.series.length;
            } else {
                // Calculate individual metrics for selected users
                const users = currentView === 'all' ? data.series : 
                    data.series.filter(s => selectedUsers.has(s.name));
                
                users.forEach(s => {
                    const userTotal = s.data.reduce((sum, d) => sum + d.count, 0);
                    metrics.total += userTotal;
                    const userMax = Math.max(...s.data.map(d => d.count));
                    if (userMax > metrics.max) {
                        metrics.max = userMax;
                        metrics.maxMonth = s.data.find(d => d.count === userMax).month;
                    }
                });
                metrics.average = (metrics.total / (data.months.length * users.length)).toFixed(1);
                metrics.activeUsers = users.length;
            }

            return metrics;
        }

        function updateMetrics() {
            const metrics = calculateMetrics();
            const grid = document.querySelector('.metrics-grid');
            
            // Create basic metrics cards
            const html = \`
                <div class="metric-card">
                    <div class="metric-value">\${metrics.total}</div>
                    <div class="metric-label">Total Merge Requests</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value">\${metrics.average}</div>
                    <div class="metric-label">Average MRs per Month</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value">\${metrics.max}</div>
                    <div class="metric-label">Max MRs (\${metrics.maxMonth})</div>
                </div>
            \`;

            grid.innerHTML = html;
        }

        function updateChart() {
            let traces = [];
            
            if (currentView === 'team') {
                // Calculate and show team average (only counting active developers per month)
                const monthlyAverages = {};
                const monthlyActiveCounts = {}; // Track how many users had >0 MRs each month
                
                data.series.forEach(s => {
                    s.data.forEach(d => {
                        if (d.count > 0) {
                            monthlyAverages[d.month] = (monthlyAverages[d.month] || 0) + d.count;
                            monthlyActiveCounts[d.month] = (monthlyActiveCounts[d.month] || 0) + 1;
                        }
                    });
                });

                const months = Object.keys(monthlyAverages).sort();
                traces.push({
                    name: 'Team Average',
                    x: months,
                    y: months.map(m => {
                        const activeUsers = monthlyActiveCounts[m] || 1; // Avoid division by zero
                        return parseFloat((monthlyAverages[m] / activeUsers).toFixed(1));
                    }),
                    type: 'scatter',
                    mode: 'lines+markers',
                    line: { color: '#228be6', width: 3 },
                    hovertemplate: '<b>%{y}</b> MRs per active user in %{x}<extra></extra>'
                });
            } else {
                // Show individual or all users
                const usersToShow = currentView === 'all' ? 
                    data.series : 
                    data.series.filter(s => selectedUsers.has(s.name));

                traces = usersToShow.map((s, i) => ({
                    name: s.name,
                    x: s.data.map(d => d.month),
                    y: s.data.map(d => d.count),
                    type: 'scatter',
                    mode: 'lines+markers',
                    line: { color: colors[i % colors.length] },
                    hovertemplate: '<b>%{y}</b> MRs in %{x}<extra></extra>'
                }));

                // Add team average overlay if enabled in individual view
                if (currentView === 'individual' && showTeamAverage) {
                    const monthlyAverages = {};
                    const monthlyActiveCounts = {}; // Track how many users had >0 MRs each month
                    
                    data.series.forEach(s => {
                        s.data.forEach(d => {
                            if (d.count > 0) {
                                monthlyAverages[d.month] = (monthlyAverages[d.month] || 0) + d.count;
                                monthlyActiveCounts[d.month] = (monthlyActiveCounts[d.month] || 0) + 1;
                            }
                        });
                    });

                    const months = Object.keys(monthlyAverages).sort();
                    traces.push({
                        name: 'Team Average',
                        x: months,
                        y: months.map(m => {
                            const activeUsers = monthlyActiveCounts[m] || 1; // Avoid division by zero
                            return parseFloat((monthlyAverages[m] / activeUsers).toFixed(1));
                        }),
                        type: 'scatter',
                        mode: 'lines+markers',
                        line: { 
                            color: '#7c3aed',
                            width: 3,
                            dash: 'dash'
                        },
                        marker: {
                            size: 8,
                            symbol: 'diamond'
                        },
                        hovertemplate: '<b>%{y}</b> MRs per active user (team avg) in %{x}<extra></extra>'
                    });
                }
            }

            const layout = {
                title: {
                    text: currentView === 'team' ? 'Team Average MRs Over Time' : 
                          'Merge Requests Over Time',
                    font: { size: 24 }
                },
                xaxis: {
                    title: 'Month',
                    tickangle: -45
                },
                yaxis: {
                    title: 'Number of Merge Requests',
                    rangemode: 'nonnegative'
                },
                hovermode: 'closest',
                showlegend: true,
                legend: {
                    x: 1,
                    xanchor: 'right',
                    y: 1
                },
                margin: {
                    l: 60,
                    r: 40,
                    b: 80,
                    t: 80,
                    pad: 4
                }
            };

            const config = {
                responsive: true,
                displayModeBar: true,
                displaylogo: false,
                modeBarButtonsToRemove: ['lasso2d', 'select2d']
            };

            Plotly.newPlot('chart', traces, layout, config);
        }

        // Initialize the visualization
        initializeControls();
        updateMetrics();
        updateChart();
        
        // Set initial visibility states for toggles
        document.querySelector('.team-average-toggle').style.display = 
            currentView === 'individual' ? 'flex' : 'none';
    </script>
</body>
</html>`;

export async function exportToHtml(data, outputPath) {
    try {
        // Convert the data structure for visualization
        const processedData = processDataForVisualization(data);
        
        // Create the complete HTML
        const html = HTML_TEMPLATE
            .replace('<!-- DATA -->', JSON.stringify(processedData));
        
        // Write to file
        await fs.writeFile(outputPath, html, 'utf8');
        
    } catch (error) {
        throw new Error(`Failed to export HTML: ${error.message}`);
    }
}

function processDataForVisualization(data) {
    // Convert the data structure from the CSV format to what the visualization expects
    const months = new Set();
    const series = {};
    
    // First pass: collect all months and initialize series
    Object.entries(data).forEach(([username, monthData]) => {
        series[username] = [];
        Object.keys(monthData).forEach(month => months.add(month));
    });
    
    // Sort months chronologically
    const sortedMonths = Array.from(months).sort();
    
    // Second pass: fill in the data points
    Object.entries(data).forEach(([username, monthData]) => {
        sortedMonths.forEach(month => {
            series[username].push({
                month,
                count: monthData[month] || 0
            });
        });
    });
    
    return {
        months: sortedMonths,
        series: Object.entries(series).map(([username, data]) => ({
            name: username,
            data: data
        }))
    };
} 
