import type { NextApiRequest, NextApiResponse } from 'next';
import { Result } from 'types/api';
import { KEIPS } from 'types/misc/keips';

import { fetchAllKEIPS, countKEIPS } from '@helper/sys/misc/keips';
import { currentSession } from '@helper/sys/sessionServer';
import { levels } from '@constants/sys/admin';

/**
 * In this file, MATNET is defined as
 * <last 4 digit of Student ID><last 4 digit of NUSNET ID>
 *
 * eg. Student ID: A1234567R, NUSNET: E0011232
 * eg. 567R1232
 */

/**
 * Fetches the list of KEIPS
 *
 * This is an OWNER level request only
 *
 * @param req NextJS API Request
 * @param res NextJS API Response
 */
const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const session = await currentSession(req, res, null);

  const limitQuery = req.query.limit;
  const skipQuery = req.query.skip;

  let result: Result = {
    status: false,
    error: null,
    msg: '',
  };

  if (
    session !== null &&
    session !== undefined &&
    session.user.admin === levels.OWNER
  ) {
    const limit: number = limitQuery !== undefined ? Number(limitQuery) : 10000;
    const skip: number = skipQuery !== undefined ? Number(skipQuery) : 0;

    const keipsDB: Result = await fetchAllKEIPS(limit, skip);
    const count: number = await countKEIPS();

    const parsedKEIPS: KEIPS[] = [];

    if (keipsDB.status) {
      const keipsDataArr: KEIPS[] = keipsDB.msg;
      if (count > 0) {
        for (let ven = 0; ven < keipsDataArr.length; ven += 1) {
          if (keipsDataArr[ven]) {
            const keipsData: KEIPS = keipsDataArr[ven];
            const contrastingStr: string = keipsData.contrasting ? 'Yes' : 'No';
            const fulfilledStr: string = keipsData.fulfilled ? 'Yes' : 'No';

            const data: KEIPS = {
              matnet: keipsData.matnet,
              topCCA: keipsData.topCCA,
              allCCA: keipsData.allCCA,
              bonusCCA: keipsData.bonusCCA,
              contrasting: keipsData.contrasting,
              OSA: keipsData.OSA,
              osaPercentile: Number(keipsData.osaPercentile.toFixed(2)),
              roomDraw: keipsData.roomDraw,
              semesterStay: keipsData.semesterStay,
              fulfilled: keipsData.fulfilled,
              contrastingStr: contrastingStr,
              fulfilledStr: fulfilledStr,
            };

            parsedKEIPS.push(data);
          }
        }
      }

      result = {
        status: true,
        error: null,
        msg: { count: count, res: parsedKEIPS },
      };
      res.status(200).send(result);
      res.end();
    } else {
      result = {
        status: false,
        error: keipsDB.error,
        msg: { count: 0, res: [] },
      };
      res.status(200).send(result);
      res.end();
    }
  } else {
    result = {
      status: false,
      error: 'Unauthenticated',
      msg: { count: 0, res: [] },
    };
    res.status(200).send(result);
    res.end();
  }
};

export default handler;
