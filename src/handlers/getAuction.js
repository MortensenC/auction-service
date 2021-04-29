import AWS from 'aws-sdk';
import commonMiddleware from '../lib/commonMiddleware';
import createError from 'http-errors';

const dynamodb = new AWS.DynamoDB.DocumentClient();


export async function getAuctionById(id) {
  let auction;

  try {
    const res = await dynamodb.get({
      TableName: process.env.AUCTIONS_TABLE_NAME,
      Key: { id },
    }).promise();

    auction = res.Item;
  } catch(e){
    console.error(e);
    throw new createError.InternalServerError(e);
  }

  if (!auction) {
      throw new createError.NotFound(`Auction with ID:${id} not found.`);
  }

  return auction;
}

async function getAuction(event, context) {
  const { id } = event.pathParameters;

  const auction = await getAuctionById(id);

  return {
    statusCode: 200,
    body: JSON.stringify(auction),
  };
}

export const handler = commonMiddleware(getAuction);


