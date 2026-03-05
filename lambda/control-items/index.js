const { getById, putItem, deleteItem, queryByIndex, scan } = require('../shared/dynamodb');
const { success, error } = require('../shared/response');
const { generateId } = require('../shared/id-generator');

const TABLE_NAME = process.env.TABLE_NAME;

const STATUS_ORDER = { overdue: 0, upcoming: 1, current: 2 };

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
    if (!item) return error('Control item not found', 404);
    return success(item);
  }

  let items;
  if (queryParams?.projectId) {
    items = await queryByIndex(TABLE_NAME, 'projectId-index', 'projectId', queryParams.projectId);
  } else {
    items = await scan(TABLE_NAME);
  }

  items.sort((a, b) => (STATUS_ORDER[a.status] ?? 3) - (STATUS_ORDER[b.status] ?? 3));
  return success(items);
}

async function handlePost(body) {
  const item = {
    id: generateId('ctrl'),
    projectId: body.projectId,
    title: (body.title || '').trim(),
    description: (body.description || '').trim(),
    assignee: (body.assignee || '').trim(),
    frequency: body.frequency || 'monthly',
    lastCompleted: body.lastCompleted,
    nextDue: body.nextDue,
    status: body.status || 'current',
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
