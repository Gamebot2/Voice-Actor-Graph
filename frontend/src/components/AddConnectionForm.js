import React, { useState, useEffect } from 'react';
import {
    Box,
    Button,
    TextField,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Typography,
    Autocomplete
} from '@mui/material';

function AddConnectionForm({ open, onClose, onAdd }) {
    const [voiceActors, setVoiceActors] = useState([]);
    const [characters, setCharacters] = useState([]);
    const [formData, setFormData] = useState({
        voiceActor: null,
        character: null,
        game: ''
    });

    useEffect(() => {
        // Fetch existing voice actors and characters
        fetch('http://localhost:5000/api/voice-actors')
            .then(res => res.json())
            .then(data => setVoiceActors(data));

        fetch('http://localhost:5000/api/characters')
            .then(res => res.json())
            .then(data => setCharacters(data));
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            let voiceActorId = formData.voiceActor?.id;
            let characterId = formData.character?.id;

            // Create new voice actor if needed
            if (!voiceActorId && formData.voiceActor?.inputValue) {
                const response = await fetch('http://localhost:5000/api/voice-actors', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name: formData.voiceActor.inputValue })
                });
                const data = await response.json();
                voiceActorId = data.id;
            }

            // Create new character if needed
            if (!characterId && formData.character?.inputValue) {
                const response = await fetch('http://localhost:5000/api/characters', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name: formData.character.inputValue,
                        game: formData.game,
                        voice_actor_id: voiceActorId
                    })
                });
                const data = await response.json();
                characterId = data.id;
            }

            // Connect voice actor and character if they weren't connected during creation
            if (voiceActorId && characterId) {
                await fetch('http://localhost:5000/api/connect', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        voice_actor_id: voiceActorId,
                        character_id: characterId
                    })
                });
            }

            onAdd();
            onClose();
            setFormData({
                voiceActor: null,
                character: null,
                game: ''
            });
        } catch (error) {
            console.error('Error adding connection:', error);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>Add Voice Actor - Character Connection</DialogTitle>
            <DialogContent>
                <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
                    <Typography variant="subtitle1" gutterBottom>
                        Voice Actor
                    </Typography>
                    <Autocomplete
                        value={formData.voiceActor}
                        onChange={(event, newValue) => {
                            setFormData({ ...formData, voiceActor: newValue });
                        }}
                        options={voiceActors}
                        getOptionLabel={(option) => {
                            if (typeof option === 'string') return option;
                            if (option.inputValue) return option.inputValue;
                            return option.name;
                        }}
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                label="Select or add voice actor"
                                sx={{ mb: 2 }}
                            />
                        )}
                        freeSolo
                        selectOnFocus
                        clearOnBlur
                        handleHomeEndKeys
                        renderOption={(props, option) => <li {...props}>{option.name}</li>}
                    />

                    <Typography variant="subtitle1" gutterBottom>
                        Character
                    </Typography>
                    <Autocomplete
                        value={formData.character}
                        onChange={(event, newValue) => {
                            setFormData({
                                ...formData,
                                character: newValue,
                                // If selecting an existing character, populate the game
                                game: newValue?.game || ''
                            });
                        }}
                        options={characters}
                        getOptionLabel={(option) => {
                            if (typeof option === 'string') return option;
                            if (option.inputValue) return option.inputValue;
                            return `${option.name} (${option.game})`;
                        }}
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                label="Select or add character"
                                sx={{ mb: 2 }}
                            />
                        )}
                        freeSolo
                        selectOnFocus
                        clearOnBlur
                        handleHomeEndKeys
                        renderOption={(props, option) => (
                            <li {...props}>
                                {option.name} ({option.game})
                            </li>
                        )}
                    />

                    <TextField
                        fullWidth
                        label="Game"
                        value={formData.game}
                        onChange={(e) => setFormData({ ...formData, game: e.target.value })}
                        disabled={!!formData.character?.id}
                        helperText={formData.character?.id ? "Game is set by the selected character" : "Enter game for new character"}
                        sx={{ mb: 2 }}
                    />
                </Box>
            </DialogContent>
            <DialogActions sx={{ justifyContent: 'flex-end' }}>
                <Button onClick={onClose}>Cancel</Button>
                <Button onClick={handleSubmit} variant="contained" color="primary">
                    Add Connection
                </Button>
            </DialogActions>
        </Dialog>
    );
}

export default AddConnectionForm; 