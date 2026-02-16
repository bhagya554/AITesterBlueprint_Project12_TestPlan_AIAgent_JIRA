"""Database configuration and models for TestPlan Agent."""
from datetime import datetime
from typing import List, Optional
from sqlalchemy import create_engine, String, Text, DateTime, Integer
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, sessionmaker, Session
from config import settings

# Create database engine
DATABASE_URL = "sqlite:///./testplan_agent.db"
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


class TestPlanHistory(Base):
    """Model for storing generated test plans."""
    __tablename__ = "test_plan_history"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    jira_ticket_id: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    ticket_title: Mapped[str] = mapped_column(String(500), nullable=False)
    test_plan_content: Mapped[str] = mapped_column(Text, nullable=False)
    llm_provider: Mapped[str] = mapped_column(String(50), nullable=False)
    llm_model: Mapped[str] = mapped_column(String(100), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class SettingsStore(Base):
    """Model for storing settings in database (mirrors .env)."""
    __tablename__ = "settings"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    key: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    value: Mapped[str] = mapped_column(Text, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


# Create all tables
Base.metadata.create_all(bind=engine)


def get_db() -> Session:
    """Get database session."""
    db = SessionLocal()
    try:
        return db
    finally:
        db.close()


def save_test_plan(
    db: Session,
    jira_ticket_id: str,
    ticket_title: str,
    test_plan_content: str,
    llm_provider: str,
    llm_model: str
) -> TestPlanHistory:
    """Save a generated test plan to history."""
    history = TestPlanHistory(
        jira_ticket_id=jira_ticket_id,
        ticket_title=ticket_title,
        test_plan_content=test_plan_content,
        llm_provider=llm_provider,
        llm_model=llm_model
    )
    db.add(history)
    db.commit()
    db.refresh(history)
    return history


def get_all_test_plans(db: Session) -> List[TestPlanHistory]:
    """Get all test plans from history."""
    return db.query(TestPlanHistory).order_by(TestPlanHistory.created_at.desc()).all()


def get_test_plan_by_id(db: Session, plan_id: int) -> Optional[TestPlanHistory]:
    """Get a specific test plan by ID."""
    return db.query(TestPlanHistory).filter(TestPlanHistory.id == plan_id).first()


def delete_test_plan(db: Session, plan_id: int) -> bool:
    """Delete a test plan from history."""
    plan = db.query(TestPlanHistory).filter(TestPlanHistory.id == plan_id).first()
    if plan:
        db.delete(plan)
        db.commit()
        return True
    return False


def save_setting_to_db(db: Session, key: str, value: str) -> SettingsStore:
    """Save a setting to the database."""
    setting = db.query(SettingsStore).filter(SettingsStore.key == key).first()
    if setting:
        setting.value = value
        setting.updated_at = datetime.utcnow()
    else:
        setting = SettingsStore(key=key, value=value)
        db.add(setting)
    db.commit()
    db.refresh(setting)
    return setting


def load_settings_from_db(db: Session) -> dict:
    """Load all settings from database."""
    settings = db.query(SettingsStore).all()
    return {s.key: s.value for s in settings}
