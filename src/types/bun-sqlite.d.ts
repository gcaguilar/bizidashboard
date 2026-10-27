declare module 'bun:sqlite' {
  export interface DatabaseOptions {
    create?: boolean;
    readonly?: boolean;
    readwrite?: boolean;
    safeIntegers?: boolean;
  }

  export interface Statement<T = unknown> {
    get(...params: unknown[]): T | null;
    all(...params: unknown[]): T[];
    run(...params: unknown[]): {
      changes: number;
      lastInsertRowid: number | bigint;
    };
  }

  export class Database {
    constructor(filename?: string, options?: DatabaseOptions);
    exec(sql: string): void;
    query<T = unknown>(sql: string): Statement<T>;
    prepare<T = unknown>(sql: string): Statement<T>;
    transaction<T>(fn: () => T): () => T;
    close(): void;
  }
}
