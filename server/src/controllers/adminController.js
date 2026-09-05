import { adminUserSchema, adminUserUpdateSchema } from '../validators/admin.js';
import * as adminService from '../services/adminService.js';

const validationError = error => error?.issues?.[0]?.message || 'Invalid request.';

export async function dashboard(_request, response) {
  response.json({ success: true, data: await adminService.getDashboard() });
}

export async function users(request, response) {
  response.json({ success: true, data: await adminService.listUsers(request.query) });
}

export async function createUser(request, response) {
  const parsed = adminUserSchema.safeParse(request.body);
  if (!parsed.success) return response.status(400).json({ success: false, message: validationError(parsed.error) });
  try {
    const user = await adminService.createUser(parsed.data);
    response.status(201).json({ success: true, message: 'User created successfully.', data: user });
  } catch (error) {
    if (error.code === 'P2002') return response.status(409).json({ success: false, message: error.meta?.target?.includes('email') ? 'Email already exists.' : 'Login ID already exists.' });
    throw error;
  }
}

export async function updateUser(request, response) {
  const parsed = adminUserUpdateSchema.safeParse(request.body);
  if (!parsed.success) return response.status(400).json({ success: false, message: validationError(parsed.error) });
  try {
    const user = await adminService.updateUser(request.params.id, parsed.data);
    response.json({ success: true, message: 'User updated successfully.', data: user });
  } catch (error) {
    if (error.code === 'P2002') return response.status(409).json({ success: false, message: error.meta?.target?.includes('email') ? 'Email already exists.' : 'Login ID already exists.' });
    throw error;
  }
}

export async function archiveUser(request, response) {
  if (request.params.id === request.user.id) return response.status(400).json({ success: false, message: 'You cannot deactivate your own account.' });
  await adminService.deleteUser(request.params.id);
  response.json({ success: true, message: 'User deactivated.' });
}
