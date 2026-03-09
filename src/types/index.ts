export interface Photo {
  id: number;
  url: string;
  person: string | null;
  role: string | null;
  date: string | null;
}

export interface Person {
  name: string;
  role: string | null;
  count: number;
}

export interface DateEntry {
  year: number;
  month: number;
  count: number;
}
