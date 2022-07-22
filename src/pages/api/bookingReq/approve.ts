import type { NextApiRequest, NextApiResponse } from 'next';
import { Result } from 'types/api';
import { BookingRequest } from 'types/vbs/bookingReq';

import { convertSlotToArray, checkerString } from '@constants/sys/helper';

import {
  findBookingByID,
  isConflict,
  isApproved,
  isCancelled,
  isRejected,
  setApprove,
  setRejectConflicts,
} from '@helper/sys/vbs/bookingReq';
import { currentSession } from '@helper/sys/sessionServer';
import { createVenueBooking } from '@helper/sys/vbs/booking';
import { levels } from '@constants/sys/admin';

/**
 * Approves a venue booking request
 *
 * This is an ADMIN level or OWNER level request only.
 *
 * @param req NextJS API Request
 * @param res NextJS API Response
 */
const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const session = await currentSession(req, res, null);

  let result: Result = {
    status: false,
    error: null,
    msg: '',
  };

  const { id } = req.body;
  if (
    session !== undefined &&
    session !== null &&
    (session.user.admin === levels.ADMIN || session.user.admin === levels.OWNER)
  ) {
    if (checkerString(id)) {
      const bookingID: string = (id as string).trim();
      const bookingRequest: BookingRequest | null = await findBookingByID(
        bookingID,
        session,
      );
      if (bookingRequest !== null && bookingRequest !== undefined) {
        const isRequestApproved: boolean = await isApproved(
          bookingRequest,
          session,
        );
        const isRequestCancelled: boolean = await isCancelled(
          bookingRequest,
          session,
        );
        const isRequestRejected: boolean = await isRejected(
          bookingRequest,
          session,
        );

        if (isRequestApproved) {
          result = {
            status: false,
            error: 'Request already approved!',
            msg: '',
          };
          res.status(200).send(result);
          res.end();
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
          const isThereConflict: boolean = await isConflict(
            bookingRequest,
            session,
          );
          const timeSlots: number[] = convertSlotToArray(
            bookingRequest.timeSlots,
            true,
          ) as number[];

          if (!isThereConflict) {
            const approve: Result = await setApprove(bookingRequest, session);
            const cancel: Result = await setRejectConflicts(
              bookingRequest,
              session,
            );

            if (approve.status && cancel.status) {
              const createBooking = await createVenueBooking(
                bookingRequest,
                timeSlots,
                session,
              );

              if (!createBooking.status) {
                result = {
                  status: false,
                  error: createBooking.error,
                  msg: '',
                };
                res.status(200).send(result);
                res.end();
              } else {
                result = {
                  status: true,
                  error: null,
                  msg: createBooking.msg,
                };
                res.status(200).send(result);
                res.end();
              }
            } else {
              result = {
                status: false,
                error: 'Either failed to approve slot or cancel conflicting',
                msg: '',
              };
              res.status(200).send(result);
              res.end();
            }
          } else {
            result = {
              status: false,
              error: 'Conflicts found in booking',
              msg: '',
            };
            res.status(200).send(result);
            res.end();
          }
        }
      } else {
        result = { status: false, error: 'No booking ID found', msg: '' };
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
