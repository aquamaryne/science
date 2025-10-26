/**
 * Утиліта для обробки числових полів вводу
 * Підтримує введення чисел через кому та крапку
 */

/**
 * Нормалізує значення числового поля
 * Замінює кому на крапку для коректної обробки чисел з плаваючою точкою
 * @param value - значення для нормалізації
 * @returns нормалізоване значення
 */
export const normalizeNumberInput = (value: string): string => {
  // Замінюємо кому на крапку
  return value.replace(',', '.');
};

/**
 * Парсить числове значення з підтримкою коми та крапки
 * @param value - значення для парсингу
 * @param defaultValue - значення за замовчуванням, якщо парсинг не вдався
 * @returns числове значення або defaultValue
 */
export const parseNumberInput = (value: string, defaultValue: number = 0): number => {
  const normalized = normalizeNumberInput(value);
  const parsed = parseFloat(normalized);
  return isNaN(parsed) ? defaultValue : parsed;
};

/**
 * Обробник події вставки для числових полів
 * Автоматично замінює кому на крапку при вставці
 * @param e - подія вставки
 * @param onChange - функція зміни значення
 */
export const handleNumberPaste = (
  e: React.ClipboardEvent<HTMLInputElement>,
  onChange: (value: string) => void
) => {
  e.preventDefault();
  const pastedText = e.clipboardData.getData('text');
  const normalized = normalizeNumberInput(pastedText);

  // Отримуємо поточне значення input та позицію курсора
  const input = e.currentTarget;
  const start = input.selectionStart || 0;
  const end = input.selectionEnd || 0;
  const currentValue = input.value;

  // Вставляємо нормалізоване значення в позицію курсора
  const newValue = currentValue.substring(0, start) + normalized + currentValue.substring(end);

  onChange(newValue);

  // Встановлюємо курсор після вставленого тексту
  setTimeout(() => {
    input.selectionStart = input.selectionEnd = start + normalized.length;
  }, 0);
};

/**
 * Обробник події зміни для числових полів
 * Нормалізує значення при введенні
 * @param e - подія зміни
 * @param onChange - функція зміни значення
 */
export const handleNumberChange = (
  e: React.ChangeEvent<HTMLInputElement>,
  onChange: (value: string) => void
) => {
  const normalized = normalizeNumberInput(e.target.value);
  onChange(normalized);
};

/**
 * Обробник події вставки для нативних HTML input
 * Використовується для HTML input (не shadcn/ui Input)
 */
export const handleNativeInputPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
  e.preventDefault();
  const pastedText = e.clipboardData.getData('text');
  const normalized = normalizeNumberInput(pastedText);
  e.currentTarget.value = normalized;
  e.currentTarget.dispatchEvent(new Event('change', { bubbles: true }));
};

/**
 * Обробник події введення для нативних HTML input
 * Нормалізує введення в реальному часі
 */
export const handleNativeInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const normalized = normalizeNumberInput(e.target.value);
  if (normalized !== e.target.value) {
    e.target.value = normalized;
  }
};
