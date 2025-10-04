export class Logger {
    private static prefix = "[Miku Share]";
    
    public static log(...args: any[]) {
        console.log(this.prefix, ...args);
    }
    
    public static error(...args: any[]) {
        console.error(this.prefix, ...args);
    }

    public static warn(...args: any[]) {
        console.warn(this.prefix, ...args);
    }
}