from flask import Flask, jsonify, request
from flask_cors import CORS
from database import db, VoiceActor, Character
from sqlalchemy.exc import IntegrityError
import os

app = Flask(__name__)
CORS(app, resources={
    r"/api/*": {
        "origins": ["http://localhost:3000"],
        "methods": ["GET", "POST", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type"]
    }
})

# Get the absolute path to the backend directory
BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BACKEND_DIR, 'data')
DB_PATH = os.path.join(DATA_DIR, 'voice_actors.db')

# Ensure the data directory exists
os.makedirs(DATA_DIR, exist_ok=True)

# Configure SQLite database with absolute path
app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{DB_PATH}'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Initialize database
db.init_app(app)

# Create database tables
with app.app_context():
    db.create_all()

@app.route('/api/voice-actors/<int:actor_id>', methods=['DELETE'])
def delete_voice_actor(actor_id):
    voice_actor = VoiceActor.query.get(actor_id)
    if voice_actor:
        db.session.delete(voice_actor)
        db.session.commit()
        return jsonify({'message': 'Voice actor deleted successfully'})
    return jsonify({'error': 'Voice actor not found'}), 404

@app.route('/api/characters/<int:character_id>', methods=['DELETE'])
def delete_character(character_id):
    character = Character.query.get(character_id)
    if character:
        db.session.delete(character)
        db.session.commit()
        return jsonify({'message': 'Character deleted successfully'})
    return jsonify({'error': 'Character not found'}), 404

@app.route('/api/connect', methods=['POST', 'DELETE'])
def handle_connection():
    if request.method == 'DELETE':
        data = request.json
        voice_actor = VoiceActor.query.get(data['voice_actor_id'])
        character = Character.query.get(data['character_id'])
        
        if voice_actor and character:
            voice_actor.characters.remove(character)
            db.session.commit()
            return jsonify({'message': 'Connection removed successfully'})
        return jsonify({'error': 'Voice actor or character not found'}), 404
    
    # POST method
    data = request.json
    voice_actor = VoiceActor.query.get(data['voice_actor_id'])
    character = Character.query.get(data['character_id'])
    
    if voice_actor and character:
        # Check if connection already exists
        if character in voice_actor.characters:
            return jsonify({'message': 'Connection already exists'}), 200
        
        voice_actor.characters.append(character)
        db.session.commit()
        return jsonify({'message': 'Connected successfully'})
    
    return jsonify({'error': 'Voice actor or character not found'}), 404

@app.route('/api/connect/all', methods=['DELETE'])
def delete_all_connections():
    try:
        # Delete all voice actors and characters
        VoiceActor.query.delete()
        Character.query.delete()
        
        db.session.commit()
        return jsonify({'message': 'All data deleted successfully'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/voice-actors', methods=['GET', 'POST'])
def handle_voice_actors():
    if request.method == 'POST':
        data = request.json
        # Check if voice actor already exists
        existing_actor = VoiceActor.query.filter_by(name=data['name']).first()
        if existing_actor:
            return jsonify(existing_actor.to_dict()), 200
        
        try:
            voice_actor = VoiceActor(name=data['name'])
            db.session.add(voice_actor)
            db.session.commit()
            return jsonify(voice_actor.to_dict())
        except IntegrityError:
            db.session.rollback()
            return jsonify({'error': 'Voice actor already exists'}), 400
    
    voice_actors = VoiceActor.query.all()
    return jsonify([actor.to_dict() for actor in voice_actors])

@app.route('/api/characters', methods=['GET', 'POST'])
def handle_characters():
    if request.method == 'POST':
        data = request.json
        # Check if character already exists in the same game
        existing_character = Character.query.filter_by(
            name=data['name'],
            game=data['game']
        ).first()
        
        if existing_character:
            # If voice actor is provided, add the connection
            if 'voice_actor_id' in data:
                voice_actor = VoiceActor.query.get(data['voice_actor_id'])
                if voice_actor and existing_character not in voice_actor.characters:
                    voice_actor.characters.append(existing_character)
                    db.session.commit()
            return jsonify(existing_character.to_dict()), 200
        
        try:
            character = Character(
                name=data['name'],
                game=data['game']
            )
            if 'voice_actor_id' in data:
                voice_actor = VoiceActor.query.get(data['voice_actor_id'])
                if voice_actor:
                    voice_actor.characters.append(character)
            
            db.session.add(character)
            db.session.commit()
            return jsonify(character.to_dict())
        except IntegrityError:
            db.session.rollback()
            return jsonify({'error': 'Character already exists in this game'}), 400
    
    characters = Character.query.all()
    return jsonify([character.to_dict() for character in characters])

@app.route('/api/graph-data', methods=['GET'])
def get_graph_data():
    voice_actors = VoiceActor.query.all()
    characters = Character.query.all()
    
    nodes = []
    edges = []
    
    # Add voice actor nodes
    for actor in voice_actors:
        nodes.append({
            'data': {
                'id': f'actor_{actor.id}',
                'name': actor.name,
                'type': 'voice_actor'
            }
        })
    
    # Add character nodes
    for character in characters:
        nodes.append({
            'data': {
                'id': f'character_{character.id}',
                'name': character.name,
                'game': character.game,
                'type': 'character'
            }
        })
    
    # Add edges
    for actor in voice_actors:
        for character in actor.characters:
            edges.append({
                'data': {
                    'source': f'actor_{actor.id}',
                    'target': f'character_{character.id}'
                }
            })
    
    response_data = {
        'nodes': nodes,
        'edges': edges
    }
    return jsonify(response_data)

if __name__ == '__main__':
    app.run(debug=True) 