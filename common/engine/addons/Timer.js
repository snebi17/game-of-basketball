export class Timer {
    
    constructor() {
        this.startTime = 0; 
        this.lapTimes = [];
        this.times = [];
    }

    start() {
        this.startTime = Date.now();
        this.lapTimes = [];
        this.lapTimes.push(this.startTime);
        return this.startTime;
    }

    stop() {
        var stopTime = Date.now();
        var lapTime = stopTime - this.getLastLapTime();
        this.lapTimes.push(lapTime);
        return stopTime - this.startTime; 
    }

    lap() {
        var lapTime = Date.now() - this.getLastLapTime();
        this.lapTimes.push(lapTime);
        return lapTime; 
    }

    getTime(i) {
        var LapTimes = this.getLapTimes(i);
        return LapTimes.reduce((acc, curr) => acc+curr, 0) - LapTimes[0];
    }

    getLastTime() {
        return this.getTime(this.times.length-1);
    }

    getLapTimes(i) {
        if (i >= this.times.length) {
            console.log("This time was not jet recorded");
        }
        return this.times[i];
    }

    getStartTime(i) {
        return this.getLapTimes(i)[0];
    }

    getLastStartTime() {
        return this.getStartTime(this.times.lengths - 1);
    }

    getLastLapTimes() {
        return this.getLapTimes(this.times.length-1);
    }

    getLastLapTime() {
        return this.lapTimes[this.lapTimes.length-1];
    }
}