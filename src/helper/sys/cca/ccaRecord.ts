import { Result } from 'types/api';
import { CCARecord } from 'types/cca/ccaRecord';
import { CCA } from 'types/cca/cca';
import { Session } from 'next-auth/core/types';

import { prisma } from '@constants/sys/db';
import { checkerString } from '@constants/sys/helper';

import { findCCAbyName } from '@helper/sys/cca/cca';
import { fetchUserByEmail } from '@helper/sys/misc/user';
import { logger } from '@helper/sys/misc/logger';
/**
 * Finds all CCA Records filtered by the user email
 *
 * @param email Email address of the user
 * @returns A Result containing the status wrapped in a Promise
 */
export const fetchAllCCARecordByUserEmail = async (
  email: string,
  session: Session,
): Promise<Result> => {
  let result: Result = { status: false, error: null, msg: '' };

  try {
    const query: CCARecord[] = await prisma.cCARecord.findMany({
      where: {
        sessionEmail: email,
      },
      distinct: ['ccaID'],
    });

    if (query) {
      result = { status: true, error: null, msg: query };
    } else {
      result = { status: false, error: 'Failed to fetch CCA records', msg: [] };
    }
  } catch (error) {
    console.error(error);
    result = { status: false, error: 'Failed to fetch CCA records', msg: [] };
    await logger(
      'fetchAllCCARecordByUserEmail',
      session.user.email,
      error.message,
    );
  }

  return result;
};

/**
 * Finds all CCA Records filtered by the user email
 *
 * @param session Next-Auth Session object
 * @returns A Result containing the status wrapped in a Promise
 */
export const fetchAllCCARecordByUser = async (
  session: Session,
): Promise<Result> => {
  let result: Result = { status: false, error: null, msg: '' };

  try {
    const query: CCARecord[] = await prisma.cCARecord.findMany({
      where: {
        sessionEmail: session.user.email,
      },
      distinct: ['ccaID'],
    });

    if (query) {
      result = { status: true, error: null, msg: query };
    } else {
      result = { status: false, error: 'Failed to fetch CCA records', msg: [] };
    }
  } catch (error) {
    console.error(error);
    result = { status: false, error: 'Failed to fetch CCA records', msg: [] };
    await logger('fetchAllCCARecordByUser', session.user.email, error.message);
  }

  return result;
};

/**
 * Finds all CCA records filtered by the CCA ID
 *
 * @param id CCA ID
 * @param limit Number of total records to fetch. Defaults to 100000
 * @param skip Number of records to skip. Defaults to 0
 * @returns A Result containing the list of CCA records wrapped in a Promise
 */
export const fetchAllCCARecordByID = async (
  id: string,
  limit: number = 100000,
  skip: number = 0,
  session: Session,
): Promise<Result> => {
  let result: Result = { status: false, error: null, msg: '' };

  try {
    const query: CCARecord[] = await prisma.cCARecord.findMany({
      where: {
        ccaID: id,
      },
      skip: skip * limit,
      take: limit,
      distinct: ['sessionEmail'],
    });

    if (query) {
      result = { status: true, error: null, msg: query };
    } else {
      result = { status: false, error: 'Failed to fetch CCA records', msg: [] };
    }
  } catch (error) {
    console.error(error);
    result = { status: false, error: 'Failed to fetch CCA records', msg: [] };
    await logger('fetchAllCCARecordByID', session.user.email, error.message);
  }

  return result;
};

/**
 * Counts the total of CCA records available filtered by CCA ID
 *
 * @param id CCA ID
 * @returns Total number of records wrapped in a Promise
 */
export const countAllCCARecordByID = async (
  id: string,
  session: Session,
): Promise<number> => {
  let count: number = 0;

  try {
    count = await prisma.cCARecord.count({
      where: {
        ccaID: id,
      },
    });
  } catch (error) {
    console.error(error);
    await logger('countAllCCARecordByID', session.user.email, error.message);
  }

  return count;
};

/**
 * Check whether the user is a CCA Leader of the particular CCA
 *
 * @param ccaID CCA ID
 * @param session Next-Auth Session object
 * @returns A Result containing the status wrapped in a Promise
 */
export const isLeader = async (
  ccaID: string,
  session: Session,
): Promise<Result> => {
  let result: Result = { status: false, error: null, msg: '' };

  try {
    const ldr: CCARecord = await prisma.cCARecord.findFirst({
      where: {
        ccaID: ccaID,
        sessionEmail: session.user.email,
        leader: true,
      },
    });

    if (ldr) {
      result = { status: true, error: null, msg: true };
    } else {
      result = { status: true, error: null, msg: false };
    }
  } catch (error) {
    console.error(error);
    result = { status: false, error: 'Failed to fetch CCA record', msg: '' };
    await logger('isLeader', session.user.email, error.message);
  }

  return result;
};

/**
 * Finds the specific CCA records filtered by CCA ID and user Email
 *
 * @param ccaID CCA ID
 * @param email Email address of the user
 * @returns A Result containing the list of records wrapped in a Promise
 */
export const fetchSpecificCCARecord = async (
  ccaID: string,
  email: string,
  session: Session,
): Promise<Result> => {
  let result: Result = { status: false, error: null, msg: '' };

  try {
    const query: CCARecord = await prisma.cCARecord.findFirst({
      where: {
        ccaID: ccaID,
        sessionEmail: email,
      },
    });

    if (query) {
      result = { status: true, error: null, msg: query };
    } else {
      result = {
        status: false,
        error: 'Failed to fetch CCA records',
        msg: null,
      };
    }
  } catch (error) {
    console.error(error);
    result = { status: false, error: 'Failed to fetch CCA records', msg: null };
    await logger('fetchSpecificCCARecord', session.user.email, error.message);
  }

  return result;
};

/**
 * Edits a CCA Record
 *
 * @param data CCARecord Object
 * @returns A Result containing the status wrapped in a Promise
 */
export const editCCARecord = async (
  data: CCARecord,
  session: Session,
): Promise<Result> => {
  let result: Result = { status: false, error: null, msg: '' };
  try {
    const query: CCARecord = await prisma.cCARecord.update({
      where: {
        id: data.id,
      },
      data: data,
    });

    if (query) {
      result = {
        status: true,
        error: '',
        msg: `Successfully updated record`,
      };
    } else {
      result = { status: false, error: 'Failed to update record', msg: '' };
    }
  } catch (error) {
    console.error(error);
    result = { status: false, error: 'Failed to update record', msg: '' };
    await logger('editCCARecord', session.user.email, error.message);
  }

  return result;
};

/**
 * Creates a CCA Record entry in the database
 *
 * @param data CCARecord Object
 * @returns A Result containing the status wrapped in a Promise
 */
export const createCCARecord = async (
  data: CCARecord,
  session: Session,
): Promise<Result> => {
  let result: Result = { status: false, error: null, msg: '' };
  try {
    const query: CCARecord = await prisma.cCARecord.create({
      data: data,
    });

    if (query) {
      result = {
        status: true,
        error: '',
        msg: `Successfully created record`,
      };
    } else {
      result = { status: false, error: 'Failed to create record', msg: '' };
    }
  } catch (error) {
    console.error(error);
    result = { status: false, error: 'Failed to create record', msg: '' };
    await logger('createCCARecord', session.user.email, error.message);
  }

  return result;
};

/**
 * Populates the list of CCA Records read from a CSV file
 *
 * 1. First, the email of the user is validated against
 * 2. Next, the CCA name is validated against
 * 3. After which, the specific CCA record of the user and the CCA is fetched
 * 4. If the record is available, the record is updated
 * 5. If the record cannot be found, a new record is created.
 *
 * @param dataField File content
 * @returns A Result containing the status wrapped in a Promise
 */
export const createCCARecordFile = async (
  dataField: any[],
  session: Session,
): Promise<Result> => {
  let result: Result = { status: false, error: null, msg: '' };
  let success: boolean = true;

  try {
    for (let key = 0; key < dataField.length; key += 1) {
      if (dataField[key]) {
        const data = dataField[key];

        const ccaName: string = data.ccaName !== undefined ? data.ccaName : '';
        const email: string = data.email !== undefined ? data.email : '';
        const leader: boolean =
          data.leader !== undefined && data.leader === 'yes' ? true : false;

        const userRes: Result = await fetchUserByEmail(email.trim(), session);
        if (userRes.status) {
          if (checkerString(ccaName)) {
            const ccaRes: Result = await findCCAbyName(ccaName.trim(), session);
            if (ccaRes.status) {
              const ccaDetails: CCA = ccaRes.msg as CCA;
              if (ccaDetails && ccaDetails.id !== undefined) {
                const existingRecordsRes: Result = await fetchSpecificCCARecord(
                  ccaDetails.id.trim(),
                  email.trim(),
                  session,
                );
                if (existingRecordsRes.status && existingRecordsRes.msg) {
                  const existingRecords: CCARecord = existingRecordsRes.msg;
                  const userData: CCARecord = {
                    id: existingRecords.id,
                    sessionEmail: email.trim(),
                    ccaID: ccaDetails.id.trim(),
                    leader: leader,
                    updated_at: new Date().toISOString(),
                  };

                  const updateRes: Result = await editCCARecord(
                    userData,
                    session,
                  );
                  if (!updateRes.status) {
                    success = false;
                    result = {
                      status: false,
                      error: updateRes.error,
                      msg: '',
                    };
                    break;
                  }
                } else {
                  const userData: CCARecord = {
                    sessionEmail: email.trim(),
                    ccaID: ccaDetails.id.trim(),
                    leader: leader,
                  };

                  const createRes: Result = await createCCARecord(
                    userData,
                    session,
                  );
                  if (!createRes.status) {
                    success = false;
                    result = {
                      status: false,
                      error: createRes.error,
                      msg: '',
                    };
                    break;
                  }
                }
              }
            } else {
              success = false;
              result = {
                status: false,
                error: `Failed to find CCA ${ccaName.trim()}`,
                msg: '',
              };
              break;
            }
          }
        } else {
          success = false;
          result = {
            status: false,
            error: `Failed to find user ${email.trim()}`,
            msg: '',
          };
          break;
        }
      }
    }

    if (success) {
      result = {
        status: true,
        error: null,
        msg: 'Successfully populated CCA Records',
      };
    }
  } catch (error) {
    console.error(error);
    result = {
      status: false,
      error: 'Failed to populate CCA Records',
      msg: '',
    };
    await logger('createCCARecordFile', session.user.email, error.message);
  }
  return result;
};
