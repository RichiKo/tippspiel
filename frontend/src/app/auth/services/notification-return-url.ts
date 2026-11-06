export function notificationReturnUrl(value: string | null): string | null {
  return value &&
    /^\/championship\/[a-zA-Z0-9-]+(?:\?roundId=[a-zA-Z0-9-]+)?$/.test(value)
    ? value
    : null;
}
