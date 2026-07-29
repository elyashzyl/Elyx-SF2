export function useAutoSave(storageKey: string, getData: () => Record<string, any>, intervalMs = 5000) {
    function save() {
        try {
            localStorage.setItem(storageKey, JSON.stringify(getData()));
        } catch {
            // localStorage quota exceeded or unavailable
        }
    }

    function load(): Record<string, any> | null {
        try {
            const raw = localStorage.getItem(storageKey);
            return raw ? JSON.parse(raw) : null;
        } catch {
            return null;
        }
    }

    function clear() {
        localStorage.removeItem(storageKey);
    }

    let timer: ReturnType<typeof setInterval> | null = null;

    function start() {
        stop();
        timer = setInterval(save, intervalMs);
        window.addEventListener('beforeunload', save);
    }

    function stop() {
        if (timer) clearInterval(timer);
        timer = null;
        window.removeEventListener('beforeunload', save);
    }

    return { save, load, clear, start, stop };
}
