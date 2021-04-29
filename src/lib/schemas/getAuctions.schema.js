const schema = {
  type: "object",
  properties: {
    queryStringParameters: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          enum: ['OPEN','CLOSED'],
        },
      },
    },
  },
  required: [
    'queryStringParameters',
  ],
};

export default schema;