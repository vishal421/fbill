/**
 * AbstractTemplate - Base class for all receipt templates
 */
class AbstractTemplate {
  constructor(containerElemId) {
    this.containerElemId = containerElemId;
    this.rendered = false;
    this.rootElem = null;
    this.cssLink = null;
  }

  /**
   * Fetch and inject template HTML + CSS into the container
   */
  async render() {
    const container = document.getElementById(this.containerElemId);
    if (!container) throw new Error(`Container #${this.containerElemId} not found`);

    // Remove previous CSS link if any
    if (this.cssLink) {
      this.cssLink.remove();
      this.cssLink = null;
    }

    // Load template CSS
    if (this.cssUri) {
      this.cssLink = document.createElement('link');
      this.cssLink.rel = 'stylesheet';
      this.cssLink.href = this.cssUri;
      document.head.appendChild(this.cssLink);
      // Wait for CSS to load to avoid FOUC
      await new Promise((res) => {
        this.cssLink.onload = res;
        this.cssLink.onerror = res;
        setTimeout(res, 200); // fallback
      });
    }

    // Load template HTML
    const response = await fetch(this.contentUri);
    if (!response.ok) throw new Error(`Failed to load template: ${this.contentUri}`);
    const html = await response.text();
    container.innerHTML = html;

    this.rootElem = {
      find: (selector) => {
        const results = container.querySelectorAll(selector);
        return {
          text: (val) => results.forEach(el => el.textContent = val),
          attr: (attr, val) => results.forEach(el => el.setAttribute(attr, val)),
          show: () => results.forEach(el => el.style.display = ''),
          hide: () => results.forEach(el => el.style.display = 'none'),
          css: (prop, val) => results.forEach(el => el.style[prop] = val),
        };
      }
    };

    this.rendered = true;
  }

  renderData(data) {
    throw new Error('renderData() must be implemented by subclass');
  }

  getConfig() {
    throw new Error('getConfig() must be implemented by subclass');
  }
}
