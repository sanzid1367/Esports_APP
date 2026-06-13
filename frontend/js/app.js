const API_BASE_URL = 'http://127.0.0.1:8000/api';

// Authentication helper
function checkAuth() {
    const token = localStorage.getItem('admin_token');
    const authStatus = document.getElementById('auth-status');
    const adminFormContainer = document.getElementById('admin-form-container');
    const loginAlert = document.getElementById('login-alert');

    if (token) {
        if (authStatus) {
            authStatus.innerHTML = `Welcome, Admin | <a href="#" id="logout-btn" style="color: white; text-decoration: underline;">Logout</a>`;
            document.getElementById('logout-btn').addEventListener('click', (e) => {
                e.preventDefault();
                logout();
            });
        }
        if (adminFormContainer) {
            adminFormContainer.style.display = 'block';
        }
        if (loginAlert) {
            loginAlert.style.display = 'none';
        }
    } else {
        if (authStatus) {
            authStatus.innerHTML = `<a href="admin.html" style="color: white; text-decoration: none;">Admin Login</a>`;
        }
        if (adminFormContainer) {
            adminFormContainer.style.display = 'none';
        }
        if (loginAlert) {
            loginAlert.style.display = 'block';
        }
    }
}

function logout() {
    localStorage.removeItem('admin_token');
    alert('Logged out successfully!');
    window.location.reload();
}

function getHeaders() {
    const token = localStorage.getItem('admin_token');
    const headers = { 'Content-Type': 'application/json' };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
}

// Dashboard Functions
async function fetchDashboardStats() {
    try {
        const response = await fetch(`${API_BASE_URL}/dashboard-stats`);
        const data = await response.json();
        
        document.getElementById('games-count').innerText = data.games_count;
        document.getElementById('tournaments-count').innerText = data.tournaments_count;
        document.getElementById('teams-count').innerText = data.teams_count;
        document.getElementById('players-count').innerText = data.players_count;
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
    }
}

async function fetchUpcomingTournaments() {
    try {
        const response = await fetch(`${API_BASE_URL}/upcoming-tournaments`);
        const data = await response.json();
        
        const container = document.getElementById('upcoming-tournaments');
        
        if (data.length > 0) {
            let html = '<div class="card-container">';
            data.forEach(t => {
                let prizePool = t.prize_pool ? `$${parseFloat(t.prize_pool).toLocaleString()}` : 'N/A';
                html += `
                <div class="card">
                    <h3>${t.tournament_name}</h3>
                    <p><strong>Game:</strong> ${t.game_name}</p>
                    <p><strong>Dates:</strong> ${t.start_date} to ${t.end_date}</p>
                    <p><strong>Prize Pool:</strong> ${prizePool}</p>
                    <p><strong>Location:</strong> ${t.location || 'Online'}</p>
                </div>
                `;
            });
            html += '</div>';
            container.innerHTML = html;
        } else {
            container.innerHTML = '<p>No upcoming tournaments found.</p>';
        }
    } catch (error) {
        console.error('Error fetching upcoming tournaments:', error);
        document.getElementById('upcoming-tournaments').innerHTML = '<p>Error loading tournaments.</p>';
    }
}

async function fetchRecentMatches() {
    try {
        const response = await fetch(`${API_BASE_URL}/recent-matches`);
        const data = await response.json();
        
        const container = document.getElementById('recent-matches');
        
        if (data.length > 0) {
            let html = `<table>
                <tr>
                    <th>Match</th>
                    <th>Teams</th>
                    <th>Score</th>
                    <th>Winner</th>
                    <th>Date</th>
                    <th>Tournament</th>
                </tr>`;
            
            data.forEach(m => {
                const date = new Date(m.match_date).toLocaleString();
                html += `<tr>
                    <td>${m.stage}</td>
                    <td>${m.team1_name} vs ${m.team2_name}</td>
                    <td>${m.team1_score} - ${m.team2_score}</td>
                    <td>${m.winner_name}</td>
                    <td>${date}</td>
                    <td>${m.game_name} - ${m.tournament_name}</td>
                </tr>`;
            });
            html += '</table>';
            container.innerHTML = html;
        } else {
            container.innerHTML = '<p>No recent match results found.</p>';
        }
    } catch (error) {
        console.error('Error fetching recent matches:', error);
        document.getElementById('recent-matches').innerHTML = '<p>Error loading matches.</p>';
    }
}

// Games and Dropdown helpers
async function loadGamesDropdown() {
    try {
        const response = await fetch(`${API_BASE_URL}/games`);
        const games = await response.json();
        const select = document.getElementById('game_id');
        if (select) {
            select.innerHTML = games.map(g => `<option value="${g.game_id}">${g.game_name}</option>`).join('');
        }
    } catch (error) {
        console.error('Error loading games dropdown:', error);
    }
}

async function loadTeamsDropdown() {
    try {
        const response = await fetch(`${API_BASE_URL}/teams`);
        const teams = await response.json();
        const select = document.getElementById('team_id');
        if (select) {
            select.innerHTML = teams.map(t => `<option value="${t.team_id}">${t.team_name} (${t.game_name})</option>`).join('');
        }
    } catch (error) {
        console.error('Error loading teams dropdown:', error);
    }
}

async function loadTournamentsDropdown() {
    try {
        const response = await fetch(`${API_BASE_URL}/tournaments`);
        const tournaments = await response.json();
        const select = document.getElementById('tournament_id');
        if (select) {
            select.innerHTML = tournaments.map(t => `<option value="${t.tournament_id}">${t.tournament_name}</option>`).join('');
        }
    } catch (error) {
        console.error('Error loading tournaments dropdown:', error);
    }
}

async function loadTeamsDropdowns() {
    try {
        const response = await fetch(`${API_BASE_URL}/teams`);
        const teams = await response.json();
        const select1 = document.getElementById('team1_id');
        const select2 = document.getElementById('team2_id');
        if (select1 && select2) {
            const options = teams.map(t => `<option value="${t.team_id}">${t.team_name} (${t.game_name})</option>`).join('');
            select1.innerHTML = options;
            select2.innerHTML = options;
        }
    } catch (error) {
        console.error('Error loading teams dropdowns:', error);
    }
}

// Tournaments Page Functions
async function loadTournamentsList() {
    try {
        const response = await fetch(`${API_BASE_URL}/tournaments`);
        const tournaments = await response.json();
        const container = document.getElementById('tournaments-list');
        
        if (tournaments.length > 0) {
            let html = `<table>
                <tr>
                    <th>Name</th>
                    <th>Dates</th>
                    <th>Prize Pool</th>
                    <th>Location</th>
                    <th>Status</th>
                    <th>Actions</th>
                </tr>`;
            
            for (let t of tournaments) {
                // Fetch details to get game name
                const detailsResp = await fetch(`${API_BASE_URL}/tournaments/${t.tournament_id}`);
                const tDetails = await detailsResp.json();
                
                const prizePool = tDetails.prize_pool ? `$${parseFloat(tDetails.prize_pool).toLocaleString()}` : 'N/A';
                html += `<tr>
                    <td>${tDetails.tournament_name}</td>
                    <td>${tDetails.start_date} to ${tDetails.end_date}</td>
                    <td>${prizePool}</td>
                    <td>${tDetails.location || 'Online'}</td>
                    <td>${tDetails.status.toUpperCase()}</td>
                    <td><a href="tournament_details.html?id=${tDetails.tournament_id}">View</a></td>
                </tr>`;
            }
            html += '</table>';
            container.innerHTML = html;
        } else {
            container.innerHTML = '<p>No tournaments found.</p>';
        }
    } catch (error) {
        console.error('Error loading tournaments:', error);
        document.getElementById('tournaments-list').innerHTML = '<p>Error loading tournaments.</p>';
    }
}

async function handleAddTournament(e) {
    e.preventDefault();
    const name = document.getElementById('name').value;
    const game_id = parseInt(document.getElementById('game_id').value);
    const start_date = document.getElementById('start_date').value;
    const end_date = document.getElementById('end_date').value;
    const prize_pool = parseFloat(document.getElementById('prize_pool').value);
    const location = document.getElementById('location').value;
    const status = document.getElementById('status').value;
    
    const payload = { tournament_name: name, game_id, start_date, end_date, prize_pool, location, status };
    const msgDiv = document.getElementById('form-msg');
    
    try {
        const response = await fetch(`${API_BASE_URL}/tournaments`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(payload)
        });
        
        if (response.ok) {
            msgDiv.innerHTML = '<span style="color: green;">Tournament added successfully!</span>';
            document.getElementById('add-tournament-form').reset();
            loadTournamentsList();
        } else {
            const error = await response.json();
            msgDiv.innerHTML = `<span style="color: red;">Error: ${error.detail || 'Failed to add tournament'}</span>`;
        }
    } catch (err) {
        msgDiv.innerHTML = '<span style="color: red;">Failed to connect to server</span>';
    }
}

// Teams Page Functions
async function loadTeamsList() {
    try {
        const response = await fetch(`${API_BASE_URL}/teams`);
        const teams = await response.json();
        const container = document.getElementById('teams-list');
        
        if (teams.length > 0) {
            let html = `<table>
                <tr>
                    <th>Name</th>
                    <th>Game</th>
                    <th>Coach</th>
                    <th>Players</th>
                    <th>Actions</th>
                </tr>`;
            
            teams.forEach(t => {
                html += `<tr>
                    <td>${t.team_name}</td>
                    <td>${t.game_name}</td>
                    <td>${t.coach_name || 'N/A'}</td>
                    <td>${t.player_count} players</td>
                    <td><a href="team_details.html?id=${t.team_id}">View</a></td>
                </tr>`;
            });
            html += '</table>';
            container.innerHTML = html;
        } else {
            container.innerHTML = '<p>No teams found.</p>';
        }
    } catch (error) {
        console.error('Error loading teams:', error);
        document.getElementById('teams-list').innerHTML = '<p>Error loading teams.</p>';
    }
}

async function handleAddTeam(e) {
    e.preventDefault();
    const name = document.getElementById('name').value;
    const game_id = parseInt(document.getElementById('game_id').value);
    const coach = document.getElementById('coach').value;
    
    const payload = { team_name: name, game_id, coach_name: coach };
    const msgDiv = document.getElementById('form-msg');
    
    try {
        const response = await fetch(`${API_BASE_URL}/teams`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(payload)
        });
        
        if (response.ok) {
            msgDiv.innerHTML = '<span style="color: green;">Team added successfully!</span>';
            document.getElementById('add-team-form').reset();
            loadTeamsList();
        } else {
            const error = await response.json();
            msgDiv.innerHTML = `<span style="color: red;">Error: ${error.detail || 'Failed to add team'}</span>`;
        }
    } catch (err) {
        msgDiv.innerHTML = '<span style="color: red;">Failed to connect to server</span>';
    }
}

// Players Page Functions
async function loadPlayersList() {
    try {
        const response = await fetch(`${API_BASE_URL}/players`);
        const players = await response.json();
        const container = document.getElementById('players-list');
        
        if (players.length > 0) {
            let html = `<table>
                <tr>
                    <th>Name</th>
                    <th>In-Game Name</th>
                    <th>Team</th>
                    <th>Game</th>
                    <th>Role</th>
                    <th>Email</th>
                    <th>Actions</th>
                </tr>`;
            
            players.forEach(p => {
                html += `<tr>
                    <td>${p.player_name}</td>
                    <td>${p.in_game_name}</td>
                    <td>${p.team_name}</td>
                    <td>${p.game_name}</td>
                    <td>${p.role || 'N/A'}</td>
                    <td>${p.email || 'N/A'}</td>
                    <td><a href="player_details.html?id=${p.player_id}">View</a></td>
                </tr>`;
            });
            html += '</table>';
            container.innerHTML = html;
        } else {
            container.innerHTML = '<p>No players found.</p>';
        }
    } catch (error) {
        console.error('Error loading players:', error);
        document.getElementById('players-list').innerHTML = '<p>Error loading players.</p>';
    }
}

async function handleAddPlayer(e) {
    e.preventDefault();
    const team_id = parseInt(document.getElementById('team_id').value);
    const player_name = document.getElementById('player_name').value;
    const in_game_name = document.getElementById('in_game_name').value;
    const role = document.getElementById('role').value;
    const email = document.getElementById('email').value;
    const dob = document.getElementById('dob').value || null;
    
    const payload = { team_id, player_name, in_game_name, role, email, date_of_birth: dob };
    const msgDiv = document.getElementById('form-msg');
    
    try {
        const response = await fetch(`${API_BASE_URL}/players`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(payload)
        });
        
        if (response.ok) {
            msgDiv.innerHTML = '<span style="color: green;">Player added successfully!</span>';
            document.getElementById('add-player-form').reset();
            loadPlayersList();
        } else {
            const error = await response.json();
            msgDiv.innerHTML = `<span style="color: red;">Error: ${error.detail || 'Failed to add player'}</span>`;
        }
    } catch (err) {
        msgDiv.innerHTML = '<span style="color: red;">Failed to connect to server</span>';
    }
}

// Matches Page Functions
async function loadMatchesList() {
    try {
        const response = await fetch(`${API_BASE_URL}/matches`);
        const matches = await response.json();
        const container = document.getElementById('matches-list');
        
        if (matches.length > 0) {
            let html = `<table>
                <tr>
                    <th>Tournament</th>
                    <th>Game</th>
                    <th>Match</th>
                    <th>Teams</th>
                    <th>Score</th>
                    <th>Winner</th>
                    <th>Date</th>
                    <th>Actions</th>
                </tr>`;
            
            matches.forEach(m => {
                const date = new Date(m.match_date).toLocaleString();
                const score = (m.team1_score !== null && m.team2_score !== null) ? `${m.team1_score} - ${m.team2_score}` : 'TBD';
                
                html += `<tr>
                    <td>${m.tournament_name}</td>
                    <td>${m.game_name}</td>
                    <td>${m.stage}</td>
                    <td>${m.team1_name} vs ${m.team2_name}</td>
                    <td>${score}</td>
                    <td>${m.winner_name}</td>
                    <td>${date}</td>
                    <td>
                        <a href="match_result_details.html?match_id=${m.match_id}">View Results</a> | 
                        <a href="add_result.html?match_id=${m.match_id}">Add/Edit Result</a>
                    </td>
                </tr>`;
            });
            html += '</table>';
            container.innerHTML = html;
        } else {
            container.innerHTML = '<p>No matches found.</p>';
        }
    } catch (error) {
        console.error('Error loading matches:', error);
        document.getElementById('matches-list').innerHTML = '<p>Error loading matches.</p>';
    }
}

async function handleAddMatch(e) {
    e.preventDefault();
    const tournament_id = parseInt(document.getElementById('tournament_id').value);
    const team1_id = parseInt(document.getElementById('team1_id').value);
    const team2_id = parseInt(document.getElementById('team2_id').value);
    const match_date = document.getElementById('match_date').value;
    const stage = document.getElementById('stage').value;
    
    if (team1_id === team2_id) {
        alert("A team cannot play against itself!");
        return;
    }
    
    const payload = { tournament_id, team1_id, team2_id, match_date, stage };
    const msgDiv = document.getElementById('form-msg');
    
    try {
        const response = await fetch(`${API_BASE_URL}/matches`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(payload)
        });
        
        if (response.ok) {
            msgDiv.innerHTML = '<span style="color: green;">Match scheduled successfully!</span>';
            document.getElementById('add-match-form').reset();
            loadMatchesList();
        } else {
            const error = await response.json();
            msgDiv.innerHTML = `<span style="color: red;">Error: ${error.detail || 'Failed to schedule match'}</span>`;
        }
    } catch (err) {
        msgDiv.innerHTML = '<span style="color: red;">Failed to connect to server</span>';
    }
}

// Sponsors Page Functions
async function loadSponsorsList() {
    try {
        const response = await fetch(`${API_BASE_URL}/sponsors`);
        const sponsors = await response.json();
        const container = document.getElementById('sponsors-list');
        
        if (sponsors.length > 0) {
            let html = `<table>
                <tr>
                    <th>Name</th>
                    <th>Contact Email</th>
                    <th>Sponsorship Amount</th>
                </tr>`;
            
            sponsors.forEach(s => {
                const amount = s.sponsorship_amount ? `$${parseFloat(s.sponsorship_amount).toLocaleString(undefined, {minimumFractionDigits: 2})}` : 'N/A';
                html += `<tr>
                    <td>${s.sponsor_name}</td>
                    <td>${s.contact_email || 'N/A'}</td>
                    <td>${amount}</td>
                </tr>`;
            });
            html += '</table>';
            container.innerHTML = html;
        } else {
            container.innerHTML = '<p>No sponsors found.</p>';
        }
    } catch (error) {
        console.error('Error loading sponsors:', error);
        document.getElementById('sponsors-list').innerHTML = '<p>Error loading sponsors.</p>';
    }
}

async function handleAddSponsor(e) {
    e.preventDefault();
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const amount = parseFloat(document.getElementById('amount').value);
    
    const payload = { sponsor_name: name, contact_email: email, sponsorship_amount: amount };
    const msgDiv = document.getElementById('form-msg');
    
    try {
        const response = await fetch(`${API_BASE_URL}/sponsors`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(payload)
        });
        
        if (response.ok) {
            msgDiv.innerHTML = '<span style="color: green;">Sponsor added successfully!</span>';
            document.getElementById('add-sponsor-form').reset();
            loadSponsorsList();
        } else {
            const error = await response.json();
            msgDiv.innerHTML = `<span style="color: red;">Error: ${error.detail || 'Failed to add sponsor'}</span>`;
        }
    } catch (err) {
        msgDiv.innerHTML = '<span style="color: red;">Failed to connect to server</span>';
    }
}

// Details Page Loaders
async function loadTournamentDetails() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    const container = document.getElementById('details-container');
    
    if (!id) {
        container.innerHTML = '<p style="color: red;">Tournament ID is missing.</p>';
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/tournaments/${id}`);
        if (!response.ok) {
            container.innerHTML = '<p style="color: red;">Tournament not found.</p>';
            return;
        }
        
        const t = await response.json();
        const prizePool = t.prize_pool ? `$${parseFloat(t.prize_pool).toLocaleString()}` : 'N/A';
        
        container.innerHTML = `
            <div class="card">
                <h2>${t.tournament_name}</h2>
                <hr>
                <p><strong>Game:</strong> ${t.game_name}</p>
                <p><strong>Start Date:</strong> ${t.start_date}</p>
                <p><strong>End Date:</strong> ${t.end_date}</p>
                <p><strong>Prize Pool:</strong> ${prizePool}</p>
                <p><strong>Location:</strong> ${t.location || 'Online'}</p>
                <p><strong>Status:</strong> ${t.status.toUpperCase()}</p>
            </div>
        `;
    } catch (err) {
        container.innerHTML = '<p style="color: red;">Error connecting to server</p>';
    }
}

async function loadTeamDetails() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    const container = document.getElementById('details-container');
    
    if (!id) {
        container.innerHTML = '<p style="color: red;">Team ID is missing.</p>';
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/teams/${id}`);
        if (!response.ok) {
            container.innerHTML = '<p style="color: red;">Team not found.</p>';
            return;
        }
        
        const t = await response.json();
        
        let playersHtml = '<p>No players in this team yet.</p>';
        if (t.players && t.players.length > 0) {
            playersHtml = `<table>
                <tr>
                    <th>Player Name</th>
                    <th>In-Game Name</th>
                    <th>Role</th>
                    <th>Email</th>
                    <th>Actions</th>
                </tr>
                ${t.players.map(p => `
                    <tr>
                        <td>${p.player_name}</td>
                        <td>${p.in_game_name}</td>
                        <td>${p.role || 'N/A'}</td>
                        <td>${p.email || 'N/A'}</td>
                        <td><a href="player_details.html?id=${p.player_id}">View Details</a></td>
                    </tr>
                `).join('')}
            </table>`;
        }
        
        container.innerHTML = `
            <div class="card" style="margin-bottom: 20px;">
                <h2>${t.team_name}</h2>
                <hr>
                <p><strong>Game:</strong> ${t.game_name}</p>
                <p><strong>Coach Name:</strong> ${t.coach_name || 'N/A'}</p>
            </div>
            <h3>Roster / Players</h3>
            ${playersHtml}
        `;
    } catch (err) {
        container.innerHTML = '<p style="color: red;">Error connecting to server</p>';
    }
}

async function loadPlayerDetails() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    const container = document.getElementById('details-container');
    
    if (!id) {
        container.innerHTML = '<p style="color: red;">Player ID is missing.</p>';
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/players/${id}`);
        if (!response.ok) {
            container.innerHTML = '<p style="color: red;">Player not found.</p>';
            return;
        }
        
        const p = await response.json();
        
        container.innerHTML = `
            <div class="card">
                <h2>Player: ${p.player_name}</h2>
                <hr>
                <p><strong>In-Game Name:</strong> ${p.in_game_name}</p>
                <p><strong>Team:</strong> ${p.team_name}</p>
                <p><strong>Game:</strong> ${p.game_name}</p>
                <p><strong>Role:</strong> ${p.role || 'N/A'}</p>
                <p><strong>Email:</strong> ${p.email || 'N/A'}</p>
                <p><strong>Date of Birth:</strong> ${p.date_of_birth || 'N/A'}</p>
            </div>
        `;
    } catch (err) {
        container.innerHTML = '<p style="color: red;">Error connecting to server</p>';
    }
}

async function loadMatchResultDetails() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('match_id');
    const container = document.getElementById('details-container');
    
    if (!id) {
        container.innerHTML = '<p style="color: red;">Match ID is missing.</p>';
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/matches/${id}`);
        if (!response.ok) {
            container.innerHTML = '<p style="color: red;">Match details not found.</p>';
            return;
        }
        
        const m = await response.json();
        const score = (m.team1_score !== null && m.team2_score !== null) ? `${m.team1_score} - ${m.team2_score}` : 'TBD';
        const date = new Date(m.match_date).toLocaleString();
        
        container.innerHTML = `
            <div class="card">
                <h2>Match: ${m.team1_name} vs ${m.team2_name}</h2>
                <hr>
                <p><strong>Tournament:</strong> ${m.tournament_name}</p>
                <p><strong>Game:</strong> ${m.game_name}</p>
                <p><strong>Stage:</strong> ${m.stage}</p>
                <p><strong>Date & Time:</strong> ${date}</p>
                <p><strong>Scores:</strong> ${score}</p>
                <p><strong>Winner:</strong> ${m.winner_name}</p>
                <p><strong>Match Duration:</strong> ${m.match_duration || 'N/A'}</p>
            </div>
        `;
    } catch (err) {
        container.innerHTML = '<p style="color: red;">Error connecting to server</p>';
    }
}

// Add/Edit Result Form Loaders and Actions
async function loadMatchInfoForResultForm() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('match_id');
    const summaryCard = document.getElementById('match-summary-card');
    
    if (!id) {
        summaryCard.innerHTML = '<p style="color: red;">Match ID is missing.</p>';
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/matches/${id}`);
        if (!response.ok) {
            summaryCard.innerHTML = '<p style="color: red;">Match not found.</p>';
            return;
        }
        
        const m = await response.json();
        const date = new Date(m.match_date).toLocaleString();
        
        summaryCard.innerHTML = `
            <h3>${m.team1_name} vs ${m.team2_name}</h3>
            <p><strong>Tournament:</strong> ${m.tournament_name} | <strong>Game:</strong> ${m.game_name}</p>
            <p><strong>Stage:</strong> ${m.stage} | <strong>Scheduled:</strong> ${date}</p>
        `;
        
        // Setup Winner select options
        const winnerSelect = document.getElementById('winner_id');
        if (winnerSelect) {
            winnerSelect.innerHTML = `
                <option value="">-- Select Winner / Draw --</option>
                <option value="${m.team1_id}">${m.team1_name}</option>
                <option value="${m.team2_id}">${m.team2_name}</option>
            `;
            
            // Set existing winner if any
            if (m.winner_id) {
                winnerSelect.value = m.winner_id;
            }
        }
        
        // Setup labels
        const lbl1 = document.getElementById('team1_score_label');
        if (lbl1) lbl1.innerText = `${m.team1_name} Score:`;
        
        const lbl2 = document.getElementById('team2_score_label');
        if (lbl2) lbl2.innerText = `${m.team2_name} Score:`;
        
        // Set existing score values if any
        if (m.team1_score !== null) {
            document.getElementById('team1_score').value = m.team1_score;
        }
        if (m.team2_score !== null) {
            document.getElementById('team2_score').value = m.team2_score;
        }
        if (m.match_duration) {
            document.getElementById('duration').value = m.match_duration;
        }
    } catch (err) {
        summaryCard.innerHTML = '<p style="color: red;">Error connecting to server</p>';
    }
}

async function handleAddResult(e) {
    e.preventDefault();
    const params = new URLSearchParams(window.location.search);
    const id = params.get('match_id');
    const winner_id_val = document.getElementById('winner_id').value;
    const winner_id = winner_id_val ? parseInt(winner_id_val) : null;
    const team1_score = parseInt(document.getElementById('team1_score').value);
    const team2_score = parseInt(document.getElementById('team2_score').value);
    const duration = document.getElementById('duration').value;
    
    const payload = { match_id: parseInt(id), winner_id, team1_score, team2_score, match_duration: duration };
    const msgDiv = document.getElementById('form-msg');
    
    try {
        const response = await fetch(`${API_BASE_URL}/matches/${id}/result`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(payload)
        });
        
        if (response.ok) {
            msgDiv.innerHTML = '<span style="color: green;">Match result updated successfully!</span>';
            setTimeout(() => {
                window.location.href = 'matches.html';
            }, 1000);
        } else {
            const error = await response.json();
            msgDiv.innerHTML = `<span style="color: red;">Error: ${error.detail || 'Failed to update result'}</span>`;
        }
    } catch (err) {
        msgDiv.innerHTML = '<span style="color: red;">Failed to connect to server</span>';
    }
}
