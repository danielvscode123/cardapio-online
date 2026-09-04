const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

const timeFormatter = new Intl.DateTimeFormat('pt-BR', {
  hour: '2-digit',
  minute: '2-digit',
});

export function formatCurrency(value: number) {
  return currencyFormatter.format(value);
}

export function formatTime(value: string) {
  return timeFormatter.format(new Date(value));
}

export function minutesSince(value: string) {
  return Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 60_000));
}
