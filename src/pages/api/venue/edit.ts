import type { NextApiRequest, NextApiResponse } from 'next';
import { Result } from 'types/api';

import { editVenue } from '@helper/sys/vbs/venue';
import formidable, { IncomingForm } from 'formidable';
import { currentSession } from '@helper/sys/session';

// first we need to disable the default body parser
export const config = {
  api: {
    bodyParser: false,
  },
};

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const session = await currentSession(req);
  let result: Result = null;

  if (session && session.user.admin) {
    const data: { fields: formidable.Fields; files: formidable.Files } =
      await new Promise((resolve, reject) => {
        const form = new IncomingForm();
        form.parse(req, (err, fields, files) => {
          if (err) {
            return reject(err);
          }
          resolve({ fields, files });
          return true;
        });
      });

    try {
      const isChildVenue = data.fields.isChildVenue === 'true';
      const parentVenue = isChildVenue ? data.fields.parentVenue : null;

      const venueData = {
        id: data.fields.id,
        capacity: Number(data.fields.capacity),
        name: data.fields.name,
        description: data.fields.description,
        isInstantBook: data.fields.isInstantBook === 'true',
        visible: data.fields.visible === 'true',
        isChildVenue: isChildVenue,
        parentVenue: parentVenue,
        openingHours: data.fields.openingHours,
      };

      const editVenueRequest = await editVenue(venueData);
      if (editVenueRequest.status) {
        result = {
          status: true,
          error: '',
          msg: `Successfully edited ${data.fields.name}`,
        };
        res.status(200).send(result);
        res.end();
        return;
      }
      result = {
        status: false,
        error: editVenueRequest.error,
        msg: '',
      };
      res.status(200).send(result);
      res.end();
      return;
    } catch (error) {
      console.log(error);
      result = { status: false, error: 'Failed to create venue', msg: '' };
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