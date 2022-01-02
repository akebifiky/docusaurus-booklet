import spinnerCatalog, { Spinner, SpinnerName } from "cli-spinners";
import logUpdate from "log-update";

/**
 * CLI loader
 */
export class Loader {
  private intervalID?: NodeJS.Timer;
  private message?: string;
  private spinner: Spinner;
  private index = 0;

  /**
   * Create new loader
   * @param spinnerName The spinner name supported in cli-spinners
   */
  public constructor(spinnerName?: SpinnerName) {
    this.spinner = spinnerCatalog[spinnerName || "dots"];
  }

  /**
   * Start loading
   * @param message The loading message
   */
  public start(message?: string): void {
    this.message = message;
    this.intervalID = setInterval(() => {
      const { frames } = this.spinner;
      logUpdate(`${frames[this.index]} ${this.message}`);
      this.index = ++this.index % frames.length;
    }, this.spinner.interval);
  }

  /**
   * Update message
   * @param message A new loading message
   */
  public update(message: string) {
    this.message = message;
  }

  /**
   * Stop loading
   * @param message The complete message
   */
  public stop(message?: string): void {
    this.intervalID && clearInterval(this.intervalID);
    logUpdate.clear();
    message && console.log(message);
  }
}
