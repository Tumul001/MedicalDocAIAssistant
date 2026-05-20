/**
 * pcm-processor.js
 * AudioWorklet that runs off the main thread.
 *
 * Converts Float32 audio samples → Int16 PCM and posts the buffer
 * to the main thread, which forwards it over the WebSocket to the backend.
 *
 * Place this file in:  frontend/public/pcm-processor.js
 * Load via:            audioContext.audioWorklet.addModule('/pcm-processor.js')
 *
 * The AudioContext is created at 16 000 Hz so the browser handles
 * downsampling from the hardware rate automatically — no manual resampling
 * needed here.
 */
class PCMProcessor extends AudioWorkletProcessor {
  /**
   * process() is called by the browser audio engine for every 128-sample
   * render quantum.  We accumulate samples into a larger chunk before posting
   * so we don't flood the main thread with tiny messages.
   */
  constructor(options) {
    super(options);

    // Buffer ~100 ms of audio before posting (16 000 Hz × 0.1 s = 1 600 samples)
    this._chunkSize = 1600;
    this._buffer    = new Float32Array(this._chunkSize);
    this._offset    = 0;
  }

  process(inputs /*, outputs, parameters */) {
    const channelData = inputs[0]?.[0]; // mono, channel 0
    if (!channelData) return true;      // keep processor alive

    for (let i = 0; i < channelData.length; i++) {
      this._buffer[this._offset++] = channelData[i];

      if (this._offset >= this._chunkSize) {
        this._flush();
      }
    }

    return true; // returning false would kill the processor
  }

  _flush() {
    if (this._offset === 0) return;

    const slice = this._buffer.subarray(0, this._offset);

    // Float32 (−1.0 … +1.0) → Int16 (−32 768 … +32 767)
    const int16 = new Int16Array(slice.length);
    for (let i = 0; i < slice.length; i++) {
      const clamped = Math.max(-1, Math.min(1, slice[i]));
      int16[i] = clamped < 0 ? clamped * 32768 : clamped * 32767;
    }

    // Transfer ownership (zero-copy) to the main thread
    this.port.postMessage(int16.buffer, [int16.buffer]);

    this._offset = 0;
  }
}

registerProcessor("pcm-processor", PCMProcessor);
