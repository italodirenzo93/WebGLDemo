import { clamp } from "./math";

export interface IColorRgb {
    r: number;
    g: number;
    b: number;
}

export interface IColorRgba extends IColorRgb {
    a: number;
}

export class Color implements IColorRgba {
    constructor(
        public r = 0,
        public g = 0,
        public b = 0,
        public a = 1,
    ) {
        this.r = clamp(r);
        this.g = clamp(g);
        this.b = clamp(b);
        this.a = clamp(a);
    }

    set(red: number, green: number, blue: number, alpha: number = 1): void {
        this.r = clamp(red);
        this.g = clamp(green);
        this.b = clamp(blue);
        this.a = clamp(alpha);
    }

    toCssString(): string {
        return `rgba(${this.r},${this.g},${this.b},${this.a})`;
    }

    values(): [number, number, number, number] {
        return [this.r, this.g, this.b, this.a];
    }
}

export const Colors = {
    get red(): Color {
        return new Color(1, 0, 0, 1);
    },

    get green(): Color {
        return new Color(0, 1, 0, 1);
    },

    get blue(): Color {
        return new Color(0, 0, 1, 1);
    },

    get black(): Color {
        return new Color();
    },

    get white(): Color {
        return new Color(1, 1, 1, 1);
    },

    get cornflowerBlue(): Color {
        return new Color(0.39, 0.58, 0.92, 1);
    },
};
