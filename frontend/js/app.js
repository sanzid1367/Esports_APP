const API_BASE_URL = 'http://127.0.0.1:8000/api';

// Helper to safely render icons
function renderIcons() {
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

// Authentication helper with secure role-based redirect gates
function checkAuth() {
    const token = localStorage.getItem('admin_token');
    const role = localStorage.getItem('user_role');
    const isLoginPage = window.location.pathname.endsWith('admin.html');
    const isAddResultPage = window.location.pathname.endsWith('add_result.html');
    const isSettingsPage = window.location.pathname.endsWith('settings.html');

    // Redirect to login if not authenticated
    if (!token && !isLoginPage) {
        window.location.href = 'admin.html';
        return;
    }

    // Redirect to dashboard if already authenticated and trying to view login
    if (token && isLoginPage) {
        window.location.href = 'index.html';
        return;
    }

    // Access control: User role cannot access match result scoring form page or settings page
    if (token && role !== 'admin' && (isAddResultPage || isSettingsPage)) {
        window.location.href = 'index.html';
        return;
    }

    const authStatus = document.getElementById('auth-status');
    const adminFormContainer = document.getElementById('admin-form-container');
    const loginAlert = document.getElementById('login-alert');

    if (token) {
        if (authStatus) {
            let roleBadge = '';
            if (role === 'admin') {
                roleBadge = `
                    <span class="inline-flex items-center gap-1.5 rounded-md bg-violet-500/10 px-2 py-1 text-xs font-semibold text-violet-400 ring-1 ring-inset ring-violet-500/20">
                        <i data-lucide="shield-check" class="size-3.5"></i>
                        Admin Active
                    </span>`;
            } else {
                roleBadge = `
                    <span class="inline-flex items-center gap-1.5 rounded-md bg-blue-500/10 px-2 py-1 text-xs font-semibold text-blue-400 ring-1 ring-inset ring-blue-500/20">
                        <i data-lucide="user" class="size-3.5"></i>
                        User Active
                    </span>`;
            }

            authStatus.innerHTML = `
                <div class="flex items-center gap-3 text-sm">
                    ${roleBadge}
                    <a href="#" id="logout-btn" class="text-zinc-400 hover:text-zinc-50 transition-colors font-medium flex items-center gap-1">
                        <i data-lucide="log-out" class="size-4"></i>
                        Logout
                    </a>
                </div>
            `;
            document.getElementById('logout-btn').addEventListener('click', (e) => {
                e.preventDefault();
                logout();
            });
        }

        // Display create/schedule forms only for Admin role (for legacy page compatibility)
        if (adminFormContainer) {
            if (role === 'admin') {
                adminFormContainer.style.display = 'block';
                adminFormContainer.classList.add('transition-all-300');
            } else {
                adminFormContainer.style.display = 'none';
            }
        }

        // Hide the guest login alert box if logged in (in either role)
        if (loginAlert) {
            loginAlert.style.display = 'none';
        }

        // Dynamically inject Settings link for admins in navigation bar
        const navContainer = document.querySelector('nav > div');
        if (navContainer && role === 'admin') {
            if (!document.getElementById('nav-settings-link')) {
                const settingsLink = document.createElement('a');
                settingsLink.id = 'nav-settings-link';
                settingsLink.href = 'settings.html';
                settingsLink.className = isSettingsPage
                    ? 'bg-zinc-800 text-zinc-50 px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5'
                    : 'text-zinc-400 hover:text-zinc-50 px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5';
                settingsLink.innerHTML = `<i data-lucide="settings" class="size-4"></i> Settings`;
                navContainer.appendChild(settingsLink);
            }
        }
    } else {
        if (authStatus) {
            authStatus.innerHTML = `
                <a href="admin.html" class="inline-flex items-center justify-center gap-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-zinc-50 px-3.5 py-1.5 text-xs font-semibold transition-all shadow-md">
                    <i data-lucide="log-in" class="size-3.5"></i>
                    Portal Login
                </a>
            `;
        }
        if (adminFormContainer) {
            adminFormContainer.style.display = 'none';
        }
        if (loginAlert) {
            loginAlert.style.display = 'block';
        }
    }
    renderIcons();
}

function logout() {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('user_role');
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
    const container = document.getElementById('upcoming-tournaments');
    try {
        const response = await fetch(`${API_BASE_URL}/upcoming-tournaments`);
        const data = await response.json();
        
        if (data.length > 0) {
            let html = '<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">';
            data.forEach(t => {
                let prizePool = t.prize_pool ? `$${parseFloat(t.prize_pool).toLocaleString()}` : 'N/A';
                html += `
                <div class="glass-card rounded-xl p-5 flex flex-col justify-between h-full">
                    <div>
                        <h3 class="text-lg font-bold text-zinc-50 mb-3 border-b border-zinc-800 pb-2">${t.tournament_name}</h3>
                        <div class="space-y-2.5 text-sm text-zinc-400">
                            <p class="flex items-center justify-between"><span class="text-zinc-500 flex items-center gap-1.5"><i data-lucide="gamepad-2" class="size-4 text-zinc-500"></i> Game:</span> <span class="text-zinc-200 font-medium">${t.game_name}</span></p>
                            <p class="flex items-center justify-between"><span class="text-zinc-500 flex items-center gap-1.5"><i data-lucide="calendar" class="size-4 text-zinc-500"></i> Dates:</span> <span class="text-zinc-200 text-xs">${t.start_date} to ${t.end_date}</span></p>
                            <p class="flex items-center justify-between"><span class="text-zinc-500 flex items-center gap-1.5"><i data-lucide="dollar-sign" class="size-4 text-zinc-500"></i> Prize Pool:</span> <span class="text-violet-400 font-bold">${prizePool}</span></p>
                            <p class="flex items-center justify-between"><span class="text-zinc-500 flex items-center gap-1.5"><i data-lucide="map-pin" class="size-4 text-zinc-500"></i> Location:</span> <span class="text-zinc-200">${t.location || 'Online'}</span></p>
                        </div>
                    </div>
                </div>
                `;
            });
            html += '</div>';
            container.innerHTML = html;
        } else {
            container.innerHTML = `
                <div class="glass-card rounded-xl p-8 text-center text-zinc-500 italic">
                    No upcoming tournaments scheduled at this time.
                </div>
            `;
        }
    } catch (error) {
        console.error('Error fetching upcoming tournaments:', error);
        container.innerHTML = `
            <div class="glass-card border-rose-500/20 bg-rose-500/5 text-rose-400 rounded-xl p-6 text-center text-sm font-medium">
                Failed to load upcoming tournaments.
            </div>
        `;
    }
    renderIcons();
}

async function fetchRecentMatches() {
    const container = document.getElementById('recent-matches');
    try {
        const response = await fetch(`${API_BASE_URL}/recent-matches`);
        const data = await response.json();
        
        if (data.length > 0) {
            let html = `<div class="custom-table-container mt-4"><table class="custom-table">
                <thead>
                    <tr>
                        <th>Stage</th>
                        <th>Teams</th>
                        <th>Score</th>
                        <th>Winner</th>
                        <th>Date & Time</th>
                        <th>Tournament</th>
                    </tr>
                </thead>
                <tbody>`;
            
            data.forEach(m => {
                const date = new Date(m.match_date).toLocaleString();
                const winnerBadge = m.winner_name ? 
                    `<span class="inline-flex items-center rounded-md bg-emerald-500/10 px-2 py-1 text-xs font-semibold text-emerald-400 ring-1 ring-inset ring-emerald-500/20">${m.winner_name}</span>` : 
                    `<span class="text-zinc-500 font-medium">-</span>`;
                html += `<tr>
                    <td class="font-medium text-zinc-100">${m.stage}</td>
                    <td class="text-zinc-200 font-semibold">${m.team1_name} <span class="text-zinc-500 font-normal">vs</span> ${m.team2_name}</td>
                    <td class="text-zinc-200 font-bold whitespace-nowrap">${m.team1_score} - ${m.team2_score}</td>
                    <td>${winnerBadge}</td>
                    <td class="text-zinc-400">${date}</td>
                    <td class="text-zinc-400 text-xs">${m.game_name} - ${m.tournament_name}</td>
                </tr>`;
            });
            html += '</tbody></table></div>';
            container.innerHTML = html;
        } else {
            container.innerHTML = `
                <div class="glass-card rounded-xl p-8 text-center text-zinc-500 italic">
                    No recent match results available.
                </div>
            `;
        }
    } catch (error) {
        console.error('Error fetching recent matches:', error);
        container.innerHTML = `
            <div class="glass-card border-rose-500/20 bg-rose-500/5 text-rose-400 rounded-xl p-6 text-center text-sm font-medium">
                Failed to load recent matches.
            </div>
        `;
    }
    renderIcons();
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
    const container = document.getElementById('tournaments-list');
    try {
        const response = await fetch(`${API_BASE_URL}/tournaments`);
        const tournaments = await response.json();
        
        if (tournaments.length > 0) {
            let html = `<div class="custom-table-container"><table class="custom-table">
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Dates</th>
                        <th>Prize Pool</th>
                        <th>Location</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>`;
            
            for (let t of tournaments) {
                // Fetch details to get game name
                const detailsResp = await fetch(`${API_BASE_URL}/tournaments/${t.tournament_id}`);
                const tDetails = await detailsResp.json();
                
                const prizePool = tDetails.prize_pool ? `$${parseFloat(tDetails.prize_pool).toLocaleString()}` : 'N/A';
                
                let statusBadge = '';
                const st = tDetails.status.toLowerCase();
                if (st === 'upcoming') {
                    statusBadge = `<span class="inline-flex items-center rounded-md bg-blue-500/10 px-2.5 py-0.5 text-xs font-semibold text-blue-400 ring-1 ring-inset ring-blue-500/20">${tDetails.status.toUpperCase()}</span>`;
                } else if (st === 'ongoing') {
                    statusBadge = `<span class="inline-flex items-center rounded-md bg-amber-500/10 px-2.5 py-0.5 text-xs font-semibold text-amber-400 ring-1 ring-inset ring-amber-500/20">${tDetails.status.toUpperCase()}</span>`;
                } else {
                    statusBadge = `<span class="inline-flex items-center rounded-md bg-zinc-500/10 px-2.5 py-0.5 text-xs font-semibold text-zinc-400 ring-1 ring-inset ring-zinc-500/20">${tDetails.status.toUpperCase()}</span>`;
                }

                html += `<tr>
                    <td class="font-semibold text-zinc-100">${tDetails.tournament_name}</td>
                    <td class="text-zinc-400 text-xs">${tDetails.start_date} to ${tDetails.end_date}</td>
                    <td class="text-violet-400 font-bold">${prizePool}</td>
                    <td class="text-zinc-300">${tDetails.location || 'Online'}</td>
                    <td>${statusBadge}</td>
                    <td>
                        <a href="tournament_details.html?id=${tDetails.tournament_id}" class="text-violet-400 hover:text-violet-300 font-semibold hover:underline flex items-center gap-1 text-xs">
                            View <i data-lucide="chevron-right" class="size-3"></i>
                        </a>
                    </td>
                </tr>`;
            }
            html += '</tbody></table></div>';
            container.innerHTML = html;
        } else {
            container.innerHTML = `
                <div class="glass-card rounded-xl p-8 text-center text-zinc-500 italic">
                    No tournaments registered.
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading tournaments:', error);
        container.innerHTML = `
            <div class="glass-card border-rose-500/20 bg-rose-500/5 text-rose-400 rounded-xl p-6 text-center text-sm font-medium">
                Failed to load tournaments.
            </div>
        `;
    }
    renderIcons();
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
            msgDiv.innerHTML = '<span class="inline-flex items-center rounded-md bg-emerald-500/10 px-3 py-1.5 text-sm font-medium text-emerald-400 ring-1 ring-inset ring-emerald-500/20">Tournament added successfully!</span>';
            document.getElementById('add-tournament-form').reset();
            loadTournamentsList();
        } else {
            const error = await response.json();
            msgDiv.innerHTML = `<span class="inline-flex items-center rounded-md bg-rose-500/10 px-3 py-1.5 text-sm font-medium text-rose-400 ring-1 ring-inset ring-rose-500/20">Error: ${error.detail || 'Failed to add tournament'}</span>`;
        }
    } catch (err) {
        msgDiv.innerHTML = '<span class="inline-flex items-center rounded-md bg-rose-500/10 px-3 py-1.5 text-sm font-medium text-rose-400 ring-1 ring-inset ring-rose-500/20">Failed to connect to server</span>';
    }
}

// Teams Page Functions
async function loadTeamsList() {
    const container = document.getElementById('teams-list');
    try {
        const response = await fetch(`${API_BASE_URL}/teams`);
        const teams = await response.json();
        
        if (teams.length > 0) {
            let html = `<div class="custom-table-container"><table class="custom-table">
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Game Discipline</th>
                        <th>Head Coach</th>
                        <th>Roster Size</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>`;
            
            teams.forEach(t => {
                html += `<tr>
                    <td class="font-semibold text-zinc-100">${t.team_name}</td>
                    <td class="text-zinc-300">${t.game_name}</td>
                    <td class="text-zinc-400">${t.coach_name || 'N/A'}</td>
                    <td><span class="inline-flex items-center rounded bg-zinc-800 px-2 py-0.5 text-xs font-medium text-zinc-300">${t.player_count} players</span></td>
                    <td>
                        <a href="team_details.html?id=${t.team_id}" class="text-violet-400 hover:text-violet-300 font-semibold hover:underline flex items-center gap-1 text-xs">
                            View Details <i data-lucide="chevron-right" class="size-3"></i>
                        </a>
                    </td>
                </tr>`;
            });
            html += '</tbody></table></div>';
            container.innerHTML = html;
        } else {
            container.innerHTML = `
                <div class="glass-card rounded-xl p-8 text-center text-zinc-500 italic">
                    No teams registered.
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading teams:', error);
        container.innerHTML = `
            <div class="glass-card border-rose-500/20 bg-rose-500/5 text-rose-400 rounded-xl p-6 text-center text-sm font-medium">
                Failed to load teams.
            </div>
        `;
    }
    renderIcons();
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
            msgDiv.innerHTML = '<span class="inline-flex items-center rounded-md bg-emerald-500/10 px-3 py-1.5 text-sm font-medium text-emerald-400 ring-1 ring-inset ring-emerald-500/20">Team added successfully!</span>';
            document.getElementById('add-team-form').reset();
            loadTeamsList();
        } else {
            const error = await response.json();
            msgDiv.innerHTML = `<span class="inline-flex items-center rounded-md bg-rose-500/10 px-3 py-1.5 text-sm font-medium text-rose-400 ring-1 ring-inset ring-rose-500/20">Error: ${error.detail || 'Failed to add team'}</span>`;
        }
    } catch (err) {
        msgDiv.innerHTML = '<span class="inline-flex items-center rounded-md bg-rose-500/10 px-3 py-1.5 text-sm font-medium text-rose-400 ring-1 ring-inset ring-rose-500/20">Failed to connect to server</span>';
    }
}

// Players Page Functions
async function loadPlayersList() {
    const container = document.getElementById('players-list');
    try {
        const response = await fetch(`${API_BASE_URL}/players`);
        const players = await response.json();
        
        if (players.length > 0) {
            let html = `<div class="custom-table-container"><table class="custom-table">
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>In-Game Name</th>
                        <th>Team</th>
                        <th>Game</th>
                        <th>Role</th>
                        <th>Email</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>`;
            
            players.forEach(p => {
                html += `<tr>
                    <td class="font-semibold text-zinc-100">${p.player_name}</td>
                    <td class="text-violet-400 font-semibold">${p.in_game_name}</td>
                    <td class="text-zinc-300 font-medium">${p.team_name}</td>
                    <td class="text-zinc-400 text-xs">${p.game_name}</td>
                    <td><span class="inline-flex items-center rounded bg-zinc-800 px-2 py-0.5 text-xs font-semibold text-zinc-300">${p.role || 'N/A'}</span></td>
                    <td class="text-zinc-400 text-xs">${p.email || 'N/A'}</td>
                    <td>
                        <a href="player_details.html?id=${p.player_id}" class="text-violet-400 hover:text-violet-300 font-semibold hover:underline flex items-center gap-1 text-xs">
                            View <i data-lucide="chevron-right" class="size-3"></i>
                        </a>
                    </td>
                </tr>`;
            });
            html += '</tbody></table></div>';
            container.innerHTML = html;
        } else {
            container.innerHTML = `
                <div class="glass-card rounded-xl p-8 text-center text-zinc-500 italic">
                    No players registered.
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading players:', error);
        container.innerHTML = `
            <div class="glass-card border-rose-500/20 bg-rose-500/5 text-rose-400 rounded-xl p-6 text-center text-sm font-medium">
                Failed to load players.
            </div>
        `;
    }
    renderIcons();
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
            msgDiv.innerHTML = '<span class="inline-flex items-center rounded-md bg-emerald-500/10 px-3 py-1.5 text-sm font-medium text-emerald-400 ring-1 ring-inset ring-emerald-500/20">Player added successfully!</span>';
            document.getElementById('add-player-form').reset();
            loadPlayersList();
        } else {
            const error = await response.json();
            msgDiv.innerHTML = `<span class="inline-flex items-center rounded-md bg-rose-500/10 px-3 py-1.5 text-sm font-medium text-rose-400 ring-1 ring-inset ring-rose-500/20">Error: ${error.detail || 'Failed to add player'}</span>`;
        }
    } catch (err) {
        msgDiv.innerHTML = '<span class="inline-flex items-center rounded-md bg-rose-500/10 px-3 py-1.5 text-sm font-medium text-rose-400 ring-1 ring-inset ring-rose-500/20">Failed to connect to server</span>';
    }
}

// Matches Page Functions
async function loadMatchesList() {
    const container = document.getElementById('matches-list');
    const role = localStorage.getItem('user_role');
    
    try {
        const response = await fetch(`${API_BASE_URL}/matches`);
        const matches = await response.json();
        
        if (matches.length > 0) {
            let html = `<div class="custom-table-container"><table class="custom-table">
                <thead>
                    <tr>
                        <th>Tournament</th>
                        <th>Game</th>
                        <th>Stage</th>
                        <th>Teams</th>
                        <th>Score</th>
                        <th>Winner</th>
                        <th>Date Scheduled</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>`;
            
            matches.forEach(m => {
                const date = new Date(m.match_date).toLocaleString();
                const score = (m.team1_score !== null && m.team2_score !== null) ? 
                    `<span class="bg-zinc-800 text-zinc-150 px-2.5 py-0.5 rounded text-xs font-bold border border-zinc-700/50 whitespace-nowrap">${m.team1_score} - ${m.team2_score}</span>` : 
                    `<span class="text-zinc-500 text-xs italic font-medium">TBD</span>`;
                const winner = m.winner_name ? 
                    `<span class="inline-flex items-center rounded bg-emerald-500/10 px-2 py-0.5 text-xs font-semibold text-emerald-400 ring-1 ring-inset ring-emerald-500/20">${m.winner_name}</span>` : 
                    `<span class="text-zinc-500 text-xs">-</span>`;
                
                // Show Log Result action link only for Admins
                let actionsHtml = `
                    <a href="match_result_details.html?match_id=${m.match_id}" class="text-violet-400 hover:text-violet-300 font-semibold hover:underline text-xs flex items-center gap-0.5">
                        View
                    </a>`;
                
                if (role === 'admin') {
                    actionsHtml += `
                        <span class="text-zinc-700">|</span> 
                        <a href="add_result.html?match_id=${m.match_id}" class="text-violet-400 hover:text-violet-300 font-semibold hover:underline text-xs flex items-center gap-0.5">
                            Log Result
                        </a>`;
                }

                html += `<tr>
                    <td class="font-semibold text-zinc-150 text-xs">${m.tournament_name}</td>
                    <td class="text-zinc-300 text-xs">${m.game_name}</td>
                    <td class="text-zinc-400 font-medium text-xs">${m.stage}</td>
                    <td class="text-zinc-200 font-semibold">${m.team1_name} <span class="text-zinc-500 font-normal">vs</span> ${m.team2_name}</td>
                    <td>${score}</td>
                    <td>${winner}</td>
                    <td class="text-zinc-400 text-xs">${date}</td>
                    <td>
                        <div class="flex items-center gap-2">
                            ${actionsHtml}
                        </div>
                    </td>
                </tr>`;
            });
            html += '</tbody></table></div>';
            container.innerHTML = html;
        } else {
            container.innerHTML = `
                <div class="glass-card rounded-xl p-8 text-center text-zinc-500 italic">
                    No matches scheduled.
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading matches:', error);
        container.innerHTML = `
            <div class="glass-card border-rose-500/20 bg-rose-500/5 text-rose-400 rounded-xl p-6 text-center text-sm font-medium">
                Failed to load matches.
            </div>
        `;
    }
    renderIcons();
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
            msgDiv.innerHTML = '<span class="inline-flex items-center rounded-md bg-emerald-500/10 px-3 py-1.5 text-sm font-medium text-emerald-400 ring-1 ring-inset ring-emerald-500/20">Match scheduled successfully!</span>';
            document.getElementById('add-match-form').reset();
            loadMatchesList();
        } else {
            const error = await response.json();
            msgDiv.innerHTML = `<span class="inline-flex items-center rounded-md bg-rose-500/10 px-3 py-1.5 text-sm font-medium text-rose-400 ring-1 ring-inset ring-rose-500/20">Error: ${error.detail || 'Failed to schedule match'}</span>`;
        }
    } catch (err) {
        msgDiv.innerHTML = '<span class="inline-flex items-center rounded-md bg-rose-500/10 px-3 py-1.5 text-sm font-medium text-rose-400 ring-1 ring-inset ring-rose-500/20">Failed to connect to server</span>';
    }
}

// Sponsors Page Functions
async function loadSponsorsList() {
    const container = document.getElementById('sponsors-list');
    try {
        const response = await fetch(`${API_BASE_URL}/sponsors`);
        const sponsors = await response.json();
        
        if (sponsors.length > 0) {
            let html = `<div class="custom-table-container"><table class="custom-table">
                <thead>
                    <tr>
                        <th>Sponsor Name</th>
                        <th>Contact Email</th>
                        <th>Sponsorship Funding</th>
                    </tr>
                </thead>
                <tbody>`;
            
            sponsors.forEach(s => {
                const amount = s.sponsorship_amount ? `$${parseFloat(s.sponsorship_amount).toLocaleString(undefined, {minimumFractionDigits: 2})}` : 'N/A';
                html += `<tr>
                    <td class="font-semibold text-zinc-100">${s.sponsor_name}</td>
                    <td class="text-zinc-400 text-xs">${s.contact_email || 'N/A'}</td>
                    <td class="text-emerald-400 font-bold">${amount}</td>
                </tr>`;
            });
            html += '</tbody></table></div>';
            container.innerHTML = html;
        } else {
            container.innerHTML = `
                <div class="glass-card rounded-xl p-8 text-center text-zinc-500 italic">
                    No sponsors registered.
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading sponsors:', error);
        container.innerHTML = `
            <div class="glass-card border-rose-500/20 bg-rose-500/5 text-rose-400 rounded-xl p-6 text-center text-sm font-medium">
                Failed to load sponsors.
            </div>
        `;
    }
    renderIcons();
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
            msgDiv.innerHTML = '<span class="inline-flex items-center rounded-md bg-emerald-500/10 px-3 py-1.5 text-sm font-medium text-emerald-400 ring-1 ring-inset ring-emerald-500/20">Sponsor added successfully!</span>';
            document.getElementById('add-sponsor-form').reset();
            loadSponsorsList();
        } else {
            const error = await response.json();
            msgDiv.innerHTML = `<span class="inline-flex items-center rounded-md bg-rose-500/10 px-3 py-1.5 text-sm font-medium text-rose-400 ring-1 ring-inset ring-rose-500/20">Error: ${error.detail || 'Failed to add sponsor'}</span>`;
        }
    } catch (err) {
        msgDiv.innerHTML = '<span class="inline-flex items-center rounded-md bg-rose-500/10 px-3 py-1.5 text-sm font-medium text-rose-400 ring-1 ring-inset ring-rose-500/20">Failed to connect to server</span>';
    }
}

// Details Page Loaders
async function loadTournamentDetails() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    const container = document.getElementById('details-container');
    
    if (!id) {
        container.innerHTML = '<p class="text-rose-400 text-center font-semibold">Tournament ID is missing.</p>';
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/tournaments/${id}`);
        if (!response.ok) {
            container.innerHTML = '<p class="text-rose-400 text-center font-semibold">Tournament not found.</p>';
            return;
        }
        
        const t = await response.json();
        const prizePool = t.prize_pool ? `$${parseFloat(t.prize_pool).toLocaleString()}` : 'N/A';
        
        let statusBadge = '';
        const st = t.status.toLowerCase();
        if (st === 'upcoming') {
            statusBadge = `<span class="inline-flex items-center rounded-md bg-blue-500/10 px-2.5 py-1 text-xs font-semibold text-blue-400 ring-1 ring-inset ring-blue-500/20">${t.status.toUpperCase()}</span>`;
        } else if (st === 'ongoing') {
            statusBadge = `<span class="inline-flex items-center rounded-md bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-400 ring-1 ring-inset ring-amber-500/20">${t.status.toUpperCase()}</span>`;
        } else {
            statusBadge = `<span class="inline-flex items-center rounded-md bg-zinc-500/10 px-2.5 py-1 text-xs font-semibold text-zinc-400 ring-1 ring-inset ring-zinc-500/20">${t.status.toUpperCase()}</span>`;
        }

        container.innerHTML = `
            <div class="glass-card rounded-xl p-6 md:p-8">
                <div class="flex justify-between items-center border-b border-zinc-800 pb-4 mb-6">
                    <h2 class="text-2xl font-bold text-zinc-50">${t.tournament_name}</h2>
                    ${statusBadge}
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-zinc-300">
                    <div class="space-y-4">
                        <p class="flex justify-between border-b border-zinc-800/50 pb-2"><span class="text-zinc-500 flex items-center gap-1.5"><i data-lucide="gamepad-2" class="size-4"></i> Game:</span> <span class="font-semibold text-zinc-200">${t.game_name}</span></p>
                        <p class="flex justify-between border-b border-zinc-800/50 pb-2"><span class="text-zinc-500 flex items-center gap-1.5"><i data-lucide="calendar" class="size-4"></i> Start Date:</span> <span class="text-zinc-200">${t.start_date}</span></p>
                        <p class="flex justify-between border-b border-zinc-800/50 pb-2"><span class="text-zinc-500 flex items-center gap-1.5"><i data-lucide="calendar" class="size-4"></i> End Date:</span> <span class="text-zinc-200">${t.end_date}</span></p>
                    </div>
                    <div class="space-y-4">
                        <p class="flex justify-between border-b border-zinc-800/50 pb-2"><span class="text-zinc-500 flex items-center gap-1.5"><i data-lucide="dollar-sign" class="size-4"></i> Prize Pool:</span> <span class="text-violet-400 font-bold">${prizePool}</span></p>
                        <p class="flex justify-between border-b border-zinc-800/50 pb-2"><span class="text-zinc-500 flex items-center gap-1.5"><i data-lucide="map-pin" class="size-4"></i> Location:</span> <span class="text-zinc-200">${t.location || 'Online'}</span></p>
                    </div>
                </div>
            </div>
        `;
    } catch (err) {
        container.innerHTML = '<p class="text-rose-400 text-center font-semibold">Error connecting to server</p>';
    }
    renderIcons();
}

async function loadTeamDetails() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    const container = document.getElementById('details-container');
    
    if (!id) {
        container.innerHTML = '<p class="text-rose-400 text-center font-semibold">Team ID is missing.</p>';
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/teams/${id}`);
        if (!response.ok) {
            container.innerHTML = '<p class="text-rose-400 text-center font-semibold">Team not found.</p>';
            return;
        }
        
        const t = await response.json();
        
        let playersHtml = '<p class="text-zinc-500 italic">No players in this team yet.</p>';
        if (t.players && t.players.length > 0) {
            playersHtml = `<div class="custom-table-container"><table class="custom-table">
                <thead>
                    <tr>
                        <th>Player Name</th>
                        <th>In-Game Name</th>
                        <th>Role</th>
                        <th>Email Address</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                ${t.players.map(p => `
                    <tr>
                        <td class="font-semibold text-zinc-100">${p.player_name}</td>
                        <td class="text-violet-400 font-semibold">${p.in_game_name}</td>
                        <td><span class="inline-flex items-center rounded bg-zinc-800 px-2 py-0.5 text-xs font-medium text-zinc-300">${p.role || 'N/A'}</span></td>
                        <td class="text-zinc-400 text-xs">${p.email || 'N/A'}</td>
                        <td>
                            <a href="player_details.html?id=${p.player_id}" class="text-violet-400 hover:text-violet-300 font-semibold hover:underline text-xs flex items-center gap-0.5">
                                View Profile <i data-lucide="chevron-right" class="size-3"></i>
                            </a>
                        </td>
                    </tr>
                `).join('')}
                </tbody>
            </table></div>`;
        }
        
        container.innerHTML = `
            <div class="glass-card rounded-xl p-6 md:p-8 mb-8">
                <h2 class="text-2xl font-bold text-zinc-50 border-b border-zinc-800 pb-4 mb-4">${t.team_name}</h2>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-zinc-300">
                    <p class="flex justify-between border-b border-zinc-850 pb-2 md:pb-0"><span class="text-zinc-500 flex items-center gap-1.5"><i data-lucide="gamepad-2" class="size-4"></i> Game Representing:</span> <span class="font-semibold text-zinc-200">${t.game_name}</span></p>
                    <p class="flex justify-between"><span class="text-zinc-500 flex items-center gap-1.5"><i data-lucide="award" class="size-4"></i> Head Coach:</span> <span class="text-zinc-200 font-semibold">${t.coach_name || 'N/A'}</span></p>
                </div>
            </div>
            <h3 class="text-xl font-bold text-zinc-50 mb-4 flex items-center gap-2">
                <i data-lucide="users" class="text-violet-500 size-5"></i>
                Active Roster
            </h3>
            ${playersHtml}
        `;
    } catch (err) {
        container.innerHTML = '<p class="text-rose-400 text-center font-semibold">Error connecting to server</p>';
    }
    renderIcons();
}

async function loadPlayerDetails() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    const container = document.getElementById('details-container');
    
    if (!id) {
        container.innerHTML = '<p class="text-rose-400 text-center font-semibold">Player ID is missing.</p>';
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/players/${id}`);
        if (!response.ok) {
            container.innerHTML = '<p class="text-rose-400 text-center font-semibold">Player not found.</p>';
            return;
        }
        
        const p = await response.json();
        
        container.innerHTML = `
            <div class="glass-card rounded-xl p-6 md:p-8 max-w-2xl mx-auto">
                <div class="flex items-center gap-4 border-b border-zinc-800 pb-6 mb-6">
                    <div class="size-14 rounded-full bg-violet-600/10 border border-violet-500/20 flex items-center justify-center text-violet-400 text-2xl font-bold">
                        ${p.player_name.charAt(0)}
                    </div>
                    <div>
                        <h2 class="text-2xl font-bold text-zinc-50">${p.player_name}</h2>
                        <p class="text-violet-400 font-semibold">${p.in_game_name}</p>
                    </div>
                </div>
                <div class="space-y-4 text-sm text-zinc-300">
                    <p class="flex justify-between border-b border-zinc-800/50 pb-2"><span class="text-zinc-500 flex items-center gap-1.5"><i data-lucide="shield" class="size-4"></i> Current Team:</span> <span class="font-semibold text-zinc-200">${p.team_name}</span></p>
                    <p class="flex justify-between border-b border-zinc-800/50 pb-2"><span class="text-zinc-500 flex items-center gap-1.5"><i data-lucide="gamepad-2" class="size-4"></i> Game discipline:</span> <span class="text-zinc-200">${p.game_name}</span></p>
                    <p class="flex justify-between border-b border-zinc-800/50 pb-2"><span class="text-zinc-500 flex items-center gap-1.5"><i data-lucide="star" class="size-4"></i> Roster Role:</span> <span class="inline-flex items-center rounded bg-zinc-800 px-2 py-0.5 text-xs font-semibold text-zinc-300">${p.role || 'N/A'}</span></p>
                    <p class="flex justify-between border-b border-zinc-800/50 pb-2"><span class="text-zinc-500 flex items-center gap-1.5"><i data-lucide="mail" class="size-4"></i> Email Address:</span> <span class="text-zinc-200 text-xs">${p.email || 'N/A'}</span></p>
                    <p class="flex justify-between"><span class="text-zinc-500 flex items-center gap-1.5"><i data-lucide="calendar" class="size-4"></i> Date of Birth:</span> <span class="text-zinc-200">${p.date_of_birth || 'N/A'}</span></p>
                </div>
            </div>
        `;
    } catch (err) {
        container.innerHTML = '<p class="text-rose-400 text-center font-semibold">Error connecting to server</p>';
    }
    renderIcons();
}

async function loadMatchResultDetails() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('match_id');
    const container = document.getElementById('details-container');
    
    if (!id) {
        container.innerHTML = '<p class="text-rose-400 text-center font-semibold">Match ID is missing.</p>';
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/matches/${id}`);
        if (!response.ok) {
            container.innerHTML = '<p class="text-rose-400 text-center font-semibold">Match details not found.</p>';
            return;
        }
        
        const m = await response.json();
        const score = (m.team1_score !== null && m.team2_score !== null) ? `${m.team1_score} - ${m.team2_score}` : 'TBD';
        const date = new Date(m.match_date).toLocaleString();
        
        container.innerHTML = `
            <div class="glass-card rounded-xl p-6 md:p-8 max-w-3xl mx-auto">
                <div class="text-center mb-6">
                    <span class="inline-flex items-center rounded-md bg-zinc-800 px-3 py-1 text-xs font-semibold text-zinc-300 border border-zinc-700/50 uppercase tracking-wider">${m.stage}</span>
                    <p class="text-zinc-500 text-xs mt-2 font-medium">${date}</p>
                </div>
                
                <div class="flex items-center justify-between gap-4 py-8 px-4 border-y border-zinc-850 mb-6">
                    <div class="flex-1 text-right">
                        <h3 class="text-lg md:text-xl font-bold text-zinc-50">${m.team1_name}</h3>
                    </div>
                    <div class="flex items-center gap-3 bg-zinc-800/50 px-5 py-2.5 rounded-lg border border-zinc-700/50 text-xl md:text-2xl font-bold text-zinc-100 shadow-inner">
                        <span>${m.team1_score !== null ? m.team1_score : '-'}</span>
                        <span class="text-zinc-600">:</span>
                        <span>${m.team2_score !== null ? m.team2_score : '-'}</span>
                    </div>
                    <div class="flex-1 text-left">
                        <h3 class="text-lg md:text-xl font-bold text-zinc-50">${m.team2_name}</h3>
                    </div>
                </div>
                
                <div class="space-y-4 text-sm text-zinc-300">
                    <p class="flex justify-between border-b border-zinc-800/50 pb-2"><span class="text-zinc-500 flex items-center gap-1.5"><i data-lucide="award" class="size-4"></i> Tournament Scope:</span> <span class="font-semibold text-zinc-200">${m.tournament_name} (${m.game_name})</span></p>
                    <p class="flex justify-between border-b border-zinc-800/50 pb-2"><span class="text-zinc-500 flex items-center gap-1.5"><i data-lucide="crown" class="size-4"></i> Match Winner:</span> <span class="inline-flex items-center rounded bg-emerald-500/10 px-2 py-0.5 text-xs font-semibold text-emerald-400 ring-1 ring-inset ring-emerald-500/20">${m.winner_name || 'TBD'}</span></p>
                    <p class="flex justify-between"><span class="text-zinc-500 flex items-center gap-1.5"><i data-lucide="clock" class="size-4"></i> Match Duration:</span> <span class="text-zinc-200 font-medium">${m.match_duration || 'N/A'}</span></p>
                </div>
            </div>
        `;
    } catch (err) {
        container.innerHTML = '<p class="text-rose-400 text-center font-semibold">Error connecting to server</p>';
    }
    renderIcons();
}

// Add/Edit Result Form Loaders and Actions
async function loadMatchInfoForResultForm() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('match_id');
    const summaryCard = document.getElementById('match-summary-card');
    
    if (!id) {
        summaryCard.innerHTML = '<p class="text-rose-400 text-center font-semibold">Match ID is missing.</p>';
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/matches/${id}`);
        if (!response.ok) {
            summaryCard.innerHTML = '<p class="text-rose-400 text-center font-semibold">Match not found.</p>';
            return;
        }
        
        const m = await response.json();
        const date = new Date(m.match_date).toLocaleString();
        
        summaryCard.innerHTML = `
            <div class="flex items-center justify-between border-b border-zinc-800 pb-3 mb-3">
                <h3 class="font-bold text-zinc-150">${m.team1_name} <span class="text-zinc-500">vs</span> ${m.team2_name}</h3>
                <span class="inline-flex items-center rounded bg-zinc-800 px-2 py-0.5 text-xs font-semibold text-zinc-400 border border-zinc-700/50">${m.stage}</span>
            </div>
            <div class="text-xs text-zinc-400 space-y-2">
                <p class="flex items-center gap-1.5"><i data-lucide="award" class="size-4 text-zinc-500"></i> <strong>Tournament:</strong> ${m.tournament_name} | <strong>Game:</strong> ${m.game_name}</p>
                <p class="flex items-center gap-1.5"><i data-lucide="clock" class="size-4 text-zinc-500"></i> <strong>Scheduled Time:</strong> ${date}</p>
            </div>
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
        summaryCard.innerHTML = '<p class="text-rose-400 text-center font-semibold">Error connecting to server</p>';
    }
    renderIcons();
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
            msgDiv.innerHTML = '<span class="inline-flex items-center rounded-md bg-emerald-500/10 px-3 py-1.5 text-sm font-medium text-emerald-400 ring-1 ring-inset ring-emerald-500/20">Match result updated successfully!</span>';
            setTimeout(() => {
                window.location.href = 'matches.html';
            }, 1000);
        } else {
            const error = await response.json();
            msgDiv.innerHTML = `<span class="inline-flex items-center rounded-md bg-rose-500/10 px-3 py-1.5 text-sm font-medium text-rose-400 ring-1 ring-inset ring-rose-500/20">Error: ${error.detail || 'Failed to update result'}</span>`;
        }
    } catch (err) {
        msgDiv.innerHTML = '<span class="inline-flex items-center rounded-md bg-rose-500/10 px-3 py-1.5 text-sm font-medium text-rose-400 ring-1 ring-inset ring-rose-500/20">Failed to connect to server</span>';
    }
}
