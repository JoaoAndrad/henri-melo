// <video-slot src="videos/preview/x.mp4">: muted looping clip that only loads
// and plays while near the screen. Poster comes from videos/poster/x.jpg.
// Elements with data-vid wait for the page to clear `hold` before playing.
(() => {
  if (customElements.get('video-slot')) return;
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      e.target.near = e.isIntersecting;
      e.target.sync();
    }
  }, { rootMargin: '300px' });
  class VideoSlot extends HTMLElement {
    static get observedAttributes() { return ['src']; }
    constructor() {
      super();
      const r = this.attachShadow({ mode: 'open' });
      r.innerHTML = `<style>
:host{display:block;position:relative;width:100%;height:100%;overflow:hidden;background:#DDD6C9}
video{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block}
:host([quiet]){background:transparent}
</style><video muted loop playsinline preload="auto"></video>`;
      this.v = r.querySelector('video');
      this.v.muted = true;
      this.near = false;
      this.hold = false;
      this.v.addEventListener('loadeddata', () => this.tryPlay());
    }
    connectedCallback() {
      if (this.hasAttribute('data-vid')) this.hold = true;
      io.observe(this);
    }
    disconnectedCallback() { io.unobserve(this); this.v.pause(); }
    attributeChangedCallback() { this.sync(); }
    sync() {
      const s = this.getAttribute('src');
      if (this.near && s && this.v.getAttribute('src') !== s) {
        this.v.poster = s.replace(/videos\/\w+\/(.+)\.mp4$/, 'videos/poster/$1.jpg');
        this.v.src = s;
      }
      this.tryPlay();
    }
    tryPlay() {
      if (!this.v.getAttribute('src')) return;
      if (!this.near || this.hold) { this.v.pause(); return; }
      if (!this.v.paused) return;
      this.v.play().catch((err) => {
        // Sound without a recent tap can be refused: fall back to muted.
        if (err && err.name === 'NotAllowedError' && !this.v.muted) {
          this.v.muted = true;
          this.v.play().catch(() => {});
        }
      });
    }
  }
  customElements.define('video-slot', VideoSlot);
})();
