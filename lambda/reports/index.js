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
    if (!item) return error('Report not found', 404);
    return success(item);
  }

  let items;
  if (queryParams?.projectId) {
    items = await queryByIndex(TABLE_NAME, 'projectId-index', 'projectId', queryParams.projectId);
  } else {
    items = await scan(TABLE_NAME);
  }

  if (queryParams?.unassigned === 'true') {
    items = items.filter(item => !item.projectId);
  }

  if (queryParams?.activeOnly === 'true') {
    items = items.filter(item => item.isActive === true);
  }

  items.sort((a, b) => (b.datePublished || '').localeCompare(a.datePublished || ''));
  return success(items);
}

async function handlePost(body) {
  const item = {
    id: generateId('rpt'),
    title: (body.title || '').trim(),
    datePublished: body.datePublished,
    description: (body.description || '').trim(),
    linkUrl: (body.linkUrl || '').trim(),
    isActive: body.isActive !== false,
    divisionId: body.divisionId,
    projectId: body.projectId,
    category: body.category || 'recurring'
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
