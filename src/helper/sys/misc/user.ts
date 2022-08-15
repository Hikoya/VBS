import { prisma } from '@constants/sys/db';
import { levels } from '@constants/sys/admin';

import { User } from 'types/misc/user';
import { Result } from 'types/api';
import { Session } from 'next-auth/core/types';

import { checkerString } from '@constants/sys/helper';

import { logger } from '@helper/sys/misc/logger';
/**
 * Finds all User records filtered by email address
 *
 * @param email Email address of the user
 * @returns A Result containing the status wrapped in a Promise
 */
export const fetchUserByEmail = async (
  email: string,
  session: Session,
): Promise<Result> => {
  let result: Result = { status: false, error: null, msg: '' };
  try {
    const userFromDB: User = await prisma.users.findUnique({
      where: {
        email: email,
      },
    });

    if (userFromDB) {
      result = { status: true, error: null, msg: userFromDB };
    } else {
      result = { status: false, error: 'Failed to fetch user', msg: null };
    }
  } catch (error) {
    console.error(error);
    result = { status: false, error: 'Failed to fetch user', msg: null };
    if (checkerString(email)) {
      await logger(
        `fetchUserByEmail - ${email}`,
        session.user.email,
        error.message,
      );
    }
  }

  return result;
};

/**
 * Accepts the terms and condition for the user
 *
 * @param data User object
 * @returns A Result containing the status wrapped in a Promise
 */
export const acceptTermsForUser = async (
  data: User,
  session: Session,
): Promise<Result> => {
  let result: Result = { status: false, error: null, msg: '' };
  try {
    const user: User = await prisma.users.update({
      where: {
        id: data.id,
      },
      data: {
        acceptedTerm: true,
      },
    });

    if (user) {
      if (data.id !== undefined && checkerString(data.id)) {
        await logger(
          `acceptTermsForUser - ${data.id}`,
          session.user.email,
          `Successfully accepted terms for ${user.name}`,
        );
      }
      result = {
        status: true,
        error: '',
        msg: `Successfully accepted terms for ${user.name}`,
      };
    } else {
      if (data.id !== undefined && checkerString(data.id)) {
        await logger(
          `acceptTermsForUser - ${data.id}`,
          session.user.email,
          'Failed to accepted terms for user',
        );
      }
      result = {
        status: false,
        error: 'Failed to accepted terms for user',
        msg: '',
      };
    }
  } catch (error) {
    console.error(error);
    result = {
      status: false,
      error: 'Failed to accepted terms for user',
      msg: '',
    };
    if (data.id !== undefined && checkerString(data.id)) {
      await logger(
        `acceptTermsForUser - ${data.id}`,
        session.user.email,
        error.message,
      );
    }
  }

  return result;
};

/**
 * Creates a new User
 *
 * @param data User Object
 * @returns A Result containing the status wrapped in a Promise
 */
export const createUser = async (
  data: User,
  session: Session,
): Promise<Result> => {
  let result: Result = { status: false, error: null, msg: '' };
  try {
    const user: User = await prisma.users.create({
      data: data,
    });

    if (user) {
      await logger(
        'createUser',
        session.user.email,
        'Successfully created user',
      );
      result = { status: true, error: null, msg: 'Successfully created user' };
    } else {
      if (checkerString(data.email)) {
        await logger(
          `createUser - ${data.email}`,
          session.user.email,
          'Failed to create user',
        );
      }
      result = { status: false, error: 'Failed to create user', msg: '' };
    }
  } catch (error) {
    console.error(error);
    result = { status: false, error: 'Failed to create user', msg: '' };
    if (checkerString(data.email)) {
      await logger(
        `createUser - ${data.email}`,
        session.user.email,
        error.message,
      );
    }
  }

  return result;
};

/**
 * Populates the list of User read from a CSV file
 *
 * 1. The specific User record is fetched
 * 2. If the record is available, the record is updated
 * 3. If the record cannot be found, a new record is created.
 *
 * @param dataField File content
 * @returns A Result containing the status wrapped in a Promise
 */
export const createUserFile = async (
  dataField: any[],
  session: Session,
): Promise<Result> => {
  let result: Result = { status: false, error: null, msg: '' };

  let count: number = 0;
  let totalCount: number = 0;

  try {
    for (let key = 0; key < dataField.length; key += 1) {
      if (dataField[key]) {
        const data = dataField[key];
        totalCount += 1;

        const name: string = data.name !== undefined ? data.name : '';
        const email: string = data.email !== undefined ? data.email : '';
        const admin: number =
          data.admin !== undefined ? Number(data.admin) : levels.USER;
        const studentID: string =
          data.studentID !== undefined ? data.studentID : '';
        const roomNum: string = data.roomNum !== undefined ? data.roomNum : '';

        if (checkerString(name) && checkerString(email)) {
          const userData: User = {
            name: name.trim(),
            email: email.trim().toLowerCase(),
            admin: admin,
            studentID: studentID.trim(),
            roomNum: roomNum.trim(),
          };

          await prisma.users.upsert({
            where: {
              email: userData.email,
            },
            update: {},
            create: {
              email: userData.email,
              name: userData.name,
              admin: userData.admin,
              studentID: userData.studentID,
              roomNum: userData.roomNum,
            },
          });

          count += 1;
        }
      }
    }

    await logger(
      'createUserFile',
      session.user.email,
      `Successfully created ${count} User records out of total ${totalCount}`,
    );
    result = {
      status: true,
      error: null,
      msg: `Successfully created ${count} User records out of total ${totalCount}`,
    };
  } catch (error) {
    console.error(error);
    result = { status: false, error: 'Failed to create user', msg: '' };
    await logger('createUserFile', session.user.email, error.message);
  }
  return result;
};

/**
 * Counts the total of User records available
 *
 * @returns Total number of User record wrapped in a Promise
 */
export const countUser = async (session: Session): Promise<number> => {
  let count: number = 0;
  try {
    count = await prisma.users.count();
  } catch (error) {
    console.error(error);
    await logger('countUser', session.user.email, error.message);
  }

  return count;
};

/**
 * Finds all User records
 *
 * @param limit Number of total records to fetch. Defaults to 100000
 * @param skip Number of records to skip. Defaults to 0
 * @returns A Result containing the list of User records wrapped in a Promise
 */
export const fetchAllUser = async (
  limit: number = 100000,
  skip: number = 0,
  session: Session,
): Promise<Result> => {
  let result: Result = { status: false, error: null, msg: '' };
  try {
    const users: User[] = await prisma.users.findMany({
      skip: skip * limit,
      take: limit,
    });

    if (users) {
      result = { status: true, error: null, msg: users };
    } else {
      result = { status: false, error: 'Failed to fetch user', msg: [] };
    }
  } catch (error) {
    console.error(error);
    result = { status: false, error: 'Failed to fetch user', msg: [] };
    await logger('fetchAllUser', session.user.email, error.message);
  }

  return result;
};

/**
 * Edit a User
 *
 * @param data User Object
 * @returns A Result containing the status wrapped in a Promise
 */
export const editUser = async (
  data: User,
  session: Session,
): Promise<Result> => {
  let result: Result = { status: false, error: null, msg: '' };
  try {
    const user: User = await prisma.users.update({
      where: {
        id: data.id,
      },
      data: data,
    });

    if (user) {
      if (data.id !== undefined && checkerString(data.id)) {
        await logger(
          `editUser - ${data.id}`,
          session.user.email,
          `Successfully updated ${user.name}`,
        );
      }
      result = {
        status: true,
        error: '',
        msg: `Successfully updated ${user.name}`,
      };
    } else {
      if (data.id !== undefined && checkerString(data.id)) {
        await logger(
          `editUser - ${data.id}`,
          session.user.email,
          'Failed to update user',
        );
      }
      result = { status: false, error: 'Failed to update user', msg: '' };
    }
  } catch (error) {
    console.error(error);
    result = { status: false, error: 'Failed to update user', msg: '' };
    if (data.id !== undefined && checkerString(data.id)) {
      await logger(`editUser - ${data.id}`, session.user.email, error.message);
    }
  }

  return result;
};
