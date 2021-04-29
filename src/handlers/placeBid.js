import AWS from 'aws-sdk';
import validator from '@middy/validator';
import commonMiddleware from '../lib/commonMiddleware';
import createError from 'http-errors';
import { getAuctionById } from './getAuction';
import placeBidSchema from '../lib/schemas/placeBid.schema';

const dynamodb = new AWS.DynamoDB.DocumentClient();

async function placeBid(event, context) {
  const { id } = event.pathParameters;
  const { amount } = event.body;
  const { email } = event.requestContext.authorizer;

  const auction = await getAuctionById(id);

  if (auction.seller === email) {
    throw new createError.Forbidden(`You cannot bid on your own auctions`);
  }

  if (auction.status !== 'OPEN'){
    throw new createError.Forbidden(`You cannot bid on close auctions`);
  }

  if (amount <= auction.highestBid.amount) {
    throw new createError.Forbidden(`Your bid must be higher than ${auction.highestBid.amount}`);
  }

  if (email === auction.highestBid.bidder) {
    throw new createError.Forbidden(`You cannot bid again because you have the highest bid`);
  }

  const params = {
      TableName: process.env.AUCTIONS_TABLE_NAME,
      Key: { id },
      UpdateExpression: 'set highestBid.amount = :amount, highestBid.bidder = :bidder',
      ExpressionAttributeValues: {
          ':amount': amount,
          ':bidder': email,
      },
      ReturnValues: 'ALL_NEW',
  };

  let updatedAuction;

  try {
    const res = await dynamodb.update(params).promise();
    updatedAuction = res.Attributes;
  } catch(e){
    console.error(e);
    throw new createError.InternalServerError(e);
  }

  return {
    statusCode: 200,
    body: JSON.stringify(updatedAuction),
  };
}

export const handler = commonMiddleware(placeBid)
  .use(validator({ inputSchema: placeBidSchema }));


