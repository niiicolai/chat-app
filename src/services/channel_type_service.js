import model from '../models/channel_type.js';
import dto from '../dtos/channel_type.js';
import BaseTypeService from './base_type_service.js';

const service = new BaseTypeService(model, dto);

export default service;
