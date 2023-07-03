/**
 * Creates an instance for your application entrypoint that initializes the Backoffice application.
 *
 * This documentation was generated by documentation js.
 * See below for how to regenerate the documentation or initialize the application.
 *
 * @example
 * // Re-generate this documentation (nodejs 6+ required)
 * npx documentation build 'src/pcapi/static/backofficev3/js/!(libs)/**' \
 *   --config src/pcapi/routes/backoffice_v3/docs/jsdoc-config.yml \
 *   --format md \
 *   --sort-order alpha > src/pcapi/routes/backoffice_v3/docs/JSDOC.md
 *
 * @example
 * // To initialize the application, within the `<head>` of the HTML document:
 * const app = new BackofficeApp({
 *   addOns: [
 *     // add custom JavaScript addons here
 *   ],
 * })
 */
class PcBackofficeApp {

  /** This static string is used as the localStorage key for the application. */
  static LOCALSTORAGE_KEY = 'pc'

  /** This static string is used to retrieve the current csrf token */
  static META_CSRF_SELECTOR = 'meta[name="csrf-token"]'

  /** Each application's addons instance is available from within the `app` instance through `app.addons[name]`.
   * You can also access the addon by setting a unique `static ID` within the addon, this is particularly useful
   * when you need to reference an addon from another one in order to prevent the code from breaking if the name changes.
   */
  addons = {}

  /** This is the JS application state. It is used by PcAddOn and allow partial persistence of any addon state using `addon.saveState(state)` */
  appState = {}

  /**
   * @constructor
   * @param {{ addOns: Array<PcAddOn> }} config - the application configuration.
   */
  constructor({ addOns: AddOns }) {
    this.#rehydrateState()
    AddOns.forEach((AddOn) => {
      const name = `${AddOn.name[0].toLowerCase()}${AddOn.name.slice(1)}`
      const addon = new AddOn({
        name,
        app: this,
        addOnState: this.appState[name],
      })
      this.addons[name] = addon
      if (AddOn.ID) {
        this.addons[AddOn.ID] = addon
      }
    })
    PcUtils.addLoadEvent(this.bindTurboFrameEvents)
    PcUtils.addLoadEvent(this.initialize)
    PcUtils.addLoadEvent(this.bindEvents)
  }

  /**
   * Return the current CSRF token value
   */
  get csrfTokenValue() {
    return document.querySelector(PcBackofficeApp.META_CSRF_SELECTOR).content
  }

  /**
   * Return CSRF html input string
   */
  get csrfTokenInput() {
    return `<input name="csrf_token" type="hidden" value="${document.querySelector(PcBackofficeApp.META_CSRF_SELECTOR).content}">`
  }

  /**
   * This method is automatically called on window `load` event and will run each addon's initialize method.
   * When using XHR, it can be useful to rerun the initialization, or initialize a specific addon.
   * @example
   * // To manually initialize all addons
   * app.initialize()
   * @example
   * // To manually initialize a specific addon
   * app.addons.bsTooltips.initialize()
   */
  initialize = () => {
    Object.values(this.addons).forEach(({ initialize }) => initialize())
  }

  /**
   * This method is automatically called on window `load` event and will bind turbo frame events.
   * We have 3 turbo events binding at the moments:
   * 1. `turbo:before-frame-render`: trigger `app.unbindEvents` on XHR response right before frame render,
   * 1. `turbo:frame-load`: trigger `app.bindEvents` on XHR response right after frame load,
   * 1. `turbo:before-visit`: trigger `app.unbindEvents` on XHR before visit navigation,
   * 1. `turbo:load`: trigger `app.initialize` and `app.bindEvents` on XHR visit navigation load,
   * 1. `turbo:frame-missing`: trigger `app.onTurboFrameMissing` on XHR response if the `id` of the turbo frame doesn't exist.
   *
   * Read more: https://turbo.hotwired.dev/reference/events
   */
  bindTurboFrameEvents = () => {
    addEventListener('turbo:before-frame-render', this.unbindEvents)
    addEventListener('turbo:frame-load', this.bindEvents)
    addEventListener('turbo:before-visit', this.unbindEvents)
    addEventListener('turbo:load', () => {
      this.initialize()
      this.bindEvents()
    })
    addEventListener("turbo:frame-missing", this.onTurboFrameMissing)
  }

  /**
   * This method is automatically called on window `load` event and will run each addon's bindEvents method.
   * When using XHR, it can be useful to rerun the bindEvents method on XHR response after DOM modification.
   * @example
   * // To manually bind all addons
   * app.bindEvents()
   * @example
   * // To manually bind a specific addon
   * app.addons.bsTooltips.unbindEvents()
   */
  bindEvents = () => {
    Object.values(this.addons).forEach(({ bindEvents }) => bindEvents())
  }

  /**
   * This method is not called automatically.
   * It runs each addon's unbindEvents method.
   * When using XHR, it can be useful to run the unbindEvents method prior XHR request to edit the DOM.
   * @example
   * // To manually unbind all addons
   * app.unbindEvents()
   * @example
   * // To manually unbind a specific addon
   * app.addons.bsTooltips.unbindEvents()
   */
  unbindEvents = () => {
    Object.values(this.addons).forEach(({ unbindEvents }) => unbindEvents())
  }

  /**
   * Handle server-side errors without a turbo-frame.
   * Default behaviour since turbo 7.2 is to display a full page with the error content.
   * For example, if nginx throws a 504 error because the flask controller did not respond in time,
   * the whole page will be replaced by a generic 504 error message, which is not great in terms of UX.
   * @param {Event} event
   * @example
   * addEventListener("turbo:frame-missing", app.onTurboFrameMissing)
   */
  onTurboFrameMissing = (event) => {
    event.preventDefault()
    const error = new Error(`turbo:frame-missing with status code: ${event.detail.response.status}`)
    console.error(error)
    event.target.textContent = 'Une erreur est survenue'
  }

  /**
   * This method persists the addon state within localStorage.
   * This method is public only so addons have access to it.
   * Addons have a `saveState` method that allow persistence of any addon's state.
   * `_setAppState`, should not be used directly from app.
   * @param {string} name - addon name
   * @param {any} value - addon state
   * @private
   */
  _setAppState = (name, value) => {
    localStorage.setItem(
      PcBackofficeApp.LOCALSTORAGE_KEY,
      JSON.stringify({ ...this.appState, [name]: value })
    )
  }

  #rehydrateState = () => {
    this.appState = JSON.parse(localStorage.getItem(PcBackofficeApp.LOCALSTORAGE_KEY) || '{}')
  }
}