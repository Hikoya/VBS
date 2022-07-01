import type { NextApiRequest, NextApiResponse } from 'next';
import { Result } from 'types/api';
import { User } from 'types/misc/user';

import { checkerString } from '@constants/sys/helper';

import { currentSession } from '@helper/sys/sessionServer';
import { createUser } from '@helper/sys/misc/user';

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const session = await currentSession(req, res, null);

  let result: Result = {
    status: false,
    error: null,
    msg: '',
  };

  const { name, email, roomNum, studentID, admin } = req.body;

  if (session !== undefined && session !== null && session.user.admin) {
    if (
      checkerString(name) &&
      checkerString(email) &&
      checkerString(roomNum) &&
      checkerString(studentID)
    ) {
      const nameField: string = (name as string).trim();
      const emailField: string = (email as string).trim().toLowerCase();
      const roomNumField: string = (roomNum as string).trim();
      const studentIDField: string = (studentID as string).trim();
      const adminField: boolean = (admin as boolean) === true;

      const user: User = {
        name: nameField,
        email: emailField,
        roomNum: roomNumField,
        studentID: studentIDField,
        admin: adminField,
      };

      const userRes = await createUser(user);
      if (userRes.status) {
        result = { status: true, error: null, msg: userRes.msg };
        res.status(200).send(result);
        res.end();
      } else {
        result = { status: false, error: userRes.error, msg: '' };
        res.status(200).send(result);
        res.end();
      }
    } else {
      result = { status: false, error: 'Missing information', msg: '' };
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
