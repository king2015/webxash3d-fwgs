export interface RollingBufferOptions {
    maxSize: number
}

export class RollingBuffer<T> {
    private readonly buffer: (T | undefined)[];
    public readonly opts: RollingBufferOptions;
    private head: number = 0; // Points to next write position
    private tail: number = 0; // Points to next read (oldest) position
    private count: number = 0;

    constructor(opts: RollingBufferOptions) {
        this.opts = opts;
        this.buffer = new Array(this.opts.maxSize).fill(null);
    }

    push(item: T): void {
        this.buffer[this.head] = item;
        this.head = (this.head + 1) % this.opts.maxSize;

        if (this.isFull()) {
            this.tail = (this.tail + 1) % this.opts.maxSize;
        } else {
            this.count+=1;
        }
    }

    pull(): T | undefined {
        if (this.isEmpty()) return undefined;

        const item = this.buffer[this.tail];
        this.buffer[this.tail] = undefined;
        this.tail = (this.tail + 1) % this.opts.maxSize;
        this.count-=1;
        return item ?? undefined;
    }

    toArray(): T[] {
        const res = new Array<T>(this.size())
        for (let i = 0; i < this.size(); ++i) {
            res[i] = this.buffer[i]!
        }
        return res
    }

    size(): number {
        return this.count;
    }

    isFull(): boolean {
        return this.count === this.opts.maxSize;
    }

    isEmpty(): boolean {
        return this.count === 0;
    }

    clear(): void {
        this.buffer.fill(undefined);
        this.head = 0;
        this.tail = 0;
        this.count = 0;
    }
}