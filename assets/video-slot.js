// <video-slot src="videos/preview/x.mp4">: muted looping clip. Loads when it is
// close to the screen and plays only while actually on screen.
// Posters: videos/poster/x.jpg (or bg-x.jpg for videos/bg/x.mp4).
// Elements with data-vid wait for the page to clear `hold` before playing.
(() => {
  if (customElements.get('video-slot')) return;
  const loadIO = new IntersectionObserver((entries) => {
    for (const e of entries) { e.target.near = e.isIntersecting; e.target.sync(); }
  }, { rootMargin: '250px' });
  const playIO = new IntersectionObserver((entries) => {
    for (const e of entries) { e.target.seen = e.isIntersecting; e.target.tryPlay(); }
  });
  class VideoSlot extends HTMLElement {
    static get observedAttributes() { return ['src']; }
    constructor() {
      super();
      const r = this.attachShadow({ mode: 'open' });
      r.innerHTML = `<style>
:host{display:block;position:relative;width:100%;height:100%;overflow:hidden;background:#DDD6C9}
video{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block}
:host([quiet]){background:transparent}
</style><video muted loop playsinline preload="none"></video>`;
      this.v = r.querySelector('video');
      this.v.muted = true;
      this.near = false;
      this.seen = false;
      this.hold = false;
      this.v.addEventListener('loadeddata', () => this.tryPlay());
      // Once the current story can play through, start fetching the next one.
      this.v.addEventListener('canplaythrough', () => {
        if (this.hold || !this.hasAttribute('data-vid')) return;
        const next = this.parentElement.nextElementSibling;
        const vs = next && next.querySelector('video-slot[data-vid]');
        if (vs && vs.v.getAttribute('src')) vs.v.preload = 'auto';
      });
    }
    connectedCallback() {
      if (this.hasAttribute('data-vid')) this.hold = true;
      loadIO.observe(this);
      playIO.observe(this);
    }
    disconnectedCallback() { loadIO.unobserve(this); playIO.unobserve(this); this.v.pause(); }
    attributeChangedCallback() { this.sync(); }
    sync() {
      const s = this.getAttribute('src');
      if (this.near && s && this.v.getAttribute('src') !== s) {
        const [, dir, name] = /videos\/(\w+)\/(.+)\.mp4$/.exec(s) || [];
        if (name) this.v.poster = `videos/poster/${dir === 'bg' ? 'bg-' : ''}${name}.jpg`;
        this.v.preload = this.hold ? 'metadata' : 'auto';
        this.v.src = s;
      }
      this.tryPlay();
    }
    tryPlay() {
      if (!this.v.getAttribute('src')) return;
      if (!this.seen || this.hold) { this.v.pause(); return; }
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
