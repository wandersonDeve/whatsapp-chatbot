export class CreateSchedulerDto {
  version: string;
  book: string;
  chapter: number;
  verse: number;
  publication_date: Date;
  file_url?: string;
}
