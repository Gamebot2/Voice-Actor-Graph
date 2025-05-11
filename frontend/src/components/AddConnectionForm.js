import React, { useState, useEffect } from 'react';
import {
    Button,
    Dialog,
    Classes,
    FormGroup,
    InputGroup,
    MenuItem,
    HTMLSelect,
    Card
} from '@blueprintjs/core';
import { Suggest } from '@blueprintjs/select';

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

    const renderVoiceActorItem = (item, { handleClick, modifiers }) => {
        if (!modifiers.matchesPredicate) {
            return null;
        }
        const text = item.inputValue || item.name;
        return (
            <MenuItem
                key={item.id || item.inputValue}
                text={text}
                onClick={handleClick}
                active={modifiers.active}
            />
        );
    };

    const renderCharacterItem = (item, { handleClick, modifiers }) => {
        if (!modifiers.matchesPredicate) {
            return null;
        }
        const text = item.inputValue
            ? `${item.inputValue} (New)`
            : `${item.name} (${item.game})`;
        return (
            <MenuItem
                key={item.id || item.inputValue}
                text={text}
                onClick={handleClick}
                active={modifiers.active}
            />
        );
    };

    return (
        <Dialog
            isOpen={open}
            onClose={onClose}
            title="Add Voice Actor - Character Connection"
            className={Classes.DIALOG}
        >
            <div className={Classes.DIALOG_BODY}>
                <form id="connectionForm">
                    <FormGroup label="Voice Actor">
                        <Suggest
                            items={voiceActors}
                            itemRenderer={renderVoiceActorItem}
                            itemPredicate={(query, item) =>
                                item.name?.toLowerCase().includes(query.toLowerCase()) ||
                                item.inputValue?.toLowerCase().includes(query.toLowerCase())
                            }
                            onItemSelect={(item) => setFormData({ ...formData, voiceActor: item })}
                            inputValueRenderer={(item) => item.inputValue || item.name}
                            selectedItem={formData.voiceActor}
                            createNewItemFromQuery={(query) => ({ inputValue: query })}
                            createNewItemRenderer={(query, active, handleClick) => (
                                <MenuItem
                                    icon="add"
                                    text={`Create "${query}"`}
                                    active={active}
                                    onClick={handleClick}
                                    shouldDismissPopover={false}
                                />
                            )}
                            fill
                        />
                    </FormGroup>

                    <FormGroup label="Character">
                        <Suggest
                            items={characters}
                            itemRenderer={renderCharacterItem}
                            itemPredicate={(query, item) =>
                                item.name?.toLowerCase().includes(query.toLowerCase()) ||
                                item.inputValue?.toLowerCase().includes(query.toLowerCase())
                            }
                            onItemSelect={(item) => setFormData({
                                ...formData,
                                character: item,
                                game: item.game || ''
                            })}
                            inputValueRenderer={(item) =>
                                item.inputValue
                                    ? `${item.inputValue} (New)`
                                    : `${item.name} (${item.game})`
                            }
                            selectedItem={formData.character}
                            createNewItemFromQuery={(query) => ({ inputValue: query })}
                            createNewItemRenderer={(query, active, handleClick) => (
                                <MenuItem
                                    icon="add"
                                    text={`Create "${query}"`}
                                    active={active}
                                    onClick={handleClick}
                                    shouldDismissPopover={false}
                                />
                            )}
                            fill
                        />
                    </FormGroup>

                    <FormGroup
                        label="Game"
                        helperText={formData.character?.id ? "Game is set by the selected character" : "Enter game for new character"}
                    >
                        <InputGroup
                            value={formData.game}
                            onChange={(e) => setFormData({ ...formData, game: e.target.value })}
                            disabled={!!formData.character?.id}
                            fill
                        />
                    </FormGroup>
                </form>
            </div>
            <div className={Classes.DIALOG_FOOTER}>
                <div className={Classes.DIALOG_FOOTER_ACTIONS}>
                    <Button onClick={onClose}>Cancel</Button>
                    <Button
                        intent="primary"
                        onClick={handleSubmit}
                        type="submit"
                        form="connectionForm"
                    >
                        Add Connection
                    </Button>
                </div>
            </div>
        </Dialog>
    );
}

export default AddConnectionForm; 