export interface ScheduleDay {
  dayOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 = Sun, 1 = Mon ... 6 = Sat
  openTime: string; // "10:00"
  closeTime: string; // "22:00"
  isClosed: boolean;
}

export class StoreSchedule {
  readonly days: ScheduleDay[];
  readonly displayTextRu: string;
  readonly displayTextKz: string;

  constructor(
    days: ScheduleDay[],
    displayTextRu: string,
    displayTextKz: string
  ) {
    this.days = days;
    this.displayTextRu = displayTextRu;
    this.displayTextKz = displayTextKz;
  }

  isOpenAt(date: Date): boolean {
    const dayOfWeek = date.getDay() as 0 | 1 | 2 | 3 | 4 | 5 | 6;
    const schedule = this.days.find(d => d.dayOfWeek === dayOfWeek);
    if (!schedule || schedule.isClosed) return false;

    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const current = `${hours}:${minutes}`;
    return current >= schedule.openTime && current <= schedule.closeTime;
  }

  static defaultAlmatyDaily(): StoreSchedule {
    const days: ScheduleDay[] = [0, 1, 2, 3, 4, 5, 6].map(d => ({
      dayOfWeek: d as 0 | 1 | 2 | 3 | 4 | 5 | 6,
      openTime: '10:00',
      closeTime: '22:00',
      isClosed: false
    }));
    return new StoreSchedule(days, 'Ежедневно с 10:00 до 22:00', 'Күн сайын 10:00-ден 22:00-ге дейін');
  }
}
