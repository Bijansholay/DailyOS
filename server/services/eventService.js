import { eventsDb } from '../db/eventsDb.js';

export const eventService = {
  async getEvents({ userId, from, to }) {
    return await eventsDb.getEvents({ userId, from, to });
  },

  async createEvent(userId, eventData) {
    if (!eventData || !eventData.title || !eventData.event_date) {
      throw { status: 400, message: 'Event title and date are required.' };
    }
    return await eventsDb.createEvent({
      ...eventData,
      user_id: userId
    });
  },

  async deleteEvent(eventId, userId) {
    const result = await eventsDb.deleteEvent(eventId, userId);
    if (!result) {
      throw { status: 404, message: 'Event not found or unauthorized' };
    }
    return result;
  }
};
