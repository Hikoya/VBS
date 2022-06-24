import type { NextApiRequest, NextApiResponse } from 'next';
import { Result } from 'types/api';
import { Venue } from 'types/venue';

import { createVenue } from '@helper/sys/vbs/venue';
import { currentSession } from '@helper/sys/session';

import formidable, { IncomingForm } from 'formidable';
import { promises as fs } from 'fs';

export const config = {
  api: {
    bodyParser: false,
  },
};

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const session = await currentSession(req);
  let result: Result = {
    status: false,
    error: null,
    msg: '',
  };

  if (session !== undefined && session !== null && session.user.admin) {
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
      const capacity: number = Number(data.fields.capacity);
      const name: string = (data.fields.name as string).trim();
      const description: string = (data.fields.description as string).trim();
      const isInstantBook: boolean = data.fields.isInstantBook === 'true';
      const visible: boolean = data.fields.visible === 'true';
      const isChildVenue: boolean = data.fields.isChildVenue === 'true';
      const parentVenue: string = isChildVenue
        ? (data.fields.parentVenue as string).trim()
        : '';

      const openingHours: string = (data.fields.openingHours as string).trim();

      const imageFile: formidable.File = data.files.image as formidable.File;
      let venuePath: string = '';

      if (imageFile !== null && imageFile !== undefined) {
        const imagePath = imageFile.filepath;

        venuePath = `/sys/venue/${imageFile.originalFilename?.trim()}`;
        const pathToWriteImage = `public${venuePath}`;
        const image = await fs.readFile(imagePath);
        await fs.writeFile(pathToWriteImage, image);

        const venueData: Venue = {
          capacity: capacity,
          name: name,
          description: description,
          isInstantBook: isInstantBook,
          visible: visible,
          isChildVenue: isChildVenue,
          parentVenue: parentVenue,
          openingHours: openingHours,
          image: venuePath,
        };

        const createVenueRequest: Result = await createVenue(venueData);
        if (createVenueRequest.status) {
          result = {
            status: true,
            error: '',
            msg: `Successfully created ${name}`,
          };
          res.status(200).send(result);
          res.end();
        } else {
          result = {
            status: false,
            error: createVenueRequest.error,
            msg: '',
          };
          res.status(200).send(result);
          res.end();
        }
      } else {
        result = {
          status: false,
          error: 'Please include an image!',
          msg: '',
        };
        res.status(200).send(result);
        res.end();
      }
    } catch (error) {
      console.error(error);
      result = {
        status: false,
        error: `Failed to create ${data.fields.name}`,
        msg: '',
      };
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
