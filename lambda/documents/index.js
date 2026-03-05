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
    if (!item) return error('Document not found', 404);
    return success(item);
  }

  let items;
  if (queryParams?.projectId) {
    items = await queryByIndex(TABLE_NAME, 'projectId-index', 'projectId', queryParams.projectId);
  } else {
    items = await scan(TABLE_NAME);
  }

  if (queryParams?.category) {
    items = items.filter(item => item.category === queryParams.category);
  }

  items.sort((a, b) => (b.dateAdded || '').localeCompare(a.dateAdded || ''));
  return success(items);
}

async function handlePost(body) {
  const item = {
    id: generateId('doc'),
    projectId: body.projectId,
    category: body.category,
    title: (body.title || '').trim(),
    description: (body.description || '').trim(),
    linkUrl: (body.linkUrl || '').trim(),
    source: body.source || 'manual',
    dateAdded: new Date().toISOString(),
    datePublished: body.datePublished
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
