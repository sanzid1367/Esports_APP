from sqlalchemy import Column, Integer, String, Date, DateTime, Time, ForeignKey, Enum, Numeric
from sqlalchemy.orm import relationship
from database import Base
import datetime

class Game(Base):
    __tablename__ = "games"
    game_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    game_name = Column(String(100), nullable=False)
    genre = Column(String(50))
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    tournaments = relationship("Tournament", back_populates="game")
    teams = relationship("Team", back_populates="game")

class Tournament(Base):
    __tablename__ = "tournaments"
    tournament_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    tournament_name = Column(String(100), nullable=False)
    game_id = Column(Integer, ForeignKey("games.game_id"))
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    prize_pool = Column(Numeric(10, 2))
    location = Column(String(100))
    status = Column(Enum('upcoming', 'ongoing', 'completed'), default='upcoming')
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    game = relationship("Game", back_populates="tournaments")
    matches = relationship("Match", back_populates="tournament")

class Team(Base):
    __tablename__ = "teams"
    team_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    team_name = Column(String(100), nullable=False)
    game_id = Column(Integer, ForeignKey("games.game_id"))
    coach_name = Column(String(100))
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    game = relationship("Game", back_populates="teams")
    players = relationship("Player", back_populates="team")

class Player(Base):
    __tablename__ = "players"
    player_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    team_id = Column(Integer, ForeignKey("teams.team_id"))
    player_name = Column(String(100), nullable=False)
    in_game_name = Column(String(50), nullable=False)
    role = Column(String(50))
    email = Column(String(100), unique=True)
    date_of_birth = Column(Date)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    team = relationship("Team", back_populates="players")

class Sponsor(Base):
    __tablename__ = "sponsors"
    sponsor_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    sponsor_name = Column(String(100), nullable=False)
    contact_email = Column(String(100))
    sponsorship_amount = Column(Numeric(10, 2))
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class Match(Base):
    __tablename__ = "matches"
    match_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    tournament_id = Column(Integer, ForeignKey("tournaments.tournament_id"))
    team1_id = Column(Integer, ForeignKey("teams.team_id"))
    team2_id = Column(Integer, ForeignKey("teams.team_id"))
    match_date = Column(DateTime, nullable=False)
    stage = Column(String(50), nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    tournament = relationship("Tournament", back_populates="matches")
    team1 = relationship("Team", foreign_keys=[team1_id])
    team2 = relationship("Team", foreign_keys=[team2_id])
    result = relationship("MatchResult", back_populates="match", uselist=False)

class MatchResult(Base):
    __tablename__ = "match_results"
    result_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    match_id = Column(Integer, ForeignKey("matches.match_id"))
    winner_id = Column(Integer, ForeignKey("teams.team_id"))
    team1_score = Column(Integer, nullable=False)
    team2_score = Column(Integer, nullable=False)
    match_duration = Column(Time)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    match = relationship("Match", back_populates="result")
    winner = relationship("Team", foreign_keys=[winner_id])

class AdminUser(Base):
    __tablename__ = "admin_users"
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
