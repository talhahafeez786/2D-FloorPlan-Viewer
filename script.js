document.addEventListener("DOMContentLoaded", () => {
    const canvas = document.getElementById('floorplanCanvas');
    const ctx = canvas.getContext('2d');
    const tooltip = document.getElementById('tooltip');

    let scale = 1;
    let offsetX = 0;
    let offsetY = 0;
    let isDragging = false;
    let startDragX = 0;
    let startDragY = 0;
    let hoverFurniture = null;

    let data = {}; // Store the fetched data
    let furnitures = []; // Store furniture data for hover functionality

    fetch('sample.json')
        .then(response => response.json())
        .then(jsonData => {
            data = jsonData;
            furnitures = jsonData.Furnitures;
            drawFloorplan();
        })
        .catch(error => console.error('Error loading floorplan data:', error));

    function drawFloorplan() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        ctx.save();
        ctx.translate(offsetX, offsetY);
        ctx.scale(scale, scale);

        // Draw Regions (Walls)
        data.Regions.forEach(region => {
            ctx.beginPath();
            ctx.moveTo(region[0].X, region[0].Y);
            region.forEach(point => {
                ctx.lineTo(point.X, point.Y);
            });
            ctx.closePath();
            ctx.strokeStyle = 'black';
            ctx.lineWidth = 2;
            ctx.stroke();
        });

        // Draw Doors
        data.Doors.forEach(door => {
            const { Location, Rotation, Width } = door;
            const doorWidth = Width;
            const doorHeight = 10; // Height for visualization

            ctx.save();
            ctx.translate(Location.X, Location.Y);
            ctx.rotate(Rotation);
            ctx.fillStyle = 'brown';
            ctx.fillRect(-doorWidth / 2, -doorHeight / 2, doorWidth, doorHeight);
            ctx.restore();
        });

        // Draw Furniture
        furnitures.forEach(furniture => {
            const { MinBound, MaxBound, xPlacement, yPlacement, rotation } = furniture;
            const width = MaxBound.X - MinBound.X;
            const height = MaxBound.Y - MinBound.Y;

            ctx.save();
            ctx.translate(xPlacement, yPlacement);
            ctx.rotate(rotation);
            ctx.fillStyle = 'gray'; // Default color
            ctx.fillRect(-width / 2, -height / 2, width, height);
            ctx.restore();
        });

        ctx.restore();
    }

    function getMousePos(event) {
        const rect = canvas.getBoundingClientRect();
        return {
            x: (event.clientX - rect.left) / scale - offsetX / scale,
            y: (event.clientY - rect.top) / scale - offsetY / scale
        };
    }

    function isPointInRect(px, py, x, y, width, height, rotation) {
        const cx = x;
        const cy = y;
        const dx = px - cx;
        const dy = py - cy;

        const rotatedX = dx * Math.cos(-rotation) - dy * Math.sin(-rotation);
        const rotatedY = dx * Math.sin(-rotation) + dy * Math.cos(-rotation);

        return rotatedX >= -width / 2 && rotatedX <= width / 2 &&
               rotatedY >= -height / 2 && rotatedY <= height / 2;
    }

    function handleHover(event) {
        const mousePos = getMousePos(event);
        hoverFurniture = null;

        for (const furniture of furnitures) {
            const { MinBound, MaxBound, xPlacement, yPlacement, rotation } = furniture;
            const width = MaxBound.X - MinBound.X;
            const height = MaxBound.Y - MinBound.Y;

            if (isPointInRect(mousePos.x, mousePos.y, xPlacement, yPlacement, width, height, rotation)) {
                hoverFurniture = furniture;
                break; // Stop checking after finding the first match
            }
        }

        if (hoverFurniture) {
            tooltip.textContent = hoverFurniture.equipName;
            tooltip.style.left = `${event.clientX + 10}px`;
            tooltip.style.top = `${event.clientY + 10}px`;
            tooltip.style.display = 'block';
        } else {
            tooltip.style.display = 'none';
        }
    }

    function handleMouseMove(event) {
        if (isDragging) {
            const newOffsetX = event.clientX - startDragX;
            const newOffsetY = event.clientY - startDragY;
            offsetX = newOffsetX;
            offsetY = newOffsetY;
            drawFloorplan(); // Redraw on dragging
        } else {
            handleHover(event); // Handle hover
        }
    }

    // Event Listeners
    canvas.addEventListener('mousemove', handleMouseMove);

    canvas.addEventListener('mousedown', (event) => {
        isDragging = true;
        startDragX = event.clientX - offsetX;
        startDragY = event.clientY - offsetY;
    });

    canvas.addEventListener('mouseup', () => {
        isDragging = false;
    });

    canvas.addEventListener('wheel', (event) => {
        const zoomAmount = event.deltaY * -0.01;
        scale += zoomAmount;
        scale = Math.max(0.1, Math.min(5, scale)); // Limit zoom scale
        drawFloorplan();
    });
});
