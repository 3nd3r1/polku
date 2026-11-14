export class ActionError extends Error {
  constructor(
    message: string,
    readonly status: 403 | 404 | 409 | 422 | 429,
  ) {
    super(message);
  }
}
