import { getAuctionById } from './getAuction';
import { uploadPictureToS3 } from '../lib/uploadPictureToS3';
import { setAuctionPictureUrl } from '../lib/setAuctionPictureUrl';
import middy from '@middy/core';
import validator from '@middy/validator';
import httpErrorHandler from '@middy/http-error-handler';
import createError from 'http-errors';
import uploadAuctionPictureSchema from '../lib/schemas/uploadAuctionPicture.schema';
import cors from '@middy/http-cors';

export async function uploadAuctionPicture(event) {
  const { id } = event.pathParameters;
  const { email } = event.requestContext.authorizer;

  const auction = await getAuctionById(id);

  if (auction.seller !== email) {
    throw new createError.Forbidden(`You cannot update an auction that is not yours`);
  }

  const base64 = event.body.replace(/^data:image\/\w+;base64,/, '');
  const buffer = Buffer.from(base64, 'base64');

  let updatedAuction;

  try {
    const pictureUrl = await uploadPictureToS3(auction.id + '.jpeg', buffer);
    updatedAuction = await setAuctionPictureUrl(auction.id, pictureUrl);
  } catch(e) {
    console.error(e);
    throw new createError.InternalServerError(e);
  }

  return {
    statusCode: 200,
    body: JSON.stringify(updatedAuction),
  };
};

export const handler = middy(uploadAuctionPicture)
  .use(httpErrorHandler())
  .use(validator({ inputSchema: uploadAuctionPictureSchema }))
  .use(cors());