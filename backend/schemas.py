from pydantic import BaseModel
from typing import Optional, List
from datetime import date, datetime, time

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

class AdminUserCreate(BaseModel):
    username: str
    password: str

class DashboardStats(BaseModel):
    games_count: int
    tournaments_count: int
    teams_count: int
    players_count: int

class UpcomingTournament(BaseModel):
    tournament_name: str
    game_name: str
    start_date: date
    end_date: date
    prize_pool: Optional[float]
    location: Optional[str]

class RecentMatchResult(BaseModel):
    match_id: int
    stage: str
    team1_name: str
    team2_name: str
    team1_score: int
    team2_score: int
    winner_name: str
    match_date: datetime
    game_name: str
    tournament_name: str

class GameBase(BaseModel):
    game_name: str
    genre: Optional[str] = None

class GameOut(GameBase):
    game_id: int
    class Config:
        from_attributes = True

class TeamBase(BaseModel):
    team_name: str
    game_id: Optional[int]
    coach_name: Optional[str]

class TeamOut(TeamBase):
    team_id: int
    class Config:
        from_attributes = True

class PlayerBase(BaseModel):
    team_id: Optional[int]
    player_name: str
    in_game_name: str
    role: Optional[str]
    email: Optional[str]
    date_of_birth: Optional[date]

class PlayerOut(PlayerBase):
    player_id: int
    class Config:
        from_attributes = True

class TournamentBase(BaseModel):
    tournament_name: str
    game_id: Optional[int]
    start_date: date
    end_date: date
    prize_pool: Optional[float]
    location: Optional[str]
    status: Optional[str] = 'upcoming'

class TournamentOut(TournamentBase):
    tournament_id: int
    class Config:
        from_attributes = True

class TeamDetailOut(TeamOut):
    game_name: Optional[str] = None
    player_count: int = 0

class PlayerDetailOut(PlayerOut):
    team_name: Optional[str] = None
    game_name: Optional[str] = None

class SponsorBase(BaseModel):
    sponsor_name: str
    contact_email: Optional[str] = None
    sponsorship_amount: Optional[float] = None

class SponsorOut(SponsorBase):
    sponsor_id: int
    class Config:
        from_attributes = True

class MatchBase(BaseModel):
    tournament_id: int
    team1_id: int
    team2_id: int
    match_date: datetime
    stage: str

class MatchOut(MatchBase):
    match_id: int
    class Config:
        from_attributes = True

class MatchResultBase(BaseModel):
    match_id: int
    winner_id: Optional[int] = None
    team1_score: int
    team2_score: int
    match_duration: Optional[time] = None

class MatchResultOut(MatchResultBase):
    result_id: int
    class Config:
        from_attributes = True

