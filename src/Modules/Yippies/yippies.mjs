import { ModuleClient } from "/common/moduleClient.mjs";


class Yippies extends ModuleClient {
    static get FADE_TIME() { return 500; }

    constructor() {
        super('Yippies');
        this.scripts = {};
    }

    stick(url) {
        const img = document.createElement('img');
        img.src = url;
        img.classList.add('sticker');

        // Initial position at the center of the screen
        const initialX = window.innerWidth / 2 - 50; // 50 is half the width of the image
        const initialY = window.innerHeight / 2 - 50; // 50 is half the height of the image

        img.style.left = `${initialX}px`;
        img.style.top = `${initialY}px`;

        document.body.appendChild(img);

        // Force a reflow to apply the initial transform
        img.getBoundingClientRect();

        // Get random position within the viewport
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        const randomX = Math.random() * (viewportWidth - 100); // 100 is the width of the image
        const randomY = Math.random() * (viewportHeight - 100); // 100 is the height of the image

        // Add a slight rotation for a more "stuck" effect
        const randomRotation = Math.random() * 30 - 15; // Rotate between -15 and +15 degrees

        // Animate to the new position with rotation
        setTimeout(() => {
            img.style.left = `${randomX}px`;
            img.style.top = `${randomY}px`;
            img.style.transform = `scale(1) rotate(${randomRotation}deg)`;
        }, 0); // Timeout of 0 to ensure the transition applies
    }

    activate(parameters) {
        if (!parameters.image) return;

        this.stick(parameters.image.url);
    }


    start() {
        this.server.on('activate', (parameters) => this.activate(parameters));

        this.server.attach();
    }
}

const y = new Yippies();
y.start();
window.y = y;
