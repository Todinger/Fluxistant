
export default class AnimationTimer {
	constructor(durationInSeconds, fps, easing, onStep, onDone) {
		this.duration = durationInSeconds * 1000;
		console.assert(durationInSeconds > 0, "Animation duration must be positive.");
		
		this.frames = durationInSeconds * fps;
		console.assert(this.frames > 1, "Animation must have at least two frames.");
		
		this.onStep = onStep;
		this.onDone = onDone;
		this.easing = easing || (t => t);
		
		this.running = false;
		this.handle = null;
		this.maxFrame = this.frames - 1;
		this.interval = this.duration / this.maxFrame;
		this.startTime = 0;
		this.currentFrame = 0;
	}
	
	start() {
		if (this.running) {
			return false;
		}
		
		this.running = true;
		this.currentFrame = 0;
		this.startTime = Date.now();
		this.doFrame();
	}
	
	doFrame() {
		this.handle = null;
		if (this.onStep) {
			this.onStep(this.easing(this.currentFrame / this.maxFrame));
		}
		
		if (this.currentFrame < this.maxFrame) {
			this.scheduleNext();
		} else {
			this.stop();
			if (this.onDone) {
				this.onDone();
			}
		}
	}
	
	scheduleNext() {
		this.currentFrame++;
		
		// Calculate the target time from the beginning to decrease clock drift
		let nextFrameTime = this.startTime + this.currentFrame * this.interval;
		this.handle = setTimeout(
			() => this.doFrame(),
			nextFrameTime - Date.now());
	}
	
	stop() {
		if (!this.running) {
			return false;
		}
		
		if (this.handle) {
			clearTimeout(this.handle);
			this.handle = null;
		}
		
		this.running = false;
	}
}
