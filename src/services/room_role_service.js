import model from '../models/room_role.js';
import dto from '../dtos/room_role.js';
import BaseTypeService from './base_type_service.js';

/**
 * @const service
 * @description The room role service.
 */
const service = new BaseTypeService(model, dto);

export default service;
