export default (func: () => void, timeout: number) => {
    let timer: NodeJS.Timeout;
    return (...args: any[]): void => {
        clearTimeout(timer);
        timer = setTimeout(
            () => { func.apply(this, args); },
            timeout
        );
    };
}
