export class Crosshair {
    constructor(domObject) {
        this.domObject = domObject;
        this.isMouseDown = false;
        this.visible = false;
        this.transitionDuration = this.getTransitionTime();
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

    getCurrentSize() {
        return parseInt(this.domObject.style.width, 10);
    }

    getTransitionTime() {
        const computedStyle = window.getComputedStyle(this.domObject);
        return parseFloat(computedStyle.transitionDuration)*1000;
    }
}