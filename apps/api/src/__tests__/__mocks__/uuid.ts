// Mock for uuid module to avoid ESM issues in Jest
let counter = 0;

export const v4 = (): string => {
  counter++;
  return `00000000-0000-0000-0000-${String(counter).padStart(12, '0')}`;
};

export const validate = (uuid: string): boolean => {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(uuid);
};

export const version = (_uuid: string): number => {
  return 4;
};
