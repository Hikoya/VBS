import { prisma } from '@constants/sys/db';

import { User } from '@root/src/types/misc/user';
import { Result } from 'types/api';

export const fetchUserByEmail = async (email: string): Promise<Result> => {
  let result: Result = { status: false, error: null, msg: '' };
  try {
    const userFromDB: User = await prisma.users.findUnique({
      where: {
        email: email,
      },
    });
    result = { status: true, error: null, msg: userFromDB };
  } catch (error) {
    console.error(error);
    result = { status: false, error: error.toString(), msg: '' };
  }

  return result;
};

export const createUser = async (data: User): Promise<Result> => {
  let result: Result = { status: false, error: null, msg: '' };
  try {
    const user: User = await prisma.users.create({
      data: data,
    });

    if (user) {
      result = { status: true, error: null, msg: 'Successfully created user' };
    } else {
      result = { status: false, error: 'Failed to create user', msg: '' };
    }
  } catch (error) {
    console.error(error);
    result = { status: false, error: error.toString(), msg: '' };
  }

  return result;
};

export const countUser = async (): Promise<number> => {
  let count: number = 0;
  try {
    count = await prisma.users.count();
  } catch (error) {
    console.error(error);
  }

  return count;
};

export const fetchAllUser = async (
  limit: number,
  skip: number,
): Promise<Result> => {
  let result: Result = { status: false, error: null, msg: '' };
  try {
    const users: User[] = await prisma.users.findMany({
      skip: skip * limit,
      take: limit,
    });
    result = { status: true, error: null, msg: users };
  } catch (error) {
    console.error(error);
    result = { status: false, error: error.toString(), msg: '' };
  }

  return result;
};

export const editUser = async (data: User): Promise<Result> => {
  let result: Result = { status: false, error: null, msg: '' };
  try {
    const user: User = await prisma.users.update({
      where: {
        id: data.id,
      },
      data: data,
    });

    if (user) {
      result = {
        status: true,
        error: '',
        msg: `Successfully updated ${user.name}`,
      };
    } else {
      result = { status: false, error: 'Failed to update user', msg: '' };
    }
  } catch (error) {
    console.error(error);
    result = { status: false, error: error.toString(), msg: '' };
  }

  return result;
};
