import { Timer } from './Timer.js'

export class Crosshair {
    constructor(domObject) {
        this.domObject      = domObject;
        this.isMouseDown    = false;
        this.visible        = false;
        this.timer          = new Timer();
        
        this.transitionDuration     = this.getTransitionTime();
        
        this.mouseDown              = this.mouseDown.bind(this);
        this.mouseUp                = this.mouseUp.bind(this);
        
        document.addEventListener('mousedown', this.mouseDown);
        document.addEventListener('mouseup', this.mouseUp);
    }

    updateCrosshairSize() {
        const newSize = this.isMouseDown ? 24 : 7; // Change the size as needed
        this.domObject.style.width = `${newSize}px`;
        this.domObject.style.height = `${newSize}px`;
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

    mouseDown(event) {
        this.timer.start();
        this.toggleMouseDown();
        this.updateCrosshairSize();
    }

    mouseUp(event) {
        var elapsedTime = this.timer.lap();
        console.log(`${elapsedTime} ms`);
        this.toggleMouseDown();
        this.updateCrosshairSize();
    }
}