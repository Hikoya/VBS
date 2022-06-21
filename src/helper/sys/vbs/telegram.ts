import TelegramBot from 'node-telegram-bot-api';
import { BookingRequest } from 'types/bookingReq';

const token = process.env.TELEGRAM_BOT_TOKEN;
const channel_id = process.env.TELEGRAM_BOT_CHANNEL_ID;

export const sendMessageToChannel = async (message: string): Promise<void> => {
  if (
    process.env.SEND_TELEGRAM &&
    (process.env.SEND_TELEGRAM === '1' ||
      Number(process.env.SEND_TELEGRAM) === 1)
  ) {
    try {
      const bot = new TelegramBot(token, { polling: true });
      if (bot.isPolling()) {
        bot.sendMessage(channel_id, message).catch((err) => {
          console.error('Channel message not sent', err);
        });
        await bot.stopPolling();
      }
    } catch (error) {
      console.error(error);
    }
  }
};

export const approvalBookingRequestMessageBuilder = (
  bookingRequest: BookingRequest,
): string => {
  const venueName: string = bookingRequest.venue;
  const date: string = bookingRequest.dateStr;
  const timeSlots: string = bookingRequest.timeSlots;
  const cca: string = bookingRequest.cca;

  const returnMessage: string = `[APPROVED]\nCCA: ${cca}\nVenue: ${venueName}\nDate: ${date}\nTimeslot(s): ${timeSlots}`;
  return returnMessage;
};

export const rejectBookingRequestMessageBuilder = (
  bookingRequest: BookingRequest,
): string => {
  const venueName: string = bookingRequest.venue;
  const date: string = bookingRequest.dateStr;
  const timeSlots: string = bookingRequest.timeSlots;
  const cca: string = bookingRequest.cca;

  const returnMessage: string = `[REJECTED]\nCCA: ${cca}\nVenue: ${venueName}\nDate: ${date}\nTimeslot(s): ${timeSlots}`;
  return returnMessage;
};
