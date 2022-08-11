import type { NextApiRequest, NextApiResponse } from 'next';
import { Result } from 'types/api';
import { CCASession } from 'types/cca/ccaSession';
import { CCAAttendance } from 'types/cca/ccaAttendance';

import { currentSession } from '@helper/sys/sessionServer';
import { findCCAbyID } from '@helper/sys/cca/cca';
import { isLeader } from '@helper/sys/cca/ccaRecord';
import {
  editSession,
  isConflict,
  lockSession,
} from '@helper/sys/cca/ccaSession';
import { editAttendance, removeDuplicate } from '@helper/sys/cca/ccaAttendance';

import {
  isValidDate,
  compareDate,
  convertDateToUnix,
  fetchCurrentDate,
  dateISO,
} from '@constants/sys/date';

/**
 * Edit the CCA session
 *
 * Used in:
 * @components/sys/cca/SessionEditConfirmationModal
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

  const { data } = req.body;

  if (session !== null && session !== undefined) {
    if (data !== null && data !== undefined) {
      const parsedData: CCASession = data as CCASession;
      const editable: boolean = parsedData.editable
        ? parsedData.editable === true
        : false;

      if (parsedData.date !== undefined) {
        const currentDate: number = convertDateToUnix(
          dateISO(fetchCurrentDate()),
        );
        const sessionDate: number = parsedData.date;
        const threshold: number =
          process.env.SESSION_EDITABLE_DAY !== undefined
            ? Number(process.env.SESSION_EDITABLE_DAY)
            : 14;

        if (
          sessionDate <= currentDate &&
          !compareDate(sessionDate, threshold)
        ) {
          let lockSessionSuccess = true;
          if (editable) {
            const lockRes: Result = await lockSession(parsedData, session);
            if (!lockRes.status) {
              lockSessionSuccess = false;
              result = {
                status: false,
                error: lockRes.error,
                msg: '',
              };
              res.status(200).send(result);
              res.end();
            }
          }

          if (lockSessionSuccess) {
            const msg = `Session edit only possible ${threshold} day(s) before`;
            result = {
              status: false,
              error: msg,
              msg: '',
            };
            res.status(200).send(result);
            res.end();
          }
        } else {
          const findCCA: Result = await findCCAbyID(parsedData.ccaID, session);
          if (findCCA.status && findCCA.msg) {
            if (editable) {
              const ldrRes: Result = await isLeader(parsedData.ccaID, session);
              if (ldrRes.status && ldrRes.msg) {
                const expectedM: string =
                  parsedData && parsedData.expectedM
                    ? parsedData.expectedM.trim()
                    : '';

                const expectedMName: string =
                  parsedData && parsedData.expectedMName
                    ? parsedData.expectedMName.trim()
                    : '';

                const sessionData: CCASession = {
                  id: parsedData.id?.trim(),
                  ccaID: parsedData.ccaID.trim(),
                  date: parsedData.date,
                  name: parsedData.name.trim(),
                  time: parsedData.time.trim(),
                  optional: parsedData.optional === true,
                  remarks: parsedData.remarks?.trim(),
                  ldrNotes: parsedData.ldrNotes?.trim(),
                  expectedM: expectedM.trim(),
                  expectedMName: expectedMName.trim(),
                  updated_at: new Date().toISOString(),
                };

                const findSessRes: boolean = await isConflict(
                  sessionData,
                  session,
                );
                if (findSessRes) {
                  result = {
                    status: false,
                    error: 'A session already exist within the timing',
                    msg: '',
                  };
                  res.status(200).send(result);
                  res.end();
                } else {
                  let success: boolean = true;
                  const editSessionRes: Result = await editSession(
                    sessionData,
                    session,
                  );
                  if (editSessionRes.status) {
                    if (parsedData && parsedData.realityM !== undefined) {
                      let canEdit = false;

                      if (parsedData.dateStr !== undefined) {
                        const day: Date = new Date(parsedData.dateStr);
                        if (isValidDate(day)) {
                          if (day <= new Date()) {
                            canEdit = true;
                          }
                        }
                      }

                      if (canEdit) {
                        const parsedRealityData: CCAAttendance[] = JSON.parse(
                          parsedData.realityM,
                        );

                        if (
                          parsedRealityData.length > 0 &&
                          parsedData.id !== undefined
                        ) {
                          if (parsedRealityData.length > 0) {
                            const editRes: Result = await editAttendance(
                              parsedData.id,
                              removeDuplicate(parsedRealityData),
                              session,
                            );
                            if (!editRes.status) {
                              success = false;

                              result = {
                                status: false,
                                error: editRes.error,
                                msg: '',
                              };
                              res.status(200).send(result);
                              res.end();
                            }
                          }
                        }
                      }
                    }

                    if (success) {
                      result = {
                        status: true,
                        error: null,
                        msg: editSessionRes.msg,
                      };
                      res.status(200).send(result);
                      res.end();
                    }
                  } else {
                    result = {
                      status: false,
                      error: editSessionRes.error,
                      msg: '',
                    };
                    res.status(200).send(result);
                    res.end();
                  }
                }
              } else {
                result = {
                  status: false,
                  error: 'Not a CCA leader',
                  msg: '',
                };
                res.status(200).send(result);
                res.end();
              }
            } else {
              result = {
                status: false,
                error: 'Session not editable',
                msg: '',
              };
              res.status(200).send(result);
              res.end();
            }
          } else {
            result = {
              status: false,
              error: 'Invalid CCA ID',
              msg: '',
            };
            res.status(200).send(result);
            res.end();
          }
        }
      } else {
        result = {
          status: false,
          error: 'Incomplete information',
          msg: '',
        };
        res.status(200).send(result);
        res.end();
      }
    } else {
      result = {
        status: false,
        error: 'Incomplete information',
        msg: '',
      };
      res.status(200).send(result);
      res.end();
    }
  } else {
    result = {
      status: false,
      error: 'Unauthenticated',
      msg: '',
    };
    res.status(200).send(result);
    res.end();
  }
};

export default handler;
