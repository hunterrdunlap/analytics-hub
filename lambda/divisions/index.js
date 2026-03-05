const { success, error } = require('../shared/response');

const DIVISIONS = [
  { id: 'div-reinsurance', name: 'Reinsurance', sortOrder: 0 },
  { id: 'div-real-estate', name: 'Real Estate', sortOrder: 1 },
  { id: 'div-structured-finance', name: 'Structured Finance', sortOrder: 2 }
];

exports.handler = async (event) => {
  const method = event.requestContext.http.method;
  if (method === 'GET') {
    return success(DIVISIONS);
  }
  return error('Method not allowed', 405);
};
