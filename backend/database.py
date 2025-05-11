from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

# Association table for the many-to-many relationship
voice_actor_character = db.Table('voice_actor_character',
    db.Column('voice_actor_id', db.Integer, db.ForeignKey('voice_actor.id'), primary_key=True),
    db.Column('character_id', db.Integer, db.ForeignKey('character.id'), primary_key=True)
)

class VoiceActor(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False, unique=True)
    characters = db.relationship('Character', secondary=voice_actor_character, backref='voice_actors')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'characters': [{'id': c.id, 'name': c.name, 'game': c.game} for c in self.characters]
        }

class Character(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    game = db.Column(db.String(100), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (
        db.UniqueConstraint('name', 'game', name='unique_character_game'),
    )

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'game': self.game,
            'voice_actors': [{'id': va.id, 'name': va.name} for va in self.voice_actors]
        } 