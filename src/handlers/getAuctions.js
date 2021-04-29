import AWS from 'aws-sdk';
import validator from '@middy/validator';
import commonMiddleware from '../lib/commonMiddleware';
import createError from 'http-errors';
import getAuctionsSchema from '../lib/schemas/getAuctions.schema';

const dynamodb = new AWS.DynamoDB.DocumentClient();


export async function getAuctionByStatus(status) {
  let auctions;

  const params = {
    TableName: process.env.AUCTIONS_TABLE_NAME,
    IndexName: 'statusAndEndDate',
    KeyConditionExpression: '#status = :status',
    ExpressionAttributeValues: {
      ':status': status,
    },
    ExpressionAttributeNames: {
      '#status': 'status',
    }
  };

  try {
    const res = await dynamodb.query(params).promise();

    auctions = res.Items;
  } catch(e){
    console.error(e);
    throw new createError.InternalServerError(e);
  }

  return auctions;
}

async function getAuctions(event, context) {
  const { status } = event.queryStringParameters;

  const auctions = await getAuctionByStatus(status);

  return {
    statusCode: 200,
    body: JSON.stringify(auctions),
  };
}

export const handler = commonMiddleware(getAuctions)
  .use(validator({ inputSchema: getAuctionsSchema }));


