export function clamp(value: number, max = 1, min = 0): number {
    return Math.min(max, Math.max(min, value));
}

export function randomInt(max = 1, min = 0): number {
    return Math.floor(Math.random() * max) + min;
}
