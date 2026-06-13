from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func
import models, schemas, auth, database
from fastapi.security import OAuth2PasswordRequestForm
from datetime import timedelta

router = APIRouter()

@router.post("/token", response_model=schemas.Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: AsyncSession = Depends(database.get_db)):
    query = select(models.AdminUser).where(models.AdminUser.username == form_data.username)
    result = await db.execute(query)
    user = result.scalars().first()
    if not user or not auth.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/admin/setup")
async def setup_admin(db: AsyncSession = Depends(database.get_db)):
    query = select(models.AdminUser).where(models.AdminUser.username == 'admin')
    result = await db.execute(query)
    user = result.scalars().first()
    if user:
        return {"msg": "Admin already exists"}
    
    hashed_password = auth.get_password_hash("admin123")
    new_admin = models.AdminUser(username="admin", hashed_password=hashed_password)
    db.add(new_admin)
    await db.commit()
    return {"msg": "Admin created with username 'admin' and password 'admin123'"}

@router.get("/dashboard-stats", response_model=schemas.DashboardStats)
async def get_dashboard_stats(db: AsyncSession = Depends(database.get_db)):
    games_count = await db.scalar(select(func.count()).select_from(models.Game))
    tournaments_count = await db.scalar(select(func.count()).select_from(models.Tournament))
    teams_count = await db.scalar(select(func.count()).select_from(models.Team))
    players_count = await db.scalar(select(func.count()).select_from(models.Player))
    
    return {
        "games_count": games_count or 0,
        "tournaments_count": tournaments_count or 0,
        "teams_count": teams_count or 0,
        "players_count": players_count or 0
    }

@router.get("/upcoming-tournaments", response_model=list[schemas.UpcomingTournament])
async def get_upcoming_tournaments(db: AsyncSession = Depends(database.get_db)):
    query = (
        select(models.Tournament, models.Game)
        .join(models.Game, models.Tournament.game_id == models.Game.game_id)
        .where(models.Tournament.status == 'upcoming')
        .order_by(models.Tournament.start_date)
        .limit(3)
    )
    result = await db.execute(query)
    
    tournaments = []
    for t, g in result.all():
        tournaments.append({
            "tournament_name": t.tournament_name,
            "game_name": g.game_name,
            "start_date": t.start_date,
            "end_date": t.end_date,
            "prize_pool": float(t.prize_pool) if t.prize_pool else None,
            "location": t.location
        })
    return tournaments

@router.get("/recent-matches", response_model=list[schemas.RecentMatchResult])
async def get_recent_matches(db: AsyncSession = Depends(database.get_db)):
    query = (
        select(models.Match, models.MatchResult, models.Team.team_name.label("team1_name"), 
               models.Team.team_name.label("team2_name"), models.Team.team_name.label("winner_name"),
               models.Game.game_name, models.Tournament.tournament_name)
        .join(models.MatchResult, models.Match.match_id == models.MatchResult.match_id)
        .join(models.Team, models.Match.team1_id == models.Team.team_id)
        .join(models.Team, models.Match.team2_id == models.Team.team_id)
        .join(models.Team, models.MatchResult.winner_id == models.Team.team_id)
        .join(models.Tournament, models.Match.tournament_id == models.Tournament.tournament_id)
        .join(models.Game, models.Tournament.game_id == models.Game.game_id)
        .order_by(models.Match.match_date.desc())
        .limit(5)
    )
    # The SQLAlchemy core query with joins requires care. Let's use a simpler ORM approach.
    query = (
        select(models.MatchResult)
        .join(models.Match)
        .order_by(models.Match.match_date.desc())
        .limit(5)
    )
    result = await db.execute(query)
    results = result.scalars().all()
    
    output = []
    for r in results:
        # For simplicity, we can fetch related data lazy loading won't work async, so we must join or query
        match_info = await db.get(models.Match, r.match_id)
        team1 = await db.get(models.Team, match_info.team1_id) if match_info else None
        team2 = await db.get(models.Team, match_info.team2_id) if match_info else None
        winner = await db.get(models.Team, r.winner_id) if r.winner_id else None
        tournament = await db.get(models.Tournament, match_info.tournament_id) if match_info else None
        game = await db.get(models.Game, tournament.game_id) if tournament else None
        
        output.append({
            "match_id": match_info.match_id if match_info else r.match_id,
            "stage": match_info.stage if match_info else "Unknown",
            "team1_name": team1.team_name if team1 else "Unknown",
            "team2_name": team2.team_name if team2 else "Unknown",
            "team1_score": r.team1_score,
            "team2_score": r.team2_score,
            "winner_name": winner.team_name if winner else ("Draw" if r.winner_id is None else "Unknown"),
            "match_date": match_info.match_date if match_info else r.created_at,
            "game_name": game.game_name if game else "Unknown",
            "tournament_name": tournament.tournament_name if tournament else "Unknown"
        })
    return output

@router.get("/games", response_model=list[schemas.GameOut])
async def get_games(db: AsyncSession = Depends(database.get_db)):
    result = await db.execute(select(models.Game))
    return result.scalars().all()

@router.get("/tournaments", response_model=list[schemas.TournamentOut])
async def get_tournaments(db: AsyncSession = Depends(database.get_db)):
    result = await db.execute(select(models.Tournament))
    return result.scalars().all()

@router.post("/tournaments", response_model=schemas.TournamentOut)
async def create_tournament(t: schemas.TournamentBase, current_admin: models.AdminUser = Depends(auth.get_current_admin), db: AsyncSession = Depends(database.get_db)):
    new_t = models.Tournament(**t.dict())
    db.add(new_t)
    await db.commit()
    await db.refresh(new_t)
    return new_t

@router.get("/tournaments/{id}")
async def get_tournament(id: int, db: AsyncSession = Depends(database.get_db)):
    t = await db.get(models.Tournament, id)
    if not t:
        raise HTTPException(status_code=404, detail="Tournament not found")
    game = await db.get(models.Game, t.game_id)
    return {
        "tournament_id": t.tournament_id,
        "tournament_name": t.tournament_name,
        "game_id": t.game_id,
        "game_name": game.game_name if game else "Unknown",
        "start_date": t.start_date,
        "end_date": t.end_date,
        "prize_pool": float(t.prize_pool) if t.prize_pool else None,
        "location": t.location,
        "status": t.status,
    }

@router.get("/teams", response_model=list[schemas.TeamDetailOut])
async def get_teams(db: AsyncSession = Depends(database.get_db)):
    result = await db.execute(select(models.Team))
    teams = result.scalars().all()
    output = []
    for t in teams:
        game = await db.get(models.Game, t.game_id)
        player_count = await db.scalar(select(func.count()).select_from(models.Player).where(models.Player.team_id == t.team_id))
        output.append({
            "team_id": t.team_id,
            "team_name": t.team_name,
            "game_id": t.game_id,
            "game_name": game.game_name if game else "Unknown",
            "coach_name": t.coach_name,
            "player_count": player_count or 0
        })
    return output

@router.post("/teams", response_model=schemas.TeamOut)
async def create_team(t: schemas.TeamBase, current_admin: models.AdminUser = Depends(auth.get_current_admin), db: AsyncSession = Depends(database.get_db)):
    new_team = models.Team(**t.dict())
    db.add(new_team)
    await db.commit()
    await db.refresh(new_team)
    return new_team

@router.get("/teams/{id}")
async def get_team(id: int, db: AsyncSession = Depends(database.get_db)):
    t = await db.get(models.Team, id)
    if not t:
        raise HTTPException(status_code=404, detail="Team not found")
    game = await db.get(models.Game, t.game_id)
    players_res = await db.execute(select(models.Player).where(models.Player.team_id == id))
    players = players_res.scalars().all()
    return {
        "team_id": t.team_id,
        "team_name": t.team_name,
        "game_id": t.game_id,
        "game_name": game.game_name if game else "Unknown",
        "coach_name": t.coach_name,
        "players": [{
            "player_id": p.player_id,
            "player_name": p.player_name,
            "in_game_name": p.in_game_name,
            "role": p.role,
            "email": p.email
        } for p in players]
    }

@router.get("/players", response_model=list[schemas.PlayerDetailOut])
async def get_players(db: AsyncSession = Depends(database.get_db)):
    result = await db.execute(select(models.Player))
    players = result.scalars().all()
    output = []
    for p in players:
        team = await db.get(models.Team, p.team_id) if p.team_id else None
        game = await db.get(models.Game, team.game_id) if team else None
        output.append({
            "player_id": p.player_id,
            "team_id": p.team_id,
            "team_name": team.team_name if team else "No Team",
            "game_name": game.game_name if game else "Unknown",
            "player_name": p.player_name,
            "in_game_name": p.in_game_name,
            "role": p.role,
            "email": p.email,
            "date_of_birth": p.date_of_birth
        })
    return output

@router.post("/players", response_model=schemas.PlayerOut)
async def create_player(p: schemas.PlayerBase, current_admin: models.AdminUser = Depends(auth.get_current_admin), db: AsyncSession = Depends(database.get_db)):
    new_player = models.Player(**p.dict())
    db.add(new_player)
    await db.commit()
    await db.refresh(new_player)
    return new_player

@router.get("/players/{id}")
async def get_player(id: int, db: AsyncSession = Depends(database.get_db)):
    p = await db.get(models.Player, id)
    if not p:
        raise HTTPException(status_code=404, detail="Player not found")
    team = await db.get(models.Team, p.team_id) if p.team_id else None
    game = await db.get(models.Game, team.game_id) if team else None
    return {
        "player_id": p.player_id,
        "team_id": p.team_id,
        "team_name": team.team_name if team else "No Team",
        "game_name": game.game_name if game else "Unknown",
        "player_name": p.player_name,
        "in_game_name": p.in_game_name,
        "role": p.role,
        "email": p.email,
        "date_of_birth": p.date_of_birth
    }

@router.get("/sponsors", response_model=list[schemas.SponsorOut])
async def get_sponsors(db: AsyncSession = Depends(database.get_db)):
    result = await db.execute(select(models.Sponsor))
    return result.scalars().all()

@router.post("/sponsors", response_model=schemas.SponsorOut)
async def create_sponsor(s: schemas.SponsorBase, current_admin: models.AdminUser = Depends(auth.get_current_admin), db: AsyncSession = Depends(database.get_db)):
    new_sponsor = models.Sponsor(**s.dict())
    db.add(new_sponsor)
    await db.commit()
    await db.refresh(new_sponsor)
    return new_sponsor

@router.get("/sponsors/{id}", response_model=schemas.SponsorOut)
async def get_sponsor(id: int, db: AsyncSession = Depends(database.get_db)):
    s = await db.get(models.Sponsor, id)
    if not s:
        raise HTTPException(status_code=404, detail="Sponsor not found")
    return s

@router.get("/matches")
async def get_matches(db: AsyncSession = Depends(database.get_db)):
    result = await db.execute(select(models.Match).order_by(models.Match.match_date.desc()))
    matches = result.scalars().all()
    output = []
    for m in matches:
        t1 = await db.get(models.Team, m.team1_id)
        t2 = await db.get(models.Team, m.team2_id)
        tournament = await db.get(models.Tournament, m.tournament_id)
        game = await db.get(models.Game, tournament.game_id) if tournament else None
        
        # Get result
        res_query = await db.execute(select(models.MatchResult).where(models.MatchResult.match_id == m.match_id))
        r = res_query.scalars().first()
        
        winner_name = "TBD"
        if r:
            winner = await db.get(models.Team, r.winner_id) if r.winner_id else None
            winner_name = winner.team_name if winner else ("Draw" if r.winner_id is None else "Unknown")
            
        output.append({
            "match_id": m.match_id,
            "tournament_id": m.tournament_id,
            "tournament_name": tournament.tournament_name if tournament else "Unknown",
            "game_name": game.game_name if game else "Unknown",
            "team1_id": m.team1_id,
            "team1_name": t1.team_name if t1 else "Unknown",
            "team2_id": m.team2_id,
            "team2_name": t2.team_name if t2 else "Unknown",
            "match_date": m.match_date,
            "stage": m.stage,
            "team1_score": r.team1_score if r else None,
            "team2_score": r.team2_score if r else None,
            "winner_id": r.winner_id if r else None,
            "winner_name": winner_name
        })
    return output

@router.post("/matches", response_model=schemas.MatchOut)
async def create_match(m: schemas.MatchBase, current_admin: models.AdminUser = Depends(auth.get_current_admin), db: AsyncSession = Depends(database.get_db)):
    new_match = models.Match(**m.dict())
    db.add(new_match)
    await db.commit()
    await db.refresh(new_match)
    return new_match

@router.get("/matches/{id}")
async def get_match(id: int, db: AsyncSession = Depends(database.get_db)):
    m = await db.get(models.Match, id)
    if not m:
        raise HTTPException(status_code=404, detail="Match not found")
    t1 = await db.get(models.Team, m.team1_id)
    t2 = await db.get(models.Team, m.team2_id)
    tournament = await db.get(models.Tournament, m.tournament_id)
    game = await db.get(models.Game, tournament.game_id) if tournament else None
    
    res_query = await db.execute(select(models.MatchResult).where(models.MatchResult.match_id == id))
    r = res_query.scalars().first()
    
    winner_name = "TBD"
    if r:
        winner = await db.get(models.Team, r.winner_id) if r.winner_id else None
        winner_name = winner.team_name if winner else ("Draw" if r.winner_id is None else "Unknown")
        
    return {
        "match_id": m.match_id,
        "tournament_id": m.tournament_id,
        "tournament_name": tournament.tournament_name if tournament else "Unknown",
        "game_name": game.game_name if game else "Unknown",
        "team1_id": m.team1_id,
        "team1_name": t1.team_name if t1 else "Unknown",
        "team2_id": m.team2_id,
        "team2_name": t2.team_name if t2 else "Unknown",
        "match_date": m.match_date,
        "stage": m.stage,
        "team1_score": r.team1_score if r else None,
        "team2_score": r.team2_score if r else None,
        "winner_id": r.winner_id if r else None,
        "winner_name": winner_name,
        "match_duration": str(r.match_duration) if (r and r.match_duration) else None
    }

@router.post("/matches/{id}/result", response_model=schemas.MatchResultOut)
async def add_match_result(id: int, r: schemas.MatchResultBase, current_admin: models.AdminUser = Depends(auth.get_current_admin), db: AsyncSession = Depends(database.get_db)):
    # Check if result already exists
    res_query = await db.execute(select(models.MatchResult).where(models.MatchResult.match_id == id))
    existing_result = res_query.scalars().first()
    
    if existing_result:
        existing_result.winner_id = r.winner_id
        existing_result.team1_score = r.team1_score
        existing_result.team2_score = r.team2_score
        existing_result.match_duration = r.match_duration
        await db.commit()
        await db.refresh(existing_result)
        return existing_result
    else:
        new_result = models.MatchResult(
            match_id=id,
            winner_id=r.winner_id,
            team1_score=r.team1_score,
            team2_score=r.team2_score,
            match_duration=r.match_duration
        )
        db.add(new_result)
        await db.commit()
        await db.refresh(new_result)
        return new_result

