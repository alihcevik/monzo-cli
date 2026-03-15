export class MonzoConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MonzoConfigError";
  }
}

export class MonzoAuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MonzoAuthError";
  }
}

export class MonzoApiError extends Error {
  public status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "MonzoApiError";
    this.status = status;
  }
}
