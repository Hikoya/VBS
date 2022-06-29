import type { NextApiRequest, NextApiResponse } from 'next';
import { Result } from 'types/api';
import { CCAAttendance } from 'types/cca/ccaAttendance';

import { currentSession } from '@helper/sys/sessionServer';
import { findCCAbyID } from '@helper/sys/cca/cca';
import {
  countTotalAttendanceHours,
  fetchSpecificCCAAttendanceByUserEmail,
} from '@helper/sys/cca/ccaAttendance';
import { countTotalSessionHoursByCCAID } from '@helper/sys/cca/ccaSession';

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const session = await currentSession(req, res, null);

  let result: Result = {
    status: false,
    error: null,
    msg: '',
  };

  const { id } = req.body;

  if (session !== null && session !== undefined) {
    let totalCCAAttendance: string = '';

    let ccaID: string | undefined;
    if (id !== undefined) {
      ccaID = (id as string).trim();
    }

    const userEmail: string = session.user.email;

    if (ccaID !== undefined && userEmail !== undefined) {
      const ccaDetailsRes: Result = await findCCAbyID(ccaID);
      if (ccaDetailsRes.status && ccaDetailsRes.msg) {
        const ccaDB: Result = await fetchSpecificCCAAttendanceByUserEmail(
          ccaID,
          userEmail,
        );

        if (ccaDB.status) {
          const userAttendanceHours = await countTotalAttendanceHours(
            ccaDB.msg as CCAAttendance[],
          );

          const ccaAttendanceHours: number =
            await countTotalSessionHoursByCCAID(ccaID);

          totalCCAAttendance = `${userAttendanceHours} out of ${ccaAttendanceHours}`;

          result = {
            status: true,
            error: null,
            msg: totalCCAAttendance,
          };

          res.status(200).send(result);
          res.end();
        } else {
          result = {
            status: false,
            error: ccaDB.error,
            msg: '',
          };
          res.status(200).send(result);
          res.end();
        }
      } else {
        result = {
          status: false,
          error: ccaDetailsRes.error,
          msg: '',
        };
        res.status(200).send(result);
        res.end();
      }
    } else {
      result = {
        status: false,
        error: 'Incomplete information',
        msg: [],
      };
      res.status(200).send(result);
      res.end();
    }
  } else {
    result = { status: false, error: 'Unauthenticated', msg: [] };
    res.status(200).send(result);
    res.end();
  }
};

export default handler;
