import React, { useState, useEffect, useCallback } from 'react';
import { Container, Typography, Box, Button, Menu, MenuItem, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import ReactFlow, {
    Background,
    Controls,
    MiniMap,
    Position,
    useNodesState,
    useEdgesState
} from 'react-flow-renderer';
import AddConnectionForm from './components/AddConnectionForm';

function App() {
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
    const [contextMenu, setContextMenu] = useState(null);
    const [selectedElement, setSelectedElement] = useState(null);

    const layoutNodes = (voiceActors, characters) => {
        const nodeWidth = 150;
        const nodeHeight = 40;
        const horizontalSpacing = 200;
        const verticalSpacing = 100;
        const startX = 100;
        const startY = 100;

        // Position voice actors on the left
        const voiceActorNodes = voiceActors.map((actor, index) => ({
            id: `actor_${actor.id}`,
            data: {
                label: actor.name,
                type: 'voice_actor'
            },
            position: {
                x: startX,
                y: startY + (index * verticalSpacing)
            },
            style: {
                background: '#2196f3',
                color: 'white',
                border: '1px solid #ccc',
                borderRadius: '4px',
                width: nodeWidth,
                height: nodeHeight,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px',
                padding: '10px'
            },
            draggable: false
        }));

        // Position characters on the right
        const characterNodes = characters.map((character, index) => ({
            id: `character_${character.id}`,
            data: {
                label: character.name,
                type: 'character',
                game: character.game
            },
            position: {
                x: startX + horizontalSpacing,
                y: startY + (index * verticalSpacing)
            },
            style: {
                background: '#4caf50',
                color: 'white',
                border: '1px solid #ccc',
                borderRadius: '50%',
                width: nodeWidth,
                height: nodeHeight,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px',
                padding: '10px'
            },
            draggable: false
        }));

        return [...voiceActorNodes, ...characterNodes];
    };

    const fetchGraphData = () => {
        fetch('http://localhost:5000/api/graph-data')
            .then(response => response.json())
            .then(data => {
                console.log('Received data:', data); // Debug log

                // Separate voice actors and characters
                const voiceActors = data.nodes.filter(node => node.data.type === 'voice_actor')
                    .map(node => ({
                        id: node.data.id.replace('actor_', ''),
                        name: node.data.name
                    }));

                const characters = data.nodes.filter(node => node.data.type === 'character')
                    .map(node => ({
                        id: node.data.id.replace('character_', ''),
                        name: node.data.name,
                        game: node.data.game
                    }));

                console.log('Processed voice actors:', voiceActors); // Debug log
                console.log('Processed characters:', characters); // Debug log

                // Create nodes with layout
                const transformedNodes = layoutNodes(voiceActors, characters);
                console.log('Transformed nodes:', transformedNodes); // Debug log

                // Create edges
                const transformedEdges = data.edges.map(edge => ({
                    id: `${edge.data.source}-${edge.data.target}`,
                    source: edge.data.source,
                    target: edge.data.target,
                    type: 'smoothstep',
                    animated: true,
                    style: { stroke: '#999' }
                }));

                console.log('Transformed edges:', transformedEdges); // Debug log

                setNodes(transformedNodes);
                setEdges(transformedEdges);
            })
            .catch(error => console.error('Error fetching graph data:', error));
    };

    useEffect(() => {
        fetchGraphData();
    }, []);

    const onNodeContextMenu = useCallback(
        (event, node) => {
            event.preventDefault();
            setSelectedElement(node);
            setContextMenu({
                mouseX: event.clientX,
                mouseY: event.clientY,
            });
        },
        []
    );

    const onEdgeContextMenu = useCallback(
        (event, edge) => {
            event.preventDefault();
            setSelectedElement(edge);
            setContextMenu({
                mouseX: event.clientX,
                mouseY: event.clientY,
            });
        },
        []
    );

    const handleContextMenuClose = () => {
        setContextMenu(null);
        setSelectedElement(null);
    };

    const handleDelete = async () => {
        if (!selectedElement) return;

        try {
            console.log('Deleting element:', selectedElement); // Debug log

            if (selectedElement.type === 'edge') {
                // Delete connection
                const [sourceId, targetId] = selectedElement.id.split('-');
                const voiceActorId = parseInt(sourceId.split('_')[1]);
                const characterId = parseInt(targetId.split('_')[1]);

                console.log('Deleting connection:', { voiceActorId, characterId }); // Debug log

                const response = await fetch('http://localhost:5000/api/connect', {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        voice_actor_id: voiceActorId,
                        character_id: characterId
                    })
                });

                if (!response.ok) {
                    throw new Error('Failed to delete connection');
                }
            } else {
                // Delete node
                const id = selectedElement.id;
                const type = selectedElement.data.type;
                const endpoint = type === 'voice_actor' ? 'voice-actors' : 'characters';
                const nodeId = parseInt(id.split('_')[1]);

                console.log('Deleting node:', { type, nodeId }); // Debug log

                const response = await fetch(`http://localhost:5000/api/${endpoint}/${nodeId}`, {
                    method: 'DELETE'
                });

                if (!response.ok) {
                    throw new Error(`Failed to delete ${type}`);
                }
            }

            console.log('Delete successful, refreshing graph...'); // Debug log
            await fetchGraphData();
            handleContextMenuClose();
        } catch (error) {
            console.error('Error deleting element:', error);
            alert(`Failed to delete: ${error.message}`);
        }
    };

    const handleDeleteAllConnections = async () => {
        try {
            const response = await fetch('http://localhost:5000/api/connect/all', {
                method: 'DELETE'
            });

            if (!response.ok) {
                throw new Error('Failed to delete all connections');
            }

            await fetchGraphData();
            setIsDeleteConfirmOpen(false);
        } catch (error) {
            console.error('Error deleting all connections:', error);
            alert(`Failed to delete all connections: ${error.message}`);
        }
    };

    return (
        <Container maxWidth="xl">
            <Box sx={{ my: 4 }}>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mb: 2 }}>
                    <Button
                        variant="outlined"
                        color="error"
                        onClick={() => setIsDeleteConfirmOpen(true)}
                    >
                        Delete All Connections
                    </Button>
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={() => setIsFormOpen(true)}
                    >
                        Add Connection
                    </Button>
                </Box>
                <Box sx={{ height: '80vh', border: '1px solid #ccc', borderRadius: 1 }}>
                    <ReactFlow
                        nodes={nodes}
                        edges={edges}
                        onNodesChange={onNodesChange}
                        onEdgesChange={onEdgesChange}
                        onNodeContextMenu={onNodeContextMenu}
                        onEdgeContextMenu={onEdgeContextMenu}
                        style={{ width: '100%', height: '100%' }}
                        defaultZoom={1}
                        minZoom={0.2}
                        maxZoom={4}
                        nodesDraggable={false}
                        nodesConnectable={false}
                        elementsSelectable={true}
                        selectNodesOnDrag={false}
                        panOnDrag={true}
                        zoomOnScroll={true}
                        preventScrolling={true}
                    >
                        <Background />
                        <Controls />
                        <MiniMap />
                    </ReactFlow>
                </Box>
            </Box>
            <AddConnectionForm
                open={isFormOpen}
                onClose={() => setIsFormOpen(false)}
                onAdd={fetchGraphData}
            />
            <Dialog
                open={isDeleteConfirmOpen}
                onClose={() => setIsDeleteConfirmOpen(false)}
            >
                <DialogTitle>Confirm Delete All Connections</DialogTitle>
                <DialogContent>
                    Are you sure you want to delete all connections? This action cannot be undone.
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setIsDeleteConfirmOpen(false)}>Cancel</Button>
                    <Button onClick={handleDeleteAllConnections} color="error" variant="contained">
                        Delete All
                    </Button>
                </DialogActions>
            </Dialog>
            <Menu
                open={contextMenu !== null}
                onClose={handleContextMenuClose}
                anchorReference="anchorPosition"
                anchorPosition={
                    contextMenu !== null
                        ? { top: contextMenu.mouseY, left: contextMenu.mouseX }
                        : undefined
                }
            >
                <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
                    Delete {selectedElement?.type === 'edge' ? 'Connection' : selectedElement?.data?.type === 'voice_actor' ? 'Voice Actor' : 'Character'}
                </MenuItem>
            </Menu>
        </Container>
    );
}

export default App; 