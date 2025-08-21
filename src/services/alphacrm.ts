import axios, { AxiosError, AxiosInstance } from 'axios';
import { logger } from '~/utils/logger';

const BRANCH_ID = 1;
const DEFAULT_LIMIT = 50;

type CrmLesson = {
  id: number;
  branch_id: number;
  date: string;
  time_from: string;
  time_to: string;
  lesson_type_id: number;
  status: number;
  subject_id: number;
  room_id: number;
  teacher_ids: number[];
  customer_ids: number[];
  group_ids: number[];
  streaming: boolean;
  note: string;
  topic: string;
  homework: string;
  created_at: string;
  updated_at: string;
  regular_id: number;
}

type CrmPagination<T> = {
  total: number;
  count: number;
  page: number;
  items: T[];
}

class AlphacrmService {
  client: AxiosInstance;

  private token: string;

  private availableLessons: CrmLesson[] = [];

  constructor() {
    this.client = axios.create({
      baseURL: 'https://pixikiclub.s20.online/v2api/',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    logger.info('AlphacrmService constructor');

    this.refreshToken().then(() => {
      this.refreshLessons()
      setInterval(() => this.refreshLessons(), 60 * 60 * 1000);
    });
  }

  async queryWithReauth<T>(fn: () => Promise<T>, depth = 0): Promise<T> {
    if (depth > 2) {
      throw new Error('AlphacrmService queryWithReauth error: too many retries to authenticate')
    }
    try {
      return fn();
    } catch (e) {
      console.log('CASE')
      if (e instanceof AxiosError) {
        console.log(e.response?.status)
        if (e.response?.status === 403 || e.response?.status === 401) {
          await this.refreshToken();
          return this.queryWithReauth(fn, depth + 1);
        }
      }
      throw e;
    }
  }

  async refreshToken() {
    try {

      const response = await this.client.post('auth/login', {
        email: process.env.ALPHACRM_EMAIL,
        api_key: process.env.ALPHACRM_KEY,
      });
      this.token = response.data.token;
      logger.info('Alphacrm token refreshed')
    } catch (e) {
      logger.error(`AlphacrmService refreshToken error: ${e}`);
    }
  }

  async getLessonsData(page: number = 0) {
    try {
      const response = await this.queryWithReauth(() => this.client.post<CrmPagination<CrmLesson>>(`${BRANCH_ID}/lesson/index`, {
        page,
        status: 1
      }, {
        headers: {
          'X-ALFACRM-TOKEN': this.token,
        }
      }));
      return response.data;
    } catch (e) {
      logger.error(`AlphacrmService getLessons error: ${e}`);
      throw e;
    }
  }

  async getLessonById(id: number): Promise<CrmLesson | null> {
    try {
      const response = await this.queryWithReauth(() => this.client.post<CrmPagination<CrmLesson>>(`${BRANCH_ID}/lesson/index`, {
        page: 0,
        id,
        status: 1
      }, {
        headers: {
          'X-ALFACRM-TOKEN': this.token,
        }
      }))
      return response.data.items[0] ?? null;
    } catch (e) {
      logger.error(`AlphacrmService getLessons error: ${e}`);
      throw e;
    }
  }

  async addCustomerToLesson(id: number, cusotomerId: number): Promise<CrmLesson> {
    try {
      const lesson = await this.getLessonById(id);
      if (!lesson) {
        throw new Error('AlphacrmService addCustomerToLesson error: lesson not found');
      }
      
      const newCustomerIdsSet = new Set(lesson.customer_ids)
      newCustomerIdsSet.add(cusotomerId)
      console.log(lesson.customer_ids, Array.from(newCustomerIdsSet))

      const response = await this.queryWithReauth(() => this.client.post(`${BRANCH_ID}/lesson/update?id=${id}`, {
        customer_ids: Array.from(newCustomerIdsSet),
      }, {
        headers: {
          'X-ALFACRM-TOKEN': this.token,
        }
      }));
      return lesson;
    } catch (e) {
      logger.error(`AlphacrmService addCustomerToLesson error: ${e}`);
      throw e;
    }
  }
    

  async refreshLessons() {
    try {
      logger.info('Lessons list refreshing...');
      const lessons: CrmLesson[] = [];

      const response = await this.getLessonsData();
      lessons.push(...response.items);

      if (response.total > response.count) {
        for (let i = 1; i <= Math.floor(response.total / DEFAULT_LIMIT); i++) {
          const response = await this.getLessonsData(i);
          lessons.push(...response.items.filter(lesson => !lessons.some(l => l.id === lesson.id)));
        }
      }

      this.availableLessons = lessons;
      logger.info(`Lessons list refreshed, total: ${lessons.length}`);
    } catch (e) {
      logger.error(`AlphacrmService refreshLessons error: ${e}`);
      throw e;
    }
  }

  async createCustomer(params: {
    name: string,
    phone: string,
    email?: string,
    note?: string,
  }) {
    try {
      const response = await this.queryWithReauth(() => this.client.post(`${BRANCH_ID}/customer/create`, {
          name: params.name,
          branch_ids: [BRANCH_ID],
          is_study: 0,
          legal_type: 1,
          phone: [params.phone],
          email: params.email ? [params.email] : undefined,
          note: params.note,
        }, {
          headers: {
            'X-ALFACRM-TOKEN': this.token,
          }
      }));
      return response.data.model as { id: number };
    } catch (e) {
      logger.error(`AlphacrmService createCustomer error: ${e}`);
      throw e;
    }
  }

  getAvailableLessonsBySubjectIds(subjectIds: number[]) {
    return this
      .availableLessons
      .filter(lesson => subjectIds.includes(lesson.subject_id))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }
}

export const alphacrmService = new AlphacrmService();