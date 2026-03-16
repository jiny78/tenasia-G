export interface Photo {
  id: string;
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

export interface GalleryEvent {
  name: string;
  year: number | null;
  count: number;
}
