import AWS from 'aws-sdk';

const dynamodb = new AWS.DynamoDB.DocumentClient();
const sqs = new AWS.SQS();

export async function closeAuction(auction) {
  const params = {
    TableName: process.env.AUCTIONS_TABLE_NAME,
    Key: { id: auction.id },
    UpdateExpression: 'set #status = :status',
    ExpressionAttributeValues: {
      ':status': 'CLOSED',
    },
    ExpressionAttributeNames: {
      '#status': 'status',
    }
  };

  await dynamodb.update(params).promise();

  const { title, seller, highestBid } = auction;
  const { amount, bidder } = highestBid;
  const sold = !highestBid;

  if (sold){
    const paramsSeller = {
      QueueUrl: process.env.MAIL_QUEUE_URL,
      MessageBody: JSON.stringify({
        subject: 'Your item has been sold!',
        recipient: seller,
        body: `Your item "${title}" has been sold from $${amount}`,
      }),
    };
    const paramsBidder = {
      QueueUrl: process.env.MAIL_QUEUE_URL,
      MessageBody: JSON.stringify({
        subject: 'You won the auction!',
        recipient: bidder,
        body: `You got yourself a "${title}" for $${amount}`,
      }),
    };
    const notifySeller = sqs.sendMessage(paramsSeller).promise();
    const notifyBidder = sqs.sendMessage(paramsBidder).promise();
    return Promise.all([notifySeller, notifyBidder]);
  }
  const paramsSeller = {
    QueueUrl: process.env.MAIL_QUEUE_URL,
    MessageBody: JSON.stringify({
      subject: `Your item has not been sold!`,
      recipient: seller,
      body: `You didn't receive bids for the item "${title}"`,
    }),
  };
  return await sqs.sendMessage(paramsSeller).promise();
}