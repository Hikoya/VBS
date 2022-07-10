import type { NextApiRequest, NextApiResponse } from 'next';
import { Result } from 'types/api';
import { BookingRequest } from 'types/vbs/bookingReq';

import { currentSession } from '@helper/sys/sessionServer';
import {
  findBookingByID,
  isApproved,
  isCancelled,
  isRejected,
  setReject,
} from '@helper/sys/vbs/bookingReq';
import { deleteVenueBooking } from '@helper/sys/vbs/booking';

import { checkerString, convertSlotToArray } from '@constants/sys/helper';
import { levels } from '@constants/sys/admin';

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const session = await currentSession(req, res, null);

  let result: Result = {
    status: false,
    error: null,
    msg: '',
  };

  const { id, reason } = req.body;
  if (
    session !== undefined &&
    session !== null &&
    (session.user.admin === levels.ADMIN || session.user.admin === levels.OWNER)
  ) {
    if (checkerString(id) && checkerString(reason)) {
      const bookingID: string = (id as string).trim();
      const reasonField: string = (reason as string).trim();
      const bookingRequest: BookingRequest | null = await findBookingByID(
        bookingID,
      );

      if (bookingRequest !== null) {
        const isRequestApproved = await isApproved(bookingRequest);
        const isRequestCancelled = await isCancelled(bookingRequest);
        const isRequestRejected = await isRejected(bookingRequest);

        if (isRequestApproved) {
          const timeSlots: number[] = convertSlotToArray(
            bookingRequest.timeSlots,
            true,
          ) as number[];

          const deleteBooking = await deleteVenueBooking(
            bookingRequest,
            timeSlots,
          );

          if (!deleteBooking.status) {
            result = {
              status: false,
              error: deleteBooking.error,
              msg: '',
            };
            res.status(200).send(result);
            res.end();
          } else {
            const reject: Result = await setReject(bookingRequest, reasonField);
            if (reject.status) {
              result = {
                status: true,
                error: null,
                msg: 'Booking request rejected',
              };
              res.status(200).send(result);
              res.end();
            } else {
              result = {
                status: false,
                error: reject.error,
                msg: '',
              };
              res.status(200).send(result);
              res.end();
            }
          }
        } else if (isRequestCancelled) {
          result = {
            status: false,
            error: 'Request already cancelled!',
            msg: '',
          };
          res.status(200).send(result);
          res.end();
        } else if (isRequestRejected) {
          result = {
            status: false,
            error: 'Request already rejected!',
            msg: '',
          };
          res.status(200).send(result);
          res.end();
        } else {
          const reject: Result = await setReject(bookingRequest, reasonField);
          if (reject.status) {
            result = {
              status: true,
              error: null,
              msg: 'Booking request rejected',
            };
            res.status(200).send(result);
            res.end();
          } else {
            result = {
              status: false,
              error: reject.error,
              msg: '',
            };
            res.status(200).send(result);
            res.end();
          }
        }
      } else {
        result = { status: false, error: 'No booking found', msg: '' };
        res.status(200).send(result);
        res.end();
      }
    } else {
      result = { status: false, error: 'No booking ID found', msg: '' };
      res.status(200).send(result);
      res.end();
    }
  } else {
    result = { status: false, error: 'Unauthenticated request', msg: '' };
    res.status(200).send(result);
    res.end();
  }
};

export default handler;
