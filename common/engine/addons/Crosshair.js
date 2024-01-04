import { Timer } from './Timer.js'

export class Crosshair {

    constructor(domObject) {
        this.domObject      = domObject;
        this.isMouseDown    = false;
        this.visible        = false;
        this.timer          = new Timer();
        
        this.transitionDuration     = this.getTransitionTime();
    }

    async updateCrosshairSize() {
        const newSize = this.isMouseDown ? 24 : 7; // Change the size of the crosshair.
        this.domObject.style.width = `${newSize}px`;
        this.domObject.style.height = `${newSize}px`;

        // Store the initial state of the 'large' class
        const initialLargeState = this.domObject.classList.contains('large');
        
        // Uses setTimeout to delay the color change.
        await new Promise(resolve => {
            setTimeout(() => {
                    this.domObject.classList.toggle('large', this.isMouseDown);

                    // Check if the 'large' class state changed
                    const largeStateChanged = initialLargeState !== this.domObject.classList.contains('large');
                    
                    if (largeStateChanged) {
                        resolve();
                    }
            }, 200);
        });
    }

    toggleMouseDown() {
        this.isMouseDown = !this.isMouseDown;
    }

    show() {
        this.domObject.style.display = 'block';
    }

    hide() {
        this.domObject.style.display = 'none';
    }

    getTransitionTime() {
        const computedStyle = window.getComputedStyle(this.domObject);
        return parseFloat(computedStyle.transitionDuration)*1000;
    }
}