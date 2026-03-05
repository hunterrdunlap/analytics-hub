const { getById, putItem, deleteItem, queryByIndex, scan } = require('../shared/dynamodb');
const { success, error } = require('../shared/response');
const { generateId } = require('../shared/id-generator');

const TABLE_NAME = process.env.TABLE_NAME;

exports.handler = async (event) => {
  const method = event.requestContext.http.method;
  const id = event.pathParameters?.id;

  try {
    switch (method) {
      case 'GET':
        return await handleGet(id, event.queryStringParameters);
      case 'POST':
        return await handlePost(JSON.parse(event.body));
      case 'PUT':
        return await handlePut(id, JSON.parse(event.body));
      case 'DELETE':
        return await handleDelete(id);
      default:
        return error('Method not allowed', 405);
    }
  } catch (err) {
    console.error('Error:', err);
    return error(err.message || 'Internal server error', 500);
  }
};

async function handleGet(id, queryParams) {
  if (id) {
    const item = await getById(TABLE_NAME, id);
    if (!item) return error('Project not found', 404);
    return success(item);
  }

  let items;
  if (queryParams?.divisionId) {
    items = await queryByIndex(TABLE_NAME, 'divisionId-index', 'divisionId', queryParams.divisionId);
  } else {
    items = await scan(TABLE_NAME);
  }

  items.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  return success(items);
}

async function handlePost(body) {
  const item = {
    id: generateId('proj'),
    name: (body.name || '').trim(),
    divisionId: body.divisionId,
    isActive: true,
    dateCreated: new Date().toISOString()
  };

  await putItem(TABLE_NAME, item);
  return success(item, 201);
}

async function handlePut(id, body) {
  if (!id) return error('ID is required');
  const item = { ...body, id };
  await putItem(TABLE_NAME, item);
  return success(item);
}

async function handleDelete(id) {
  if (!id) return error('ID is required');
  await deleteItem(TABLE_NAME, id);
  return success({ message: 'Deleted successfully' });
}
